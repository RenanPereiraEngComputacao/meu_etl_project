def process_data(saldos, reservas, referencias, cores, tamanhos):
    # Transforma listas em dicionários para acesso rápido
    ref_map = {r['seqrefer_dc']: r['refcodigo_ch'] for r in referencias}
    cor_map = {c['seqcores_dc']: (c['corcodigo_in'], c['cordescri_ch']) for c in cores}
    tam_map = {t['seqtaman_dc']: t['tamtama_ch'] for t in tamanhos}

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

        # Campo indexado: refcodigo + corcodigo + tamtama
        indexado = f"{refcodigo_formatado}-{corcodigo}-{tamtama}"

        resultado_final.append((
            indexado,
            refcodigo,
            corcodigo,
            cordescri,
            tamtama,
            seqgruarm,
            estqtde,
            resqtde,
            disponivel
        ))

    return resultado_final


def insert_into_postgres(data, conn):
    cursor = conn.cursor()
    cursor.execute("TRUNCATE TABLE estoque_disponivel;")
    insert_sql = """
        INSERT INTO estoque_disponivel
        (indexado, refcodigo, corcodigo, cordescri, tamanho, armazenamento, fisico, reserva, disponivel)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s);
    """
    cursor.executemany(insert_sql, data)
    conn.commit()
    cursor.close()
