import Layout from "../components/Layout";
import { useState } from "react";
import {
  TextField,
  Button,
  Container,
  Typography,
  Card,
  CardContent,
  Grid // ✅ ось тут додано!
} from "@mui/material";

interface Product {
  id: number;
  title: string;
  price: number;
  category?: {
    name: string;
  };
}

export default function ProductSearch() {
  const [query, setQuery] = useState<string>("");
  const [results, setResults] = useState<Product[]>([]);

  const handleSearch = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL;
      const response = await fetch(`${apiUrl}/api/Products/search?query=${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error(`Помилка HTTP: ${response.status}`);
      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error("Помилка пошуку:", error);
    }
  };

  return (
    <Layout>
    <Container>
      <Typography variant="h5" gutterBottom>
        Пошук товарів
      </Typography>

      <TextField
        label="Введіть назву або категорію"
        value={query}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}

        fullWidth
        margin="normal"
      />

      <Button
        variant="contained"
        onClick={handleSearch}
        disabled={!query.trim()}
      >
        Шукати
      </Button>

      <Grid container spacing={2} sx={{ mt: 2 }}>
        {results.length === 0 ? (
          <Typography sx={{ mt: 2 }}>Нічого не знайдено</Typography>
        ) : (
          results.map((product) => (
            <Grid xs={12} md={6} key={product.id}>
              <Card>
                <CardContent>
                  <Typography variant="h6">{product.title}</Typography>
                  <Typography color="textSecondary">
                    Категорія: {product.category?.name ?? "Невідомо"}
                  </Typography>
                  <Typography>Ціна: {product.price} грн</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))
        )}
      </Grid>
    </Container>
   </Layout>
  );
}
