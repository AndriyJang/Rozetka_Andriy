// src/pages/Cart.tsx
import Layout from "../components/Layout";
import {
  Box,
  Button,
  Container,
  Divider,
  Grid,
  IconButton,
  Paper,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import StarIcon from "@mui/icons-material/Star";
import { useEffect, useMemo, useState } from "react";
import ProductTile from "../components/catalog/ProductTile";
import type { ProductDto } from "../components/catalog/ProductTile";

type CartItem = {
  productId: number;
  name: string;
  price: number;
  quantity: number;
  image?: string | null;
  imageUrl?: string | null;
  imagePath?: string | null;
  images?: string[] | null;
  categoryId?: number | null;
};

const RAW_API = import.meta.env.VITE_API_URL || "";
const API = RAW_API.replace(/\/+$/, "");
const IMAGES_BASE = `${API}/images`;

// ---------- helpers ----------
const authHeaders = (): Record<string, string> => {
  const token = localStorage.getItem("token") ?? "";
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const toBaseName = (val?: string): string => {
  let v = String(val ?? "").trim();
  if (!v) return "";
  v = v.replace(/^https?:\/\/[^/]+/i, "").replace(/^\/+/, "");
  if (v.startsWith("images/")) v = v.slice(7);
  v = (v.split("/").pop() ?? v).replace(/^\d+_/, "");
  return v;
};

const img200fromBase = (base?: string) =>
  base ? `${IMAGES_BASE}/200_${toBaseName(base)}` : "";
const img0fromBase = (base?: string) =>
  base ? `${IMAGES_BASE}/0_${toBaseName(base)}` : "";

const imgFromCartItem = (it: CartItem): string => {
  if (Array.isArray(it.images) && it.images.length > 0) {
    return img200fromBase(it.images[0]);
  }
  if (it.imageUrl && /^https?:\/\//i.test(it.imageUrl)) return it.imageUrl;
  const single = toBaseName(it.imageUrl || it.imagePath || it.image || "");
  return single ? img200fromBase(single) : "";
};

export default function Cart() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [allProducts, setAllProducts] = useState<
    (ProductDto & { categoryId?: number })[]
  >([]);
  const token = useMemo(() => localStorage.getItem("token") ?? "", []);

  // 1 ряд «Рекомендовано»: 6 / 4 / 3 / 2 колонок
  const theme = useTheme();
  const isLg = useMediaQuery(theme.breakpoints.up("lg"));
  const isMd = useMediaQuery(theme.breakpoints.up("md"));
  const isSm = useMediaQuery(theme.breakpoints.up("sm"));
  const [clearing, setClearing] = useState(false);
  const cols = isLg ? 6 : isMd ? 4 : isSm ? 3 : 2;

  const fetchCart = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/api/Cart/GetCart`, {
        headers: new Headers(authHeaders()),
      });
      const data = r.ok ? await r.json() : [];
      const mapped: CartItem[] = (Array.isArray(data) ? data : []).map((x: any) => ({
        productId: Number(x?.productId ?? x?.id ?? 0),
        name: String(x?.name ?? x?.productName ?? "Товар"),
        price: Number(x?.price ?? 0),
        quantity: Number(x?.quantity ?? 1),
        image: x?.image ?? null,
        imageUrl: x?.imageUrl ?? null,
        imagePath: x?.imagePath ?? null,
        images: Array.isArray(x?.images) ? x.images : null,
        categoryId: x?.categoryId ?? x?.category?.id ?? null,
      }));
      mapped.sort((a, b) => a.productId - b.productId);
      setItems(mapped);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    const rp = await fetch(`${API}/api/Products`, {
      headers: new Headers(authHeaders()),
    });
    const pj = rp.ok ? await rp.json() : [];
    const normalized: (ProductDto & { categoryId?: number })[] = (Array.isArray(pj) ? pj : []).map(
      (x: any) => {
        const imgs = Array.isArray(x?.productImages) ? x.productImages : [];
        const ordered = imgs
          .slice()
          .sort((a: any, b: any) => (a?.priority ?? 0) - (b?.priority ?? 0));
        const images = ordered.map((i: any) => toBaseName(i?.name)).filter(Boolean);
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
          categoryId,
        };
      }
    );
    setAllProducts(normalized);
  };

  useEffect(() => {
    if (!token) return;
    fetchCart();
    fetchProducts();
    // слухаємо події, щоб автооновити список без reload
    const onStorage = (e: StorageEvent) => {
      if (e.key === "cart:changed") fetchCart();
    };
    const onCustom = () => fetchCart();
    window.addEventListener("storage", onStorage);
    window.addEventListener("cart:changed", onCustom as EventListener);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("cart:changed", onCustom as EventListener);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const productById = useMemo(() => {
    const m = new Map<number, ProductDto & { categoryId?: number }>();
    for (const p of allProducts) m.set(p.id, p);
    return m;
  }, [allProducts]);

  const getImgSrc = (it: CartItem): string => {
    const own = imgFromCartItem(it);
    if (own) return own;
    const p = productById.get(it.productId);
    if (p) {
      if (Array.isArray(p.images) && p.images.length > 0) return img200fromBase(p.images[0]);
      const single = toBaseName(p.image || p.imageUrl || p.imagePath || "");
      if (single) return img200fromBase(single);
    }
    return "";
  };

  const subtotal = items.reduce((s, it) => s + it.price * it.quantity, 0);

  const emitCartChanged = () => {
    try {
      localStorage.setItem("cart:changed", String(Date.now()));
      window.dispatchEvent(new Event("cart:changed"));
    } catch {}
  };

  const updateQty = async (productId: number, qty: number) => {
    qty = Math.max(1, Math.min(999, qty | 0));
    setItems((list) =>
      list
        .map((i) => (i.productId === productId ? { ...i, quantity: qty } : i))
        .sort((a, b) => a.productId - b.productId)
    );
    await fetch(`${API}/api/Cart/CreateUpdate`, {
      method: "POST",
      headers: new Headers({ "Content-Type": "application/json", ...authHeaders() }),
      body: JSON.stringify({ productId, quantity: qty }),
    });
    emitCartChanged();
  };

  const removeItem = async (productId: number) => {
    setItems((list) => list.filter((i) => i.productId !== productId));
    await fetch(`${API}/api/Cart/RemoveCartItem/${productId}`, {
      method: "DELETE",
      headers: new Headers(authHeaders()),
    });
    emitCartChanged();
  };
  const clearCart = async () => {
  if (items.length === 0 || clearing) return;
  if (!confirm("Очистити весь кошик?")) return;

  setClearing(true);
  try {
    const ids = items.map(i => i.productId);

    // оптимістично спорожняємо список у UI
    setItems([]);

    // видаляємо поелементно існуючим ендпоінтом
    await Promise.all(
      ids.map(id =>
        fetch(`${API}/api/Cart/RemoveCartItem/${id}`, {
          method: "DELETE",
          headers: new Headers(authHeaders()),
        }).catch(() => null)
      )
    );
  } finally {
    setClearing(false);
    // щоб оновився хедер/інші вкладки
    try {
      localStorage.setItem("cart:changed", String(Date.now()));
      window.dispatchEvent(new Event("cart:changed"));
    } catch {}
  }
};

  // Рекомендовано — рівно один ряд на всю ширину
  const cartCatIds = new Set(items.map((i) => Number(i.categoryId ?? 0)).filter(Boolean));
  const cartIds = new Set(items.map((i) => i.productId));
  const pool = allProducts.filter(
    (p) => (p.categoryId && cartCatIds.has(p.categoryId)) && !cartIds.has(p.id)
  );
  const recommended = pool.slice(0, cols);

  return (
    <Layout>
      <Container maxWidth="lg" sx={{ mt: 2, mb: 6 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, mb: 2 }}>
          Ваші замовлення                      
          <Button
        size="small"
        variant="outlined"
        color="error"
        onClick={clearCart}
        disabled={items.length === 0 || clearing}
        sx={{ borderRadius: 999, px: 1.5, py: 0.3 , ml: 40 }}
      >
        {clearing ? "Очищення…" : "Очистити кошик"}
      </Button>          
        </Typography>        

        <Grid container spacing={2} alignItems="flex-start">
          {/* Ліва колонка — позиції */}
          <Grid item xs={12} md={8}>
            <Paper variant="outlined" sx={{ borderRadius: 3, overflow: "hidden" }}>
              <Box sx={{ px: 2, py: 1.2, bgcolor: "#f6faf9" }}>
                <Typography sx={{ fontWeight: 700, color: "#023854" }}>
                  Персональна інформація
                </Typography>
              </Box>

              <Box sx={{ p: 2 }}>
                {loading && <Typography color="text.secondary">Завантаження…</Typography>}

                {!loading && items.length === 0 && (
                  <Typography color="text.secondary">Кошик порожній.</Typography>
                )}

                {!loading && items.length > 0 && (
                  <Stack divider={<Divider />} spacing={1.5}>
                    {items.map((it) => (
                      <Box
                        key={it.productId}
                        sx={{
                          display: "grid",
                          gridTemplateColumns: "72px 1fr auto auto",
                          gap: 1,
                          alignItems: "center",
                        }}
                      >
                        {/* зображення */}
                        <Box
                          sx={{
                            width: 72,
                            height: 72,
                            bgcolor: "#fff",
                            border: "1px solid #eee",
                            borderRadius: 2,
                            overflow: "hidden",
                            display: "grid",
                            placeItems: "center",
                          }}
                        >
                          <img
                            src={getImgSrc(it)}
                            alt={it.name}
                            style={{ width: "100%", height: "100%", objectFit: "contain" }}
                            onError={(e) => {
                              const el = e.currentTarget as HTMLImageElement;
                              const src = el.getAttribute("src") || "";
                              if (src.includes("/200_")) el.src = src.replace("/200_", "/0_");
                              else el.style.visibility = "hidden";
                            }}
                          />
                        </Box>

                        {/* назва */}
                        <Typography sx={{ fontWeight: 600, color: "#023854" }}>
                          {it.name}
                        </Typography>

                        {/* кількість */}
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <TextField
                            size="small"
                            type="number"
                            value={it.quantity}
                            onChange={(e) => updateQty(it.productId, Number(e.target.value))}
                            inputProps={{ min: 1, style: { width: 64, textAlign: "center" } }}
                          />
                        </Box>

                        {/* сума + видалити */}
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Typography sx={{ fontWeight: 700 }}>
                            {(it.price * it.quantity).toLocaleString("uk-UA")}₴
                          </Typography>
                          <IconButton
                            onClick={() => removeItem(it.productId)}
                            size="small"
                            color="error"
                            aria-label="Видалити позицію"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      </Box>
                    ))}
                  </Stack>
                )}
              </Box>
            </Paper>
          </Grid>

          {/* Права колонка — підсумок */}
          <Grid item xs={12} md={4}>
            <Paper variant="outlined" sx={{ borderRadius: 3 }}>
              <Box sx={{ px: 2, py: 1.2, bgcolor: "#f6faf9" }}>
                <Typography sx={{ fontWeight: 700, color: "#023854" }}>
                  Підсумок замовлення
                </Typography>
              </Box>

              <Box sx={{ p: 2 }}>
                <Stack spacing={1} sx={{ mb: 1 }}>
                  <Row label="Підсумок:" value={`${subtotal.toLocaleString("uk-UA")}₴`} />
                  <Row label="Доставка:" value="—" />
                  <Row label="Знижка:" value="—" />
                  <Divider />
                  <Row label="Разом:" value={`${subtotal.toLocaleString("uk-UA")}₴`} bold />
                </Stack>

                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 1 }}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <StarIcon key={i} fontSize="small" sx={{ opacity: i < 4 ? 1 : 0.35 }} />
                  ))}
                  <Typography variant="caption" sx={{ color: "text.secondary", ml: 0.5 }}>
                    Середня оцінка: 4.5
                  </Typography>
                </Box>

                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<ShoppingCartIcon />}
                  disabled={items.length === 0}
                  sx={{
                    mt: 0.5,
                    py: 1.25,
                    fontWeight: 700,
                    borderRadius: 999,
                    background: "linear-gradient(90deg, #023854 0%, #035B94 100%)",
                    "&:hover": {
                      opacity: 0.95,
                      background: "linear-gradient(90deg, #023854 0%, #035B94 100%)",
                    },
                  }}
                  onClick={() => alert("Далі — оформлення/доставка")}
                >
                  Оформити замовлення
                </Button>
              </Box>
            </Paper>
          </Grid>
        </Grid>

        {/* Рекомендовано — рівно один ряд */}
        {recommended.length > 0 && (
          <Box sx={{ mt: 3 }}>
            <Typography sx={{ mb: 1.5, fontWeight: 700, color: "#023854" }}>
              Рекомендовано
            </Typography>
            <Box
              sx={{
                display: "grid",
                gap: 2,
                gridTemplateColumns: `repeat(${cols}, 1fr)`,
              }}
            >
              {recommended.map((p) => (
                <Box key={p.id}>
                  <ProductTile p={p} />
                </Box>
              ))}
            </Box>
          </Box>
        )}
      </Container>
    </Layout>
  );
}

function Row({ label, value, bold = false }: { label: string; value: string; bold?: boolean }) {
  return (
    <Box sx={{ display: "flex", justifyContent: "space-between" }}>
      <Typography color="text.secondary">{label}</Typography>
      <Typography sx={{ fontWeight: bold ? 800 : 600 }}>{value}</Typography>
    </Box>
  );
}
