import Layout from "../components/Layout";
import { useEffect, useMemo, useState } from "react";
import {
  Container, Typography, Table, TableHead, TableRow, TableCell, TableBody,
  IconButton, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Stack, Snackbar, Alert, Box, CircularProgress, Tabs, Tab, InputAdornment, Paper
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import LogoutIcon from "@mui/icons-material/Logout";
import { Link as RouterLink, useNavigate } from "react-router-dom";

type CategoryRow = { id: number; name: string; slug?: string; image?: string; };

const API = import.meta.env.VITE_API_URL;

// Бекенд: GET/POST/PUT на базовий, DELETE з /{id}
const CATEGORIES_BASE = `${API}/api/Categories`;
const CATEGORY_DELETE = (id: number) => `${API}/api/Categories/${id}`;

// ---- helpers ----
function pickId(x: any): number | null {
  const v = [x?.id, x?.Id, x?.categoryId, x?.CategoryId].find(v => v != null);
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
function pickName(x: any): string | null {
  const v = [x?.name, x?.Name].find(v => typeof v === "string" && v.trim());
  return (v as string) ?? null;
}
function pickSlug(x: any): string | undefined {
  const v = [x?.slug, x?.Slug].find(v => typeof v === "string" && v.trim());
  return v as string | undefined;
}
function pickImage(x: any): string | undefined {
  const v = [x?.image, x?.Image].find(v => typeof v === "string");
  return v as string | undefined;
}
function parseCategories(data: any): CategoryRow[] {
  if (!Array.isArray(data)) return [];
  return data
    .map((x) => {
      const id = pickId(x);
      const name = pickName(x);
      if (id == null || name == null) return null;
      return { id, name, slug: pickSlug(x), image: pickImage(x) };
    })
    .filter(Boolean) as CategoryRow[];
}

// ---- slugify (UA/RU) ----
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

export default function Categorie() {
  const navigate = useNavigate();
  const token = useMemo(() => localStorage.getItem("token") ?? "", []);
  const [tab, setTab] = useState(2);

  const [rows, setRows] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  // список за замовчуванням приховано
  const [showList, setShowList] = useState(false);

  // форма create/edit
  const [openForm, setOpenForm] = useState(false);
  const [editItem, setEditItem] = useState<CategoryRow | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const [snack, setSnack] = useState<{open:boolean; msg:string; type:"success"|"error"}>({
    open:false, msg:"", type:"success"
  });

  // Лише Authorization (НЕ ставимо вручну Content-Type)
  const authHeaders: Record<string, string> = {};
  if (token) authHeaders.Authorization = `Bearer ${token}`;

  // Навігація табами
  useEffect(() => {
    if (tab === 0) navigate("/admin");
    if (tab === 1) navigate("/product");
  }, [tab, navigate]);

  // ====== CRUD ======
  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await fetch(CATEGORIES_BASE, { headers: authHeaders });
      if (res.status === 401 || res.status === 403) {
        setSnack({open:true, msg:"Немає доступу до категорій.", type:"error"});
        return;
      }
      if (!res.ok) throw new Error(`Не вдалося завантажити категорії (HTTP ${res.status})`);
      const data = await res.json().catch(() => []);
      setRows(parseCategories(data));
    } catch (e: any) {
      setSnack({open:true, msg: e?.message ?? "Помилка завантаження", type:"error"});
    } finally {
      setLoading(false);
    }
  };

  const toggleList = async () => {
    const next = !showList;
    setShowList(next);
    if (next && rows.length === 0) await fetchCategories();
  };

  const filtered = rows.filter(r => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return r.name.toLowerCase().includes(q) || String(r.id).includes(q) || (r.slug ?? "").includes(q);
  });

  const onOpenForm = (row?: CategoryRow) => {
    if (row) {
      setEditItem(row);
      setName(row.name);
      setSlug(row.slug ?? slugify(row.name));
      setFile(null);
    } else {
      setEditItem(null);
      setName("");
      setSlug("");
      setFile(null);
    }
    setOpenForm(true);
  };

  // --- Формуємо рівно ті поля, які очікує бекенд: Name, Slug, (ImageFile), Id для PUT ---
  function buildCreateFormData(payload: { name: string; slug: string; file: File }) {
    const fd = new FormData();
    fd.append("Name", payload.name.trim());
    fd.append("Slug", payload.slug.trim());
    fd.append("ImageFile", payload.file, payload.file.name);
    return fd;
  }

  function buildUpdateFormData(id: number, payload: { name: string; slug: string; file?: File | null }) {
    const fd = new FormData();
    fd.append("Id", String(id));
    fd.append("Name", payload.name.trim());
    fd.append("Slug", payload.slug.trim());
    if (payload.file) fd.append("ImageFile", payload.file, payload.file.name);
    return fd;
  }

  const createCategory = async (payload: {name: string; slug: string; file: File}) => {
    const fd = buildCreateFormData(payload);
    const res = await fetch(CATEGORIES_BASE, { method:"POST", headers: authHeaders, body: fd });
    if (!res.ok) {
      let msg = `Не вдалося створити категорію (HTTP ${res.status})`;
      try { const d = await res.json(); if (d?.message) msg = d.message; } catch {}
      throw new Error(msg);
    }
    const created = await res.json().catch(() => null);
    if (created) {
      const id = pickId(created);
      const nm = pickName(created);
      const sg = pickSlug(created);
      const im = pickImage(created);
      if (id != null && nm != null) return { id, name: nm, slug: sg, image: im } as CategoryRow;
    }
    return null;
  };

  const updateCategory = async (id:number, payload:{name: string; slug: string; file?: File | null}) => {
    const fd = buildUpdateFormData(id, payload);
    const res = await fetch(CATEGORIES_BASE, { method:"PUT", headers: authHeaders, body: fd });
    if (!res.ok) {
      let msg = `Не вдалося оновити категорію (HTTP ${res.status})`;
      try { const d = await res.json(); if (d?.message) msg = d.message; } catch {}
      throw new Error(msg);
    }
    await res.json().catch(() => null);
  };

  const deleteCategory = async (id:number) => {
    const res = await fetch(CATEGORY_DELETE(id), { method:"DELETE", headers: authHeaders });
    if (!res.ok) {
      let msg = `Не вдалося видалити категорію (HTTP ${res.status})`;
      try { const d = await res.json(); if (d?.message) msg = d.message; } catch {}
      throw new Error(msg);
    }
  };

  const onSave = async () => {
    const nm = name.trim();
    const sg = (slug.trim() || slugify(nm));
    if (!nm) { setSnack({open:true, msg:"Введіть назву", type:"error"}); return; }

    try {
      if (editItem) {
        await updateCategory(editItem.id, { name: nm, slug: sg, file });
        await fetchCategories();
        setSnack({open:true, msg:"Категорію оновлено", type:"success"});
      } else {
        if (!file) { setSnack({ open:true, msg:"Додайте зображення (ImageFile) для категорії", type:"error" }); return; }
        const created = await createCategory({ name: nm, slug: sg, file });
        if (created) setRows(prev => [...prev, created]); else await fetchCategories();
        setSnack({open:true, msg:"Категорію додано", type:"success"});
      }
      setOpenForm(false); setEditItem(null);
      setName(""); setSlug(""); setFile(null);
    } catch (e:any) {
      setSnack({open:true, msg:e?.message ?? "Помилка збереження", type:"error"});
    }
  };

  const onDeleteClick = async (row: CategoryRow) => {
    if (!confirm(`Видалити категорію "${row.name}"?`)) return;
    try {
      await deleteCategory(row.id);
      setRows(prev => prev.filter(x => x.id !== row.id));
      setSnack({open:true, msg:"Категорію видалено", type:"success"});
    } catch (e:any) {
      setSnack({open:true, msg:e?.message ?? "Помилка видалення", type:"error"});
    }
  };

  // Швидкі дії за ID
  const [quickId, setQuickId] = useState<number | "">("");
  const onQuickEdit = () => {
    if (quickId === "") return;
    const row = rows.find(r => r.id === Number(quickId));
    if (!row) { setSnack({open:true, msg:"Категорію не знайдено", type:"error"}); return; }
    onOpenForm(row);
  };
  const onQuickDelete = async () => {
    if (quickId === "") return;
    const row = rows.find(r => r.id === Number(quickId));
    if (!row) { setSnack({open:true, msg:"Категорію не знайдено", type:"error"}); return; }
    await onDeleteClick(row);
  };

  const onLogout = () => { localStorage.removeItem("token"); localStorage.removeItem("roles"); navigate("/login"); };

  return (
    <Layout>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
          <Typography variant="h5" sx={{ fontWeight: "bold" }}>
            Кабінет адміністратора — категорії
          </Typography>
          <Button variant="text" onClick={onLogout} startIcon={<LogoutIcon />}>Вийти</Button>
        </Stack>

        <Tabs value={tab} onChange={(_,v)=>setTab(v)} sx={{ mb: 2 }}>
          <Tab label="Користувачі" component={RouterLink} to="/admin" />
          <Tab label="Товари"     component={RouterLink} to="/product" />
          <Tab label="Категорії"  />
        </Tabs>

        <Stack direction={{ xs:"column", md:"row" }} gap={2} alignItems="center" sx={{ mb: 2 }}>
          <TextField
            size="small"
            placeholder="Пошук (назва / slug / id)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ flex: 1, minWidth: 260 }}
          />
          <Button variant="outlined" onClick={fetchCategories} disabled={loading}>Оновити</Button>
          <Button variant="outlined" onClick={toggleList}>{showList ? "Сховати список" : "Показати список"}</Button>
          <Button variant="contained" onClick={() => onOpenForm()}>Додати категорію</Button>
        </Stack>

        {/* Швидкі дії за ID */}
        <Stack direction={{ xs:"column", md:"row" }} gap={1.5} alignItems="center" sx={{ mb: 2 }}>
          <TextField
            size="small"
            label="ID категорії"
            type="number"
            value={quickId}
            onChange={(e)=> setQuickId(e.target.value ? Number(e.target.value) : "")}
            sx={{ width: 200 }}
            InputProps={{ startAdornment: <InputAdornment position="start">#</InputAdornment> }}
          />
          <Button size="small" variant="outlined" startIcon={<EditIcon />} onClick={onQuickEdit}>
            Редагувати за ID
          </Button>
          <Button size="small" color="error" variant="outlined" startIcon={<DeleteIcon />} onClick={onQuickDelete}>
            Видалити за ID
          </Button>
        </Stack>

        {showList && (
          loading ? (
            <Box sx={{ display:"flex", justifyContent:"center", py:6 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Paper elevation={3} sx={{ borderRadius: 3, overflow: "hidden" }}>
              <Table sx={{ "& .MuiTableCell-root": { borderBottom: theme => `1px solid ${theme.palette.divider}` } }}>
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Назва</TableCell>
                    <TableCell>Slug</TableCell>
                    <TableCell align="right">Дії</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtered.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>{r.id}</TableCell>
                      <TableCell>{r.name}</TableCell>
                      <TableCell>{r.slug ?? "-"}</TableCell>
                      <TableCell align="right">
                        <IconButton onClick={() => onOpenForm(r)} title="Редагувати"><EditIcon /></IconButton>
                        <IconButton onClick={() => onDeleteClick(r)} title="Видалити" color="error"><DeleteIcon /></IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} align="center">Немає даних</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Paper>
          )
        )}

        {/* модалка додати/редагувати */}
        <Dialog open={openForm} onClose={() => setOpenForm(false)} maxWidth="sm" fullWidth>
          <DialogTitle>{editItem ? "Редагувати категорію" : "Додати категорію"}</DialogTitle>
          <DialogContent sx={{ pt: 1 }}>
            <Stack gap={2} sx={{ mt: 1 }}>
              <TextField
                label="Назва категорії"
                value={name}
                onChange={(e)=>{
                  const val = e.target.value;
                  setName(val);
                  if (!editItem || slug === "" || slug === slugify(name)) {
                    setSlug(slugify(val));
                  }
                }}
                fullWidth
                autoFocus
              />
              <TextField
                label="Slug"
                value={slug}
                onChange={(e)=>setSlug(slugify(e.target.value))}
                fullWidth
                helperText="URL-ідентифікатор. Генерується автоматично, можна підправити."
              />
              <Button variant="outlined" component="label">
                {file ? `Зображення: ${file.name}` : (editItem ? "Змінити зображення (опціонально)" : "Завантажити зображення (обов'язково)")}
                <input type="file" accept="image/*" hidden onChange={(e)=> setFile(e.target.files?.[0] ?? null)} />
              </Button>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenForm(false)}>Скасувати</Button>
            <Button variant="contained" onClick={onSave}>{editItem ? "Зберегти" : "Додати"}</Button>
          </DialogActions>
        </Dialog>

        <Snackbar open={snack.open} autoHideDuration={3000} onClose={()=>setSnack(s=>({...s, open:false}))}>
          <Alert severity={snack.type} onClose={()=>setSnack(s=>({...s, open:false}))}>{snack.msg}</Alert>
        </Snackbar>
      </Container>
    </Layout>
  );
}
