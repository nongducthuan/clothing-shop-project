import { createContext, useState, useEffect, ReactNode } from "react";
import API from "../services/apiClient";
import { User } from "../types";

// --------------- Types ---------------

interface AuthContextType {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  login: (userData: User, token: string) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
  tier: string;
  discount: number;
}

interface AuthProviderProps {
  children: ReactNode;
}

// --------------- Context ---------------

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(
    JSON.parse(localStorage.getItem("user") ?? "null")
  );

  const tier = user?.tier_name ?? "Normal";
  const discount = user?.discount_percent ?? 0;

  // Auto-refresh user data on mount
  useEffect(() => {
    refreshUser();
  }, []);

  const login = (userData: User, token: string) => {
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
          const updatedUser = { ...prev, ...res.data } as User;
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
