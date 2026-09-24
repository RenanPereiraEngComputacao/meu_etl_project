import os
from dotenv import load_dotenv
from DBconect.postgres_conn import get_postgres_connection
from decimal import Decimal

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
                item["barcode"] = novo_barcode  
    conn.commit()
    cursor.close()

def normalizar_valor_json(valor):
    if isinstance(valor, Decimal):
        return float(valor) 
    return valor

def montar_json_pedido(pedido, itens):
    if pedido["tipopedido"] == "B2C":
        items_json = []
        for item in itens:
            barcode = item["barcode"]
            quantidade = normalizar_valor_json(item["quantidade"])
            preco = normalizar_valor_json(item["precounitario"])
            preco_erp = round(preco * 0.20)
            if preco < 0.01:
                preco = 0.01

            if not barcode:
                # Busca no banco se estiver faltando
                barcode = buscar_barcode_por_indexado(item["indexado"])

                if not barcode:
                    raise ValueError(
                        f"Item sem barcode: indexado '{item['indexado']}' no pedido '{pedido['numeropedido']}'"
                    )

            items_json.append({
                "barcode": barcode,
                "order": quantidade,
                "price": preco_erp
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