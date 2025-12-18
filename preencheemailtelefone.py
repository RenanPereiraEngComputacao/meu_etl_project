import psycopg2.extras
from dotenv import load_dotenv
import sys
import io

# Assumindo que essas funções estão disponíveis nos seus arquivos locais
from DBconect.postgres_conn import get_postgres_connection
from DBtratament.logger import registrar_log

#org = sys.argv[sys.argv.index("--org") + 1]

# ================================
# CONFIGURAÇÕES INICIAIS
# ================================
load_dotenv()
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")

SCRIPT_NAME = "sync_client_details"

print("Programa de sincronização de detalhes do cliente iniciado.")

# =====================================
# FUNÇÃO PRINCIPAL DE SINCRONIZAÇÃO
# =====================================
def run_sync():
    registrar_log(SCRIPT_NAME, "Iniciando sincronização de email e telefone...")
    print("run_sync iniciado")

    conn = None 
    try:
        conn = get_postgres_connection()
    except Exception as e:
        registrar_log(SCRIPT_NAME, f"Erro ao conectar Postgres: {e}")
        return

    cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)

    # 1. Busca pedidos que precisam de atualização
    # Filtra apenas pedidos onde EMAIL ou TELEFONE estão nulos para otimizar.
    try:
        cursor.execute("""
            SELECT idpedido, cpfcnpjcliente, email, telefone
            FROM public.orders
            WHERE email IS NULL OR telefone IS NULL
            ORDER BY idpedido DESC
        """)
        orders_to_update = cursor.fetchall()
        
        if not orders_to_update:
            print("Nenhum pedido encontrado precisando de atualização de contato.")
            registrar_log(SCRIPT_NAME, "Nenhum pedido pendente de atualização.")
            return

        print(f"Encontrados {len(orders_to_update)} pedidos para processar.")
        registrar_log(SCRIPT_NAME, f"Encontrados {len(orders_to_update)} pedidos para processar.")
        
    except Exception as e:
        registrar_log(SCRIPT_NAME, f"Erro ao buscar pedidos no DB: {e}")
        return
    
    # 2. Processa cada pedido
    total_updated = 0
    for order in orders_to_update:
        idpedido = order["idpedido"]
        cpfcnpjcliente = order["cpfcnpjcliente"]
        
        # Ignora pedidos sem CPF/CNPJ para evitar consultas desnecessárias
        if not cpfcnpjcliente or len(cpfcnpjcliente.strip()) < 11:
            print(f" → Pedido {idpedido} ignorado: CPF/CNPJ inválido ou ausente.")
            continue
            
        try:
            # 3. Busca os dados mais recentes do cliente na tabela secundária
            cursor.execute("""
                SELECT email, telefone 
                FROM cliente_secundaria 
                WHERE cpfcnpj = %s
                ORDER BY idclientesecundario DESC 
                LIMIT 1
            """, (cpfcnpjcliente.strip(),))
            
            client_data = cursor.fetchone()
            
            if client_data:
                # 4. Prepara os campos a serem atualizados (apenas se estiverem nulos)
                update_fields = []
                update_params = []
                
                new_email = client_data["email"]
                new_telefone = client_data["telefone"]
                
                # Atualiza email se o novo valor não for nulo E o valor atual for nulo
                if new_email and order["email"] is None:
                    update_fields.append("email = %s")
                    update_params.append(new_email)
                
                # Atualiza telefone se o novo valor não for nulo E o valor atual for nulo
                if new_telefone and order["telefone"] is None:
                    update_fields.append("telefone = %s")
                    update_params.append(new_telefone)
                
                # 5. Executa a atualização se houver campos para preencher
                if update_fields:
                    set_clause = ", ".join(update_fields)
                    final_params = tuple(update_params) + (idpedido,)
                    
                    cursor.execute(f"""
                        UPDATE public.orders
                        SET {set_clause}
                        WHERE idpedido = %s
                    """, final_params)
                    
                    conn.commit()
                    total_updated += 1
                    msg = f" ✓ Pedido {idpedido}: Atualizado com {len(update_fields)} campos (Email/Telefone)."
                    registrar_log(SCRIPT_NAME, msg)
                    print(msg)
                else:
                    print(f" → Pedido {idpedido}: Dados de contato já preenchidos ou não encontrados na secundária.")
            else:
                print(f" → Pedido {idpedido}: Nenhum registro de contato encontrado na cliente_secundaria para CPF/CNPJ: {cpfcnpjcliente}")

        except Exception as e:
            conn.rollback()
            registrar_log(SCRIPT_NAME, f"Erro ao processar/atualizar pedido {idpedido}: {e}")

    # =====================================
    # FINALIZAÇÃO
    # =====================================
    try:
        if conn:
            conn.close()
    except Exception as e:
        registrar_log(SCRIPT_NAME, f"Erro ao fechar conexão com DB: {e}")

    final_msg = f"Sincronização de detalhes do cliente finalizada. Total de pedidos atualizados: {total_updated}."
    registrar_log(SCRIPT_NAME, final_msg)
    print(final_msg)

# =============================
# EXECUÇÃO DIRETA
# =============================
if __name__ == "__main__":
    run_sync()