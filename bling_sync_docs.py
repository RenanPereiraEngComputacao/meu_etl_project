import requests
import psycopg2.extras
from dotenv import load_dotenv
import os
import sys
import io

# Imports customizados (assumindo que estas funções existem):
from DBconect.postgres_conn import get_postgres_connection
from DBtratament.logger import registrar_log

# ================================
# CONFIGURAÇÕES INICIAIS
# ================================
load_dotenv()
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")

API_BASE = os.getenv("LOCAL_API_URL")
PEDIDOS_URL = f"{API_BASE}/bling/pedidos/vendas"
NFE_URL = f"{API_BASE}/bling/nfe"

SCRIPT_NAME = "bling_sync_docs.py"

print("programa iniciado")

# =====================================
# FUNÇÕES AUXILIARES
# =====================================

def fetch_bling_data(url, params, log_prefix):
    """
    Encapsula a lógica de requisição HTTP, tratamento de erros e 
    decodificação JSON para os endpoints do Bling. Inclui log detalhado 
    em caso de erro HTTP para diagnóstico.
    """
    resp = None
    try:
        # Timeout de 20s para a requisição
        resp = requests.get(url, params=params, timeout=20)
        
        # Levanta HTTPError se o status for 4xx ou 5xx
        resp.raise_for_status() 
        
        # Se chegou aqui, a requisição foi um sucesso (2xx)
        return resp.json()
        
    except requests.exceptions.HTTPError as e:
        status_code = resp.status_code if resp is not None else 'N/A'
        
        # Captura o corpo da resposta em caso de erro HTTP
        error_body = resp.text if resp is not None else 'N/A'
        
        # Limita o corpo do erro a 200 caracteres para evitar logs gigantes
        registrar_log(SCRIPT_NAME, f"Erro HTTP {status_code} ({log_prefix}): {e}. Corpo da resposta: {error_body[:200]}...")
        
    except requests.exceptions.RequestException as e:
        # Captura erros de conexão, timeout, DNS, etc.
        registrar_log(SCRIPT_NAME, f"Erro de Requisição ({log_prefix}): {e}")
        
    except Exception as e:
        # Captura JSONDecodeError e outros erros inesperados
        registrar_log(SCRIPT_NAME, f"Erro de processamento/API ({log_prefix}): {e}")
        
    return None

def update_order_data(cursor, conn, idpedido, set_clause, params, success_msg):
    """
    Encapsula a lógica de atualização no PostgreSQL com commit imediato.
    """
    try:
        # Adiciona idpedido ao final dos parâmetros para a cláusula WHERE
        update_params = tuple(params) + (idpedido,)
        
        cursor.execute(f"""
            UPDATE public.orders
            SET {set_clause}
            WHERE idpedido = %s
        """, update_params)

        conn.commit()
        registrar_log(SCRIPT_NAME, f" ✓ {success_msg}")
        print(f" ✓ {success_msg}")
        return True
        
    except Exception as e:
        conn.rollback()
        registrar_log(SCRIPT_NAME, f"Erro ao atualizar DB para {idpedido}: {e}")
        return False

# =====================================
# FUNÇÃO PRINCIPAL
# =====================================
def run_sync():
    registrar_log(SCRIPT_NAME, "Iniciando sincronização geral...")
    

    conn = None # Inicializa para garantir o fechamento no finally

    # Conexão com o banco
    try:
        conn = get_postgres_connection()
    except Exception as e:
        registrar_log(SCRIPT_NAME, f"Erro ao conectar Postgres: {e}")
        return

    cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)

    # Busca pedidos
    try:
        cursor.execute("""
            SELECT idpedido, pedidobling, nfebling
            FROM public.orders
            ORDER BY idpedido DESC
        """)
        rows = cursor.fetchall()
    except Exception as e:
        registrar_log(SCRIPT_NAME, f"Erro ao buscar pedidos no DB: {e}")
        # Passar para o finally para fechar a conexão
        rows = [] 

    # =====================================
    # LOOP PRINCIPAL
    # =====================================
    for row in rows:
        # idpedido do DB, que é INTEGER. Ele deve ser um número inteiro.
        idpedido = row["idpedido"] 
        pedidobling = row["pedidobling"]
        nfebling = row["nfebling"]
        
        print(f"\nProcessando pedido {idpedido}...")
        #registrar_log(SCRIPT_NAME, f"Processando pedido {idpedido}...")

        # ------------------------------------------------------------
        # 🔵 1) PROCESSAR /pedidos/vendas (Se pedidobling for NULL)
        # ------------------------------------------------------------
        if pedidobling is None:
            msg = f" → Consultando pedidobling para numero_loja={idpedido}"
            print(msg)
            registrar_log(SCRIPT_NAME, msg)

            data = fetch_bling_data(
                PEDIDOS_URL, 
                # CORREÇÃO CRÍTICA: Enviar o ID dentro de uma lista para que a biblioteca requests
                # formate o parâmetro numerosLojas[] corretamente para um array no backend.
                params={"pagina": 1, "numerosLojas[]": [str(idpedido)]}, 
                log_prefix=f"pedidos/{idpedido}"
            )
            
            # Se achou venda no Bling:
            if data and "data" in data and len(data["data"]) > 0:
                venda = data["data"][0]

                # Comparação como INT para garantir a correspondência numérica
                try:
                    # Tenta obter o numeroLoja da API e converter para INT
                    numero_loja_encontrado_int = int(str(venda.get("numeroLoja", "0")).strip())
                    # idpedido já deve ser INT, mas forçamos a conversão para segurança
                    idpedido_int = int(idpedido) 

                    # Compara os IDs como números inteiros
                    if numero_loja_encontrado_int != idpedido_int:
                        registrar_log(SCRIPT_NAME, 
                            f"Aviso: Pedido Bling {venda.get('numero')} retornado tem numeroLoja='{numero_loja_encontrado_int}', mas esperava-se '{idpedido_int}'. Pulando atualização de pedido.")
                        print(f" → ATENÇÃO: Pedido Bling encontrado ({numero_loja_encontrado_int}) não corresponde ao numeroLoja esperado ({idpedido_int}). Pulando.")
                        continue
                    
                    # Se for igual, extrai os dados para atualização (usando a versão string ou float conforme necessário)
                    numero = venda.get("numero")
                    total_produtos = float(venda.get("totalProdutos", 0))
                    total = float(venda.get("total", 0))
                    # Calculando frete, assumindo que 'total' inclui 'totalProdutos' e frete
                    frete = total - total_produtos

                except (ValueError, TypeError) as e:
                    registrar_log(SCRIPT_NAME, f"Erro fatal ao converter/comparar IDs do pedido {idpedido}: {e}")
                    continue
                

                update_order_data(
                    cursor, conn, idpedido,
                    "pedidobling = %s, valorpedido = %s, valorfrete = %s",
                    (numero, total_produtos, frete),
                    f"pedidobling={numero}, valorpedido={total_produtos}, valorfrete={frete}"
                )
            else:
                registrar_log(SCRIPT_NAME, f" → Nenhum pedido encontrado no Bling para {idpedido}")
            
        # ------------------------------------------------------------
        # 🟣 2) PROCESSAR /nfe (Se nfebling for NULL)
        # ------------------------------------------------------------
        if nfebling is None:
            msg = f" → Consultando NF-e para numero_loja={idpedido}"
            print(msg)
            registrar_log(SCRIPT_NAME, msg)

            data = fetch_bling_data(
                NFE_URL, 
                params={"numeroLoja": str(idpedido)}, # Garantindo que o ID é enviado como string
                log_prefix=f"nfe/{idpedido}"
            )
            
            # Verifica se 'data' existe, é uma lista e não está vazia.
            if data and "data" in data and isinstance(data["data"], list) and len(data["data"]) > 0:
                
                nfe_objeto = data["data"][0] 
                numero_nfe = nfe_objeto.get("numero")
                
                # Tenta extrair a UF (Estado)
                try:
                    # Navegação segura para extrair a UF
                    uf = nfe_objeto.get("contato", {}).get("endereco", {}).get("uf")
                except Exception: 
                    uf = None
                    registrar_log(SCRIPT_NAME, f"Aviso: UF não encontrada ou estrutura JSON inesperada na NF-e para {idpedido}")

                # Se conseguimos o número da NF-e (que é essencial):
                if numero_nfe:
                    update_order_data(
                        cursor, conn, idpedido,
                        "nfebling = %s, estado = %s",
                        (numero_nfe, uf),
                        f"nfebling={numero_nfe}, estado={uf}"
                    )
                else:
                    registrar_log(SCRIPT_NAME, f" → NF-e encontrada, mas sem 'numero' para {idpedido}")
                    
                    
            else:
                # Esta mensagem é disparada se 'data' for None (erro de requisição/backend) 
                # ou se a lista 'data' estiver vazia (nenhuma NF-e encontrada)
                registrar_log(SCRIPT_NAME, f" → Nenhuma NF-e encontrada ou erro de requisição para {idpedido}")
                
        
    # =====================================
    # FINALIZAÇÃO
    # =====================================
    try:
        if conn:
            conn.close()
    except Exception as e:
        registrar_log(SCRIPT_NAME, f"Erro ao fechar conexão com DB: {e}")

    registrar_log(SCRIPT_NAME, "Sincronização finalizada.")
    print("Sincronização finalizada.")


# =============================
# EXECUÇÃO DIRETA
# =============================
if __name__ == "__main__":
    run_sync()