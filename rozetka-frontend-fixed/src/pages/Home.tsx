// src/pages/Home.tsx
import Layout from "../components/Layout";
import { Container, Grid, Typography, Box } from "@mui/material";
import { useEffect, useMemo, useState, useRef, useLayoutEffect } from "react";
import { useSearchParams } from "react-router-dom";


// Компоненти
import CategorySidebar from "../components/catalog/CategorySidebar";
import ProductTile from "../components/catalog/ProductTile";
import AboutNuvora from "../components/AboutNuvora";

// Типи (type-only)
import type { CategoryDto } from "../components/catalog/CategorySidebar";
import type { ProductDto } from "../components/catalog/ProductTile";

const RAW_API = import.meta.env.VITE_API_URL || "";
const API = RAW_API.replace(/\/+$/, "");

// Нормалізація імен зображень
const toBaseName = (val?: string): string => {
  let v = String(val ?? "").trim();
  if (!v) return "";
  v = v.replace(/^https?:\/\/[^/]+/i, "");
  v = v.replace(/^\/+/, "");
  if (v.startsWith("images/")) v = v.slice(7);
  v = (v.split("/").pop() ?? v);
  v = v.replace(/^\d+_/, "");
  return v;
};

// API -> ProductTile DTO (прокидуємо description, brand тощо + categoryId для фільтра)
function mapApiProduct(x: any): ProductDto & { categoryId?: number } {
  const imgs = Array.isArray(x?.productImages) ? x.productImages : [];
  const ordered = imgs.slice().sort((a: any, b: any) => (a?.priority ?? 0) - (b?.priority ?? 0));
  const images: string[] = ordered.map((i: any) => toBaseName(i?.name)).filter(Boolean);
  const categoryId = Number(x?.category?.id ?? x?.categoryId ?? 0) || undefined;

  return {
    id: Number(x?.id ?? 0),
    name: String(x?.name ?? x?.title ?? "Товар"),
    title: String(x?.title ?? ""),
    price: Number(x?.price ?? 0),

    images,
    image: x?.image ?? null,
    imageUrl: x?.imageUrl ?? null,
    imagePath: x?.imagePath ?? null,

    // ⬇️ важливо: опис і додаткові поля, щоб картка могла їх показати в "Більше"
    description: typeof x?.description === "string" ? x.description : "",
    brand: x?.brand ?? "",
    brandSite: x?.brandSite ?? "",
    size: x?.size ?? "",
    color: x?.color ?? "",
    year: x?.year ?? "",

    // для фільтру:
    categoryId,
  } as ProductDto & { categoryId?: number };
}

export default function Home() {
  const token = useMemo(() => localStorage.getItem("token") ?? "", []);
  const authHeaders: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [products, setProducts] = useState<(ProductDto & { categoryId?: number })[]>([]);
  const [loading, setLoading] = useState(true);

  // URL-параметр ?cat=<id>, null => усі товари
  const [searchParams, setSearchParams] = useSearchParams();
  const activeCatId = useMemo(() => {
    const raw = searchParams.get("cat");
    const n = raw ? Number(raw) : NaN;
    return Number.isFinite(n) && n > 0 ? n : null;
  }, [searchParams]);

  useEffect(() => {
    Promise.all([
      fetch(`${API}/api/Categories`, { headers: authHeaders }).then(r => (r.ok ? r.json() : [])),
      fetch(`${API}/api/Products`,   { headers: authHeaders }).then(r => (r.ok ? r.json() : [])),
    ])
      .then(([cats, prods]) => {
        setCategories(Array.isArray(cats) ? cats : []);
        setProducts((Array.isArray(prods) ? prods : []).map(mapApiProduct));
      })
      .finally(() => setLoading(false));
  }, [API]); // token мемоізований; authHeaders стабільні

  // Фільтр по категорії
  const filtered = activeCatId
    ? products.filter(p => (p.categoryId ?? 0) === activeCatId)
    : products;

  // Перший ряд праворуч (3 картки), решта — нижче
  const splitAt = 3;
  const topProducts  = filtered.slice(0, splitAt);
  const restProducts = filtered.slice(splitAt);

  // Вимір правого верхнього блоку (заголовок + перший ряд) для точного вирівнювання сайдбара
  const rightBlockRef = useRef<HTMLDivElement | null>(null);
  const [rightBlockH, setRightBlockH] = useState(0);

  const measure = () => { if (rightBlockRef.current) setRightBlockH(rightBlockRef.current.offsetHeight); };
  useLayoutEffect(() => { requestAnimationFrame(measure); }, [filtered, loading]);
  useEffect(() => {
    const onResize = () => measure();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const GRID_SPACING = 2;          // для всіх Grid
  const SIDEBAR_PY = 32;           // p:2 у Paper => 16 + 16

  // Клік по категорії в сайдбарі
  const handleSelectCategory = (id: number | null) => {
    if (id && id > 0) setSearchParams({ cat: String(id) }, { replace: true });
    else setSearchParams({}, { replace: true }); // показати всі
  };

  return (
    <Layout>
      <Container maxWidth="lg">
        <Grid container spacing={GRID_SPACING} alignItems="stretch">
          {/* Сайдбар: точна висота = правий верхній блок - внутрішні відступи Paper */}
          <Grid item xs={12} lg={3} sx={{ display: "flex" }}>
            <Box sx={{ width: "100%", height: "100%" }}>
              <CategorySidebar
                items={categories}
                exactHeight={Math.max(0, rightBlockH - SIDEBAR_PY)}
                activeId={activeCatId}
                onSelect={handleSelectCategory}
              />
            </Box>
          </Grid>

          {/* Правий верхній блок: заголовок по центру над другою карткою + перший ряд */}
          <Grid item xs={12} lg={9}>
            <Box ref={rightBlockRef}>
              <Grid container spacing={GRID_SPACING} sx={{ mb: 1 }}>
                <Grid item xs={false} md={4} />
                <Grid item xs={12} md={4}>
                  <Typography
                    align="center"
                    sx={{ fontWeight: 800, fontSize: { xs: 28, sm: 32, md: 36 }, lineHeight: 1.15 }}
                  >
                    ТОП-товари
                  </Typography>
                </Grid>
                <Grid item xs={false} md={4} />
              </Grid>

              {loading ? (
                <Typography color="text.secondary">Завантаження…</Typography>
              ) : (
                <Grid container spacing={GRID_SPACING}>
                  {topProducts.map((p) => (
                    <Grid item key={p.id} xs={12} sm={6} md={4}>
                      <ProductTile p={p} />
                    </Grid>
                  ))}
                </Grid>
              )}
            </Box>
          </Grid>

          {/* Решта карток — підтягнуто ближче, без великого зазору */}
          {!loading && restProducts.length > 0 && (
            <Grid item xs={12} sx={{ mt: -1 /* -8px; за потреби зроби -2 */ }}>
              <Grid container spacing={GRID_SPACING}>
                {restProducts.map((p) => (
                  <Grid item key={p.id} xs={12} sm={6} md={4} lg={3}>
                    <ProductTile p={p} />
                  </Grid>
                ))}
              </Grid>
            </Grid>
          )}
        </Grid>

        {/* Низ: AboutNuvora */}
        <Grid container>
          <Grid item xs={12} sx={{ mt: 3 }}>
            <AboutNuvora />
          </Grid>
        </Grid>
      </Container>
    </Layout>
  );
}
