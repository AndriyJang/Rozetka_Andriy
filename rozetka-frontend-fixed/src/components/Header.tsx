// src/components/Header.tsx
import {
  AppBar, Toolbar, Typography, Button, InputBase, Box, IconButton
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
  if (typeof p.exp === "number" && p.exp * 1000 < Date.now()) return "Guest";
  const roles = Array.isArray(p.roles) ? p.roles : (p.roles ? [p.roles] : []);
  return roles.includes("Admin") ? "Admin" : "User";
}

const RAW_API = import.meta.env.VITE_API_URL ?? "";
const API = RAW_API.replace(/\/+$/, "");

export default function Header() {
  const navigate = useNavigate();

  const [token, setToken] = useState<string>(() => localStorage.getItem("token") ?? "");
  const role: Role = useMemo(() => getRoleFromToken(token), [token]);

  // два числа: distinct / totalQty
  const [distinctCount, setDistinctCount] = useState(0);
  const [totalQty, setTotalQty] = useState(0);

  // ✅ Побудова headers без проблем з типами
  const buildHeaders = (): Headers => {
    const h = new Headers();
    if (token) h.set("Authorization", `Bearer ${token}`);
    return h;
  };

  const loadCartCounters = async () => {
    if (!token) { setDistinctCount(0); setTotalQty(0); return; }
    try {
      const r = await fetch(`${API}/api/Cart/GetCart`, { headers: buildHeaders() });
      const data = r.ok ? await r.json() : [];
      if (Array.isArray(data)) {
        setDistinctCount(data.length);
        setTotalQty(data.reduce((s: number, it: any) => s + Number(it?.quantity ?? 0), 0));
      } else {
        setDistinctCount(0);
        setTotalQty(0);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "token") setToken(localStorage.getItem("token") ?? "");
      if (e.key === "cart:changed") loadCartCounters();
    };
    window.addEventListener("storage", onStorage);

    const onLocal = () => loadCartCounters();
    window.addEventListener("cart:changed", onLocal as EventListener);

    loadCartCounters();

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("cart:changed", onLocal as EventListener);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

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
    position: "relative",
    "&:hover": { opacity: 0.95, background: "linear-gradient(90deg, #023854 0%, #035B94 100%)" },
  }}
  aria-label="Кошик"
  title="Кошик"
>
  <ShoppingCartIcon />

  {/* ДВОРІВНЕВИЙ ЛЕЙБЛ — винесений правіше і вище іконки */}
  <Box
    sx={{
      position: "absolute",
      top: -8,
      right: -18,          // було -4 — виніс правіше
      transform: "none",   // можна 'translateX(0)' для ясності
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 0.2,
      px: 0.7,
      py: 0.5,
      bgcolor: "#e11d48",
      color: "#fff",
      borderRadius: "8px",
      minWidth: 20,
      lineHeight: 1,
      pointerEvents: "none", // щоб не заважав кліку
      boxShadow: 2,
    }}
  >
    <Typography sx={{ fontSize: 10, fontWeight: 800, m: 0, lineHeight: 1 }}>
      {distinctCount}
    </Typography>
    <Typography sx={{ fontSize: 10, fontWeight: 800, m: 0, lineHeight: 1 }}>
      {totalQty}
    </Typography>
  </Box>
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
