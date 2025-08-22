// src/pages/Login.tsx
import Layout from "../components/Layout";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  Box, Button, TextField, Typography, Link,
  Alert, CircularProgress
} from "@mui/material";
import { useGoogleLogin } from '@react-oauth/google';

const LOGIN_ENDPOINT = "/api/Account/Login"; // ← бекенд
const passwordRegex = /^(?=.*\d)(?!\d)[a-z0-9]{8}$/; // 8 символів, малі латинські + цифри, цифра не перша
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Примітивний декодер JWT (без залежностей)
function decodeJwt<T = any>(token: string): T | null {
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
  } catch {
    return null;
  }
}

export default function Login() {
  const navigate = useNavigate();
  const apiUrl = import.meta.env.VITE_API_URL;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loginbygoogle = useGoogleLogin({
  onSuccess: tokenResponse => console.log(tokenResponse),
});
  const validate = () => {
    if (!emailRegex.test(email)) return "Невірний формат ел. пошти.";
    if (!passwordRegex.test(password)) {
      return "Пароль має бути рівно 8 символів, лише малі латинські та цифри; цифра не перша.";
    }
    return null;
  };

  const handleSubmit = async () => {
    setError(null);
    const v = validate();
    if (v) { setError(v); return; }

    try {
      setSubmitting(true);

      const res = await fetch(`${apiUrl}${LOGIN_ENDPOINT}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (res.status === 401) {
        setError("Логін або пароль невірний.");
        return;
      }
      if (!res.ok) {
        let msg = "Сталася помилка на сервері.";
        try {
          const d = await res.json();
          if (d?.message) msg = d.message;
        } catch {}
        throw new Error(msg);
      }

      const data = await res.json();
      // Бек може повернути { Token: "..."} або { token: "..." }
      const token: string | undefined = data?.Token ?? data?.token;
      if (!token) {
        setError("Сервер не повернув токен.");
        return;
      }

      localStorage.setItem("token", token);

      // ✓ Декодуємо токен, дістаємо ролі
      const payload = decodeJwt<{ roles?: string | string[]; role?: string | string[] }>(token);
      const raw =
        (Array.isArray(payload?.roles) ? payload?.roles : payload?.roles ? [payload?.roles] : []) as string[];
      const raw2 =
        (Array.isArray(payload?.role) ? payload?.role : payload?.role ? [payload?.role] : []) as string[];
      const roles = [...raw, ...raw2].map(r => String(r));

      // збережемо роли (може стати у пригоді в UI)
      if (roles.length) localStorage.setItem("roles", JSON.stringify(roles));

      // Редірект за роллю
      if (roles.includes("Admin")) {
        navigate("/admin");
      } else {
        navigate("/product-search");
      }
    } catch (e: any) {
      setError(e?.message ?? "Не вдалося увійти.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegisterRedirect = () => navigate("/register-user");
  const handleResetPasswordRedirect = () => navigate("/reset-password");

  return (
    <Layout>
      <Box
        sx={{
          width: 484, height: 520, bgcolor: "#fff", mx: "auto",
          borderRadius: 4, boxShadow: 3, px: 4, py: 5,
          display: "flex", flexDirection: "column", alignItems: "center",
        }}
      >
        <Box sx={{
          background: "linear-gradient(180deg, #0D9488 0%, #023854 100%)",
          borderRadius: "10px", px: 6, py: 1.5, boxShadow: 2, mb: 3,
          color: "#fff", fontWeight: "bold", fontSize: 20,
        }}>
          NUVORA
        </Box>

        <Typography variant="h6" sx={{ mb: 3, color: "#1E293B", fontWeight: "bold", fontSize: 20 }}>
          Вхід до облікового запису
        </Typography>

        {error && <Alert severity="error" sx={{ width: "100%", mb: 2 }}>{error}</Alert>}

        <Box sx={{ width: "100%" }}>
          <Typography sx={{ fontSize: 14, mb: 0.5 }}>
            Ел. пошта <span style={{ color: "#EF4444" }}>*</span>
          </Typography>
          <TextField
            fullWidth
            placeholder="you@example.com"
            type="email"
            size="small"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            sx={{ mb: 2, borderRadius: "10px" }}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            error={!!email && !emailRegex.test(email)}
            helperText={!!email && !emailRegex.test(email) ? "Невірний формат ел. пошти." : " "}
          />
        </Box>

        <Box sx={{ width: "100%" }}>
          <Typography sx={{ fontSize: 14, mb: 0.5 }}>
            Пароль <span style={{ color: "#EF4444" }}>*</span>
          </Typography>
          <TextField
            fullWidth
            type="password"
            size="small"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            sx={{ mb: 1, borderRadius: "10px" }}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            error={!!password && !passwordRegex.test(password)}
            helperText={
              !!password && !passwordRegex.test(password)
                ? "8 символів, малі латинські та цифри; цифра не перша."
                : " "
            }
          />
          <Box sx={{ textAlign: "right", mb: 3 }}>
            <Link
              component="button"
              underline="none"
              onClick={handleResetPasswordRedirect}
              sx={{ fontSize: 14, color: "#0D9488" }}
            >
              Забули пароль?
            </Link>
          </Box>
        </Box>

        <Button
          fullWidth
          variant="contained"
          onClick={handleSubmit}
          disabled={submitting}
          sx={{
            mt: 1, py: 1.5, fontWeight: "bold", fontSize: 16, borderRadius: 999,
            background: "linear-gradient(90deg, #023854 0%, #035B94 100%)", boxShadow: 4,
          }}
        >
          {submitting ? <CircularProgress size={22} sx={{ color: "white" }} /> : "Увійти"}
        </Button>
        {/* <Button
            fullWidth
            variant="outlined"
            sx={{ mt: 2, borderRadius: 999 }}
            component="a"
            href={`${import.meta.env.VITE_API_URL}/api/Account/ExternalLogin/google`} 
            >
            Увійти через Google
        </Button> */}
        <Button onClick={() => loginbygoogle()}>Sign in with Google 🚀</Button>
        <Typography sx={{ mt: 3, fontSize: 14 }}>
          Ще не маєте облікового запису?{" "}
          <Link
            component="button"
            underline="none"
            onClick={handleRegisterRedirect}
            sx={{ color: "#0D9488", fontWeight: 500 }}
          >
            Зареєструватися
          </Link>
        </Typography>
      </Box>
    </Layout>
  );
}
