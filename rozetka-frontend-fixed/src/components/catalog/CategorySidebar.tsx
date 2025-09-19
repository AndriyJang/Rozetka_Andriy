// src/components/catalog/CategorySidebar.tsx
import { Paper, Typography, Box, Button } from "@mui/material";

export type CategoryDto = { id: number; name: string; slug?: string };

export default function CategorySidebar({
  items,
  exactHeight,
  activeId,
  onSelect,
}: {
  items: CategoryDto[];
  exactHeight?: number;                  // точна висота контейнера (з Home)
  activeId?: number | null;              // активна категорія (null => всі товари)
  onSelect?: (id: number | null) => void; // клік по пункту
}) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        borderRadius: 3,
        height: exactHeight ? `${exactHeight}px` : "100%",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        gap: 1,
      }}
    >
      <Typography variant="h6" sx={{ fontWeight: 800, color: "#023854", mb: 1 }}>
        Категорії
      </Typography>

      {/* Рівномірний вертикальний розподіл пунктів */}
      <Box sx={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-evenly" }}>
        {/* ПЕРШИЙ пункт — активний за замовчуванням: всі товари */}
        <Button
          onClick={() => onSelect?.(null)}
          variant={activeId == null ? "contained" : "text"}
          sx={{
            justifyContent: "flex-start",
            textTransform: "none",
            borderRadius: 2,
            px: 1,
            ...(activeId == null
              ? {
                  background: "linear-gradient(90deg, #023854 0%, #035B94 100%)",
                  color: "#fff",
                }
              : { color: "#023854" }),
          }}
        >
          Усі товари
        </Button>

        {/* Далі — реальні категорії */}
        {items.map((c) => {
          const active = activeId === c.id;
          return (
            <Button
              key={c.id}
              onClick={() => onSelect?.(c.id)}
              variant={active ? "contained" : "text"}
              sx={{
                justifyContent: "flex-start",
                textTransform: "none",
                borderRadius: 2,
                px: 1,
                ...(active
                  ? {
                      background: "linear-gradient(90deg, #023854 0%, #035B94 100%)",
                      color: "#fff",
                    }
                  : { color: "#023854" }),
              }}
            >
              {c.name}
            </Button>
          );
        })}
      </Box>
    </Paper>
  );
}
