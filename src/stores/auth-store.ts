"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { authenticate, credentialForRole, type DemoCredential, type Role } from "@/auth/credentials";
import { api } from "@/lib/api/endpoints";
import { tokenStore, setUnauthorizedHandler } from "@/lib/api/client";

interface AuthState {
  user: DemoCredential | null;
  /** Mock validate email/password (USE_API=false). Returns matched user or null. */
  login: (email: string, password: string) => DemoCredential | null;
  /** Real backend login (USE_API=true). Stores JWT + user. Throws on failure. */
  loginRemote: (email: string, password: string) => Promise<DemoCredential>;
  /** One-click demo sign-in as a role (mock mode). */
  loginAs: (role: Role) => DemoCredential;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      login: (email, password) => {
        const user = authenticate(email, password);
        if (user) set({ user });
        return user;
      },
      loginRemote: async (email, password) => {
        const { token, user } = await api.auth.login(email, password);
        tokenStore.set(token);
        const cred: DemoCredential = {
          email: user.email,
          password: "",
          role: user.role,
          name: user.name,
          initials: user.initials,
          hue: user.hue,
        };
        set({ user: cred });
        return cred;
      },
      loginAs: (role) => {
        const user = credentialForRole(role);
        set({ user });
        return user;
      },
      logout: () => {
        tokenStore.clear();
        set({ user: null });
      },
    }),
    { name: "innopolis-auth", storage: createJSONStorage(() => localStorage) },
  ),
);

// On any 401 from the API client, drop the session so the gate shows login.
setUnauthorizedHandler(() => useAuthStore.getState().logout());
