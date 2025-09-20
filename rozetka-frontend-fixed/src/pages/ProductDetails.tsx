// src/pages/ProductDetails.tsx
import Layout from "../components/Layout";
import { useParams, Link as RouterLink } from "react-router-dom";
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Button,
  Stack,
  Divider,
  Chip,
  Rating,
} from "@mui/material";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ProductTile, { type ProductDto } from "../components/catalog/ProductTile";
import { useEffect, useMemo, useState } from "react";

// ===== helpers =====
const RAW_API = import.meta.env.VITE_API_URL ?? "";
const API = RAW_API.replace(/\/+$/, "");
const IMAGES_BASE = `${API}/images`;
const imgUrl = (name?: string, size: number = 800) =>
  name ? `${IMAGES_BASE}/${size}_${name}` : "";

const toBaseName = (val?: string): string => {
  let v = String(val ?? "").trim();
  if (!v) return "";
  v = v.replace(/^https?:\/\/[^/]+/i, "").replace(/^\/+/, "");
  if (v.startsWith("images/")) v = v.slice(7);
  v = (v.split("/").pop() ?? v).replace(/^\d+_/, "");
  return v;
};

// тип одного продукту з бекенду (мінімум що використовуємо тут)
type ApiProduct = {
  id: number;
  name: string;
  price: number;
  description?: string | null;
  brand?: string | null;
  brandSite?: string | null;
  size?: string | null;
  color?: string | null;
  year?: number | null;
  category?: { id: number; name: string } | null;
  categoryId?: number | null;
  productImages?: { id: number; name: string; priority: number }[];
};

// для ред’юса в пов’язках
function mapApiProductToTile(x: any): ProductDto & { categoryId?: number } {
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
    description: x?.description ?? null,
    brand: x?.brand ?? null,
    brandSite: x?.brandSite ?? null,
    size: x?.size ?? null,
    color: x?.color ?? null,
    year: x?.year ?? null,
    // фільтр
    categoryId,
  };
}

const show = (v: unknown) => {
  const s = (v ?? "").toString().trim();
  return s ? s : "—";
};

// компактний рядок “поле — значення” (зменшені розміри)
function InfoRowCompact({ label, value }: { label: string; value: string | number }) {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "140px 1fr",
        alignItems: "center",
        columnGap: 1.5,
        py: 0.4,
        "& + &": { borderTop: "1px dashed rgba(2,56,84,0.08)" },
      }}
    >
      <Typography sx={{ fontSize: 13, color: "#5b6a72" }}>{label}</Typography>
      <Typography sx={{ fontSize: 13, color: "#023854" }}>{value}</Typography>
    </Box>
  );
}

export default function ProductDetails() {
  const { id } = useParams<{ id: string }>();
  const token = useMemo(() => localStorage.getItem("token") ?? "", []);
  const authHeaders: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

  const [prod, setProd] = useState<ApiProduct | null>(null);
  const [related, setRelated] = useState<(ProductDto & { categoryId?: number })[]>([]);
  const [imgNames, setImgNames] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // заглушки рейтингу для блоку “Відгуки”
  const reviewsCount = 3;
  const avgRating = 4.7;

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`${API}/api/Products/${id}`, { headers: authHeaders });
        if (!res.ok) throw new Error("Не вдалося завантажити товар");
        const data: ApiProduct = await res.json();
        if (!mounted) return;

        setProd(data);

        // зображення
        const ordered = (data.productImages ?? [])
          .slice()
          .sort((a, b) => (a?.priority ?? 0) - (b?.priority ?? 0));
        setImgNames(ordered.map(i => toBaseName(i.name)).filter(Boolean));

        // пов’язані: всі з цієї категорії (тільки 1 ряд)
        const listRes = await fetch(`${API}/api/Products`, { headers: authHeaders });
        const listJson = listRes.ok ? await listRes.json() : [];
        const all = (Array.isArray(listJson) ? listJson : []).map(mapApiProductToTile);
        const same = data?.category?.id
          ? all.filter(p => p.categoryId === data.category!.id && p.id !== data.id).slice(0, 5)
          : all.slice(0, 5);
        setRelated(same);
      } catch (e) {
        // no-op
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const mainImg = imgNames[0] ? imgUrl(imgNames[0], 800) : "";

  const addToCart = async () => {
    // TODO: підставити ендпоінт кошика, коли буде
  };

  return (
    <Layout>
      <Container maxWidth="lg">
        {/* Крихти / повернення (простий чіп) */}
        <Box sx={{ my: 1 }}>
          <Chip
            component={RouterLink}
            to="/home"
            clickable
            label="На головну"
            icon={<ChevronRightIcon sx={{ transform: "rotate(180deg)" }} />}
            sx={{ mr: 1 }}
          />
          {prod?.category?.name && (
            <Chip
              component={RouterLink}
              to={`/home?cat=${prod.category.id}`}
              clickable
              label={prod.category.name}
              icon={<ChevronRightIcon sx={{ transform: "rotate(180deg)" }} />}
            />
          )}
        </Box>

        {/* Основна зона */}
        <Grid container spacing={2} alignItems="stretch">
          {/* Фото */}
          <Grid item xs={12} md={7}>
            <Paper variant="outlined" sx={{ borderRadius: 3, overflow: "hidden" }}>
              <Box sx={{ width: "100%", p: 2, display: "grid", placeItems: "center" }}>
                {mainImg ? (
                  <Box
                    component="img"
                    src={mainImg}
                    alt={prod?.name ?? "Товар"}
                    sx={{ width: "100%", maxHeight: 520, objectFit: "contain" }}
                    onError={(e: any) => {
                      const el = e.currentTarget as HTMLImageElement;
                      if (imgNames[0]) el.src = imgUrl(imgNames[0], 0);
                    }}
                  />
                ) : (
                  <Box sx={{ width: "100%", height: 420, bgcolor: "#f5f7f9" }} />
                )}
              </Box>

              {/* мініатюри */}
              {imgNames.length > 0 && (
                <Box sx={{ p: 1.5, pt: 0, display: "flex", gap: 1, flexWrap: "wrap" }}>
                  {imgNames.map((n) => (
                    <Box
                      key={n}
                      component="img"
                      src={imgUrl(n, 200)}
                      alt=""
                      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                      style={{
                        width: 72,
                        height: 72,
                        objectFit: "cover",
                        borderRadius: 8,
                        border: "1px solid #eaecef",
                        cursor: "pointer",
                      }}
                    />
                  ))}
                </Box>
              )}
            </Paper>
          </Grid>

          {/* Праворуч: ціна, кнопка, характеристики + доставка (компактно) */}
          <Grid item xs={12} md={5}>
            <Stack spacing={1.5}>
              {/* Назва і ціна */}
              <Typography variant="h5" sx={{ fontWeight: 800, color: "#023854" }}>
                {prod?.name ?? "Товар"}
              </Typography>

              <Paper variant="outlined" sx={{ borderRadius: 3, p: 2 }}>
                <Typography variant="h4" sx={{ fontWeight: 800, color: "#023854", mb: 1 }}>
                  {Number(prod?.price ?? 0).toLocaleString("uk-UA")}₴
                </Typography>
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<ShoppingCartIcon />}
                  sx={{
                    borderRadius: 999,
                    py: 1.2,
                    background: "#0b8a83",
                    "&:hover": { background: "#08776f" },
                  }}
                  onClick={addToCart}
                >
                  Додати в кошик
                </Button>
              </Paper>

              {/* Характеристики (компактно, трохи менший шрифт та щільність) */}
              <Paper variant="outlined" sx={{ borderRadius: 3, overflow: "hidden" }}>
                <Box sx={{ px: 2, py: 1, bgcolor: "#f6faf9" }}>
                  <Typography sx={{ fontWeight: 700, color: "#023854", fontSize: 14 }}>
                    Характеристики
                  </Typography>
                </Box>
                <Box sx={{ p: 1.25 }}>
                  <InfoRowCompact label="Опис" value={show(prod?.description)} />
                  <Divider sx={{ my: 1 }} />
                  <InfoRowCompact label="Виробник" value={show(prod?.brand)} />
                  <InfoRowCompact label="Сайт виробника" value={show(prod?.brandSite)} />
                  <InfoRowCompact label="Розмір" value={show(prod?.size)} />
                  <InfoRowCompact label="Колір" value={show(prod?.color)} />
                  <InfoRowCompact label="Рік" value={show(prod?.year ?? "")} />
                  <Divider sx={{ my: 1 }} />
                  <InfoRowCompact label="Категорія" value={show(prod?.category?.name)} />
                  <InfoRowCompact label="Код товару" value={show(prod?.id)} />
                </Box>
              </Paper>

              {/* Доставка (дуже компактно) */}
              <Paper variant="outlined" sx={{ borderRadius: 3, overflow: "hidden" }}>
                <Box sx={{ px: 2, py: 1, bgcolor: "#f6faf9" }}>
                  <Typography sx={{ fontWeight: 700, color: "#023854", fontSize: 14 }}>
                    Доставка
                  </Typography>
                </Box>
                <Box sx={{ p: 1.25 }}>
                  <InfoRowCompact label="Нова пошта" value="Стандартні тарифи перевізника" />
                  <InfoRowCompact label="Кур'єр по місту" value="За тарифами служби доставки" />
                  <InfoRowCompact label="Самовивіз" value="Безкоштовно" />
                </Box>
              </Paper>
            </Stack>
          </Grid>
        </Grid>

        {/* Один ряд товарів з категорії */}
        {!!related.length && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
              Купують з цим товаром
            </Typography>
            <Grid container spacing={2}>
              {related.slice(0, 5).map((p) => (
                <Grid item key={p.id} xs={12} sm={6} md={4} lg={2.4 as any}>
                  <ProductTile p={p} />
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {/* Відгуки */}
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
            Відгуки
          </Typography>

          <Grid container spacing={2}>
            {/* Ліва колонка — 3 статичних відгуки */}
            <Grid item xs={12} md={9}>
              <Paper variant="outlined" sx={{ borderRadius: 3, p: 2 }}>
                <Stack spacing={1.5}>
                  <Box>
                    <Typography sx={{ fontWeight: 600 }}>Ірина Остапенко</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Товар сподобався: все вчасно, якісно. Менеджер ввічливий.
                    </Typography>
                  </Box>
                  <Divider />
                  <Box>
                    <Typography sx={{ fontWeight: 600 }}>Анна Левченко</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Добре тримається у використанні, зручна кнопка додавання. Рекомендую.
                    </Typography>
                  </Box>
                  <Divider />
                  <Box>
                    <Typography sx={{ fontWeight: 600 }}>Михайло Нечипор</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Мій третій заказ у цього продавця — все ок, швидка доставка, якість топ.
                    </Typography>
                  </Box>
                </Stack>
              </Paper>
            </Grid>

            {/* Права колонка — ЗІРОЧКИ над кнопкою “Написати відгук” */}
            <Grid item xs={12} md={3}>
              <Paper
                variant="outlined"
                sx={{
                  borderRadius: 3,
                  p: 2,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 1.25,
                }}
              >
                {/* ← ОТУТ тільки зірочки */}
                <Rating value={avgRating} precision={0.5} readOnly size="medium" />
                <Typography variant="body2" color="text.secondary">
                  Середня оцінка: {avgRating.toFixed(1)} / 5 • {reviewsCount} відгуки
                </Typography>

                <Button
                  fullWidth
                  variant="contained"
                  sx={{
                    mt: 0.5,
                    borderRadius: 999,
                    background: "linear-gradient(90deg, #023854 0%, #035B94 100%)",
                    "&:hover": { opacity: 0.95 },
                  }}
                >
                  Написати відгук
                </Button>
              </Paper>
            </Grid>
          </Grid>
        </Box>

        {/* Футер уже в Layout, додаткових блоків “про Nuvora” тут немає */}
      </Container>
    </Layout>
  );
}
