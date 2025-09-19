import {
  AppBar, Toolbar, Typography, Button, InputBase, Box, IconButton, Badge
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import { useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";

type Role = "Guest" | "User" | "Admin";

function decodeJwt(token: string) {
  try {
    const [, payload] = token.split(".");
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(decodeURIComponent(escape(json)));
  } catch { return null; }
}

function getRoleFromToken(token: string): Role {
  if (!token) return "Guest";
  const p = decodeJwt(token) || {};
  // якщо є exp і він минув — вважаємо гість
  if (typeof p.exp === "number" && p.exp * 1000 < Date.now()) return "Guest";
  const roles = Array.isArray(p.roles) ? p.roles : (p.roles ? [p.roles] : []);
  return roles.includes("Admin") ? "Admin" : "User";
}

export default function Header() {
  const navigate = useNavigate();

  // читаємо токен щоразу, коли вкладка оновилась або інша вкладка змінила localStorage
  const [token, setToken] = useState<string>(() => localStorage.getItem("token") ?? "");
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "token") setToken(localStorage.getItem("token") ?? "");
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const role: Role = useMemo(() => getRoleFromToken(token), [token]);

  // (якщо буде енд-поінт) — поки 0
  const cartCount = 0;

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
              sx={{ fontFamily: "Montserrat", fontWeight: "bold", fontSize: 32, color: "#023854" }}
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
            inputProps={{ sx: { textAlign: "center" } }}
          />
        </Box>

        {/* Права частина */}
        <Box sx={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Typography sx={{ color: "#023854", fontSize: 14 }}>UA / ENG</Typography>

            {role === "Admin" ? (
              <IconButton
                onClick={() => navigate("/admin")}
                sx={{
                  width: 44, height: 44, borderRadius: "22px",
                  background: "linear-gradient(90deg, #023854 0%, #035B94 100%)",
                  boxShadow: 2, color: "#fff",
                  "&:hover": { opacity: 0.95, background: "linear-gradient(90deg, #023854 0%, #035B94 100%)" },
                }}
                aria-label="Адмін"
                title="Адмін"
              >
                <AdminPanelSettingsIcon />
              </IconButton>
            ) : role === "User" ? (
              <IconButton
                onClick={() => navigate("/cart")}
                sx={{
                  width: 44, height: 44, borderRadius: "22px",
                  background: "linear-gradient(90deg, #023854 0%, #035B94 100%)",
                  boxShadow: 2, color: "#fff",
                  "&:hover": { opacity: 0.95, background: "linear-gradient(90deg, #023854 0%, #035B94 100%)" },
                }}
                aria-label="Кошик"
                title="Кошик"
              >
                <Badge color="error" badgeContent={cartCount} overlap="circular">
                  <ShoppingCartIcon />
                </Badge>
              </IconButton>
            ) : (
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
            )}
          </Box>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
