require("dotenv").config();
const { Pool } = require("pg");

// Função genérica para criar pools
function createPool(config) {
  const pool = new Pool(config);
  pool.on("connect", (client) => {
    client.query("SET client_encoding TO 'UTF8';");
  });
  return pool;
}

// Conexão Loja 1 (Málagah)
const pool1 = createPool({
  host: process.env.PG_HOST,
  port: process.env.PG_PORT,
  user: process.env.PG_USER,
  password: process.env.PG_PASSWORD,
  database: process.env.PG_DATABASE,
});

// Conexão Loja 2 (It's My)
const pool2 = createPool({
  host: process.env.PG_HOST,
  port: process.env.PG_PORT,
  user: process.env.PG_USER,
  password: process.env.PG_PASSWORD,
  database: process.env.PG_DATABASE_2,
});

// Exporta um objeto com as opções
module.exports = {
  getPostgresConnection: () => pool1,
  getPostgresConnection2: () => pool2
};