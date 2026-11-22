import { configureShared } from "@shop/shared/config";

const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
const imageUrl = process.env.NEXT_PUBLIC_IMAGE_URL || "http://localhost:5000";
const socketUrl = apiUrl.replace(/\/api$/, "");

configureShared({
  apiUrl,
  imageUrl,
  socketUrl,
});
