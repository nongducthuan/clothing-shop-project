import type { Metadata } from "next";
import RegisterClient from "./RegisterClient";

export const metadata: Metadata = {
  title: "Đăng ký tài khoản | Shop",
};

export default function RegisterPage() {
  return <RegisterClient />;
}
