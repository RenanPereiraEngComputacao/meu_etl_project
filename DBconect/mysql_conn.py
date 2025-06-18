import mysql.connector
from dotenv import load_dotenv
import os

load_dotenv()

def get_mysql_connection():
    try:
        conn = mysql.connector.connect(
            host=os.getenv("MYSQL_HOST"),
            port=os.getenv("MYSQL_PORT"),
            user=os.getenv("MYSQL_USER"),
            password=os.getenv("MYSQL_PASSWORD"),
            database=os.getenv("MYSQL_DATABASE")
        )
        print("✅ Conexão estabelecida com sucesso MySQL.")
        return conn
    except Exception as e:
        print(f"Erro na conexão com MySQL: {e}")
        raise
