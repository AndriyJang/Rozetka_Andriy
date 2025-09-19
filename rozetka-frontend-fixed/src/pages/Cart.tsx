import Layout from "../components/Layout";
import { Container, Typography } from "@mui/material";

export default function Cart() {
  return (
    <Layout>
      <Container maxWidth="md">
        <Typography variant="h4" sx={{ mb: 2 }}>Кошик</Typography>
        <Typography color="text.secondary">
          Сторінка кошика буде реалізована пізніше.
        </Typography>
      </Container>
    </Layout>
  );
}
