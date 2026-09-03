// MF Rides Backend API

const DEFAULT_API_URL = "http://localhost:4000";

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL?.trim() || DEFAULT_API_URL;

export class ApiError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
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

interface ApiResponse<T> {
  success?: boolean;
  message?: string;
  data?: T;
  error?: string;
  [key: string]: unknown;
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const {
    method = "GET",
    body,
    token,
  } = options;

  const cleanEndpoint = endpoint.startsWith("/")
    ? endpoint
    : `/${endpoint}`;

  const url = `${API_BASE_URL}${cleanEndpoint}`;

  console.log(`🌐 API ${method}:`, url);

  const controller = new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, 15000);

  try {
    const response = await fetch(url, {
      method,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...(token
          ? { Authorization: `Bearer ${token}` }
          : {}),
      },
      body:
        body !== undefined
          ? JSON.stringify(body)
          : undefined,
      signal: controller.signal,
    });

    const text = await response.text();

    let result: ApiResponse<T> | T | null = null;

    if (text) {
      try {
        result = JSON.parse(text);
      } catch {
        throw new ApiError(
          "Server returned invalid JSON.",
          response.status
        );
      }
    }

    console.log(
      `🌐 API Response ${response.status}:`,
      result
    );

    if (!response.ok) {
      const message =
        typeof result === "object" &&
        result !== null &&
        "message" in result
          ? String(result.message)
          : `Request failed with status ${response.status}`;

      throw new ApiError(message, response.status);
    }

    // Backend may return:
    // { success: true, data: ... }
    if (
      typeof result === "object" &&
      result !== null &&
      "data" in result
    ) {
      return (result as ApiResponse<T>).data as T;
    }

    return result as T;
  } catch (error: any) {
    if (error?.name === "AbortError") {
      throw new ApiError(
        "Request timed out. Please try again."
      );
    }

    if (error instanceof ApiError) {
      throw error;
    }

    console.error("❌ API Error:", error);

    throw new ApiError(
      "Unable to connect to MF Rides server."
    );
  } finally {
    clearTimeout(timeout);
  }
}