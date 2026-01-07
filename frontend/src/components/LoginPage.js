import React, { useState } from "react";
import {
  Container,
  TextField,
  Button,
  Typography,
  Box,
  useTheme,
  CircularProgress,
} from "@mui/material";

import API from "../services/api";

function LoginPage({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const theme = useTheme();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await API.post("/login", {
        username: username.trim(),
        password,
      });

      console.log("LOGIN RESPONSE:", res.data);

      if (res.status === 200 && res.data?.token) {
        onLogin(res.data.token);
      } else {
        setError("Resposta inválida do servidor.");
      }
    } catch (err) {
      console.error("ERRO LOGIN:", err);

      if (err.response) {
        setError(err.response.data?.message || "Usuário ou senha inválidos.");
      } else {
        setError("Servidor não respondeu.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background:
          theme.palette.mode === "dark"
            ? `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, #000000 100%)`
            : `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.secondary.main} 100%)`,
        padding: 2,
      }}
    >
      <Typography variant="h5" color="white" mb={4}>
        Bem-vindo ao Sistema ETL
      </Typography>

      <Container maxWidth="xs">
        <Box
          p={4}
          sx={{
            borderRadius: "16px",
            bgcolor: theme.palette.background.paper,
            boxShadow: theme.shadows[10],
            background:
              theme.palette.mode === "dark"
                ? `linear-gradient(45deg, ${theme.palette.background.paper}, ${theme.palette.grey[900]})`
                : `linear-gradient(45deg, ${theme.palette.background.paper}, ${theme.palette.grey[50]})`,
          }}
        >
          <Typography
            variant="h5"
            align="center"
            gutterBottom
            sx={{ fontWeight: "bold" }}
          >
            Stylezee Confecções
          </Typography>

          <form onSubmit={handleSubmit}>
            <TextField
              label="Usuário"
              fullWidth
              margin="normal"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              InputProps={{
                startAdornment: <Box mr={1}>👤</Box>,
                sx: { borderRadius: "12px" },
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
                startAdornment: <Box mr={1}>🔒</Box>,
                sx: { borderRadius: "12px" },
              }}
            />

            {error && (
              <Typography
                color="error"
                variant="body2"
                mt={2}
                align="center"
              >
                {error}
              </Typography>
            )}

            <Box mt={3}>
              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={loading}
                sx={{
                  borderRadius: "12px",
                  py: 1.5,
                  fontWeight: "bold",
                }}
              >
                {loading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  "Entrar"
                )}
              </Button>
            </Box>
          </form>
        </Box>
      </Container>
    </Box>
  );
}

export default LoginPage;
