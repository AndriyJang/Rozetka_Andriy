import { useState } from "react";
import {
  TextField,
  Button,
  Container,
  Typography,
  Card,
  CardContent,
} from "@mui/material";
import Grid from "@mui/material/Grid"; 

export default function ProductSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);

  const handleSearch = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL;
      const response = await fetch(`${apiUrl}/api/Products/search?query=${query}`);
      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error("Помилка пошуку:", error);
    }
  };

  return (
    <Container>
      <Typography variant="h5" gutterBottom>Пошук товарів</Typography>
      <TextField
        label="Введіть назву або категорію"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        fullWidth
        margin="normal"
      />
      <Button variant="contained" onClick={handleSearch}>Шукати</Button>

      <Grid container spacing={2} mt={2}>
        {results.map((product: any) => (
          <Grid item xs={12} md={6} key={product.id}>
            <Card>
              <CardContent>
                <Typography variant="h6">{product.title}</Typography>
                <Typography color="textSecondary">
                  Категорія: {product.category?.name}
                </Typography>
                <Typography>Ціна: {product.price} грн</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}
