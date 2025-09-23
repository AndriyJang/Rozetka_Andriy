import { Box, Typography, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { motion, AnimatePresence } from "framer-motion";
import type { ReactNode } from "react";

type IntroSplashProps = {
  open: boolean;
  onClose?: () => void;
  inline?: boolean;
  title?: string;
  /** 🔥 нове: те, що малюємо всередині (наша картка-тизер) */
  children?: ReactNode;
};

export default function IntroSplash({
  open,
  onClose,
  inline = false,
  title = "Нуворра це круто!!!",
  children,
}: IntroSplashProps) {
  return (
    <AnimatePresence>
      {open && (
        <Box
          component={motion.div}
          initial={{ opacity: 0, y: inline ? -8 : 0 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: inline ? -8 : 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 24 }}
          sx={{
            ...(inline
              ? {
                  mt: 2,
                  p: { xs: 2, sm: 2.5 },
                  borderRadius: 3,
                  border: "1px solid rgba(2,56,84,0.08)",
                  bgcolor: "#fff",
                  position: "relative",
                  overflow: "hidden",
                }
              : {
                  position: "fixed",
                  inset: 0,
                  zIndex: 1400,
                  display: "grid",
                  placeItems: "center",
                  backdropFilter: "blur(2px)",
                  background: "rgba(2,56,84,0.06)",
                  p: 2,
                }),
          }}
        >
          <Box
            sx={{
              ...(inline
                ? { width: "100%" }
                : { width: "min(680px, 92vw)", maxWidth: 680, mx: "auto" }),
              p: { xs: 2.5, sm: 3 },
              borderRadius: 4,
              bgcolor: "#fff",
              border: "1px solid rgba(2,56,84,0.08)",
              boxShadow: 8,
              position: "relative",
              overflow: "hidden",
            }}
          >
            {!!onClose && (
              <IconButton
                size="small"
                onClick={onClose}
                sx={{ position: "absolute", top: 10, right: 10 }}
                aria-label="Закрити"
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            )}

            {/* Банер */}
            <Box
              component={motion.div}
              initial={{ y: -8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ type: "spring", stiffness: 380, damping: 26 }}
              sx={{
                display: "inline-block",
                px: 2.5,
                py: 0.75,
                mb: 1.5,
                borderRadius: 999,
                background: "linear-gradient(90deg, #023854 0%, #035B94 100%)",
                color: "#fff",
                boxShadow: 3,
              }}
            >
              <Typography sx={{ fontWeight: 900, letterSpacing: 0.3 }}>
                {title}
              </Typography>
            </Box>

            {/* 🔥 якщо передали children — показуємо його (нашу 1 картку з анімацією),
                інакше — fallback: три міні-картки-муляжі */}
            {children ? (
              <Box>{children}</Box>
            ) : (
              <Box sx={{ display: "flex", gap: 1.25, justifyContent: "center" }}>
                {[0, 1, 2].map((i) => (
                  <Box
                    key={i}
                    component={motion.div}
                    initial={{ y: 20, opacity: 0, rotate: -1 }}
                    animate={{ y: 0, opacity: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 420, damping: 24, delay: i * 0.06 }}
                    sx={{
                      width: { xs: 86, sm: 100 },
                      height: { xs: 112, sm: 130 },
                      borderRadius: 3,
                      background: "#fff",
                      boxShadow: 6,
                      border: "1px solid rgba(2,56,84,0.08)",
                      position: "relative",
                    }}
                  >
                    <Box
                      sx={{
                        position: "absolute",
                        top: 10,
                        left: 10,
                        right: 10,
                        height: "52%",
                        borderRadius: 2,
                        bgcolor: "#f5f7f9",
                      }}
                    />
                    <Box sx={{ position: "absolute", left: 10, right: 10, bottom: 10 }}>
                      <Box sx={{ height: 8, borderRadius: 10, bgcolor: "rgba(2,56,84,0.2)", mb: 0.6 }} />
                      <Box sx={{ height: 8, width: "70%", borderRadius: 10, bgcolor: "rgba(2,56,84,0.15)", mb: 1 }} />
                      <Box sx={{ height: 10, width: "40%", borderRadius: 10, bgcolor: "#0b8a83" }} />
                    </Box>
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        </Box>
      )}
    </AnimatePresence>
  );
}
