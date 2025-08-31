// src/pages/OAuthCallback.tsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

// простий декодер
function decodeJwt(token: string) {
  try {
    const [, payload] = token.split(".");
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(decodeURIComponent(escape(json)));
  } catch { return null; }
}

export default function OAuthCallback() {
  const navigate = useNavigate();
  useEffect(() => {
    const hash = window.location.hash;     // #token=eyJ...
    const token = new URLSearchParams(hash.slice(1)).get("token");
    if (token) {
      localStorage.setItem("token", token);
      const payload = decodeJwt(token) || {};
      const roles = Array.isArray(payload.roles) ? payload.roles : (payload.roles ? [payload.roles] : []);
      navigate(roles.includes("Admin") ? "/admin" : "/product-search", { replace: true });
    } else {
      navigate("/login", { replace: true });
    }
  }, [navigate]);
  return null;
}
