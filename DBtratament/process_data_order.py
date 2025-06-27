import os
from dotenv import load_dotenv

load_dotenv()

CNPJ_LOJAMALAGAH = os.getenv("CNPJ_LOJAMALAGAH")
CNPJ_STYLEZEE = os.getenv("CNPJ_STYLEZEE")
PRECO_PADRAO_LOJA_MALAGAH = os.getenv("PRECO_PADRAO_LOJA_MALAGAH")

def montar_json_pedido(pedido, itens):
    if pedido["tipopedido"] == "B2C":
        return {
            "async": True,
            "type": "1MTIx1",
            "customer": CNPJ_LOJAMALAGAH,
            "seller": CNPJ_STYLEZEE,
            "bank": "001",
            "note": f"Pedido N°: {pedido['numeropedido']} | Cliente: {pedido['nomecliente']}.",
            "items": [
                {
                    "barcode": item["barcode"],
                    "order": item["quantidade"],
                    "price": PRECO_PADRAO_LOJA_MALAGAH
                }
                for item in itens
            ],
            "installments": [
            {
            "days": 120
            }]
        }

    elif pedido["tipopedido"] == "B2B":
        return {
            "async": True,
            "type": "1MTIx1",
            "customer": pedido["cpfcnpjcliente"],
            "seller": CNPJ_STYLEZEE,
            "note": f"Pedido N°: {pedido['numeropedido']} | Cliente: {pedido['nomecliente']}.",
            "items": [
                {
                    "barcode": item["barcode"],
                    "order": item["quantidade"],
                    "price": float(item["precounitario"])
                }
                for item in itens
            ]
        }

    else:
        raise ValueError(
            f"Tipo de pedido não suportado: '{pedido['tipopedido']}' para o pedido ID {pedido['idpedido']}"
    )