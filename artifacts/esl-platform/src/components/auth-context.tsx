import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import type { Role } from "./role-context";

interface AuthUser {
  id: number;
  email: string;
  role: Role;
  totpEnabled: boolean;
  twoFactorVerified: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  requiresTwoFactor: boolean;
  requiresTotpSetup: boolean;
  login: (email: string, password: string) => Promise<{ requiresTwoFactor: boolean; requiresTotpSetup: boolean }>;
  verifyTotp: (code: string) => Promise<void>;
  setupTotp: () => Promise<{ qrCode: string; secret: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  requiresTwoFactor: false,
  requiresTotpSetup: false,
  login: async () => ({ requiresTwoFactor: false, requiresTotpSetup: false }),
  verifyTotp: async () => {},
  setupTotp: async () => ({ qrCode: "", secret: "" }),
  logout: async () => {},
});

const API_BASE = "/api";

function credentialFetch(url: string, options: RequestInit = {}) {
  return fetch(url, { ...options, credentials: "include" });
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false);
  const [requiresTotpSetup, setRequiresTotpSetup] = useState(false);
  const [hasSession, setHasSession] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      const res = await credentialFetch(`${API_BASE}/auth/me`);

      if (res.ok) {
        const data = await res.json();
        if (!data.totpEnabled) {
          setRequiresTotpSetup(true);
          setRequiresTwoFactor(false);
          setUser(data);
        } else if (data.totpEnabled && !data.twoFactorVerified) {
          setRequiresTwoFactor(true);
          setRequiresTotpSetup(false);
          setUser(data);
        } else {
          setUser(data);
          setRequiresTwoFactor(false);
          setRequiresTotpSetup(false);
        }
        setHasSession(true);
      } else {
        setHasSession(false);
        setUser(null);
      }
    } catch {
      setHasSession(false);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (email: string, password: string) => {
    const res = await credentialFetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.message || "Login failed");
    }

    const data = await res.json();
    setHasSession(true);

    if (!data.user.totpEnabled) {
      setRequiresTotpSetup(true);
      setRequiresTwoFactor(false);
      setUser(data.user);
      return { requiresTwoFactor: false, requiresTotpSetup: true };
    }

    if (data.requiresTwoFactor) {
      setRequiresTwoFactor(true);
      setRequiresTotpSetup(false);
      setUser(data.user);
      return { requiresTwoFactor: true, requiresTotpSetup: false };
    }

    setUser({ ...data.user, twoFactorVerified: true });
    setRequiresTwoFactor(false);
    setRequiresTotpSetup(false);
    return { requiresTwoFactor: false, requiresTotpSetup: false };
  };

  const verifyTotp = async (code: string) => {
    const res = await credentialFetch(`${API_BASE}/auth/totp/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.message || "Verification failed");
    }

    setRequiresTwoFactor(false);
    setRequiresTotpSetup(false);
    if (user) {
      setUser({ ...user, totpEnabled: true, twoFactorVerified: true });
    }
  };

  const setupTotp = async () => {
    const res = await credentialFetch(`${API_BASE}/auth/totp/setup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.message || "TOTP setup failed");
    }

    return res.json();
  };

  const logout = async () => {
    try {
      await credentialFetch(`${API_BASE}/auth/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
    } catch {}

    setUser(null);
    setHasSession(false);
    setRequiresTwoFactor(false);
    setRequiresTotpSetup(false);
  };

  const isAuthenticated = !!user && !requiresTwoFactor && !requiresTotpSetup;

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated,
        requiresTwoFactor,
        requiresTotpSetup,
        login,
        verifyTotp,
        setupTotp,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
