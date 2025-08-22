import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import RegisterUser from "./pages/RegisterUser";
import ProductSearch from "./pages/ProductSearch";
import ResetPassword from "./pages/ResetPassword";
import NewPassword from "./pages/NewPassword";
import Admin from "./pages/Admin";
import OAuthCallback from "./pages/OAuthCallback";

export default function App() {
  return (
    <Routes>
      {/* корінь редіректимо на /login */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      <Route path="/login" element={<Login />} />
      <Route path="/register-user" element={<RegisterUser />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/product-search" element={<ProductSearch />} />
      <Route path="/new-password" element={<NewPassword />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="/oauth-callback" element={<OAuthCallback />} />
      {/* 404 */}
      <Route path="*" element={<div style={{ padding: 24 }}>Page not found</div>} />
    </Routes>
  );
}
