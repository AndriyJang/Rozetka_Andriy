// src/pages/ResetPassword.tsx
import Layout from "../components/Layout";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  Box, Button, TextField, Typography, Alert, CircularProgress, Link,
} from "@mui/material";

const REQUEST_ENDPOINT = "/api/Users/request-reset";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^\+?\d{10,15}$/; // +XXXXXXXXXX… (10–15 цифр)

export default function ResetPassword() {
  const navigate = useNavigate();
  const apiUrl = import.meta.env.VITE_API_URL;

  const [identifier, setIdentifier] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    setSuccess(null);

    const isEmail = emailRegex.test(identifier);
    const isPhone = phoneRegex.test(identifier);
    if (!isEmail && !isPhone) {
      setError("Введіть коректний email або номер телефону у форматі +380XXXXXXXXX.");
      return;
    }

    const payload = isEmail ? { email: identifier } : { phone: identifier };

    try {
      setSubmitting(true);
      const res = await fetch(`${apiUrl}${REQUEST_ENDPOINT}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        let msg = "Не вдалося надіслати код. Спробуйте ще раз.";
        try {
          const d = await res.json();
          if (d?.message) msg = d.message;
        } catch {}
        throw new Error(msg);
      }

      setSuccess("Якщо такий обліковий запис існує, ми надіслали код підтвердження.");
      // ✅ Зберігаємо у localStorage, щоб NewPassword.tsx знав, кому міняти пароль
      localStorage.setItem("reset_identifier", identifier);
      // переходимо на сторінку введення коду й нового пароля, передаємо identifier
      setTimeout(() => {
        navigate("/new-password", { state: { identifier } });
      }, 600);
    } catch (e: any) {
      setError(e?.message ?? "Сталася помилка. Спробуйте пізніше.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout>
      <Box sx={{
        width: 484, bgcolor: "#fff", mx: "auto", borderRadius: 5,
        boxShadow: "0 12px 30px rgba(2,56,84,0.10)", px: 5, py: 5,
        display: "flex", flexDirection: "column", alignItems: "center",
      }}>
        <Box sx={{
          background: "linear-gradient(180deg, #0D9488 0%, #023854 100%)",
          borderRadius: "12px", px: 7, py: 1.4, color: "#fff", fontWeight: 700,
          fontSize: 20, letterSpacing: 0.4, mb: 3, boxShadow: "0 6px 0 rgba(2,56,84,0.18)",
        }}>
          NUVORA
        </Box>

        <Typography sx={{ fontWeight: 800, color: "#0F172A", fontSize: 22, lineHeight: 1.2, mb: 2, textAlign: "center" }}>
          Відновлення облікового запису
        </Typography>

        <Typography variant="body2" sx={{ color: "#6B7280", textAlign: "center", mb: 3, maxWidth: 420 }}>
          Введіть вашу електронну адресу або номер телефону, і ми надішлемо вам код підтвердження.
        </Typography>

        {error && <Alert severity="error" sx={{ width: "100%", mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ width: "100%", mb: 2 }}>{success}</Alert>}

        <Box sx={{ width: "100%" }}>
          <Typography sx={{ fontSize: 14, mb: 0.75, color: "#111827" }}>
            Ел. пошта або номер телефону <span style={{ color: "#EF4444" }}>*</span>
          </Typography>
          <TextField
            fullWidth
            placeholder="your@email.com / +380XXXXXXXXX"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            variant="outlined"
            sx={{
              mb: 3,
              "& .MuiOutlinedInput-root": {
                height: 44,
                borderRadius: "12px",
                backgroundColor: "#F4F7F7",
                "& fieldset": { borderColor: "#E5E7EB" },
                "&:hover fieldset": { borderColor: "#D1D5DB" },
                "&.Mui-focused fieldset": { borderColor: "#0D9488" },
                "& input::placeholder": { color: "#9CA3AF", opacity: 1 },
              },
            }}
          />
        </Box>

        <Button
          fullWidth
          variant="contained"
          onClick={handleSubmit}
          disabled={submitting}
          sx={{
            py: 1.3, fontWeight: 700, textTransform: "none", borderRadius: "999px", fontSize: 16,
            background: "linear-gradient(90deg, #0D9488 0%, #023854 100%)",
            boxShadow: "0 8px 18px rgba(2,56,84,0.22)", mb: 1.75,
            "&:hover": { boxShadow: "0 10px 20px rgba(2,56,84,0.26)" },
          }}
        >
          {submitting ? <CircularProgress size={22} sx={{ color: "white" }} /> : "Надіслати"}
        </Button>

        <Link component="button" underline="none" onClick={() => navigate("/login")} sx={{ color: "#0D9488", fontSize: 14 }}>
          Повернутися до входу
        </Link>
      </Box>
    </Layout>
  );
}
