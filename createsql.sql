CREATE TABLE sku_variacao_estoque (
	indexado VARCHAR(500),
    indexadocorescrito VARCHAR(500),
    refcodigo VARCHAR(50),
    variacao VARCHAR(100),
    barcode VARCHAR(15) NOT NULL,
    precob2c DECIMAL(13,2),
    precob2b DECIMAL(13,2),
	armazenamento INTEGER,
    fisico INTEGER,
    reserva INTEGER,
    disponivel INTEGER
);

CREATE TABLE produtos (
    idproduto      INTEGER,
    referencia     VARCHAR(30) NOT NULL,
    sku            VARCHAR(30) NOT NULL,
    nome           VARCHAR(1000) NOT NULL,
    coresid        VARCHAR(1000),
    cores          VARCHAR(1000),
    grade          VARCHAR(1000),
    composicao     VARCHAR(1000),
	modolavar	   VARCHAR(1000),
    ncm            VARCHAR(15),
    marca          VARCHAR(1000),
    colecao        VARCHAR(1000),
    largura        NUMERIC(10,3) default 0.2,
    altura         NUMERIC(10,3) default 0.2,
    profundidade   NUMERIC(10,3) default 0.2,
    peso           NUMERIC(10,3),
    tituloso       VARCHAR(1000),
    descricaoso    VARCHAR(1000),
    descricaocurta VARCHAR(1000),
    descricaolonga VARCHAR(5000),
    palavraschave  VARCHAR(1000)
);

CREATE TABLE orders (
    idpedido             INTEGER NOT NULL PRIMARY KEY,
    numeropedido         VARCHAR(50) NOT NULL,
    nomecliente          VARCHAR(1000) NOT NULL,
    cpfcnpjcliente       VARCHAR(20) NOT NULL,
    tipopedido           VARCHAR(50) NOT NULL,
    statussincronismo    BOOLEAN NOT NULL DEFAULT FALSE,
    observacao           VARCHAR(5000),
    pedidosty            INTEGER,
    statusped            VARCHAR(50),
    liberado             VARCHAR(50) default 'false',
    created_at           TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE order_itens (
    iditempedido         SERIAL PRIMARY KEY,
    idpedido             INTEGER NOT NULL,
    barcode              VARCHAR(50),
    indexado             VARCHAR(1000) NOT NULL,
    quantidade           INTEGER NOT NULL,
    precounitario        DECIMAL(13,2) NOT NULL,
    subtotal             DECIMAL(13,2) NOT NULL,

    CONSTRAINT fk_order FOREIGN KEY (idpedido) REFERENCES orders(idpedido)
);

CREATE TABLE cliente_b2b (
    idcliente            SERIAL PRIMARY KEY,
    internocliente       VARCHAR(50) NOT NULL,
    cpfcnpj              VARCHAR(20) NOT NULL,
    nome                 VARCHAR(1000) NOT NULL,
    email                VARCHAR(1000),
    ddd                  VARCHAR(5),
    telefone             VARCHAR(20),
    statuscliente        VARCHAR(20)
);

CREATE TABLE cliente_secundaria (
    idclientesecundario            SERIAL PRIMARY KEY,
    cpfcnpj              VARCHAR(20) NOT NULL,
    nome                 VARCHAR(1000) NOT NULL,
    email                VARCHAR(1000),
    telefone             VARCHAR(20)
);

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE execution_logs (
  id SERIAL PRIMARY KEY,
  script_name VARCHAR(255) NOT NULL,
  output TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);