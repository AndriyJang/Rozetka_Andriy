import Layout from "../components/Layout";
import { Button, TextField, Typography, Container } from "@mui/material";
import { useState } from "react";

export default function RegisterUser() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validateEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validatePhone = (phone: string) => /^\d{10,15}$/.test(phone);
  const validatePassword = (password: string) =>
    /^[a-z0-9]{6,}$/.test(password);

  const handleSubmit = async () => {
    const { name, email, phone, password } = formData;

    if (!validateEmail(email)) return alert("Невірний email");
    if (!validatePhone(phone)) return alert("Телефон має 10-15 цифр");
    if (!validatePassword(password))
      return alert("Пароль має бути від 6 символів, лише малі англ. літери і цифри");

   const apiUrl = import.meta.env.VITE_API_URL;

try {
  const response = await fetch(`${apiUrl}/api/Users/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(formData),
  });

  if (response.ok) {
    alert("Успішна реєстрація");
  } else {
    alert("Помилка при реєстрації");
  }
} catch (error) {
  alert("Проблема з сервером");
  console.error(error);
}
  };

  return (
    <Layout>
     <Container maxWidth="sm" sx={{ mt: 5 }}>
      <Typography variant="h5">Реєстрація</Typography>
      <TextField label="Ім'я" name="name" fullWidth margin="normal" onChange={handleChange} />
      <TextField label="Email" name="email" fullWidth margin="normal" onChange={handleChange} />
      <TextField label="Телефон" name="phone" fullWidth margin="normal" onChange={handleChange} />
      <Typography variant="body2" color="textSecondary">
        Пароль має містити лише **малі англійські літери** та **цифри**, мінімум 6 символів
      </Typography>
      <TextField
        label="Пароль"
        name="password"
        type="password"
        fullWidth
        margin="normal"
        onChange={handleChange}
      />
      <Button variant="contained" color="primary" onClick={handleSubmit}>
        Зареєструватися
      </Button>
    </Container>   
    </Layout> 
  );
}
