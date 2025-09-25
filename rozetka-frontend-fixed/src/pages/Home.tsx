// src/pages/Home.tsx
import Layout from "../components/Layout";
import { Container, Grid, Typography, Box } from "@mui/material";
import React, { useEffect, useMemo, useState, useRef, Suspense } from "react";
import { useSearchParams } from "react-router-dom";

import CategorySidebar from "../components/catalog/CategorySidebar";
import ProductTile from "../components/catalog/ProductTile";
// ⚡️ ліниве завантаження блоку "Про Нуворру"
const AboutNuvora = React.lazy(() => import("../components/AboutNuvora"));

import type { CategoryDto } from "../components/catalog/CategorySidebar";
import type { ProductDto } from "../components/catalog/ProductTile";

/* ===================== helpers ===================== */
const RAW_API = import.meta.env.VITE_API_URL || "";
const API = RAW_API.replace(/\/+$/, "");

const toBaseName = (val?: string): string => {
  let v = String(val ?? "").trim();
  if (!v) return "";
  v = v.replace(/^https?:\/\/[^/]+/i, "").replace(/^\/+/, "");
  if (v.startsWith("images/")) v = v.slice(7);
  v = (v.split("/").pop() ?? v).replace(/^\d+_/, "");
  return v;
};

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
    description: typeof x?.description === "string" ? x.description : "",
    brand: x?.brand ?? "",
    brandSite: x?.brandSite ?? "",
    size: x?.size ?? "",
    color: x?.color ?? "",
    year: x?.year ?? "",
    categoryId,
  } as ProductDto & { categoryId?: number };
}

// простий кеш у localStorage
const CKEY_CATS = "home:v1:categories";
const CKEY_PROD = "home:v1:products";
const TTL_MS = 10 * 60 * 1000; // 10 хв

function readCache<T>(key: string, maxAgeMs: number): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const { ts, data } = JSON.parse(raw) as { ts: number; data: T };
    if (Date.now() - ts > maxAgeMs) return null;
    return data;
  } catch {
    return null;
  }
}
function writeCache<T>(key: string, data: T) {
  try {
    localStorage.setItem(key, JSON.stringify({ ts: Date.now(), data }));
  } catch {}
}

/* ===================== page ===================== */
export default function Home() {
  const token = useMemo(() => localStorage.getItem("token") ?? "", []);
  const authHeaders: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

  // 1) миттєвий старт з кешу (якщо є)
  const [categories, setCategories] = useState<CategoryDto[]>(
    readCache<CategoryDto[]>(CKEY_CATS, TTL_MS) ?? []
  );
  const [allProducts, setAllProducts] = useState<(ProductDto & { categoryId?: number })[]>(
    readCache<(ProductDto & { categoryId?: number })[]>(CKEY_PROD, TTL_MS) ?? []
  );

  // інкрементальний рендер: спочатку 20, далі дорисовуємо
  const [visibleCount, setVisibleCount] = useState<number>(20);
  const [loading, setLoading] = useState(categories.length === 0 || allProducts.length === 0);

  // ❗️ показувати AboutNuvora після першого екрану (відкладено)
  const [showAbout, setShowAbout] = useState(false);

  // URL ?cat=<id> (за замовчуванням — усі)
  const [searchParams, setSearchParams] = useSearchParams();
  const activeCatId = useMemo(() => {
    const raw = searchParams.get("cat");
    const n = raw ? Number(raw) : NaN;
    return Number.isFinite(n) && n > 0 ? n : null;
  }, [searchParams]);

  // 2) SWR: підтягуємо «живі» дані, оновлюємо, кладемо в кеш
  useEffect(() => {
    let aborted = false;
    (async () => {
      try {
        const [cr, pr] = await Promise.all([
          fetch(`${API}/api/Categories`, { headers: authHeaders }),
          fetch(`${API}/api/Products`, { headers: authHeaders }),
        ]);
        const cats = cr.ok ? await cr.json() : [];
        const prods = pr.ok ? await pr.json() : [];

        if (aborted) return;

        const mapped = (Array.isArray(prods) ? prods : []).map(mapApiProduct);
        setCategories(Array.isArray(cats) ? cats : []);
        setAllProducts(mapped);
        // якщо прийшло менше 20 — все одно показуємо наявне
        setVisibleCount((v) => Math.min(Math.max(v, 20), mapped.length));
        writeCache(CKEY_CATS, Array.isArray(cats) ? cats : []);
        writeCache(CKEY_PROD, mapped);
      } finally {
        if (!aborted) setLoading(false);
      }
    })();
    return () => {
      aborted = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [API]);

  // 3) дорендерюємо решту пакетами по 20 у вільний час/після ідлу
  useEffect(() => {
    if (allProducts.length <= visibleCount) return;

    let cancelled = false;
    const step = () => {
      if (cancelled) return;
      setVisibleCount((c) => {
        if (c >= allProducts.length) return c;
        return Math.min(c + 20, allProducts.length);
      });
    };

    const ric = (window as any).requestIdleCallback as
      | ((cb: () => void, opts?: { timeout?: number }) => number)
      | undefined;

    const id = ric ? ric(step, { timeout: 700 }) : window.setTimeout(step, 200);
    return () => {
      cancelled = true;
      if (ric) (window as any).cancelIdleCallback?.(id);
      else clearTimeout(id);
    };
  }, [allProducts.length, visibleCount]);

  // 4) підвантаження при доскролі до «хвоста»
  const tailRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!tailRef.current) return;
    const el = tailRef.current;
    const io = new IntersectionObserver(
      (ents) => {
        if (ents.some((e) => e.isIntersecting)) {
          setVisibleCount((c) => Math.min(c + 20, allProducts.length));
        }
      },
      { rootMargin: "600px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [allProducts.length]);

  // після того як перший екран уже змонтований — показати AboutNuvora у «вільний час»
  useEffect(() => {
    if (loading) return;
    const show = () => setShowAbout(true);
    const ric = (window as any).requestIdleCallback as
      | ((cb: () => void, opts?: { timeout?: number }) => number)
      | undefined;
    const id = ric ? ric(show, { timeout: 1200 }) : window.setTimeout(show, 600);
    return () => {
      if (ric) (window as any).cancelIdleCallback?.(id);
      else clearTimeout(id);
    };
  }, [loading]);

  // фільтр по категорії
  const filtered = useMemo(() => {
    return activeCatId
      ? allProducts.filter((p) => (p.categoryId ?? 0) === activeCatId)
      : allProducts;
  }, [allProducts, activeCatId]);

  // перший ряд праворуч (3), решта — нижче
  const splitAt = 3;
  const topProducts = filtered.slice(0, splitAt);
  const restProducts = filtered.slice(splitAt, visibleCount);

  // точне вирівнювання висоти сайдбара (через ResizeObserver)
  const rightBlockRef = useRef<HTMLDivElement | null>(null);
  const [rightBlockH, setRightBlockH] = useState(0);
  useEffect(() => {
    if (!rightBlockRef.current) return;
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) setRightBlockH(e.contentRect.height);
    });
    ro.observe(rightBlockRef.current);
    return () => ro.disconnect();
  }, []);

  const GRID_SPACING = 2;
  const SIDEBAR_PY = 32;

  const handleSelectCategory = (id: number | null) => {
    if (id && id > 0) setSearchParams({ cat: String(id) }, { replace: true });
    else setSearchParams({}, { replace: true });
    // при зміні категорії повернемо видимий ліміт до стартових 20
    setVisibleCount(20);
  };

  return (
    <Layout>
      <Container maxWidth="lg">
        <Grid container spacing={GRID_SPACING} alignItems="stretch">
          {/* Сайдбар */}
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

          {/* Правий верхній блок + перший ряд */}
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

              {loading && allProducts.length === 0 ? (
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

          {/* Решта карток — інкрементальний рендер */}
          {restProducts.length > 0 && (
            <Grid item xs={12} sx={{ mt: -1 }}>
              <Grid container spacing={GRID_SPACING}>
                {restProducts.map((p) => (
                  <Grid item key={p.id} xs={12} sm={6} md={4} lg={3}>
                    <ProductTile p={p} />
                  </Grid>
                ))}
              </Grid>
            </Grid>
          )}

          {/* хвіст для доскрол-підвантаження */}
          <Grid item xs={12}>
            <div ref={tailRef} />
          </Grid>
        </Grid>

        {/* Низ: AboutNuvora — ЛІНИВО і ПІСЛЯ першої відмальовки */}
        {showAbout && (
          <Suspense fallback={null}>
            <Grid container>
              <Grid item xs={12} sx={{ mt: 3 }}>
                <AboutNuvora />
              </Grid>
            </Grid>
          </Suspense>
        )}
      </Container>
    </Layout>
  );
}
