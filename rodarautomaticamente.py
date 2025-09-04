import time
import subprocess
from datetime import datetime
from dotenv import load_dotenv
import os
from DBconect.postgres_conn import get_postgres_connection
import contextlib

load_dotenv()

print("Iniciando o script rodarautomaticamente.py...")

def tem_pedidos_nao_sincronizados():
    try:
        conn = get_postgres_connection()
        with contextlib.closing(conn.cursor()) as cursor:
            cursor.execute("SELECT 1 FROM orders WHERE statussincronismo = false LIMIT 1")
            resultado = cursor.fetchone()
        conn.close()
        return resultado is not None
    except Exception as e:
        print(f"[{datetime.now().strftime('%H:%M:%S')}] Erro ao verificar pedidos não sincronizados: {e}")
        return False
    
def tem_pedidos_nao_liberados():
    try:
        conn = get_postgres_connection()
        with contextlib.closing(conn.cursor()) as cursor:
            cursor.execute("SELECT 1 FROM orders WHERE liberado = false LIMIT 1")
            resultado = cursor.fetchone()
        conn.close()
        return resultado is not None
    except Exception as e:
        print(f"[{datetime.now().strftime('%H:%M:%S')}] Erro ao verificar pedidos não liberados: {e}")
        return False

def executar_script_pedido():
    try:
        if tem_pedidos_nao_sincronizados():
            print(f"[{datetime.now().strftime('%H:%M:%S')}] Iniciando execução de sync_order.py")
            subprocess.run(["python", "c:/meu_etl_project/sync_order.py"], check=False)
            print(f"[{datetime.now().strftime('%H:%M:%S')}] Finalizou execução de sync_order.py\n")
        else:
            print(f"[{datetime.now().strftime('%H:%M:%S')}] Nenhum pedido pendente. Ignorando sync_order.py.")
    except Exception as e:
        print(f"[{datetime.now().strftime('%H:%M:%S')}] Erro ao executar sync_order.py: {e}")

def executar_script():
    try:
        print(f"[{datetime.now().strftime('%H:%M:%S')}] Iniciando execução de att_estoque.py")
        subprocess.run(["python", "c:/meu_etl_project/att_estoque.py"], check=False)
        print(f"[{datetime.now().strftime('%H:%M:%S')}] Finalizou execução de att_estoque.py\n")
    except Exception as e:
        print(f"[{datetime.now().strftime('%H:%M:%S')}] Erro ao executar att_estoque.py: {e}")

def libera_pedido():
    try:
        if tem_pedidos_nao_liberados():
             print(f"[{datetime.now().strftime('%H:%M:%S')}] Iniciando execução do libera_pedido.py")
             subprocess.run(["python", "c:/meu_etl_project/libera_pedido.py"], check=False)
             print(f"[{datetime.now().strftime('%H:%M:%S')}] Finalizou execução do libera_pedido.py\n")
        else:
            print(f"[{datetime.now().strftime('%H:%M:%S')}] Nenhum pedido pendente. Ignorando libera_pedido.py.")
    except Exception as e:
        print(f"[{datetime.now().strftime('%H:%M:%S')}] Erro ao executar libera_pedido.py: {e}")


executado_pedido_minuto = None
executado_estoque_minuto = None

if __name__ == "__main__":
    while True:
        try:
            agora = datetime.now()
            minuto = agora.minute

            if minuto % 10 == 0 and executado_pedido_minuto != minuto:
                executar_script_pedido()
                time.sleep(2)  
                libera_pedido()
                executado_pedido_minuto = minuto

            if minuto % 10 == 5 and executado_pedido_minuto != minuto:
                executar_script_pedido()
                time.sleep(2)  
                libera_pedido()
                executado_pedido_minuto = minuto

            if minuto % 10 == 9 and executado_estoque_minuto != minuto:
                executar_script()
                executado_estoque_minuto = minuto

            print(f"[{agora.strftime('%H:%M:%S')}] Aguardando próximo ciclo...")
            time.sleep(10)

        except Exception as e:
            print(f"[{datetime.now().strftime('%H:%M:%S')}] Erro inesperado no loop principal: {e}")
            # continua rodando mesmo assim
            time.sleep(5)
    