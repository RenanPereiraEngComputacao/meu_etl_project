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



const StatusChip = ({ status }) => {
  const isYes = status === "Sincronizado" || status === "Em Romaneio";
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

const formatPhoneNumber = (phoneNumber) => {
  if (!phoneNumber) return "";
  const cleaned = String(phoneNumber).replace(/\D/g, "");
  if (cleaned.length === 11)
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
  if (cleaned.length === 10)
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
  return phoneNumber;
};

function Dashboard({ org, onLogout }) {
  const theme = useTheme();

  const scripts = React.useMemo(() => {
    if (org === "itsmy") {
      return [
        { name: "att_estoque_itsmy.py", label: "Atualizar Estoque", icon: InventoryIcon },
        { name: "att_produtos_itsmy.py", label: "Atualizar Produtos", icon: CategoryIcon },
        { name: "att_clientes.py", label: "Atualizar Clientes", icon: PeopleIcon },
        { name: "sync_order.py", label: "Sincronizar Pedidos", icon: ShoppingCartIcon },
        { name: "libera_pedido.py", label: "Liberar Pedidos CTextil", icon: CheckCircleIcon },
        { name: "listagempedido", label: "Listagem de Pedidos", icon: ListAltIcon },
      ];
    }

    // default = malagah
    return [
      { name: "att_estoque.py", label: "Atualizar Estoque", icon: InventoryIcon },
      { name: "att_produtos.py", label: "Atualizar Produtos", icon: CategoryIcon },
      { name: "att_clientes.py", label: "Atualizar Clientes", icon: PeopleIcon },
      { name: "sync_order.py", label: "Sincronizar Pedidos", icon: ShoppingCartIcon },
      { name: "libera_pedido.py", label: "Liberar Pedidos CTextil", icon: CheckCircleIcon },
      { name: "listagempedido", label: "Listagem de Pedidos", icon: ListAltIcon },
    ];}, [org]);

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
      console.error("Erro ao buscar logs", err);
    }
  }, [selectedScript]);

  const fetchPedidos = useCallback(async () => {
    try {
      const res = await API.get("/list", { params: { limit: 50 } });
      setPedidos(res.data);
    } catch (err) {
      console.error("Erro ao buscar pedidos", err);
    }
  }, []);

  useEffect(() => {
    if (!org) return;

    if (selectedScript === "listagempedido") {
      fetchPedidos();
    } else {
      fetchLogs();
    }
  }, [org, selectedScript, fetchLogs, fetchPedidos]);

  const runScript = async () => {
    setLoading(true);
    try {
      await API.post(`/run-script/${selectedScript}`);
      await fetchLogs();
    } catch (err) {
      console.error("Erro ao executar script", err);
    } finally {
      setLoading(false);
    }
  };

  const pedidosFiltrados = pedidos.filter((p) => {
    const termo = filtro.toLowerCase();
    return (
      p.idpedido?.toString().includes(termo) ||
      p.nomecliente?.toLowerCase().includes(termo)
    );
  });

  const exportarXLSX = () => {
    if (!pedidosFiltrados.length) {
      alert("Nenhum dado para exportar.");
      return;
    }

    const data = pedidosFiltrados.map((p) => ({
      Numero_Pedido: p.idpedido,
      Data: new Date(
        new Date(p.created_at).getTime() - 3 * 60 * 60 * 1000
      ).toLocaleDateString("pt-BR"),
      Cliente: p.nomecliente,
      Estado: p.estado,
      Email: p.email,
      Telefone: formatPhoneNumber(p.telefone),
      Transportadora: p.transportadora,
      Pagamento: p.pagamento,
      Bandeira: p.bandeira,
      Parcelamento: p.parcelamento,
      Pecas: p.qtdpecas,
      Valor_Pedido: p.valorpedido,
      Valor_Nota: p.valornota,
      Valor_Frete: p.valorfrete,
      Status_Integracao: p.statussincronismo ? "Sincronizado" : "Não Sincronizado",
      Pedido_Ctextil: p.pedidosty || "Falta Sincronizar",
      Status_Ctextil: p.liberado ? "Em Romaneio" : "Restrição",
      Pedido_Bling: p.pedidobling,
      NFE_Bling: p.nfebling,
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Pedidos");

    const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([buffer]), `listagem_pedidos_${Date.now()}.xlsx`);
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
          <Typography variant="h6" sx={{ fontWeight: "bold" }}>
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
      <Box component="main" sx={{ flexGrow: 1, bgcolor: "background.default", p: 3 }}>
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
                  loading ? <CircularProgress size={20} color="inherit" /> : <PlayArrowIcon />
                }
              >
                {loading ? "Executando..." : "Executar Script Agora"}
              </Button>
            </Box>

            <Typography variant="h6" sx={{ mb: 2 }}>
              Logs de Execução
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
                        theme.palette.mode === "dark" ? "grey.800" : "grey.100",
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
            <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
              <TextField
                label="Buscar por N° Pedido ou Cliente"
                fullWidth
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
              />

              <Button
                variant="contained"
                color="success"
                onClick={exportarXLSX}
                sx={{ whiteSpace: "nowrap" }}
              >
                Exportar XLSX
              </Button>
            </Box>

            <TableContainer component={Paper}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Número Pedido</TableCell>
                    <TableCell>Data</TableCell>
                    <TableCell>Cliente</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Telefone</TableCell>
                    <TableCell>Transportadora</TableCell>
                    <TableCell>Pagamento</TableCell>
                    <TableCell>Bandeira</TableCell>
                    <TableCell>Parcelamento</TableCell>
                    <TableCell>Peças</TableCell>
                    <TableCell>Valor Pedido</TableCell>
                    <TableCell>Valor Nota</TableCell>
                    <TableCell>Valor Frete</TableCell>
                    <TableCell>Status Integração</TableCell>
                    <TableCell>N° Pedido Ctextil</TableCell>
                    <TableCell>Status Ctextil</TableCell>
                    <TableCell>Pedido Bling</TableCell>
                    <TableCell>NFE Bling</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {pedidosFiltrados.map((p) => (
                    <TableRow key={p.idpedido}>
                      <TableCell>{p.idpedido}</TableCell>
                      <TableCell>
                        {new Date(
                          new Date(p.created_at).getTime() - 3 * 60 * 60 * 1000
                        ).toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell>{p.nomecliente}</TableCell>
                      <TableCell>{p.estado}</TableCell>
                      <TableCell>{p.email}</TableCell>
                      <TableCell>{formatPhoneNumber(p.telefone)}</TableCell>
                      <TableCell>{p.transportadora}</TableCell>
                      <TableCell>{p.pagamento}</TableCell>
                      <TableCell>{p.bandeira}</TableCell>
                      <TableCell>{p.parcelamento}</TableCell>
                      <TableCell>{p.qtdpecas}</TableCell>
                      <TableCell>{p.valorpedido}</TableCell>
                      <TableCell>{p.valornota}</TableCell>
                      <TableCell>{p.valorfrete}</TableCell>
                      <TableCell>
                        <StatusChip
                          status={
                            p.statussincronismo ? "Sincronizado" : "Não Sincronizado"
                          }
                        />
                      </TableCell>
                      <TableCell>{p.pedidosty || "Falta Sincronizar"}</TableCell>
                      <TableCell>
                        <StatusChip status={p.liberado ? "Em Romaneio" : "Restrição"} />
                      </TableCell>
                      <TableCell>{p.pedidobling}</TableCell>
                      <TableCell>{p.nfebling}</TableCell>
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
