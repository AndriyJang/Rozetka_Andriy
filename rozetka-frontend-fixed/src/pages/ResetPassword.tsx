import { TextField, Button, Container, Typography } from '@mui/material';
import { useState } from 'react';

export default function ResetPassword() {
  const [email, setEmail] = useState('');

  const handleSubmit = () => {
    console.log('Reset password for:', email);
  };

  return (
    <Container>
      <Typography variant="h5">Відновлення паролю</Typography>
      <TextField label="Email" fullWidth margin="normal" onChange={(e) => setEmail(e.target.value)} />
      <Button onClick={handleSubmit} variant="contained" color="secondary">Надіслати лист</Button>
    </Container>
  );
}
