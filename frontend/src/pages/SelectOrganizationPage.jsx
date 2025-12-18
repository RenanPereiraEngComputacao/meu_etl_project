  import { Box, Button, Container, Typography, Paper } from "@mui/material";

  export default function SelectOrganizationPage({ onSelect }) {
    return (
      <Box 
        sx={{
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          background: "linear-gradient(135deg, #7b5cff 0%, #6f79ff 100%)",
        }}
      >
        <Paper sx={{ p: 4, borderRadius: 3, width: 350, textAlign: "center" }}>
          
          <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold" }}>
            Escolha uma organização
          </Typography>

          

          <Button 
            fullWidth 
            variant="outlined" 
            sx={{ mb: 2, borderRadius: 2, py: 1.5 }}
            onClick={() => onSelect("malagah")}
          >
            Málagah
          </Button>

          <Button 
            fullWidth 
            variant="outlined" 
            sx={{ borderRadius: 2, py: 1.5 }}
            onClick={() => onSelect("itsmy")}
          >
            It's My
          </Button>

        </Paper>
      </Box>
    );
  }
