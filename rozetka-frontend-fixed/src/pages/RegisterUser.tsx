import Layout from "../components/Layout";
import { Button, TextField, Typography, Container, Alert } from "@mui/material";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const REGISTER_ENDPOINT = "/api/Account/Register";

// 8 символів, малі латиниця + цифри, цифра не перша (приклад: a1bcdefg)
const passwordRegex = /^(?=.*\d)(?!\d)[a-z0-9]{8}$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RegisterUser() {
  const navigate = useNavigate();
  const apiUrl = import.meta.env.VITE_API_URL;

  const [form, setForm] = useState({
    FirstName: "",
    Email: "",
    Password: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  };

  const validate = () => {
    if (!form.FirstName.trim()) return "Вкажіть ім'я.";
    if (!emailRegex.test(form.Email)) return "Невірний email.";
    if (!passwordRegex.test(form.Password)) {
      return "Пароль: 8 символів, малі латиниця та цифри; цифра не перша (приклад: a1bcdefg).";
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
      fd.append("FirstName", form.FirstName);
      fd.append("Email", form.Email);
      fd.append("Password", form.Password);

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
      <Container maxWidth="sm" sx={{ mt: 5 }}>
        <Typography variant="h5" sx={{ mb: 2 }}>Реєстрація</Typography>

        {error && <Alert severity="error" sx={{ mb: 2, whiteSpace: "pre-line" }}>{error}</Alert>}
        {okMsg && <Alert severity="success" sx={{ mb: 2 }}>{okMsg}</Alert>}

        <TextField
          label="Ім'я"
          name="FirstName"
          fullWidth
          margin="normal"
          value={form.FirstName}
          onChange={onChange}
        />
        <TextField
          label="Email"
          name="Email"
          fullWidth
          margin="normal"
          value={form.Email}
          onChange={onChange}
          error={!!form.Email && !emailRegex.test(form.Email)}
          helperText={!!form.Email && !emailRegex.test(form.Email) ? "Невірний email." : " "}
        />
        <Typography variant="body2" color="textSecondary">
          Пароль має містити лише малі англійські літери та цифри, <b>рівно 8 символів</b>, цифра не перша (напр., <code>a1bcdefg</code>).
        </Typography>
        <TextField
          label="Пароль"
          name="Password"
          type="password"
          fullWidth
          margin="normal"
          value={form.Password}
          onChange={onChange}
          error={!!form.Password && !passwordRegex.test(form.Password)}
          helperText={
            !!form.Password && !passwordRegex.test(form.Password)
              ? "8 символів, малі літери та цифри; цифра не перша."
              : " "
          }
          onKeyDown={(e) => e.key === "Enter" && !submitting && handleSubmit()}
        />

        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={submitting}
          sx={{
            mt: 1.5,
            textTransform: "none",
            fontWeight: 700,
            borderRadius: "999px",
            px: 3,
            py: 1.2,
            background: "linear-gradient(90deg, #023854 0%, #035B94 100%)",
            boxShadow: 4,
          }}
        >
          {submitting ? "Надсилаю..." : "Зареєструватися"}
        </Button>
      </Container>
    </Layout>
  );
}