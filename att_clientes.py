from DBconect.mysql_conn import get_mysql_connection3
from DBconect.postgres_conn import get_postgres_connection
from DBQueryes import mysql_queries
from DBtratament.process_data_clientes import process_clientes_b2b, insert_into_postgres_clientes

def fetch_data(query, conn):
    cursor = conn.cursor(dictionary=True)
    cursor.execute(query)
    results = cursor.fetchall()
    cursor.close()
    return results

def main():
    mysql_conn = None
    pg_conn = None
    try:
        mysql_conn = get_mysql_connection3()
        pg_conn = get_postgres_connection()
        print("Conexões estabelecidas. Buscando dados...")

        data_mysql = fetch_data(mysql_queries.get_clientes_b2b_query(), mysql_conn)
        data_processado = process_clientes_b2b(data_mysql)

        insert_into_postgres_clientes(data_processado, pg_conn)

    except Exception as e:
        print(f"Erro geral no pipeline: {e}")
    finally:
        if mysql_conn:
            mysql_conn.close()
        if pg_conn:
            pg_conn.close()
        print("Conexões fechadas.")

if __name__ == "__main__":
    main()
