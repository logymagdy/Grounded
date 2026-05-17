import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'

const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],

      // Add product or increment quantity if already in cart
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

      // Remove product from cart entirely
      removeItem: (id) =>
        set({ items: get().items.filter((i) => i.id !== id) }),

      // Update quantity directly
      updateQuantity: (id, qty) =>
        set({
          items: get().items.map((i) =>
            i.id === id ? { ...i, quantity: qty } : i
          ),
        }),

      // Clear all items (used after checkout)
      clearCart: () => set({ items: [] }),
    }),
    {
      name: 'cart-storage',                        // AsyncStorage key
      storage: createJSONStorage(() => AsyncStorage), // persist with AsyncStorage
    }
  )
)

export default useCartStore