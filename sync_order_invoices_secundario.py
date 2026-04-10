import requests
import psycopg2.extras
from dotenv import load_dotenv
import os
import sys
import io
import contextlib

from DBconect.postgres_conn import get_postgres_connection2
from DBtratament.logger_itsmy import registrar_log

# ================================
# CONFIG INICIAL
# ================================
load_dotenv()

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")

ERP_API_BASE_URL = "https://api.ctextil.com.br"
ERP_API_TOKEN = os.getenv("ERP_API_TOKEN")


# ================================
# HELPERS
# ================================
def fetch_data(query, conn, params=None):
    cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    cursor.execute(query, params if params else ())
    result = cursor.fetchall()
    cursor.close()
    return result


# ================================
# CONSULTA INVOICE NO ERP
# ================================
def consultar_invoices(order_id_erp, page=1, status="4"):
    try:
        response = requests.get(
            url=f"{ERP_API_BASE_URL}/api/v1/orders/{order_id_erp}/invoices",
            params={"page": page, "status": status},
            headers={"Authorization": f"Bearer {ERP_API_TOKEN}"},
            timeout=60
        )

        if response.status_code != 200:
            print(f"Erro ao consultar invoices ERP ({order_id_erp}): {response.status_code} - {response.text}")
            return None

        return response.json()

    except Exception as e:
        print(f"Erro ao chamar API invoices ({order_id_erp}): {e}")
        return None


# ================================
# PROCESSAMENTO PRINCIPAL
# ================================
def main():
    try:
        conn = get_postgres_connection2()

        # ⚠️ Ajuste o WHERE se quiser filtrar melhor
        pedidos = fetch_data("""
            SELECT idpedido, idpedido_erp
            FROM orders
            WHERE idpedido_erp IS NOT NULL
              AND (numeronota_ctextil IS NULL OR numeronota_ctextil = '');
        """, conn)

        if not pedidos:
            print("Nenhum pedido para atualizar invoices.")
            return

        for pedido in pedidos:
            idpedido = pedido["idpedido"]
            idpedido_erp = pedido["idpedido_erp"]

            print(f"Consultando invoice do pedido ERP: {idpedido_erp}")

            payload = consultar_invoices(idpedido_erp, page=1, status="4")
            if not payload:
                continue

            data = payload.get("data", [])
            if not data:
                print(f"Nenhuma invoice encontrada para ERP {idpedido_erp}")
                continue

            # pega a primeira invoice
            invoice = data[0]

            numeronota = invoice.get("number")
            emissao = invoice.get("Authorized")

            if not numeronota or not emissao:
                print(f"Invoice sem number/Authorized para ERP {idpedido_erp}")
                continue

            try:
                with conn.cursor() as cursor:
                    cursor.execute("""
                        UPDATE orders
                           SET numeronota_ctextil = %s,
                               emissao_nota_ctextil = %s
                         WHERE idpedido = %s;
                    """, (str(numeronota), str(emissao), idpedido))

                conn.commit()

                print(f"Pedido {idpedido} atualizado -> Nota {numeronota} ({emissao})")

            except Exception as e:
                conn.rollback()
                print(f"Erro ao atualizar pedido {idpedido}: {e}")

    except Exception as e:
        print(f"Erro geral no sync invoices: {e}")

    finally:
        try:
            conn.close() # type: ignore
        except:
            pass
        print("Conexão encerrada.")


# ================================
# LOG PADRONIZADO
# ================================
if __name__ == "__main__":
    buffer = io.StringIO()
    
    with contextlib.redirect_stdout(buffer):
        main()

    registrar_log("sync_order_invoices_secundario.py", buffer.getvalue())
    