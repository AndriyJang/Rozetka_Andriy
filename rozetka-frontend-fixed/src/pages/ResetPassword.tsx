import { TextField, Button, Container, Typography, Stack } from '@mui/material';
import { useState } from 'react';

export default function ResetPassword() {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const apiUrl = import.meta.env.VITE_API_URL;

  const validateEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const validatePhone = (phone: string) =>
    /^\d{10,15}$/.test(phone);

  const handleEmailReset = async () => {
    if (!validateEmail(email)) return alert('Введіть правильний email');

    try {
      const response = await fetch(`${apiUrl}/api/users/reset-by-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        alert('Пароль надіслано на email');
      } else {
        alert('Помилка при надсиланні email');
      }
    } catch (err) {
      alert('Сервер недоступний');
      console.error(err);
    }
  };

  const handlePhoneReset = async () => {
    if (!validatePhone(phone)) return alert('Телефон має містити 10–15 цифр');

    try {
      const response = await fetch(`${apiUrl}/api/users/reset-by-phone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });

      if (response.ok) {
        alert('Пароль надіслано через SMS');
      } else {
        alert('Помилка при надсиланні SMS');
      }
    } catch (err) {
      alert('Сервер недоступний');
      console.error(err);
    }
  };

  return (
    <Container sx={{ mt: 5 }} maxWidth="sm">
      <Typography variant="h5" gutterBottom>
        Відновлення паролю
      </Typography>

      <TextField
        label="Email"
        fullWidth
        margin="normal"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <Button
        fullWidth
        variant="contained"
        color="primary"
        onClick={handleEmailReset}
      >
        Відновити за допомогою пошти
      </Button>

      <Typography sx={{ mt: 4 }} variant="h6">
        або
      </Typography>

      <TextField
        label="Телефон"
        fullWidth
        margin="normal"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
      />
      <Button
        fullWidth
        variant="contained"
        color="secondary"
        onClick={handlePhoneReset}
      >
        Відновити за допомогою телефона
      </Button>
    </Container>
  );
}
