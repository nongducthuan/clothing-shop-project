import { createContext, useState, useEffect } from "react";
import API from "../services/apiClient";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("user")) || null
  );

  const tier = user?.tier_name || "Normal";
  const discount = user?.discount_percent || 0;

  // Auto-refresh user data on mount
  useEffect(() => {
    refreshUser();
  }, []);

  const login = (userData, token) => {
    setUser(userData);
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.clear();
    window.location.href = "/login";
  };

  const refreshUser = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await API.get("/auth/me");

      if (res.data) {
        // Merge old user data with new data (e.g., updated tier)
        setUser((prev) => {
          const updatedUser = { ...prev, ...res.data };
          localStorage.setItem("user", JSON.stringify(updatedUser));
          return updatedUser;
        });
      }
    } catch (err) {
      console.error("Refresh user error", err);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, setUser, login, logout, refreshUser, tier, discount }}
    >
      {children}
    </AuthContext.Provider>
  );
};
