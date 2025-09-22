import { Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import RegisterUser from "./pages/RegisterUser";
import ProductSearch from "./pages/ProductSearch";
import ResetPassword from "./pages/ResetPassword";
import NewPassword from "./pages/NewPassword";
import Admin from "./pages/Admin";
import Product from "./pages/Product";           // це адмін “Товари”
import Categorie from "./pages/Categorie";
import OAuthCallback from "./pages/OAuthCallback";
import Cart from "./pages/Cart";
import ProductDetails from "./pages/ProductDetails"; //  новий імпорт
import ToastHost from "./components/ToastHost";

export default function App() {
  return (
    <>
    <Routes>
      <Route path="/" element={<Navigate to="/home" replace />} />
      <Route path="/home" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register-user" element={<RegisterUser />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/product-search" element={<ProductSearch />} />
      <Route path="/new-password" element={<NewPassword />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="/product" element={<Product />} />          {/* адмін */}
      <Route path="/product/:id" element={<ProductDetails />} />{/* перегляд товару */}
      <Route path="/categorie" element={<Categorie />} />
      <Route path="/oauth-callback" element={<OAuthCallback />} />
      <Route path="/cart" element={<Cart />} />
      <Route path="*" element={<div style={{ padding: 24 }}>Page not found</div>} />
    </Routes>
    <ToastHost />
    </>
  );
}
