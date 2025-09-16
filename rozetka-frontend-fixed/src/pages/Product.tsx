// src/pages/Product.tsx
import Layout from "../components/Layout";
import { useMemo, useState, useEffect } from "react";
import {
  Container, Typography, Table, TableHead, TableRow, TableCell, TableBody,
  Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, FormControlLabel, Checkbox, Stack, Snackbar, Alert, Box, CircularProgress, Tabs, Tab, InputAdornment
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

// ---- Типи відповідно до твоїх моделей ----
type ProductRow = {
  id: number;
  name: string;
  slug: string;
  price: number;
  categoryId: number;
  description: string;
  images: string[]; // імена з ProductImages (в порядку за Priority)
  // фронтові (демо)
  inStock: boolean;
  brand?: string;
  brandSite?: string;
  size?: string;
  color?: string;
  year?: number | "";
};
type ApiProductImage = { id: number; name: string; priority: number };

const API = import.meta.env.VITE_API_URL;

// --- Ендпоінти згідно бекенду ---
const PRODUCTS_LIST = `${API}/api/Products`;                      // GET (усі)
const PRODUCT_GET_ID = (id: number) => `${API}/api/Products/id/${id}`; // GET id/{id}
const PRODUCT_CREATE = `${API}/api/Products/create`;              // POST [FromForm]
const PRODUCT_EDIT = `${API}/api/Products/edit`;                  // PUT  [FromForm]
const PRODUCT_DELETE = (id: number) => `${API}/api/Products/${id}`;     // DELETE {id}

// ---- slugify для Name -> Slug ----
function slugify(input: string): string {
  const map: Record<string, string> = {
    "є":"ie","ї":"i","і":"i","ґ":"g","Є":"ie","Ї":"i","І":"i","Ґ":"g",
    "а":"a","б":"b","в":"v","г":"h","д":"d","е":"e","ё":"e","ж":"zh","з":"z","и":"i","й":"y",
    "к":"k","л":"l","м":"m","н":"n","о":"o","п":"p","р":"r","с":"s","т":"t","у":"u","ф":"f",
    "х":"h","ц":"ts","ч":"ch","ш":"sh","щ":"shch","ъ":"","ы":"y","ь":"","э":"e","ю":"yu","я":"ya",
    "А":"a","Б":"b","В":"v","Г":"h","Д":"d","Е":"e","Ё":"e","Ж":"zh","З":"z","И":"i","Й":"y",
    "К":"k","Л":"l","М":"m","Н":"n","О":"o","П":"p","Р":"r","С":"s","Т":"t","У":"u","Ф":"f",
    "Х":"h","Ц":"ts","Ч":"ch","Ш":"sh","Щ":"shch","Ъ":"","Ы":"y","Ь":"","Э":"e","Ю":"yu","Я":"ya"
  };
  const normalized = input
    .split("").map(ch => map[ch] ?? ch).join("")
    .normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
  return normalized.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").replace(/--+/g, "-");
}

// ---- Мапінг з API ProductItemModel -> ProductRow ----
const mapFromApi = (x: any): ProductRow => {
  const imgs: ApiProductImage[] = Array.isArray(x?.productImages) ? x.productImages : [];
  const ordered = imgs.slice().sort((a, b) => a.priority - b.priority);
  return {
    id: Number(x?.id ?? 0),
    name: String(x?.name ?? ""),
    slug: String(x?.slug ?? ""),
    price: Number(x?.price ?? 0),
    categoryId: Number(x?.category?.id ?? x?.categoryId ?? 0),
    description: String(x?.description ?? ""),
    images: ordered.map(i => i.name),

    // фронтові демо-поля (не відправляються в бек)
    inStock: true,
    brand: "",
    brandSite: "",
    size: "",
    color: "",
    year: "",
  };
};

export default function Product() {
  const token = useMemo(() => localStorage.getItem("token") ?? "", []);
  const [tab, setTab] = useState(1); // 0=Користувачі, 1=Товари, 2=Категорії

  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const [openProduct, setOpenProduct] = useState(false);
  const [editProduct, setEditProduct] = useState<ProductRow | null>(null);

  // Форма
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [price, setPrice] = useState<number>(0);
  const [categoryId, setCategoryId] = useState<number>(0);
  const [description, setDescription] = useState("");
  // існуючі фото (імена, через кому в UI)
  const [existingImageNames, setExistingImageNames] = useState<string>("");
  // нові фото
  const [newFiles, setNewFiles] = useState<File[]>([]);

  // фронтові демо-поля (не шлемо)
  const [inStock, setInStock] = useState(true);
  const [brand, setBrand] = useState("");
  const [brandSite, setBrandSite] = useState("");
  const [size, setSize] = useState("");
  const [color, setColor] = useState("");
  const [year, setYear] = useState<number | "">("");

  // Швидкі дії за ID
  const [productIdInput, setProductIdInput] = useState<string>("");

  const [snack, setSnack] = useState<{open:boolean; msg:string; type:"success"|"error"}>(
    { open:false, msg:"", type:"success" }
  );

  const authHeadersJson: Record<string, string> = {"Content-Type":"application/json"};
  if (token) authHeadersJson.Authorization = `Bearer ${token}`;

  const authHeadersOnlyAuth: Record<string, string> = {};
  if (token) authHeadersOnlyAuth.Authorization = `Bearer ${token}`;

  // Tabs навігація
  const navigate = useNavigateSafe();
  useEffect(() => {
    if (tab === 0) navigate("/admin");
    if (tab === 2) navigate("/categorie");
  }, [tab, navigate]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch(PRODUCTS_LIST, { headers: authHeadersJson });
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

  // автоматичне завантаження, як у категоріях
  useEffect(() => { fetchProducts(); /* eslint-disable-next-line */ }, []);

  const filteredProducts = products.filter(p => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      p.name.toLowerCase().includes(q) ||
      p.slug.toLowerCase().includes(q) ||
      String(p.categoryId).includes(q)
    );
  });

  const resetForm = () => {
    setName("");
    setSlug("");
    setPrice(0);
    setCategoryId(0);
    setDescription("");
    setExistingImageNames("");
    setNewFiles([]);
    setInStock(true);
    setBrand("");
    setBrandSite("");
    setSize("");
    setColor("");
    setYear("");
  };

  const onOpenProduct = (p?: ProductRow) => {
    if (p) {
      setEditProduct(p);
      setName(p.name);
      setSlug(p.slug || slugify(p.name));
      setPrice(p.price);
      setCategoryId(p.categoryId);
      setDescription(p.description ?? "");
      setExistingImageNames((p.images ?? []).join(", "));
      setNewFiles([]);
      setInStock(true); setBrand(""); setBrandSite(""); setSize(""); setColor(""); setYear("");
    } else {
      setEditProduct(null);
      resetForm();
    }
    setOpenProduct(true);
  };

  // CREATE
  const createProduct = async () => {
    const fd = new FormData();
    fd.append("Name", name.trim());
    fd.append("Slug", (slug.trim() || slugify(name)));
    fd.append("Price", String(price));
    fd.append("CategoryId", String(categoryId));
    fd.append("Description", description ?? "");
    if (!newFiles.length) throw new Error("Додайте хоча б одне фото (imageFiles[])");
    for (const file of newFiles) fd.append("imageFiles[]", file, file.name);

    const res = await fetch(PRODUCT_CREATE, { method: "POST", headers: authHeadersOnlyAuth, body: fd });
    if (!res.ok) {
      let msg = "Не вдалося створити товар";
      try { const d = await res.json(); if (d?.message) msg = d.message; } catch {}
      throw new Error(msg);
    }
    await res.json().catch(() => null);
    await fetchProducts();
  };

  // EDIT
  const updateProduct = async (id: number) => {
    const fd = new FormData();
    fd.append("Id", String(id));
    fd.append("Name", name.trim());
    fd.append("Slug", (slug.trim() || slugify(name)));
    fd.append("Price", String(price));
    fd.append("CategoryId", String(categoryId));
    fd.append("Description", description ?? "");

    const keepNames = existingImageNames.split(",").map(s => s.trim()).filter(Boolean);
    for (const filename of keepNames) {
      const blob = new Blob([], { type: "old-image" });
      fd.append("imageFiles[]", blob, filename);
    }
    for (const file of newFiles) fd.append("imageFiles[]", file, file.name);

    const res = await fetch(PRODUCT_EDIT, { method: "PUT", headers: authHeadersOnlyAuth, body: fd });
    if (!res.ok) {
      let msg = "Не вдалося оновити товар";
      try { const d = await res.json(); if (d?.message) msg = d.message; } catch {}
      throw new Error(msg);
    }
    await res.json().catch(() => null);
    await fetchProducts();
  };

  const deleteProduct = async (id: number) => {
    const res = await fetch(PRODUCT_DELETE(id), { method:"DELETE", headers: authHeadersJson });
    if (!res.ok) {
      let msg = "Не вдалося видалити товар";
      try { const d=await res.json(); if (d?.message) msg=d.message; } catch {}
      throw new Error(msg);
    }
  };

  const onSaveProduct = async () => {
    if (!name.trim() || price < 0 || !Number.isFinite(price)) {
      setSnack({open:true, msg:"Перевірте назву та коректну ціну", type:"error"}); return;
    }
    if (!categoryId || categoryId < 1) {
      setSnack({open:true, msg:"Вкажіть CategoryId (ціле число ≥ 1)", type:"error"}); return;
    }
    try {
      if (editProduct) { await updateProduct(editProduct.id); setSnack({open:true, msg:"Товар оновлено", type:"success"}); }
      else { await createProduct(); setSnack({open:true, msg:"Товар додано", type:"success"}); }
      setOpenProduct(false); setEditProduct(null);
    } catch (e:any) {
      setSnack({open:true, msg:e?.message ?? "Помилка збереження товару", type:"error"});
    }
  };

  const onDeleteProductClick = async (p: ProductRow) => {
    if (!confirm(`Видалити товар "${p.name}"?`)) return;
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
      const res = await fetch(PRODUCT_GET_ID(id), { headers: authHeadersJson });
      if (res.ok) {
        const one = mapFromApi(await res.json());
        setEditProduct(one);
        setName(one.name); setSlug(one.slug || slugify(one.name)); setPrice(one.price);
        setCategoryId(one.categoryId); setDescription(one.description ?? "");
        setExistingImageNames((one.images ?? []).join(", ")); setNewFiles([]);
        setOpenProduct(true); return;
      }
    } catch { /* ignore */ }
    const inList = products.find(p => p.id === id);
    if (inList) { onOpenProduct(inList); return; }
    // fallback (не обов’язково)
    setEditProduct({ id, name:"", slug:"", price:0, categoryId:0, description:"", images:[], inStock:true, brand:"", brandSite:"", size:"", color:"", year:"" });
    setName(""); setSlug(""); setPrice(0); setCategoryId(0); setDescription(""); setExistingImageNames(""); setNewFiles([]);
    setOpenProduct(true);
  };

  const deleteById = async () => {
    const id = Number(productIdInput);
    if (!id) { setSnack({open:true, msg:"Вкажіть коректний ID", type:"error"}); return; }
    if (!confirm(`Видалити товар #${id}?`)) return;
    try {
      await deleteProduct(id);
      setSnack({open:true, msg:`Товар #${id} видалено`, type:"success"});
      setProducts(prev => prev.filter(p => p.id !== id));
    } catch (e:any) {
      setSnack({open:true, msg:e?.message ?? "Помилка видалення", type:"error"});
    }
  };

  return (
    <Layout>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
        <Typography variant="h5" sx={{ mb: 2, fontWeight: "bold" }}>
          Кабінет адміністратора — товари
        </Typography>

        {/* Tabs як у категоріях */}
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
          <Tab label="Користувачі" component={RouterLinkSafe} to="/admin" />
          <Tab label="Товари" />
          <Tab label="Категорії" component={RouterLinkSafe} to="/categorie" />
        </Tabs>

        {/* Верхня панель: пошук + оновити + додати */}
        <Stack direction={{ xs: "column", md: "row" }} gap={2} alignItems="center" sx={{ mb: 2 }}>
          <TextField
            size="small"
            placeholder="Пошук (назва, slug або categoryId)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ flex: 1, minWidth: 260 }}
          />
          <Button variant="outlined" onClick={fetchProducts} disabled={loading}>Оновити</Button>
          <Button variant="contained" onClick={() => onOpenProduct()}>Додати товар</Button>
        </Stack>

        {/* Швидкі дії за ID */}
        <Stack direction={{ xs: "column", md: "row" }} gap={1.5} alignItems="center" sx={{ mb: 2 }}>
          <TextField
            size="small"
            label="ID товару"
            type="number"
            value={productIdInput}
            onChange={(e)=>setProductIdInput(e.target.value)}
            sx={{ width: 200 }}
            InputProps={{ startAdornment: <InputAdornment position="start">#</InputAdornment> }}
          />
          <Button variant="outlined" onClick={openEditById} startIcon={<EditIcon />}>
            Редагувати за ID
          </Button>
          <Button variant="outlined" color="error" onClick={deleteById} startIcon={<DeleteIcon />}>
            Видалити за ID
          </Button>
        </Stack>

        {/* Таблиця товарів */}
        {loading ? (
          <Box sx={{ display:"flex", justifyContent:"center", py:6 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Назва</TableCell>
                <TableCell>Slug</TableCell>
                <TableCell>Ціна</TableCell>
                <TableCell>Категорія (ID)</TableCell>
                <TableCell>Фото (шт.)</TableCell>
                <TableCell align="right">Дії</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredProducts.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>{p.id}</TableCell>
                  <TableCell>{p.name}</TableCell>
                  <TableCell>{p.slug || "-"}</TableCell>
                  <TableCell>{p.price.toLocaleString()} грн</TableCell>
                  <TableCell>{p.categoryId}</TableCell>
                  <TableCell>{p.images?.length ?? 0}</TableCell>
                  <TableCell align="right">
                    <Button size="small" onClick={() => onOpenProduct(p)} startIcon={<EditIcon />}>Редагувати</Button>
                    <Button size="small" color="error" onClick={() => onDeleteProductClick(p)} startIcon={<DeleteIcon />}>Видалити</Button>
                  </TableCell>
                </TableRow>
              ))}
              {filteredProducts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center">Немає даних</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}

        {/* модальне вікно додати/редагувати */}
        <Dialog open={openProduct} onClose={() => setOpenProduct(false)} maxWidth="sm" fullWidth>
          <DialogTitle>{editProduct ? "Редагувати товар" : "Додати товар"}</DialogTitle>
          <DialogContent sx={{ pt: 1 }}>
            <Stack gap={2} sx={{ mt: 1 }}>
              <TextField
                label="Назва (Name)"
                value={name}
                onChange={(e)=>{
                  const v = e.target.value;
                  setName(v);
                  if (!editProduct || !slug || slug === slugify(name)) setSlug(slugify(v));
                }}
                fullWidth
              />
              <TextField label="Slug" value={slug} onChange={(e)=>setSlug(slugify(e.target.value))} fullWidth />
              <TextField label="Ціна (грн) / Price" type="number" value={price} onChange={(e)=>setPrice(Number(e.target.value))} fullWidth />
              <TextField label="Категорія (ID) / CategoryId" type="number" value={categoryId} onChange={(e)=>setCategoryId(Number(e.target.value))} fullWidth />
              <TextField label="Опис (Description)" value={description} onChange={(e)=>setDescription(e.target.value)} fullWidth multiline minRows={2} />

              <TextField
                label="Поточні фото (імена через кому, порядок = пріоритет)"
                placeholder="img1.jpg, img2.jpg"
                value={existingImageNames}
                onChange={(e)=>setExistingImageNames(e.target.value)}
                fullWidth
              />
              <Button variant="outlined" component="label">
                Додати нові фото (imageFiles[])
                <input type="file" accept="image/*" hidden multiple
                  onChange={(e)=> setNewFiles(Array.from(e.target.files ?? [])) }
                />
              </Button>
              {newFiles.length > 0 && (
                <Typography variant="body2">
                  Нові файли: {newFiles.map(f => f.name).join(", ")}
                </Typography>
              )}

              {/* фронтові демо-поля */}
              <FormControlLabel control={<Checkbox checked={inStock} onChange={(e)=>setInStock(e.target.checked)} />} label="В наявності (фронт)" />
              <Stack direction={{ xs:"column", sm:"row" }} gap={2}>
                <TextField label="Виробник (фронт)" value={brand} onChange={(e)=>setBrand(e.target.value)} fullWidth/>
                <TextField label="Сайт виробника (фронт)" value={brandSite} onChange={(e)=>setBrandSite(e.target.value)} fullWidth/>
              </Stack>
              <Stack direction={{ xs:"column", sm:"row" }} gap={2}>
                <TextField label="Розмір (фронт)" value={size} onChange={(e)=>setSize(e.target.value)} fullWidth/>
                <TextField label="Колір (фронт)" value={color} onChange={(e)=>setColor(e.target.value)} fullWidth/>
                <TextField label="Рік (фронт)" type="number" value={year}
                  onChange={(e)=>setYear(e.target.value ? Number(e.target.value) : "")} fullWidth/>
              </Stack>
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

/** ——— невеличкі безпечні хелпери для посилань/навігації в Tabs ——— */
import { useNavigate, Link as RouterLinkBase } from "react-router-dom";
function useNavigateSafe() {
  // обгортка щоб уникнути лінтера в цьому файлі
  return useNavigate();
}
const RouterLinkSafe = RouterLinkBase;
