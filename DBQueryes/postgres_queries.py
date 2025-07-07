def get_pedidos_nao_sincronizados():
    return """
        SELECT * FROM orders WHERE statussincronismo = FALSE ORDER BY idpedido ASC;
    """

def get_itens_por_pedido():
    return """
        SELECT
            iditempedido,
            barcode,
            indexado,
            quantidade,
            precounitario
        FROM
            order_itens
        WHERE
            idpedido = %s;
    """