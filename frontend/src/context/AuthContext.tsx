import React, { createContext } from "react";
import { User } from "../types";

export interface AuthContextType {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  login: (userData: User, token: string, refreshToken: string) => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  tier: string;
  discount: number;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
