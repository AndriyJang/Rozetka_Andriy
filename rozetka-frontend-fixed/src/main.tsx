
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { GoogleOAuthProvider } from '@react-oauth/google';

createRoot(document.getElementById("root")!).render(
  
    <BrowserRouter>
    <GoogleOAuthProvider clientId="158619346476-h7so7nkkbakinrtsjvilchuj8up2vqmi.apps.googleusercontent.com">
      <App />
      </GoogleOAuthProvider>
    </BrowserRouter>
  
);
