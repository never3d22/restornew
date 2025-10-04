import { create } from "zustand";

export type AdminState = {
  adminSecret?: string;
  setSecret: (secret: string) => void;
  reset: () => void;
};

export const useAdminStore = create<AdminState>((set) => ({
  adminSecret: undefined,
  setSecret: (adminSecret) => set({ adminSecret }),
  reset: () => set({ adminSecret: undefined })
}));
