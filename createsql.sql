CREATE TABLE estoque_disponivel (
	indexado VARCHAR(500),
    refcodigo VARCHAR(50),
    corcodigo VARCHAR(50),
    cordescri VARCHAR(100),
    tamanho VARCHAR(20),
	armazenamento INTEGER,
    fisico DECIMAL(13,3),
    reserva DECIMAL(13,3),
    disponivel DECIMAL(13,3)
);

CREATE TABLE produtos (
    idproduto      INTEGER,
    referencia     VARCHAR(30) NOT NULL,
    nome           VARCHAR(1000) NOT NULL,
    coresid        VARCHAR(1000),
    cores          VARCHAR(1000),
    grade          VARCHAR(1000),
    composicao     VARCHAR(1000),
	modolavar	   VARCHAR(1000),
    ncm            VARCHAR(15),
    marca          VARCHAR(1000),
    largura        NUMERIC(10,3) default 0.2,
    altura         NUMERIC(10,3) default 0.2,
    profundidade   NUMERIC(10,3) default 0.2,
    peso           NUMERIC(10,3),
    colecao        VARCHAR(1000)
);