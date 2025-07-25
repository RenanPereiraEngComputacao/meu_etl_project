import time
import subprocess
from datetime import datetime

def esperar_proximo_horario():
    while True:
        agora = datetime.now()
        if agora.minute % 10 == 8:  # 08, 18, 28, 38, 48, 58
            return
        time.sleep(10)

def executar_script():
    print(f"Executando att_estoque.py às {datetime.now().strftime('%H:%M:%S')}")
    subprocess.run(["python", "c:/meu_etl_project/att_estoque.py"])

if __name__ == "__main__":
    while True:
        esperar_proximo_horario()
        executar_script()
        # Espera 60 segundos para evitar rodar duas vezes no mesmo minuto
        time.sleep(60)