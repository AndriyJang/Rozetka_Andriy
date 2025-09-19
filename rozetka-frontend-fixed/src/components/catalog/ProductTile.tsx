// src/components/catalog/ProductTile.tsx
import {
  Card, CardContent, CardActions, Typography, Button, Box, Collapse, Stack,
} from "@mui/material";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import { Link as RouterLink } from "react-router-dom";
import { useMemo, useState } from "react";

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
    // TODO: коли з'явиться ендпоінт кошика — підстав запит сюди
  };

  return (
    <Card
      variant="outlined"
      sx={{
        borderRadius: 3,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
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

        {/* “Більше” — ЗАВЖДИ */}
        <Box sx={{ mt: 1 }}>
          <Button
            size="small"
            sx={{ textTransform: "none", px: 1 }}
            endIcon={openMore ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            onClick={() => setOpenMore((s) => !s)}
          >
            Більше
          </Button>
        </Box>

        <Collapse in={openMore} unmountOnExit>
          <Stack spacing={0.5} sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              <strong>Виробник:</strong> {showVal(p.brand)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <strong>Сайт виробника:</strong> {showVal(p.brandSite)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <strong>Розмір:</strong> {showVal(p.size)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <strong>Колір:</strong> {showVal(p.color)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <strong>Рік:</strong> {showVal(p.year)}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {showVal(p.description)}
            </Typography>
          </Stack>
        </Collapse>
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
  );
}
