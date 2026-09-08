import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { CartProvider } from "./context/CartContext.tsx";

// Global Styles — processed by Vite + PostCSS + Tailwind
// (phải import từ src/ để PostCSS scan đúng dark: variants)
import "./styles/index.css";

// Mount the React application
const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Root element not found");

createRoot(rootElement).render(
  <StrictMode>
    <CartProvider>
      <App />
    </CartProvider>
  </StrictMode>
);
