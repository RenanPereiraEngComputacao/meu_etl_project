import React, { useEffect, useState } from "react";
import {
  Container,
  Button,
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import API from "../services/api";

function Dashboard({ onLogout }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  const scripts = [
    "att_estoque.py",
    "att_produtos.py",
    "sync_order.py",
    "att_clientes.py",
  ];

  const fetchLogs = async () => {
    const res = await API.get("/logs");
    setLogs(res.data);
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const runScript = async (script) => {
    setLoading(true);
    await API.post(`/run-script/${script}`);
    await fetchLogs();
    setLoading(false);
  };

  return (
    <Container>
      <Box mt={4} mb={2} display="flex" justifyContent="space-between">
        <Typography variant="h4">Dashboard</Typography>
        <Button variant="outlined" onClick={onLogout}>
          Sair
        </Button>
      </Box>

      <Box mb={3}>
        {scripts.map((script) => (
          <Button
            key={script}
            variant="contained"
            color="primary"
            onClick={() => runScript(script)}
            disabled={loading}
            style={{ marginRight: "10px", marginBottom: "10px" }}
          >
            Executar - {script}
          </Button>
        ))}
      </Box>

      <Typography variant="h5">Últimos Logs</Typography>
      <List>
        {logs.map((log) => (
          <ListItem key={log.id} divider>
            <ListItemText
              primary={`${log.script_name} - ${new Date(
                log.created_at
              ).toLocaleString()}`}
              secondary={log.output}
            />
          </ListItem>
        ))}
      </List>
    </Container>
  );
}

export default Dashboard;
