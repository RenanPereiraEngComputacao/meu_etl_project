import React, { useState, useEffect, useCallback, useMemo } from "react";
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
  Paper,
  ListItemIcon,
  Chip,
  Divider,
  Stack,
  IconButton,
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
import BusinessIcon from "@mui/icons-material/Business";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";

import { DataGrid, GridToolbar } from "@mui/x-data-grid";

import API from "../services/api";

import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const drawerWidth = 280;
const collapsedDrawerWidth = 88;

const StatusChip = ({ status }) => {
  const isYes = status === "Sincronizado" || status === "Em Romaneio";
  return (
    <Chip
      label={status}
      color={isYes ? "success" : "default"}
      size="small"
      variant="outlined"
      sx={{ minWidth: 120, fontWeight: 800 }}
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

const formatDateBR = (dateValue) => {
  if (!dateValue) return "";
  const d = new Date(new Date(dateValue).getTime() - 3 * 60 * 60 * 1000);
  return d.toLocaleDateString("pt-BR");
};

function Dashboard({ org, onLogout }) {
  const scripts = useMemo(() => {
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
    ];
  }, [org]);

  const [selectedScript, setSelectedScript] = useState(() => scripts?.[0]?.name ?? "");
  const [logs, setLogs] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filtro, setFiltro] = useState("");

  const [isDrawerCollapsed, setIsDrawerCollapsed] = useState(false);
  const currentDrawerWidth = isDrawerCollapsed ? collapsedDrawerWidth : drawerWidth;

  const toggleDrawer = () => setIsDrawerCollapsed((v) => !v);

  // quando org muda, garante que o script selecionado existe
  useEffect(() => {
    if (!scripts?.length) return;
    setSelectedScript((prev) => {
      const exists = scripts.some((s) => s.name === prev);
      return exists ? prev : scripts[0].name;
    });
  }, [scripts]);

  const fetchLogs = useCallback(async () => {
    if (!selectedScript) return;
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

    if (selectedScript === "listagempedido") fetchPedidos();
    else fetchLogs();
  }, [org, selectedScript, fetchLogs, fetchPedidos]);

  const runScript = async () => {
    if (!selectedScript) return;
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

  const pedidosFiltrados = useMemo(() => {
    const termo = filtro.trim().toLowerCase();
    if (!termo) return pedidos;

    return pedidos.filter((p) => {
      return (
        p.idpedido?.toString().includes(termo) ||
        p.nomecliente?.toLowerCase().includes(termo)
      );
    });
  }, [pedidos, filtro]);

  const rows = useMemo(() => {
    return (pedidosFiltrados || []).map((p) => ({
      ...p,
      dataBR: formatDateBR(p.created_at),
      telefoneBR: formatPhoneNumber(p.telefone),
      statusIntegracao: p.statussincronismo ? "Sincronizado" : "Não Sincronizado",
      statusCtextil: p.liberado ? "Em Romaneio" : "Restrição",
      pedidoCtextil: p.pedidosty || "Falta Sincronizar",
    }));
  }, [pedidosFiltrados]);

  const exportarXLSX = () => {
    if (!rows.length) {
      alert("Nenhum dado para exportar.");
      return;
    }

    const data = rows.map((p) => ({
      Numero_Pedido: p.idpedido,
      Data: p.dataBR,
      Cliente: p.nomecliente,
      Estado: p.estado,
      Email: p.email,
      Telefone: p.telefoneBR,
      Transportadora: p.transportadora,
      Pagamento: p.pagamento,
      Bandeira: p.bandeira,
      Parcelamento: p.parcelamento,
      Pecas: p.qtdpecas,
      Valor_Pedido: p.valorpedido,
      Valor_Nota: p.valornota,
      Valor_Frete: p.valorfrete,
      Status_Integracao: p.statusIntegracao,
      Pedido_Ctextil: p.pedidoCtextil,
      Status_Ctextil: p.statusCtextil,
      Pedido_Bling: p.pedidobling,
      NFE_Bling: p.nfebling,
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Pedidos");

    const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([buffer]), `listagem_pedidos_${Date.now()}.xlsx`);
  };

  const columns = useMemo(
    () => [
      { field: "idpedido", headerName: "Número Pedido", minWidth: 140, flex: 0.6 },
      { field: "dataBR", headerName: "Data", minWidth: 110, flex: 0.45 },
      { field: "nomecliente", headerName: "Cliente", minWidth: 220, flex: 1.2 },
      { field: "estado", headerName: "Estado", minWidth: 90, flex: 0.35 },
      { field: "email", headerName: "Email", minWidth: 230, flex: 1.2 },
      { field: "telefoneBR", headerName: "Telefone", minWidth: 140, flex: 0.6 },
      { field: "transportadora", headerName: "Transportadora", minWidth: 160, flex: 0.7 },
      { field: "pagamento", headerName: "Pagamento", minWidth: 150, flex: 0.7 },
      { field: "bandeira", headerName: "Bandeira", minWidth: 120, flex: 0.55 },
      { field: "parcelamento", headerName: "Parcelamento", minWidth: 140, flex: 0.65 },
      { field: "qtdpecas", headerName: "Peças", minWidth: 90, flex: 0.35, type: "number" },
      { field: "valorpedido", headerName: "Valor Pedido", minWidth: 130, flex: 0.55 },
      { field: "valornota", headerName: "Valor Nota", minWidth: 120, flex: 0.55 },
      { field: "valorfrete", headerName: "Valor Frete", minWidth: 120, flex: 0.55 },
      {
        field: "statusIntegracao",
        headerName: "Status Integração",
        minWidth: 175,
        flex: 0.75,
        renderCell: (params) => <StatusChip status={params.value} />,
      },
      {
        field: "pedidoCtextil",
        headerName: "N° Pedido Ctextil",
        minWidth: 170,
        flex: 0.7,
      },
      {
        field: "statusCtextil",
        headerName: "Status Ctextil",
        minWidth: 160,
        flex: 0.7,
        renderCell: (params) => <StatusChip status={params.value} />,
      },
      { field: "pedidobling", headerName: "Pedido Bling", minWidth: 135, flex: 0.6 },
      { field: "nfebling", headerName: "NFE Bling", minWidth: 120, flex: 0.55 },
    ],
    []
  );

  const selectedLabel = scripts.find((s) => s.name === selectedScript)?.label ?? "Dashboard";

  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100vh",
        background:
          "radial-gradient(1200px 700px at 10% 0%, rgba(123,92,255,.18), transparent 60%)," +
          "radial-gradient(900px 600px at 90% 10%, rgba(111,121,255,.12), transparent 55%)," +
          "linear-gradient(180deg, #0b1020 0%, #090b12 100%)",
      }}
    >
      <CssBaseline />

      {/* AppBar (glass) */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          zIndex: (t) => t.zIndex.drawer + 1,
          backgroundColor: "rgba(255,255,255,.06)",
          backdropFilter: "blur(14px)",
          borderBottom: "1px solid rgba(255,255,255,.10)",
        }}
      >
        <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
          <Stack spacing={0.2}>
            <Typography variant="overline" sx={{ color: "rgba(255,255,255,.7)", lineHeight: 1 }}>
              Automação ETL
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 900, color: "white", lineHeight: 1.2 }}>
              {selectedLabel}
            </Typography>
          </Stack>

          <Button
            onClick={onLogout}
            startIcon={<LogoutIcon />}
            sx={{
              color: "white",
              border: "1px solid rgba(255,255,255,.18)",
              backgroundColor: "rgba(0,0,0,.18)",
              "&:hover": { backgroundColor: "rgba(0,0,0,.26)" },
            }}
          >
            Sair
          </Button>
        </Toolbar>
      </AppBar>

      {/* Drawer (glass + colapsável) */}
      <Drawer
        variant="permanent"
        sx={{
          width: currentDrawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: {
            width: currentDrawerWidth,
            overflowX: "hidden",
            borderRight: "1px solid rgba(255,255,255,.10)",
            backgroundColor: "rgba(255,255,255,.06)",
            backdropFilter: "blur(14px)",
            color: "white",
            transition: (t) =>
              t.transitions.create("width", {
                easing: t.transitions.easing.sharp,
                duration: t.transitions.duration.shortest,
              }),
          },
        }}
      >
        <Toolbar />

        {/* Header da entidade (mais pra baixo + botão recolher) */}
        <Box sx={{ px: 2, pt: 2, pb: 2 }}>
          <Stack direction="row" spacing={1.2} alignItems="center" justifyContent="space-between">
            <Stack direction="row" spacing={1.2} alignItems="center" sx={{ minWidth: 0 }}>
              <Box
                sx={{
                  width: 38,
                  height: 38,
                  borderRadius: 2,
                  display: "grid",
                  placeItems: "center",
                  background: "linear-gradient(135deg, #7b5cff 0%, #6f79ff 60%, #00c8ff 140%)",
                  boxShadow: "0 12px 28px rgba(123,92,255,.25)",
                  flexShrink: 0,
                }}
              >
                <BusinessIcon sx={{ color: "white" }} />
              </Box>

              {!isDrawerCollapsed && (
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 900, lineHeight: 1.1 }} noWrap>
                    {org === "itsmy" ? "It's My" : "Málagah"}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "rgba(255,255,255,.7)" }} noWrap>
                    Painel de rotinas e listagem
                  </Typography>
                </Box>
              )}
            </Stack>

            <IconButton
              onClick={toggleDrawer}
              size="small"
              sx={{
                color: "white",
                border: "1px solid rgba(255,255,255,.14)",
                backgroundColor: "rgba(0,0,0,.18)",
                "&:hover": { backgroundColor: "rgba(0,0,0,.28)" },
              }}
            >
              {isDrawerCollapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
            </IconButton>
          </Stack>
        </Box>

        <Divider sx={{ borderColor: "rgba(255,255,255,.10)" }} />

        <List sx={{ py: 1 }}>
          {scripts.map((script) => {
            const IconComponent = script.icon;
            const isSelected = selectedScript === script.name;

            return (
              <ListItem key={script.name} disablePadding>
                <ListItemButton
                  selected={isSelected}
                  onClick={() => setSelectedScript(script.name)}
                  sx={{
                    mx: 1,
                    my: 0.5,
                    borderRadius: 2,
                    color: "rgba(255,255,255,.86)",
                    justifyContent: isDrawerCollapsed ? "center" : "flex-start",
                    "& .MuiListItemIcon-root": { minWidth: 38 },
                    "&.Mui-selected": {
                      color: "white",
                      background:
                        "linear-gradient(135deg, rgba(123,92,255,.22), rgba(111,121,255,.10))",
                      border: "1px solid rgba(123,92,255,.35)",
                    },
                    "&:hover": {
                      backgroundColor: "rgba(255,255,255,.06)",
                    },
                  }}
                >
                  <ListItemIcon sx={{ color: isSelected ? "white" : "rgba(255,255,255,.75)" }}>
                    <IconComponent />
                  </ListItemIcon>

                  <ListItemText
                    primary={script.label}
                    primaryTypographyProps={{ sx: { fontWeight: isSelected ? 900 : 700 } }}
                    sx={{
                      opacity: isDrawerCollapsed ? 0 : 1,
                      transition: "opacity .15s",
                      whiteSpace: "nowrap",
                    }}
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Drawer>

      {/* Conteúdo (fixo + scroll só no grid) */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          overflow: "hidden",
        }}
      >
        <Toolbar />

        {selectedScript !== "listagempedido" ? (
          <>
            {/* Card fixo ações */}
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                borderRadius: 4,
                border: "1px solid rgba(255,255,255,.10)",
                backgroundColor: "rgba(255,255,255,.06)",
                backdropFilter: "blur(14px)",
                mb: 2,
                flexShrink: 0,
              }}
            >
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="center">
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ color: "white", fontWeight: 900 }}>
                    Executar rotina
                  </Typography>
                  <Typography variant="body2" sx={{ color: "rgba(255,255,255,.7)" }}>
                    Dispara o script e atualiza os logs na sequência.
                  </Typography>
                </Box>

                <Button
                  variant="contained"
                  onClick={runScript}
                  disabled={loading}
                  startIcon={
                    loading ? <CircularProgress size={20} color="inherit" /> : <PlayArrowIcon />
                  }
                  sx={{
                    borderRadius: 3,
                    py: 1.2,
                    px: 2.5,
                    color: "white",
                    background:
                      "linear-gradient(135deg, #7b5cff 0%, #6f79ff 55%, #00c8ff 120%)",
                    boxShadow: "0 14px 35px rgba(123,92,255,.30)",
                    "&:hover": { filter: "brightness(1.05)" },
                  }}
                >
                  {loading ? "Executando..." : "Executar Agora"}
                </Button>
              </Stack>
            </Paper>

            {/* Logs (se quiser scroll só aqui também, dá pra aplicar o mesmo padrão) */}
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                borderRadius: 4,
                border: "1px solid rgba(255,255,255,.10)",
                backgroundColor: "rgba(255,255,255,.06)",
                backdropFilter: "blur(14px)",
                overflow: "auto",
              }}
            >
              <Typography sx={{ color: "white", fontWeight: 900, mb: 1 }}>
                Logs de Execução
              </Typography>

              {logs.length === 0 ? (
                <Typography sx={{ color: "rgba(255,255,255,.7)" }}>
                  Nenhum log encontrado.
                </Typography>
              ) : (
                <Stack spacing={2}>
                  {logs.map((log, index) => (
                    <Paper
                      key={index}
                      elevation={0}
                      sx={{
                        p: 2,
                        borderRadius: 3,
                        border: "1px solid rgba(255,255,255,.10)",
                        backgroundColor: "rgba(0,0,0,.20)",
                      }}
                    >
                      <Typography variant="caption" sx={{ color: "rgba(255,255,255,.7)" }}>
                        {new Date(log.created_at).toLocaleString()}
                      </Typography>

                      <Typography
                        variant="body2"
                        component="pre"
                        sx={{
                          whiteSpace: "pre-wrap",
                          mt: 1.5,
                          p: 2,
                          backgroundColor: "rgba(0,0,0,.35)",
                          borderRadius: 2,
                          border: "1px solid rgba(255,255,255,.08)",
                          fontFamily:
                            "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                          fontSize: 12,
                          color: "rgba(255,255,255,.88)",
                        }}
                      >
                        {log.output}
                      </Typography>
                    </Paper>
                  ))}
                </Stack>
              )}
            </Paper>
          </>
        ) : (
          <>
            {/* Topo fixo (busca + export) */}
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                borderRadius: 4,
                border: "1px solid rgba(255,255,255,.10)",
                backgroundColor: "rgba(255,255,255,.06)",
                backdropFilter: "blur(14px)",
                mb: 2,
                flexShrink: 0,
              }}
            >
              <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems="center">
                <TextField
                  label="Buscar por N° Pedido ou Cliente"
                  fullWidth
                  value={filtro}
                  onChange={(e) => setFiltro(e.target.value)}
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

                <Button
                  onClick={exportarXLSX}
                  sx={{
                    whiteSpace: "nowrap",
                    borderRadius: 3,
                    py: 1.2,
                    px: 2.5,
                    color: "white",
                    border: "1px solid rgba(255,255,255,.18)",
                    backgroundColor: "rgba(0,0,0,.18)",
                    "&:hover": { backgroundColor: "rgba(0,0,0,.26)" },
                  }}
                >
                  Exportar XLSX
                </Button>
              </Stack>
            </Paper>

            {/* Grid ocupa o resto e rola só ele */}
            <Paper
              elevation={0}
              sx={{
                p: 1.5,
                borderRadius: 4,
                border: "1px solid rgba(255,255,255,.10)",
                backgroundColor: "rgba(255,255,255,.06)",
                backdropFilter: "blur(14px)",
                flex: 1,
                minHeight: 0,
                overflow: "hidden",
              }}
            >
              <Box sx={{ height: "100%", width: "100%" }}>
                <DataGrid
                  rows={rows}
                  columns={columns}
                  getRowId={(row) => row.idpedido}
                  disableRowSelectionOnClick
                  pagination
                  initialState={{
                    pagination: { paginationModel: { pageSize: 25, page: 0 } },
                  }}
                  pageSizeOptions={[10, 25, 50, 100]}
                  slots={{ toolbar: GridToolbar }}
                  slotProps={{
                    toolbar: {
                      showQuickFilter: true,
                      quickFilterProps: { debounceMs: 300 },
                    },
                  }}
                  sx={{
                    height: "100%",
                    border: "none",
                    color: "rgba(255,255,255,.88)",
                    "& .MuiDataGrid-columnHeaders": {
                      backgroundColor: "rgba(0,0,0,.22)",
                      borderBottom: "1px solid rgba(255,255,255,.10)",
                      color: "white",
                    },
                    "& .MuiDataGrid-columnHeaderTitle": { fontWeight: 900 },
                    "& .MuiDataGrid-cell": {
                      borderBottom: "1px solid rgba(255,255,255,.06)",
                    },
                    "& .MuiDataGrid-row:nth-of-type(odd)": {
                      backgroundColor: "rgba(0,0,0,.12)",
                    },
                    "& .MuiDataGrid-row:hover": {
                      backgroundColor: "rgba(123,92,255,.10)",
                    },
                    "& .MuiDataGrid-footerContainer": {
                      borderTop: "1px solid rgba(255,255,255,.10)",
                      backgroundColor: "rgba(0,0,0,.18)",
                    },
                    "& .MuiDataGrid-toolbarContainer": {
                      px: 1,
                      py: 1,
                      gap: 1,
                      borderBottom: "1px solid rgba(255,255,255,.10)",
                    },
                    "& .MuiButtonBase-root": {
                      color: "rgba(255,255,255,.88)",
                    },
                  }}
                />
              </Box>
            </Paper>
          </>
        )}
      </Box>
    </Box>
  );
}

export default Dashboard;
