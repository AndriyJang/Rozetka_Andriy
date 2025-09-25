import * as React from "react";
import Layout from "../../components/Layout";
import { Link as RouterLink } from "react-router-dom";
import {
  Box, Container, Paper, List, ListItem, ListItemButton, ListItemIcon, ListItemText,
  Card, CardContent, Chip, Divider, Stack, Typography, TextField,
  InputAdornment, IconButton, Button, Snackbar, Alert, Link
} from "@mui/material";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import AssignmentOutlinedIcon from "@mui/icons-material/AssignmentOutlined";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import CardGiftcardOutlinedIcon from "@mui/icons-material/CardGiftcardOutlined";
import CreditCardOutlinedIcon from "@mui/icons-material/CreditCardOutlined";
import HelpOutlineOutlinedIcon from "@mui/icons-material/HelpOutlineOutlined";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import ExitToAppOutlinedIcon from "@mui/icons-material/ExitToAppOutlined";
import SearchIcon from "@mui/icons-material/Search";
import RefreshIcon from "@mui/icons-material/Refresh";

const RAW_API = import.meta.env.VITE_API_URL ?? "";
const API = RAW_API.replace(/\/+$/, "");

type OrderItemVm = {
  productId: number;
  productName: string;
  productImage: string[];
  quantity: number;
  buyPrice: number;
};
type OrderVm = {
  id: number;
  statusName: string;
  dateCreated: string; // "dd.MM.yyyy HH:mm:ss"
  items: OrderItemVm[];
};

export default function OrderHistory() {
  const token = React.useMemo(() => localStorage.getItem("token") ?? "", []);
  const authHeaders: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

  const [orders, setOrders] = React.useState<OrderVm[]>([]);
  const [query, setQuery] = React.useState("");
  const [snack, setSnack] = React.useState(false);

  const showInWork = () => setSnack(true);

  React.useEffect(() => {
    let aborted = false;
    (async () => {
      try {
        const r = await fetch(`${API}/api/Orders/user/list`, { headers: authHeaders });
        const data = r.ok ? await r.json() : [];
        if (!aborted) setOrders(Array.isArray(data) ? data : []);
      } catch { /* noop */ }
    })();
    return () => { aborted = true; };
  }, [API]); // залежність, щоб ESLint був щасливий

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter(o =>
      String(o.id).toLowerCase().includes(q) ||
      o.statusName.toLowerCase().includes(q) ||
      o.dateCreated.toLowerCase().includes(q)
    );
  }, [orders, query]);

  const SidebarItem = (props: any) => (
    <ListItem disablePadding>
      <ListItemButton {...props} />
    </ListItem>
  );

  return (
    <Layout>
      <Container maxWidth="lg">
        <Box sx={{ display: "grid", gridTemplateColumns: { md: "280px 1fr" }, gap: 3 }}>
          {/* Sidebar (як у акаунті) */}
          <Paper elevation={0} sx={{ p: 1.5, borderRadius: 3, height: "fit-content" }}>
            <List>
              <SidebarItem component={RouterLink} to="/account-my?tab=dashboard">
                <ListItemIcon><PersonOutlineIcon /></ListItemIcon>
                <ListItemText primary="Профіль клієнта" />
              </SidebarItem>
              <SidebarItem component={RouterLink} to="/account-my?tab=my-data">
                <ListItemIcon><AssignmentOutlinedIcon /></ListItemIcon>
                <ListItemText primary="Мої дані" />
              </SidebarItem>
              <SidebarItem selected>
                <ListItemIcon><CardGiftcardOutlinedIcon /></ListItemIcon>
                <ListItemText primary="Історія замовлень" />
              </SidebarItem>
              <SidebarItem component={RouterLink} to="/account-my?tab=track">
                <ListItemIcon><LocalShippingOutlinedIcon /></ListItemIcon>
                <ListItemText primary="Відстежити замовлення" />
              </SidebarItem>
              <SidebarItem onClick={showInWork}>
                <ListItemIcon><CreditCardOutlinedIcon /></ListItemIcon>
                <ListItemText primary="Карти" />
              </SidebarItem>
              <SidebarItem onClick={showInWork}>
                <ListItemIcon><HelpOutlineOutlinedIcon /></ListItemIcon>
                <ListItemText primary="Технічна підтримка" />
              </SidebarItem>
              <SidebarItem onClick={showInWork}>
                <ListItemIcon><FavoriteBorderIcon /></ListItemIcon>
                <ListItemText primary="Подарунки" />
              </SidebarItem>
              <SidebarItem component={RouterLink} to="/home">
                <ListItemIcon><ExitToAppOutlinedIcon /></ListItemIcon>
                <ListItemText primary="Вийти з системи" />
              </SidebarItem>
            </List>
          </Paper>

          {/* CONTENT */}
          <Card elevation={0} sx={{ borderRadius: 3, p: 2 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                Історія замовлень
              </Typography>
              <Button variant="contained" component={RouterLink} to="/order">
                Створити замовлення
              </Button>
            </Stack>
            <Divider sx={{ mb: 2 }} />

            {/* Пошук */}
            <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} alignItems={{ md: "center" }} sx={{ mb: 2 }}>
              <TextField
                fullWidth
                placeholder="Пошук за номером, датою або статусом…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                InputProps={{ startAdornment: (<InputAdornment position="start"><SearchIcon /></InputAdornment>) }}
              />
              <IconButton onClick={() => setQuery("")}><RefreshIcon /></IconButton>
            </Stack>

            {/* EMPTY STATES */}
            {orders.length === 0 && !query && (
              <Typography color="text.secondary" sx={{ py: 6, textAlign: "center", fontSize: 16 }}>
                тут мають бути ваші замовлення, дякуємо за співпрацю
              </Typography>
            )}

            {orders.length > 0 && filtered.length === 0 && (
              <Typography color="text.secondary" sx={{ py: 4, textAlign: "center" }}>
                Нічого не знайдено за запитом «{query}».
              </Typography>
            )}

            {/* СПИСОК ЗАМОВЛЕНЬ */}
            <Stack spacing={2}>
              {filtered.map((o) => {
                const itemsCount = o.items.reduce((s, it) => s + (it.quantity ?? 0), 0);
                const total = o.items.reduce((s, it) => s + (it.quantity ?? 0) * (it.buyPrice ?? 0), 0);
                const statusColor =
                  o.statusName.toLowerCase().includes("достав") ? "success"
                  : o.statusName.toLowerCase().includes("скас") ? "error" : "warning";

                return (
                  <Card key={o.id} variant="outlined" sx={{ borderRadius: 3 }}>
                    <CardContent>
                      {/* шапка карточки */}
                      <Stack
                        direction={{ xs: "column", md: "row" }}
                        justifyContent="space-between"
                        spacing={2}
                      >
                        <Box>
                          <Typography variant="subtitle2" color="text.secondary">Замовлення #</Typography>
                          <Typography variant="h6" sx={{ fontWeight: 700 }}>{o.id}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {o.dateCreated} • {itemsCount} од.
                          </Typography>
                        </Box>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Chip label={o.statusName} color={statusColor as any} variant="outlined" />
                          <Typography sx={{ fontWeight: 600 }}>${total.toFixed(2)}</Typography>
                        </Stack>
                      </Stack>

                      {/* дії */}
                      <Stack direction="row" spacing={1.5} sx={{ mt: 2 }}>
                        <Button
                          size="small"
                          variant="outlined"
                          component={RouterLink}
                          to={`/account/order/${o.id}`}
                        >
                          Переглянути замовлення
                        </Button>
                        <Link component={RouterLink} to="/account-my?tab=track" sx={{ fontSize: 14, alignSelf: "center" }}>
                          Відстежити
                        </Link>
                      </Stack>
                    </CardContent>
                  </Card>
                );
              })}
            </Stack>
          </Card>
        </Box>
      </Container>

      <Snackbar open={snack} autoHideDuration={2000} onClose={() => setSnack(false)} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert onClose={() => setSnack(false)} severity="info" variant="filled" sx={{ width: "100%" }}>
          Розділ у роботі
        </Alert>
      </Snackbar>
    </Layout>
  );
}
