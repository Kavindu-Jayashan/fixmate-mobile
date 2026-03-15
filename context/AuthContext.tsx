import React, { createContext, useContext, useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import storage from "@/lib/storage";
import type { DecodedToken, UserRole } from "@/types";

interface AuthContextType {
  token: string | null;
  role: UserRole | null;
  email: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  token: null,
  role: null,
  email: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore token on app launch
  useEffect(() => {
    (async () => {
      try {
        const stored = await storage.getItem("token");
        if (stored) {
          const decoded = jwtDecode<DecodedToken>(stored);
          if (decoded.exp * 1000 > Date.now()) {
            setToken(stored);
            setRole(decoded.role);
            setEmail(decoded.sub);
          } else {
            await storage.removeItem("token");
            await storage.removeItem("role");
          }
        }
      } catch {
        await storage.removeItem("token");
        await storage.removeItem("role");
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const login = async (newToken: string) => {
    const decoded = jwtDecode<DecodedToken>(newToken);
    await storage.setItem("token", newToken);
    await storage.setItem("role", decoded.role);
    setToken(newToken);
    setRole(decoded.role);
    setEmail(decoded.sub);
  };

  const logout = async () => {
    await storage.removeItem("token");
    await storage.removeItem("role");
    setToken(null);
    setRole(null);
    setEmail(null);
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        role,
        email,
        isAuthenticated: !!token,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
