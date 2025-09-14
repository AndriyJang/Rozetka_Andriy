// src/pages/Product.tsx
import Layout from "../components/Layout";
import { useMemo, useState } from "react";
import {
  Container, Typography, Table, TableHead, TableRow, TableCell, TableBody,
  Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, FormControlLabel, Checkbox, Stack, Snackbar, Alert, Box, CircularProgress, MenuItem
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import GroupIcon from "@mui/icons-material/Group";
import { Link as RouterLink } from "react-router-dom";
import CategoryIcon from "@mui/icons-material/Category";

type ProductRow = {
  id: number;
  title: string;
  price: number;
  categoryId: number;
  description?: string;

  // фронтові поля (поки не шлемо в API)
  inStock: boolean;
  brand?: string;
  brandSite?: string;
  size?: string;
  color?: string;
  year?: number | "";
  images: string[];
};

const API = import.meta.env.VITE_API_URL;

// Ендпоінти бекенду під ProductEntity (Title/Price/CategoryId/Description)
const PRODUCTS_LIST = `${API}/api/Products`;                   // GET (усі)
const PRODUCT_CREATE = `${API}/api/Products`;                  // POST
const PRODUCT_GET    = (id: number) => `${API}/api/Products/${id}`;     // GET /{id}
const PRODUCT_UPDATE = (id: number) => `${API}/api/Products/${id}`;     // PUT
const PRODUCT_DELETE = (id: number) => `${API}/api/Products/${id}`;     // DELETE

// Якщо твій бекенд повертає camelCase (за замовч.), цього досить:
const mapFromApi = (x: any): ProductRow => ({
  id: Number(x.id),
  title: x.title ?? "",
  price: Number(x.price ?? 0),
  categoryId: Number(x.categoryId ?? 0),
  description: x.description ?? "",
  // фронтові:
  inStock: true,
  brand: "",
  brandSite: "",
  size: "",
  color: "",
  year: "",
  images: []
});

// У бек надсилаємо тільки те, що він точно знає
const mapToApi = (p: ProductRow) => ({
  title: p.title,
  price: p.price,
  categoryId: p.categoryId,
  description: p.description ?? ""
});

export default function Product() {
  const token = useMemo(() => localStorage.getItem("token") ?? "", []);
  const [showProducts, setShowProducts] = useState(false);

  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const [openProduct, setOpenProduct] = useState(false);
  const [editProduct, setEditProduct] = useState<ProductRow | null>(null);
  const [form, setForm] = useState<ProductRow>({
    id: 0,
    title: "",
    price: 0,
    categoryId: 0,
    description: "",
    // фронтові
    inStock: true, brand: "", brandSite: "", size: "", color: "", year: "", images: []
  });

  // Швидкі дії за ID
  const [productIdInput, setProductIdInput] = useState<string>("");

  const [snack, setSnack] = useState<{open:boolean; msg:string; type:"success"|"error"}>({
    open:false, msg:"", type:"success"
  });

  const authHeaders: Record<string, string> = {"Content-Type":"application/json"};
  if (token) authHeaders.Authorization = `Bearer ${token}`;

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch(PRODUCTS_LIST, { headers: authHeaders });
      if (res.status === 401 || res.status === 403) {
        setSnack({open:true, msg:"Немає доступу до товарів.", type:"error"});
        return;
      }
      if (!res.ok) throw new Error("Не вдалося завантажити товари");
      const data = await res.json();
      const rows: ProductRow[] = Array.isArray(data) ? data.map(mapFromApi) : [];
      setProducts(rows);
    } catch (e:any) {
      setSnack({open:true, msg:e?.message ?? "Помилка завантаження", type:"error"});
    } finally {
      setLoading(false);
    }
  };

  const handleShowProducts = () => {
    const next = !showProducts;
    setShowProducts(next);
    if (next) fetchProducts();
  };

  const filteredProducts = products.filter(p => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      p.title.toLowerCase().includes(q) ||
      String(p.categoryId).includes(q)
    );
  });

  const onOpenProduct = (p?: ProductRow) => {
    if (p) { setEditProduct(p); setForm({...p}); }
    else {
      setEditProduct(null);
      setForm({
        id: 0, title: "", price: 0, categoryId: 0, description: "",
        inStock: true, brand:"", brandSite:"", size:"", color:"", year:"", images:[]
      });
    }
    setOpenProduct(true);
  };

  const createProduct = async (payload: ProductRow) => {
    const res = await fetch(PRODUCT_CREATE, {
      method:"POST", headers: authHeaders, body: JSON.stringify(mapToApi(payload))
    });
    if (!res.ok) {
      let msg = "Не вдалося створити товар";
      try { const d=await res.json(); if (d?.message) msg=d.message; } catch {}
      throw new Error(msg);
    }
    return mapFromApi(await res.json());
  };

  const updateProduct = async (id: number, payload: ProductRow) => {
    const res = await fetch(PRODUCT_UPDATE(id), {
      method:"PUT", headers: authHeaders, body: JSON.stringify(mapToApi(payload))
    });
    if (!res.ok) {
      let msg = "Не вдалося оновити товар";
      try { const d=await res.json(); if (d?.message) msg=d.message; } catch {}
      throw new Error(msg);
    }
    return mapFromApi(await res.json());
  };

  const deleteProduct = async (id: number) => {
    const res = await fetch(PRODUCT_DELETE(id), { method:"DELETE", headers: authHeaders });
    if (!res.ok) {
      let msg = "Не вдалося видалити товар";
      try { const d=await res.json(); if (d?.message) msg=d.message; } catch {}
      throw new Error(msg);
    }
  };

  const onSaveProduct = async () => {
    if (!form.title || form.price < 0 || !Number.isFinite(form.price)) {
      setSnack({open:true, msg:"Перевірте назву та ціну", type:"error"});
      return;
    }
    if (!form.categoryId || form.categoryId < 1) {
      setSnack({open:true, msg:"Вкажіть CategoryId (ціле число ≥ 1)", type:"error"});
      return;
    }
    try {
      if (editProduct) {
        const updated = await updateProduct(editProduct.id, form);
        setProducts(prev => prev.map(p => p.id === editProduct.id ? updated : p));
        setSnack({open:true, msg:"Товар оновлено", type:"success"});
      } else {
        const created = await createProduct(form);
        setProducts(prev => [...prev, created]);
        setSnack({open:true, msg:"Товар додано", type:"success"});
      }
      setOpenProduct(false);
      setEditProduct(null);
    } catch (e:any) {
      setSnack({open:true, msg:e?.message ?? "Помилка збереження товару", type:"error"});
    }
  };

  const onDeleteProductClick = async (p: ProductRow) => {
    if (!confirm(`Видалити товар "${p.title}"?`)) return;
    try {
      await deleteProduct(p.id);
      setProducts(prev => prev.filter(x => x.id !== p.id));
      setSnack({open:true, msg:"Товар видалено", type:"success"});
    } catch (e:any) {
      setSnack({open:true, msg:e?.message ?? "Помилка видалення товару", type:"error"});
    }
  };

  // ===== ШВИДКІ ДІЇ ЗА ID =====
  const openEditById = async () => {
    const id = Number(productIdInput);
    if (!id) { setSnack({open:true, msg:"Вкажіть коректний ID", type:"error"}); return; }

    try {
      const res = await fetch(PRODUCT_GET(id), { headers: authHeaders });
      if (res.ok) {
        const one = mapFromApi(await res.json());
        setEditProduct(one);
        setForm(one);
        setOpenProduct(true);
        return;
      }
    } catch {/* ignore */}

    const inList = products.find(p => p.id === id);
    if (inList) {
      setEditProduct(inList);
      setForm(inList);
      setOpenProduct(true);
      return;
    }

    // fallback — пуста форма з фіксованим id
    setEditProduct({ id, title:"", price:0, categoryId:0, description:"", inStock:true, brand:"", brandSite:"", size:"", color:"", year:"", images:[] });
    setForm({ id, title:"", price:0, categoryId:0, description:"", inStock:true, brand:"", brandSite:"", size:"", color:"", year:"", images:[] });
    setOpenProduct(true);
  };

  const deleteById = async () => {
    const id = Number(productIdInput);
    if (!id) { setSnack({open:true, msg:"Вкажіть коректний ID", type:"error"}); return; }
    if (!confirm(`Видалити товар #${id}?`)) return;
    try {
      await deleteProduct(id);
      setSnack({open:true, msg:`Товар #${id} видалено`, type:"success"});
      if (showProducts) setProducts(prev => prev.filter(p => p.id !== id));
    } catch (e:any) {
      setSnack({open:true, msg:e?.message ?? "Помилка видалення", type:"error"});
    }
  };

  return (
    <Layout>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: "bold" }}>
            Кабінет адміністратора — товари
          </Typography>
          <Button
            variant="outlined"
            component={RouterLink}
            to="/admin"
            startIcon={<GroupIcon />}
          >
            Перейти до користувачів
          </Button>
          <Button
      variant="outlined"
      component={RouterLink}
      to="/categorie"
      startIcon={<CategoryIcon />}
    >
      Перейти до категорій
    </Button>
        </Stack>

        {/* Верхня панель */}
        <Stack direction={{ xs: "column", lg: "row" }} gap={2} alignItems="center" sx={{ mb: 2 }}>
          {/* Ліва зона: показ/сховати + пошук + оновити + додати */}
          <Stack direction="row" gap={2} alignItems="center" sx={{ flexWrap: "wrap" }}>
            <Button variant="contained" onClick={handleShowProducts}>
              {showProducts ? "Сховати товари" : "Показати товари"}
            </Button>
            {showProducts && (
              <>
                <TextField
                  size="small"
                  placeholder="Пошук (назва або categoryId)"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  sx={{ minWidth: 260 }}
                />
                <Button variant="outlined" onClick={fetchProducts} disabled={loading}>Оновити</Button>
                <Button variant="contained" onClick={() => onOpenProduct()}>Додати товар</Button>
              </>
            )}
          </Stack>

          {/* Права зона: швидкі дії за ID */}
          <Stack direction={{ xs: "column", sm: "row" }} gap={1.5} alignItems="center" sx={{ ml: "auto", flexWrap: "wrap" }}>
            <TextField
              label="ID товару"
              size="small"
              type="number"
              value={productIdInput}
              onChange={(e)=>setProductIdInput(e.target.value)}
              sx={{ width: 170 }}
            />
            <Button variant="outlined" onClick={openEditById} startIcon={<EditIcon />}>
              Редагувати за ID
            </Button>
            <Button variant="outlined" color="error" onClick={deleteById} startIcon={<DeleteIcon />}>
              Видалити за ID
            </Button>
          </Stack>
        </Stack>

        {/* Таблиця товарів */}
        {showProducts && (
          loading ? (
            <Box sx={{ display:"flex", justifyContent:"center", py:6 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Назва</TableCell>
                  <TableCell>Ціна</TableCell>
                  <TableCell>Категорія (ID)</TableCell>
                  <TableCell>Опис</TableCell>
                  <TableCell align="right">Дії</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredProducts.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{p.id}</TableCell>
                    <TableCell>{p.title}</TableCell>
                    <TableCell>{p.price.toLocaleString()} грн</TableCell>
                    <TableCell>{p.categoryId}</TableCell>
                    <TableCell>{p.description || "-"}</TableCell>
                    <TableCell align="right">
                      <Button size="small" onClick={() => onOpenProduct(p)} startIcon={<EditIcon />}>Редагувати</Button>
                      <Button size="small" color="error" onClick={() => onDeleteProductClick(p)} startIcon={<DeleteIcon />}>Видалити</Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredProducts.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center">Немає даних</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )
        )}

        {/* модальне вікно додати/редагувати */}
        <Dialog open={openProduct} onClose={() => setOpenProduct(false)} maxWidth="sm" fullWidth>
          <DialogTitle>{editProduct ? "Редагувати товар" : "Додати товар"}</DialogTitle>
          <DialogContent sx={{ pt: 1 }}>
            <Stack gap={2} sx={{ mt: 1 }}>
              <TextField
                label="Назва"
                value={form.title}
                onChange={(e)=>setForm(f=>({...f, title:e.target.value}))}
                fullWidth
              />
              <TextField
                label="Ціна (грн)"
                type="number"
                value={form.price}
                onChange={(e)=>setForm(f=>({...f, price:Number(e.target.value)}))}
                fullWidth
              />
              <TextField
                label="Категорія (ID)"
                type="number"
                value={form.categoryId}
                onChange={(e)=>setForm(f=>({...f, categoryId:Number(e.target.value)}))}
                fullWidth
              />
              <TextField
                label="Опис"
                value={form.description ?? ""}
                onChange={(e)=>setForm(f=>({...f, description: e.target.value}))}
                fullWidth
                multiline
                minRows={2}
              />

              {/* нижче — фронтові поля (не шлемо в API, поки немає в бекенді) */}
              <FormControlLabel
                control={
                  <Checkbox
                    checked={form.inStock}
                    onChange={(e)=>setForm(f=>({...f, inStock:e.target.checked}))}
                  />
                }
                label="В наявності (фронт)"
              />
              <Stack direction={{ xs:"column", sm:"row" }} gap={2}>
                <TextField label="Виробник (фронт)" value={form.brand || ""} onChange={(e)=>setForm(f=>({...f, brand:e.target.value}))} fullWidth/>
                <TextField label="Сайт виробника (фронт)" value={form.brandSite || ""} onChange={(e)=>setForm(f=>({...f, brandSite:e.target.value}))} fullWidth/>
              </Stack>
              <Stack direction={{ xs:"column", sm:"row" }} gap={2}>
                <TextField label="Розмір (фронт)" value={form.size || ""} onChange={(e)=>setForm(f=>({...f, size:e.target.value}))} fullWidth/>
                <TextField label="Колір (фронт)" value={form.color || ""} onChange={(e)=>setForm(f=>({...f, color:e.target.value}))} fullWidth/>
                <TextField label="Рік (фронт)" type="number" value={form.year}
                           onChange={(e)=>setForm(f=>({...f, year:e.target.value ? Number(e.target.value) : ""}))}
                           fullWidth/>
              </Stack>
              <TextField
                label="Фото (імена/URL, фронт)"
                placeholder="img1.jpg, img2.jpg"
                value={form.images.join(", ")}
                onChange={(e)=>setForm(f=>({...f, images:e.target.value.split(",").map(s=>s.trim()).filter(Boolean)}))}
                fullWidth
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenProduct(false)}>Скасувати</Button>
            <Button variant="contained" onClick={onSaveProduct}>{editProduct ? "Зберегти" : "Додати"}</Button>
          </DialogActions>
        </Dialog>

        <Snackbar open={snack.open} autoHideDuration={2500} onClose={()=>setSnack(s=>({...s, open:false}))}>
          <Alert severity={snack.type} onClose={()=>setSnack(s=>({...s, open:false}))}>{snack.msg}</Alert>
        </Snackbar>
      </Container>
    </Layout>
  );
}
