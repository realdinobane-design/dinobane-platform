import { apiRequest } from "./queryClient";

export interface AuthUser {
  id: number;
  username: string;
  email: string;
  displayName: string;
  avatarInitials: string;
  avatarColor: string;
  avatarUrl: string | null;
  isMember: boolean;
  memberSince: string | null;
  createdAt: string;
}

export async function login(email: string, password: string): Promise<AuthUser> {
  const res = await apiRequest("POST", "/api/auth/login", { email, password });
  return res.json();
}

export async function register(data: {
  email: string;
  username: string;
  displayName?: string;
  password: string;
}): Promise<{ ok: true; message: string }> {
  const res = await apiRequest("POST", "/api/auth/register", data);
  return res.json();
}

export async function logout(): Promise<void> {
  await apiRequest("POST", "/api/auth/logout");
}

export async function getMe(): Promise<AuthUser | null> {
  try {
    const res = await fetch("/api/auth/me", { credentials: "include" });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}
