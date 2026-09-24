import { Outlet } from "react-router-dom";

/**
 * Shared layout wrapper for all admin routes.
 * Renders child admin pages via <Outlet />.
 * Individual pages manage their own container/spacing
 * since they have varying layout needs (font-sans, flex-col, etc.).
 */
export default function AdminLayout() {
  return <Outlet />;
}
