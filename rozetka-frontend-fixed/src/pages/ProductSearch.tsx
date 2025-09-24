// src/pages/ProductSearch.tsx
import Layout from "../components/Layout";
import { useEffect, useMemo, useState } from "react";
import {
  TextField, Button, Container, Typography, Grid, Box,
  MenuItem, Select, FormControl, InputLabel,
} from "@mui/material";
import { useSearchParams } from "react-router-dom";
import ProductTile, { type ProductDto } from "../components/catalog/ProductTile";
import IntroSplash from "../components/IntroSplash";
import { AnimatePresence, motion } from "framer-motion";

// ---------- types ----------
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

type FiltersSnapshot = {
  query: string;
  minPrice: string;
  maxPrice: string;
  categoryId: string;
  sort: "none" | "asc" | "desc";
};

// ---------- API base ----------
const RAW_API = import.meta.env.VITE_API_URL ?? "";
const API = RAW_API.replace(/\/+$/, "");

// ---------- helpers ----------
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

// 5 різних варіантів анімацій (enter/exit)
const FX = [
  {
    initial: { y: 24, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit:    { y: -24, opacity: 0 },
    transition: { type: "spring", stiffness: 380, damping: 28 }
  },
  {
    initial: { x: 36, opacity: 0 },
    animate: { x: 0,  opacity: 1 },
    exit:    { x: -36, opacity: 0 },
    transition: { type: "spring", stiffness: 360, damping: 26 }
  },
  {
    initial: { scale: 0.9, opacity: 0 },
    animate: { scale: 1,   opacity: 1 },
    exit:    { scale: 0.92, opacity: 0 },
    transition: { type: "spring", stiffness: 420, damping: 30 }
  },
  {
    initial: { rotate: -6, y: 20, opacity: 0 },
    animate: { rotate: 0,  y: 0,  opacity: 1 },
    exit:    { rotate: 6,  y: -16, opacity: 0 },
    transition: { type: "spring", stiffness: 360, damping: 24 }
  },
  {
    initial: { rotateX: 35, scale: 0.96, opacity: 0 },
    animate: { rotateX: 0,  scale: 1,    opacity: 1 },
    exit:    { rotateX: -20, scale: 0.96, opacity: 0 },
    transition: { type: "spring", stiffness: 300, damping: 24 }
  },
] as const;

export default function ProductSearch() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initial = searchParams.get("query") ?? "";

  // дані
  const [results, setResults] = useState<Product[]>([]);
  const [all, setAll] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  // стан
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  // фільтри
  const [query, setQuery] = useState<string>(initial);
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [sort, setSort] = useState<"none" | "asc" | "desc">("none");
  const [lastApplied, setLastApplied] = useState<FiltersSnapshot | null>(null);

  // тизер (карусель однієї картки до натискання «Застосувати фільтри»)
  const [teaserOn, setTeaserOn] = useState<boolean>(true);
  const [teaserIdx, setTeaserIdx] = useState<number>(0);
  const [teaserFxIdx, setTeaserFxIdx] = useState<number>(0);

  const token = useMemo(() => localStorage.getItem("token") ?? "", []);
  const buildHeaders = () => {
    const h = new Headers();
    if (token) h.set("Authorization", `Bearer ${token}`);
    return h;
  };

  // завантаження довідників
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

  // локальний пошук/фільтр
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
      const byText  = q ? (title.includes(ql) || cat.includes(ql)) : true;
      const byPrice = Number(p.price) >= minV && Number(p.price) <= maxV;
      const byCat   = selCat ? (Number(p.category?.id ?? 0) === selCat) : true;
      return byText && byPrice && byCat;
    });

    if (srt === "asc")  arr = arr.slice().sort((a,b)=>Number(a.price)-Number(b.price));
    if (srt === "desc") arr = arr.slice().sort((a,b)=>Number(b.price)-Number(a.price));
    return arr;
  };

  // бекенд-пошук (коли вводимо текст)
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

  // якщо завантажилися з URL-початковим query — виконаємо пошук
  useEffect(() => { if (initial) runSearch(initial); /* eslint-disable-next-line */ }, []);

  // Застосування фільтрів: ЗАВЖДИ від all + збереження snapshot
  const applyFilters = () => {
    const snap: FiltersSnapshot = { query, minPrice, maxPrice, categoryId, sort };
    setLastApplied(snap);
    setResults(filterLocal(all, snap.query, snap.minPrice, snap.maxPrice, snap.categoryId, snap.sort));
    setTeaserOn(false); // ховаємо тизер після першого застосування
  };

  // Якщо користувач встиг натиснути «Застосувати», а all догрузився пізніше —
  // автоматично перераховуємо результати по збереженим фільтрам.
  useEffect(() => {
    if (lastApplied) {
      setResults(
        filterLocal(all, lastApplied.query, lastApplied.minPrice, lastApplied.maxPrice, lastApplied.categoryId, lastApplied.sort)
      );
    }
  }, [all]); // eslint-disable-line react-hooks/exhaustive-deps

  // Тизер-карусель: міняємо товар кожні 1.8с
  useEffect(() => {
    if (!teaserOn) return;
    const pool = (results.length ? results : all);
    if (!pool.length) return;

    const id = setInterval(() => {
      setTeaserIdx((i) => (i + 1) % pool.length);
    }, 1800);
    return () => clearInterval(id);
  }, [teaserOn, results, all]);

  // На кожну зміну індексу — інша анімація (не повторюється підряд)
  useEffect(() => {
    setTeaserFxIdx(prev => {
      let next = Math.floor(Math.random() * FX.length);
      if (FX.length > 1 && next === prev) next = (next + 1) % FX.length;
      return next;
    });
  }, [teaserIdx]);

  const teaserPool = results.length ? results : all;
  const currentTeaserTile: ProductDto | null =
    teaserOn && teaserPool.length
      ? mapToTile(teaserPool[teaserIdx % teaserPool.length])
      : null;

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

        {/* Тизер: одна картка з рандомною анімацією під кнопкою до першого застосування фільтрів */}
        {teaserOn && currentTeaserTile && (
          <IntroSplash open inline title="Нуворра це круто!!!">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={`${currentTeaserTile.id}-${teaserIdx}`}
                initial={FX[teaserFxIdx].initial}
                animate={FX[teaserFxIdx].animate}
                exit={FX[teaserFxIdx].exit}
                transition={FX[teaserFxIdx].transition}
              >
                <Box sx={{ display: "grid", placeItems: "center" }}>
                  <Box sx={{ width: "min(360px, 100%)" }}>
                    <ProductTile p={currentTeaserTile} />
                  </Box>
                </Box>
              </motion.div>
            </AnimatePresence>
          </IntroSplash>
        )}

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
