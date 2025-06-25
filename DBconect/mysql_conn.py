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
        print(f"✅ Conexão estabelecida com sucesso MySQL dbind: {os.getenv('MYSQL_DATABASE')}")
        return conn
    except Exception as e:
        print(f"Erro na conexão com MySQL dbind: {e}")
        raise

#def get_mysql_connection2():
    try:
        conn2 = mysql.connector.connect(
            host=os.getenv("MYSQL_HOST"),
            port=os.getenv("MYSQL_PORT"),
            user=os.getenv("MYSQL_USER"),
            password=os.getenv("MYSQL_PASSWORD"),
            database=os.getenv("MYSQL_DATABASE2")
        )
        print(f"✅ Conexão estabelecida com sucesso MySQL dbadm: {os.getenv('MYSQL_DATABASE2')}")
        return conn2
    except Exception as e:
        print(f"Erro na conexão com MySQL dbadm: {e}")
        raise

def get_mysql_connection3():
    try:
        conn3 = mysql.connector.connect(
            host=os.getenv("MYSQL_HOST_VIEW"),
            port=os.getenv("MYSQL_PORT_VIEW"),
            user=os.getenv("MYSQL_USER_VIEW"),
            password=os.getenv("MYSQL_PASSWORD_VIEW"),
            database=os.getenv("MYSQL_DATABASE_VIEW")
        )
        print(f"✅ Conexão estabelecida com sucesso MySQL View: {os.getenv('MYSQL_DATABASE_VIEW')}")
        return conn3
    except Exception as e:
        print(f"Erro na conexão com MySQL View: {e}")
        raise