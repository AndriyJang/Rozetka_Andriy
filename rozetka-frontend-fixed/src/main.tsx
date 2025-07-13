import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import RegisterUser from "./pages/RegisterUser";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RegisterUser />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
