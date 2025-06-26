import re
def process_data_estoque (saldos, reservas, referencias, cores, tamanhos,barcodes):
    # Transforma listas em dicionários para acesso rápido
    ref_map = {r['seqrefer_dc']: r['refcodigo_ch'] for r in referencias}
    cor_map = {c['seqcores_dc']: (c['corcodigo_in'], c['cordescri_ch']) for c in cores}
    tam_map = {t['seqtaman_dc']: t['tamtama_ch'] for t in tamanhos}
    barcode_map = {(b['seqrefer_dc'], b['seqcores_dc'], b['seqtaman_dc']): b['bargs1128_ch'] 
                   for b in barcodes}

    # Filtra o saldo mais recente por chave
    saldo_ultimo = {}
    for s in saldos:
        key = (s['seqrefer_bi'], s['seqcores_bi'], s['seqtaman_bi'], s['seqgruarm_bi'])
        if key not in saldo_ultimo or s['estdata_dt'] > saldo_ultimo[key]['estdata_dt']:
            saldo_ultimo[key] = s

    # Agrupa reservas por chave
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

        # Campo indexado: refcodigo + corcodigo + tamtama
        indexado = f"{refcodigo_formatado}-{corcodigo}-{tamtama}"
        # Variacao: corajust + tamtama
        variacao = f"{corajust}-{tamtama}"

        resultado_final.append((
            indexado,
            refcodigo,
            variacao,
            barcode,
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
            (indexado, refcodigo, variacao, barcode, armazenamento, fisico, reserva, disponivel)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s);
        """
        cursor.executemany(insert_sql, data)
        conn.commit()
    except Exception as e:
        print(f"❌ Erro ao inserir dados no Postgres: {e}")
        conn.rollback()
    finally:
        cursor.close()
