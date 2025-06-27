import requests
import psycopg2.extras
from dotenv import load_dotenv
import os
from DBconect.postgres_conn import get_postgres_connection
from DBQueryes import postgres_queries
from DBtratament.process_data_order import montar_json_pedido

load_dotenv()

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
                print(f" Pedido {pedido['numeropedido']} ignorado: nenhum item encontrado.")
                continue

            json_payload = montar_json_pedido(pedido, itens)

            # Print do JSON para conferência
            #print(f"\n JSON do Pedido {pedido['numeropedido']}:")
            #print(json_payload)

            response = requests.post(
                url=os.getenv("ERP_API_URL"),
                json=json_payload,
                headers={"Authorization": f"Bearer {os.getenv('ERP_API_TOKEN')}"}
            )

            if response.status_code == 200:
                with conn.cursor() as cursor:
                    cursor.execute(
                        "UPDATE orders SET statussincronismo = TRUE WHERE idpedido = %s;",
                        (pedido["idpedido"],)
                    )
                conn.commit()
                print(f"Pedido {pedido['numeropedido']} sincronizado com sucesso.")
            else:
                print(f"Falha ao sincronizar pedido {pedido['numeropedido']}: {response.text}")

    except Exception as e:
        print(f"Erro durante sincronização: {e}")
    finally:
        try:
            conn.close()
        except:
            pass
        print("Conexão encerrada.")

if __name__ == "__main__":
    main()
