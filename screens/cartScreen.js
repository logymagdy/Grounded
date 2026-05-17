// screens/cartScreen.js
// ─────────────────────────────────────────────────────────────────────────────
// FEATURES IN THIS FILE:
//
// F5  — Shopping Cart     → useCartStore (Zustand + AsyncStorage)
// F13 — Dark/Light Mode   → useColorScheme
// F14 — Haptic Feedback   → expo-haptics on remove item and quantity change
// F18 — Localization      → formatPrice for correct currency display
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react'
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  useColorScheme,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'

// F5 — Cart: useCartStore is in the same screens/ folder
import useCartStore from './useCartStore'

// F14 — Haptic Feedback
import * as Haptics from 'expo-haptics'

// F18 — Localization
import { formatPrice } from '../App'

export default function CartScreen({ navigation }) {

  // F5 — Cart state from Zustand
  const items = useCartStore((state) => state.items)
  const removeItem = useCartStore((state) => state.removeItem)
  const updateQuantity = useCartStore((state) => state.updateQuantity)

  // F13 — Dark/Light Mode
  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'
  const colors = {
    background: isDark ? '#0A0A0A' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#1A1A1A',
    subtext: isDark ? '#888888' : '#AAAAAA',
    card: isDark ? '#1A1A1A' : '#FAFAFA',
    border: isDark ? '#333333' : '#F0F0F0',
  }

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

  // F14 — Haptic warning on remove
  function handleRemove(id) {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
    removeItem(id)
  }

  // F14 — Haptic light on quantity change
  function handleQuantityChange(id, qty) {
    if (qty < 1) {
      handleRemove(id)
      return
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    updateQuantity(id, qty)
  }

  function renderItem({ item }) {
    return (
      <View
        style={{
          flexDirection: 'row',
          backgroundColor: colors.card,
          marginBottom: 12,
          borderRadius: 8,
          overflow: 'hidden',
        }}
      >
        {/* Product image */}
        <Image
          source={{ uri: item.image_url }}
          style={{ width: 90, height: 90 }}
          resizeMode="cover"
        />

        {/* Product info */}
        <View style={{ flex: 1, padding: 12, justifyContent: 'space-between' }}>
          <View>
            <Text
              style={{
                fontSize: 9,
                letterSpacing: 1.2,
                color: colors.subtext,
                fontWeight: '600',
                textTransform: 'uppercase',
                marginBottom: 3,
              }}
            >
              {item.category}
            </Text>
            <Text
              style={{ fontSize: 13, fontWeight: '600', color: colors.text, lineHeight: 18 }}
            >
              {item.name}
            </Text>
          </View>

          {/* Quantity stepper + price */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            {/* F5 — Quantity stepper */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <TouchableOpacity
                onPress={() => handleQuantityChange(item.id, item.quantity - 1)}
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 13,
                  borderWidth: 1,
                  borderColor: colors.border,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="remove" size={14} color={colors.text} />
              </TouchableOpacity>

              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '700',
                  color: colors.text,
                  minWidth: 16,
                  textAlign: 'center',
                }}
              >
                {item.quantity}
              </Text>

              <TouchableOpacity
                onPress={() => handleQuantityChange(item.id, item.quantity + 1)}
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 13,
                  borderWidth: 1,
                  borderColor: colors.border,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="add" size={14} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* F18 — formatPrice */}
            <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text }}>
              {formatPrice(item.price * item.quantity)}
            </Text>
          </View>
        </View>

        {/* F5 — Remove button */}
        <TouchableOpacity
          onPress={() => handleRemove(item.id)}
          style={{ padding: 10, justifyContent: 'flex-start' }}
        >
          <Ionicons name="close" size={18} color={colors.subtext} />
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.background,
        paddingHorizontal: 20,
        paddingTop: 50,
      }}
    >
      {/* ─── Header ──────────────────────────────────────────────── */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
          style={{ marginRight: 12 }}
        >
          <Ionicons name="chevron-back" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text
          style={{
            fontSize: 18,
            fontWeight: '700',
            color: colors.text,
            letterSpacing: 1,
            textTransform: 'uppercase',
          }}
        >
          Cart
        </Text>
        <Text style={{ marginLeft: 8, fontSize: 12, color: colors.subtext, fontWeight: '600' }}>
          ({items.reduce((s, i) => s + i.quantity, 0)} items)
        </Text>
      </View>

      {/* ─── Empty State ─────────────────────────────────────────── */}
      {items.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="bag-outline" size={48} color={colors.subtext} />
          <Text
            style={{
              marginTop: 16,
              fontSize: 13,
              color: colors.subtext,
              letterSpacing: 1.2,
              fontWeight: '600',
            }}
          >
            YOUR CART IS EMPTY
          </Text>
        </View>
      ) : (
        <>
          {/* F5 — Cart items list */}
          <FlatList
            data={items}
            renderItem={renderItem}
            keyExtractor={(item) => item.id.toString()}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 24 }}
          />

          {/* ─── Order Summary ────────────────────────────────────── */}
          <View
            style={{
              borderTopWidth: 1,
              borderTopColor: colors.border,
              paddingTop: 16,
              paddingBottom: 32,
            }}
          >
            <View
              style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}
            >
              <Text
                style={{ fontSize: 12, color: colors.subtext, letterSpacing: 1, fontWeight: '600' }}
              >
                SUBTOTAL
              </Text>
              <Text style={{ fontSize: 12, color: colors.subtext, fontWeight: '600' }}>
                {formatPrice(total)}
              </Text>
            </View>
            <View
              style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}
            >
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: '700',
                  color: colors.text,
                  letterSpacing: 0.5,
                }}
              >
                TOTAL
              </Text>
              <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text }}>
                {formatPrice(total)}
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => navigation.navigate('Checkout')}
              style={{
                backgroundColor: '#1A1A1A',
                height: 54,
                borderRadius: 30,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text
                style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '700', letterSpacing: 1.5 }}
              >
                PROCEED TO CHECKOUT
              </Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  )
}