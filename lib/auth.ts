import { jwtDecode } from "jwt-decode";
import storage from "@/lib/storage";
import type { DecodedToken, UserRole } from "@/types";

export async function getToken(): Promise<string | null> {
  return storage.getItem("token");
}

export async function setToken(token: string): Promise<void> {
  await storage.setItem("token", token);
}

export async function clearAuth(): Promise<void> {
  await storage.removeItem("token");
  await storage.removeItem("role");
}

export function decodeToken(token: string): DecodedToken {
  return jwtDecode<DecodedToken>(token);
}

export async function getStoredRole(): Promise<UserRole | null> {
  const role = await storage.getItem("role");
  return role as UserRole | null;
}

export async function setStoredRole(role: UserRole): Promise<void> {
  await storage.setItem("role", role);
}

export function isTokenExpired(token: string): boolean {
  try {
    const decoded = decodeToken(token);
    return decoded.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}
