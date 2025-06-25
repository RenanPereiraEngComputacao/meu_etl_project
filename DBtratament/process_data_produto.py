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
            ncm,
            marca,
            peso,
            colecao
        )
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s);
    """

    registros = []
    for row in data:
        registros.append((
            int(row["CODIGO_INTERNO_PRODUTO"]),
            row["REFERENCIA_PRODUTO"],
            row["DESCRICAO_PRODUTO"],
            row["CORESID"],
            row["CORES"],
            row["GRADE"],
            row["COMPOSICAO"],
            row["NCM_PRODUTO"],
            row["MARCA_PRODUTO"],
            float(row["PESO_PRODUTO"]) if row["PESO_PRODUTO"] else 0.0,
            row["COLECAO_PRODUTO"]
        ))

    cursor.executemany(insert_sql, registros)
    conn.commit()
    cursor.close()