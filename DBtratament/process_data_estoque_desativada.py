import os
import re
import math
from dotenv import load_dotenv

load_dotenv()

MULTIPLICADOR = float(os.getenv("PRECO_MULTIPLICADOR", "2.0"))

# Função para arredondar o preço para o próximo múltiplo de 0.90
def arredondar_para_90(valor):
    inteiro = math.floor(valor)
    return inteiro + 0.90

# Processamento dos dados de estoque
def process_data_estoque(
    saldos, reservas, referencias, cores, tamanhos, barcodes, precos):
    # Dicionários de consulta rápida
    ref_map = {r['seqrefer_dc']: r['refcodigo_ch'] for r in referencias}
    cor_map = {c['seqcores_dc']: (c['corcodigo_in'], c['cordescri_ch']) for c in cores}
    tam_map = {t['seqtaman_dc']: t['tamtama_ch'] for t in tamanhos}
    barcode_map = {(b['seqrefer_dc'], b['seqcores_dc'], b['seqtaman_dc']): b['bargs1128_ch']
                   for b in barcodes}
    preco_map = {p['EAN']: float(p['PRECO']) for p in precos}

    # Agrupando saldos por seqrefer_bi, seqcores_bi, seqtaman_bi, seqgruarm_bi
    saldo_ultimo = {}
    for s in saldos:
        key = (s['seqrefer_bi'], s['seqcores_bi'], s['seqtaman_bi'], s['seqgruarm_bi'])
        if key not in saldo_ultimo or s['estdata_dt'] > saldo_ultimo[key]['estdata_dt']:
            saldo_ultimo[key] = s

    # Agrupando reservas por seqrefer_bi, seqcores_bi, seqtaman_bi, seqgruarm_bi
    reserva_map = {}
    for r in reservas:
        key = (r['seqrefer_bi'], r['seqcores_bi'], r['seqtaman_bi'], r['seqgruarm_bi'])
        reserva_map[key] = reserva_map.get(key, 0) + float(r['resqtde_dc'])

    resultado_final = []
    for key, saldo in saldo_ultimo.items():
        seqrefer, seqcor, seqtamanho, seqgruarm = key
        estqtde = float(saldo['estqtde_dc'])
        resqtde = reserva_map.get(key, 0)
        disponivel = estqtde - resqtde

        refcodigo = ref_map.get(seqrefer, "N/A")
        corcodigo, cordescri = cor_map.get(seqcor, (None, "N/A"))
        tamtama = tam_map.get(seqtamanho, "N/A")
        refcodigo_formatado = refcodigo.replace('.', '-')
        corajust = re.sub(r"\s*\(.*?\)", "", cordescri).strip()
        barcode = barcode_map.get((seqrefer, seqcor, seqtamanho), "")
        coresajust = corajust.replace(' ', '-')

        # Preço ajustado
        preco_original = preco_map.get(barcode)
        if preco_original:
            preco_multiplicado = preco_original * MULTIPLICADOR
            preco_final = arredondar_para_90(preco_multiplicado)
            preco_original_arredondado = arredondar_para_90(preco_original)
        else:
            preco_final = 0.0
            preco_original_arredondado = 0.0

        # Indexado e Variacao
        indexado = f"{refcodigo_formatado}-{corcodigo}-{tamtama}"
        indexadocorescrito = f"{refcodigo_formatado}-{coresajust}-{tamtama}"
        variacao = f"{corajust}-{tamtama}"

        resultado_final.append((
            indexado,
            indexadocorescrito,
            refcodigo,
            variacao,
            barcode,
            preco_final,
            preco_original_arredondado,
            seqgruarm,
            estqtde,
            resqtde,
            disponivel
        ))

    return resultado_final


def insert_into_postgres_estoque(data, conn):
    cursor = conn.cursor()
    try:
        cursor.execute("TRUNCATE TABLE sku_variacao_estoque2;")
        insert_sql = """
            INSERT INTO sku_variacao_estoque2
            (indexado, indexadocorescrito, refcodigo, variacao, barcode, precob2c, precob2b, armazenamento, fisico, reserva, disponivel)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s);
        """
        cursor.executemany(insert_sql, data)
        conn.commit()
    except Exception as e:
        print(f"Erro ao inserir dados no Postgres: {e}")
        conn.rollback()
    finally:
        cursor.close()
