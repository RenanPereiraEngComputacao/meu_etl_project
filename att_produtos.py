from DBconect.mysql_conn import get_mysql_connection3
from DBconect.postgres_conn import get_postgres_connection
from DBQueryes import mysql_queries  
from DBtratament.process_data_produto import insert_into_postgres_produto

def fetch_data(query, conn):
    cursor = conn.cursor(dictionary=True)
    cursor.execute(query)
    results = cursor.fetchall()
    cursor.close()
    return results

def main():
    try:
        mysql_conn = get_mysql_connection3()
        pg_conn = get_postgres_connection()
        print(" Conexões estabelecidas com sucesso! Iniciando consulta de produtos...")

        produtos = fetch_data(mysql_queries.get_produtos_query(), mysql_conn)
        print(" Produtos consultados no MySQL. Iniciando inserção no Postgres...")

        insert_into_postgres_produto(produtos, pg_conn)
        print(" Produtos inseridos no Postgres com sucesso!!")

    except Exception as e:
        print(f"Erro no pipeline de produtos: {e}")
    finally:
        try: mysql_conn.close()
        except: pass
        try: pg_conn.close()
        except: pass
        print(" Conexões fechadas. Processo finalizado.")

if __name__ == "__main__":
    main()