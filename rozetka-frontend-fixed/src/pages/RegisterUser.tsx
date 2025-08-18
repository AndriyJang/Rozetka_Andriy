import Layout from "../components/Layout";
import {
  Button,
  TextField,
  Typography,
  Container,
  Box,
  Link,
  Alert
} from "@mui/material";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

//const passwordRegex = /^(?=.*\d)(?!\d)[a-z0-9]{6}$/; // 6 символів, малі латинські + цифри, цифра не перша
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RegisterUser() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

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
    const err = validate();
    if (err) {
      setError(err);
      return;
    }

    alert("Форма відправлена!"); // тут буде запит на бекенд
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