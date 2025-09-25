// src/pages/OrdersAdmin.tsx
import Layout from "../components/Layout";
import { useEffect, useMemo, useState } from "react";
import {
  Container, Typography, Grid, Button, Stack, TextField, InputAdornment,
  Paper, Table, TableHead, TableRow, TableCell, TableBody, Box, Chip,
  Snackbar, Alert, Dialog, DialogTitle, DialogContent, DialogActions, Select, MenuItem
} from "@mui/material";
import { Link as RouterLink, useNavigate, useLocation } from "react-router-dom";
import LogoutIcon from "@mui/icons-material/Logout";
import SearchIcon from "@mui/icons-material/Search";

type OrderItemVm = {
  productId: number;
  productName: string;
  productImage: string[];
  quantity: number;
  buyPrice: number;
};
type OrderVm = {
  id: number;
  consumerFirstName: string;
  consumerSecondName: string;
  consumerPhone: string;
  region: string;
  city: string;
  street: string;
  homeNumber: string;
  statusName: string;
  dateCreated: string; // "dd.MM.yyyy HH:mm:ss"
  items: OrderItemVm[];
};
type StatusVm = { id: number; name: string };

const RAW_API = import.meta.env.VITE_API_URL || "";
const API = RAW_API.replace(/\/+$/, "");

const ORDERS_LIST = `${API}/api/Orders/list`;
const ORDER_STATUS_LIST = `${API}/api/Orders/status/list`;
const ORDER_STATUS_CHANGE = `${API}/api/Orders/status/change`;

function parseDate(d: string): Date | null {
  const m = d.match(/^(\d{2})\.(\d{2})\.(\d{4})\s+(\d{2}):(\d{2}):(\d{2})$/);
  if (!m) return null;
  const [, dd, MM, yyyy, hh, mm, ss] = m;
  const dt = new Date(+yyyy, +MM - 1, +dd, +hh, +mm, +ss);
  return isNaN(dt.getTime()) ? null : dt;
}
const orderItemsCount = (o: OrderVm) => (o.items ?? []).reduce((s, it) => s + (it.quantity ?? 0), 0);
const orderTotal = (o: OrderVm) => (o.items ?? []).reduce((s, it) => s + (it.quantity ?? 0) * Number(it.buyPrice ?? 0), 0);
const dateOnlyLabel = (o: OrderVm) => (o.dateCreated ?? "").slice(0, 10);
const statusChipColor = (name: string) => {
  const s = name.toLowerCase();
  if (s.includes("достав")) return "success";
  if (s.includes("скас")) return "error";
  if (s.includes("оброб")) return "warning";
  return "default";
};

export default function OrdersAdmin() {
  const token = useMemo(() => localStorage.getItem("token") ?? "", []);
  const authHeaders: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname.startsWith(path);
  const grad = (active: boolean) =>
    active
      ? "linear-gradient(90deg, #0E5B8A 0%, #0FA6A6 100%)"
      : "linear-gradient(90deg, #023854 0%, #035B94 100%)";
  const btnSx = (active = false) => ({
    py: 1.5, borderRadius: 3, fontWeight: 700, fontSize: 16,
    background: grad(active), boxShadow: 4, color: "#fff",
    "&:hover": { opacity: 0.95, background: grad(active) },
  });
  const smallBtnSx = { borderRadius: 3, fontWeight: 700 };

  // --- Дані / стан ---
  const [rows, setRows] = useState<OrderVm[]>([]);
  const [statuses, setStatuses] = useState<StatusVm[]>([]);
  const [loading, setLoading] = useState(false);
  const [snack, setSnack] = useState<{ open: boolean; msg: string; type: "success" | "error" }>({
    open: false, msg: "", type: "success",
  });

  // --- Фільтри ---
  const [q, setQ] = useState("");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [minSum, setMinSum] = useState<string>("");
  const [maxSum, setMaxSum] = useState<string>("");
  const [minQty, setMinQty] = useState<string>("");
  const [maxQty, setMaxQty] = useState<string>("");

  // --- Показ/сховати список (за замовчуванням приховано) ---
  const [showList, setShowList] = useState(false);

  // --- Дохід ---
  const [openRevenue, setOpenRevenue] = useState(false);
  const [revFrom, setRevFrom] = useState<string>("");
  const [revTo, setRevTo] = useState<string>("");

  useEffect(() => {
    if (!token) { navigate("/login"); return; }
  }, [token]);

  const fetchStatuses = async () => {
    try {
      const r = await fetch(ORDER_STATUS_LIST, { headers: authHeaders });
      const data = r.ok ? await r.json() : [];
      setStatuses(Array.isArray(data) ? data : []);
    } catch {}
  };
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const r = await fetch(ORDERS_LIST, { headers: authHeaders });
      if (r.status === 401 || r.status === 403) {
        setRows([]);
        setSnack({ open: true, msg: "Немає доступу до замовлень.", type: "error" });
        return;
      }
      const data = r.ok ? await r.json() : [];
      setRows(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setSnack({ open: true, msg: e?.message ?? "Помилка завантаження", type: "error" });
      setRows([]);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { fetchStatuses(); fetchOrders(); /* eslint-disable-next-line */ }, []);

  const filtered = useMemo(() => {
    const qv = q.trim().toLowerCase();
    const from = dateFrom ? new Date(dateFrom + "T00:00:00") : null;
    const to = dateTo ? new Date(dateTo + "T23:59:59") : null;

    const minS = minSum ? Number(minSum) : null;
    const maxS = maxSum ? Number(maxSum) : null;
    const minQ = minQty ? Number(minQty) : null;
    const maxQ = maxQty ? Number(maxQty) : null;

    return rows.filter((o) => {
      const hay =
        `${o.id} ${o.consumerFirstName} ${o.consumerSecondName} ${o.consumerPhone} ` +
        `${o.region} ${o.city} ${o.street} ${o.homeNumber} ${o.statusName}`.toLowerCase();
      if (qv && !hay.includes(qv)) return false;

      const d = parseDate(o.dateCreated);
      if (from && d && d < from) return false;
      if (to && d && d > to) return false;

      const sum = orderTotal(o);
      const qty = orderItemsCount(o);
      if (minS != null && sum < minS) return false;
      if (maxS != null && sum > maxS) return false;
      if (minQ != null && qty < minQ) return false;
      if (maxQ != null && qty > maxQ) return false;

      return true;
    });
  }, [rows, q, dateFrom, dateTo, minSum, maxSum, minQty, maxQty]);

  const changeStatus = async (id: number, statusId: number) => {
    try {
      const r = await fetch(ORDER_STATUS_CHANGE, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ id, statusId }),
      });
      if (!r.ok) throw new Error("Не вдалося змінити статус");
      const s = statuses.find((x) => x.id === statusId)?.name ?? "";
      setRows((prev) => prev.map((o) => (o.id === id ? { ...o, statusName: s } : o)));
      setSnack({ open: true, msg: "Статус змінено", type: "success" });
    } catch (e: any) {
      setSnack({ open: true, msg: e?.message ?? "Помилка зміни статусу", type: "error" });
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("roles");
    navigate("/login");
  };

  const revenueData = useMemo(() => {
    const from = revFrom ? new Date(revFrom + "T00:00:00") : null;
    const to = revTo ? new Date(revTo + "T23:59:59") : null;
    const rowsInRange = rows.filter((o) => {
      const d = parseDate(o.dateCreated);
      if (from && d && d < from) return false;
      if (to && d && d > to) return false;
      return true;
    });
    const list = rowsInRange.map((o) => ({ id: o.id, sum: orderTotal(o), date: dateOnlyLabel(o) }));
    const total = list.reduce((s, x) => s + x.sum, 0);
    const perDay = list.reduce<Record<string, number>>((acc, x) => {
      acc[x.date] = (acc[x.date] ?? 0) + 1;
      return acc;
    }, {});
    return { list, total, perDay, count: list.length };
  }, [rows, revFrom, revTo]);

  return (
    <Layout>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
        <Typography variant="h5" sx={{ mb: 2, fontWeight: "bold" }}>
          Кабінет адміністратора — замовлення
        </Typography>

        {/* Меню як у інших сторінок адміна */}
        <Grid container spacing={2} sx={{ mb: 3 }} alignItems="center">
          <Grid item xs={12} md={3}>
            <Button fullWidth variant="contained" component={RouterLink} to="/admin" sx={btnSx(isActive("/admin"))}>
              Користувачі
            </Button>
          </Grid>
          <Grid item xs={12} md={3}>
            <Button fullWidth variant="contained" component={RouterLink} to="/product" sx={btnSx(isActive("/product"))}>
              Товари
            </Button>
          </Grid>
          <Grid item xs={12} md={3}>
            <Button fullWidth variant="contained" component={RouterLink} to="/categorie" sx={btnSx(isActive("/categorie"))}>
              Категорії
            </Button>
          </Grid>
          <Grid item xs={12} md={3}>
            <Button fullWidth variant="contained" component={RouterLink} to="/orders" sx={btnSx(isActive("/orders"))}>
              Замовлення
            </Button>
          </Grid>

          <Grid item xs={12} md="auto">
            <Button variant="outlined" startIcon={<LogoutIcon />} onClick={logout} sx={smallBtnSx}>
              Вийти
            </Button>
          </Grid>
        </Grid>

        {/* Фільтри + Показати/Сховати */}
        <Paper sx={{ p: 2, borderRadius: 3, mb: 2 }}>
          <Grid container spacing={1.5} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth size="small"
                placeholder="Пошук: №, ПІБ, телефон, місто/вулиця/будинок/регіон, статус…"
                value={q} onChange={(e) => setQ(e.target.value)}
                InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
              />
            </Grid>
            <Grid item xs={6} md={2}>
              <TextField fullWidth size="small" label="Дата від" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={6} md={2}>
              <TextField fullWidth size="small" label="Дата до" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={6} md={2}>
              <TextField fullWidth size="small" label="Сума від" type="number" value={minSum} onChange={(e) => setMinSum(e.target.value)} />
            </Grid>
            <Grid item xs={6} md={2}>
              <TextField fullWidth size="small" label="Сума до" type="number" value={maxSum} onChange={(e) => setMaxSum(e.target.value)} />
            </Grid>
            <Grid item xs={6} md={2}>
              <TextField fullWidth size="small" label="К-сть від" type="number" value={minQty} onChange={(e) => setMinQty(e.target.value)} />
            </Grid>
            <Grid item xs={6} md={2}>
              <TextField fullWidth size="small" label="К-сть до" type="number" value={maxQty} onChange={(e) => setMaxQty(e.target.value)} />
            </Grid>

            <Grid item xs={12} md="auto">
              <Stack direction="row" gap={1}>
                <Button variant="contained" onClick={fetchOrders} disabled={loading}>Оновити</Button>
                <Button variant="outlined" onClick={() => { setQ(""); setDateFrom(""); setDateTo(""); setMinSum(""); setMaxSum(""); setMinQty(""); setMaxQty(""); }}>
                  Скинути
                </Button>
              </Stack>
            </Grid>

            <Grid item xs={12} md="auto" sx={{ ml: { md: "auto" } }}>
              <Stack direction="row" gap={1} alignItems="center">
                <Typography variant="body2" color="text.secondary">
                  Знайдено: {filtered.length}
                </Typography>
                <Button variant="outlined" onClick={() => setShowList(v => !v)}>
                  {showList ? "Сховати список" : "Показати список"}
                </Button>
                <Button variant="contained" onClick={() => setOpenRevenue(true)}>
                  Дохід
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </Paper>

        {/* Підказка, коли список приховано */}
        {!showList && (
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            Список приховано. Натисніть <b>“Показати список”</b>, щоб відобразити результати фільтрації.
          </Typography>
        )}

        {/* Таблиця — показуємо лише якщо showList = true */}
        {showList && (
          <Paper elevation={3} sx={{ borderRadius: 3, overflow: "hidden" }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>№</TableCell>
                  <TableCell>Дата</TableCell>
                  <TableCell>Клієнт</TableCell>
                  <TableCell>Контакти</TableCell>
                  <TableCell>Адреса</TableCell>
                  <TableCell>К-сть</TableCell>
                  <TableCell>Сума</TableCell>
                  <TableCell>Статус</TableCell>
                  <TableCell align="right">Дії</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map((o) => {
                  const qty = orderItemsCount(o);
                  const sum = orderTotal(o);
                  const currentStatusId = statuses.find(s => s.name === o.statusName)?.id ?? "";
                  return (
                    <TableRow key={o.id}>
                      <TableCell>{o.id}</TableCell>
                      <TableCell>
                        <Box sx={{ display: "flex", flexDirection: "column" }}>
                          <Typography variant="body2">{o.dateCreated}</Typography>
                          <Typography variant="caption" color="text.secondary">{dateOnlyLabel(o)}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{o.consumerFirstName} {o.consumerSecondName}</TableCell>
                      <TableCell><Typography variant="body2">{o.consumerPhone}</Typography></TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {o.region}, {o.city}, {o.street} {o.homeNumber}
                        </Typography>
                      </TableCell>
                      <TableCell>{qty}</TableCell>
                      <TableCell>{sum.toFixed(2)}</TableCell>
                      <TableCell>
                        <Stack direction="row" alignItems="center" gap={1}>
                          <Chip size="small" label={o.statusName} color={statusChipColor(o.statusName) as any} variant="outlined" />
                          <Select
                            size="small"
                            value={String(currentStatusId)}
                            onChange={(e) => changeStatus(o.id, Number(e.target.value))}
                            displayEmpty
                            sx={{ minWidth: 140 }}
                          >
                            <MenuItem value="" disabled>Змінити…</MenuItem>
                            {statuses.map(s => (
                              <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
                            ))}
                          </Select>
                        </Stack>
                      </TableCell>
                      <TableCell align="right">
                        {/* Перегляд повного замовлення — сторінка OrderDetails */}
                        <Button
                          size="small"
                          component={RouterLink}
                          to={`/account/order/${o.id}`}
                          variant="outlined"
                        >
                          Переглянути
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                      Немає даних
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Paper>
        )}

        {/* Діалог «Дохід» */}
        <Dialog open={openRevenue} onClose={() => setOpenRevenue(false)} maxWidth="md" fullWidth>
          <DialogTitle>Дохід за період</DialogTitle>
          <DialogContent sx={{ pt: 1 }}>
            <Stack direction={{ xs: "column", sm: "row" }} gap={2} sx={{ mb: 2 }}>
              <TextField label="Від" type="date" value={revFrom} onChange={(e) => setRevFrom(e.target.value)} InputLabelProps={{ shrink: true }} fullWidth />
              <TextField label="До" type="date" value={revTo} onChange={(e) => setRevTo(e.target.value)} InputLabelProps={{ shrink: true }} fullWidth />
            </Stack>

            <Paper variant="outlined" sx={{ borderRadius: 2, overflow: "hidden" }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>№</TableCell>
                    <TableCell>Дата</TableCell>
                    <TableCell align="right">Сума</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {revenueData.list.map((x) => (
                    <TableRow key={x.id}>
                      <TableCell>{x.id}</TableCell>
                      <TableCell>{x.date}</TableCell>
                      <TableCell align="right">{x.sum.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                  {revenueData.list.length === 0 && (
                    <TableRow><TableCell colSpan={3} align="center">Немає даних</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </Paper>

            <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" sx={{ mt: 2 }} gap={2}>
              <Typography sx={{ fontWeight: 700 }}>
                Разом: {revenueData.total.toFixed(2)}
              </Typography>
              <Box>
                <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 700 }}>К-сть замовлень по днях:</Typography>
                <Stack direction="row" gap={1} sx={{ flexWrap: "wrap" }}>
                  {Object.entries(revenueData.perDay).map(([date, cnt]) => (
                    <Chip key={date} size="small" label={`${date}: ${cnt}`} />
                  ))}
                  {Object.keys(revenueData.perDay).length === 0 && <Typography color="text.secondary">—</Typography>}
                </Stack>
              </Box>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenRevenue(false)}>Закрити</Button>
          </DialogActions>
        </Dialog>

        <Snackbar open={snack.open} autoHideDuration={2500} onClose={() => setSnack(s => ({ ...s, open: false }))}>
          <Alert severity={snack.type} onClose={() => setSnack(s => ({ ...s, open: false }))}>
            {snack.msg}
          </Alert>
        </Snackbar>
      </Container>
    </Layout>
  );
}
