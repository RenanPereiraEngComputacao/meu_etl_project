import React, { useState, useMemo } from "react";
import { 
  createTheme, 
  ThemeProvider, 
  CssBaseline, // Reseta o CSS e aplica o fundo do tema
  IconButton, 
  Box 
} from "@mui/material";
import Brightness4Icon from '@mui/icons-material/Brightness4'; // Ícone de Lua (Escuro)
import Brightness7Icon from '@mui/icons-material/Brightness7'; // Ícone de Sol (Claro)
import LoginPage from "./components/LoginPage";
import Dashboard from "./components/Dashboard";

function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));
  
  // 1. Estado para gerenciar o modo de cor ('light' ou 'dark')
  const [mode, setMode] = useState('dark'); 

  // 2. Função para alternar o modo de cor
  const colorMode = useMemo(
    () => ({
      toggleColorMode: () => {
        setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
      },
    }),
    [],
  );

  // 3. Criação dinâmica do tema
  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode, // 'light' ou 'dark'
          primary: {
            main: '#673ab7', // Roxo principal
          },
          secondary: {
            main: '#9c27b0', // Roxo secundário
          },
          // Personalização dos fundos para o tema 'dark'
          background: {
            default: mode === 'dark' ? '#121212' : '#f5f5f5', 
            paper: mode === 'dark' ? '#1e1e1e' : '#ffffff', 
          },
        },
        typography: {
          fontFamily: 'Roboto, Arial, sans-serif',
        },
      }),
    [mode],
  );

  const handleLogin = (newToken) => {
    localStorage.setItem("token", newToken);
    setToken(newToken);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken(null);
  };

  return (
    // 4. Envolve todo o aplicativo com ThemeProvider
    <ThemeProvider theme={theme}>
      {/* 5. Aplica as cores de fundo e estilos base */}
      <CssBaseline /> 
      
      {/* Botão de Alternância de Tema no canto superior direito */}
      <Box sx={{ position: 'fixed', top: 16, right: 16, zIndex: 1000 }}>
        <IconButton onClick={colorMode.toggleColorMode} color="inherit">
          {mode === 'dark' ? (
            <Brightness7Icon sx={{ color: 'white' }} /> // Sol (quando está no tema escuro)
          ) : (
            <Brightness4Icon /> // Lua (quando está no tema claro)
          )}
        </IconButton>
      </Box>

      {/* Roteamento Condicional */}
      {token ? (
        <Dashboard onLogout={handleLogout} />
      ) : (
        <LoginPage onLogin={handleLogin} />
      )}
    </ThemeProvider>
  );
}

export default App;