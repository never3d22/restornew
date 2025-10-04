import { create } from "zustand";

export type CartItem = {
  dishId: number;
  name: string;
  price: number;
  quantity: number;
};

export type CartState = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">) => void;
  removeItem: (dishId: number) => void;
  increment: (dishId: number) => void;
  decrement: (dishId: number) => void;
  clear: () => void;
};

export const useCartStore = create<CartState>((set) => ({
  items: [],
  addItem: (item) =>
    set((state) => {
      const existing = state.items.find((i) => i.dishId === item.dishId);
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.dishId === item.dishId ? { ...i, quantity: i.quantity + 1 } : i
          )
        };
      }
      return {
        items: [...state.items, { ...item, quantity: 1 }]
      };
    }),
  removeItem: (dishId) =>
    set((state) => ({ items: state.items.filter((item) => item.dishId !== dishId) })),
  increment: (dishId) =>
    set((state) => ({
      items: state.items.map((item) =>
        item.dishId === dishId ? { ...item, quantity: item.quantity + 1 } : item
      )
    })),
  decrement: (dishId) =>
    set((state) => ({
      items: state.items
        .map((item) =>
          item.dishId === dishId ? { ...item, quantity: item.quantity - 1 } : item
        )
        .filter((item) => item.quantity > 0)
    })),
  clear: () => set({ items: [] })
}));
