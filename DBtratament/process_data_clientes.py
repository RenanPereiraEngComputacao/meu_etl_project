def process_clientes_b2b(data):
    """
    Transforma a lista de dicionários em uma lista de tuplas para inserir no Postgres.
    """
    resultado = []
    for row in data:
        resultado.append((
            row["CODIGO_INTERNO_CLIENTE"],
            row["CNPJ_CPF_CLIENTE"],
            row["RAZAO_SOCIAL"],
            row.get("EMAIL_CLIENTE"),
            row.get("DDD_FONE"),
            row.get("FONE_CLIENTE"),
            "ATIVO"  # Ou algum outro status
        ))
    return resultado

def insert_into_postgres_clientes(data, conn):
    cursor = conn.cursor()
    try:
        cursor.execute("TRUNCATE TABLE cliente_b2b;")
        insert_sql = """
            INSERT INTO cliente_b2b (
                internocliente,
                cpfcnpj,
                nome,
                email,
                ddd,
                telefone,
                statuscliente
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s);
        """
        cursor.executemany(insert_sql, data)
        conn.commit()
        print("Clientes inseridos com sucesso no Postgres.")
    except Exception as e:
        conn.rollback()
        print(f"Erro ao inserir clientes: {e}")
    finally:
        cursor.close()
