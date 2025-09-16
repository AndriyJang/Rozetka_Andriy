// src/pages/Admin.tsx
import Layout from "../components/Layout";
import { useMemo, useState, useEffect } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import {
  Container, Typography, Table, TableHead, TableRow, TableCell, TableBody,
  Button, Dialog, DialogTitle, DialogContent, DialogActions,
  Select, MenuItem, FormControl, InputLabel, Snackbar, Alert, Box,
  CircularProgress, TextField, Stack, Chip
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import BlockIcon from "@mui/icons-material/Block";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import CategoryIcon from "@mui/icons-material/Category";

type UserRow = {
  id: number;
  email: string;
  firstName?: string;
  phoneNumber?: string;
  dateCreated?: string;
  roles: string[];
  bannedUntil?: string | null;
};

const API = import.meta.env.VITE_API_URL;

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
  const token = useMemo(() => localStorage.getItem("token") ?? "", []);
  const navigate = useNavigate();

  const [showUsers, setShowUsers] = useState(false);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [userSearch, setUserSearch] = useState("");

  // Edit role
  const [openEdit, setOpenEdit] = useState(false);
  const [editUser, setEditUser] = useState<UserRow | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>("User");

  // Ban (mock)
  const [openBan, setOpenBan] = useState(false);
  const [banUser, setBanUser] = useState<UserRow | null>(null);
  const [banOption, setBanOption] = useState<"1d" | "7d" | "30d" | "forever" | "until">("7d");
  const [banDate, setBanDate] = useState<string>("");

  // Швидкі дії за ID
  const [userIdInput, setUserIdInput] = useState<string>("");

  // notify
  const [snack, setSnack] = useState<{ open: boolean; msg: string; type: "success" | "error" }>({
    open: false,
    msg: "",
    type: "success",
  });

  // headers
  const authHeaders: Record<string, string> = { "Content-Type": "application/json" };
  if (token) authHeaders.Authorization = `Bearer ${token}`;

  // Guard
  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    const payload = decodeJwt<{ roles?: string | string[] }>(token);
    const rolesArr = Array.isArray(payload?.roles)
      ? payload?.roles
      : payload?.roles
      ? [payload.roles]
      : [];
    if (!rolesArr.includes("Admin")) navigate("/product-search");
  }, [token, navigate]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API}/api/Users/all`, { headers: authHeaders });
      if (res.status === 401 || res.status === 403) {
        setSnack({ open: true, msg: "Немає доступу. Увійдіть як адміністратор.", type: "error" });
        return;
      }
      if (!res.ok) throw new Error("Не вдалося завантажити користувачів");
      const data = await res.json();
      setUsers(data);
    } catch (e: any) {
      setSnack({ open: true, msg: e?.message ?? "Помилка завантаження", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleShowUsers = () => {
    const next = !showUsers;
    setShowUsers(next);
    if (next) fetchUsers();
  };

  const filteredUsers = users.filter((u) => {
    const q = userSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      (u.email || "").toLowerCase().includes(q) ||
      (u.firstName || "").toLowerCase().includes(q) ||
      (u.phoneNumber || "").toLowerCase().includes(q) ||
      (u.roles?.join(", ") || "").toLowerCase().includes(q)
    );
  });

  // role edit
  const onOpenEdit = (u: UserRow) => {
    setEditUser(u);
    setSelectedRole(u.roles?.[0] ?? "User");
    setOpenEdit(true);
  };
  const onSaveRole = async () => {
    if (!editUser) return;
    try {
      const res = await fetch(`${API}/api/Users/${editUser.id}/role`, {
        method: "PUT",
        headers: authHeaders,
        body: JSON.stringify({ role: selectedRole }),
      });
      if (!res.ok) {
        let msg = "Не вдалося оновити роль";
        try {
          const d = await res.json();
          if (d?.message) msg = d.message;
        } catch {}
        throw new Error(msg);
      }
      setSnack({ open: true, msg: "Роль оновлено", type: "success" });
      setOpenEdit(false);
      setEditUser(null);
      if (showUsers) fetchUsers();
    } catch (e: any) {
      setSnack({ open: true, msg: e?.message ?? "Помилка оновлення", type: "error" });
    }
  };

  // delete
  const onDeleteUser = async (u: UserRow) => {
    if (!confirm(`Видалити користувача ${u.email}?`)) return;
    try {
      const res = await fetch(`${API}/api/Users/${u.id}`, {
        method: "DELETE",
        headers: authHeaders,
      });
      if (!res.ok) {
        let msg = "Не вдалося видалити";
        try {
          const d = await res.json();
          if (d?.message) msg = d.message;
        } catch {}
        throw new Error(msg);
      }
      setSnack({ open: true, msg: "Користувача видалено", type: "success" });
      setUsers((prev) => prev.filter((x) => x.id !== u.id));
    } catch (e: any) {
      setSnack({ open: true, msg: e?.message ?? "Помилка видалення", type: "error" });
    }
  };

  // ban (front-mock)
  const onOpenBan = (u: UserRow) => {
    setBanUser(u);
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
    return d.toISOString().slice(0, 10);
  };
  const onSaveBan = () => {
    if (!banUser) return;
    const until = calcBanUntil();
    setUsers((prev) => prev.map((u) => (u.id === banUser.id ? { ...u, bannedUntil: until } : u)));
    setSnack({ open: true, msg: until ? `Забанено до ${until}` : "Бан знято", type: "success" });
    setOpenBan(false);
    setBanUser(null);
  };

  // ===== ШВИДКІ ДІЇ ЗА ID =====
  const [quickRole, setQuickRole] = useState<"User" | "Admin">("User");

  const changeRoleById = async () => {
    const id = Number(userIdInput);
    if (!id) {
      setSnack({ open: true, msg: "Вкажіть коректний ID", type: "error" });
      return;
    }
    try {
      const res = await fetch(`${API}/api/Users/${id}/role`, {
        method: "PUT",
        headers: authHeaders,
        body: JSON.stringify({ role: quickRole }),
      });
      if (!res.ok) {
        let msg = "Не вдалося оновити роль";
        try {
          const d = await res.json();
          if (d?.message) msg = d.message;
        } catch {}
        throw new Error(msg);
      }
      setSnack({ open: true, msg: `Роль користувача #${id} оновлено`, type: "success" });
      if (showUsers) await fetchUsers();
    } catch (e: any) {
      setSnack({ open: true, msg: e?.message ?? "Помилка оновлення ролі", type: "error" });
    }
  };

  const deleteUserById = async () => {
    const id = Number(userIdInput);
    if (!id) {
      setSnack({ open: true, msg: "Вкажіть коректний ID", type: "error" });
      return;
    }
    if (!confirm(`Видалити користувача #${id}?`)) return;
    try {
      const res = await fetch(`${API}/api/Users/${id}`, { method: "DELETE", headers: authHeaders });
      if (!res.ok) {
        let msg = "Не вдалося видалити";
        try {
          const d = await res.json();
          if (d?.message) msg = d.message;
        } catch {}
        throw new Error(msg);
      }
      setSnack({ open: true, msg: `Користувача #${id} видалено`, type: "success" });
      if (showUsers) setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (e: any) {
      setSnack({ open: true, msg: e?.message ?? "Помилка видалення", type: "error" });
    }
  };

  const openBanById = () => {
    const id = Number(userIdInput);
    if (!id) {
      setSnack({ open: true, msg: "Вкажіть коректний ID", type: "error" });
      return;
    }
    const u = users.find((x) => x.id === id) ?? ({ id, email: `(ID ${id})`, roles: [] } as UserRow);
    onOpenBan(u);
  };

  return (
    <Layout>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: "bold" }}>Користувачі (адмін)</Typography>
          <Button variant="outlined" component={RouterLink} to="/product" startIcon={<ShoppingCartIcon />}>
            Перейти до товарів
          </Button>
          <Button variant="outlined" component={RouterLink} to="/categorie" startIcon={<CategoryIcon />}>
            Перейти до категорій
          </Button>
        </Stack>

        {/* Верхня панель */}
        <Stack direction={{ xs: "column", lg: "row" }} gap={2} alignItems="center" sx={{ mb: 2 }}>
          {/* Ліва зона */}
          <Stack direction="row" gap={2} alignItems="center" sx={{ flexWrap: "wrap" }}>
            <Button variant="contained" onClick={handleShowUsers}>
              {showUsers ? "Сховати користувачів" : "Показати користувачів"}
            </Button>
            {showUsers && (
              <>
                <TextField
                  size="small"
                  placeholder="Пошук (email, ім'я, телефон, роль)"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  sx={{ minWidth: 260 }}
                />
                <Button variant="outlined" onClick={fetchUsers} disabled={loading}>
                  Оновити
                </Button>
              </>
            )}
          </Stack>

          {/* Права зона */}
          <Stack direction={{ xs: "column", sm: "row" }} gap={1.5} alignItems="center" sx={{ ml: "auto", flexWrap: "wrap" }}>
            <TextField
              label="ID користувача"
              size="small"
              type="number"
              value={userIdInput}
              onChange={(e) => setUserIdInput(e.target.value)}
              sx={{ width: 170 }}
            />
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel id="role-quick-label">Роль</InputLabel>
              <Select
                labelId="role-quick-label"
                value={quickRole}
                onChange={(e) => setQuickRole(e.target.value as "User" | "Admin")}
              >
                <MenuItem value="User">User</MenuItem>
                <MenuItem value="Admin">Admin</MenuItem>
              </Select>
            </FormControl>
            <Button variant="outlined" onClick={changeRoleById} startIcon={<EditIcon />}>
              Роль за ID
            </Button>
            <Button variant="outlined" color="warning" onClick={openBanById} startIcon={<BlockIcon />}>
              Бан за ID
            </Button>
            <Button variant="outlined" color="error" onClick={deleteUserById} startIcon={<DeleteIcon />}>
              Видалити за ID
            </Button>
          </Stack>
        </Stack>

        {/* Таблиця користувачів */}
        {showUsers && (
          loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
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
                {filteredUsers.map((u) => (
                  <TableRow key={u.id}>
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
                    <TableCell align="right">
                      <Button size="small" onClick={() => onOpenEdit(u)} startIcon={<EditIcon />}>Змінити роль</Button>
                      <Button size="small" color="warning" onClick={() => onOpenBan(u)} startIcon={<BlockIcon />}>Забанити</Button>
                      <Button size="small" color="error" onClick={() => onDeleteUser(u)} startIcon={<DeleteIcon />}>Видалити</Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredUsers.length === 0 && (
                  <TableRow><TableCell colSpan={7} align="center">Немає даних</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          )
        )}

        {/* Edit role dialog */}
        <Dialog open={openEdit} onClose={() => setOpenEdit(false)}>
          <DialogTitle>Змінити роль</DialogTitle>
          <DialogContent sx={{ pt: 1 }}>
            <Typography sx={{ mb: 1 }}>Користувач: <b>{editUser?.email}</b></Typography>
            <FormControl fullWidth>
              <InputLabel id="role-label">Роль</InputLabel>
              <Select
                labelId="role-label"
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

        {/* Ban dialog */}
        <Dialog open={openBan} onClose={() => setOpenBan(false)}>
          <DialogTitle>Забанити користувача</DialogTitle>
          <DialogContent sx={{ pt: 1, width: 420, maxWidth: "100%" }}>
            <Typography sx={{ mb: 1 }}>Користувач: <b>{banUser?.email}</b></Typography>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel id="ban-label">Термін</InputLabel>
              <Select
                labelId="ban-label"
                value={banOption}
                onChange={(e) => setBanOption(e.target.value as typeof banOption)}
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
              * Поки фронтовий мок. Для продакшну — ендпоінт типу /api/Users/{'{id}'}/ban.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenBan(false)}>Скасувати</Button>
            <Button variant="contained" onClick={onSaveBan}>Зберегти</Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar */}
        <Snackbar open={snack.open} autoHideDuration={2500} onClose={() => setSnack(s => ({ ...s, open: false }))}>
          <Alert severity={snack.type} onClose={() => setSnack(s => ({ ...s, open: false }))}>
            {snack.msg}
          </Alert>
        </Snackbar>
      </Container>
    </Layout>
  );
}
