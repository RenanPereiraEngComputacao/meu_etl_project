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
  ListItemIcon,
  Chip,
  useTheme,
} from "@mui/material";

// Ícones
import InventoryIcon from "@mui/icons-material/Inventory";
import CategoryIcon from "@mui/icons-material/Category";
import PeopleIcon from "@mui/icons-material/People";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ListAltIcon from "@mui/icons-material/ListAlt";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import LogoutIcon from "@mui/icons-material/Logout";

import API from "../services/api";

import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const drawerWidth = 240;

const scripts = [
  { name: "att_estoque.py", label: "Atualizar Estoque", icon: InventoryIcon },
  { name: "att_produtos.py", label: "Atualizar Produtos", icon: CategoryIcon },
  { name: "att_clientes.py", label: "Atualizar Clientes", icon: PeopleIcon },
  { name: "sync_order.py", label: "Sincronizar Pedidos", icon: ShoppingCartIcon },
  { name: "libera_pedido.py", label: "Liberar Pedidos CTextil", icon: CheckCircleIcon },
  { name: "listagempedido", label: "Listagem de Pedidos", icon: ListAltIcon },
];

const StatusChip = ({ status }) => {
  const isYes =  status === "Sincronizado" || status === "Em Romaneio";
  return (
    <Chip
      label={status}
      color={isYes ? "success" : "default"}
      size="small"
      variant="outlined"
      sx={{ minWidth: "60px" }}
    />
  );
};

function Dashboard({ onLogout }) {
  const theme = useTheme();

  const [selectedScript, setSelectedScript] = useState(scripts[0].name);
  const [logs, setLogs] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filtro, setFiltro] = useState("");

  const fetchLogs = useCallback(async () => {
    try {
      const res = await API.get("/logs", {
        params: { script: selectedScript, limit: 10 },
      });
      setLogs(res.data);
    } catch (err) {
      console.error(err);
    }
  }, [selectedScript]);

  const fetchPedidos = useCallback(async () => {
    try {
      const res = await API.get("/list", { params: { limit: 50 } });
      setPedidos(res.data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    if (selectedScript === "listagempedido") {
      fetchPedidos();
    } else {
      fetchLogs();
    }
  }, [selectedScript, fetchLogs, fetchPedidos]);

  const runScript = async () => {
    setLoading(true);
    try {
      await API.post(`/run-script/${selectedScript}`);
      await fetchLogs();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 🔥 Agora pedidosFiltrados existe antes de ser usado no XLSX
  const pedidosFiltrados = pedidos.filter((p) => {
    const termo = filtro.toLowerCase();
    return (
      p.numeropedido?.toLowerCase().includes(termo) ||
      p.nomecliente?.toLowerCase().includes(termo)
    );
  });

  // 🔥 Agora funciona, pois está dentro do componente e vê pedidosFiltrados
  const exportarXLSX = () => {
    if (pedidosFiltrados.length === 0) {
      alert("Nenhum dado para exportar.");
      return;
    }

    const data = pedidosFiltrados.map((p) => ({
      Numero_Pedido: p.numeropedido,
      Cliente: p.nomecliente,
      Status_Integração: p.statussincronismo ? "Sincronizado" : "Não Sincronizado",
      N_Pedido_Ctextil: p.pedidosty,
      Status_Ctextil: p.liberado ? "Em romaneio" : "Restrição",
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Pedidos");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });

    saveAs(blob, `listagem_pedidos_${Date.now()}.xlsx`);
  };

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <CssBaseline />

      {/* AppBar */}
      <AppBar
        position="fixed"
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          backgroundColor: theme.palette.primary.main,
        }}
      >
        <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
          <Typography variant="h6" sx={{ fontWeight: "bold", mr: 8 }}>
            Dashboard de Automação
          </Typography>

          <Button color="inherit" onClick={onLogout} startIcon={<LogoutIcon />}>
            Sair
          </Button>
        </Toolbar>
      </AppBar>

      {/* Drawer */}
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          [`& .MuiDrawer-paper`]: {
            width: drawerWidth,
            backgroundColor: theme.palette.background.paper,
          },
        }}
      >
        <Toolbar />
        <List>
          {scripts.map((script) => {
            const IconComponent = script.icon;
            const isSelected = selectedScript === script.name;

            return (
              <ListItem key={script.name} disablePadding>
                <ListItemButton
                  selected={isSelected}
                  onClick={() => setSelectedScript(script.name)}
                  sx={{
                    "&.Mui-selected": {
                      backgroundColor: theme.palette.primary.light,
                      color: theme.palette.primary.contrastText,
                    },
                  }}
                >
                  <ListItemIcon>
                    <IconComponent color={isSelected ? "inherit" : "primary"} />
                  </ListItemIcon>
                  <ListItemText primary={script.label} />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Drawer>

      {/* Conteúdo */}
      <Box
        component="main"
        sx={{ flexGrow: 1, bgcolor: "background.default", p: 3 }}
      >
        <Toolbar />

        <Typography variant="h4" sx={{ fontWeight: 600, mb: 4 }}>
          {scripts.find((s) => s.name === selectedScript)?.label}
        </Typography>

        {selectedScript !== "listagempedido" ? (
          <>
            

            <Box sx={{ mb: 4 }}>
              <Button
                variant="contained"
                onClick={runScript}
                disabled={loading}
                startIcon={
                  loading ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : (
                    <PlayArrowIcon />
                  )
                }
              >
                {loading ? "Executando..." : "Executar Script Agora"}
              </Button>
            </Box>

            <Typography variant="h6" sx={{ mb: 2 }}>
              Logs de Execução (Últimos 20)
            </Typography>

            {logs.length === 0 ? (
              <Typography>Nenhum log encontrado.</Typography>
            ) : (
              logs.map((log, index) => (
                <Paper key={index} sx={{ p: 2, mb: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(log.created_at).toLocaleString()}
                  </Typography>

                  <Typography
                    variant="body2"
                    component="pre"
                    sx={{
                      whiteSpace: "pre-wrap",
                      mt: 1,
                      p: 1,
                      backgroundColor:
                        theme.palette.mode === "dark"
                          ? "grey.800"
                          : "grey.100",
                      borderRadius: 1,
                    }}
                  >
                    {log.output}
                  </Typography>
                </Paper>
              ))
            )}
          </>
        ) : (
          <>
            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 2,          // espaço entre eles
                    mb: 3,
                }}
                >
                <TextField
                    label="Buscar por N° Pedido ou Cliente"
                    variant="outlined"
                    fullWidth      // mantém ele grande ocupando o espaço restante
                    value={filtro}
                    onChange={(e) => setFiltro(e.target.value)}
                />

                <Button
                    variant="contained"
                    color="success"
                    onClick={exportarXLSX}
                    sx={{ whiteSpace: "nowrap" }} // evita quebrar texto do botão
                >
                    Exportar XLSX
                </Button>
                </Box>

            <TableContainer component={Paper}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Número Pedido</TableCell>
                    <TableCell>Cliente</TableCell>
                    <TableCell>Status Integração</TableCell>
                    <TableCell>N° Pedido Ctextil</TableCell>
                    <TableCell>Status Ctextil</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {pedidosFiltrados.map((p) => (
                    <TableRow key={p.idpedido}>
                      <TableCell>{p.numeropedido}</TableCell>
                      <TableCell>{p.nomecliente}</TableCell>
                      <TableCell>
                        <StatusChip
                          status={p.statussincronismo ? "Sincronizado" : "Não Sincronizado"}
                        />
                      </TableCell>
                      <TableCell>{p.pedidosty || "Falta Sincronizar"}</TableCell>
                      <TableCell>
                        <StatusChip status={p.liberado ? "Em Romaneio" : "Restrição"} />
                      </TableCell>
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