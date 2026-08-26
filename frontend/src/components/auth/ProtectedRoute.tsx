import { Navigate } from "react-router-dom";

import { ReactNode } from "react";

export default function ProtectedRoute({ children, roleRequired }: { children: ReactNode, roleRequired?: string }) {
  const token = localStorage.getItem("token");
  // Safely parse user data from local storage
  let user = null;
  try {
    user = JSON.parse(localStorage.getItem("user") || "null");
  } catch (e) {
    user = null;
  }

  // Redirect to login if not authenticated
  if (!token || !user) return <Navigate to="/login" />;

  // Check for specific role requirements
  if (roleRequired && user.role !== roleRequired) {
    return (
      <p className="text-center mt-8 text-red-500 font-bold">
        No access permission!
      </p>
    );
  }

  // Render protected content
  return children;
}
