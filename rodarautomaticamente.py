import time
import subprocess
from datetime import datetime
from dotenv import load_dotenv
import os
from DBconect.postgres_conn import get_postgres_connection
from DBconect.postgres_conn import get_postgres_connection2
import contextlib

load_dotenv()

print("Iniciando o script rodarautomaticamente.py...")

def tem_pedidos_nao_sincronizados_malagah():
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
    
def tem_pedidos_nao_sincronizados_itsmy():
    try:
        conn = get_postgres_connection2()
        with contextlib.closing(conn.cursor()) as cursor:
            cursor.execute("SELECT 1 FROM orders WHERE statussincronismo = false LIMIT 1")
            resultado = cursor.fetchone()
        conn.close()
        return resultado is not None
    except Exception as e:
        print(f"[{datetime.now().strftime('%H:%M:%S')}] Erro ao verificar pedidos não sincronizados: {e}")
        return False


def executar_script_pedido():
    try:
        if tem_pedidos_nao_sincronizados_malagah():
            print(f"[{datetime.now().strftime('%H:%M:%S')}] Iniciando execução de sync_order.py")
            subprocess.run(["python", "c:/meu_etl_project/sync_order.py"], check=False)
            print(f"[{datetime.now().strftime('%H:%M:%S')}] Finalizou execução de sync_order.py\n")
        else:
            print(f"[{datetime.now().strftime('%H:%M:%S')}] Nenhum pedido pendente. Ignorando sync_order.py.")
    except Exception as e:
        print(f"[{datetime.now().strftime('%H:%M:%S')}] Erro ao executar sync_order.py: {e}")

def executar_script_pedido_secundario():
    try:
        if tem_pedidos_nao_sincronizados_itsmy():
            print(f"[{datetime.now().strftime('%H:%M:%S')}] Iniciando execução de sync_order_secundaria.py")
            subprocess.run(["python", "c:/meu_etl_project/sync_order_secundaria.py"], check=False)
            print(f"[{datetime.now().strftime('%H:%M:%S')}] Finalizou execução de sync_order_secundaria.py\n")
        else:
            print(f"[{datetime.now().strftime('%H:%M:%S')}] Nenhum pedido pendente. Ignorando sync_order_secundaria.py.")
    except Exception as e:
        print(f"[{datetime.now().strftime('%H:%M:%S')}] Erro ao executar sync_order_secundaria.py: {e}")

def executar_script_attestoquemalagah():
    try:
        print(f"[{datetime.now().strftime('%H:%M:%S')}] Iniciando execução de att_estoque.py")
        subprocess.run(["python", "c:/meu_etl_project/att_estoque.py"], check=False)
        print(f"[{datetime.now().strftime('%H:%M:%S')}] Finalizou execução de att_estoque.py\n")
    except Exception as e:
        print(f"[{datetime.now().strftime('%H:%M:%S')}] Erro ao executar att_estoque.py: {e}")

def executar_script_attestoqueitsmy():
    try:
        print(f"[{datetime.now().strftime('%H:%M:%S')}] Iniciando execução de att_estoque_secundario.py")
        subprocess.run(["python", "c:/meu_etl_project/att_estoque_secundario.py"], check=False)
        print(f"[{datetime.now().strftime('%H:%M:%S')}] Finalizou execução de att_estoque_secundario.py\n")
    except Exception as e:
        print(f"[{datetime.now().strftime('%H:%M:%S')}] Erro ao executar att_estoque_secundario.py: {e}")


def preenche_email_telefone():
    try:
        print(f"[{datetime.now().strftime('%H:%M:%S')}] Iniciando execução do preencheemailtelefone.py")
        subprocess.run(["python", "c:/meu_etl_project/preencheemailtelefone.py"], check=False)
        print(f"[{datetime.now().strftime('%H:%M:%S')}] Finalizou execução do preencheemailtelefone.py\n")
    except Exception as e:
        print(f"[{datetime.now().strftime('%H:%M:%S')}] Erro ao executar preencheemailtelefone.py: {e}")

def bling_sync_docs():
    try:
        print(f"[{datetime.now().strftime('%H:%M:%S')}] Iniciando execução do bling_sync_docs.py")
        subprocess.run(["python", "c:/meu_etl_project/bling_sync_docs.py"], check=False)
        print(f"[{datetime.now().strftime('%H:%M:%S')}] Finalizou execução do bling_sync_docs.py\n")
    except Exception as e:
        print(f"[{datetime.now().strftime('%H:%M:%S')}] Erro ao executar bling_sync_docs.py: {e}")

def bling_sync_docs_secundario():
    try:
        print(f"[{datetime.now().strftime('%H:%M:%S')}] Iniciando execução do bling_sync_docs_secundario.py")
        subprocess.run(["python", "c:/meu_etl_project/bling_sync_docs_secundario.py"], check=False)
        print(f"[{datetime.now().strftime('%H:%M:%S')}] Finalizou execução do bling_sync_docs_secundario.py\n")
    except Exception as e:
        print(f"[{datetime.now().strftime('%H:%M:%S')}] Erro ao executar bling_sync_docs_secundario.py: {e}")

def executar_script_atualizar_invoices():
    try:
        print(f"[{datetime.now().strftime('%H:%M:%S')}] Iniciando execução de sync_order_invoices.py")
        subprocess.run(["python", "c:/meu_etl_project/sync_order_invoices.py"], check=False)
        print(f"[{datetime.now().strftime('%H:%M:%S')}] Finalizou execução de sync_order_invoices.py\n")
    except Exception as e:
        print(f"[{datetime.now().strftime('%H:%M:%S')}] Erro ao executar sync_order_invoices.py: {e}")

def executar_script_atualizar_invoices_secundario():
    try:
        print(f"[{datetime.now().strftime('%H:%M:%S')}] Iniciando execução de sync_order_invoices_secundario.py")
        subprocess.run(["python", "c:/meu_etl_project/sync_order_invoices_secundario.py"], check=False)
        print(f"[{datetime.now().strftime('%H:%M:%S')}] Finalizou execução de sync_order_invoices_secundario.py\n")
    except Exception as e:
        print(f"[{datetime.now().strftime('%H:%M:%S')}] Erro ao executar sync_order_invoices_secundario.py: {e}")

def executar_script_pedido_shopee():
    try:
            print(f"[{datetime.now().strftime('%H:%M:%S')}] Iniciando execução de sync_order_shopee.py")
            subprocess.run(["python", "c:/meu_etl_project/sync_order_shopee.py"], check=False)
            print(f"[{datetime.now().strftime('%H:%M:%S')}] Finalizou execução de sync_order_shopee.py\n")
    except Exception as e:
        print(f"[{datetime.now().strftime('%H:%M:%S')}] Erro ao executar sync_order_shopee.py: {e}")

def executar_script_pedido_shopee_secundario():
    try:
            print(f"[{datetime.now().strftime('%H:%M:%S')}] Iniciando execução de sync_order_shopee_secundario.py")
            subprocess.run(["python", "c:/meu_etl_project/sync_order_shopee_secundario.py"], check=False)
            print(f"[{datetime.now().strftime('%H:%M:%S')}] Finalizou execução de sync_order_shopee_secundario.py\n")
    except Exception as e:
        print(f"[{datetime.now().strftime('%H:%M:%S')}] Erro ao executar sync_order_shopee_secundario.py: {e}")


executado_pedido_minuto = None
executado_estoque_minuto = None

if __name__ == "__main__":
    while True:
        try:
            agora = datetime.now()
            minuto = agora.minute

            if minuto % 10 == 0 and executado_pedido_minuto != minuto:
                executar_script_pedido_shopee()
                executar_script_pedido_shopee_secundario()
                executar_script_pedido()
                executar_script_pedido_secundario()
                time.sleep(2)  
                preenche_email_telefone()
                bling_sync_docs()
                bling_sync_docs_secundario()
                executar_script_atualizar_invoices()
                executar_script_atualizar_invoices_secundario()
                executado_pedido_minuto = minuto

            if minuto % 10 == 5 and executado_pedido_minuto != minuto:
                executar_script_pedido_shopee()
                executar_script_pedido_shopee_secundario()
                executar_script_pedido()
                executar_script_pedido_secundario()
                time.sleep(2)  
                preenche_email_telefone()
                executado_pedido_minuto = minuto

            if minuto % 10 == 9 and executado_estoque_minuto != minuto:
                executar_script_attestoquemalagah()
                executar_script_attestoqueitsmy()
                
                executado_estoque_minuto = minuto

            print(f"[{agora.strftime('%H:%M:%S')}] Aguardando próximo ciclo...")
            time.sleep(10)

        except Exception as e:
            print(f"[{datetime.now().strftime('%H:%M:%S')}] Erro inesperado no loop principal: {e}")
            # continua rodando mesmo assim
            time.sleep(5)
    