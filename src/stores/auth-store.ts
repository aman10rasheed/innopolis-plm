"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { authenticate, credentialForRole, type DemoCredential, type Role } from "@/auth/credentials";
import { api } from "@/lib/api/endpoints";
import { tokenStore, setUnauthorizedHandler, setPasswordChangeHandler } from "@/lib/api/client";

interface AuthState {
  user: DemoCredential | null;
  /** True when the backend says this account must change its password before continuing. */
  mustChangePassword: boolean;
  /** Mock validate email/password (USE_API=false). Returns matched user or null. */
  login: (email: string, password: string) => DemoCredential | null;
  /** Real backend login (USE_API=true). Stores JWT + user. Throws on failure. */
  loginRemote: (email: string, password: string) => Promise<DemoCredential>;
  /** Forced first-login change: swaps in a fresh unrestricted token + clears the gate. */
  setPassword: (currentPassword: string, newPassword: string) => Promise<void>;
  /** One-click demo sign-in as a role (mock mode). */
  loginAs: (role: Role) => DemoCredential;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      mustChangePassword: false,
      login: (email, password) => {
        const user = authenticate(email, password);
        if (user) set({ user, mustChangePassword: false });
        return user;
      },
      loginRemote: async (email, password) => {
        const { token, user, must_change_password } = await api.auth.login(email, password);
        tokenStore.set(token);
        const cred: DemoCredential = {
          email: user.email,
          password: "",
          role: user.role,
          name: user.name,
          initials: user.initials,
          hue: user.hue,
        };
        set({ user: cred, mustChangePassword: Boolean(must_change_password) });
        return cred;
      },
      setPassword: async (currentPassword, newPassword) => {
        const { token, user } = await api.auth.setPassword(currentPassword, newPassword);
        tokenStore.set(token);
        const cred: DemoCredential = {
          email: user.email,
          password: "",
          role: user.role,
          name: user.name,
          initials: user.initials,
          hue: user.hue,
        };
        set({ user: cred, mustChangePassword: false });
      },
      loginAs: (role) => {
        const user = credentialForRole(role);
        set({ user, mustChangePassword: false });
        return user;
      },
      logout: () => {
        tokenStore.clear();
        set({ user: null, mustChangePassword: false });
      },
    }),
    { name: "innopolis-auth", storage: createJSONStorage(() => localStorage) },
  ),
);

// On any 401 from the API client, drop the session so the gate shows login.
setUnauthorizedHandler(() => useAuthStore.getState().logout());

// On a 403 PASSWORD_CHANGE_REQUIRED, raise the gate instead of logging out so the
// user can set a new password with their still-valid (restricted) token.
setPasswordChangeHandler(() => {
  if (useAuthStore.getState().user) useAuthStore.setState({ mustChangePassword: true });
});
