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
  ListItemIcon, // NOVO: Para ícones no menu
  Chip, // NOVO: Para visualização de status na tabela
  useTheme, // NOVO: Para acessar o tema
} from "@mui/material";

// Ícones
import InventoryIcon from '@mui/icons-material/Inventory';
import CategoryIcon from '@mui/icons-material/Category';
import PeopleIcon from '@mui/icons-material/People';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ListAltIcon from '@mui/icons-material/ListAlt';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import LogoutIcon from '@mui/icons-material/Logout';

import API from "../services/api";

const drawerWidth = 240;

// Atualização da lista de scripts para incluir ícones
const scripts = [
    { name: "att_estoque.py", label: "Atualizar Estoque", icon: InventoryIcon },
    { name: "att_produtos.py", label: "Atualizar Produtos", icon: CategoryIcon },
    { name: "att_clientes.py", label: "Atualizar Clientes", icon: PeopleIcon },
    { name: "sync_order.py", label: "Sincronizar Pedidos", icon: ShoppingCartIcon },
    { name: "libera_pedido.py", label: "Liberar Pedidos CTextil", icon: CheckCircleIcon },
    { name: "listagempedido", label: "Listagem de Pedidos", icon: ListAltIcon },
];

// Componente auxiliar para exibir status SIM/NÃO com Chips
const StatusChip = ({ status }) => {
    const isYes = status === "Sim";
    return (
        <Chip
            label={status}
            // Usa 'success' (verde) para Sim e 'default' para Não
            color={isYes ? "success" : "default"} 
            size="small"
            variant="outlined"
            sx={{ minWidth: '60px' }}
        />
    );
};

function Dashboard({ onLogout }) {
    const theme = useTheme(); // Acesso ao tema
    const [selectedScript, setSelectedScript] = useState(scripts[0].name);
    const [logs, setLogs] = useState([]);
    const [pedidos, setPedidos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filtro, setFiltro] = useState("");

    // --- Lógica de Fetching (inalterada) ---
    const fetchLogs = useCallback(async () => {
        try {
            const res = await API.get("/logs", {
                params: { script: selectedScript, limit: 10 },
            });
            setLogs(res.data);
        } catch (err) {
            console.error(err);
            // alert("Erro ao carregar logs."); // Preferível usar um Snackbar no lugar de alert
        }
    }, [selectedScript]);

    const fetchPedidos = useCallback(async () => {
        try {
            const res = await API.get("/list", {
                params: { limit: 50 },
            });
            setPedidos(res.data);
        } catch (err) {
            console.error(err);
            // alert("Erro ao carregar listagem de pedidos.");
        }
    }, []);

    useEffect(() => {
        if (selectedScript === "listagempedido") {
            fetchPedidos();
        } else {
            fetchLogs();
        }
    }, [selectedScript, fetchLogs, fetchPedidos]);

    // --- Executar scripts normais (inalterada) ---
    const runScript = async () => {
        setLoading(true);
        try {
            await API.post(`/run-script/${selectedScript}`);
            await fetchLogs();
        } catch (err) {
            console.error(err);
            // alert("Erro ao executar script.");
        } finally {
            setLoading(false);
        }
    };

    // --- Filtro de pedidos (inalterada) ---
    const pedidosFiltrados = pedidos.filter((p) => {
        const termo = filtro.toLowerCase();
        return (
            p.numeropedido?.toLowerCase().includes(termo) ||
            p.nomecliente?.toLowerCase().includes(termo)
        );
    });

    // --- Renderização do Dashboard ---
    return (
        <Box sx={{ display: "flex", minHeight: '100vh' }}>
            <CssBaseline />
            
            {/* AppBar (Cabeçalho) */}
            <AppBar
                position="fixed"
                sx={{ 
                    zIndex: (theme) => theme.zIndex.drawer + 1,
                    // Aplica a cor primária (roxo) do tema
                    backgroundColor: theme.palette.primary.main, 
                }}
            >
                <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Typography variant="h6" noWrap sx={{ fontWeight: 'bold', mr: 8}}>
                        Dashboard de Automação
                    </Typography>
                    <Button 
                        color="inherit" 
                        onClick={onLogout} 
                        startIcon={<LogoutIcon />}
                    >
                        Sair
                    </Button>
                </Toolbar>
            </AppBar>

            {/* Drawer (Menu Lateral) */}
            <Drawer
                variant="permanent"
                sx={{
                    width: drawerWidth,
                    flexShrink: 0,
                    [`& .MuiDrawer-paper`]: { 
                        width: drawerWidth, 
                        boxSizing: "border-box",
                        // Adapta a cor de fundo ao tema (claro/escuro)
                        backgroundColor: theme.palette.background.paper, 
                    },
                }}
            >
                <Toolbar />
                <Box sx={{ overflow: "auto" }}>
                    <List>
                        <Typography 
                            variant="caption" 
                            color="text.secondary" 
                            sx={{ p: 2, display: 'block', textTransform: 'uppercase' }}
                        >
                            Scripts de Sincronização
                        </Typography>
                        {scripts.map((script) => {
                            const IconComponent = script.icon;
                            const isSelected = selectedScript === script.name;
                            return (
                                <ListItem key={script.name} disablePadding>
                                    <ListItemButton
                                        selected={isSelected}
                                        onClick={() => setSelectedScript(script.name)}
                                        // Estilo aprimorado para o item selecionado
                                        sx={{
                                            '&.Mui-selected': {
                                                backgroundColor: theme.palette.primary.light,
                                                color: theme.palette.primary.contrastText,
                                                fontWeight: 'bold',
                                                '&:hover': {
                                                    backgroundColor: theme.palette.primary.main,
                                                },
                                            },
                                        }}
                                    >
                                        <ListItemIcon>
                                            <IconComponent 
                                                // Cor do ícone
                                                color={isSelected ? 'inherit' : 'primary'} 
                                            />
                                        </ListItemIcon>
                                        <ListItemText primary={script.label} />
                                    </ListItemButton>
                                </ListItem>
                            );
                        })}
                    </List>
                </Box>
            </Drawer>

            {/* Conteúdo Principal */}
            <Box
                component="main"
                sx={{ 
                    flexGrow: 1, 
                    // Aplica a cor de fundo do tema
                    bgcolor: "background.default", 
                    p: 3,
                }}
            >
                <Toolbar />
                <Typography variant="h4" gutterBottom sx={{ fontWeight: '600', mb: 4 }}>
                    {scripts.find((s) => s.name === selectedScript)?.label}
                </Typography>

                {/* Seção de Execução de Scripts e Logs */}
                {selectedScript !== "listagempedido" ? (
                    <>
                        <Box sx={{ mb: 4, display: 'flex', alignItems: 'center' }}>
                            <Button
                                variant="contained"
                                onClick={runScript}
                                disabled={loading}
                                color="primary"
                                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <PlayArrowIcon />}
                                sx={{ py: 1.5, px: 3 }}
                            >
                                {loading ? "Executando..." : "Executar Script Agora"}
                            </Button>
                        </Box>

                        <Typography variant="h6" gutterBottom sx={{ mt: 3, borderBottom: `1px solid ${theme.palette.divider}`, pb: 1 }}>
                            Logs de Execução (Últimos 10)
                        </Typography>

                        {logs.length === 0 ? (
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                                Nenhum log encontrado para este script.
                            </Typography>
                        ) : (
                            logs.map((log, index) => (
                                // Logs em Cards (Paper)
                                <Paper
                                    key={index}
                                    elevation={3} // Sombra suave
                                    sx={{ mb: 2, p: 2, borderRadius: 2 }}
                                >
                                    <Typography variant="caption" color="text.secondary" display="block">
                                        Data/Hora: {new Date(log.created_at).toLocaleString()}
                                    </Typography>
                                    <Typography
                                        variant="body2"
                                        component="pre" // Usa 'pre' para formatar o output do console
                                        sx={{ 
                                            whiteSpace: "pre-wrap", 
                                            wordBreak: "break-word", 
                                            mt: 1, 
                                            p: 1,
                                            // Fundo discreto para o código/log
                                            bgcolor: theme.palette.mode === 'dark' ? 'grey.800' : 'grey.100', 
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
                    // Seção de Listagem de Pedidos
                    <>
                        <TextField
                            label="Buscar por N° Pedido ou Cliente"
                            variant="outlined"
                            fullWidth
                            value={filtro}
                            onChange={(e) => setFiltro(e.target.value)}
                            sx={{ mb: 4 }}
                            // Adicionando um estilo mais clean
                            InputProps={{ 
                                sx: { borderRadius: '12px' }
                            }}
                        />

                        <TableContainer component={Paper} elevation={3}>
                            <Table stickyHeader>
                                <TableHead>
                                    <TableRow>
                                        {/* Headers da Tabela com estilo aprimorado */}
                                        <TableCell sx={{ fontWeight: 'bold' }}>Número Pedido</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Cliente</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Enviado Ctextil</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>N° Pedido Ctextil</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Romaneio</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {pedidosFiltrados.map((p) => (
                                        <TableRow 
                                            key={p.idpedido}
                                            // Estilo hover para as linhas
                                            sx={{ '&:hover': { bgcolor: theme.palette.action.hover } }} 
                                        >
                                            <TableCell>{p.numeropedido}</TableCell>
                                            <TableCell>{p.nomecliente}</TableCell>
                                            {/* Uso do StatusChip */}
                                            <TableCell>
                                                <StatusChip status={p.statussincronismo ? "Sim" : "Não"} />
                                            </TableCell>
                                            <TableCell>{p.pedidosty || "N/A"}</TableCell>
                                            {/* Uso do StatusChip */}
                                            <TableCell>
                                                <StatusChip status={p.liberado ? "Sim" : "Não"} />
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