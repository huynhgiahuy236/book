export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";
export const TOKEN_KEY = "capstone-access-token";

export type SessionUser = { id: string; name: string; email: string; role: "USER" | "ADMIN" };

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

export async function api<T>(path: string, init: RequestInit = {}, authenticated = false): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body) headers.set("Content-Type", "application/json");
  if (authenticated) {
    const token = getToken();
    if (!token) throw new Error("Bạn cần đăng nhập");
    headers.set("Authorization", `Bearer ${token}`);
  }
  const response = await fetch(`${API_URL}${path}`, { ...init, headers });
  const payload = await response.json().catch(() => null) as { message?: string | string[] } | null;
  if (!response.ok) {
    if (response.status === 401) clearToken();
    const message = Array.isArray(payload?.message) ? payload.message[0] : payload?.message;
    throw new Error(message ?? "Không thể kết nối máy chủ");
  }
  return payload as T;
}

export async function getCurrentUser() {
  if (!getToken()) return null;
  try { return await api<SessionUser>("/auth/me", {}, true); }
  catch { return null; }
}
