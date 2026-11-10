import React, { useCallback, useEffect, useState } from "react";
import { Alert, Box, Button, CircularProgress, Paper, Stack, TextField, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from "@mui/material";
import API from "../services/api";

const money = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(v || 0));
const number = (v) => new Intl.NumberFormat("pt-BR").format(Number(v || 0));
const pct = (v) => `${Number(v || 0).toFixed(1).replace(".", ",")}%`;
const panel = { p: 2.5, borderRadius: 3, border: "1px solid rgba(255,255,255,.12)", background: "rgba(255,255,255,.06)", color: "white" };

// Gráfico horizontal construído com MUI/CSS: dispensa Recharts e Chart.js.
function GraficoBarras({ linhas, formato }) {
  const max = Math.max(0, ...linhas.map(l => Number(l.valor || 0)));
  const total = linhas.reduce((s, l) => s + Number(l.valor || 0), 0);
  return <Stack spacing={3} sx={{ mt: 3, mb: 2 }}>
    {linhas.map(l => {
      const valor = Number(l.valor || 0);
      const largura = max > 0 ? 100 * valor / max : 0;
      return <Box key={l.nome}>
        <Stack direction="row" justifyContent="space-between" flexWrap="wrap" gap={1} sx={{ mb: 1 }}>
          <Typography fontWeight={700} fontSize={13}>{l.nome}</Typography>
          <Typography fontWeight={800} fontSize={13}>{formato(valor)} · {pct(total ? valor / total * 100 : 0)}</Typography>
        </Stack>
        <Box sx={{ height: 20, borderRadius: 2, bgcolor: "rgba(255,255,255,.09)", overflow: "hidden" }}>
          <Box sx={{ height: "100%", width: `${largura}%`, bgcolor: l.cor, borderRadius: 2, transition: "width .3s ease" }} />
        </Box>
      </Box>;
    })}
    {total === 0 && <Typography color="text.secondary">Nenhum registro encontrado no período.</Typography>}
  </Stack>;
}

export default function AnaliseVendas() {
  const [inicio, setInicio] = useState(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`; });
  const [fim, setFim] = useState(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()).padStart(2, "0")}`; });
  const [dados, setDados] = useState(null);
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);
  const [topClientes, setTopClientes] = useState([]);
  const [erroTop, setErroTop] = useState("");
  const [loadingTop, setLoadingTop] = useState(false);
  const carregar = useCallback(async () => {
    if (!inicio || !fim || inicio > fim) { setErro("Informe um intervalo válido."); return; }
    setLoading(true); setErro("");
    try {
      const res = await API.get("/analise-vendas", { params: { inicio, fim } });
      setDados(res.data);
    } catch (e) {
      setErro(e.response?.data?.message || "Não foi possível consultar a análise de vendas.");
      setDados(null);
    } finally { setLoading(false); }
  }, [inicio, fim]);
  useEffect(() => { carregar(); }, [carregar]);
  // O ranking é carregado separadamente, sem inicio/fim.
  const carregarTop = useCallback(async () => {
    setLoadingTop(true);
    setErroTop("");
    try {
      const res = await API.get("/analise-vendas/top-clientes");
      setTopClientes(res.data?.topClientes || []);
    } catch (e) {
      setErroTop(e.response?.data?.message || "Não foi possível carregar o Top 10 histórico.");
      setTopClientes([]);
    } finally {
      setLoadingTop(false);
    }
  }, []);
  useEffect(() => { carregarTop(); }, [carregarTop]);

  const pedidos = dados?.pedidos || {};
  const clientes = dados?.clientes || {};

  const cell = { color: "rgba(255,255,255,.86)", borderColor: "rgba(255,255,255,.1)" };
  return <Box sx={{ flex: 1, overflow: "auto", minHeight: 0, pb: 3 }}>
    <Stack spacing={2.5}>
      <Paper sx={panel}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ md: "center" }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" fontWeight={900}>Análise de Vendas</Typography>
            <Typography variant="body2" sx={{ color: "rgba(255,255,255,.7)" }}>Histórico completo para classificar; filtro por data de cadastro do pedido (created_at).</Typography>
          </Box>
          <TextField type="date" size="small" label="Data inicial" value={inicio} onChange={e => setInicio(e.target.value)} InputLabelProps={{ shrink: true }} sx={{ input: { color: "white" }, label: { color: "#bbb" } }} />
          <TextField type="date" size="small" label="Data final" value={fim} onChange={e => setFim(e.target.value)} InputLabelProps={{ shrink: true }} sx={{ input: { color: "white" }, label: { color: "#bbb" } }} />
          <Button variant="contained" onClick={carregar} disabled={loading} sx={{ bgcolor: "#7b5cff" }}>Atualizar</Button>
        </Stack>
      </Paper>
      {erro && <Alert severity="error">{erro}</Alert>}
      {loading && <Box sx={{ textAlign: "center", py: 3 }}><CircularProgress /></Box>}
      {dados && !loading && <>
        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 2 }}>
          {[
            ["Faturamento total", money(pedidos.valorTotal)], ["Pedidos no período", number(pedidos.total)],
            ["Clientes únicos", number(clientes.total)], ["Valor primeira compra", money(pedidos.valorPrimeira)],
            ["Valor recompra", money(pedidos.valorRecompra)],
            ["Taxa primeira compra (pedidos)", pct(pedidos.taxaPrimeira)],
            ["Taxa recompra (pedidos)", pct(pedidos.taxaRecompra)], ["Taxa clientes novos", pct(clientes.taxaNovos)]
          ].map(([rotulo, valor]) => <Paper key={rotulo} sx={panel}>
            <Typography variant="caption" sx={{ color: "#b9b9c9" }}>{rotulo}</Typography>
            <Typography variant="h6" fontWeight={800}>{valor}</Typography>
          </Paper>)}
        </Box>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" }, gap: 2 }}>
          <Paper sx={panel}>
            <Typography fontWeight={800}>Faturamento por tipo de pedido</Typography>
            <Typography variant="body2" sx={{ color: "#bbb" }}>Primeira compra: {money(pedidos.valorPrimeira)} · Recompra: {money(pedidos.valorRecompra)}</Typography>
            <GraficoBarras formato={money} linhas={[
              { nome: "Primeira compra", valor: pedidos.valorPrimeira, cor: "#8066ff" },
              { nome: "Recompra", valor: pedidos.valorRecompra, cor: "#20c5d7" }
            ]} />
          </Paper>
          <Paper sx={panel}>
            <Typography fontWeight={800}>Clientes no período</Typography>
            <Typography variant="body2" sx={{ color: "#bbb" }}>Novos: {number(clientes.novos)} · Recorrentes: {number(clientes.recorrentes)}</Typography>
            <GraficoBarras formato={number} linhas={[
              { nome: "Clientes novos", valor: clientes.novos, cor: "#8066ff" },
              { nome: "Clientes recorrentes", valor: clientes.recorrentes, cor: "#20c5d7" }
            ]} />
          </Paper>
        </Box>
        <Paper sx={panel}>
          <Typography fontWeight={900} variant="h6">Top 10 clientes por valor comprado</Typography>
          <Typography variant="body2" sx={{ color: "#bbb", mb: 2 }}>Histórico completo da empresa, independente das datas selecionadas. Quantidade de pedidos e valor total por CPF/CNPJ.</Typography>
          {erroTop && <Alert severity="error" sx={{ mb: 2 }}>{erroTop}</Alert>}
          {loadingTop && <CircularProgress size={24} sx={{ mb: 2 }} />}
          <TableContainer>
            <Table size="small" sx={{ minWidth: 560 }}>
              <TableHead><TableRow>
                {['Posição', 'Cliente', 'Pedidos', 'Valor comprado'].map(c => <TableCell key={c} sx={{ ...cell, fontWeight: 900 }}>{c}</TableCell>)}
              </TableRow></TableHead>
              <TableBody>
                {topClientes.map((c, i) => <TableRow key={c.documento || i} hover>
                  <TableCell sx={cell}>{i + 1}º</TableCell>
                  <TableCell sx={cell}><Typography fontWeight={700} fontSize={13}>{c.nome}</Typography><Typography variant="caption" sx={{ color: "#aaa" }}>Documento: ***{String(c.documento || '').slice(-4)}</Typography></TableCell>
                  <TableCell sx={cell}>{number(c.pedidos)}</TableCell>
                  <TableCell sx={{ ...cell, fontWeight: 800 }}>{money(c.valorTotal)}</TableCell>
                </TableRow>)}
                {!loadingTop && !erroTop && topClientes.length === 0 && <TableRow><TableCell colSpan={4} sx={cell}>Nenhum cliente com CPF/CNPJ encontrado no histórico.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
        <Typography variant="caption" sx={{ color: "#bbb" }}>O gráfico financeiro classifica cada pedido; o gráfico de clientes conta cada CPF/CNPJ uma vez. O histórico completo define primeira compra ou recompra antes do filtro. Datas baseadas em created_at (fuso America/Sao_Paulo).</Typography>
        <Typography variant="caption" sx={{ color: "#bbb" }}>Pedidos sem CPF/CNPJ no período: {number(dados.excluidos?.semDocumento)}. Pedidos sem created_at no histórico: {number(dados.excluidos?.semDataHistorico)}. Status dos pedidos: ainda sem exclusão automática até validação das regras de cancelamento.</Typography>
      </>}
    </Stack>
  </Box>;
}
