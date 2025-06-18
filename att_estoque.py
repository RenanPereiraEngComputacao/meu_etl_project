from DBconect.mysql_conn import get_mysql_connection
from DBconect.postgres_conn import get_postgres_connection
from DBQueryes import mysql_queries
from DBtratament.process_data_estoque import process_data, insert_into_postgres

def fetch_data(query, conn):
    cursor = conn.cursor(dictionary=True)
    cursor.execute(query)
    result = cursor.fetchall()
    cursor.close()
    return result

def main():
    mysql_conn = get_mysql_connection()
    pg_conn = get_postgres_connection()
    print("✅ Conexões estabelecidas com sucesso. Iniciando consulta no banco...")
    saldos = fetch_data(mysql_queries.get_estoque_saldo_query(), mysql_conn)
    reservas = fetch_data(mysql_queries.get_reserva_query(), mysql_conn)
    referencias = fetch_data(mysql_queries.get_referencias_query(), mysql_conn)
    cores = fetch_data(mysql_queries.get_cores_query(), mysql_conn)
    tamanhos = fetch_data(mysql_queries.get_tamanhos_query(), mysql_conn)
    print("✅ Dados obtidos com sucesso do MySQL. Fechando conexão...")
    mysql_conn.close()
    print("✅ Conexão MySQL fechada. Iniciando processamento dos dados...")
    resultado_final = process_data(saldos, reservas, referencias, cores, tamanhos)
    print("✅ Dados processados com sucesso. Inserindo no PostgreSQL...")
    insert_into_postgres(resultado_final, pg_conn)

    pg_conn.close()
    print("✅ Conexão PostgreSQL fechada.")
    print("✅ ETL finalizado com sucesso.")

if __name__ == "__main__":
    main()
