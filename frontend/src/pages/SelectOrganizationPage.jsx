import { Box, Container, Typography, Paper, Button, Stack } from "@mui/material";
import BusinessIcon from "@mui/icons-material/Business";

export default function SelectOrganizationPage({ onSelect }) {
  const options = [
    { id: "malagah", name: "Málagah", desc: "Rotinas padrão / integração principal" },
    { id: "itsmy", name: "It's My", desc: "Catálogo e pedidos (variante It's My)" },
  ];

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        px: 2,
        background:
          "radial-gradient(900px 600px at 20% 10%, rgba(123,92,255,.30), transparent 60%)," +
          "radial-gradient(900px 600px at 80% 20%, rgba(111,121,255,.25), transparent 55%)," +
          "linear-gradient(180deg, #0b1020 0%, #090b12 100%)",
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={0}
          sx={{
            p: 4,
            borderRadius: 4,
            border: "1px solid rgba(255,255,255,.10)",
            backgroundColor: "rgba(255,255,255,.06)",
            backdropFilter: "blur(14px)",
            boxShadow: "0 20px 70px rgba(0,0,0,.45)",
          }}
        >
          <Typography variant="h5" sx={{ color: "white" }}>
            Escolha uma organização
          </Typography>
          <Typography variant="body2" sx={{ mt: 1, color: "rgba(255,255,255,.7)" }}>
            Isso define quais scripts e integrações serão exibidos no dashboard.
          </Typography>

          <Stack spacing={2} sx={{ mt: 3 }}>
            {options.map((opt) => (
              <Button
                key={opt.id}
                onClick={() => onSelect(opt.id)}
                variant="outlined"
                startIcon={<BusinessIcon />}
                sx={{
                  justifyContent: "flex-start",
                  py: 1.6,
                  borderRadius: 3,
                  color: "white",
                  borderColor: "rgba(255,255,255,.18)",
                  backgroundColor: "rgba(0,0,0,.18)",
                  "&:hover": {
                    borderColor: "rgba(255,255,255,.30)",
                    backgroundColor: "rgba(0,0,0,.26)",
                  },
                }}
              >
                <Box sx={{ textAlign: "left" }}>
                  <Typography sx={{ fontWeight: 800, lineHeight: 1.1 }}>{opt.name}</Typography>
                  <Typography variant="caption" sx={{ color: "rgba(255,255,255,.7)" }}>
                    {opt.desc}
                  </Typography>
                </Box>
              </Button>
            ))}
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}
