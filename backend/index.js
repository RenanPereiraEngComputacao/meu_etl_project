require("dotenv").config();
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { spawn } = require("child_process");
const path = require("path");
const getPostgresConnection = require("./db");

const app = express();
app.use(cors());
app.use(express.json());

const pool = getPostgresConnection();
const JWT_SECRET = process.env.JWT_SECRET || "umsegredoseguro";

// Middleware de autenticação JWT
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

// Rota de login
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

// Rota para executar script Python
app.post("/api/run-script/:scriptName", authenticateToken, (req, res) => {
  const scriptName = req.params.scriptName;

  const allowedScripts = [
    "att_estoque.py",
    "att_produtos.py",
    "sync_order.py",
    "att_clientes.py",
  ];

  if (!allowedScripts.includes(scriptName)) {
    return res.status(400).json({ message: "Script não permitido." });
  }

  // Caminho absoluto dos scripts na raiz do projeto
  const scriptPath = path.resolve(__dirname, "../", scriptName);
  const process = spawn("python", [scriptPath]);

  let output = "";

  process.stdout.on("data", (data) => {
  output += data.toString("utf8");
  });

  process.stderr.on("data", (data) => {
    output += "ERROR: " + data.toString("utf8");
  });

  process.on("close", async (code) => {
    try {
      await pool.query(
        "INSERT INTO execution_logs (script_name, output) VALUES ($1, $2)",
        [scriptName, output]
      );

      res.json({
        message: "Execução finalizada.",
        exitCode: code,
        output,
      });
    } catch (error) {
      console.error("Erro ao salvar log:", error);
      res.status(500).json({ message: "Erro ao registrar log." });
    }
  });
});

// Rota para buscar logs
app.get("/api/logs", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM execution_logs ORDER BY created_at DESC LIMIT 50"
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Erro ao buscar logs:", error);
    res.status(500).json({ message: "Erro ao buscar logs." });
  }
});

// Inicializa o servidor
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ API rodando na porta ${PORT}`);
});
