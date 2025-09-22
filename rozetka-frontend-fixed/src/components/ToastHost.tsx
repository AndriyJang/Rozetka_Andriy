// src/components/ToastHost.tsx
import { Snackbar, Alert, Slide } from "@mui/material";
import type { SlideProps } from "@mui/material";
import { useEffect, useMemo, useState } from "react";

type ToastPayload = {
  message: string;
  severity?: "success" | "info" | "warning" | "error";
  duration?: number;
};

// Виклик: toast("Додано в кошик", { severity: "success", duration: 3000 })
export function toast(message: string, opts: Omit<ToastPayload, "message"> = {}) {
  const detail: ToastPayload = {
    message,
    severity: "success",
    duration: 3200,
    ...opts,
  };
  window.dispatchEvent(new CustomEvent<ToastPayload>("app:toast", { detail }));
}

function SlideDown(props: SlideProps) {
  return <Slide {...props} direction="down" />;
}

export default function ToastHost() {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<ToastPayload>({
    message: "",
    severity: "success",
    duration: 3200,
  });

  // Мемоізовані стилі для різних типів
  const colorStyles = useMemo(() => {
    const common = {
      borderWidth: 2,
      borderStyle: "solid",
      boxShadow:
        "0px 12px 28px rgba(2,56,84,0.25), 0 2px 6px rgba(2,56,84,0.12)",
      color: "#fff",
      fontWeight: 700,
      px: 3,
      py: 2,
      fontSize: 16,
      borderRadius: 2,
      "& .MuiAlert-icon": { mr: 1.25, fontSize: 22 },
      "& .MuiAlert-message": { fontSize: 16, lineHeight: 1.35 },
    } as const;

    return {
      success: {
        ...common,
        bgcolor: "#0EA5A3",
        borderColor: "#0B8A83",
      },
      info: {
        ...common,
        bgcolor: "#035B94",
        borderColor: "#023854",
      },
      warning: {
        ...common,
        bgcolor: "#F59E0B",
        borderColor: "#D97706",
      },
      error: {
        ...common,
        bgcolor: "#EF4444",
        borderColor: "#DC2626",
      },
    };
  }, []);

  useEffect(() => {
    const onToast = (e: Event) => {
      const ev = e as CustomEvent<ToastPayload>;
      setData({
        message: ev.detail?.message ?? "",
        severity: ev.detail?.severity ?? "success",
        duration: ev.detail?.duration ?? 3200,
      });
      setOpen(true);
    };
    window.addEventListener("app:toast", onToast as EventListener);
    return () => window.removeEventListener("app:toast", onToast as EventListener);
  }, []);

  return (
    <Snackbar
      open={open}
      autoHideDuration={data.duration}
      onClose={(_, reason) => {
        if (reason === "clickaway") return;
        setOpen(false);
      }}
      anchorOrigin={{ vertical: "top", horizontal: "center" }}
      TransitionComponent={SlideDown}
      // ширина + шар зверху щоб перекривало інші елементи
      sx={{
        zIndex: (t) => Math.max(1400, t.zIndex.modal + 1),
        "& .MuiSnackbarContent-root": { p: 0, bgcolor: "transparent" },
      }}
    >
      <Alert
        onClose={() => setOpen(false)}
        severity={data.severity ?? "success"}
        variant="filled"
        sx={
          colorStyles[
            (data.severity ?? "success") as keyof typeof colorStyles
          ]
        }
      >
        {data.message}
      </Alert>
    </Snackbar>
  );
}
