// MF Rides Backend API

// Web browser running on the same computer:
// http://localhost:4000
//
// Android emulator:
// http://10.0.2.2:4000
//
// Physical device on the same Wi-Fi:
// http://192.168.1.8:4000

const DEFAULT_API_URL = "http://localhost:4000";

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || DEFAULT_API_URL;

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  token?: string | null;
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { method = "GET", body, token } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (error) {
    console.error("API NETWORK ERROR:", error);

    throw new ApiError(
      "Can't reach the MF Rides server. Check your connection and try again.",
      0,
    );
  }

  let payload: unknown = null;

  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  const parsed = payload as {
    success?: boolean;
    message?: string;
    data?: T;
  } | null;

  if (!response.ok || !parsed?.success) {
    const message =
      parsed?.message ||
      `Request failed with status ${response.status}.`;

    throw new ApiError(message, response.status);
  }

  return parsed.data as T;
}