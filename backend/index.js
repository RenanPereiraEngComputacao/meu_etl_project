require("dotenv").config();
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { spawn } = require("child_process");
const path = require("path");
const axios = require("axios");
const getPostgresConnection = require("./db");

const app = express();
app.use(cors());
app.use(express.json());

const pool = getPostgresConnection();
const JWT_SECRET = process.env.JWT_SECRET || "umsegredoseguro";

// ============================================================================
// MIDDLEWARE DE AUTENTICAÇÃO
// ============================================================================
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

// ============================================================================
// OAUTH BLING – CALLBACK
// ============================================================================
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;

app.get("/bling/callback", async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.status(400).send("Nenhum code foi recebido do Bling.");
  }

  try {
    const tokenUrl = "https://www.bling.com.br/Api/v3/oauth/token";

    const basicAuth = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64");

   const response = await axios.post(
      tokenUrl,
      new URLSearchParams({
        grant_type: "authorization_code",
        code: code,
        redirect_uri: "http://localhost:3001/bling/callback" // OBRIGATÓRIO
      }).toString(),
      {
        headers: {
          "Authorization": `Basic ${basicAuth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        }
      }
    );


    console.log("TOKEN RECEBIDO:", response.data);

    res.send("Token recebido com sucesso! Você já pode fechar esta janela.");
  } catch (error) {
    console.error("Erro ao trocar code por token:", error.response?.data || error);
    res.status(500).send("Erro ao obter token do Bling.");
  }
});


async function getValidToken() {
  // 1. Buscar do banco
  const result = await pool.query(
    "SELECT * FROM bling_tokens ORDER BY created_at DESC LIMIT 1"
  );

  const tokenData = result.rows[0];
  if (!tokenData) throw new Error("Token não encontrado no banco.");

  const criadoEm = new Date(tokenData.created_at).getTime();
  const agora = Date.now();
  const expirou = (agora - criadoEm) / 1000 >= tokenData.expires_in;

  // 2. Se ainda estiver válido, retorna o access_token
  if (!expirou) {
    return tokenData.access_token;
  }

  // 3. Caso tenha expirado → chamar refresh_token
  return await refreshBlingToken(tokenData.refresh_token);
}


async function refreshBlingToken(refreshToken) {
  const basicAuth = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64");

  const { data } = await axios.post(
    "https://www.bling.com.br/Api/v3/oauth/token",
    new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken
    }).toString(),
    {
      headers: {
        "Authorization": `Basic ${basicAuth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      }
    }
  );

  // Atualiza banco
  await pool.query(
    "INSERT INTO bling_tokens (access_token, refresh_token, expires_in) VALUES ($1,$2,$3)",
    [data.access_token, data.refresh_token, data.expires_in]
  );

  return data.access_token;
}

// ============================================================================
// FUNÇÃO CRÍTICA (FIX): BLING REQUEST
// Agora aceita 'params' ou 'data' no terceiro argumento, dependendo do método.
// ============================================================================
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

  // Se for GET, o terceiro argumento (paramsOrData) deve ser os Query Parameters ('params')
  if (method.toUpperCase() === 'GET') {
    config.params = paramsOrData;
  } else {
    // Para POST, PUT, etc., o terceiro argumento é o Request Body ('data')
    config.data = paramsOrData;
  }
  
  return axios(config);
}


app.get("/bling/pedidos/vendas", async (req, res) => {
  try {
    // Lendo a paginação
    const { pagina } = req.query; 

    // 1. Identifica o valor do filtro, aceitando tanto o simplificado (Python)
    // quanto o parâmetro padrão do Bling, que o Express pode parsear como 'numerosLojas[]'.
    const numLojasPython = req.query.numLojas;
    const numLojasBling = req.query['numerosLojas[]'];
    
    // Prioriza o filtro Bling, depois o simplificado do Python
    const filterValue = numLojasBling || numLojasPython;

    // 2. Cria o objeto de parâmetros para enviar ao Bling.
    const paramsObject = {};

    if (pagina) {
      paramsObject.pagina = pagina;
    }

    // 3. Se houver qualquer valor de filtro, traduz para o formato de array do Bling.
    if (filterValue) {
      // Garante que o valor (string ou array) seja tratado como array para o Bling
      const lojasArray = Array.isArray(filterValue) ? filterValue : [filterValue];
      
      // A chave para o filtro Bling é 'numerosLojas[]'
      paramsObject['numerosLojas[]'] = lojasArray;
    }
    
    // 4. Passa o objeto de parâmetros para a função auxiliar.
    // O 'paramsObject' será atribuído corretamente à propriedade 'params' dentro de blingRequest.
    const result = await blingRequest(
      "GET",
      // Endpoint sem a query string, pois ela será construída pelo blingRequest
      "/pedidos/vendas", 
      paramsObject 
    );

    res.json(result.data);

  } catch (error) {
    console.error("Erro no /bling/pedidos/vendas:", error.response?.data || error);
    // Verifique o corpo do erro retornado pelo Bling para diagnóstico
    res.status(500).send("Erro ao consultar pedidos de vendas.");
  }
});

// --- ESTE ENDPOINT ESTÁ CORRETO PARA FILTRO SIMPLES ---
app.get("/bling/nfe", async (req, res) => {
  try {
    const { numeroLoja } = req.query;

    if (!numeroLoja) {
      return res.status(400).json({ message: "numeroLoja é obrigatório" });
    }

    // Para a NF-e, o parâmetro é 'numeroLoja' (sem array) e simples.
    const paramsObject = { numeroLoja };

    const result = await blingRequest(
      "GET",
      "/nfe", // Endpoint sem query string
      paramsObject // Passa o objeto de params
    );

    res.json(result.data);

  } catch (error) {
    console.error("Erro no /bling/nfe:", error.response?.data || error);
    res.status(500).send("Erro ao consultar NF-e.");
  }
});
// ============================================================================
// LOGIN
// ============================================================================
app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const result = await pool.query(
      "SELECT * FROM users WHERE username = $1",
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ message: "Usuário não encontrado." });
    }

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);

    if (!valid) {
      return res.status(400).json({ message: "Senha incorreta." });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.json({ token });
  } catch (error) {
    console.error("Erro no login:", error);
    res.status(500).json({ message: "Erro interno do servidor." });
  }
});

// ============================================================================
// EXECUTAR SCRIPTS PYTHON
// ============================================================================
app.post("/api/run-script/:scriptName", authenticateToken, (req, res) => {
  const scriptName = req.params.scriptName;

  const allowedScripts = [
    "att_estoque.py",
    "att_produtos.py",
    "sync_order.py",
    "att_clientes.py",
    "libera_pedido.py",
  ];

  if (!allowedScripts.includes(scriptName)) {
    return res.status(400).json({ message: "Script não permitido." });
  }

  const scriptPath = path.resolve(__dirname, "../", scriptName);
  const processPy = spawn("python", [scriptPath]);

  let output = "";

  processPy.stdout.on("data", (data) => {
    output += data.toString("utf8");
  });

  processPy.stderr.on("data", (data) => {
    output += "ERROR: " + data.toString("utf8");
  });

  processPy.on("close", async (code) => {
    res.json({
      message: "Execução finalizada.",
      exitCode: code,
      output,
    });
  });
});

// ============================================================================
// LOGS
// ============================================================================
app.get("/api/logs", authenticateToken, async (req, res) => {
  const { script, limit } = req.query;

  const queryParams = [];
  let query = "SELECT * FROM execution_logs";

  if (script) {
    queryParams.push(script);
    query += ` WHERE script_name = $${queryParams.length}`;
  }

  query += " ORDER BY created_at DESC";

  const limitValue = parseInt(limit) || 20;
  queryParams.push(limitValue);
  query += ` LIMIT $${queryParams.length}`;

  try {
    const result = await pool.query(query, queryParams);
    res.json(result.rows);
  } catch (error) {
    console.error("Erro ao buscar logs:", error);
    res.status(500).json({ message: "Erro ao buscar logs." });
  }
});

// ============================================================================
// LISTAGEM DE PEDIDOS
// ============================================================================
app.get("/api/list", authenticateToken, async (req, res) => {
  try {
    const query = "SELECT * FROM public.orders ORDER BY created_at DESC";
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error("Erro ao buscar pedidos:", error);
    res.status(500).json({ message: "Erro ao buscar pedidos." });
  }
});

// ============================================================================
// SERVIDOR
// ============================================================================
const PORT = process.env.PORT || 3001;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ API rodando na porta ${PORT}`);
});