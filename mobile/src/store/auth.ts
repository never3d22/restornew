import { create } from "zustand";

export type AuthState = {
  customerId?: number;
  phone?: string;
  codeSent: boolean;
  setPhone: (phone: string) => void;
  setCustomer: (id: number) => void;
  setCodeSent: (value: boolean) => void;
  reset: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  customerId: undefined,
  phone: undefined,
  codeSent: false,
  setPhone: (phone) => set({ phone }),
  setCustomer: (customerId) => set({ customerId }),
  setCodeSent: (codeSent) => set({ codeSent }),
  reset: () => set({ customerId: undefined, phone: undefined, codeSent: false })
}));
