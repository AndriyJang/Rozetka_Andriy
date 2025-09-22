import {
  Card, CardContent, CardActions, Typography, Button, Box, Stack, IconButton, Divider,
} from "@mui/material";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import CloseIcon from "@mui/icons-material/Close";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";
import { toast } from "../../components/ToastHost";

export type ProductDto = {
  id: number;
  name?: string;
  title?: string;
  price: number;
  images?: string[] | null;
  image?: string | null;
  imageUrl?: string | null;
  imagePath?: string | null;
  description?: string | null;
  brand?: string | null;
  brandSite?: string | null;
  size?: string | null;
  color?: string | null;
  year?: number | "" | null;
};

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

function absUrl(path?: string | null) {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  const p = path.replace(/^\/+/, "");
  return `${API}/${p}`;
}

export default function ProductTile({ p }: { p: ProductDto }) {
  const navigate = useNavigate();

  const title = p.name || p.title || "Товар";

  const firstImageBase = useMemo(() => {
    if (Array.isArray(p.images) && p.images.length > 0) {
      return toBaseName(p.images[0]);
    }
    const single = p.image || p.imageUrl || p.imagePath;
    return toBaseName(single || "");
  }, [p]);

  const [src] = useState<string>(firstImageBase ? imgUrl(firstImageBase, 800) : "");

  const onImgError: React.ReactEventHandler<HTMLImageElement> = (e) => {
    const el = e.currentTarget;
    if (!el.dataset.fallbackTried && firstImageBase) {
      el.dataset.fallbackTried = "1";
      el.src = imgUrl(firstImageBase, 0);
    } else if (p.image || p.imageUrl || p.imagePath) {
      el.src = absUrl(p.image || p.imageUrl || p.imagePath || "");
    } else {
      el.style.opacity = "0.2";
    }
  };

  const [openMore, setOpenMore] = useState(false);

  const showVal = (v: unknown) => {
    const s = (v ?? "").toString().trim();
    return s ? s : "—";
  };

  const addToCart = async () => {
  const token = localStorage.getItem("token") ?? "";
  if (!token) { navigate("/login"); return; }

  try {
    // 1) дізнатись поточну к-сть цього товару
    const get = await fetch(`${API}/api/Cart/GetCart`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const list = get.ok ? await get.json() : [];
    const row = Array.isArray(list) ? list.find((x: any) => Number(x?.productId ?? x?.id) === p.id) : null;
    const nextQty = Number(row?.quantity ?? 0) + 1;

    // 2) виставити НОВЕ значення
    const res = await fetch(`${API}/api/Cart/CreateUpdate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ productId: p.id, quantity: nextQty }),
    });
  

    if (res.status === 401) { navigate("/login"); return; }
    if (!res.ok) throw new Error("Не вдалося оновити кошик");

    // 3) сповістити UI
    try {
        localStorage.setItem("cart:changed", String(Date.now()));
        window.dispatchEvent(new Event("cart:changed"));
}   catch {}
    // тост
    toast("Товар додано в кошик ✅", { severity: "success" });
  } catch (e) {
    console.error(e);
    toast("Сталася помилка під час додавання", { severity: "error" });
  }
};

  return (
    <Box sx={{ position: "relative", overflow: "visible" }}>
      <Card
        variant="outlined"
        sx={{
          borderRadius: 3,
          height: "100%",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          position: "relative",
          zIndex: openMore ? 11 : 1,
        }}
      >
        {/* зображення */}
        <Box
          component={RouterLink}
          to={`/product/${p.id}`}
          sx={{
            position: "relative",
            display: "block",
            bgcolor: "#fff",
            height: 240,
            borderBottom: "1px solid rgba(2,56,84,0.08)",
          }}
        >
          {src ? (
            <Box
              component="img"
              src={src}
              alt={title}
              sx={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
              onError={onImgError}
            />
          ) : (
            <Box sx={{ width: "100%", height: "100%", bgcolor: "#f5f7f9" }} />
          )}
        </Box>

        <CardContent sx={{ flexGrow: 1 }}>
          <Typography
            component={RouterLink}
            to={`/product/${p.id}`}
            variant="subtitle1"
            sx={{
              textDecoration: "none",
              color: "#023854",
              fontWeight: 600,
              display: "block",
              minHeight: 48,
            }}
            title={title}
          >
            {title}
          </Typography>

          <Typography variant="h6" sx={{ mt: 1, color: "#023854", fontWeight: 700 }}>
            {Number(p.price).toLocaleString("uk-UA")}₴
          </Typography>

          {/* “Більше” — overlay */}
          <Box sx={{ mt: 1 }}>
            <Button
              size="small"
              sx={{ textTransform: "none", px: 1 }}
              endIcon={openMore ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpenMore((s) => !s); }}
              aria-expanded={openMore ? "true" : undefined}
              aria-haspopup="dialog"
            >
              Більше
            </Button>
          </Box>
        </CardContent>

        <CardActions sx={{ p: 2, pt: 0, justifyContent: "center" }}>
          <Button
            onClick={addToCart}
            variant="contained"
            sx={{
              borderRadius: "28px",
              minWidth: 56,
              px: 2.5,
              background: "#0b8a83",
              "&:hover": { background: "#08776f" },
            }}
            startIcon={<ShoppingCartIcon />}
          >
            Додати в кошик
          </Button>
        </CardActions>
      </Card>

      {/* OVERLAY з описом уверху */}
      {openMore && (
        <Box
          role="dialog"
          aria-label={`Деталі товару ${title}`}
          sx={{
            position: "absolute",
            top: -12,
            left: -12,
            right: -12,
            zIndex: 20,
            borderRadius: 3,
            bgcolor: "#fff",
            boxShadow: 12,
            border: "1px solid rgba(2,56,84,0.12)",
            maxHeight: "70vh",
            overflow: "auto",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* шапка */}
          <Box sx={{ display: "flex", alignItems: "center", p: 1.5, pb: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "#023854", flex: 1 }}>
              {title}
            </Typography>
            <IconButton size="small" onClick={() => setOpenMore(false)} aria-label="Закрити деталі">
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>

          {/* контент */}
          <Box sx={{ px: 2, pb: 2 }}>
            {!!src && (
              <Box sx={{ mb: 1.5, display: "grid", placeItems: "center" }}>
                <Box
                  component="img"
                  src={src}
                  alt={title}
                  sx={{ width: "100%", maxWidth: 360, height: "auto", objectFit: "contain" }}
                  onError={onImgError}
                />
              </Box>
            )}

            {/* Опис */}
            <Stack spacing={0.5} sx={{ mb: 1.5 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                Опис
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {showVal(p.description)}
              </Typography>
            </Stack>

            <Divider sx={{ mb: 1.5 }} />

            {/* Характеристики */}
            <Stack spacing={0.5}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
                Характеристики
              </Typography>
              <Typography variant="body2" color="text.secondary"><strong>Виробник:</strong> {showVal(p.brand)}</Typography>
              <Typography variant="body2" color="text.secondary"><strong>Сайт виробника:</strong> {showVal(p.brandSite)}</Typography>
              <Typography variant="body2" color="text.secondary"><strong>Розмір:</strong> {showVal(p.size)}</Typography>
              <Typography variant="body2" color="text.secondary"><strong>Колір:</strong> {showVal(p.color)}</Typography>
              <Typography variant="body2" color="text.secondary"><strong>Рік:</strong> {showVal(p.year)}</Typography>
            </Stack>

            <Box sx={{ pt: 2, textAlign: "right" }}>
              <Button size="small" onClick={() => setOpenMore(false)} startIcon={<CloseIcon fontSize="small" />}>
                Закрити
              </Button>
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
}
