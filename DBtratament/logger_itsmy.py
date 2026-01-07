# logger.py
from DBconect.postgres_conn import get_postgres_connection2
from datetime import datetime

def registrar_log(script_name, output):
    try:
        conn = get_postgres_connection2()
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO execution_logs (script_name, output, created_at)
            VALUES (%s, %s, NOW())
            """,
            (script_name, output)
        )
        conn.commit()
    except Exception as e:
        print(f"Erro ao registrar log: {e}")
    finally:
        try:
            conn.close()
        except:
            pass
