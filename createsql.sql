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
    idpedido integer NOT NULL,
    numeropedido character varying(50) NOT NULL,
    nomecliente character varying(1000) NOT NULL,
    cpfcnpjcliente character varying(20) NOT NULL,
    tipopedido character varying(50) NOT NULL,
    statussincronismo boolean DEFAULT false NOT NULL,
    observacao character varying(5000),
    pedidosty integer,
    statusped character varying(50),
    liberado boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    email character varying,
    telefone character varying,
    estado character varying,
    transportadora character varying,
    pagamento character varying,
    parcelamento character varying,
    bandeira character varying,
    qtdpecas character varying,
    valorpedido money,
    pedidobling character varying,
    nfebling character varying,
    nfeid character varying,
    valornota money,
    valorfrete money,
    datapedido date
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