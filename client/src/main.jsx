import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { CartProvider } from "./context/CartContext.jsx";

// Global Styles & UI Libraries
import "tailwindcss/tailwind.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "./styles/global.css";

// Mount the React application
createRoot(document.getElementById("root")).render(
  <CartProvider>
    <App />
  </CartProvider>
);
