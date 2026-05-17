// screens/WishlistScreen.js
// ─────────────────────────────────────────────────────────────────────────────
// FEATURES IN THIS FILE:
//
// F11 — Wishlist UI       → fetch wishlist items from Supabase + remove
//                           Source: https://supabase.com/docs/reference/javascript/select
//
// F13 — Dark/Light Mode   → useColorScheme from react-native
//                           Source: https://reactnative.dev/docs/usecolorscheme
//
// F14 — Haptic Feedback   → expo-haptics on remove from wishlist
//                           Source: https://docs.expo.dev/versions/latest/sdk/haptics/
//
// F18 — Localization      → formatPrice from App.js for correct currency
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  Alert,
  useColorScheme,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '../lib/supabase'
import { useFocusEffect } from '@react-navigation/native'

// F14 — Haptic Feedback
// Source: https://docs.expo.dev/versions/latest/sdk/haptics/
import * as Haptics from 'expo-haptics'

// F18 — Localization: use shared formatPrice from App.js
import { formatPrice } from '../App'

export default function WishlistScreen() {
  const [wishlistProducts, setWishlistProducts] = useState([])
  const [loading, setLoading] = useState(true)

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

  // useFocusEffect re-fetches wishlist every time this tab is focused
  // Source: https://reactnavigation.org/docs/use-focus-effect
  useFocusEffect(
    useCallback(() => {
      fetchWishlist()
    }, [])
  )

  // F11 — Fetch wishlist with joined product data
  // Source: https://supabase.com/docs/reference/javascript/select
  // The select uses a foreign key join: wishlist → products
  async function fetchWishlist() {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Join wishlist rows with their product details in one query
      const { data, error } = await supabase
        .from('wishlist')
        .select(`
          id,
          product_id,
          products (
            id,
            name,
            price,
            category,
            image_url
          )
        `)
        .eq('user_id', user.id)

      if (error) throw error
      if (data) setWishlistProducts(data)
    } catch (error) {
      Alert.alert('Error', error.message)
    } finally {
      setLoading(false)
    }
  }

  // F11 — Remove from wishlist
  // Source: https://supabase.com/docs/reference/javascript/delete
  async function handleRemove(wishlistId) {
    try {
      // F14 — Haptic warning on remove
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)

      const { error } = await supabase
        .from('wishlist')
        .delete()
        .eq('id', wishlistId)

      if (error) throw error

      // Remove from local state immediately for instant UI feedback
      setWishlistProducts((prev) => prev.filter((w) => w.id !== wishlistId))
    } catch (error) {
      Alert.alert('Error', error.message)
    }
  }

  function renderItem({ item }) {
    const product = item.products
    if (!product) return null

    return (
      <View style={{
        flexDirection: 'row',
        backgroundColor: colors.card,
        marginBottom: 12,
        borderRadius: 8,
        overflow: 'hidden',
      }}>
        <Image
          source={{ uri: product.image_url }}
          style={{ width: 90, height: 90 }}
          resizeMode="cover"
        />
        <View style={{ flex: 1, padding: 12, justifyContent: 'space-between' }}>
          <View>
            <Text style={{ fontSize: 9, letterSpacing: 1.2, color: colors.subtext, fontWeight: '600', textTransform: 'uppercase', marginBottom: 3 }}>
              {product.category}
            </Text>
            <Text style={{ fontSize: 13, fontWeight: '600', color: colors.text, lineHeight: 18 }}>
              {product.name}
            </Text>
          </View>
          {/* F18 — formatPrice shows EGP or USD based on device locale */}
          <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text }}>
            {formatPrice(product.price)}
          </Text>
        </View>

        {/* F11 — Remove from wishlist button */}
        <TouchableOpacity
          onPress={() => handleRemove(item.id)}
          style={{ padding: 10, justifyContent: 'flex-start' }}
        >
          <Ionicons name="heart-dislike-outline" size={20} color="#CC0000" />
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingHorizontal: 20, paddingTop: 60 }}>

      {/* ─── Header ──────────────────────────────────────────────── */}
      <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 24 }}>
        Wishlist
      </Text>

      {/* ─── Empty State ─────────────────────────────────────────── */}
      {!loading && wishlistProducts.length === 0 && (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="heart-outline" size={48} color={colors.subtext} />
          <Text style={{ marginTop: 16, fontSize: 13, color: colors.subtext, letterSpacing: 1.2, fontWeight: '600' }}>
            YOUR WISHLIST IS EMPTY
          </Text>
        </View>
      )}

      {/* ─── Wishlist Items ───────────────────────────────────────── */}
      {/* F11 — FlatList renders all wishlisted products from Supabase */}
      <FlatList
        data={wishlistProducts}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
      />
    </View>
  )
}