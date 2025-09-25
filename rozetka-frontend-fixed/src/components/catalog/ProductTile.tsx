// src/components/catalog/ProductTile.tsx
import {
  Card, CardContent, CardActions, Typography, Button, Box, Stack, IconButton, Divider,
} from "@mui/material";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import CloseIcon from "@mui/icons-material/Close";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
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

  // Масив базових імен картинок для каруселі
  const imageBases = useMemo<string[]>(() => {
    const arr: string[] = [];
    if (Array.isArray(p.images) && p.images.length > 0) {
      for (const it of p.images) {
        const b = toBaseName(it);
        if (b) arr.push(b);
      }
    } else {
      const single = p.image || p.imageUrl || p.imagePath;
      const b = toBaseName(single || "");
      if (b) arr.push(b);
    }
    // якщо взагалі нема — спробуємо абсолютний URL з imageUrl
    // (в такому випадку зберігаємо спеціальний маркер, щоб не будувати /images/ префікси)
    if (arr.length === 0 && p.imageUrl && /^https?:\/\//i.test(p.imageUrl)) {
      arr.push(p.imageUrl); // абсолютний
    }
    return arr;
  }, [p]);

  const [index, setIndex] = useState(0);
  // якщо товар/фото змінюються — повертати на перше фото
  useEffect(() => { setIndex(0); }, [imageBases.join("|"), p.id]);

  // джерело картинки для поточного індексу
  const curSrc = useMemo(() => {
    const cur = imageBases[index] ?? "";
    if (!cur) return "";
    if (/^https?:\/\//i.test(cur)) return cur; // вже абсолютний
    return imgUrl(cur, 800);
  }, [imageBases, index]);

  const onImgError: React.ReactEventHandler<HTMLImageElement> = (e) => {
    const el = e.currentTarget as HTMLImageElement;
    const tried0 = el.dataset.t0 === "1";
    const triedAbs = el.dataset.tabs === "1";

    // 1) з 800_ -> 0_
    if (!tried0 && curSrc.includes("/800_")) {
      el.dataset.t0 = "1";
      el.src = curSrc.replace("/800_", "/0_");
      return;
    }
    // 2) якщо в полях був абсолютний одиночний шлях — спробувати його
    const abs = absUrl(p.image || p.imageUrl || p.imagePath || "");
    if (!triedAbs && abs && abs !== curSrc) {
      el.dataset.tabs = "1";
      el.src = abs;
      return;
    }
    // 3) віддати напівпрозору заглушку
    el.style.opacity = "0.2";
  };

  const [openMore, setOpenMore] = useState(false);

  const showVal = (v: unknown) => {
    const s = (v ?? "").toString().trim();
    return s ? s : "—";
  };

  // Карусель: вперед/назад
  const total = imageBases.length;
  const prev = (e?: React.MouseEvent) => {
    e?.preventDefault(); e?.stopPropagation();
    if (total <= 1) return;
    setIndex((i) => (i - 1 + total) % total);
  };
  const next = (e?: React.MouseEvent) => {
    e?.preventDefault(); e?.stopPropagation();
    if (total <= 1) return;
    setIndex((i) => (i + 1) % total);
  };

  const addToCart = async () => {
    const token = localStorage.getItem("token") ?? "";
    if (!token) { navigate("/login"); return; }

    try {
      // дізнатись поточну к-сть цього товару
      const get = await fetch(`${API}/api/Cart/GetCart`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const list = get.ok ? await get.json() : [];
      const row = Array.isArray(list) ? list.find((x: any) => Number(x?.productId ?? x?.id) === p.id) : null;
      const nextQty = Number(row?.quantity ?? 0) + 1;

      // оновити кількість
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

      // сповістити хедер/сторінку
      try {
        localStorage.setItem("cart:changed", String(Date.now()));
        window.dispatchEvent(new Event("cart:changed"));
      } catch {}

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
        {/* Фото + карусель */}
        <Box
          component={RouterLink}
          to={`/product/${p.id}`}
          sx={{
            position: "relative",
            display: "block",
            bgcolor: "#fff",
            height: 240,
            borderBottom: "1px solid rgba(2,56,84,0.08)",
            "&:hover .navBtn": { opacity: 1, pointerEvents: "auto" },
          }}
        >
          {curSrc ? (
            <Box
              component="img"
              src={curSrc}
              alt={title}
              loading="lazy"        
              decoding="async"   
              sx={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
              onError={onImgError}
            />
          ) : (
            <Box sx={{ width: "100%", height: "100%", bgcolor: "#f5f7f9" }} />
          )}

          {/* Стрілки (видимі при ховері), якщо є що гортати */}
          {total > 1 && (
            <>
              <IconButton
                className="navBtn"
                onClick={prev}
                size="small"
                sx={{
                  position: "absolute", top: "50%", left: 6, transform: "translateY(-50%)",
                  bgcolor: "rgba(255,255,255,0.9)", border: "1px solid #e5e7eb",
                  opacity: 0, transition: "opacity .15s", pointerEvents: "none",
                  "&:hover": { bgcolor: "#fff" }
                }}
                aria-label="Попереднє фото"
              >
                <ChevronLeftIcon />
              </IconButton>

              <IconButton
                className="navBtn"
                onClick={next}
                size="small"
                sx={{
                  position: "absolute", top: "50%", right: 6, transform: "translateY(-50%)",
                  bgcolor: "rgba(255,255,255,0.9)", border: "1px solid #e5e7eb",
                  opacity: 0, transition: "opacity .15s", pointerEvents: "none",
                  "&:hover": { bgcolor: "#fff" }
                }}
                aria-label="Наступне фото"
              >
                <ChevronRightIcon />
              </IconButton>

              {/* Індикатори з білим обідком */}
<Box
  sx={{
    position: "absolute",
    bottom: 8,
    left: 0,
    right: 0,
    display: "flex",
    justifyContent: "center",
    gap: 0.6,
  }}
  onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
>
  {imageBases.map((_, i) => (
    <Box
      key={i}
      onClick={() => setIndex(i)}
      aria-label={`Фото ${i + 1}`}
      sx={{
        width: 6,
        height: 6,
        borderRadius: "50%",
        bgcolor: i === index ? "#0b8a83" : "rgba(2,56,84,0.28)",
        outline: "2px solid #fff",     // ← білий обідок
        boxSizing: "content-box",      // щоб 5px не “з’їдали” коло
        cursor: "pointer",
      }}
    />
  ))}
</Box>
            </>
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
            {!!curSrc && (
              <Box sx={{ mb: 1.5, display: "grid", placeItems: "center" }}>
                <Box
                  component="img"
                  src={curSrc}
                  alt={title}
                  loading="lazy"         
                  decoding="async"   
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
