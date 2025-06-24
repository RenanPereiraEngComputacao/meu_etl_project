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
        print(f"✅ Conexão estabelecida com sucesso MySQL: {os.getenv('MYSQL_DATABASE')}")
        return conn
    except Exception as e:
        print(f"Erro na conexão com MySQL: {e}")
        raise

def get_mysql_connection2():
    try:
        conn2 = mysql.connector.connect(
            host=os.getenv("MYSQL_HOST"),
            port=os.getenv("MYSQL_PORT"),
            user=os.getenv("MYSQL_USER"),
            password=os.getenv("MYSQL_PASSWORD"),
            database=os.getenv("MYSQL_DATABASE2")
        )
        print(f"✅ Conexão estabelecida com sucesso MySQL: {os.getenv('MYSQL_DATABASE2')}")
        return conn2
    except Exception as e:
        print(f"Erro na conexão com MySQL: {e}")
        raise