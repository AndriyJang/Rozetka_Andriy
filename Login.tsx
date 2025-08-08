
import { useNavigate } from 'react-router-dom';
import { Button, TextField, Box, Typography } from '@mui/material';

export default function Login() {
  const navigate = useNavigate();

  const handleRegisterRedirect = () => {
    navigate('/register');
  };

  return (
    <Box sx={{ width: 300, mx: 'auto', mt: 10 }}>
      <Typography variant="h5">Вхід</Typography>
      <TextField fullWidth label="Email" margin="normal" />
      <TextField fullWidth label="Пароль" type="password" margin="normal" />
      <Button fullWidth variant="contained" color="primary" sx={{ mt: 2 }}>Увійти</Button>
      <Button fullWidth variant="text" onClick={handleRegisterRedirect}>Зареєструватися</Button>
    </Box>
  );
}
