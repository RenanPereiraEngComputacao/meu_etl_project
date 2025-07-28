import time
import subprocess
from datetime import datetime

print("Iniciando o script rodarautomaticamente.py...")

def executar_script_pedido():
    print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] Iniciando execução de sync_order.py")
    subprocess.run(["python", "c:/meu_etl_project/sync_order.py"])
    print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] Finalizou execução de sync_order.py\n")

def executar_script():
    print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] Iniciando execução de att_estoque.py")
    subprocess.run(["python", "c:/meu_etl_project/att_estoque.py"])
    print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] Finalizou execução de att_estoque.py\n")

executado_pedido_minuto = None
executado_estoque_minuto = None

if __name__ == "__main__":
    while True:
        agora = datetime.now()
        minuto = agora.minute

        if minuto % 10 == 8 and executado_pedido_minuto != minuto:
            executar_script_pedido()
            executado_pedido_minuto = minuto

        if minuto % 10 == 9 and executado_estoque_minuto != minuto:
            executar_script()
            executado_estoque_minuto = minuto

        print(f"[{agora.strftime('%H:%M:%S')}] Aguardando próximo ciclo...")
        time.sleep(10)
