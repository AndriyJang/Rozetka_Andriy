// src/pages/ResetPassword.tsx
import Layout from "../components/Layout";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  Alert,
  CircularProgress,
  Link,
} from "@mui/material";

const EMAIL_ENDPOINT = "/api/Users/reset-by-email";
const PHONE_ENDPOINT = "/api/Users/reset-by-phone";

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

    const endpoint = isEmail ? EMAIL_ENDPOINT : PHONE_ENDPOINT;
    const payload = isEmail ? { email: identifier } : { phone: identifier };

    try {
      setSubmitting(true);

      const res = await fetch(`${apiUrl}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        // 404 з твого бекенду = користувача не знайдено
        if (res.status === 404) {
          setError(isEmail ? "Користувача з таким email не знайдено." : "Користувача з таким телефоном не знайдено.");
          return;
        }
        let msg = "Не вдалося надіслати інструкції. Спробуйте ще раз.";
        try {
          const d = await res.json();
          if (d?.message) msg = d.message;
        } catch {}
        throw new Error(msg);
      }

      // бекенд повертає текстове повідомлення
      let textMsg = "";
      try {
        textMsg = await res.text();
      } catch {}
      setSuccess(
        textMsg ||
          "Якщо такий обліковий запис існує, інструкції/тимчасовий пароль надіслано."
      );
      setIdentifier("");
    } catch (e: any) {
      setError(e?.message ?? "Сталася помилка. Спробуйте пізніше.");
    } finally {
      setSubmitting(false);
    }
  };

  const backToLogin = () => navigate("/login");

  return (
    <Layout>
      <Box
        sx={{
          width: 484,
          bgcolor: "#fff",
          mx: "auto",
          borderRadius: 3,
          boxShadow: 3,
          px: 4,
          py: 4,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {/* NUVORA pill */}
        <Box
          sx={{
            background: "linear-gradient(180deg, #0D9488 0%, #023854 100%)",
            borderRadius: "10px",
            px: 6,
            py: 1.25,
            boxShadow: 2,
            mb: 2.5,
            color: "#fff",
            fontWeight: "bold",
            fontSize: 20,
          }}
        >
          NUVORA
        </Box>

        <Typography
          variant="h6"
          sx={{ fontWeight: "bold", color: "#1E293B", mb: 2, textAlign: "center" }}
        >
          Відновлення облікового запису
        </Typography>

        <Typography
          variant="body2"
          sx={{ color: "text.secondary", textAlign: "center", mb: 2.5 }}
        >
          Введіть вашу електронну адресу або номер телефону, і ми
          надішлемо вам інструкції з відновлення паролю.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ width: "100%", mb: 2 }}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ width: "100%", mb: 2 }}>
            {success}
          </Alert>
        )}

        <Box sx={{ width: "100%" }}>
          <Typography sx={{ fontSize: 14, mb: 0.5 }}>
            Ел. пошта або номер телефону <span style={{ color: "#EF4444" }}>*</span>
          </Typography>
          <TextField
            fullWidth
            size="small"
            placeholder="your@email.com / +380XXXXXXXXX"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            sx={{ mb: 3, borderRadius: "10px" }}
          />
        </Box>

        <Button
          fullWidth
          variant="contained"
          onClick={handleSubmit}
          disabled={submitting}
          sx={{
            py: 1.25,
            fontWeight: "bold",
            textTransform: "none",
            borderRadius: "999px",
            background: "linear-gradient(90deg, #0D9488 0%, #023854 100%)",
            boxShadow: 4,
            mb: 1.5,
          }}
        >
          {submitting ? (
            <CircularProgress size={22} sx={{ color: "white" }} />
          ) : (
            "Надіслати"
          )}
        </Button>

        <Link
          component="button"
          underline="none"
          onClick={backToLogin}
          sx={{ color: "#0D9488", fontSize: 14 }}
        >
          Повернутися до входу
        </Link>
      </Box>
    </Layout>
  );
}
