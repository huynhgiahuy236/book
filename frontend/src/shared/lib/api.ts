export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";
export const TOKEN_KEY = "capstone-access-token";

export type SessionUser = { id: string; name: string; email: string; role: "USER" | "ADMIN"; avatarUrl?: string | null; provider?: "LOCAL" | "GOOGLE" };

export class ApiError extends Error {
  constructor(message: string, public readonly status: number) { super(message); }
}

export function getToken() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function saveToken(token: string) {
  window.localStorage.setItem(TOKEN_KEY, token);
  window.dispatchEvent(new Event("capstone-auth"));
}

export function clearToken() {
  window.localStorage.removeItem(TOKEN_KEY);
  window.dispatchEvent(new Event("capstone-auth"));
}

async function request<T>(path: string, init: RequestInit, authenticated: boolean, retry: boolean): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body) headers.set("Content-Type", "application/json");
  if (authenticated) {
    const token = getToken();
    if (!token && retry) {
      const refresh = await fetch(`${API_URL}/auth/refresh`, { method: "POST", credentials: "include" });
      if (refresh.ok) {
        const session = await refresh.json() as { accessToken: string };
        saveToken(session.accessToken);
        return request<T>(path, init, authenticated, false);
      }
    }
    if (!getToken()) throw new ApiError("Bạn cần đăng nhập", 401);
    headers.set("Authorization", `Bearer ${getToken()}`);
  }
  const response = await fetch(`${API_URL}${path}`, { ...init, headers, credentials: "include" });
  if (response.status === 401 && authenticated && retry) {
    const refresh = await fetch(`${API_URL}/auth/refresh`, { method: "POST", credentials: "include" });
    if (refresh.ok) {
      const session = await refresh.json() as { accessToken: string };
      saveToken(session.accessToken);
      return request<T>(path, init, authenticated, false);
    }
    clearToken();
  }
  const payload = await response.json().catch(() => null) as { message?: string | string[] } | null;
  if (!response.ok) {
    const message = Array.isArray(payload?.message) ? payload.message[0] : payload?.message;
    throw new ApiError(message ?? "Không thể kết nối máy chủ", response.status);
  }
  return payload as T;
}

export function api<T>(path: string, init: RequestInit = {}, authenticated = false): Promise<T> {
  return request<T>(path, init, authenticated, true);
}

export async function getCurrentUser() {
  try { return await api<SessionUser>("/auth/me", {}, true); }
  catch { return null; }
}
