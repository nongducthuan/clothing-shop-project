import type { Metadata } from "next";
import LoginClient from "./LoginClient";

export const metadata: Metadata = {
  title: "Đăng nhập | Shop",
};

export default function LoginPage() {
  return <LoginClient />;
}
