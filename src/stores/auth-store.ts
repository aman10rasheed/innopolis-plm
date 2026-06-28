"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { authenticate, credentialForRole, type DemoCredential, type Role } from "@/auth/credentials";

interface AuthState {
  user: DemoCredential | null;
  /** Validate email/password. Returns the matched user or null. */
  login: (email: string, password: string) => DemoCredential | null;
  /** One-click demo sign-in as a role. */
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
      loginAs: (role) => {
        const user = credentialForRole(role);
        set({ user });
        return user;
      },
      logout: () => set({ user: null }),
    }),
    { name: "innopolis-auth", storage: createJSONStorage(() => localStorage) },
  ),
);
