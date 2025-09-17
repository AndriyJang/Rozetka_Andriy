// src/pages/Categorie.tsx
import Layout from "../components/Layout";
import { useEffect, useMemo, useState } from "react";
import {
  Container, Typography, Table, TableHead, TableRow, TableCell, TableBody,
  IconButton, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Stack, Snackbar, Alert, Box, CircularProgress, InputAdornment,
  Grid, Paper
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import LogoutIcon from "@mui/icons-material/Logout";
import { Link as RouterLink, useNavigate, useLocation } from "react-router-dom";

type CategoryRow = { id: number; name: string; slug?: string; image?: string };

// ——— API base (обрізаємо хвостові “/”, щоб не було подвійних “//”) ———
const RAW_API = import.meta.env.VITE_API_URL || "";
const API = RAW_API.replace(/\/+$/, "");
const IMAGES_BASE = `${API}/images`;

const CATEGORIES_BASE = `${API}/api/Categories`;
const CATEGORY_DELETE = (id: number) => `${API}/api/Categories/${id}`;

// ——— URL для картинок: очікуємо в БД лише "abc123.webp", а на диску є 0_/200_/800_ ———
const imgUrl = (name?: string, size: number = 200) =>
  name ? `${IMAGES_BASE}/${size}_${name}` : "";

// ——— парсери під різні регістри полів (щоб не ламалось від відмінностей DTO) ———
const pickId = (x: any): number | null => {
  const v = [x?.id, x?.Id, x?.categoryId, x?.CategoryId].find(v => v != null);
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};
const pickName = (x: any): string | null => {
  const v = [x?.name, x?.Name].find(v => typeof v === "string" && v.trim());
  return (v as string) ?? null;
};
const pickSlug = (x: any): string | undefined => {
  const v = [x?.slug, x?.Slug].find(v => typeof v === "string" && v.trim());
  return v as string | undefined;
};
const pickImage = (x: any): string | undefined => {
  const v = [x?.image, x?.Image].find(v => typeof v === "string" && v.trim());
  return v as string | undefined;
};
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

// ——— утиліта для slug ———
function slugify(input: string): string {
  const map: Record<string, string> = {
    "є":"ie","ї":"i","і":"i","ґ":"g","Є":"ie","Ї":"i","І":"i","Ґ":"g",
    "а":"a","б":"b","в":"v","г":"h","д":"d","е":"e","ё":"e","ж":"zh","з":"z","и":"i","й":"y","к":"k","л":"l","м":"m",
    "н":"n","о":"o","п":"p","р":"r","с":"s","т":"t","у":"u","ф":"f","х":"h","ц":"ts","ч":"ch","ш":"sh","щ":"shch",
    "ъ":"","ы":"y","ь":"","э":"e","ю":"yu","я":"ya","А":"a","Б":"b","В":"v","Г":"h","Д":"d","Е":"e","Ё":"e","Ж":"zh",
    "З":"z","И":"i","Й":"y","К":"k","Л":"l","М":"m","Н":"n","О":"o","П":"p","Р":"r","С":"s","Т":"t","У":"u","Ф":"f",
    "Х":"h","Ц":"ts","Ч":"ch","Ш":"sh","Щ":"shch","Ъ":"","Ы":"y","Ь":"","Э":"e","Ю":"yu","Я":"ya"
  };
  const normalized = input
    .split("")
    .map(ch => map[ch] ?? ch)
    .join("")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "");
  return normalized
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/--+/g, "-");
}

export default function Categorie() {
  const navigate = useNavigate();
  const location = useLocation();

  const token = useMemo(() => localStorage.getItem("token") ?? "", []);
  const authHeaders: Record<string, string> = {};
  if (token) authHeaders.Authorization = `Bearer ${token}`;

  const [showList, setShowList] = useState(false);
  const [rows, setRows] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [imgVer, setImgVer] = useState(1);

  const [openForm, setOpenForm] = useState(false);
  const [editItem, setEditItem] = useState<CategoryRow | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const [snack, setSnack] = useState<{open:boolean; msg:string; type:"success"|"error"}>({
    open:false, msg:"", type:"success"
  });

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await fetch(CATEGORIES_BASE, { headers: authHeaders });
      if (res.status === 401 || res.status === 403) {
        setSnack({open:true, msg:"Немає доступу до категорій.", type:"error"});
        setRows([]);
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

  useEffect(() => {
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = rows.filter(r => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      r.name.toLowerCase().includes(q) ||
      String(r.id).includes(q) ||
      (r.slug ?? "").toLowerCase().includes(q)
    );
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

  const buildCreateFD = (payload: { name: string; slug: string; file: File }) => {
    const fd = new FormData();
    fd.append("Name", payload.name.trim());
    fd.append("Slug", payload.slug.trim());
    fd.append("ImageFile", payload.file, payload.file.name);
    return fd;
  };

  const buildUpdateFD = (id: number, payload: { name: string; slug: string; file?: File | null }) => {
    const fd = new FormData();
    fd.append("Id", String(id));
    fd.append("Name", payload.name.trim());
    fd.append("Slug", payload.slug.trim());
    if (payload.file) fd.append("ImageFile", payload.file, payload.file.name);
    return fd;
  };

  const createCategory = async (payload: {name: string; slug: string; file: File}) => {
    const res = await fetch(CATEGORIES_BASE, {
      method:"POST",
      headers: authHeaders,
      body: buildCreateFD(payload)
    });
    if (!res.ok) {
      let msg = `Не вдалося створити категорію (HTTP ${res.status})`;
      try { const d = await res.json(); if (d?.message) msg = d.message; } catch {}
      throw new Error(msg);
    }
    return await res.json().catch(() => null);
  };

  const updateCategory = async (id:number, payload:{name: string; slug: string; file?: File | null}) => {
    const res = await fetch(CATEGORIES_BASE, {
      method:"PUT",
      headers: authHeaders,
      body: buildUpdateFD(id, payload)
    });
    if (!res.ok) {
      let msg = `Не вдалося оновити категорію (HTTP ${res.status})`;
      try { const d = await res.json(); if (d?.message) msg = d.message; } catch {}
      throw new Error(msg);
    }
    await res.json().catch(() => null);
  };

  const onSave = async () => {
    const nm = name.trim();
    const sg = (slug.trim() || slugify(nm));
    if (!nm) { setSnack({open:true, msg:"Введіть назву", type:"error"}); return; }

    try {
      if (editItem) {
        await updateCategory(editItem.id, { name: nm, slug: sg, file });
        await fetchCategories();
        setImgVer(v => v + 1); // кеш-брейкер для зображень
        setSnack({open:true, msg:"Категорію оновлено", type:"success"});
      } else {
        if (!file) { setSnack({ open:true, msg:"Додайте зображення (ImageFile)", type:"error" }); return; }
        await createCategory({ name: nm, slug: sg, file });
        await fetchCategories();
        setSnack({open:true, msg:"Категорію додано", type:"success"});
      }
      setOpenForm(false);
      setEditItem(null);
      setName("");
      setSlug("");
      setFile(null);
    } catch (e:any) {
      setSnack({open:true, msg:e?.message ?? "Помилка збереження", type:"error"});
    }
  };

  const onDeleteClick = async (row: CategoryRow) => {
    if (!confirm(`Видалити категорію "${row.name}"?`)) return;
    try {
      await fetch(CATEGORY_DELETE(row.id), { method:"DELETE", headers: authHeaders });
      await fetchCategories();
      setSnack({open:true, msg:"Категорію видалено", type:"success"});
    } catch (e:any) {
      setSnack({open:true, msg:e?.message ?? "Помилка видалення", type:"error"});
    }
  };

  // ——— швидкі дії за ID ———
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

  // ——— auth / меню ———
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("roles");
    navigate("/login");
  };
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
        {/* Заголовок */}
        <Typography variant="h5" sx={{ mb: 2, fontWeight: "bold" }}>
          Кабінет адміністратора — категорії
        </Typography>

        {/* Меню */}
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

        {/* Пошук / дії */}
        <Stack direction={{ xs:"column", md:"row" }} gap={2} alignItems="center" sx={{ mb: 2 }}>
          <TextField
            size="small"
            placeholder="Пошук (назва / slug / id)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ flex: 1, minWidth: 260 }}
          />
          <Button variant="contained" onClick={fetchCategories} disabled={loading} sx={btnSx()}>
            Оновити
          </Button>
          <Button variant="contained" onClick={() => onOpenForm()} sx={btnSx(true)}>
            Додати категорію
          </Button>
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
          <Button size="small" variant="contained" startIcon={<EditIcon />} onClick={onQuickEdit} sx={btnSx()}>
            Редагувати за ID
          </Button>
          <Button size="small" color="error" variant="contained" startIcon={<DeleteIcon />} onClick={onQuickDelete} sx={btnSx()}>
            Видалити за ID
          </Button>
        </Stack>

        {/* Таблиця */}
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
                    <TableCell align="right">Дії</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtered.map((r) => {
                    const src = r.image
                      ? `${imgUrl(r.image, 200)}?v=${imgVer}`
                      : "";

                    return (
                      <TableRow key={r.id}>
                        <TableCell>
                          {r.image ? (
                            <img
                              src={src}
                              alt={r.name}
                              width={56}
                              height={56}
                              style={{ objectFit:"cover", borderRadius:8, border:"1px solid #eee" }}
                              onError={(e) => {
                                const img = e.currentTarget as HTMLImageElement;
                                if (!img.dataset.fallbackTried) {
                                  img.dataset.fallbackTried = "1";
                                  img.src = `${imgUrl(r.image, 0)}?v=${imgVer}`; // fallback на оригінал 0_
                                } else {
                                  img.style.visibility = "hidden";
                                }
                              }}
                            />
                          ) : "—"}
                        </TableCell>

                        <TableCell>{r.id}</TableCell>
                        <TableCell>{r.name}</TableCell>
                        <TableCell>{r.slug ?? "-"}</TableCell>
                        <TableCell align="right">
                          <IconButton onClick={() => onOpenForm(r)} title="Редагувати"><EditIcon /></IconButton>
                          <IconButton onClick={() => onDeleteClick(r)} title="Видалити" color="error"><DeleteIcon /></IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} align="center">Немає даних</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Paper>
          )
        )}

        {/* Форма створення/редагування */}
        <Dialog open={openForm} onClose={() => setOpenForm(false)} maxWidth="sm" fullWidth>
          <DialogTitle>{editItem ? "Редагувати категорію" : "Додати категорію"}</DialogTitle>
          <DialogContent sx={{ pt: 1 }}>
            <Stack gap={2} sx={{ mt: 1 }}>
              <TextField
                label="Назва"
                value={name}
                onChange={(e)=> {
                  const v = e.target.value;
                  setName(v);
                  // якщо це нова категорія або slug порожній — оновлюємо автоматично
                  if (!editItem || !slug || slug === slugify(name)) setSlug(slugify(v));
                }}
                fullWidth
                autoFocus
              />
              <TextField
                label="Slug"
                value={slug}
                onChange={(e)=> setSlug(slugify(e.target.value))}
                fullWidth
              />
              <Button variant="contained" component="label" sx={btnSx(true)}>
                {file
                  ? `Зображення: ${file.name}`
                  : (editItem ? "Змінити зображення (опціонально)" : "Завантажити зображення (обов'язково)")}
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e)=> setFile(e.target.files?.[0] ?? null)}
                />
              </Button>

              {/* прев’ю вибраного файлу (не обов’язково) */}
              {file && (
                <img
                  src={URL.createObjectURL(file)}
                  alt="preview"
                  width={120}
                  height={120}
                  style={{ objectFit:"cover", borderRadius: 8, border: "1px solid #eee" }}
                />
              )}
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenForm(false)}>Скасувати</Button>
            <Button variant="contained" onClick={onSave} sx={btnSx(true)}>
              {editItem ? "Зберегти" : "Додати"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snack */}
        <Snackbar open={snack.open} autoHideDuration={3000} onClose={()=>setSnack(s=>({...s, open:false}))}>
          <Alert severity={snack.type} onClose={()=>setSnack(s=>({...s, open:false}))}>
            {snack.msg}
          </Alert>
        </Snackbar>
      </Container>
    </Layout>
  );
}
