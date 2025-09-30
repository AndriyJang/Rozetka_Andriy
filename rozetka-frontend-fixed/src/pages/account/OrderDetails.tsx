// src/pages/account/OrderDetails.tsx
import * as React from "react";
import Layout from "../../components/Layout";
import { useParams, Link as RouterLink } from "react-router-dom";
import {
  Box, Container, Card, CardContent, Typography, Divider, Stack,
  Chip, Button, Grid, Paper
} from "@mui/material";

const RAW_API = import.meta.env.VITE_API_URL ?? "";
const API = RAW_API.replace(/\/+$/, "");

// ---- helpers for single-image preview ----
const IMAGES_BASE = `${API}/images`;

const toBaseName = (val?: string): string => {
  let v = String(val ?? "").trim();
  if (!v) return "";
  v = v.replace(/^https?:\/\/[^/]+/i, "").replace(/^\/+/, "");
  if (v.startsWith("images/")) v = v.slice(7);
  v = (v.split("/").pop() ?? v).replace(/^\d+_/, "");
  return v;
};
const img200fromBase = (base?: string) => (base ? `${IMAGES_BASE}/200_${toBaseName(base)}` : "");

// ---- types ----
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

// ---- auth helpers ----
const makeAuthHeaders = (token?: string): Headers => {
  const h = new Headers();
  if (token) h.set("Authorization", `Bearer ${token}`);
  return h;
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
  const headers = React.useMemo(() => makeAuthHeaders(token), [token]);
  const isAdmin = React.useMemo(() => hasAdminRoleFromToken(token), [token]);

  const [order, setOrder] = React.useState<OrderVm | null>(null);
  const [notFound, setNotFound] = React.useState(false);

  React.useEffect(() => {
    let aborted = false;
    (async () => {
      try {
        // 1) спроба знайти у списку замовлень поточного користувача
        const r1 = await fetch(`${API}/api/Orders/user/list`, { headers });
        const list1 = r1.ok ? await r1.json() : [];
        let found = Array.isArray(list1) ? list1.find((o: any) => String(o.id) === String(id)) : null;

        // 2) якщо не знайшли і ми Admin — беремо адмін-список
        if (!found && isAdmin) {
          const r2 = await fetch(`${API}/api/Orders/list`, { headers });
          // 🔧 BUGFIX: має бути r2.json(), а не r1.json()
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
  }, [id, headers, isAdmin]);

  const total = (order?.items ?? []).reduce((s, it) => s + (it.quantity ?? 0) * (Number(it.buyPrice) || 0), 0);

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

              {/* Позиції з одним прев’ю-зображенням */}
              <Grid container spacing={2}>
                {(order.items ?? []).map((it, idx) => {
                  const subtotal = (it.quantity ?? 0) * (Number(it.buyPrice) || 0);
                  const thumb = img200fromBase(it.productImage?.[0]);

                  return (
                    <Grid key={idx} item xs={12}>
                      <Card variant="outlined" sx={{ borderRadius: 3 }}>
                        <CardContent>
                          <Stack
                            direction={{ xs: "column", md: "row" }}
                            justifyContent="space-between"
                            alignItems="center"
                            spacing={2}
                          >
                            {/* прев’ю */}
                            <Box
                              sx={{
                                width: 72,
                                height: 72,
                                bgcolor: "#fff",
                                border: "1px solid #eee",
                                borderRadius: 2,
                                overflow: "hidden",
                                display: "grid",
                                placeItems: "center",
                                flexShrink: 0,
                              }}
                            >
                              {thumb ? (
                                <img
                                  src={thumb}
                                  alt={it.productName || `Товар #${it.productId}`}
                                  style={{ width: "100%", height: "100%", objectFit: "contain" }}
                                  onError={(e) => {
                                    const el = e.currentTarget as HTMLImageElement;
                                    const src = el.getAttribute("src") || "";
                                    if (src.includes("/200_")) el.src = src.replace("/200_", "/0_");
                                    else el.style.visibility = "hidden";
                                  }}
                                />
                              ) : null}
                            </Box>

                            {/* назва + ID */}
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography sx={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {it.productName || `Товар #${it.productId}`}
                              </Typography>
                              <Typography color="text.secondary" variant="body2">
                                ID: {it.productId}
                              </Typography>
                            </Box>

                            {/* кількість/ціна/сума */}
                            <Stack direction="row" spacing={2} sx={{ flexShrink: 0 }}>
                              <Typography>К-сть: <b>{it.quantity}</b></Typography>
                              <Typography>Ціна: <b>{Number(it.buyPrice).toFixed(2)}</b></Typography>
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
