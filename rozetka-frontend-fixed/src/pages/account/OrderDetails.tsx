import * as React from "react";
import Layout from "../../components/Layout";
import { useParams, Link as RouterLink } from "react-router-dom";
import {
  Box, Container, Card, CardContent, Typography, Divider, Stack,
  Chip, Button, Grid, Paper
} from "@mui/material";

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
  dateCreated: string;
  consumerFirstName: string;
  consumerSecondName: string;
  consumerPhone: string;
  region: string;
  city: string;
  street: string;
  homeNumber: string;
  items: OrderItemVm[];
};

function hasAdminRoleFromToken(token: string): boolean {
  try {
    const [, payload] = token.split(".");
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    const p = JSON.parse(decodeURIComponent(escape(json)));
    const roles = Array.isArray(p?.roles) ? p.roles : (p?.roles ? [p.roles] : []);
    return roles.includes("Admin");
  } catch { return false; }
}

export default function OrderDetails() {
  const { id } = useParams();
  const token = React.useMemo(() => localStorage.getItem("token") ?? "", []);
  const authHeaders: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
  const isAdmin = React.useMemo(() => hasAdminRoleFromToken(token), [token]);

  const [order, setOrder] = React.useState<OrderVm | null>(null);
  const [notFound, setNotFound] = React.useState(false);

  React.useEffect(() => {
    let aborted = false;
    (async () => {
      try {
        // 1) список користувача
        const r1 = await fetch(`${API}/api/Orders/user/list`, { headers: authHeaders });
        const list1 = r1.ok ? await r1.json() : [];
        let found = Array.isArray(list1) ? list1.find((o: any) => String(o.id) === String(id)) : null;

        // 2) якщо не знайшли і ми Admin — беремо адмін-список
        if (!found && isAdmin) {
          const r2 = await fetch(`${API}/api/Orders/list`, { headers: authHeaders });
          const list2 = r2.ok ? await r2.json() : [];
          found = Array.isArray(list2) ? list2.find((o: any) => String(o.id) === String(id)) : null;
        }

        if (!aborted) {
          if (found) setOrder(found as OrderVm);
          else setNotFound(true);
        }
      } catch {
        if (!aborted) setNotFound(true);
      }
    })();
    return () => { aborted = true; };
  }, [id, isAdmin]);

  const total = (order?.items ?? []).reduce((s, it) => s + (it.quantity ?? 0) * (it.buyPrice ?? 0), 0);

  return (
    <Layout>
      <Container maxWidth="lg">
        <Card elevation={0} sx={{ borderRadius: 3, p: 2 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              Замовлення #{id}
            </Typography>

            {/* 🔒 Кнопка "До історії" видима лише для НЕ-адміна */}
            {!isAdmin && (
              <Button component={RouterLink} to="/account/order-history" variant="outlined">
                ← До історії
              </Button>
            )}
            {/* Якщо хочеш замість приховування показувати адмінам "← До замовлень (адмін)":
                {isAdmin && (
                  <Button component={RouterLink} to="/orders" variant="outlined">
                    ← До замовлень (адмін)
                  </Button>
                )}
            */}
          </Stack>

          <Divider sx={{ my: 2 }} />

          {notFound && (
            <Typography color="text.secondary">
              Замовлення недоступне. {isAdmin ? "Навіть в адмін-списку не знайдено." : "Можливо, воно не належить вашому акаунту або недоступне у поточному статусі."}
            </Typography>
          )}
          {!notFound && !order && <Typography color="text.secondary">Завантаження…</Typography>}

          {order && (
            <>
              {/* Статус + дата */}
              <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ mb: 2 }}>
                <Chip label={order.statusName} color="primary" variant="outlined" />
                <Typography color="text.secondary">Створено: {order.dateCreated}</Typography>
              </Stack>

              {/* Одержувач + Адреса */}
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} md={6}>
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                      Одержувач
                    </Typography>
                    <Typography>
                      {order.consumerFirstName} {order.consumerSecondName}
                    </Typography>
                    <Typography color="text.secondary">Телефон: {order.consumerPhone}</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                      Доставка
                    </Typography>
                    <Typography>{order.region}, м. {order.city}</Typography>
                    <Typography>вул. {order.street}, буд. {order.homeNumber}</Typography>
                  </Paper>
                </Grid>
              </Grid>

              {/* Позиції */}
              <Grid container spacing={2}>
                {(order.items ?? []).map((it, idx) => {
                  const subtotal = (it.quantity ?? 0) * (it.buyPrice ?? 0);
                  return (
                    <Grid key={idx} item xs={12}>
                      <Card variant="outlined" sx={{ borderRadius: 3 }}>
                        <CardContent>
                          <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between">
                            <Box>
                              <Typography sx={{ fontWeight: 600 }}>
                                {it.productName || `Товар #${it.productId}`}
                              </Typography>
                              <Typography color="text.secondary" variant="body2">
                                ID: {it.productId}
                              </Typography>
                            </Box>
                            <Stack direction="row" spacing={2}>
                              <Typography>К-сть: <b>{it.quantity}</b></Typography>
                              <Typography>Ціна: <b>{it.buyPrice?.toFixed(2)}</b></Typography>
                              <Typography>Сума: <b>{subtotal.toFixed(2)}</b></Typography>
                            </Stack>
                          </Stack>
                        </CardContent>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>

              <Divider sx={{ my: 2 }} />
              <Typography align="right" sx={{ fontWeight: 700 }}>
                Разом: ${total.toFixed(2)}
              </Typography>
            </>
          )}
        </Card>
      </Container>
    </Layout>
  );
}
