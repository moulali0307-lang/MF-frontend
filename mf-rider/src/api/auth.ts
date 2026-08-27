import { apiRequest } from "./client";

export type UserRole = "RIDER" | "PARTNER" | "ADMIN";

export interface PublicUser {
  id: string;
  fullName: string;
  phoneNumber: string;
  email: string | null;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResult {
  user: PublicUser;
  token: string;
}

export interface RegisterPayload {
  fullName: string;
  phoneNumber: string;
  email?: string;
  password: string;
}

export interface LoginPayload {
  phoneNumber: string;
  password: string;
}

export function registerRider(payload: RegisterPayload): Promise<AuthResult> {
  // Role is fixed to RIDER here — this is the MF Rider app only.
  return apiRequest<AuthResult>("/api/auth/register", {
    method: "POST",
    body: { ...payload, role: "RIDER" },
  });
}

export function login(payload: LoginPayload): Promise<AuthResult> {
  return apiRequest<AuthResult>("/api/auth/login", {
    method: "POST",
    body: payload,
  });
}

export function fetchMe(token: string): Promise<{ user: PublicUser }> {
  return apiRequest<{ user: PublicUser }>("/api/auth/me", {
    method: "GET",
    token,
  });
}
