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
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";
import API from "../services/api";

const drawerWidth = 240;

const scripts = [
  { name: "att_estoque.py", label: "Atualizar Estoque" },
  { name: "att_produtos.py", label: "Atualizar Produtos" },
  { name: "att_clientes.py", label: "Atualizar Clientes" },
  { name: "sync_order.py", label: "Sincronizar Pedidos" },
  { name: "libera_pedido.py", label: "Liberar e Romanear pedidos no CTextil" },
  { name: "listagempedido", label: "Listagem de pedidos no banco" },
];

function Dashboard({ onLogout }) {
  const [selectedScript, setSelectedScript] = useState(scripts[0].name);
  const [logs, setLogs] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filtro, setFiltro] = useState("");

  // --- Busca de logs ---
  const fetchLogs = useCallback(async () => {
    try {
      const res = await API.get("/logs", {
        params: { script: selectedScript, limit: 10 },
      });
      setLogs(res.data);
    } catch (err) {
      console.error(err);
      alert("Erro ao carregar logs.");
    }
  }, [selectedScript]);

  // --- Busca de pedidos ---
  const fetchPedidos = useCallback(async () => {
    try {
      const res = await API.get("/list", {
        params: { limit: 50 },
      });
      setPedidos(res.data);
    } catch (err) {
      console.error(err);
      alert("Erro ao carregar listagem de pedidos.");
    }
  }, []);

  useEffect(() => {
    if (selectedScript === "listagempedido") {
      fetchPedidos();
    } else {
      fetchLogs();
    }
  }, [selectedScript, fetchLogs, fetchPedidos]);

  // --- Executar scripts normais ---
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

  // --- Filtro de pedidos ---
  const pedidosFiltrados = pedidos.filter((p) => {
    const termo = filtro.toLowerCase();
    return (
      p.numeropedido?.toLowerCase().includes(termo) ||
      p.nomecliente?.toLowerCase().includes(termo)
    );
  });

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

        {selectedScript !== "listagempedido" ? (
          <>
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
              <Typography variant="body2">Nenhum pedido disponível.</Typography>
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
          </>
        ) : (
          <>
            <TextField
              label="Buscar pedido ou cliente"
              variant="outlined"
              fullWidth
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              sx={{ mb: 3 }}
            />

            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Número Pedido</TableCell>
                    <TableCell>Cliente</TableCell>
                    <TableCell>Pedido enviado Ctextil</TableCell>
                    <TableCell>N° Pedido Ctextil</TableCell>
                    <TableCell>Romaneio Gerado</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pedidosFiltrados.map((p) => (
                    <TableRow key={p.idpedido}>
                      <TableCell>{p.numeropedido}</TableCell>
                      <TableCell>{p.nomecliente}</TableCell>
                      <TableCell>{p.statussincronismo ? "Sim" : "Não"}</TableCell>
                      <TableCell>{p.pedidosty}</TableCell>
                      <TableCell>{p.liberado ? "Sim" : "Não"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}
      </Box>
    </Box>
  );
}

export default Dashboard;