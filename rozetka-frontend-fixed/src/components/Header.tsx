import { AppBar, Toolbar, Typography, Button, InputBase, Box, IconButton } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import { useNavigate } from "react-router-dom";

export default function Header() {
  const navigate = useNavigate();

  return (
    <AppBar position="static" sx={{ backgroundColor: "#FFFFFF", boxShadow: 1 }}>
      <Toolbar sx={{ px: 3, minHeight: 80 }}>
        {/* Ліва частина */}
        <Box sx={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <IconButton edge="start">
              <MenuIcon sx={{ color: "#023854", fontSize: 24 }} />
            </IconButton>
            <Typography
              variant="h6"
              sx={{
                fontFamily: "Montserrat",
                fontWeight: "bold",
                fontSize: 32,
                color: "#023854",
              }}
            >
              NUVORA
            </Typography>
          </Box>
        </Box>

        {/* Центр: пошук */}
        <Box sx={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center" }}>
          <InputBase
            placeholder="Я шукаю..."
            sx={{
              backgroundColor: "#EFF3F3",
              borderRadius: "20px",
              px: 2,
              py: 1,
              width: "100%",
              maxWidth: 640,
              fontSize: 16,
              color: "#023854",
            }}
            inputProps={{
              sx: { textAlign: "center" },
            }}
          />
        </Box>

        {/* Права частина */}
        <Box sx={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Typography sx={{ color: "#023854", fontSize: 14 }}>UA / ENG</Typography>
            <Button
              variant="contained"
              sx={{
                background: "linear-gradient(90deg, #023854 0%, #035B94 100%)",
                borderRadius: "20px",
                textTransform: "none",
                px: 4,
                boxShadow: 2,
                fontSize: 14,
              }}
              onClick={() => navigate("/login")}
            >
              Вхід
            </Button>
          </Box>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
