import { createContext, useContext, useEffect, useState } from "react";
import { endpoints, getToken, setToken, onUnauthorized } from "../lib/api.js";
import { connect as rtConnect, disconnect as rtDisconnect } from "../lib/realtime.js";

const AuthContext = createContext(null);

export const ROLES = {
  ADMIN: "admin",
  PRINCIPAL: "principal",
  TEACHER: "teacher",
  STUDENT: "student",
  PARENT: "parent",
  ACCOUNTANT: "accountant",
  HR: "hr",
};

// Email-per-role shortcuts. Password is set on the backend (see data/users.js).
// We expose the demo password so the role-picker can autofill it.
export const DEMO_PASSWORD = "lumina1234";
export const ROLE_EMAILS = {
  admin: "admin@lumina.edu",
  principal: "principal@lumina.edu",
  teacher: "teacher@lumina.edu",
  student: "student@lumina.edu",
  parent: "parent@lumina.edu",
  accountant: "accountant@lumina.edu",
  hr: "hr@lumina.edu",
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(!!getToken());

  // Bootstrap from existing token (if any)
  useEffect(() => {
    const t = getToken();
    if (!t) {
      setLoading(false);
      return;
    }
    endpoints
      .me()
      .then((res) => {
        setUser(res.user);
        rtConnect(t); // resume realtime stream after page reload
      })
      .catch(() => {
        setToken(null);
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  // Listen for 401s from anywhere → log out (also kills the realtime socket)
  useEffect(() => {
    return onUnauthorized(() => {
      rtDisconnect();
      setUser(null);
    });
  }, []);

  const finalizeSession = (res) => {
    setToken(res.token);
    setUser(res.user);
    rtConnect(res.token);
    return res.user;
  };

  const login = async ({ email, password }) => {
    const res = await endpoints.login({ email, password });
    // Account has 2FA — caller must complete the challenge before a session
    // is established.
    if (res.twoFactorRequired) {
      return { twoFactorRequired: true, challengeToken: res.challengeToken };
    }
    return finalizeSession(res);
  };

  // Complete a 2FA login by exchanging the challenge token + authenticator code.
  const completeTwoFactorLogin = async (challengeToken, code) => {
    const res = await endpoints.twoFactorLogin(challengeToken, code);
    return finalizeSession(res);
  };

  const logout = () => {
    rtDisconnect();
    setToken(null);
    setUser(null);
  };

  // Refresh the cached `user` after a profile / password change so the topbar
  // and other consumers re-render with the latest values.
  const refreshUser = async () => {
    try {
      const res = await endpoints.me();
      setUser(res.user);
      return res.user;
    } catch {
      return null;
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, completeTwoFactorLogin, logout, loading, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
