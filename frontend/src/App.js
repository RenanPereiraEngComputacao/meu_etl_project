// src/App.js
import React, { useState, useMemo, useEffect } from "react";
import { 
  createTheme,
  ThemeProvider,
  CssBaseline,
  IconButton,
  Box
} from "@mui/material";

import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";

import LoginPage from "./components/LoginPage";
import Dashboard from "./components/Dashboard";
import SelectOrganizationPage from "./pages/SelectOrganizationPage";

function App() {
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  
  // organização selecionada
  const [selectedOrg, setSelectedOrg] = useState(() => localStorage.getItem("selectedOrg") || null);

  // tema
  const [mode, setMode] = useState(() => localStorage.getItem("themeMode") || "dark");
  useEffect(() => localStorage.setItem("themeMode", mode), [mode]);

  const colorMode = useMemo(
    () => ({
      toggleColorMode: () => setMode(prev => (prev === "light" ? "dark" : "light"))
    }),
    []
  );

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: { main: "#673ab7" },
          secondary: { main: "#9c27b0" },
          background: {
            default: mode === "dark" ? "#121212" : "#f5f5f5",
            paper: mode === "dark" ? "#1e1e1e" : "#ffffff"
          }
        },
        typography: { fontFamily: "Roboto, Arial, sans-serif" }
      }),
    [mode]
  );

  const handleLogin = (newToken) => {
    localStorage.setItem("token", newToken);
    setToken(newToken);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("selectedOrg");
    setToken(null);
    setSelectedOrg(null);
  };

  const handleOrgSelect = (orgKey) => {
    localStorage.setItem("selectedOrg", orgKey);
    setSelectedOrg(orgKey);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ position: "fixed", top: 16, right: 16, zIndex: 1000 }}>
        <IconButton onClick={colorMode.toggleColorMode} color="inherit">
          {mode === "dark" ? <Brightness7Icon sx={{ color: "white" }} /> : <Brightness4Icon />}
        </IconButton>
      </Box>

      {/* Fluxo: Login -> SelectOrg -> Dashboard */}
      {!token ? (
        <LoginPage onLogin={handleLogin} />
      ) : !selectedOrg ? (
        <SelectOrganizationPage onSelect={handleOrgSelect} />
      ) : (
        <Dashboard token={token} org={selectedOrg} onLogout={handleLogout} />
      )}
    </ThemeProvider>
  );
}

export default App;