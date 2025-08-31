import Layout from "../components/Layout";
import {Button, TextField, Typography, Container, Alert, Box, Link} from "@mui/material";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const REGISTER_ENDPOINT = "/api/Account/Register";

// 8 символів, малі латиниця + цифри, цифра не перша (приклад: a1bcdefg)
const passwordRegex = /^(?=.*\d)(?!\d)[a-z0-9]{8}$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RegisterUser() {
  const navigate = useNavigate();
  const apiUrl = import.meta.env.VITE_API_URL;

  const [formData, setFormData] = useState({
    name: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((s) => ({ ...s, [name]: value }));
  };

  // const validate = () => {
  //   if (!form.FirstName.trim()) return "Вкажіть ім'я.";
  //   if (!emailRegex.test(form.Email)) return "Невірний email.";
  //   if (!passwordRegex.test(form.Password)) {
  //     return "Пароль: 8 символів, малі латиниця та цифри; цифра не перша (приклад: a1bcdefg).";
  //   }
  //   return null;
  // };

  const validate = () => {
    if (!formData.name.trim()) return "Ім'я є обов'язковим.";
    if (!formData.lastName.trim()) return "Прізвище є обов'язковим.";
    if (!emailRegex.test(formData.email)) return "Невірний формат ел. пошти.";
    /*if (!passwordRegex.test(formData.password)) {
      return "Пароль має бути рівно 6 символів, лише малі латинські та цифри; цифра не перша.";
    }*/
    if (formData.password !== formData.confirmPassword) {
      return "Паролі не співпадають.";
    }
    return null;
  };

  const handleSubmit = async () => {
    setError(null);
    setOkMsg(null);
    const v = validate();
    if (v) { setError(v); return; }

    try {
      setSubmitting(true);

      // Бекенд чекає FromForm → FormData (без заголовка Content-Type)
      const fd = new FormData();
      fd.append("FirstName", formData.name);
      fd.append("LastName", formData.lastName);
      fd.append("Email", formData.email);
      fd.append("Password", formData.password);

      const res = await fetch(`${apiUrl}${REGISTER_ENDPOINT}`, {
        method: "POST",
        body: fd,
      });

      if (!res.ok) {
        // Спробуємо показати деталі з Identity
        let msg = "Помилка при реєстрації.";
        try {
          const d = await res.json();
          if (Array.isArray(d?.errors)) msg = d.errors.join("\n");
          else if (typeof d?.errors === "string") msg = d.errors;
          else if (d?.message) msg = d.message;
        } catch {}
        throw new Error(msg);
      }

      const data = await res.json(); // очікуємо { Token: "..." }
      if (data?.Token) localStorage.setItem("token", data.Token);

      setOkMsg("Успішна реєстрація!");
      setTimeout(() => navigate("/product-search"), 600);
    } catch (e: any) {
      setError(e?.message ?? "Проблема з сервером.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
      <Layout>
        <Container
            maxWidth="sm"
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              minHeight: "90vh",
            }}
        >
          <Box
              sx={{
                backgroundColor: "#fff",
                p: 4,
                borderRadius: "10px",
                boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
                width: "100%",
                textAlign: "center",
              }}
          >
            {/* Логотип */}
            <Box
                sx={{
                  background: "linear-gradient(180deg, #0D9488 0%, #023854 100%)",
                  color: "#fff",
                  fontWeight: "bold",
                  display: "inline-block",
                  px: 4,
                  py: 1.6,
                  borderRadius: "8px",
                  fontSize: "18px",
                  mb: 2,
                }}
            >
              NUVORA
            </Box>

            {/* Заголовок */}
            <Typography
                variant="h6"
                sx={{ fontWeight: "bold", mb: 2, color: "#002244" }}
            >
              Створити обліковий запис
            </Typography>

            {error && (
                <Alert severity="error" sx={{ width: "100%", mb: 2 }}>
                  {error}
                </Alert>
            )}

            {/* Поля */}
            <TextField
                label="Ім'я *"
                name="name"
                value={formData.name}
                onChange={handleChange}
                fullWidth
                margin="normal"
            />
            <TextField
                label="Прізвище *"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                fullWidth
                margin="normal"
            />
            <TextField
                label="Ел. пошта *"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                fullWidth
                margin="normal"
                error={!!formData.email && !emailRegex.test(formData.email)}
                helperText={
                  !!formData.email && !emailRegex.test(formData.email)
                      ? "Невірний формат ел. пошти."
                      : " "
                }
            />
            <TextField
                label="Пароль *"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                fullWidth
                margin="normal"
                //error={!!formData.password && !passwordRegex.test(formData.password)}
                helperText={
                  !!formData.password
                      ? "6 символів, малі латинські та цифри; цифра не перша."
                      : " "
                }
            />
            <TextField
                label="Підтвердження паролю *"
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                fullWidth
                margin="normal"
                error={
                    !!formData.confirmPassword &&
                    formData.confirmPassword !== formData.password
                }
                helperText={
                  !!formData.confirmPassword &&
                  formData.confirmPassword !== formData.password
                      ? "Паролі не співпадають."
                      : " "
                }
            />

            {/* Кнопка */}
            <Button
                fullWidth
                sx={{
                  mt: 3,
                  background: "linear-gradient(to right, #004C99, #007ACC)",
                  color: "#fff",
                  py: 1.5,
                  fontWeight: "bold",
                  borderRadius: "25px",
                  "&:hover": {
                    background: "linear-gradient(to right, #003366, #005A99)",
                  },
                }}
                onClick={handleSubmit}
            >
              Зареєструватися
            </Button>

            {/* Посилання */}
            <Typography variant="body2" sx={{ mt: 2 }}>
              Є обліковий запис?{" "}
              <Link
                  sx={{ cursor: "pointer", color: "#007ACC" }}
                  onClick={() => navigate("/login")}
              >
                Увійти
              </Link>
            </Typography>
          </Box>
        </Container>
      </Layout>
  );
}