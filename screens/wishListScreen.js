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
import * as Haptics from 'expo-haptics'
import { formatPrice } from '../lib/utils'

export default function WishlistScreen() {
  const [wishlistProducts, setWishlistProducts] = useState([])
  const [loading, setLoading] = useState(true)

  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'
  const colors = {
    background: isDark ? '#0A0A0A' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#1A1A1A',
    subtext: isDark ? '#888888' : '#AAAAAA',
    card: isDark ? '#1A1A1A' : '#FAFAFA',
    border: isDark ? '#333333' : '#F0F0F0',
  }

  useFocusEffect(
    useCallback(() => {
      fetchWishlist()
    }, [])
  )

  async function fetchWishlist() {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

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

  async function handleRemove(wishlistId) {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)

      const { error } = await supabase
        .from('wishlist')
        .delete()
        .eq('id', wishlistId)

      if (error) throw error
      setWishlistProducts((prev) => prev.filter((w) => w.id !== wishlistId))
    } catch (error) {
      Alert.alert('Error', error.message)
    }
  }

  function renderItem({ item }) {
    const product = item.products
    if (!product) return null

    return (
      <View style={{ flexDirection: 'row', backgroundColor: colors.card, marginBottom: 12, borderRadius: 8, overflow: 'hidden' }}>
        <Image source={{ uri: product.image_url }} style={{ width: 90, height: 90 }} resizeMode="cover" />
        <View style={{ flex: 1, padding: 12, justifyContent: 'space-between' }}>
          <View>
            <Text style={{ fontSize: 9, letterSpacing: 1.2, color: colors.subtext, fontWeight: '600', textTransform: 'uppercase', marginBottom: 3 }}>
              {product.category}
            </Text>
            <Text style={{ fontSize: 13, fontWeight: '600', color: colors.text, lineHeight: 18 }}>
              {product.name}
            </Text>
          </View>
          <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text }}>
            {formatPrice(product.price)}
          </Text>
        </View>

        <TouchableOpacity onPress={() => handleRemove(item.id)} style={{ padding: 10, justifyContent: 'flex-start' }}>
          <Ionicons name="heart-dislike-outline" size={20} color="#CC0000" />
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingHorizontal: 20, paddingTop: 60 }}>
      <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 24 }}>
        Wishlist
      </Text>

      {!loading && wishlistProducts.length === 0 && (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="heart-outline" size={48} color={colors.subtext} />
          <Text style={{ marginTop: 16, fontSize: 13, color: colors.subtext, letterSpacing: 1.2, fontWeight: '600' }}>
            YOUR WISHLIST IS EMPTY
          </Text>
        </View>
      )}

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