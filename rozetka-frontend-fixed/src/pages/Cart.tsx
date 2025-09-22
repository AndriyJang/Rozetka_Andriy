// src/pages/Cart.tsx
import Layout from "../components/Layout";
import {
  Box, Button, Container, Divider, Grid, IconButton, Paper, Stack, TextField, Typography,
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
  // можливі поля з бекенду
  image?: string | null;
  imageUrl?: string | null;
  imagePath?: string | null;
  images?: string[] | null;
  categoryId?: number | null;
};

const RAW_API = import.meta.env.VITE_API_URL || "";
const API = RAW_API.replace(/\/+$/, "");
const IMAGES_BASE = `${API}/images`;

// helpers для картинок — такі самі правила, як у ProductDetails/ProductTile
const clean = (v: string) =>
  v.replace(/^https?:\/\/[^/]+/i, "").replace(/^\/+/, "").replace(/^images\//, "").replace(/^\d+_/, "");
const imgUrl = (name?: string, size = 200) => (name ? `${IMAGES_BASE}/${size}_${clean(name)}` : "");

// з продукту робимо baseName першого зображення
const firstImageBaseFromProduct = (p: any): string | "" => {
  const imgs = Array.isArray(p?.productImages) ? p.productImages : [];
  const ordered = imgs.slice().sort((a: any, b: any) => (a?.priority ?? 0) - (b?.priority ?? 0));
  const name = ordered[0]?.name ?? "";
  return clean(String(name || ""));
};

// завжди Record<string,string> (для Headers)
const authHeaders = (): Record<string, string> => {
  const token = localStorage.getItem("token") ?? "";
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export default function Cart() {
  const [rawItems, setRawItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const token = useMemo(() => localStorage.getItem("token") ?? "", []);

  // 1) завантажити кошик
  const fetchCart = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/api/Cart/GetCart`, { headers: new Headers(authHeaders()) });
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
      setRawItems(mapped);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
  const onLocalStorage = (e: StorageEvent) => {
    if (e.key === "cart:changed") fetchCart();
  };
  const onCustom = () => fetchCart();

  window.addEventListener("storage", onLocalStorage);
  window.addEventListener("cart:changed", onCustom as EventListener);

  return () => {
    window.removeEventListener("storage", onLocalStorage);
    window.removeEventListener("cart:changed", onCustom as EventListener);
  };
}, []);

  // 2) завантажити всі продукти (щоб мати зображення та категорії)
  const fetchProducts = async () => {
    const r = await fetch(`${API}/api/Products`, { headers: new Headers(authHeaders()) });
    const data = r.ok ? await r.json() : [];
    setAllProducts(Array.isArray(data) ? data : []);
  };

  useEffect(() => {
    if (!token) return;
    fetchCart();
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // 3) згрупувати однакові productId + підлити картинку/категорію з products
  const items = useMemo(() => {
    if (!rawItems.length) return [];
    const byId = new Map<number, CartItem>();
    for (const it of rawItems) {
      const prev = byId.get(it.productId);
      if (prev) {
        byId.set(it.productId, { ...prev, quantity: prev.quantity + it.quantity });
      } else {
        byId.set(it.productId, { ...it });
      }
    }

    // збагачуємо картинками з allProducts
    return Array.from(byId.values()).map((it) => {
      const prod = allProducts.find((p) => Number(p?.id) === it.productId);
      const catId = Number(prod?.category?.id ?? prod?.categoryId ?? it.categoryId ?? 0) || null;

      // якщо в ел-ті кошика немає фото — беремо з продукту
      let base = "";
      if (Array.isArray(it.images) && it.images[0]) base = clean(String(it.images[0]));
      else base = firstImageBaseFromProduct(prod);

      return {
        ...it,
        categoryId: catId,
        // підставимо images, щоб нижче однозначно формувати src
        images: base ? [base] : it.images ?? null,
      } as CartItem;
    });
  }, [rawItems, allProducts]);

  const subtotal = items.reduce((s, it) => s + it.price * it.quantity, 0);

  const updateQty = async (productId: number, qty: number) => {
    qty = Math.max(1, Math.min(999, qty | 0));
    // миттєво міняємо локально
    setRawItems((list) => {
      // у сирому масиві може бути кілька рядків одного товару — залишимо один, інші видалимо
      const others = list.filter((x) => x.productId !== productId);
      const current = items.find((x) => x.productId === productId);
      const name = current?.name ?? "Товар";
      const price = current?.price ?? 0;
      return [...others, { productId, name, price, quantity: qty } as CartItem];
    });
    // бек
    await fetch(`${API}/api/Cart/CreateUpdate`, {
      method: "POST",
      headers: new Headers({ "Content-Type": "application/json", ...authHeaders() }),
      body: JSON.stringify({ productId, quantity: qty }),
    });
    try { localStorage.setItem("cart:changed", String(Date.now())); } catch {}
  };

  const removeItem = async (productId: number) => {
    setRawItems((list) => list.filter((i) => i.productId !== productId));
    await fetch(`${API}/api/Cart/RemoveCartItem/${productId}`, {
      method: "DELETE",
      headers: new Headers(authHeaders()),
    });
    try { localStorage.setItem("cart:changed", String(Date.now())); } catch {}
  };

  // Рекомендовано — рівно 4 картки в один ряд, ті ж категорії, без дублювань
  const cartCatIds = new Set(items.map((i) => Number(i.categoryId ?? 0)).filter(Boolean));
  const cartIds = new Set(items.map((i) => i.productId));
  const recommended: ProductDto[] = (allProducts as any[])
    .filter((p) => cartCatIds.has(Number(p?.category?.id ?? p?.categoryId ?? 0)) && !cartIds.has(p?.id))
    .slice(0, 4) // рівно 4
    .map((p) => ({
      id: Number(p.id),
      name: String(p.name ?? p.title ?? "Товар"),
      title: String(p.title ?? ""),
      price: Number(p.price ?? 0),
      images: (Array.isArray(p.productImages) ? p.productImages : [])
        .slice()
        .sort((a: any, b: any) => (a?.priority ?? 0) - (b?.priority ?? 0))
        .map((i: any) => clean(i?.name))
        .filter(Boolean),
    }));

  return (
    <Layout>
      <Container maxWidth="lg" sx={{ mt: 2, mb: 6 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, mb: 2 }}>
          Оформлення замовлення
        </Typography>

        <Grid container spacing={2} alignItems="flex-start">
          {/* Ліва частина — позиції */}
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
                    {items.map((it) => {
                      // формуємо src із першого baseName
                      const base = Array.isArray(it.images) && it.images[0] ? it.images[0] : "";
                      const src = base ? imgUrl(base, 200) : "";

                      return (
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
                              width: 72, height: 72, bgcolor: "#fff",
                              border: "1px solid #eee", borderRadius: 2,
                              overflow: "hidden", display: "grid", placeItems: "center",
                              color: "#98a6ad", fontSize: 12,
                            }}
                          >
                            {src ? (
                              <img
                                src={src}
                                alt={it.name}
                                style={{ width: "100%", height: "100%", objectFit: "contain" }}
                                onError={(e) => {
                                  const img = e.currentTarget as HTMLImageElement;
                                  // спробуємо 0_ як fallback
                                  const zero = base ? imgUrl(base, 0) : "";
                                  if (zero && img.src !== zero) img.src = zero;
                                  else img.style.visibility = "hidden";
                                }}
                              />
                            ) : (
                              "немає фото"
                            )}
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
                      );
                    })}
                  </Stack>
                )}
              </Box>
            </Paper>

            {/* Рекомендовано — рівно 4 картки в один ряд */}
            {recommended.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography sx={{ mb: 1.5, fontWeight: 700, color: "#023854" }}>
                  Рекомендовано
                </Typography>
                <Grid container spacing={2}>
                  {recommended.map((p) => (
                    <Grid key={p.id} item xs={12} sm={6} md={3} lg={3}>
                      <ProductTile p={p} />
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}
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

                {/* Рейтинг-заглушка над кнопкою */}
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
                    "&:hover": { opacity: 0.95, background: "linear-gradient(90deg, #023854 0%, #035B94 100%)" },
                  }}
                  onClick={() => alert("Далі — оформлення/доставка")}
                >
                  Оформити замовлення
                </Button>
              </Box>
            </Paper>
          </Grid>
        </Grid>
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
