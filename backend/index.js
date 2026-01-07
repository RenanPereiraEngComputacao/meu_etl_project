require("dotenv").config();
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { spawn } = require("child_process");
const path = require("path");
const axios = require("axios");

const {
  getPostgresConnection,
  getPostgresConnection2
} = require("./db");

const resolveTenant = require("./middlewares/tenant");

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || "umsegredoseguro";

// ============================================================================
// MIDDLEWARE DE AUTENTICAÇÃO (JWT)
// ============================================================================
function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Token não informado" });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: "Token inválido" });
    }

    req.user = user;
    next();
  });
}

// ============================================================================
// LOGIN (NÃO USA TENANT)
// ============================================================================
app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    // Login SEMPRE usa banco principal
    const pool = getPostgresConnection();

    const result = await pool.query(
      "SELECT * FROM users WHERE username = $1",
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ message: "Usuário não encontrado" });
    }

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);

    if (!valid) {
      return res.status(400).json({ message: "Senha incorreta" });
    }

    const token = jwt.sign(
      {
        id: user.id,
        username: user.username
      },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.json({ token });
  } catch (error) {
    console.error("Erro no login:", error);
    res.status(500).json({ message: "Erro interno do servidor" });
  }
  app.post("/api/login", async (req, res) => {
  console.log("LOGIN BODY:", req.body);
  console.log("HEADERS:", req.headers);

  const { username, password } = req.body;
});
});


// ============================================================================
// BLING – OAUTH CALLBACK
// ============================================================================
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;

app.get("/bling/callback", async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.status(400).send("Nenhum code recebido do Bling.");
  }

  try {
    const tokenUrl = "https://www.bling.com.br/Api/v3/oauth/token";
    const basicAuth = Buffer.from(
      `${CLIENT_ID}:${CLIENT_SECRET}`
    ).toString("base64");

    const response = await axios.post(
      tokenUrl,
      new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: "http://localhost:3001/bling/callback"
      }).toString(),
      {
        headers: {
          Authorization: `Basic ${basicAuth}`,
          "Content-Type": "application/x-www-form-urlencoded"
        }
      }
    );

    console.log("TOKEN BLING RECEBIDO:", response.data);

    res.send("Token recebido com sucesso! Pode fechar esta janela.");
  } catch (error) {
    console.error(
      "Erro Bling callback:",
      error.response?.data || error
    );
    res.status(500).send("Erro ao obter token Bling.");
  }
});

// ============================================================================
// BLING – TOKEN MANAGEMENT
// ============================================================================
async function getValidToken() {
  const pool = getPostgresConnection();

  const result = await pool.query(
    "SELECT * FROM bling_tokens ORDER BY created_at DESC LIMIT 1"
  );

  const tokenData = result.rows[0];
  if (!tokenData) throw new Error("Token Bling não encontrado");

  const criadoEm = new Date(tokenData.created_at).getTime();
  const expirou =
    (Date.now() - criadoEm) / 1000 >= tokenData.expires_in;

  if (!expirou) return tokenData.access_token;

  return await refreshBlingToken(tokenData.refresh_token);
}

async function refreshBlingToken(refreshToken) {
  const basicAuth = Buffer.from(
    `${CLIENT_ID}:${CLIENT_SECRET}`
  ).toString("base64");

  const { data } = await axios.post(
    "https://www.bling.com.br/Api/v3/oauth/token",
    new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken
    }).toString(),
    {
      headers: {
        Authorization: `Basic ${basicAuth}`,
        "Content-Type": "application/x-www-form-urlencoded"
      }
    }
  );

  const pool = getPostgresConnection();

  await pool.query(
    `INSERT INTO bling_tokens 
     (access_token, refresh_token, expires_in)
     VALUES ($1,$2,$3)`,
    [data.access_token, data.refresh_token, data.expires_in]
  );

  return data.access_token;
}

// ============================================================================
// BLING REQUEST HELPER
// ============================================================================
async function blingRequest(method, endpoint, paramsOrData = null) {
  const token = await getValidToken();

  const config = {
    method,
    url: `https://www.bling.com.br/Api/v3${endpoint}`,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    }
  };

  if (method.toUpperCase() === "GET") {
    config.params = paramsOrData;
  } else {
    config.data = paramsOrData;
  }

  return axios(config);
}

// ============================================================================
// BLING ENDPOINTS
// ============================================================================
app.get("/bling/pedidos/vendas", async (req, res) => {
  try {
    const params = {};
    if (req.query.pagina) params.pagina = req.query.pagina;

    const filtro =
      req.query["numerosLojas[]"] || req.query.numLojas;

    if (filtro) {
      params["numerosLojas[]"] = Array.isArray(filtro)
        ? filtro
        : [filtro];
    }

    const result = await blingRequest(
      "GET",
      "/pedidos/vendas",
      params
    );

    res.json(result.data);
  } catch (error) {
    console.error(error.response?.data || error);
    res.status(500).send("Erro Bling vendas");
  }
});

app.get("/bling/nfe", async (req, res) => {
  try {
    const { numeroLoja } = req.query;
    if (!numeroLoja) {
      return res
        .status(400)
        .json({ message: "numeroLoja obrigatório" });
    }

    const result = await blingRequest("GET", "/nfe", {
      numeroLoja
    });

    res.json(result.data);
  } catch (error) {
    console.error(error.response?.data || error);
    res.status(500).send("Erro NF-e");
  }
});

app.get("/bling/nfe_detalhe", async (req, res) => {
  try {
    if (!req.query.id) {
      return res.status(400).json({ message: "id obrigatório" });
    }

    const result = await blingRequest(
      "GET",
      `/nfe/${req.query.id}`
    );

    res.json(result.data);
  } catch (error) {
    console.error(error.response?.data || error);
    res.status(500).send("Erro detalhe NF-e");
  }
});

// ============================================================================
// A PARTIR DAQUI → TOKEN + TENANT
// ============================================================================
app.use("/api", authenticateToken, resolveTenant);

// ============================================================================
// EXECUÇÃO DE SCRIPTS PYTHON
// ============================================================================
app.post("/api/run-script/:scriptName", (req, res) => {
  const scriptPath = path.resolve(
    __dirname,
    "../",
    req.params.scriptName
  );

  const org = req.organization;

  const processPy = spawn("python", [
    scriptPath,
    "--org",
    org
  ]);

  let output = "";

  processPy.stdout.on("data", d => (output += d.toString()));
  processPy.stderr.on("data", d => (output += d.toString()));

  processPy.on("close", code => {
    res.json({ exitCode: code, output });
  });
});







// ============================================================================
// LOGS
// ============================================================================
app.get(
  "/api/logs",
  authenticateToken,
  resolveTenant,
  async (req, res) => {
    const { script, limit = 20 } = req.query;

    if (!script) {
      return res.status(400).json({ message: "Script não informado" });
    }

    try {
      // DEBUG (remova depois)
      const dbInfo = await req.db.query("SELECT current_database()");
      console.log("DB USADO:", dbInfo.rows[0]);

      const result = await req.db.query(
        `
        SELECT id, script_name, output, created_at
        FROM execution_logs
        WHERE script_name ILIKE $1
        ORDER BY created_at DESC
        LIMIT $2
        `,
        [`%${script}%`, limit]
      );

      res.json(result.rows);
    } catch (error) {
      console.error("Erro ao buscar logs:", error);
      res.status(500).json({ message: "Erro ao buscar logs" });
    }
  }
);
// ============================================================================
// LISTAGEM
// ============================================================================
app.get("/api/list", async (req, res) => {
  try {
    const result = await req.db.query(
      "SELECT * FROM orders ORDER BY created_at DESC"
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Erro list:", error);
    res.status(500).json({ message: "Erro ao buscar lista" });
  }
});

// ============================================================================
// SERVER
// ============================================================================
const PORT = process.env.PORT || 3001;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ API rodando na porta ${PORT}`);
});
