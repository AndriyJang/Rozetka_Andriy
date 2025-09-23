// src/pages/ProductSearch.tsx
import Layout from "../components/Layout";
import { useEffect, useMemo, useState } from "react";
import {
  TextField, Button, Container, Typography, Grid, Box, MenuItem, Select, FormControl, InputLabel,
} from "@mui/material";
import { useSearchParams } from "react-router-dom";
import ProductTile, { type ProductDto } from "../components/catalog/ProductTile";

type Product = {
  id: number;
  title?: string;
  name?: string;
  price: number;
  category?: { id?: number; name?: string } | null;
  productImages?: { id:number; name:string; priority:number }[];
  image?: string | null; imageUrl?: string | null; imagePath?: string | null;
};
type Category = { id: number; name: string };

const RAW_API = import.meta.env.VITE_API_URL ?? "";
const API = RAW_API.replace(/\/+$/, "");

const toBaseName = (val?: string): string => {
  let v = String(val ?? "").trim();
  if (!v) return "";
  v = v.replace(/^https?:\/\/[^/]+/i, "").replace(/^\/+/, "");
  if (v.startsWith("images/")) v = v.slice(7);
  v = (v.split("/").pop() ?? v).replace(/^\d+_/, "");
  return v;
};
const mapToTile = (x: Product): ProductDto => {
  const imgs = Array.isArray(x.productImages) ? x.productImages : [];
  const ordered = imgs.slice().sort((a, b) => (a?.priority ?? 0) - (b?.priority ?? 0));
  return {
    id: Number(x.id),
    name: x.name ?? x.title ?? "Товар",
    title: x.title ?? "",
    price: Number(x.price ?? 0),
    images: ordered.map(i => toBaseName(i.name)).filter(Boolean),
    image: x.image ?? null,
    imageUrl: x.imageUrl ?? null,
    imagePath: x.imagePath ?? null,
  };
};

export default function ProductSearch() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initial = searchParams.get("query") ?? "";

  const [query, setQuery] = useState<string>(initial);
  const [results, setResults] = useState<Product[]>([]);
  const [all, setAll] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  // фільтри
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [sort, setSort] = useState<"none" | "asc" | "desc">("none");

  const token = useMemo(() => localStorage.getItem("token") ?? "", []);
  const buildHeaders = () => {
    const h = new Headers();
    if (token) h.set("Authorization", `Bearer ${token}`);
    return h;
  };

  useEffect(() => {
    const loadAll = async () => {
      try {
        const [pr, cr] = await Promise.all([
          fetch(`${API}/api/Products`, { headers: buildHeaders() }),
          fetch(`${API}/api/Categories`, { headers: buildHeaders() }),
        ]);
        const products = pr.ok ? await pr.json() : [];
        const cats = cr.ok ? await cr.json() : [];
        setAll(Array.isArray(products) ? products : []);
        setCategories(Array.isArray(cats) ? cats : []);
      } catch (e) { console.error(e); }
    };
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filterLocal = (
    products: Product[], q: string, min: string, max: string, catId: string, srt: "none"|"asc"|"desc"
  ): Product[] => {
    const ql = q.toLowerCase();
    const minV = min ? Number(min) : -Infinity;
    const maxV = max ? Number(max) : Infinity;
    const selCat = catId ? Number(catId) : null;

    let arr = products.filter(p => {
      const title = (p.title || p.name || "").toString().toLowerCase();
      const cat = (p.category?.name || "").toString().toLowerCase();
      const byText = q ? (title.includes(ql) || cat.includes(ql)) : true; // порожній — усі
      const byPrice = Number(p.price) >= minV && Number(p.price) <= maxV;
      const byCat = selCat ? (Number(p.category?.id ?? 0) === selCat) : true;
      return byText && byPrice && byCat;
    });

    if (srt === "asc") arr = arr.slice().sort((a,b)=>Number(a.price)-Number(b.price));
    else if (srt === "desc") arr = arr.slice().sort((a,b)=>Number(b.price)-Number(a.price));

    return arr;
  };

  const runSearch = async (q: string) => {
    const s = q.trim();
    setSearchParams(s ? { query: s } : {});
    setLoading(true); setError("");
    try {
      const r = await fetch(`${API}/api/Products/search?query=${encodeURIComponent(s)}`, { headers: buildHeaders() });
      if (r.ok) {
        const data = await r.json();
        setResults(Array.isArray(data) ? data : []);
      } else {
        setResults(filterLocal(all, s, minPrice, maxPrice, categoryId, sort));
      }
    } catch {
      setResults(filterLocal(all, s, minPrice, maxPrice, categoryId, sort));
    } finally { setLoading(false); }
  };

  useEffect(() => { if (initial) runSearch(initial); /* eslint-disable-next-line */ }, []);

  const applyFilters = () => {
    const base = results.length ? results : all;
    const filtered = filterLocal(base, query, minPrice, maxPrice, categoryId, sort);
    setResults(filtered);
  };

  return (
    <Layout>
      <Container sx={{ py: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, mb: 2 }}>
          Пошук товарів
        </Typography>

        {/* Панель пошуку + фільтри */}
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1.2fr 1fr 1fr 1fr 1fr" }, gap: 1.5, alignItems: "center" }}>
          <TextField
            label="Що шукаємо?"
            value={query}
            onChange={(e) => { const v = e.target.value; setQuery(v); if (v.length >= 1) runSearch(v); }}
            onKeyDown={(e) => { if (e.key === "Enter") runSearch(query); }}
            fullWidth
          />
          <TextField label="Ціна від" type="number" value={minPrice} onChange={(e)=>setMinPrice(e.target.value)} inputProps={{ min: 0 }} />
          <TextField label="Ціна до" type="number" value={maxPrice} onChange={(e)=>setMaxPrice(e.target.value)} inputProps={{ min: 0 }} />
          <FormControl fullWidth>
            <InputLabel id="cat-label">Категорія</InputLabel>
            <Select labelId="cat-label" label="Категорія" value={categoryId} onChange={(e)=>setCategoryId(String(e.target.value))}>
              <MenuItem value="">Усі</MenuItem>
              {categories.map(c => <MenuItem key={c.id} value={String(c.id)}>{c.name}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel id="sort-label">Сортування</InputLabel>
            <Select labelId="sort-label" label="Сортування" value={sort} onChange={(e)=>setSort(e.target.value as any)}>
              <MenuItem value="none">Без</MenuItem>
              <MenuItem value="asc">Ціна ↑</MenuItem>
              <MenuItem value="desc">Ціна ↓</MenuItem>
            </Select>
          </FormControl>

          <Box sx={{ display: { xs: "block", md: "none" } }} />
          <Button variant="contained" onClick={applyFilters}>Застосувати фільтри</Button>
        </Box>

        {/* Результати — картки ProductTile */}
        <Grid container spacing={2} sx={{ mt: 2 }}>
          {!loading && !error && results.length === 0 && (
            <Grid item xs={12}>
              <Typography color="text.secondary">Нічого не знайдено</Typography>
            </Grid>
          )}
          {results.map((p) => {
            const tile = mapToTile(p);
            return (
              <Grid item xs={12} sm={6} md={4} lg={3} key={tile.id}>
                <ProductTile p={tile} />
              </Grid>
            );
          })}
        </Grid>
      </Container>
    </Layout>
  );
}
