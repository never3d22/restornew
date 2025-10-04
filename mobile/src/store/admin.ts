import { create } from "zustand";

export type AdminState = {
  adminSecret?: string;
  setAdminSecret: (secret: string) => void;
  clearAdminSecret: () => void;
};

export const useAdminStore = create<AdminState>((set) => ({
  adminSecret: undefined,
  setAdminSecret: (secret) =>
    set({ adminSecret: secret.trim() ? secret.trim() : undefined }),
  clearAdminSecret: () => set({ adminSecret: undefined })
}));
