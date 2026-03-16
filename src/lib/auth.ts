import Cookies from "js-cookie";
import api from "./api";
import type { TokenResponse, User } from "@/types";

export async function login(email: string, password: string): Promise<TokenResponse> {
  const { data } = await api.post<TokenResponse>("/api/v1/auth/login", { email, password });
  Cookies.set("admin_access_token", data.access_token, { expires: 1 });
  Cookies.set("admin_refresh_token", data.refresh_token, { expires: 30 });
  return data;
}

export async function logout(): Promise<void> {
  const refreshToken = Cookies.get("admin_refresh_token");
  if (refreshToken) {
    try {
      await api.post("/api/v1/auth/logout", { refresh_token: refreshToken });
    } catch {
      // Ignore errors during logout
    }
  }
  Cookies.remove("admin_access_token");
  Cookies.remove("admin_refresh_token");
}

export async function getMe(): Promise<User> {
  const { data } = await api.get<User>("/api/v1/auth/me");
  return data;
}

export function getAccessToken(): string | undefined {
  return Cookies.get("admin_access_token");
}

export function isAuthenticated(): boolean {
  return !!Cookies.get("admin_access_token");
}
