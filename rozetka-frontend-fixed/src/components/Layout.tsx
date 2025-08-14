import Header from "./Header";
import Footer from "./Footer";
import { Box } from "@mui/material";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh", // щоб футер був внизу
        backgroundColor: "#F1F5F5", // твій світлий фон
      }}
    >
      <Header />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          px: 2,
          py: 4,
        }}
      >
        {children}
      </Box>

      <Footer />
    </Box>
  );
}
