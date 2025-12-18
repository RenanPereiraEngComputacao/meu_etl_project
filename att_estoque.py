import sys
import io
import contextlib

from DBconect.mysql_conn import get_mysql_connection, get_mysql_connection3
from DBconect.postgres_conn import get_postgres_connection
from DBQueryes import mysql_queries
from DBtratament.process_data_estoque import process_data_estoque, insert_into_postgres_estoque
from DBtratament.logger import registrar_log

#org = sys.argv[sys.argv.index("--org") + 1]

def fetch_data(query, conn):
    cursor = conn.cursor(dictionary=True)
    cursor.execute(query)
    result = cursor.fetchall()
    cursor.close()
    return result

def main():
    try:
        mysql_conn = get_mysql_connection()
        mysql_conn_view = get_mysql_connection3()
        pg_conn = get_postgres_connection()
        print("Conexões estabelecidas com sucesso.")

        print("Buscando dados de estoque...")
        saldos = fetch_data(mysql_queries.get_estoque_saldo_query(), mysql_conn)
        reservas = fetch_data(mysql_queries.get_reserva_query(), mysql_conn)
        referencias = fetch_data(mysql_queries.get_referencias_query(), mysql_conn)
        cores = fetch_data(mysql_queries.get_cores_query(), mysql_conn)
        tamanhos = fetch_data(mysql_queries.get_tamanhos_query(), mysql_conn)
        barcodes = fetch_data(mysql_queries.get_codebar(), mysql_conn)

        print("Buscando preços...")
        precos = fetch_data(mysql_queries.get_precos_query(), mysql_conn_view)

        resultado_final = process_data_estoque(
            saldos,
            reservas,
            referencias,
            cores,
            tamanhos,
            barcodes,
            precos
        )

        print("Dados processados. Inserindo no PostgreSQL...")
        insert_into_postgres_estoque(resultado_final, pg_conn)
        print("Dados de estoque inseridos com sucesso no PostgreSQL. Finalizando processo.")

    except Exception as e:
        print(f"Erro geral no pipeline: {e}")
    finally:
        for c in (mysql_conn, mysql_conn_view, pg_conn):
            try:
                c.close()
            except:
                pass
        print("Todas conexões encerradas.")

if __name__ == "__main__":
    buffer = io.StringIO()
    with contextlib.redirect_stdout(buffer):
        main()

    registrar_log("att_estoque.py", buffer.getvalue())
