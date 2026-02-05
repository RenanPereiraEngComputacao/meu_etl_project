/**
 * index.js (REFATORADO)
 *
 * ✅ Bling separado por banco (sem tenant/JWT nos endpoints Bling):
 *    - /bling1/*  -> usa getPostgresConnection()   (DB principal)
 *    - /bling2/*  -> usa getPostgresConnection2()  (DB secundário)
 *
 * ✅ Callbacks separados:
 *    - /bling1/callback -> salva tokens no DB1
 *    - /bling2/callback -> salva tokens no DB2
 *
 * ✅ Mantém /api/* com JWT + resolveTenant (seu multi-tenant atual)
 * ✅ Corrige bug do /api/login duplicado
 *
 * IMPORTANTE:
 * - Configure no Bling dois redirect_uri:
 *   1) http://localhost:3001/bling1/callback
 *   2) http://localhost:3001/bling2/callback
 *
 * - Seus scripts Python ficam simples:
 *   script DB1 -> chama /bling1/pedidos/vendas, /bling1/nfe, /bling1/nfe_detalhe
 *   script DB2 -> chama /bling2/pedidos/vendas, /bling2/nfe, /bling2/nfe_detalhe
 */

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { spawn } = require("child_process");
const path = require("path");
const axios = require("axios");

const { getPostgresConnection, getPostgresConnection2 } = require("./db");
const resolveTenant = require("./middlewares/tenant");

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || "umsegredoseguro";
const PORT = process.env.PORT || 3001;

// ============================================================================
// JWT AUTH
// ============================================================================
function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return res.status(401).json({ message: "Token não informado" });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: "Token inválido" });
    req.user = user;
    next();
  });
}

// ============================================================================
// LOGIN (NÃO USA TENANT) - CORRIGIDO (sem rota duplicada)
// ============================================================================
// ============================================================================
// LOGIN (NÃO USA TENANT) - 1 ROTA SÓ (COM LOGS)
// ============================================================================
app.post("/api/login", async (req, res) => {
  console.log("LOGIN BODY:", req.body);
  console.log("HEADERS:", req.headers);

  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ message: "username e password são obrigatórios" });
  }

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

    if (!user.password_hash) {
      return res.status(500).json({
        message: "Usuário não possui password_hash no banco.",
      });
    }

    const valid = await bcrypt.compare(password, user.password_hash);

    if (!valid) {
      return res.status(400).json({ message: "Senha incorreta" });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    return res.json({ token });
  } catch (error) {
    console.error("Erro no login:", error);
    return res.status(500).json({ message: "Erro interno do servidor" });
  }
});


// ============================================================================
// BLING CONFIG
// ============================================================================
const BLING_APPS = {
  bling1: {
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
  },
  bling2: {
    clientId: process.env.CLIENT_ID_ITSMY,
    clientSecret: process.env.CLIENT_SECRET_ITSMY,
  },
};

function getBlingApp(label) {
  const app = BLING_APPS[label];

  if (!app?.clientId || !app?.clientSecret) {
    console.warn(
      `⚠️ CLIENT_ID / CLIENT_SECRET não encontrados para ${label}`
    );
    throw new Error(`Configuração Bling inválida: ${label}`);
  }

  return app;
}

function buildBasicAuth(label) {
  const { clientId, clientSecret } = getBlingApp(label);
  return Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
}

// ============================================================================
// BLING ROUTER FACTORY (1 router por banco)
// ============================================================================
function createBlingRouter({ getPool, label, redirectUri, blingApp }) {
  const router = express.Router();

  async function getValidToken() {
    const pool = getPool();

    const result = await pool.query(
      "SELECT * FROM bling_tokens ORDER BY created_at DESC LIMIT 1"
    );

    const tokenData = result.rows[0];
    if (!tokenData) throw new Error(`[${label}] Token Bling não encontrado`);

    const criadoEm = new Date(tokenData.created_at).getTime();
    const expirou = (Date.now() - criadoEm) / 1000 >= tokenData.expires_in;

    if (!expirou) return tokenData.access_token;

    return await refreshBlingToken(tokenData.refresh_token);
  }

  async function refreshBlingToken(refreshToken) {
    const basicAuth = buildBasicAuth(blingApp);

    const { data } = await axios.post(
      "https://www.bling.com.br/Api/v3/oauth/token",
      new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }).toString(),
      {
        headers: {
          Authorization: `Basic ${basicAuth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const pool = getPool();

    await pool.query(
      `INSERT INTO bling_tokens (access_token, refresh_token, expires_in)
       VALUES ($1,$2,$3)`,
      [data.access_token, data.refresh_token, data.expires_in]
    );

    console.log(`🔁 [${label}] Token Bling atualizado (refresh).`);
    return data.access_token;
  }

  async function blingRequest(method, endpoint, paramsOrData = null) {
    const token = await getValidToken();

    const config = {
      method,
      url: `https://www.bling.com.br/Api/v3${endpoint}`,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    };

    if (method.toUpperCase() === "GET") config.params = paramsOrData;
    else config.data = paramsOrData;

    return axios(config);
  }

  // --------------------------------------------------------------------------
  // (Opcional) Endpoint pra iniciar auth (só gera URL).
  // Você pode usar isso no front se quiser.
  // --------------------------------------------------------------------------
router.get("/auth-url", (req, res) => {
  const { clientId } = getBlingApp(blingApp);

  const authUrl =
    `https://www.bling.com.br/Api/v3/oauth/authorize` +
    `?response_type=code` +
    `&client_id=${encodeURIComponent(clientId)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}`;

  res.json({ authUrl, redirect_uri: redirectUri, label, blingApp });
});
  // --------------------------------------------------------------------------
  // Callback (troca code por token e salva no DB desse router)
  // --------------------------------------------------------------------------
  router.get("/callback", async (req, res) => {
    const { code } = req.query;

    if (!code) {
      return res.status(400).send("Nenhum code recebido do Bling.");
    }

    try {
      const tokenUrl = "https://www.bling.com.br/Api/v3/oauth/token";
      const basicAuth = buildBasicAuth(blingApp);

      const response = await axios.post(
        tokenUrl,
        new URLSearchParams({
          grant_type: "authorization_code",
          code,
          redirect_uri: redirectUri,
        }).toString(),
        {
          headers: {
            Authorization: `Basic ${basicAuth}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );

      const pool = getPool();

      await pool.query(
        `INSERT INTO bling_tokens (access_token, refresh_token, expires_in)
         VALUES ($1,$2,$3)`,
        [
          response.data.access_token,
          response.data.refresh_token,
          response.data.expires_in,
        ]
      );

      console.log(`✅ [${label}] TOKEN BLING salvo com sucesso.`);
      res.send(
        `Token recebido e salvo com sucesso (${label}). Pode fechar esta janela.`
      );
    } catch (error) {
      console.error(
        `Erro Bling callback [${label}]:`,
        error.response?.data || error
      );
      res.status(500).send("Erro ao obter token Bling.");
    }
  });

  // --------------------------------------------------------------------------
  // ENDPOINTS (sem JWT/tenant) -> ideais para seus scripts Python
  // --------------------------------------------------------------------------
  router.get("/pedidos/vendas", async (req, res) => {
    try {
      const params = {};
      if (req.query.pagina) params.pagina = req.query.pagina;

      const filtro = req.query["numerosLojas[]"] || req.query.numLojas;
      if (filtro) {
        params["numerosLojas[]"] = Array.isArray(filtro) ? filtro : [filtro];
      }

      const result = await blingRequest("GET", "/pedidos/vendas", params);
      res.json(result.data);
    } catch (error) {
      console.error(error.response?.data || error);
      res.status(500).send(`Erro Bling vendas (${label})`);
    }
  });

  router.get("/nfe", async (req, res) => {
    try {
      const { numeroLoja } = req.query;
      if (!numeroLoja) {
        return res.status(400).json({ message: "numeroLoja obrigatório" });
      }

      const result = await blingRequest("GET", "/nfe", { numeroLoja });
      res.json(result.data);
    } catch (error) {
      console.error(error.response?.data || error);
      res.status(500).send(`Erro NF-e (${label})`);
    }
  });

  router.get("/nfe_detalhe", async (req, res) => {
    try {
      if (!req.query.id) {
        return res.status(400).json({ message: "id obrigatório" });
      }

      const result = await blingRequest("GET", `/nfe/${req.query.id}`);
      res.json(result.data);
    } catch (error) {
      console.error(error.response?.data || error);
      res.status(500).send(`Erro detalhe NF-e (${label})`);
    }
  });

  return router;
}

// ============================================================================
// BLING1 (DB principal) e BLING2 (DB secundário)
// ============================================================================
const REDIRECT_URI_1 =
  process.env.BLING_REDIRECT_URI_1 || "http://localhost:3001/bling1/callback";
const REDIRECT_URI_2 =
  process.env.BLING_REDIRECT_URI_2 || "http://localhost:3001/bling2/callback";

app.use(
  "/bling1",
  createBlingRouter({
    getPool: getPostgresConnection,
    label: "bling1-db1",
    redirectUri: REDIRECT_URI_1,
    blingApp: "bling1",
  })
);

app.use(
  "/bling2",
  createBlingRouter({
    getPool: getPostgresConnection2,
    label: "bling2-db2",
    redirectUri: REDIRECT_URI_2,
    blingApp: "bling2",
  })
);

// ============================================================================
// A PARTIR DAQUI → /api usa JWT + TENANT (igual seu padrão atual)
// ============================================================================
app.use("/api", authenticateToken, resolveTenant);

// ============================================================================
// EXECUÇÃO DE SCRIPTS PYTHON (mantido)
// Observação: você pode rodar scripts diferentes por tenant pelo org.
// ============================================================================
app.post("/api/run-script/:scriptName", (req, res) => {
  const scriptPath = path.resolve(__dirname, "../", req.params.scriptName);

  const org = req.organization; // vindo do resolveTenant

  const processPy = spawn("python", [scriptPath, "--org", org]);

  let output = "";

  processPy.stdout.on("data", (d) => (output += d.toString()));
  processPy.stderr.on("data", (d) => (output += d.toString()));

  processPy.on("close", (code) => {
    res.json({ exitCode: code, output });
  });
});

// ============================================================================
// LOGS (mantido) - resolveTenant deve setar req.db
// ============================================================================
app.get("/api/logs", async (req, res) => {
  const { script, limit = 20 } = req.query;

  if (!script) {
    return res.status(400).json({ message: "Script não informado" });
  }

  try {
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
});

// ============================================================================
// LISTAGEM (mantido)
// ============================================================================
app.get("/api/list", async (req, res) => {
  try {
    const result = await req.db.query(
      "SELECT * FROM orders ORDER BY idpedido DESC"
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
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ API rodando na porta ${PORT}`);
  console.log("➡️  Bling DB1:", `http://localhost:${PORT}/bling1/pedidos/vendas`);
  console.log("➡️  Bling DB2:", `http://localhost:${PORT}/bling2/pedidos/vendas`);
  console.log("➡️  Callback 1:", REDIRECT_URI_1);
  console.log("➡️  Callback 2:", REDIRECT_URI_2);
});
