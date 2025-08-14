import Layout from "../components/Layout";
import {
  Button,
  TextField,
  Typography,
  Container,
  Box,
  Link,
} from "@mui/material";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function RegisterUser() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    if (formData.password !== formData.confirmPassword) {
      alert("Паролі не співпадають");
      return;
    }
    alert("Форма відправлена!");
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
            label="Ел. пошта *"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="you@example.com"
            fullWidth
            margin="normal"
          />
          <TextField
            label="Пароль *"
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Підтвердження паролю *"
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            fullWidth
            margin="normal"
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