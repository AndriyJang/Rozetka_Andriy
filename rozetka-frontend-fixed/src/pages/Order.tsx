import * as React from "react";
import Layout from "../components/Layout";
import { useNavigate } from "react-router-dom";
import {
  Box, Container, Card, CardContent, Typography, Divider, Stack,
  TextField, Button, MenuItem, CircularProgress
} from "@mui/material";

const RAW_API = import.meta.env.VITE_API_URL ?? "";
const API = RAW_API.replace(/\/+$/, "");

type StatusItem = { id: number; name: string };
type CartItem = {
  id?: number;
  productId?: number;
  product?: { id?: number; name?: string; price?: number };
  name?: string;
  price?: number;
  quantity: number;
};

export default function Order() {
  const navigate = useNavigate();
  const token = React.useMemo(() => localStorage.getItem("token") ?? "", []);
  const authHeaders: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  const [statuses, setStatuses] = React.useState<StatusItem[]>([]);
  const [cart, setCart] = React.useState<CartItem[]>([]);

  const [form, setForm] = React.useState({
    consumerFirstName: "",
    consumerSecondName: "",
    consumerPhone: "",
    region: "",
    city: "",
    street: "",
    homeNumber: "",
    statusId: 0,
  });
  const onChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  React.useEffect(() => {
    let aborted = false;
    (async () => {
      try {
        const [stR, cartR] = await Promise.all([
          fetch(`${API}/api/Orders/status/list`, { headers: authHeaders }),
          fetch(`${API}/api/Cart/GetCart`, { headers: authHeaders }),
        ]);
        const st = stR.ok ? await stR.json() : [];
        const ct = cartR.ok ? await cartR.json() : [];
        if (aborted) return;
        setStatuses(Array.isArray(st) ? st : []);
        setCart(Array.isArray(ct) ? ct : []);
        setForm((f) => ({ ...f, statusId: st?.[0]?.id ?? 0 }));
      } finally { if (!aborted) setLoading(false); }
    })();
    return () => { aborted = true; };
  }, []);

  const buildOrderItems = () =>
    cart.map((c) => ({
      productId: Number(c.productId ?? c.product?.id ?? c.id ?? 0),
      quantity: Number(c.quantity ?? 0),
      buyPrice: Number(c.price ?? c.product?.price ?? 0),
    })).filter(i => i.productId > 0 && i.quantity > 0);

  const submit = async () => {
    const items = buildOrderItems();
    if (items.length === 0) { alert("Кошик порожній."); return; }
    setSubmitting(true);
    try {
      const payload = { ...form, statusId: Number(form.statusId), orderItems: items };
      const r = await fetch(`${API}/api/Orders/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify(payload),
      });
      if (!r.ok) throw new Error(await r.text());
      navigate("/account/order-history", { replace: true });
    } catch (e: any) {
      alert(e?.message || "Помилка створення замовлення");
    } finally { setSubmitting(false); }
  };

  return (
    <Layout>
      <Container maxWidth="lg">
        <Card elevation={0} sx={{ borderRadius: 3, p: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
            Формування замовлення
          </Typography>
          <Divider sx={{ mb: 2 }} />

          {loading ? (
            <Box sx={{ py: 6, display: "flex", justifyContent: "center" }}>
              <CircularProgress />
            </Box>
          ) : (
            <Stack spacing={2}>
              <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                <TextField fullWidth label="Ім'я" name="consumerFirstName" value={form.consumerFirstName} onChange={onChange} />
                <TextField fullWidth label="Прізвище" name="consumerSecondName" value={form.consumerSecondName} onChange={onChange} />
              </Stack>
              <TextField label="Телефон" name="consumerPhone" value={form.consumerPhone} onChange={onChange} />

              <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                <TextField fullWidth label="Область" name="region" value={form.region} onChange={onChange} />
                <TextField fullWidth label="Місто" name="city" value={form.city} onChange={onChange} />
              </Stack>
              <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                <TextField fullWidth label="Вулиця" name="street" value={form.street} onChange={onChange} />
                <TextField fullWidth label="№ будинку" name="homeNumber" value={form.homeNumber} onChange={onChange} />
              </Stack>

              <TextField select label="Статус" name="statusId" value={form.statusId} onChange={onChange}>
                {statuses.map(s => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
              </TextField>

              <Divider />
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Товари у замовленні</Typography>
              <Box sx={{ pl: 1 }}>
                {buildOrderItems().map((i, idx) => (
                  <Typography key={idx} variant="body2">• Товар #{i.productId} — {i.quantity} шт. × {i.buyPrice.toFixed(2)}</Typography>
                ))}
                {buildOrderItems().length === 0 && (
                  <Typography color="text.secondary">Кошик порожній.</Typography>
                )}
              </Box>

              <Box>
                <Button variant="contained" onClick={submit} disabled={submitting}>
                  {submitting ? "Створення…" : "Підтвердити замовлення"}
                </Button>
              </Box>
            </Stack>
          )}
        </Card>
      </Container>
    </Layout>
  );
}
