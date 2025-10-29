import React, { useState } from "react";
import {
  Container,
  TextField,
  Button,
  Typography,
  Box,
  Link, // Adicionado para "Criar conta" e "Esqueceu a senha?"
  useTheme, // Adicionado para acessar o tema
} from "@mui/material";
// Certifique-se de que este caminho está correto para seu arquivo de API
import API from "../services/api"; 

// O componente agora recebe 'onLogin' como prop
function LoginPage({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  
  // Hook para acessar o tema atual (claro ou escuro)
  const theme = useTheme(); 

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); // Limpa erro anterior
    try {
      const res = await API.post("/login", { username, password });
      // Assumindo que a API retorna um token
      onLogin(res.data.token); 
    } catch (err) {
      // Mensagem de erro mais amigável
      setError("Usuário ou senha inválidos. Tente novamente."); 
    }
  };

  return (
    // Box para criar o fundo de tela cheia com gradiente (simulando a Imagem 2)
    <Box
      sx={{
        // Altura total da viewport
        minHeight: '100vh', 
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        // Estilo de fundo com gradiente que se adapta ao tema
        background: 
          theme.palette.mode === 'dark'
            ? `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, #000000 100%)`
            : `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.secondary.main} 100%)`,
        padding: 2, // Espaçamento interno
      }}
    >
      {/* Título de boas-vindas */}
      <Typography variant="h5" color="white" mb={4}>
        Bem Vindo ao Sistema ETL
      </Typography>

      {/* Container principal do formulário de login */}
      <Container maxWidth="xs">
        <Box 
          p={4} 
          // Card de login com um fundo que se adapta ao tema
          sx={{
            borderRadius: '16px',
            // Usando 'paper' que é a cor de fundo de elementos em caixa
            bgcolor: theme.palette.background.paper, 
            boxShadow: theme.shadows[10], // Sombra mais proeminente
            // Adicionando um leve gradiente interno ou cor de overlay
            background: 
              theme.palette.mode === 'dark'
                ? `linear-gradient(45deg, ${theme.palette.background.paper}, ${theme.palette.grey[900]})`
                : `linear-gradient(45deg, ${theme.palette.background.paper}, ${theme.palette.grey[50]})`,
          }}
        >
          {/* Título do Card */}
          <Typography variant="h5" align="center" gutterBottom 
            sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}>
            Stylezee Confecções
          </Typography>

          <form onSubmit={handleSubmit}>
            {/* Campo Usuário */}
            <TextField
              label="Usuário" // Alterado para inglês conforme Imagem 2
              fullWidth
              margin="normal"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              // Estilo de input mais arredondado e com ícone
              InputProps={{ 
                startAdornment: (
                  <Box mr={1}>👤</Box> // Ícone de usuário simples
                ),
                sx: { borderRadius: '12px' }
              }}
              variant="outlined"
            />
            
            {/* Campo Senha */}
            <TextField
              label="Senha" // Alterado para inglês conforme Imagem 2
              type="password"
              fullWidth
              margin="normal"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              // Estilo de input mais arredondado e com ícone
              InputProps={{ 
                startAdornment: (
                  <Box mr={1}>🔒</Box> // Ícone de cadeado simples
                ),
                sx: { borderRadius: '12px'}
              }}
              variant="outlined"
            />
            
            {/* Opções (Lembrar e Esqueceu a Senha) */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mt={1}>
              <Box display="flex" alignItems="center">
                {/* Você pode adicionar um Checkbox aqui se quiser "Remember me" */}
                <Typography variant="body2" color="text.secondary">
                   <input type="checkbox" id="remember" /> 
                   <label htmlFor="remember">Lembrar Senha</label>
                </Typography>
              </Box>
            </Box>

            {/* Mensagem de Erro */}
            {error && (
              <Typography color="error" variant="body2" mt={2} align="center">
                {error}
              </Typography>
            )}

            {/* Botão de Login */}
            <Box mt={3}>
              <Button 
                type="submit" 
                variant="contained" 
                color="primary" 
                fullWidth
                // Estilo do botão mais arredondado
                sx={{ borderRadius: '12px', py: 1.5, fontWeight: 'bold' }} 
              >
                Entrar
              </Button>
            </Box>
          </form>
        </Box>
      </Container>
      
      {/* Opção para criar uma nova conta */}
      {/*<Typography variant="body1" color="white" mt={4}>
        To create a new account. <Link href="#" color="inherit" sx={{ fontWeight: 'bold' }}>Click here</Link>
      </Typography>*/}
      
    </Box>
  );
}

export default LoginPage;