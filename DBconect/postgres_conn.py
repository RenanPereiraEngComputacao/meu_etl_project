from dotenv import load_dotenv
import os
import psycopg2

load_dotenv()

def get_postgres_connection():
    try:
        conn = psycopg2.connect(
            host=os.getenv("PG_HOST"),
            port=os.getenv("PG_PORT"),
            user=os.getenv("PG_USER"),
            password=os.getenv("PG_PASSWORD"),
            dbname=os.getenv("PG_DATABASE")
        )
        print("✅ Conexão estabelecida com sucesso Postgres.")
        return conn
    except Exception as e:
        print(f"Erro na conexão com PostgreSQL: {e}")
        raise
