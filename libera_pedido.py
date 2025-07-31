import time
import pyautogui
from datetime import datetime
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import psycopg2
from DBconect.postgres_conn import get_postgres_connection

# =====================================
# CONFIGURAÇÕES DO SELENIUM
# =====================================
service = Service('C:\\sincroniza_BDP\\chromedriver-win64\\chromedriver.exe')

chrome_options = Options()
chrome_options.add_experimental_option("prefs", {
    "download.prompt_for_download": True,
    "download.directory_upgrade": True,
    "safebrowsing.enabled": True,
    "safebrowsing.disable_download_protection": True
})

# =====================================
# VARIÁVEIS DO SISTEMA
# =====================================
url = 'http://192.168.0.5/'
home = 'siimensis01.php'
usuario = 'liberar.pedido'
senha = '15735924'

# =====================================
# FUNÇÕES DE BANCO DE DADOS
# =====================================
def buscar_pedidos_nao_liberados():
    conn = get_postgres_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT idpedido, pedidosty
        FROM orders
        WHERE liberado = 'false'
    """)
    pedidos = cursor.fetchall()
    conn.close()
    return pedidos

def marcar_como_liberado(idpedido):
    conn = get_postgres_connection()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE orders
        SET liberado = true
        WHERE idpedido = %s
    """, (idpedido,))
    conn.commit()
    conn.close()

# =====================================
# FUNÇÕES DE NAVEGAÇÃO
# =====================================
def abreWeb(navegator):
    navegator.get(url)
    navegator.find_element('xpath', '//*[@id="usuario"]').send_keys(usuario)
    navegator.find_element('xpath', '//*[@id="senha"]').send_keys(senha)
    navegator.find_element('xpath', '//*[@id="btnOK"]').click()

    time.sleep(3)
    pyautogui.hotkey('enter')

    def find_window(url_str: str):
        janelas = navegator.window_handles
        for window in janelas:
            navegator.switch_to.window(window)
            if url_str in navegator.current_url:
                break
    find_window(home)

def confirmarestricao(pedido):
    print(f"[INFO] Confirmando restrição para pedido {pedido}")
    pyautogui.PAUSE = 0.2
    pyautogui.FAILSAFE = True

    # Abre menu de restrição
    pyautogui.click(100, 200)  # Coordenada fictícia, ajuste se necessário
    time.sleep(2)

    # Insere número do pedido
    pyautogui.typewrite(str(pedido))
    pyautogui.hotkey('enter')
    time.sleep(1)

    # Vários tabs até chegar na opção desejada
    for _ in range(20):
        pyautogui.hotkey('tab')
    pyautogui.hotkey('enter')

    # Aguarda processar
    time.sleep(5)

def liberaanalisecredito(pedido):
    print(f"[INFO] Liberando análise de crédito para pedido {pedido}")
    pyautogui.PAUSE = 0.2
    pyautogui.FAILSAFE = True

    # Abre menu de crédito
    pyautogui.click(120, 220)  # Coordenada fictícia, ajuste se necessário
    time.sleep(2)

    # Insere número do pedido
    pyautogui.typewrite(str(pedido))
    pyautogui.hotkey('enter')
    time.sleep(1)

    # Vários tabs até chegar na opção desejada
    for _ in range(15):
        pyautogui.hotkey('tab')
    pyautogui.hotkey('enter')

    # Aguarda processar
    time.sleep(5)

# =====================================
# PROGRAMA PRINCIPAL
# =====================================
if __name__ == "__main__":
    print(f"[{datetime.now()}] Iniciando liberação de pedidos pendentes...")
    pedidos = buscar_pedidos_nao_liberados()

    if not pedidos:
        print("[INFO] Nenhum pedido pendente para liberação.")
    else:
        navegator = webdriver.Chrome(service=service, options=chrome_options)
        abreWeb(navegator)

        for idpedido, pedidosty in pedidos:
            try:
                confirmarestricao(pedidosty)
                liberaanalisecredito(pedidosty)
                marcar_como_liberado(idpedido)
                print(f"[OK] Pedido {pedidosty} processado e marcado como liberado.")
            except Exception as e:
                print(f"[ERRO] Falha ao processar pedido {pedidosty}: {e}")

        navegator.quit()

    print("[INFO] Processo concluído.")
