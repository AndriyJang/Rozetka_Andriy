// src/pages/Categorie.tsx
import Layout from "../components/Layout";
import { useEffect, useMemo, useState } from "react";
import {
  Container, Typography, Table, TableHead, TableRow, TableCell, TableBody,
  IconButton, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Stack, Snackbar, Alert, Box, CircularProgress, Tabs, Tab
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { Link as RouterLink, useNavigate } from "react-router-dom";

type CategoryRow = {
  id: number;
  name: string;
};

const API = import.meta.env.VITE_API_URL;
// реальні ендпоінти бекенду (CRUD по категоріях вже є):
const CATEGORIES_LIST = `${API}/api/Categories`;                   // GET
const CATEGORY_CREATE = `${API}/api/Categories`;                    // POST
const CATEGORY_UPDATE = (id: number) => `${API}/api/Categories/${id}`; // PUT
const CATEGORY_DELETE = (id: number) => `${API}/api/Categories/${id}`; // DELETE

export default function Categorie() {
  const navigate = useNavigate();
  const token = useMemo(() => localStorage.getItem("token") ?? "", []);
  const [tab, setTab] = useState(2); // 0=Користувачі, 1=Товари, 2=Категорії (текуща)

  const [rows, setRows] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const [openForm, setOpenForm] = useState(false);
  const [editItem, setEditItem] = useState<CategoryRow | null>(null);
  const [name, setName] = useState("");

  const [snack, setSnack] = useState<{open:boolean; msg:string; type:"success"|"error"}>({
    open:false, msg:"", type:"success"
  });

  const authHeaders: Record<string, string> = {"Content-Type":"application/json"};
  if (token) authHeaders.Authorization = `Bearer ${token}`;

  // Навігація табами (зручно тримати однаковий UX зі сторінками users/products)
  useEffect(() => {
    if (tab === 0) navigate("/admin");
    if (tab === 1) navigate("/product");
    if (tab === 2) {/* вже тут */}
  }, [tab, navigate]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await fetch(CATEGORIES_LIST, { headers: authHeaders });
      if (res.status === 401 || res.status === 403) {
        setSnack({open:true, msg:"Немає доступу до категорій.", type:"error"});
        return;
      }
      if (!res.ok) throw new Error("Не вдалося завантажити категорії");
      const data = await res.json();
      const list: CategoryRow[] = Array.isArray(data) ? data.map((x:any)=>({ id:x.id, name:x.name })) : [];
      setRows(list);
    } catch (e:any) {
      setSnack({open:true, msg: e?.message ?? "Помилка завантаження", type:"error"});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCategories(); /* eslint-disable-next-line */ }, []);

  const filtered = rows.filter(r => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return r.name.toLowerCase().includes(q) || String(r.id).includes(q);
  });

  const onOpenForm = (row?: CategoryRow) => {
    if (row) { setEditItem(row); setName(row.name); }
    else     { setEditItem(null); setName(""); }
    setOpenForm(true);
  };

  const createCategory = async (payload: {name: string}) => {
    const res = await fetch(CATEGORY_CREATE, {
      method:"POST", headers: authHeaders, body: JSON.stringify(payload)
    });
    if (!res.ok) {
      let msg = "Не вдалося створити категорію";
      try { const d=await res.json(); if (d?.message) msg=d.message; } catch {}
      throw new Error(msg);
    }
    return await res.json(); // очікуємо {id, name}
  };

  const updateCategory = async (id:number, payload:{name: string}) => {
    const res = await fetch(CATEGORY_UPDATE(id), {
      method:"PUT", headers: authHeaders, body: JSON.stringify(payload)
    });
    if (!res.ok) {
      let msg = "Не вдалося оновити категорію";
      try { const d=await res.json(); if (d?.message) msg=d.message; } catch {}
      throw new Error(msg);
    }
    return await res.json();
  };

  const deleteCategory = async (id:number) => {
    const res = await fetch(CATEGORY_DELETE(id), { method:"DELETE", headers: authHeaders });
    if (!res.ok) {
      let msg = "Не вдалося видалити категорію";
      try { const d=await res.json(); if (d?.message) msg=d.message; } catch {}
      throw new Error(msg);
    }
  };

  const onSave = async () => {
    if (!name.trim()) { setSnack({open:true, msg:"Введіть назву", type:"error"}); return; }
    try {
      if (editItem) {
        const updated = await updateCategory(editItem.id, { name: name.trim() });
        setRows(prev => prev.map(r => r.id === editItem.id ? updated : r));
        setSnack({open:true, msg:"Категорію оновлено", type:"success"});
      } else {
        const created = await createCategory({ name: name.trim() });
        setRows(prev => [...prev, created]);
        setSnack({open:true, msg:"Категорію додано", type:"success"});
      }
      setOpenForm(false); setEditItem(null); setName("");
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

  // Швидкі дії за ID (без таблиці)
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

  return (
    <Layout>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
        <Typography variant="h5" sx={{ mb: 2, fontWeight: "bold" }}>
          Кабінет адміністратора — категорії
        </Typography>

        {/* верхні кнопки-перемикачі */}
        <Tabs value={tab} onChange={(_,v)=>setTab(v)} sx={{ mb: 2 }}>
          <Tab label="Користувачі" component={RouterLink} to="/admin" />
          <Tab label="Товари"     component={RouterLink} to="/product" />
          <Tab label="Категорії"  />
        </Tabs>

        <Stack direction={{ xs:"column", md:"row" }} gap={2} alignItems="center" sx={{ mb: 2 }}>
          <TextField
            size="small"
            placeholder="Пошук категорій (назва / id)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ flex: 1, minWidth: 260 }}
          />
          <Button variant="outlined" onClick={fetchCategories} disabled={loading}>Оновити</Button>
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
          />
          <Button size="small" variant="outlined" startIcon={<EditIcon />} onClick={onQuickEdit}>
            Редагувати за ID
          </Button>
          <Button size="small" color="error" variant="outlined" startIcon={<DeleteIcon />} onClick={onQuickDelete}>
            Видалити за ID
          </Button>
        </Stack>

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
                <TableCell align="right">Дії</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{r.id}</TableCell>
                  <TableCell>{r.name}</TableCell>
                  <TableCell align="right">
                    <IconButton onClick={() => onOpenForm(r)} title="Редагувати"><EditIcon /></IconButton>
                    <IconButton onClick={() => onDeleteClick(r)} title="Видалити" color="error"><DeleteIcon /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} align="center">Немає даних</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}

        {/* модалка додати/редагувати */}
        <Dialog open={openForm} onClose={() => setOpenForm(false)} maxWidth="xs" fullWidth>
          <DialogTitle>{editItem ? "Редагувати категорію" : "Додати категорію"}</DialogTitle>
          <DialogContent sx={{ pt: 1 }}>
            <TextField
              label="Назва категорії"
              value={name}
              onChange={(e)=>setName(e.target.value)}
              fullWidth
              autoFocus
              sx={{ mt: 1 }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenForm(false)}>Скасувати</Button>
            <Button variant="contained" onClick={onSave}>{editItem ? "Зберегти" : "Додати"}</Button>
          </DialogActions>
        </Dialog>

        <Snackbar open={snack.open} autoHideDuration={2500} onClose={()=>setSnack(s=>({...s, open:false}))}>
          <Alert severity={snack.type} onClose={()=>setSnack(s=>({...s, open:false}))}>
            {snack.msg}
          </Alert>
        </Snackbar>
      </Container>
    </Layout>
  );
}
