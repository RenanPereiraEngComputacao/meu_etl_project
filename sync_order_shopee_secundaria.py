import requests
import psycopg2.extras
from dotenv import load_dotenv
import os
import contextlib
import sys
import io
from datetime import date, timedelta

from DBconect.postgres_conn import get_postgres_connection2
from DBtratament.logger import registrar_log

load_dotenv()

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")


def fetch_data(query, conn, params=None):
    cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    cursor.execute(query, params if params else ())
    result = cursor.fetchall()
    cursor.close()
    return result


def get_bling_token(conn):
    cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)

    cursor.execute("""
        SELECT access_token
        FROM bling_tokens
        ORDER BY created_at DESC
        LIMIT 1
    """)

    row = cursor.fetchone()
    cursor.close()

    if not row:
        raise Exception("Nenhum token encontrado na tabela bling_tokens.")

    return row["access_token"]


def pedido_ja_processado(conn, idpedido):
    cursor = conn.cursor()

    cursor.execute("""
        SELECT 1
        FROM orders
        WHERE idpedido = %s
          AND liberado = TRUE
        LIMIT 1
    """, (idpedido,))

    existe = cursor.fetchone() is not None
    cursor.close()

    return existe


def inserir_order(conn, pedido_resumo, pedido_detalhe):
    numero_loja = pedido_detalhe["numeroLoja"]

    observacao = pedido_detalhe.get("observacoesInternas", "")

    estado = (
        pedido_detalhe
        .get("transporte", {})
        .get("etiqueta", {})
        .get("uf", "")
    )

    transportadora = (
        pedido_detalhe
        .get("transporte", {})
        .get("contato", {})
        .get("nome", "")
    )

    cpfcnpj = (
        pedido_detalhe
        .get("contato", {})
        .get("numeroDocumento", "")
        .replace(".", "")
        .replace("-", "")
        .replace("/", "")
    )

    cursor = conn.cursor()

    cursor.execute("""
        INSERT INTO orders (
            idpedido,
            numeropedido,
            nomecliente,
            cpfcnpjcliente,
            tipopedido,
            statussincronismo,
            observacao,
            statusped,
            liberado,
            estado,
            transportadora,
            valorpedido,
            pedidobling,
            datapedido
        )
        VALUES (
            %s,
            %s,
            %s,
            %s,
            'B2C',
            FALSE,
            %s,
            'Pedido Recebido',
            TRUE,
            %s,
            %s,
            %s,
            %s,
            %s
        )
    """, (
        numero_loja,
        f"PED-{numero_loja}",
        pedido_detalhe["contato"]["nome"],
        cpfcnpj,
        observacao,
        estado,
        transportadora,
        pedido_detalhe["total"],
        pedido_detalhe["numero"],
        pedido_detalhe["data"]
    ))

    cursor.close()


def inserir_itens(conn, pedido_detalhe):
    numero_loja = pedido_detalhe["numeroLoja"]

    cursor = conn.cursor()

    for item in pedido_detalhe.get("itens", []):

        quantidade = float(item.get("quantidade", 0))
        valor = float(item.get("valor", 0))
        subtotal = quantidade * valor

        cursor.execute("""
            INSERT INTO order_itens (
                idpedido,
                indexado,
                quantidade,
                precounitario,
                subtotal
            )
            VALUES (
                %s,
                %s,
                %s,
                %s,
                %s
            )
        """, (
            numero_loja,
            item.get("codigo"),
            quantidade,
            valor,
            subtotal
        ))

    cursor.close()


def consultar_pedidos_bling(token):
    hoje = date.today()
    data_inicial = hoje - timedelta(days=4)

    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/json"
    }

    params = {
        "pagina": 1,
        "dataInicial": data_inicial.strftime("%Y-%m-%d"),
        "dataFinal": hoje.strftime("%Y-%m-%d"),
        "idLoja": 206063543
    }

    response = requests.get(
        "https://api.bling.com.br/Api/v3/pedidos/vendas",
        headers=headers,
        params=params,
        timeout=60
    )

    response.raise_for_status()

    return response.json().get("data", [])


def consultar_detalhe_pedido(token, id_pedido):
    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/json"
    }

    response = requests.get(
        f"https://api.bling.com.br/Api/v3/pedidos/vendas/{id_pedido}",
        headers=headers,
        timeout=60
    )

    response.raise_for_status()

    return response.json()["data"]


def main():
    conn = None

    try:
        conn = get_postgres_connection2()

        token = get_bling_token(conn)

        pedidos = consultar_pedidos_bling(token)

        print(f"Pedidos encontrados: {len(pedidos)}")

        for pedido in pedidos:

            id_bling = pedido["id"]
            numero_loja = pedido["numeroLoja"]

            try:

                if pedido_ja_processado(conn, numero_loja):
                    print(
                        f"Pedido {numero_loja} já processado. Ignorando."
                    )
                    continue

                print(
                    f"Consultando pedido Bling {id_bling}..."
                )

                detalhe = consultar_detalhe_pedido(
                    token,
                    id_bling
                )

                inserir_order(
                    conn,
                    pedido,
                    detalhe
                )

                inserir_itens(
                    conn,
                    detalhe
                )

                conn.commit()

                print(
                    f"Pedido {numero_loja} gravado com sucesso."
                )

            except Exception as e:
                conn.rollback()

                print(
                    f"Erro ao processar pedido "
                    f"{numero_loja}: {e}"
                )

    except Exception as e:
        print(f"Erro geral: {e}")

    finally:

        try:
            if conn:
                conn.close()
        except:
            pass

        print("Conexão encerrada.")


if __name__ == "__main__":

    buffer = io.StringIO()
    
    with contextlib.redirect_stdout(buffer):
        main()

    registrar_log(
        "sync_order_shopee.py",
        buffer.getvalue()
    )