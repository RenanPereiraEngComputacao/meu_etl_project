def insert_into_postgres_produto(data, conn):
    cursor = conn.cursor()
    cursor.execute("TRUNCATE TABLE produtos;")  # Limpa a tabela antes de inserir

    insert_sql = """
        INSERT INTO produtos (
            idproduto,
            referencia,
            nome,
            coresid,
            cores,
            grade,
            composicao,
            modolavar,
            ncm,
            marca,
            peso,
            colecao
        )
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s);
    """

    registros = []
    for row in data:
        # Tratamento da coluna MODO_LAVAR
        modo_original = (row.get("MODO_LAVAR") or "").strip().upper()

        if modo_original == "MODELO 01":
            modo_lavagem = (
                "MODO DE LAVAGEM: A LAVAGEM DEVE SER FEITA A MÃO, NÃO ALVEJAR E TENTAR "
                "METODO DE CLAREAMENTO, A PEÇA NÃO DEVE SER SECA NA MAQUINA, "
                "PASSAR NO FERRO FRIO, TEMPERATURA MAXIMA 110ºC, "
                "NÃO É PERMITIDO LAVAGEM A SECO, SECAR NA HORIZONTAL SEM TORCER."
            )
        elif modo_original == "MODELO 02":
            modo_lavagem = (
                "MODO DE LAVAGEM: A LAVAGEM DEVE SER FEITA A MÃO, NÃO ALVEJAR E TENTAR "
                "METODO DE CLAREAMENTO, A PEÇA NÃO DEVE SER SECA NA MAQUINA, "
                "NÃO É PERMITIDO LAVAGEM A SECO, SECAR NA HORIZONTAL SEM TORCER, NÃO PASSAR ."
            )
        else:
            modo_lavagem = "AJUSTAR INFORMAÇÃO"

        registros.append((
            int(row["CODIGO_INTERNO_PRODUTO"]),
            row["REFERENCIA_PRODUTO"],
            row["DESCRICAO_PRODUTO"],
            row["CORESID"],
            row["CORES"],
            row["GRADE"],
            row["COMPOSICAO"],
            modo_lavagem,
            row["NCM_PRODUTO"],
            row["MARCA_PRODUTO"],
            float(row["PESO_PRODUTO"]) if row["PESO_PRODUTO"] else 0.0,
            row["COLECAO_PRODUTO"]
        ))

    cursor.executemany(insert_sql, registros)
    conn.commit()
    cursor.close()