import { Box, Typography, Link, TextField, IconButton } from "@mui/material";
import { Facebook, Instagram, YouTube } from "@mui/icons-material";
import CheckIcon from "@mui/icons-material/Check";

export default function Footer() {
  return (
    <Box
      sx={{
        background: "linear-gradient(90deg, #0D9488 0%, #023854 100%)",
        color: "#fff",
        px: { xs: 2, md: 10 },
        py: 6,
        mt: 10,
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          rowGap: 4,
        }}
      >
        {/* Колонка 1 */}
        <Box sx={{ minWidth: 200 }}>
          <Typography fontWeight="bold" mb={1}>
            Інформація про компанію
          </Typography>
          <Link href="#" underline="hover" color="inherit" display="block">Про нас</Link>
          <Link href="#" underline="hover" color="inherit" display="block">Політика конфіденційності</Link>
          <Link href="#" underline="hover" color="inherit" display="block">Каталог</Link>
        </Box>

        {/* Колонка 2 */}
        <Box sx={{ minWidth: 200 }}>
          <Typography fontWeight="bold" mb={1}>Допомога</Typography>
          <Link href="#" underline="hover" color="inherit" display="block">Доставка та оплата</Link>
          <Link href="#" underline="hover" color="inherit" display="block">Гарантія</Link>
          <Link href="#" underline="hover" color="inherit" display="block">Повернення товару</Link>
          <Link href="#" underline="hover" color="inherit" display="block">Сервісні центри</Link>
          <Link href="#" underline="hover" color="inherit" display="block">Контакти</Link>
        </Box>

        {/* Колонка 3 */}
        <Box sx={{ minWidth: 200 }}>
          <Typography fontWeight="bold" mb={1}>Партнерам</Typography>
          <Link href="#" underline="hover" color="inherit" display="block">Продавати на Nuvora</Link>
          <Link href="#" underline="hover" color="inherit" display="block">Співпраця</Link>
          <Link href="#" underline="hover" color="inherit" display="block">Оренда приміщень</Link>
        </Box>

        {/* Колонка 4 */}
        <Box sx={{ minWidth: 280 }}>
          <Typography fontWeight="bold" mb={1}>Підписка на новини</Typography>
          <Typography variant="body2" mb={1}>
            Дізнавайтесь першими про нові знижки та акції
          </Typography>
          <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
            <TextField
              placeholder="Електронна пошта"
              size="small"
              sx={{
                backgroundColor: "#fff",
                borderRadius: "10px",
                flex: 1,
              }}
            />
            <IconButton
              sx={{
                backgroundColor: "#fff",
                color: "#023854",
                borderRadius: "10px",
                ":hover": { backgroundColor: "#e5e7eb" },
              }}
            >
              <CheckIcon />
            </IconButton>
          </Box>
          <Typography fontWeight="bold" mb={1}>Соціальні мережі</Typography>
          <Box sx={{ display: "flex", gap: 2 }}>
            <IconButton sx={{ color: "#fff" }}><Facebook /></IconButton>
            <IconButton sx={{ color: "#fff" }}><Instagram /></IconButton>
            <IconButton sx={{ color: "#fff" }}><YouTube /></IconButton>
            
          </Box>
        </Box>
      </Box>

      <Box textAlign="center" mt={6}>
        <Typography variant="body2" sx={{ color: "#E5E5E5" }}>
          Copyright © 2025 Nuvora. Всі права захищені
        </Typography>
      </Box>
    </Box>
  );
}
