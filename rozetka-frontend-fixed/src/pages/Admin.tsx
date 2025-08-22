import Layout from "../components/Layout";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container, Typography, Table, TableHead, TableRow, TableCell, TableBody,
  IconButton, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  Select, MenuItem, FormControl, InputLabel, Snackbar, Alert, Box, CircularProgress
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

type UserRow = {
  id: number;
  email: string;
  firstName?: string;
  phoneNumber?: string;
  dateCreated?: string;
  roles: string[];
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
  const navigate = useNavigate();
  const token = useMemo(() => localStorage.getItem("token") ?? "", []);
  const [rows, setRows] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(false);

  // edit state
  const [openEdit, setOpenEdit] = useState(false);
  const [editUser, setEditUser] = useState<UserRow | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>("User");

  // notify
  const [snack, setSnack] = useState<{open: boolean; msg: string; type:"success"|"error"}>({
    open:false, msg:"", type:"success"
  });

  // headers
  const authHeaders: Record<string, string> = {"Content-Type":"application/json"};
  if (token) authHeaders.Authorization = `Bearer ${token}`;

  // guard: тільки Admin
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

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API}/api/Users/all`, { headers: authHeaders });
      if (res.status === 401 || res.status === 403) {
        setSnack({open:true, msg:"Немає доступу. Увійдіть як адміністратор.", type:"error"});
        return;
      }
      if (!res.ok) throw new Error("Не вдалося завантажити користувачів");
      const data = await res.json();
      setRows(data);
    } catch (e:any) {
      setSnack({open:true, msg:e?.message ?? "Помилка завантаження", type:"error"});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      fetchUsers();
    } catch (e:any) {
      setSnack({open:true, msg:e?.message ?? "Помилка оновлення", type:"error"});
    }
  };

  const onDelete = async (u: UserRow) => {
    if (!confirm(`Видалити користувача ${u.email}?`)) return;
    try {
      const res = await fetch(`${API}/api/Users/${u.id}`, {
        method: "DELETE",
        headers: authHeaders
      });
      if (!res.ok) {
        let msg = "Не вдалося видалити";
        try { const d=await res.json(); if (d?.message) msg=d.message; } catch {}
        throw new Error(msg);
      }
      setSnack({open:true, msg:"Користувача видалено", type:"success"});
      setRows(prev => prev.filter(x => x.id !== u.id));
    } catch (e:any) {
      setSnack({open:true, msg:e?.message ?? "Помилка видалення", type:"error"});
    }
  };

  return (
    <Layout>
      <Container maxWidth="md" sx={{ mt: 4, mb: 6 }}>
        <Typography variant="h5" sx={{ mb: 2, fontWeight: "bold" }}>
          Адмін-панель: користувачі
        </Typography>

        <Box sx={{ display:"flex", gap:2, mb:2 }}>
          <Button variant="outlined" onClick={fetchUsers} disabled={loading}>
            Оновити
          </Button>
        </Box>

        {loading ? (
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
                <TableCell align="right">Дії</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>{u.id}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>{u.firstName ?? "-"}</TableCell>
                  <TableCell>{u.phoneNumber ?? "-"}</TableCell>
                  <TableCell>{u.roles?.join(", ") || "—"}</TableCell>
                  <TableCell align="right">
                    <IconButton onClick={() => onOpenEdit(u)} title="Редагувати роль">
                      <EditIcon />
                    </IconButton>
                    <IconButton onClick={() => onDelete(u)} color="error" title="Видалити">
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center">Немає даних</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}

        {/* Edit dialog */}
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
