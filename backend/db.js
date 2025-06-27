require("dotenv").config();
const { Pool } = require("pg");

function getPostgresConnection() {
  try {
    const pool = new Pool({
      host: process.env.PG_HOST,
      port: process.env.PG_PORT,
      user: process.env.PG_USER,
      password: process.env.PG_PASSWORD,
      database: process.env.PG_DATABASE,
    });

    console.log("✅ Conexão estabelecida com sucesso Postgres.");

    return pool;
  } catch (error) {
    console.error("Erro na conexão com PostgreSQL:", error);
    throw error;
  }
}

module.exports = getPostgresConnection;
