import re
def insert_into_postgres_produto(data, observacoes, conn):
    cursor = conn.cursor()
    cursor.execute("TRUNCATE TABLE produtos;")  # Limpa a tabela antes de inserir
    obs_map = {o["CODIGO_INTERNO_PRODUTO"]: o["DESCRICAO_OBSERVACAO"] for o in observacoes}

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
            colecao,
            tituloso,
            descricaoso,
            descricaocurta,
            descricaolonga,
            palavraschave
        )
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s);
    """

    registros = []
    for row in data:
        # Tratamento da coluna MODO_LAVAR
        modo_original = (row.get("MODO_LAVAR") or "").strip().upper()
        descricao_raw = row.get("DESCRICAO_PRODUTO", "")
        descricao_sem_parenteses = re.sub(r"\s*\(.*?\)", "", descricao_raw).strip()
        descricao_sem_parenteses = re.sub(r"\s*\(.*?\)", "", descricao_raw).strip()
        descricao_sem_parenteses = (
            descricao_sem_parenteses
            .replace("MC", "MANGA CURTA")
            .replace("ML", "MANGA LONGA")
        )
        nome_formatado = ((descricao_sem_parenteses) + " | MÁLAGAH")
        corsem = row.get("CORES", "")
        desccorsem = re.sub(r"\s*\(.*?\)", "", corsem).strip()

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

        caracteristica_raw = obs_map.get(row["CODIGO_INTERNO_PRODUTO"], "")
        partes = [p.strip() for p in caracteristica_raw.split("|")]

        while len(partes) < 4:
            partes.append("")

        descricaoso, descricaocurta, descricaolonga, palavraschave = partes[:4]

        registros.append((
            int(row["CODIGO_INTERNO_PRODUTO"]),
            row["REFERENCIA_PRODUTO"],
            descricao_sem_parenteses,
            row["CORESID"],
            desccorsem,
            row["GRADE"],
            row["COMPOSICAO"],
            modo_lavagem,
            row["NCM_PRODUTO"],
            row["MARCA_PRODUTO"],
            float(row["PESO_PRODUTO"]) if row["PESO_PRODUTO"] else 0.0,
            row["COLECAO_PRODUTO"],
            nome_formatado,
            descricaoso if descricaoso else "NÃO INFORMADO",
            descricaocurta if descricaocurta else "NÃO INFORMADO",
            descricaolonga if descricaolonga else "NÃO INFORMADO",
            palavraschave if palavraschave else "NÃO INFORMADO"

        ))

    cursor.executemany(insert_sql, registros)
    conn.commit()
    cursor.close()