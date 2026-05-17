import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'

// Source: Zustand official docs — persist middleware with createJSONStorage
// Adapted: sessionStorage → AsyncStorage (React Native compatible)
const useCartStore = create(
  persist(
    (set, get) => ({
      // ─── State ───────────────────────────────────────────────────────
      items: [], // [{ id, name, price, category, image_url, quantity }]

      // ─── Add item to cart ────────────────────────────────────────────
      // If product already in cart, increase quantity
      addItem: (product) => {
        const existing = get().items.find((i) => i.id === product.id)
        if (existing) {
          set({
            items: get().items.map((i) =>
              i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
            ),
          })
        } else {
          set({ items: [...get().items, { ...product, quantity: 1 }] })
        }
      },

      // ─── Remove item from cart completely ────────────────────────────
      removeItem: (productId) => {
        set({ items: get().items.filter((i) => i.id !== productId) })
      },

      // ─── Increase quantity ───────────────────────────────────────────
      increaseQuantity: (productId) => {
        set({
          items: get().items.map((i) =>
            i.id === productId ? { ...i, quantity: i.quantity + 1 } : i
          ),
        })
      },

      // ─── Decrease quantity — remove if reaches 0 ─────────────────────
      decreaseQuantity: (productId) => {
        const item = get().items.find((i) => i.id === productId)
        if (item?.quantity === 1) {
          set({ items: get().items.filter((i) => i.id !== productId) })
        } else {
          set({
            items: get().items.map((i) =>
              i.id === productId ? { ...i, quantity: i.quantity - 1 } : i
            ),
          })
        }
      },

      // ─── Clear entire cart ───────────────────────────────────────────
      clearCart: () => set({ items: [] }),

      // ─── Derived: total item count ───────────────────────────────────
      getTotalItems: () =>
        get().items.reduce((sum, i) => sum + i.quantity, 0),

      // ─── Derived: total price ────────────────────────────────────────
      getTotalPrice: () =>
        get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    }),
    {
      // Source: Zustand persist docs — name is the AsyncStorage key
      name: 'grounded-cart-storage',
      // Source: Peslo Studios — createJSONStorage(() => AsyncStorage) for React Native
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
)

export default useCartStore