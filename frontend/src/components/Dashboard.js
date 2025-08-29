import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography,
  Button,
  Toolbar,
  AppBar,
  CssBaseline,
  CircularProgress,
} from "@mui/material";
import API from "../services/api";

const drawerWidth = 240;

const scripts = [
  { name: "att_estoque.py", label: "Atualizar Estoque" },
  { name: "att_produtos.py", label: "Atualizar Produtos" },
  { name: "att_clientes.py", label: "Atualizar Clientes" },
  { name: "sync_order.py", label: "Sincronizar Pedidos" },  
  { name: "libera_pedido.py", label: "Liberar e Romanear pedidos no CTextil" },
];

function Dashboard({ onLogout }) {
  const [selectedScript, setSelectedScript] = useState(scripts[0].name);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchLogs = useCallback(async () => {
    try {
      const res = await API.get("/logs", {
        params: {
          script: selectedScript,
          limit: 10,
        },
      });
      setLogs(res.data);
    } catch (err) {
      console.error(err);
      alert("Erro ao carregar logs.");
    }
  }, [selectedScript]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const runScript = async () => {
    setLoading(true);
    try {
      await API.post(`/run-script/${selectedScript}`);
      await fetchLogs();
    } catch (err) {
      console.error(err);
      alert("Erro ao executar script.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}
      >
        <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
          <Typography variant="h6" noWrap>
            Dashboard
          </Typography>
          <Button color="inherit" onClick={onLogout}>
            Sair
          </Button>
        </Toolbar>
      </AppBar>
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: "border-box" },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: "auto" }}>
          <List>
            {scripts.map((script) => (
              <ListItem key={script.name} disablePadding>
                <ListItemButton
                  selected={selectedScript === script.name}
                  onClick={() => setSelectedScript(script.name)}
                >
                  <ListItemText primary={script.label} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>
      <Box
        component="main"
        sx={{ flexGrow: 1, bgcolor: "background.default", p: 3 }}
      >
        <Toolbar />
        <Typography variant="h5" gutterBottom>
          {scripts.find((s) => s.name === selectedScript)?.label}
        </Typography>
        <Box sx={{ mb: 2 }}>
          <Button
            variant="contained"
            onClick={runScript}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {loading ? "Executando..." : "Executar Script"}
          </Button>
        </Box>
        {logs.length === 0 ? (
          <Typography variant="body2">Nenhum log disponível.</Typography>
        ) : (
          logs.map((log) => (
            <Box
              key={log.id}
              mb={2}
              p={2}
              border={1}
              borderColor="grey.300"
              borderRadius={2}
            >
              <Typography variant="subtitle2">
                {new Date(log.created_at).toLocaleString()}
              </Typography>
              <Typography
                variant="body2"
                sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
              >
                {log.output}
              </Typography>
            </Box>
          ))
        )}
      </Box>
    </Box>
  );
}

export default Dashboard;
