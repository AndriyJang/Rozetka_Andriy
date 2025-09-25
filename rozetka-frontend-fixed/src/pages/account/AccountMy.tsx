import React from "react";
import Layout from "../../components/Layout";
import { useNavigate, useSearchParams, Link as RouterLink } from "react-router-dom";
import {
  Box, Container, Card, CardContent, Typography, Divider, Stack, Paper, List, ListItem,
  ListItemButton, ListItemIcon, ListItemText, Button, TextField, Chip, Link,
  Snackbar, Alert, Grid
} from "@mui/material";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import AssignmentOutlinedIcon from "@mui/icons-material/AssignmentOutlined";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import CardGiftcardOutlinedIcon from "@mui/icons-material/CardGiftcardOutlined";
import CreditCardOutlinedIcon from "@mui/icons-material/CreditCardOutlined";
import HelpOutlineOutlinedIcon from "@mui/icons-material/HelpOutlineOutlined";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import ExitToAppOutlinedIcon from "@mui/icons-material/ExitToAppOutlined";

type TabKey = "dashboard" | "my-data" | "track";

const RAW_API = import.meta.env.VITE_API_URL ?? "";
const API = RAW_API.replace(/\/+$/, "");

export default function AccountMy() {
  const navigate = useNavigate();
  const [sp, setSp] = useSearchParams();
  const tab = (sp.get("tab") as TabKey) || "dashboard";
  const setTab = (t: TabKey) => setSp({ tab: t });

  const [snackOpen, setSnackOpen] = React.useState(false);
  const showInWork = () => setSnackOpen(true);

  const SidebarItem = ({
    to, onClick, label, icon, active,
  }: {
    to?: string; onClick?: () => void; label: string; icon: React.ReactNode; active?: boolean;
  }) => (
    <ListItem disablePadding>
      {to ? (
        <ListItemButton component={RouterLink} to={to} selected={active}>
          <ListItemIcon>{icon}</ListItemIcon>
          <ListItemText primary={label} />
        </ListItemButton>
      ) : (
        <ListItemButton onClick={onClick} selected={active}>
          <ListItemIcon>{icon}</ListItemIcon>
          <ListItemText primary={label} />
        </ListItemButton>
      )}
    </ListItem>
  );

  const logout = () => { try { localStorage.removeItem("token"); } catch {} navigate("/", { replace: true }); };

  return (
    <Layout>
      <Container maxWidth="lg">
        <Box sx={{ display: "grid", gridTemplateColumns: { md: "280px 1fr" }, gap: 3 }}>
          {/* SIDEBAR */}
          <Paper elevation={0} sx={{ p: 1.5, borderRadius: 3, height: "fit-content" }}>
            <List>
              <SidebarItem label="Профіль клієнта" icon={<PersonOutlineIcon />} active={tab==="dashboard"} onClick={() => setTab("dashboard")} />
              <SidebarItem label="Мої дані"          icon={<AssignmentOutlinedIcon />} active={tab==="my-data"}  onClick={() => setTab("my-data")} />
              <SidebarItem to="/account/order-history" label="Історія замовлень" icon={<CardGiftcardOutlinedIcon />} />
              <SidebarItem label="Відстежити замовлення" icon={<LocalShippingOutlinedIcon />} active={tab==="track"} onClick={() => setTab("track")} />
              <SidebarItem label="Карти"                icon={<CreditCardOutlinedIcon />} onClick={showInWork} />
              <SidebarItem label="Технічна підтримка"   icon={<HelpOutlineOutlinedIcon />} onClick={showInWork} />
              <SidebarItem label="Подарунки"            icon={<FavoriteBorderIcon />} onClick={showInWork} />
              <ListItem disablePadding>
                <ListItemButton onClick={logout}>
                  <ListItemIcon><ExitToAppOutlinedIcon /></ListItemIcon>
                  <ListItemText primary="Вийти з системи" />
                </ListItemButton>
              </ListItem>
            </List>
          </Paper>

          {/* CONTENT */}
          <Card elevation={0} sx={{ borderRadius: 3, p: 2 }}>
            {tab === "dashboard" && <Dashboard />}
            {tab === "my-data"  && <MyData />}
            {tab === "track"    && <Track />}
          </Card>
        </Box>
      </Container>

      <Snackbar open={snackOpen} autoHideDuration={2000} onClose={() => setSnackOpen(false)} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert onClose={() => setSnackOpen(false)} severity="info" variant="filled" sx={{ width: "100%" }}>
          Розділ у роботі
        </Alert>
      </Snackbar>
    </Layout>
  );
}

/* --------------------------- DASHBOARD --------------------------- */
function Dashboard() {
  const token = React.useMemo(() => localStorage.getItem("token") ?? "", []);
  const authHeaders: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
  const [last, setLast] = React.useState<null | { id: number; statusName: string }>(null);

  React.useEffect(() => {
    let aborted = false;
    (async () => {
      try {
        const r = await fetch(`${API}/api/Orders/user/list`, { headers: authHeaders });
        const data = r.ok ? await r.json() : [];
        if (!aborted && Array.isArray(data) && data.length) setLast({ id: data[0].id, statusName: data[0].statusName });
      } catch {}
    })();
    return () => { aborted = true; };
  }, []);

  const user = { name: "Андрій", email: "andri@gmail.com", phone: "+380 (000) 123-4567", level: "Срібний учасник", joinDate: "12 липня 2025" };

  return (
    <>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>Привіт, {user.name}.</Typography>
      <Divider sx={{ mb: 2 }} />
      <Stack spacing={2}>
        <Card variant="outlined" sx={{ borderRadius: 3 }}>
          <CardContent>
            <Stack direction={{ xs: "column", md: "row" }} spacing={3} justifyContent="space-between">
              <Box>
                <Typography variant="body2" color="text.secondary">Електронна пошта</Typography>
                <Typography>{user.email}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Дата реєстрації</Typography>
                <Typography>{user.joinDate}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">Номер телефону</Typography>
                <Typography>{user.phone}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Статус лояльності</Typography>
                <Typography>{user.level}</Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        <Card variant="outlined" sx={{ borderRadius: 3 }}>
          <CardContent>
            <Stack direction={{ xs: "column", md: "row" }} alignItems={{ md: "center" }} justifyContent="space-between" spacing={2}>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Останнє замовлення</Typography>
                {last ? (
                  <Typography variant="body2" color="text.secondary">
                    Замовлення #{last.id} — <Chip size="small" label={last.statusName} sx={{ ml: 0.5 }} />
                  </Typography>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    тут мають бути ваші замовлення, дякуємо за співпрацю
                  </Typography>
                )}
              </Box>
              <Stack direction="row" spacing={1}>
                <Button size="small" component={RouterLink} to="/account/order-history" variant="outlined">Переглянути</Button>
                <Button size="small" component={RouterLink} to="/account-my?tab=track" variant="contained">Відстежити</Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>

        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          <QuickTile title="Історія замовлень" to="/account/order-history" />
          <QuickTile title="Обране" onClickFallback />
          <QuickTile title="Способи оплати" onClickFallback />
          <QuickTile title="Бонуси" onClickFallback />
        </Stack>
      </Stack>
    </>
  );
}

function QuickTile({ title, to, onClickFallback }:{ title:string; to?:string; onClickFallback?: boolean }) {
  const [snack, setSnack] = React.useState(false);
  const content = (
    <Card variant="outlined" sx={{ borderRadius: 3, height: 120, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
      onClick={() => { if (onClickFallback) setSnack(true); }}>
      <CardContent><Typography sx={{ textAlign: "center" }}>{title}</Typography></CardContent>
    </Card>
  );
  return (
    <>
      <Box sx={{ flex: 1 }}>
        {to ? <Link component={RouterLink} to={to} sx={{ flex: 1, textDecoration: "none", display: "block" }}>{content}</Link> : content}
      </Box>
      <Snackbar open={snack} autoHideDuration={2000} onClose={() => setSnack(false)} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert onClose={() => setSnack(false)} severity="info" variant="filled" sx={{ width: "100%" }}>Розділ у роботі</Alert>
      </Snackbar>
    </>
  );
}

/* --------------------------- MY DATA ----------------------------- */
function MyData() {
  const [form, setForm] = React.useState({ firstName: "Андрій", lastName: "Чепіль", email: "andri@gmail.com", phone: "+380 (000) 123-4567", branch: "" });
  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [e.target.name]: e.target.value });
  return (
    <>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>Мої дані.</Typography>
      <Divider sx={{ mb: 2 }} />
      <Stack spacing={2}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          <TextField fullWidth label="Ім'я" name="firstName" value={form.firstName} onChange={onChange} />
          <TextField fullWidth label="Прізвище" name="lastName" value={form.lastName} onChange={onChange} />
        </Stack>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          <TextField fullWidth label="Ел. пошта" name="email" value={form.email} onChange={onChange} />
          <TextField fullWidth label="Номер телефону" name="phone" value={form.phone} onChange={onChange} />
        </Stack>
        <TextField fullWidth label="Номер відділення" name="branch" value={form.branch} onChange={onChange} />
        <Box><Button variant="contained" onClick={() => alert("(Заглушка) Дані збережено")}>Зберегти зміни</Button></Box>
        <Chip label="Зміну пароля прибрано (не потрібно)" />
      </Stack>
    </>
  );
}

/* --------------------------- TRACK ORDER ------------------------- */
function Track() {
  const token = React.useMemo(() => localStorage.getItem("token") ?? "", []);
  const authHeaders: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

  const [orderId, setOrderId] = React.useState("1000");
  const [lookup, setLookup] = React.useState<null | { id: number; statusName: string; dateCreated: string }>(null);
  const [notFound, setNotFound] = React.useState(false);

  const handleLookup = async () => {
    setNotFound(false);
    setLookup(null);
    try {
      const r = await fetch(`${API}/api/Orders/user/list`, { headers: authHeaders });
      const list = r.ok ? await r.json() : [];
      const found = Array.isArray(list) ? list.find((o: any) => String(o.id) === String(orderId).trim()) : null;
      if (found) setLookup({ id: found.id, statusName: found.statusName, dateCreated: found.dateCreated });
      else setNotFound(true);
    } catch { setNotFound(true); }
  };

  const TimelineItem = ({ title, subtitle, done, active }:{ title: string; subtitle?: string; done?: boolean; active?: boolean }) => (
    <Box sx={{ pl: 2, borderLeft: "2px solid", borderColor: done ? "success.main" : active ? "primary.main" : "divider", my: 2 }}>
      <Typography sx={{ fontWeight: 600 }}>{title}</Typography>
      {subtitle && <Typography variant="body2" color="text.secondary">{subtitle}</Typography>}
    </Box>
  );

  return (
    <>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>Відстеження замовлення.</Typography>
      <Divider sx={{ mb: 2 }} />

      <Stack spacing={2} sx={{ mb: 2 }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          <TextField fullWidth label="Номер замовлення" value={orderId} onChange={(e)=>setOrderId(e.target.value)} />
          <Button variant="contained" onClick={handleLookup}>Відстежувати</Button>
        </Stack>
      </Stack>

      <Grid container spacing={2}>
        {/* Ліва колонка — ПРИКЛАД */}
        <Grid item xs={12} md={6}>
          <Card variant="outlined" sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                Приклад (демо-трек)
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Це приклад треку доставки. Реальне відстеження за номером відображається праворуч.
              </Typography>
              <TimelineItem title="Замовлення оброблено" subtitle="Липень 15, 2025 — 10:30" done />
              <TimelineItem title="Замовлення відправлено" subtitle="Липень 16, 2025 — 21:15" done />
              <TimelineItem title="Готовий до отримання" subtitle="Приблизно: Липень 19, 2025" active />
              <TimelineItem title="Доставлено" subtitle="Орієнтовно: Липень 19, 2025" />
            </CardContent>
          </Card>
        </Grid>

        {/* Права колонка — СТАТУС за введеним № */}
        <Grid item xs={12} md={6}>
          <Card variant="outlined" sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                Статус замовлення № {orderId || "—"}
              </Typography>
              {lookup ? (
                <Stack spacing={0.5}>
                  <Typography>Статус: <b>{lookup.statusName}</b></Typography>
                  <Typography color="text.secondary">Створено: {lookup.dateCreated}</Typography>
                </Stack>
              ) : notFound ? (
                <Typography color="text.secondary">Замовлення з таким номером не знайдено.</Typography>
              ) : (
                <Typography color="text.secondary">Введіть номер і натисніть “Відстежувати”.</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </>
  );
}
