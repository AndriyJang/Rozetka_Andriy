// src/pages/NewPassword.tsx
import Layout from "../components/Layout";
import { useLocation, useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";
import {
  Box, Button, TextField, Typography, Link, Alert, CircularProgress,
} from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";

const CONFIRM_ENDPOINT = "/api/Users/confirm-reset";

// 6 цифр
const codeRegex = /^\d{6}$/;
// 8 символів, малі латинські + цифри, цифра не перша
const pwdRegex = /^(?=.*\d)(?!\d)[a-z0-9]{8}$/;
// визначення email/phone
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^\+?\d{10,15}$/;

export default function NewPassword() {
  const navigate = useNavigate();
  const { state } = useLocation() as { state?: { identifier?: string } };
  const apiUrl = import.meta.env.VITE_API_URL;

  // ідентифікатор беремо зі state або з localStorage
  const identifier = useMemo(
    () => state?.identifier ?? localStorage.getItem("reset_identifier") ?? "",
    [state?.identifier]
  );

  const isEmail = emailRegex.test(identifier);
  const isPhone = phoneRegex.test(identifier);

  const [code, setCode] = useState<string>("");
  const [password, setPassword] = useState<string>("");

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const codeError = !!code && !codeRegex.test(code);
  const pwdError = !!password && !pwdRegex.test(password);

  const isFormValid =
    !!identifier && (isEmail || isPhone) &&
    codeRegex.test(code) && pwdRegex.test(password);

  const handleChangePassword = async () => {
    setError(null);
    setSuccess(null);

    if (!isFormValid) {
      setError(
        "Перевірте код (6 цифр) і пароль (8 символів: малі літери та цифри; цифра не перша)."
      );
      return;
    }

    // Формуємо payload під твій бекенд
    const payload: any = { code, newPassword: password };
    if (isEmail) payload.email = identifier;
    if (isPhone) payload.phone = identifier;

    try {
      setSubmitting(true);
      const res = await fetch(`${apiUrl}${CONFIRM_ENDPOINT}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        // попробуємо прочитати повідомлення бекенду
        let msg = "Не вдалося змінити пароль.";
        try {
          const d = await res.json();
          if (d?.message) msg = d.message;
        } catch {}
        throw new Error(msg);
      }

      setSuccess("Пароль змінено. Тепер ви можете увійти.");
      localStorage.removeItem("reset_identifier");
      setTimeout(() => navigate("/login"), 1000);
    } catch (e: any) {
      setError(e?.message ?? "Сталася помилка. Спробуйте пізніше.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout>
      <Box
        sx={{
          width: 520,
          bgcolor: "#fff",
          mx: "auto",
          mt: { xs: 4, md: 6 },
          borderRadius: 5,
          boxShadow: "0 12px 30px rgba(2,56,84,0.10)",
          px: 5,
          py: 5,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
        }}
      >
        {/* NUVORA pill */}
        <Box
          sx={{
            background: "linear-gradient(180deg, #0D9488 0%, #023854 100%)",
            borderRadius: "12px",
            px: 7,
            py: 1.2,
            color: "#fff",
            fontWeight: 700,
            fontSize: 18,
            mb: 2.5,
            boxShadow: "0 6px 0 rgba(2,56,84,0.18)",
          }}
        >
          NUVORA
        </Box>

        <Typography sx={{ fontWeight: 800, color: "#0F172A", fontSize: 22, mb: 1 }}>
          Відновлення паролю
        </Typography>

        <CheckCircleOutlineIcon sx={{ fontSize: 56, color: "#0D9488", my: 1 }} />

        {/* Пояснення */}
        <Typography sx={{ fontWeight: 700, color: "#0F172A", mb: 1 }}>
          Інструкції надіслано!
        </Typography>
        <Typography variant="body2" sx={{ color: "#6B7280", maxWidth: 420, mb: 3 }}>
          Перевірте пошту або SMS. Введіть отриманий код і новий пароль нижче.
        </Typography>

        {/* Помилки/успіх */}
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

        {/* Поле коду */}
        <Box sx={{ width: "100%", textAlign: "left" }}>
          <Typography sx={{ fontSize: 14, mb: 0.5 }}>
            Введіть надісланий код <span style={{ color: "#EF4444" }}>*</span>
          </Typography>
          <TextField
            fullWidth
            placeholder="6 цифр"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleChangePassword()}
            error={codeError}
            helperText={codeError ? "Код має містити рівно 6 цифр." : " "}
            size="small"
            sx={{ mb: 2, borderRadius: "10px" }}
          />
        </Box>

        {/* Поле нового пароля */}
        <Box sx={{ width: "100%", textAlign: "left" }}>
          <Typography sx={{ fontSize: 14, mb: 0.5 }}>
            Введіть новий пароль <span style={{ color: "#EF4444" }}>*</span>
          </Typography>
          <TextField
            fullWidth
            type="password"
            placeholder="8 символів: малі літери та цифри, цифра не перша"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleChangePassword()}
            error={pwdError}
            helperText={pwdError ? "Приклад: a1bcdefg (8 символів, цифра не перша)." : " "}
            size="small"
            sx={{ mb: 3, borderRadius: "10px" }}
          />
        </Box>

        {/* Кнопка: Змінити пароль (як “Вхід”) */}
        <Button
          fullWidth
          variant="contained"
          onClick={handleChangePassword}
          disabled={!isFormValid || submitting}
          sx={{
            mb: 1.5,
            py: 1.4,
            fontWeight: "bold",
            fontSize: 16,
            textTransform: "none",
            borderRadius: "999px",
            background: "linear-gradient(90deg, #023854 0%, #035B94 100%)",
            boxShadow: 4,
          }}
        >
          {submitting ? (
            <CircularProgress size={22} sx={{ color: "white" }} />
          ) : (
            "Змінити пароль"
          )}
        </Button>

        {/* Кнопка: Спробувати ще раз */}
        <Button
          fullWidth
          variant="outlined"
          onClick={() => navigate("/reset-password")}
          sx={{
            py: 1.2,
            borderRadius: "999px",
            textTransform: "none",
            fontWeight: 600,
            borderWidth: 2,
            borderColor: "#0D9488",
            color: "#0D9488",
            boxShadow: "0 6px 0 rgba(2,56,84,0.12)",
            "&:hover": {
              borderWidth: 2,
              borderColor: "#0D9488",
              backgroundColor: "rgba(13,148,136,0.08)",
            },
            mt: 0.5,
            mb: 1.5,
          }}
        >
          Спробувати ще раз
        </Button>

        <Link
          component="button"
          underline="none"
          onClick={() => navigate("/login")}
          sx={{ color: "#0D9488", fontSize: 14, mt: 0.5 }}
        >
          Повернутися до входу
        </Link>
      </Box>
    </Layout>
  );
}
