import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { ApiError } from "../api/client";
import { fetchMe, login as loginRequest, registerRider } from "../api/auth";
import type { LoginPayload, PublicUser, RegisterPayload } from "../api/auth";

const TOKEN_STORAGE_KEY = "mf-rider/auth-token";

interface AuthContextValue {
  user: PublicUser | null;
  token: string | null;
  isRestoring: boolean;
  isSubmitting: boolean;
  register: (payload: RegisterPayload) => Promise<void>;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isRestoring, setIsRestoring] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // On app launch: try to restore a previously-saved session.
  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      try {
        const savedToken = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
        if (!savedToken) return;

        const { user: restoredUser } = await fetchMe(savedToken);
        if (cancelled) return;
        setToken(savedToken);
        setUser(restoredUser);
      } catch {
        // Saved token is missing, expired, or invalid — clear it and fall back to logged-out.
        await AsyncStorage.removeItem(TOKEN_STORAGE_KEY);
        setToken(null);
        setUser(null);
      } finally {
        if (!cancelled) setIsRestoring(false);
      }
    }

    restoreSession();
    return () => {
      cancelled = true;
    };
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    setIsSubmitting(true);
    try {
      const result = await registerRider(payload);
      await AsyncStorage.setItem(TOKEN_STORAGE_KEY, result.token);
      setToken(result.token);
      setUser(result.user);
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const login = useCallback(async (payload: LoginPayload) => {
    setIsSubmitting(true);
    try {
      const result = await loginRequest(payload);
      await AsyncStorage.setItem(TOKEN_STORAGE_KEY, result.token);
      setToken(result.token);
      setUser(result.user);
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const logout = useCallback(async () => {
    await AsyncStorage.removeItem(TOKEN_STORAGE_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, token, isRestoring, isSubmitting, register, login, logout }),
    [user, token, isRestoring, isSubmitting, register, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}

export { ApiError };
