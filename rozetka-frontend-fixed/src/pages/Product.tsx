import Layout from "../components/Layout";
import { useMemo, useState, useEffect } from "react";
import {
  Container, Typography, Table, TableHead, TableRow, TableCell, TableBody,
  Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, FormControlLabel, Checkbox, Stack, Snackbar, Alert, Box, CircularProgress,
  InputAdornment, Grid, Paper, IconButton
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import LogoutIcon from "@mui/icons-material/Logout";
import { Link as RouterLink, useNavigate, useLocation } from "react-router-dom";

type ProductRow = {
  id: number;
  name: string;
  slug: string;
  price: number;
  categoryId: number;
  description: string;
  images: string[];        // лише базові імена: aaa.webp
  inStock: boolean;
  brand?: string;
  brandSite?: string;
  size?: string;
  color?: string;
  year?: number | "";
};
type ApiProductImage = { id: number; name: string; priority: number };

const API = import.meta.env.VITE_API_URL as string;
const IMAGES_BASE = `${API}/images`;

// Побудова URL для multi-size WEBP (200_, 800_, 0_)
const imgUrl = (name?: string, size: number = 200) =>
  name ? `${IMAGES_BASE}/${size}_${name}` : "";

// Нормалізація будь-якого вводу до базового імені (без шляху і префіксів розміру)
const toBaseName = (val?: string): string => {
  let v = String(val ?? "").trim();
  if (!v) return "";
  v = v.replace(/^https?:\/\/[^/]+/i, ""); // прибрати origin
  v = v.replace(/^\/+/, "");
  if (v.startsWith("images/")) v = v.slice(7);
  v = (v.split("/").pop() ?? v);
  v = v.replace(/^\d+_/, ""); // прибрати 200_ / 800_ / 0_
  return v;
};

/** ===== REST-ендпоінти (відповідають твоєму ProductsController) ===== **/
const PRODUCTS_LIST = `${API}/api/Products`;
const PRODUCT_GET_ID = (id: number) => `${API}/api/Products/id/${id}`; // було без /id/
const PRODUCT_CREATE = `${API}/api/Products/create`;                    // було без /create
const PRODUCT_EDIT = `${API}/api/Products/edit`;                        // було /Products/{id}
const PRODUCT_DELETE = (id: number) => `${API}/api/Products/${id}`;

function slugify(input: string): string {
  const map: Record<string, string> = { "є":"ie","ї":"i","і":"i","ґ":"g","Є":"ie","Ї":"i","І":"i","Ґ":"g",
    "а":"a","б":"b","в":"v","г":"h","д":"d","е":"e","ё":"e","ж":"zh","з":"z","и":"i","й":"y","к":"k","л":"l","м":"m",
    "н":"n","о":"o","п":"p","р":"r","с":"s","т":"t","у":"u","ф":"f","х":"h","ц":"ts","ч":"ch","ш":"sh","щ":"shch",
    "ъ":"","ы":"y","ь":"","э":"e","ю":"yu","я":"ya","А":"a","Б":"b","В":"v","Г":"h","Д":"d","Е":"e","Ё":"e","Ж":"zh",
    "З":"z","И":"i","Й":"y","К":"k","Л":"l","М":"m","Н":"n","О":"o","П":"p","Р":"r","С":"s","Т":"t","У":"u","Ф":"f",
    "Х":"h","Ц":"ts","Ч":"ch","Ш":"sh","Щ":"shch","Ъ":"","Ы":"y","Ь":"","Э":"e","Ю":"yu","Я":"ya" };
  const normalized = input.split("").map(ch => map[ch] ?? ch).join("")
    .normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
  return normalized.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").replace(/--+/g, "-");
}

// Приведення даних з API до ProductRow + нормалізація імен фото
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
    images: ordered.map(i => toBaseName(i.name)).filter(Boolean),
    inStock: true, brand: "", brandSite: "", size: "", color: "", year: "",
  };
};

export default function Product() {
  const token = useMemo(() => localStorage.getItem("token") ?? "", []);
  const navigate = useNavigate();
  const location = useLocation();

  const [showList, setShowList] = useState(false);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [imgVer, setImgVer] = useState(1); // кеш-бастинг зображень

  const [openProduct, setOpenProduct] = useState(false);
  const [editProduct, setEditProduct] = useState<ProductRow | null>(null);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [price, setPrice] = useState<number>(0);
  const [categoryId, setCategoryId] = useState<number>(0);
  const [description, setDescription] = useState("");
  const [existingImageNames, setExistingImageNames] = useState<string>(""); // CSV базових імен
  const [newFiles, setNewFiles] = useState<File[]>([]);

  const [inStock, setInStock] = useState(true);
  const [brand, setBrand] = useState("");
  const [brandSite, setBrandSite] = useState("");
  const [size, setSize] = useState("");
  const [color, setColor] = useState("");
  const [year, setYear] = useState<number | "">("");

  const [productIdInput, setProductIdInput] = useState<string>("");

  const [snack, setSnack] = useState<{open:boolean; msg:string; type:"success"|"error"}>(
    { open:false, msg:"", type:"success" }
  );

  const authHeadersOnlyAuth: Record<string, string> = {};
  if (token) authHeadersOnlyAuth.Authorization = `Bearer ${token}`;

  const [photoIndex, setPhotoIndex] = useState<Record<number, number>>({});
  const nextPhoto = (id: number, total: number) =>
    setPhotoIndex(prev => ({ ...prev, [id]: ((prev[id] ?? 0) + 1) % Math.max(1, total) }));
  const prevPhoto = (id: number, total: number) =>
    setPhotoIndex(prev => ({ ...prev, [id]: ((prev[id] ?? 0) - 1 + Math.max(1, total)) % Math.max(1, total) }));

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch(PRODUCTS_LIST);
      if (!res.ok) throw new Error("Не вдалося завантажити товари");
      const data = await res.json();
      const rows: ProductRow[] = Array.isArray(data) ? data.map(mapFromApi) : [];
      setProducts(rows);
    } catch (e:any) {
      setSnack({open:true, msg:e?.message ?? "Помилка завантаження", type:"error"});
    } finally { setLoading(false); }
  };
  useEffect(() => { fetchProducts(); /* eslint-disable-next-line */ }, []);

  const filteredProducts = products.filter(p => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return p.name.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q) || String(p.categoryId).includes(q);
  });

  const resetForm = () => {
    setName(""); setSlug(""); setPrice(0); setCategoryId(0); setDescription("");
    setExistingImageNames(""); setNewFiles([]);
    setInStock(true); setBrand(""); setBrandSite(""); setSize(""); setColor(""); setYear("");
  };

  const onOpenProduct = (p?: ProductRow) => {
    if (p) {
      setEditProduct(p);
      setName(p.name); setSlug(p.slug || slugify(p.name)); setPrice(p.price);
      setCategoryId(p.categoryId); setDescription(p.description ?? "");
      setExistingImageNames((p.images ?? []).map(toBaseName).join(",")); // тільки базові імена
      setNewFiles([]);
    } else { setEditProduct(null); resetForm(); }
    setOpenProduct(true);
  };

  const createProduct = async () => {
    if (!newFiles.length) throw new Error("Додайте хоча б одне фото");

    const fd = new FormData();
    fd.append("name", name.trim());
    fd.append("slug", (slug.trim() || slugify(name)));
    fd.append("price", String(price));
    fd.append("categoryId", String(categoryId));
    fd.append("description", description ?? "");
    for (const f of newFiles) fd.append("imageFiles", f); // ключ має бути саме imageFiles

    const res = await fetch(PRODUCT_CREATE, { method: "POST", headers: authHeadersOnlyAuth, body: fd });
    if (!res.ok) {
      let msg = "Не вдалося створити товар";
      try { const d = await res.json(); if (d?.message) msg = d.message; } catch {}
      throw new Error(msg);
    }
    await res.json().catch(() => null);
    await fetchProducts();
    setImgVer(v => v + 1);
  };

  const updateProduct = async (id: number) => {
    const keepNames = Array.from(new Set(
      existingImageNames
        .split(",")
        .map(s => toBaseName(s))
        .filter(Boolean)
    ));

    if (keepNames.length === 0 && newFiles.length === 0) {
      throw new Error("Має бути хоча б одне фото (залиште існуюче або додайте нове).");
    }

    const fd = new FormData();
    fd.append("id", String(id)); // ОБОВʼЯЗКОВО для PUT /api/Products/edit
    fd.append("name", name.trim());
    fd.append("slug", (slug.trim() || slugify(name)));
    fd.append("price", String(price));
    fd.append("categoryId", String(categoryId));
    fd.append("description", description ?? "");
    fd.append("keepImageNames", keepNames.join(",")); // список, що залишаємо у НОВОМУ порядку
    for (const f of newFiles) fd.append("imageFiles", f); // нові файли

    const res = await fetch(PRODUCT_EDIT, { method: "PUT", headers: authHeadersOnlyAuth, body: fd });
    if (!res.ok) {
      let msg = "Не вдалося оновити товар (перевірте фото)";
      try { const d = await res.json(); if (d?.message) msg = d.message; } catch {}
      throw new Error(msg);
    }
    await res.json().catch(() => null);
    await fetchProducts();
    setImgVer(v => v + 1);
  };

  const deleteProduct = async (id: number) => {
    const res = await fetch(PRODUCT_DELETE(id), { method:"DELETE", headers: authHeadersOnlyAuth });
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
    } catch (e:any) { setSnack({open:true, msg:e?.message ?? "Помилка збереження товару", type:"error"}); }
  };

  const onDeleteProductClick = async (p: ProductRow) => {
    if (!confirm(`Видалити товар "${p.name}"?`)) return;
    try { await deleteProduct(p.id); setProducts(prev => prev.filter(x => x.id !== p.id)); setSnack({open:true, msg:"Товар видалено", type:"success"}); }
    catch (e:any) { setSnack({open:true, msg:e?.message ?? "Помилка видалення товару", type:"error"}); }
  };

  const openEditById = async () => {
    const id = Number(productIdInput);
    if (!id) { setSnack({open:true, msg:"Вкажіть коректний ID", type:"error"}); return; }
    try {
      const res = await fetch(PRODUCT_GET_ID(id), { headers: authHeadersOnlyAuth });
      if (res.ok) {
        const one = mapFromApi(await res.json());
        setEditProduct(one);
        setName(one.name); setSlug(one.slug || slugify(one.name)); setPrice(one.price);
        setCategoryId(one.categoryId); setDescription(one.description ?? "");
        setExistingImageNames((one.images ?? []).map(toBaseName).join(","));
        setNewFiles([]); setOpenProduct(true); return;
      }
    } catch {}
    const inList = products.find(p => p.id === id);
    if (inList) { onOpenProduct(inList); return; }
    setEditProduct({ id, name:"", slug:"", price:0, categoryId:0, description:"", images:[], inStock:true, brand:"", brandSite:"", size:"", color:"", year:"" });
    setName(""); setSlug(""); setPrice(0); setCategoryId(0); setDescription(""); setExistingImageNames(""); setNewFiles([]); setOpenProduct(true);
  };
  const deleteById = async () => {
    const id = Number(productIdInput);
    if (!id) { setSnack({open:true, msg:"Вкажіть коректний ID", type:"error"}); return; }
    if (!confirm(`Видалити товар #${id}?`)) return;
    try { await deleteProduct(id); setSnack({open:true, msg:`Товар #${id} видалено`, type:"success"}); setProducts(prev => prev.filter(p => p.id !== id)); }
    catch (e:any) { setSnack({open:true, msg:e?.message ?? "Помилка видалення", type:"error"}); }
  };

  const logout = () => { localStorage.removeItem("token"); localStorage.removeItem("roles"); navigate("/login"); };

  const isActive = (path: string) => location.pathname.startsWith(path);
  const grad = (active: boolean) => active
    ? "linear-gradient(90deg, #0E5B8A 0%, #0FA6A6 100%)"
    : "linear-gradient(90deg, #023854 0%, #035B94 100%)";
  const btnSx = (active=false) => ({
    py: 1.5, borderRadius: 3, fontWeight: 700, fontSize: 16,
    background: grad(active), boxShadow: 4, color: "#fff",
    "&:hover": { opacity: 0.95, background: grad(active) }
  });
  const smallBtnSx = { borderRadius: 3, fontWeight: 700 };

  return (
    <Layout>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
        <Typography variant="h5" sx={{ mb: 2, fontWeight: "bold" }}>
          Кабінет адміністратора — товари
        </Typography>

        <Grid container spacing={2} sx={{ mb: 3 }} alignItems="center">
          <Grid item xs={12} md={4}>
            <Button fullWidth variant="contained" component={RouterLink} to="/admin" sx={btnSx(isActive("/admin"))}>
              Користувачі
            </Button>
          </Grid>
          <Grid item xs={12} md={4}>
            <Button fullWidth variant="contained" component={RouterLink} to="/product" sx={btnSx(isActive("/product"))}>
              Товари
            </Button>
          </Grid>
          <Grid item xs={12} md={4}>
            <Button fullWidth variant="contained" component={RouterLink} to="/categorie" sx={btnSx(isActive("/categorie"))}>
              Категорії
            </Button>
          </Grid>
          <Grid item xs={12} md="auto">
            <Button variant="outlined" startIcon={<LogoutIcon />} onClick={logout} sx={smallBtnSx}>Вийти</Button>
          </Grid>
          <Grid item xs={12} md="auto">
            <Button variant="outlined" onClick={() => setShowList(s => !s)} sx={smallBtnSx}>
              {showList ? "Сховати список" : "Показати список"}
            </Button>
          </Grid>
        </Grid>

        <Stack direction={{ xs: "column", md: "row" }} gap={2} alignItems="center" sx={{ mb: 2 }}>
          <TextField size="small" placeholder="Пошук (назва, slug або categoryId)"
            value={search} onChange={(e) => setSearch(e.target.value)} sx={{ flex: 1, minWidth: 260 }} />
          <Button
            variant="contained"
            onClick={() => { fetchProducts(); setImgVer(v => v + 1); }}
            disabled={loading}
            sx={btnSx()}
          >
            Оновити
          </Button>
          <Button variant="contained" onClick={() => onOpenProduct()} sx={btnSx(true)}>Додати товар</Button>
        </Stack>

        <Stack direction={{ xs: "column", md: "row" }} gap={1.5} alignItems="center" sx={{ mb: 2 }}>
          <TextField size="small" label="ID товару" type="number" value={productIdInput}
            onChange={(e)=>setProductIdInput(e.target.value)} sx={{ width: 200 }}
            InputProps={{ startAdornment: <InputAdornment position="start">#</InputAdornment> }} />
          <Button variant="contained" onClick={openEditById} startIcon={<EditIcon />} sx={btnSx()}>Редагувати за ID</Button>
          <Button variant="contained" color="error" onClick={deleteById} startIcon={<DeleteIcon />} sx={btnSx()}>
            Видалити за ID
          </Button>
        </Stack>

        {showList && (
          loading ? (
            <Box sx={{ display:"flex", justifyContent:"center", py:6 }}><CircularProgress /></Box>
          ) : (
            <Paper elevation={3} sx={{ borderRadius: 3, overflow: "hidden" }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Фото</TableCell>
                    <TableCell>ID</TableCell>
                    <TableCell>Назва</TableCell>
                    <TableCell>Slug</TableCell>
                    <TableCell>Ціна</TableCell>
                    <TableCell>Категорія (ID)</TableCell>
                    <TableCell align="right">Дії</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredProducts.map((p) => {
                    const total = p.images?.length ?? 0;
                    const idx = photoIndex[p.id] ?? 0;
                    const base = total > 0 ? p.images[idx] : null;
                    const src = base ? `${imgUrl(base, 200)}?v=${imgVer}` : "";
                    return (
                      <TableRow key={p.id}>
                        <TableCell>
                          {base ? (
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                              <IconButton size="small" onClick={() => prevPhoto(p.id, total)} disabled={total <= 1}><ChevronLeftIcon /></IconButton>
                              <img
                                src={src}
                                alt={p.name}
                                width={72}
                                height={72}
                                style={{ objectFit: "cover", borderRadius: 8, border: "1px solid #eee" }}
                                onError={(e) => {
                                  const img = e.currentTarget as HTMLImageElement;
                                  if (!img.dataset.fallbackTried) {
                                    img.dataset.fallbackTried = "1";
                                    img.src = `${imgUrl(base!, 0)}?v=${imgVer}`;
                                  } else {
                                    img.style.visibility = "hidden";
                                  }
                                }}
                              />
                              <IconButton size="small" onClick={() => nextPhoto(p.id, total)} disabled={total <= 1}><ChevronRightIcon /></IconButton>
                            </Box>
                          ) : "—"}
                        </TableCell>
                        <TableCell>{p.id}</TableCell>
                        <TableCell>{p.name}</TableCell>
                        <TableCell>{p.slug || "-"}</TableCell>
                        <TableCell>{p.price.toLocaleString()} грн</TableCell>
                        <TableCell>{p.categoryId}</TableCell>
                        <TableCell align="right">
                          <IconButton onClick={() => onOpenProduct(p)} title="Редагувати"><EditIcon /></IconButton>
                          <IconButton onClick={() => onDeleteProductClick(p)} title="Видалити" color="error"><DeleteIcon /></IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {filteredProducts.length === 0 && (
                    <TableRow><TableCell colSpan={7} align="center">Немає даних</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </Paper>
          )
        )}

        <Dialog open={openProduct} onClose={() => setOpenProduct(false)} maxWidth="sm" fullWidth>
          <DialogTitle>{editProduct ? "Редагувати товар" : "Додати товар"}</DialogTitle>
          <DialogContent sx={{ pt: 1 }}>
            <Stack gap={2} sx={{ mt: 1 }}>
              <TextField label="Назва (name)" value={name}
                onChange={(e)=>{ const v = e.target.value; setName(v); if (!editProduct || !slug || slug === slugify(name)) setSlug(slugify(v)); }}
                fullWidth />
              <TextField label="Slug" value={slug} onChange={(e)=>setSlug(slugify(e.target.value))} fullWidth />
              <TextField label="Ціна (грн) / price" type="number" value={price} onChange={(e)=>setPrice(Number(e.target.value))} fullWidth />
              <TextField label="Категорія (ID) / categoryId" type="number" value={categoryId} onChange={(e)=>setCategoryId(Number(e.target.value))} fullWidth />
              <TextField label="Опис (description)" value={description} onChange={(e)=>setDescription(e.target.value)} fullWidth multiline minRows={2} />

              <TextField
                label="Поточні фото (імена через кому; видаліть непотрібні або змініть порядок)"
                placeholder="abc.webp, def.webp"
                value={existingImageNames}
                onChange={(e)=>setExistingImageNames(e.target.value)}
                helperText="Важливо: тут тільки базові імена без префіксів (наприклад, abc.webp)"
                fullWidth
              />

              <Button variant="contained" component="label" sx={btnSx(true)}>
                Додати нові фото
                <input type="file" accept="image/*" hidden multiple onChange={(e)=> setNewFiles(Array.from(e.target.files ?? [])) } />
              </Button>
              {newFiles.length > 0 && (
                <Typography variant="body2" sx={{ color: "text.secondary", mt: -1 }}>
                  Вибрано нових фото: {newFiles.length}
                </Typography>
              )}

              <FormControlLabel control={<Checkbox checked={inStock} onChange={(e)=>setInStock(e.target.checked)} />} label="В наявності (фронт)" />
              <Stack direction={{ xs:"column", sm:"row" }} gap={2}>
                <TextField label="Виробник (фронт)" value={brand} onChange={(e)=>setBrand(e.target.value)} fullWidth/>
                <TextField label="Сайт виробника (фронт)" value={brandSite} onChange={(e)=>setBrandSite(e.target.value)} fullWidth/>
              </Stack>
              <Stack direction={{ xs:"column", sm:"row" }} gap={2}>
                <TextField label="Розмір (фронт)" value={size} onChange={(e)=>setSize(e.target.value)} fullWidth/>
                <TextField label="Колір (фронт)" value={color} onChange={(e)=>setColor(e.target.value)} fullWidth/>
                <TextField label="Рік (фронт)" type="number" value={year} onChange={(e)=>setYear(e.target.value ? Number(e.target.value) : "")} fullWidth/>
              </Stack>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenProduct(false)}>Скасувати</Button>
            <Button variant="contained" onClick={onSaveProduct} sx={btnSx(true)}>{editProduct ? "Зберегти" : "Додати"}</Button>
          </DialogActions>
        </Dialog>

        <Snackbar open={snack.open} autoHideDuration={2500} onClose={()=>setSnack(s=>({...s, open:false}))}>
          <Alert severity={snack.type} onClose={()=>setSnack(s=>({...s, open:false}))}>{snack.msg}</Alert>
        </Snackbar>
      </Container>
    </Layout>
  );
}
