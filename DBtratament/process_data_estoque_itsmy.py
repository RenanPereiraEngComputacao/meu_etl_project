import os
import re
import math
from dotenv import load_dotenv

load_dotenv()

MULTIPLICADOR = float(os.getenv("PRECO_MULTIPLICADORITSMY", "1.0"))

# Função para arredondar o preço para o próximo múltiplo de 0.90
def arredondar_para_90(valor):
    inteiro = math.floor(valor)
    return inteiro + 0.90

def process_data_estoque(
    saldos, reservas, referencias, cores, tamanhos, barcodes, precos
):
    """
    Gera TODAS as variações (ref, cor, tam) com base em `barcodes` e cruza com
    saldos/reservas. Se não houver estoque, cria a linha com zeros.
    Mantém o mesmo formato de retorno do seu código original.
    """
    # --- Dicionários de consulta rápida (mesma base do seu código) ---
    ref_map = {r['seqrefer_dc']: r['refcodigo_ch'] for r in referencias}
    cor_map = {c['seqcores_dc']: (c.get('corcodigo_in'), c['cordescri_ch']) for c in cores}
    tam_map = {t['seqtaman_dc']: t['tamtama_ch'] for t in tamanhos}

    # Chave SKU -> EAN
    barcode_map = {
        (b['seqrefer_dc'], b['seqcores_dc'], b['seqtaman_dc']): b['bargs1128_ch']
        for b in barcodes
    }

    # EAN -> preço
    preco_map = {p['EAN']: float(p['PRECO']) for p in precos}

    # --- Saldos: guardar o MAIS recente por (ref, cor, tam, armazenamento) ---
    saldo_ultimo = {}
    for s in saldos:
        key = (s['seqrefer_bi'], s['seqcores_bi'], s['seqtaman_bi'], s['seqgruarm_bi'])
        # mantém o mais recente por key
        if key not in saldo_ultimo or s['estdata_dt'] > saldo_ultimo[key]['estdata_dt']:
            saldo_ultimo[key] = s

    # --- Reservas: soma por (ref, cor, tam, armazenamento) ---
    reserva_map = {}
    for r in reservas:
        key = (r['seqrefer_bi'], r['seqcores_bi'], r['seqtaman_bi'], r['seqgruarm_bi'])
        reserva_map[key] = reserva_map.get(key, 0.0) + float(r['resqtde_dc'])

    # --- Universo de SKUs: todas as combinações que existem em `barcodes` ---
    all_skus = set(barcode_map.keys())  # (seqrefer, seqcor, seqtamanho)

    # Para cada SKU, descobrir quais armazenamentos existem em saldo/reserva
    armazenamentos_por_sku = {}
    for (seqref, seqcor, seqtam, seqarm) in saldo_ultimo.keys():
        armazenamentos_por_sku.setdefault((seqref, seqcor, seqtam), set()).add(seqarm)
    for (seqref, seqcor, seqtam, seqarm) in reserva_map.keys():
        armazenamentos_por_sku.setdefault((seqref, seqcor, seqtam), set()).add(seqarm)

    resultado_final = []

    # --- Montagem final (gera sempre a linha do SKU; se não houver estoque, zera) ---
    for (seqrefer, seqcor, seqtamanho) in all_skus:
        # Metadados
        refcodigo = ref_map.get(seqrefer, "N/A")
        corcodigo, cordescri = cor_map.get(seqcor, (None, "N/A"))
        tamtama = tam_map.get(seqtamanho, "N/A")

        refcodigo_formatado = refcodigo.replace('.', '-') if isinstance(refcodigo, str) else str(refcodigo)
        # remove textos entre parênteses, e ajusta espaços
        corajust = re.sub(r"\s*\(.*?\)", "", str(cordescri)).strip()
        coresajust = corajust.replace(' ', '-')

        # evita "None" no indexado
        corcodigo_str = str(corcodigo) if corcodigo is not None else "0"

        # EAN deste SKU
        barcode = barcode_map.get((seqrefer, seqcor, seqtamanho), "")

        # Preços
        preco_original = preco_map.get(barcode)
        if preco_original:
            preco_multiplicado = preco_original * MULTIPLICADOR
            precob2c = arredondar_para_90(preco_multiplicado)
            precob2b = arredondar_para_90(preco_original)
        else:
            precob2c = 0.0
            precob2b = 0.0

        indexado = f"{refcodigo_formatado}-{corcodigo_str}-{tamtama}"
        indexadocorescrito = f"{refcodigo_formatado}-{coresajust}-{tamtama}"
        variacao = f"{corajust}-{tamtama}"

        # Armazenamentos conhecidos para este SKU; se não houver, cria uma linha "genérica"
        armazenamentos = armazenamentos_por_sku.get((seqrefer, seqcor, seqtamanho))
        if not armazenamentos or len(armazenamentos) == 0:
            seqgruarm = 0  # "genérico" quando não há estoque/reserva em lugar nenhum
            estqtde = 0.0
            resqtde = 0.0
            disponivel = 0.0

            resultado_final.append((
                indexado,
                indexadocorescrito,
                refcodigo,
                variacao,
                barcode,
                precob2c,
                precob2b,
                seqgruarm,
                estqtde,
                resqtde,
                disponivel
            ))
            continue

        # Para cada armazenamento existente, gera a linha
        for seqgruarm in armazenamentos:
            s_key = (seqrefer, seqcor, seqtamanho, seqgruarm)

            estqtde = float(saldo_ultimo[s_key]['estqtde_dc']) if s_key in saldo_ultimo else 0.0
            resqtde = float(reserva_map.get(s_key, 0.0))
            disponivel = estqtde - resqtde

            resultado_final.append((
                indexado,
                indexadocorescrito,
                refcodigo,
                variacao,
                barcode,
                precob2c,
                precob2b,
                seqgruarm,
                estqtde,
                resqtde,
                disponivel
            ))

    return resultado_final


def insert_into_postgres_estoque(data, conn):
    cursor = conn.cursor()
    try:
        cursor.execute("TRUNCATE TABLE sku_variacao_estoque;")
        insert_sql = """
            INSERT INTO sku_variacao_estoque
            (indexado, indexadocorescrito, refcodigo, variacao, barcode, precob2c, precob2b, armazenamento, fisico, reserva, disponivel)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s);
        """
        cursor.executemany(insert_sql, data)
        conn.commit()
    except Exception as e:
        print(f"Erro ao inserir dados no Postgres: {e}")
        try:
            conn.rollback()
        except:
            pass
        raise
    finally:
        cursor.close()
