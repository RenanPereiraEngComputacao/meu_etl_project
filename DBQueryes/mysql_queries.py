import mysql.connector
from dotenv import load_dotenv
import os

load_dotenv()

#estoque saldo, reserva, referencias, cores e tamanhos
def get_estoque_saldo_query():
    return "SELECT seqrefer_bi, seqcores_bi, seqtaman_bi, seqgruarm_bi, estqtde_dc, estdata_dt FROM indestoquesaldo WHERE seqgruarm_bi = 1;"

def get_reserva_query():
    return "SELECT seqrefer_bi, seqcores_bi, seqtaman_bi, seqgruarm_bi, resqtde_dc FROM indreserva WHERE seqgruarm_bi = 1;"

def get_estoque_saldo_query2():
    return "SELECT seqrefer_bi, seqcores_bi, seqtaman_bi, seqgruarm_bi, estqtde_dc, estdata_dt FROM indestoquesaldo WHERE seqgruarm_bi = 1;"

def get_reserva_query2():
    return "SELECT seqrefer_bi, seqcores_bi, seqtaman_bi, seqgruarm_bi, resqtde_dc FROM indreserva WHERE seqgruarm_bi = 1;"

def get_referencias_query():
    return "SELECT seqrefer_dc, refcodigo_ch, refdescri_ch FROM indrefer WHERE seqtipos_dc = 26;"

def get_referencias_query2():
    return "SELECT seqrefer_dc, refcodigo_ch, refdescri_ch FROM indrefer WHERE seqtipos_dc = 26;"

def get_cores_query():
    return "SELECT seqcores_dc, corcodigo_in, cordescri_ch FROM indcores;"

def get_tamanhos_query():
    return "SELECT seqtaman_dc, tamtama_ch FROM indtamanho;"

#produtos
def get_produtos_query():
    return """
    SELECT 
        MIN(CODIGO_INTERNO_PRODUTO) AS CODIGO_INTERNO_PRODUTO,
        REFERENCIA_PRODUTO,
        DESCRICAO_PRODUTO,
        GROUP_CONCAT(DISTINCT COR_PANTONE_PRODUTO SEPARATOR ';') AS CORESID,
        GROUP_CONCAT(DISTINCT DESCRICAO_COR_PRODUTO SEPARATOR ';') AS CORES,
        GROUP_CONCAT(DISTINCT TAMANHO_PRODUTO SEPARATOR ';') AS GRADE,
        MAX(COMPOSICAO) AS COMPOSICAO,
        MAX(MODO_LAVAR) AS MODO_LAVAR,
        MAX(NCM_PRODUTO) AS NCM_PRODUTO,
        MAX(MARCA_PRODUTO) AS MARCA_PRODUTO,
        MAX(PESO_PRODUTO) AS PESO_PRODUTO,
        MAX(COLECAO_PRODUTO) AS COLECAO_PRODUTO
    FROM 
        VW_CTO_PRODUTO
    WHERE
        COLECAO_PRODUTO != 'VERÃO 2019' AND
        COLECAO_PRODUTO != 'INVERNO 2019' AND
        COLECAO_PRODUTO != 'VERÃO 2020' AND
        COLECAO_PRODUTO != 'INVERNO 2020' AND
        COLECAO_PRODUTO != 'VERÃO 2021' AND
        COLECAO_PRODUTO != 'INVERNO 2021' AND
        COLECAO_PRODUTO != 'VERÃO 2022' AND
        COLECAO_PRODUTO != 'INVERNO 2022' AND
        COLECAO_PRODUTO != 'VERÃO 2023' 
    GROUP BY 
        REFERENCIA_PRODUTO, DESCRICAO_PRODUTO;
    
    """
def get_produtos_query2():
    return """
    SELECT 
        MIN(CODIGO_INTERNO_PRODUTO) AS CODIGO_INTERNO_PRODUTO,
        REFERENCIA_PRODUTO,
        DESCRICAO_PRODUTO,
        GROUP_CONCAT(DISTINCT COR_PANTONE_PRODUTO SEPARATOR ';') AS CORESID,
        GROUP_CONCAT(DISTINCT DESCRICAO_COR_PRODUTO SEPARATOR ';') AS CORES,
        GROUP_CONCAT(DISTINCT TAMANHO_PRODUTO SEPARATOR ';') AS GRADE,
        MAX(COMPOSICAO) AS COMPOSICAO,
        MAX(MODO_LAVAR) AS MODO_LAVAR,
        MAX(NCM_PRODUTO) AS NCM_PRODUTO,
        MAX(MARCA_PRODUTO) AS MARCA_PRODUTO,
        MAX(PESO_PRODUTO) AS PESO_PRODUTO,
        MAX(COLECAO_PRODUTO) AS COLECAO_PRODUTO
    FROM 
        VW_CTO_PRODUTO
    WHERE
        MARCA_PRODUTO = 'IT´S MY' 
    GROUP BY 
        REFERENCIA_PRODUTO, DESCRICAO_PRODUTO;
    
    """

def get_produtos_obs():
    return """
    SELECT 
        CODIGO_INTERNO_PRODUTO,
        REFERENCIA_PRODUTO,
        DESCRICAO_OBSERVACAO 
    FROM 
        VW_CTO_PRODUTO_OBSERVACAO 
    WHERE 
        OBSERVACAO = 'descricao: so, curta, longa e palavras chave'
    """
def get_codebar():
    return """
    SELECT 
        seqrefer_dc,
        seqcores_dc,
        seqtaman_dc,
        bargs1128_ch 
    FROM 
        indrelrefbar """

def get_precos_query():
    return """
        SELECT 
            EAN,
            PRECO
        FROM 
            VW_CTO_TABELAPRECO
    """
def get_clientes_b2b_query():
    return """
        SELECT
            CODIGO_INTERNO_CLIENTE,
            CNPJ_CPF_CLIENTE,
            RAZAO_SOCIAL,
            EMAIL_CLIENTE,
            DDD_FONE,
            FONE_CLIENTE
        FROM
            VW_CTO_CLIENTE;
    """