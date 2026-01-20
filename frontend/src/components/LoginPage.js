import React, { useState } from "react";
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  CircularProgress,
  InputAdornment,
  Divider,
} from "@mui/material";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import API from "../services/api";

function LoginPage({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await API.post("/login", {
        username: username.trim(),
        password,
      });

      if (res.status === 200 && res.data?.token) onLogin(res.data.token);
      else setError("Resposta inválida do servidor.");
    } catch (err) {
      if (err.response) setError(err.response.data?.message || "Usuário ou senha inválidos.");
      else setError("Servidor não respondeu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        px: 2,
        background:
          "radial-gradient(1200px 600px at 10% 10%, rgba(123,92,255,.35), transparent 60%)," +
          "radial-gradient(900px 500px at 90% 20%, rgba(111,121,255,.30), transparent 55%)," +
          "radial-gradient(900px 600px at 50% 100%, rgba(0,200,255,.18), transparent 55%)," +
          "linear-gradient(180deg, #0b1020 0%, #090b12 100%)",
      }}
    >
      <Container maxWidth="xs">
        <Paper
          elevation={0}
          sx={{
            p: 4,
            borderRadius: 4,
            border: "1px solid rgba(255,255,255,.10)",
            backgroundColor: "rgba(255,255,255,.06)",
            backdropFilter: "blur(14px)",
            boxShadow: "0 20px 70px rgba(0,0,0,.45)",
          }}
        >
          <Typography variant="overline" sx={{ color: "rgba(255,255,255,.7)" }}>
            Sistema ETL
          </Typography>

          <Typography variant="h5" sx={{ color: "white", mt: 0.5 }}>
            Stylezee Confecções
          </Typography>

          <Typography variant="body2" sx={{ color: "rgba(255,255,255,.7)", mt: 1 }}>
            Entre para executar sincronizações e acompanhar logs.
          </Typography>

          <Divider sx={{ my: 3, borderColor: "rgba(255,255,255,.10)" }} />

          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              label="Usuário"
              fullWidth
              margin="normal"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonOutlineIcon sx={{ color: "rgba(255,255,255,.75)" }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                "& .MuiInputLabel-root": { color: "rgba(255,255,255,.7)" },
                "& .MuiOutlinedInput-root": {
                  color: "white",
                  backgroundColor: "rgba(0,0,0,.18)",
                  "& fieldset": { borderColor: "rgba(255,255,255,.18)" },
                  "&:hover fieldset": { borderColor: "rgba(255,255,255,.28)" },
                },
              }}
            />

            <TextField
              label="Senha"
              type="password"
              fullWidth
              margin="normal"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockOutlinedIcon sx={{ color: "rgba(255,255,255,.75)" }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                "& .MuiInputLabel-root": { color: "rgba(255,255,255,.7)" },
                "& .MuiOutlinedInput-root": {
                  color: "white",
                  backgroundColor: "rgba(0,0,0,.18)",
                  "& fieldset": { borderColor: "rgba(255,255,255,.18)" },
                  "&:hover fieldset": { borderColor: "rgba(255,255,255,.28)" },
                },
              }}
            />

            {error && (
              <Typography sx={{ mt: 2, color: "#ff6b6b" }} variant="body2">
                {error}
              </Typography>
            )}

            <Button
              type="submit"
              fullWidth
              disabled={loading}
              sx={{
                mt: 3,
                borderRadius: 2,
                py: 1.4,
                color: "white",
                background: "linear-gradient(135deg, #7b5cff 0%, #6f79ff 55%, #00c8ff 120%)",
                boxShadow: "0 14px 35px rgba(123,92,255,.35)",
                "&:hover": { filter: "brightness(1.05)" },
              }}
            >
              {loading ? <CircularProgress size={22} color="inherit" /> : "Entrar"}
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}

export default LoginPage;
