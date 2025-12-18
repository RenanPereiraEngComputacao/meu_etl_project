import requests
import psycopg2.extras
from dotenv import load_dotenv
import os
from DBconect.postgres_conn import get_postgres_connection
from DBQueryes import postgres_queries
from DBtratament.process_data_order import montar_json_pedido, atualizar_barcodes_faltantes
from DBtratament.logger import registrar_log

import contextlib   

load_dotenv()

import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")

#org = sys.argv[sys.argv.index("--org") + 1]

def fetch_data(query, conn, params=None):
    cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    cursor.execute(query, params if params else ())
    result = cursor.fetchall()
    cursor.close()
    return result

def main():
    try:
        conn = get_postgres_connection()
        pedidos = fetch_data(postgres_queries.get_pedidos_nao_sincronizados(), conn)

        if not pedidos:
            print("Nenhum pedido pendente de sincronização.")
            return

        for pedido in pedidos:
            itens = fetch_data(postgres_queries.get_itens_por_pedido(), conn, (pedido["idpedido"],))

            if not itens:
                print(f"Pedido {pedido['numeropedido']} ignorado: nenhum item encontrado.")
                continue

            atualizar_barcodes_faltantes(itens, conn)

            json_payload = montar_json_pedido(pedido, itens)

            response = requests.post(
                url=os.getenv("ERP_API_URL"),
                json=json_payload,
                headers={"Authorization": f"Bearer {os.getenv('ERP_API_TOKEN')}"}
            )

            if response.status_code == 200:
                resposta = response.json()

                numero_erp = None
                try:
                    numero_erp = int(resposta["data"][0]["number"])
                except (KeyError, IndexError, TypeError, ValueError):
                    print(f"Atenção: não foi possível extrair o número ERP do pedido {pedido['numeropedido']}")

                with conn.cursor() as cursor:
                    cursor.execute(
                        "UPDATE orders SET statussincronismo = TRUE, statusped = 'Pedido Recebido', pedidosty = %s WHERE idpedido = %s;",
                        (numero_erp, pedido["idpedido"])
                    )
                conn.commit()
                print(f"Pedido {pedido['numeropedido']} sincronizado com sucesso. Número ERP: {numero_erp}")
            else:
                
                try:
                    consulta = requests.get(
                        url="https://api.ctextil.com.br/api/v1/orders",
                        params={
                            "page": 1,
                            "full_return": "true",
                            "status": 2,
                            "customer": 47070914000192,  # ou fixe se for sempre o mesmo
                            "presence_indicator": 0
                        },
                        headers={"Authorization": f"Bearer {os.getenv('ERP_API_TOKEN')}"}
                    )

                    if consulta.status_code == 200:
                        dados = consulta.json().get("data", [])
                        encontrado = False
                        for ped in dados:
                            note = ped.get("note", "")
                            if f"PED-{pedido['numeropedido']}" in note:
                                numero_erp = ped.get("number")
                                with conn.cursor() as cursor:
                                    cursor.execute(
                                        "UPDATE orders SET statussincronismo = TRUE, statusped = 'Pedido Recebido', pedidosty = %s WHERE idpedido = %s;",
                                        (numero_erp, pedido["idpedido"])
                                    )
                                conn.commit()
                                print(f"Pedido {pedido['numeropedido']} confirmado via consulta. Número ERP: {numero_erp}")
                                encontrado = True
                                break

                        if not encontrado:
                            print(f"Pedido {pedido['numeropedido']} não encontrado no ERP após erro {response.status_code}.")
                    else:
                        print(f"Erro ao consultar ERP para confirmar pedido {pedido['numeropedido']}: {consulta.text}")

                except Exception as e:
                    print(f"Erro ao tentar confirmar pedido {pedido['numeropedido']} no ERP: {e}")

    except Exception as e:
        print(f"Erro durante sincronização: {e}")
    finally:
        try:
            conn.close()
        except:
            pass
        print("Conexão encerrada.")


if __name__ == "__main__":
    buffer = io.StringIO()
    with contextlib.redirect_stdout(buffer):
        main()

    registrar_log("sync_order.py", buffer.getvalue())
