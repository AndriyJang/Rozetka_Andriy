// src/components/Header.tsx
import {
  AppBar, Toolbar, Typography, Button, InputBase, Box, IconButton, Badge,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import { useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState, useCallback } from "react";

type Role = "Guest" | "User" | "Admin";

function safeGetToken(): string {
  try { return localStorage.getItem("token") ?? ""; } catch { return ""; }
}
function safeGetRoles(): string[] {
  try { return JSON.parse(localStorage.getItem("roles") || "[]"); } catch { return []; }
}

// Примітивний декодер JWT
function decodeJwt(token: string): any | null {
  try {
    const [, payload] = token.split(".");
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(json);
  } catch { return null; }
}

function getRoleFromToken(token: string): Role {
  if (!token) return "Guest";
  const p = decodeJwt(token) || {};
  if (typeof p.exp === "number" && p.exp * 1000 < Date.now()) return "Guest";
  const roles = Array.isArray(p.roles) ? p.roles : p.roles ? [p.roles] : safeGetRoles();
  return roles.includes("Admin") ? "Admin" : "User";
}

export default function Header() {
  const navigate = useNavigate();
  const [token, setToken] = useState<string>(() => safeGetToken());
  const role: Role = useMemo(() => getRoleFromToken(token), [token]);

  const RAW_API = import.meta.env.VITE_API_URL || "";
  const API = RAW_API.replace(/\/+$/, "");

  // Кількість товарів у кошику
  const [cartCount, setCartCount] = useState<number>(0);

  const fetchCartCount = useCallback(async () => {
    if (role === "Guest") { setCartCount(0); return; }
    try {
      const res = await fetch(`${API}/api/Cart/GetCart`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.status === 401) { setCartCount(0); return; }
      if (!res.ok) { setCartCount(0); return; }
      const data = await res.json();
      const count = Array.isArray(data)
        ? data.reduce((sum: number, it: any) => sum + Number(it?.quantity ?? 0), 0)
        : 0;
      setCartCount(Number.isFinite(count) ? count : 0);
    } catch { setCartCount(0); }
  }, [API, role, token]);

  // Оновлюємо токен при змінах у localStorage (в іншій вкладці) та при mount
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "token") setToken(safeGetToken());
      if (e.key === "roles") setToken(safeGetToken()); // ролі теж можуть змінитись
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // Підтягнути лічильник при зміні токена/ролі
  useEffect(() => { fetchCartCount(); }, [fetchCartCount]);

  // Коли вкладка повертається у фокус — оновити
  useEffect(() => {
    const onVis = () => { if (document.visibilityState === "visible") fetchCartCount(); };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [fetchCartCount]);

  // Стиль кнопки в правій частині
  const btnSx = {
    background: "linear-gradient(90deg, #023854 0%, #035B94 100%)",
    borderRadius: "20px",
    textTransform: "none",
    px: 4,
    boxShadow: 2,
    fontSize: 14,
    "&:hover": { opacity: 0.95, background: "linear-gradient(90deg, #023854 0%, #035B94 100%)" },
  } as const;

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
              sx={{ fontFamily: "Montserrat", fontWeight: "bold", fontSize: 32, color: "#023854", cursor: "pointer" }}
              onClick={() => navigate("/home")}
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
              <Button variant="contained" sx={btnSx} onClick={() => navigate("/login")}>
                Вхід
              </Button>
            )}
          </Box>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
