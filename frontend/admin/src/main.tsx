import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { configureShared } from "@shop/shared/config";
import App from "./App";
import "./styles/index.css";
import "./styles/app.css";

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const imageUrl = import.meta.env.VITE_IMAGE_URL || "http://localhost:5000";
const socketUrl = apiUrl.replace(/\/api$/, "");

configureShared({
  apiUrl,
  imageUrl,
  socketUrl,
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
