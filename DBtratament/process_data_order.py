import os
from dotenv import load_dotenv
from DBconect.postgres_conn import get_postgres_connection

load_dotenv()

CNPJ_LOJAMALAGAH = os.getenv("CNPJ_LOJAMALAGAH")
CNPJ_STYLEZEE = os.getenv("CNPJ_STYLEZEE")
PRECO_PADRAO_LOJA_MALAGAH = os.getenv("PRECO_PADRAO_LOJA_MALAGAH")


def buscar_barcode_por_indexado(indexado):
    conn = get_postgres_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                "SELECT barcode FROM sku_variacao_estoque WHERE indexado = %s LIMIT 1;",
                (indexado,)
            )
            row = cursor.fetchone()
            return row[0] if row else None
    finally:
        conn.close()

def atualizar_barcodes_faltantes(itens, conn):
    cursor = conn.cursor()
    for item in itens:
        if not item["barcode"]:
            indexado = item["indexado"]
            cursor.execute(
                "SELECT barcode FROM sku_variacao_estoque WHERE indexado = %s LIMIT 1",
                (indexado,)
            )
            result = cursor.fetchone()
            if result:
                novo_barcode = result[0]
                cursor.execute(
                    "UPDATE order_itens SET barcode = %s WHERE iditempedido = %s",
                    (novo_barcode, item["iditempedido"])
                )
                item["barcode"] = novo_barcode  # atualiza também no dict para uso no JSON
    conn.commit()
    cursor.close()


def montar_json_pedido(pedido, itens):
    if pedido["tipopedido"] == "B2C":
        items_json = []
        for item in itens:
            barcode = item["barcode"]
            if not barcode:
                # Busca no banco se estiver faltando
                barcode = buscar_barcode_por_indexado(item["indexado"])
                if not barcode:
                    raise ValueError(
                        f"Item sem barcode: indexado '{item['indexado']}' no pedido '{pedido['numeropedido']}'"
                    )

            items_json.append({
                "barcode": barcode,
                "order": item["quantidade"],
                "price": PRECO_PADRAO_LOJA_MALAGAH
            })

        return {
            "async": True,
            "type": "1MTIx1",
            "customer": CNPJ_LOJAMALAGAH,
            "seller": CNPJ_STYLEZEE,
            "bank": "001",
            "note": f"Pedido N°: {pedido['numeropedido']} | Cliente: {pedido['nomecliente']}.",
            "items": items_json,
            "installments": [{"days": 120}]
        }

    elif pedido["tipopedido"] == "B2B":
        items_json = []
        for item in itens:
            barcode = item["barcode"]
            if not barcode:
                barcode = buscar_barcode_por_indexado(item["indexado"])
                if not barcode:
                    raise ValueError(
                        f"Item sem barcode: indexado '{item['indexado']}' no pedido '{pedido['numeropedido']}'"
                    )
            items_json.append({
                "barcode": barcode,
                "order": item["quantidade"],
                "price": float(item["precounitario"])
            })

        return {
            "async": True,
            "type": "1MTE59",
            "customer": pedido["cpfcnpjcliente"],
            "seller": CNPJ_STYLEZEE,
            "note": f"Pedido N°: {pedido['numeropedido']} | Cliente: {pedido['nomecliente']} | Obs: {pedido['observacao']}.",
            "items": items_json
        }

    else:
        raise ValueError(
            f"Tipo de pedido não suportado: '{pedido['tipopedido']}' para o pedido ID {pedido['idpedido']}"
        )