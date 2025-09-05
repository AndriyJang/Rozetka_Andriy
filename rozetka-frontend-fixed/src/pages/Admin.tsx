import Layout from "../components/Layout";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container, Typography, Table, TableHead, TableRow, TableCell, TableBody,
  IconButton, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  Select, MenuItem, FormControl, InputLabel, Snackbar, Alert, Box,
  CircularProgress, Tabs, Tab, TextField, FormControlLabel, Checkbox, Stack, Chip
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import BlockIcon from "@mui/icons-material/Block";
import AddIcon from "@mui/icons-material/Add";

type UserRow = {
  id: number;
  email: string;
  firstName?: string;
  phoneNumber?: string;
  dateCreated?: string;
  roles: string[];
  bannedUntil?: string | null;
};

type ProductRow = {
  id: number;
  title: string;
  price: number;
  inStock: boolean;
  brand?: string;
  brandSite?: string;
  size?: string;
  color?: string;
  year?: number | "";
  images: string[];
};

const API = import.meta.env.VITE_API_URL;

// ==== ENDPOINTS ДЛЯ ТОВАРІВ (тимчасові — згодом підлаштуєш) ====
const PRODUCTS_LIST   = `${API}/api/Products`;               // GET
const PRODUCT_CREATE  = `${API}/api/Products`;               // POST
const PRODUCT_UPDATE  = (id: number) => `${API}/api/Products/${id}`; // PUT
const PRODUCT_DELETE  = (id: number) => `${API}/api/Products/${id}`; // DELETE

// простий декодер JWT
function decodeJwt<T = any>(token: string): T | null {
  try {
    const [, payload] = token.split(".");
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(json);
  } catch {
    return null;
  }  
}

export default function Admin() {
  const navigate = useNavigate();
  const token = useMemo(() => localStorage.getItem("token") ?? "", []);
  const [tab, setTab] = useState<0 | 1>(0); // 0 - Users, 1 - Products

  // ===== Users =====
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [showUsersTable, setShowUsersTable] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  // Edit role
  const [openEdit, setOpenEdit] = useState(false);
  const [editUser, setEditUser] = useState<UserRow | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>("User");

  // Ban (front-only mock)
  const [openBan, setOpenBan] = useState(false);
  const [banUser, setBanUser] = useState<UserRow | null>(null);
  const [banOption, setBanOption] = useState<"1d"|"7d"|"30d"|"forever"|"until">("7d");
  const [banDate, setBanDate] = useState<string>("");

  // ===== Products =====
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [showProductsTable, setShowProductsTable] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);

  const [openProduct, setOpenProduct] = useState(false);
  const [editProduct, setEditProduct] = useState<ProductRow | null>(null);
  const [productForm, setProductForm] = useState<ProductRow>({
    id: 0, title: "", price: 0, inStock: true, brand: "", brandSite: "", size: "", color: "", year: "", images: []
  });

  // notify
  const [snack, setSnack] = useState<{open: boolean; msg: string; type:"success"|"error"}>({
    open:false, msg:"", type:"success"
  });

  // headers
  const authHeaders: Record<string, string> = {"Content-Type":"application/json"};
  if (token) authHeaders.Authorization = `Bearer ${token}`;

  // ===== Guard (залишив закоментованим) =====
  /*
  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    const payload = decodeJwt<{ roles?: string | string[] }>(token);
    const rolesArr = Array.isArray(payload?.roles)
      ? payload?.roles
      : payload?.roles ? [payload.roles] : [];
    if (!rolesArr.includes("Admin")) {
      navigate("/product-search");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);
  */

  // ===== Users fetch =====
  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const res = await fetch(`${API}/api/Users/all`, { headers: authHeaders });
      if (res.status === 401 || res.status === 403) {
        setSnack({open:true, msg:"Немає доступу. Увійдіть як адміністратор.", type:"error"});
        return;
      }
      if (!res.ok) throw new Error("Не вдалося завантажити користувачів");
      const data = await res.json();
      setUsers(data);
    } catch (e:any) {
      setSnack({open:true, msg:e?.message ?? "Помилка завантаження", type:"error"});
    } finally {
      setLoadingUsers(false);
    }
  };

  // ===== Products API =====
  const mapFromApi = (x: any): ProductRow => ({
    id: x.id,
    title: x.title ?? x.name ?? "",
    price: Number(x.price ?? 0),
    inStock: Boolean(x.inStock ?? x.available ?? true),
    brand: x.brand ?? "",
    brandSite: x.brandSite ?? x.manufacturerSite ?? "",
    size: x.size ?? "",
    color: x.color ?? "",
    year: (x.year ?? "") as number | "",
    images: Array.isArray(x.images) ? x.images : (x.images ? String(x.images).split(",").map((s:string)=>s.trim()) : [])
  });

  const mapToApi = (p: ProductRow) => ({
    id: p.id,
    title: p.title,
    price: p.price,
    inStock: p.inStock,
    brand: p.brand,
    brandSite: p.brandSite,
    size: p.size,
    color: p.color,
    year: p.year || null,
    images: p.images
  });

  const fetchProducts = async () => {
    try {
      setLoadingProducts(true);
      const res = await fetch(PRODUCTS_LIST, { headers: authHeaders });
      if (res.status === 401 || res.status === 403) {
        setSnack({open:true, msg:"Немає доступу до товарів", type:"error"});
        return;
      }
      if (!res.ok) throw new Error("Не вдалося завантажити товари");
      const data = await res.json();
      const rows: ProductRow[] = Array.isArray(data) ? data.map(mapFromApi) : [];
      setProducts(rows);
    } catch (e:any) {
      setSnack({open:true, msg:e?.message ?? "Помилка завантаження товарів", type:"error"});
    } finally {
      setLoadingProducts(false);
    }
  };

  const createProduct = async (payload: ProductRow) => {
    const res = await fetch(PRODUCT_CREATE, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify(mapToApi(payload)),
    });
    if (!res.ok) {
      let msg = "Не вдалося створити товар";
      try { const d=await res.json(); if (d?.message) msg=d.message; } catch {}
      throw new Error(msg);
    }
    const created = mapFromApi(await res.json());
    return created;
  };

  const updateProduct = async (id: number, payload: ProductRow) => {
    const res = await fetch(PRODUCT_UPDATE(id), {
      method: "PUT",
      headers: authHeaders,
      body: JSON.stringify(mapToApi(payload)),
    });
    if (!res.ok) {
      let msg = "Не вдалося оновити товар";
      try { const d=await res.json(); if (d?.message) msg=d.message; } catch {}
      throw new Error(msg);
    }
    const updated = mapFromApi(await res.json());
    return updated;
  };

  const deleteProduct = async (id: number) => {
    const res = await fetch(PRODUCT_DELETE(id), { method: "DELETE", headers: authHeaders });
    if (!res.ok) {
      let msg = "Не вдалося видалити товар";
      try { const d=await res.json(); if (d?.message) msg=d.message; } catch {}
      throw new Error(msg);
    }
  };

  // ===== Таб «Користувачі»: завантаження по кнопці =====
  const handleUsersListClick = async () => {
    if (!showUsersTable) {
      await fetchUsers();
    }
    setShowUsersTable(v => !v);
  };

  // ===== Таб «Товари»: завантаження по кнопці =====
  const handleProductsListClick = async () => {
    if (!showProductsTable) {
      await fetchProducts();
    }
    setShowProductsTable(v => !v);
  };

  // ===== Users: role edit =====
  const onOpenEdit = (u?: UserRow) => {
    const target = u ?? users.find(x => x.id === selectedUserId) ?? null;
    if (!target) {
      setSnack({open:true, msg:"Оберіть користувача", type:"error"});
      return;
    }
    setEditUser(target);
    setSelectedRole(target.roles?.[0] ?? "User");
    setOpenEdit(true);
  };

  const onSaveRole = async () => {
    if (!editUser) return;
    try {
      const res = await fetch(`${API}/api/Users/${editUser.id}/role`, {
        method: "PUT",
        headers: authHeaders,
        body: JSON.stringify({ role: selectedRole })
      });
      if (!res.ok) {
        let msg = "Не вдалося оновити роль";
        try { const d=await res.json(); if (d?.message) msg=d.message; } catch {}
        throw new Error(msg);
      }
      setSnack({open:true, msg:"Роль оновлено", type:"success"});
      setOpenEdit(false);
      setEditUser(null);
      await fetchUsers();
    } catch (e:any) {
      setSnack({open:true, msg:e?.message ?? "Помилка оновлення", type:"error"});
    }
  };

  // ===== Users: delete =====
  const onDeleteUser = async (u?: UserRow) => {
    const target = u ?? users.find(x => x.id === selectedUserId) ?? null;
    if (!target) {
      setSnack({open:true, msg:"Оберіть користувача", type:"error"});
      return;
    }
    if (!confirm(`Видалити користувача ${target.email}?`)) return;
    try {
      const res = await fetch(`${API}/api/Users/${target.id}`, {
        method: "DELETE",
        headers: authHeaders
      });
      if (!res.ok) {
        let msg = "Не вдалося видалити";
        try { const d=await res.json(); if (d?.message) msg=d.message; } catch {}
        throw new Error(msg);
      }
      setSnack({open:true, msg:"Користувача видалено", type:"success"});
      setUsers(prev => prev.filter((x: UserRow) => x.id !== target.id));
      setSelectedUserId(null);
    } catch (e:any) {
      setSnack({open:true, msg:e?.message ?? "Помилка видалення", type:"error"});
    }
  };

  // ===== Users: ban (front-only mock) =====
  const onOpenBan = (u?: UserRow) => {
    const target = u ?? users.find(x => x.id === selectedUserId) ?? null;
    if (!target) {
      setSnack({open:true, msg:"Оберіть користувача", type:"error"});
      return;
    }
    setBanUser(target);
    setBanOption("7d");
    setBanDate("");
    setOpenBan(true);
  };

  const calcBanUntil = (): string | null => {
    if (banOption === "forever") return "9999-12-31";
    if (banOption === "until") return banDate || null;
    const days = banOption === "1d" ? 1 : banOption === "7d" ? 7 : 30;
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0,10);
  };

  const onSaveBan = () => {
    if (!banUser) return;
    const until = calcBanUntil();
    setUsers(prev => prev.map((u) => u.id === banUser.id ? {...u, bannedUntil: until} : u));
    setSnack({open:true, msg: until ? `Забанено до ${until}` : "Бан знято", type:"success"});
    setOpenBan(false);
    setBanUser(null);
  };

  // ===== Products UI helpers =====
  const onOpenProduct = (p?: ProductRow) => {
    if (p) {
      setEditProduct(p);
      setProductForm({...p});
    } else {
      // якщо виклик без аргументу — беремо виділений
      const selected = products.find(x => x.id === selectedProductId) ?? null;
      if (selected) {
        setEditProduct(selected);
        setProductForm({...selected});
      } else {
        setEditProduct(null);
        setProductForm({
          id: 0, title: "", price: 0, inStock: true, brand: "", brandSite: "",
          size: "", color: "", year: "", images: []
        });
      }
    }
    setOpenProduct(true);
  };

  const onSaveProduct = async () => {
    const f = productForm;
    if (!f.title || f.price < 0) {
      setSnack({open:true, msg:"Перевірте назву та ціну", type:"error"});
      return;
    }
    try {
      if (editProduct) {
        const updated = await updateProduct(editProduct.id, f);
        setProducts(prev => prev.map(p => p.id === editProduct.id ? updated : p));
        setSnack({open:true, msg:"Товар оновлено", type:"success"});
      } else {
        const created = await createProduct(f);
        setProducts(prev => [...prev, created]);
        setSnack({open:true, msg:"Товар додано", type:"success"});
      }
      setOpenProduct(false);
      setEditProduct(null);
    } catch (e:any) {
      setSnack({open:true, msg:e?.message ?? "Помилка збереження товару", type:"error"});
    }
  };

  const onDeleteProductClick = async (p?: ProductRow) => {
    const target = p ?? products.find(x => x.id === selectedProductId) ?? null;
    if (!target) {
      setSnack({open:true, msg:"Оберіть товар", type:"error"});
      return;
    }
    if (!confirm(`Видалити товар "${target.title}"?`)) return;
    try {
      await deleteProduct(target.id);
      setProducts(prev => prev.filter(x => x.id !== target.id));
      setSelectedProductId(null);
      setSnack({open:true, msg:"Товар видалено", type:"success"});
    } catch (e:any) {
      setSnack({open:true, msg:e?.message ?? "Помилка видалення товару", type:"error"});
    }
  };

  // ===== Filters =====
  const filteredUsers = users.filter(u => {
    const q = userSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      (u.email || "").toLowerCase().includes(q) ||
      (u.firstName || "").toLowerCase().includes(q) ||
      (u.phoneNumber || "").toLowerCase().includes(q) ||
      (u.roles?.join(", ") || "").toLowerCase().includes(q)
    );
  });

  const filteredProducts = products.filter(p => {
    const q = productSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      p.title.toLowerCase().includes(q) ||
      (p.brand || "").toLowerCase().includes(q) ||
      (p.color || "").toLowerCase().includes(q) ||
      String(p.year || "").includes(q)
    );
  });

  // ===== Render =====
  return (
    <Layout>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
        <Typography variant="h5" sx={{ mb: 2, fontWeight: "bold" }}>
          Кабінет адміністратора
        </Typography>

        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
          <Tab label="Користувачі" />
          <Tab label="Товари" />
        </Tabs>

        {/* ===== Users panel ===== */}
        {tab === 0 && (
          <>
            {/* Пошук над меню */}
            <Stack direction={{ xs: "column", sm: "row" }} gap={2} alignItems="center" sx={{ mb: 2 }}>
              <TextField
                size="small"
                placeholder="Пошук (email, ім'я, телефон, роль)"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                sx={{ flex: 1, minWidth: 260 }}
              />
            </Stack>

            {/* Меню дій для користувачів */}
            <Stack direction={{ xs:"column", sm:"row" }} gap={1.5} sx={{ mb: 2 }}>
              <Button variant={showUsersTable ? "outlined" : "contained"} onClick={handleUsersListClick}>
                {showUsersTable ? "Сховати список користувачів" : "Показати список користувачів"}
              </Button>
              <Button onClick={() => onOpenEdit()} startIcon={<EditIcon />} disabled={!selectedUserId}>
                Редагувати роль
              </Button>
              <Button onClick={() => onOpenBan()} startIcon={<BlockIcon />} disabled={!selectedUserId}>
                Забанити / Зняти бан
              </Button>
              <Button onClick={() => onDeleteUser()} color="error" startIcon={<DeleteIcon />} disabled={!selectedUserId}>
                Видалити
              </Button>
            </Stack>

            {!showUsersTable ? null : loadingUsers ? (
              <Box sx={{ display:"flex", justifyContent:"center", py:6 }}>
                <CircularProgress />
              </Box>
            ) : (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Ім&apos;я</TableCell>
                    <TableCell>Телефон</TableCell>
                    <TableCell>Ролі</TableCell>
                    <TableCell>Бан</TableCell>
                    <TableCell align="right">Дії</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredUsers.map((u) => {
                    const selected = u.id === selectedUserId;
                    return (
                      <TableRow
                        key={u.id}
                        hover
                        selected={selected}
                        onClick={() => setSelectedUserId(prev => prev === u.id ? null : u.id)}
                        sx={{ cursor: "pointer" }}
                      >
                        <TableCell>{u.id}</TableCell>
                        <TableCell>{u.email}</TableCell>
                        <TableCell>{u.firstName ?? "-"}</TableCell>
                        <TableCell>{u.phoneNumber ?? "-"}</TableCell>
                        <TableCell>{u.roles?.join(", ") || "—"}</TableCell>
                        <TableCell>
                          {u.bannedUntil
                            ? <Chip size="small" color="error" label={`до ${u.bannedUntil}`} />
                            : <Chip size="small" color="success" label="нема" />
                          }
                        </TableCell>
                        <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                          <IconButton onClick={() => onOpenEdit(u)} title="Редагувати роль">
                            <EditIcon />
                          </IconButton>
                          <IconButton onClick={() => onOpenBan(u)} title="Забанити/зняти бан" color="warning">
                            <BlockIcon />
                          </IconButton>
                          <IconButton onClick={() => onDeleteUser(u)} color="error" title="Видалити">
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {filteredUsers.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} align="center">Немає даних</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </>
        )}

        {/* ===== Products panel ===== */}
        {tab === 1 && (
          <>
            {/* Пошук над меню */}
            <Stack direction={{ xs: "column", sm: "row" }} gap={2} alignItems="center" sx={{ mb: 2 }}>
              <TextField
                size="small"
                placeholder="Пошук товарів (назва, бренд, колір, рік)"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                sx={{ flex: 1, minWidth: 260 }}
              />
            </Stack>

            {/* Меню дій для товарів */}
            <Stack direction={{ xs:"column", sm:"row" }} gap={1.5} sx={{ mb: 2 }}>
              <Button variant={showProductsTable ? "outlined" : "contained"} onClick={handleProductsListClick}>
                {showProductsTable ? "Сховати список товарів" : "Показати список товарів"}
              </Button>
              <Button startIcon={<AddIcon />} variant="contained" onClick={() => { setSelectedProductId(null); onOpenProduct(); }}>
                Додати товар
              </Button>
              <Button startIcon={<EditIcon />} onClick={() => onOpenProduct()} disabled={!selectedProductId}>
                Редагувати товар
              </Button>
              <Button startIcon={<DeleteIcon />} color="error" onClick={() => onDeleteProductClick()} disabled={!selectedProductId}>
                Видалити товар
              </Button>
            </Stack>

            {!showProductsTable ? null : loadingProducts ? (
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
                    <TableCell>Наявність</TableCell>
                    <TableCell>Виробник</TableCell>
                    <TableCell>Рік</TableCell>
                    <TableCell>Колір</TableCell>
                    <TableCell align="right">Дії</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredProducts.map((p) => {
                    const selected = p.id === selectedProductId;
                    return (
                      <TableRow
                        key={p.id}
                        hover
                        selected={selected}
                        onClick={() => setSelectedProductId(prev => prev === p.id ? null : p.id)}
                        sx={{ cursor: "pointer" }}
                      >
                        <TableCell>{p.id}</TableCell>
                        <TableCell>{p.title}</TableCell>
                        <TableCell>{p.price.toLocaleString()} грн</TableCell>
                        <TableCell>{p.inStock ? "В наявності" : "Немає"}</TableCell>
                        <TableCell>
                          {p.brand || "-"} {p.brandSite ? <a href={p.brandSite} target="_blank" rel="noreferrer">↗</a> : ""}
                        </TableCell>
                        <TableCell>{p.year || "-"}</TableCell>
                        <TableCell>{p.color || "-"}</TableCell>
                        <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                          <IconButton onClick={() => onOpenProduct(p)} title="Редагувати">
                            <EditIcon />
                          </IconButton>
                          <IconButton onClick={() => onDeleteProductClick(p)} color="error" title="Видалити">
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {filteredProducts.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} align="center">Немає даних</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </>
        )}

        {/* Edit role dialog */}
        <Dialog open={openEdit} onClose={() => setOpenEdit(false)}>
          <DialogTitle>Змінити роль</DialogTitle>
          <DialogContent sx={{ pt: 1 }}>
            <Typography sx={{ mb: 1 }}>
              Користувач: <b>{editUser?.email}</b>
            </Typography>
            <FormControl fullWidth>
              <InputLabel id="role-label">Роль</InputLabel>
              <Select
                labelId="role-label"
                label="Роль"
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as string)}
              >
                <MenuItem value="User">User</MenuItem>
                <MenuItem value="Admin">Admin</MenuItem>
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenEdit(false)}>Скасувати</Button>
            <Button variant="contained" onClick={onSaveRole}>Зберегти</Button>
          </DialogActions>
        </Dialog>

        {/* Ban dialog (mock) */}
        <Dialog open={openBan} onClose={() => setOpenBan(false)}>
          <DialogTitle>Забанити користувача</DialogTitle>
          <DialogContent sx={{ pt: 1, width: 420, maxWidth: "100%" }}>
            <Typography sx={{ mb: 1 }}>
              Користувач: <b>{banUser?.email}</b>
            </Typography>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel id="ban-label">Термін</InputLabel>
              <Select
                labelId="ban-label"
                label="Термін"
                value={banOption}
                onChange={(e) => setBanOption(e.target.value as any)}
              >
                <MenuItem value="1d">1 день</MenuItem>
                <MenuItem value="7d">7 днів</MenuItem>
                <MenuItem value="30d">30 днів</MenuItem>
                <MenuItem value="forever">Назавжди</MenuItem>
                <MenuItem value="until">До дати…</MenuItem>
              </Select>
            </FormControl>

            {banOption === "until" && (
              <TextField
                label="Дата (YYYY-MM-DD)"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={banDate}
                onChange={(e) => setBanDate(e.target.value)}
              />
            )}
            <Typography variant="body2" sx={{ mt: 1.5, color: "text.secondary" }}>
              {/* * Поки що фронтовий мок. Для продакшну потрібен бекенд-ендпоінт (напр., /api/Users/{id}/ban). */}
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenBan(false)}>Скасувати</Button>
            <Button variant="contained" onClick={onSaveBan}>Зберегти</Button>
          </DialogActions>
        </Dialog>

        {/* Product dialog */}
        <Dialog open={openProduct} onClose={() => setOpenProduct(false)} maxWidth="sm" fullWidth>
          <DialogTitle>{editProduct ? "Редагувати товар" : "Додати товар"}</DialogTitle>
          <DialogContent sx={{ pt: 1 }}>
            <Stack gap={2} sx={{ mt: 1 }}>
              <TextField
                label="Назва"
                value={productForm.title}
                onChange={(e) => setProductForm(f => ({...f, title: e.target.value}))}
                fullWidth
              />
              <TextField
                label="Ціна (грн)"
                type="number"
                value={productForm.price}
                onChange={(e) => setProductForm(f => ({...f, price: Number(e.target.value)}))}
                fullWidth
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={productForm.inStock}
                    onChange={(e) => setProductForm(f => ({...f, inStock: e.target.checked}))}
                  />
                }
                label="В наявності"
              />
              <Stack direction={{ xs:"column", sm:"row" }} gap={2}>
                <TextField
                  label="Виробник"
                  value={productForm.brand || ""}
                  onChange={(e) => setProductForm(f => ({...f, brand: e.target.value}))}
                  fullWidth
                />
                <TextField
                  label="Сайт виробника"
                  value={productForm.brandSite || ""}
                  onChange={(e) => setProductForm(f => ({...f, brandSite: e.target.value}))}
                  fullWidth
                />
              </Stack>
              <Stack direction={{ xs:"column", sm:"row" }} gap={2}>
                <TextField
                  label="Розмір"
                  value={productForm.size || ""}
                  onChange={(e) => setProductForm(f => ({...f, size: e.target.value}))}
                  fullWidth
                />
                <TextField
                  label="Колір"
                  value={productForm.color || ""}
                  onChange={(e) => setProductForm(f => ({...f, color: e.target.value}))}
                  fullWidth
                />
                <TextField
                  label="Рік"
                  type="number"
                  value={productForm.year}
                  onChange={(e) => setProductForm(f => ({...f, year: e.target.value ? Number(e.target.value) : ""}))}
                  fullWidth
                />
              </Stack>
              <TextField
                label="Фото (імена/URL через кому)"
                placeholder="img1.jpg, img2.jpg"
                value={productForm.images.join(", ")}
                onChange={(e) => setProductForm(f => ({...f, images: e.target.value.split(",").map(s => s.trim()).filter(Boolean)}))}
                fullWidth
              />
              <Typography variant="body2" color="text.secondary">
                * Завантаження файлів під’єднаємо, коли буде upload API.
              </Typography>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenProduct(false)}>Скасувати</Button>
            <Button variant="contained" onClick={onSaveProduct}>
              {editProduct ? "Зберегти" : "Додати"}
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar
          open={snack.open}
          autoHideDuration={2500}
          onClose={() => setSnack(s => ({...s, open:false}))}
        >
          <Alert severity={snack.type} onClose={() => setSnack(s => ({...s, open:false}))}>
            {snack.msg}
          </Alert>
        </Snackbar>
      </Container>
    </Layout>
  );
}
