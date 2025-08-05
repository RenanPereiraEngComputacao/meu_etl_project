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
service = Service('C:\\sincroniza_BDP\\chromedriver-win64\\chromedriver-win64/chromedriver.exe')


#configurando pra habilitar a solicitação de onde salvar o arquivo baixado
chrome_options = Options()
chrome_options.add_experimental_option("prefs", {
    "download.prompt_for_download": True,
    "download.directory_upgrade": True,
    "safebrowsing.enabled": True,
    "safebrowsing.disable_download_protection": True
})
chrome_options.add_experimental_option('excludeSwitches', ['enable-logging'])
navegator = webdriver.Chrome(service=service, options=chrome_options)

# =====================================
# VARIÁVEIS DO SISTEMA
# =====================================
url = 'http://192.168.0.5/'
home = 'siimensis01.php'
usuario = 'liberar.pedido'
senha = '15735924'
pedido = ''
tipoerrado = 'Vendas Representante - Málagah ** Produto Acabado (MALAGAH)'
tipocerto = 'VENDAS B2C - MALAGAH ** Produto Acabado (MALAGAH)'
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
def abreWeb():
     #acessar stylezee
     navegator.get(url)

     #coloca dados de login
     navegator.find_element('xpath', '//*[@id=\"usuario\"]').send_keys(usuario)
     navegator.find_element('xpath', '//*[@id=\"senha\"]').send_keys(senha)
     navegator.find_element('xpath', '//*[@id=\"btnOK\"]').click()

     #esperar
     time.sleep(3)
     pyautogui.hotkey('enter')            
          
     #trocar janela
     janelas = navegator.window_handles
     #print(janelas)

     #verificar se trocou de janela
     def find_window(url:str):
          janelas = navegator.window_handles
          for window in janelas:
               navegator.switch_to.window(window)
               if url in navegator.current_url:
                    #print(navegator.current_url)
                    #print ('achei')
                    break               
     find_window(home)
     return

def confirmarestricao(pedido):
    navegator.find_element('xpath', '//*[@id="atl1"]').click()
    time.sleep(2)
    WebDriverWait(navegator, 10).until(
        EC.presence_of_element_located((By.CLASS_NAME, 'dhtmlx_window_active'))
    )
    time.sleep(2)
    pyautogui.hotkey('tab')
    time.sleep(1)
    pyautogui.typewrite(str(pedido))
    time.sleep(1)
    pyautogui.hotkey('enter')

    for _ in range(16):
        pyautogui.hotkey('tab')
    time.sleep(1)
    pyautogui.hotkey('enter')

    time.sleep(3)
    for _ in range(12):
        pyautogui.hotkey('tab')
    time.sleep(1)
    pyautogui.hotkey('enter')
    time.sleep(2)
    pyautogui.moveTo (816,421)
    pyautogui.click()
    time.sleep(1)
    pyautogui.typewrite(str(tipoerrado))
    pyautogui.hotkey('enter')
    time.sleep(1)
    pyautogui.moveTo (816,421)
    pyautogui.click()
    time.sleep(1)
    pyautogui.typewrite(str(tipocerto))
    pyautogui.hotkey('enter')
    time.sleep(1)
    pyautogui.moveTo (555,821)
    pyautogui.click()
    time.sleep(15)
    pyautogui.moveTo (1416,284)
    pyautogui.click()
    time.sleep(1)
    pyautogui.moveTo (729,818)
    pyautogui.click()
    time.sleep(2)
    pyautogui.hotkey('enter')
    time.sleep(5)
    pyautogui.hotkey('enter')
    time.sleep(30)
    pyautogui.moveTo(1464, 294)
    time.sleep(1)
    pyautogui.click()

def liberaanalisecredito(pedido):
    navegator.find_element('xpath', '//*[@id="atl2"]').click()
    time.sleep(2)
    WebDriverWait(navegator, 10).until(
        EC.presence_of_element_located((By.CLASS_NAME, 'dhtmlx_window_active'))
    )
    time.sleep(3)
    pyautogui.typewrite(str(pedido))
    time.sleep(1)
    pyautogui.hotkey('enter')

    for _ in range(11):
        pyautogui.hotkey('tab')
    time.sleep(1)
    pyautogui.hotkey('enter')

    time.sleep(5)
    for _ in range(12):
        pyautogui.hotkey('tab')
    time.sleep(1)
    pyautogui.hotkey('enter')
    time.sleep(1)
    pyautogui.hotkey('enter')

    time.sleep(15)
    pyautogui.moveTo(1423, 283)
    time.sleep(1)
    pyautogui.click()

# =====================================
# PROGRAMA PRINCIPAL
# =====================================
if __name__ == "__main__":
    agora = datetime.now()
    print(f"[{agora.strftime('%H:%M:%S')}] Iniciando liberação de pedidos pendentes...")
    pedidos = buscar_pedidos_nao_liberados()

    if not pedidos:
        agora = datetime.now()
        print(f"[{agora.strftime('%H:%M:%S')}] Nenhum pedido pendente para liberação.")
    else:
        abreWeb()

        for idpedido, pedidosty in pedidos:
            try:
                confirmarestricao(pedidosty)
                liberaanalisecredito(pedidosty)
                marcar_como_liberado(idpedido)
                agora = datetime.now()
                print(f"[{agora.strftime('%H:%M:%S')}] [OK] Pedido {pedidosty} liberado com sucesso.")
            except Exception as e:
                agora = datetime.now() 
                print(f"[{agora.strftime('%H:%M:%S')}] Falha ao processar pedido {pedidosty}: {e}")

        navegator.quit()
    agora = datetime.now()
    print(f"[{agora.strftime('%H:%M:%S')}] Processo concluído.")
