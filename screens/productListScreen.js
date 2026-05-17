// ProductListScreen.js
// ─────────────────────────────────────────────────────────────────────────────
// FEATURES ADDED IN THIS FILE:
//
// F5  — Shopping Cart     → useCartStore (Zustand + AsyncStorage persist)
// F11 — Wishlist          → Heart icon saves/removes product from Supabase `wishlist` table
// F16 — Realtime Stock    → Supabase Realtime postgres_changes subscription
// F8  — Offline Browsing  → expo-file-system cache
// F13 — Dark/Light Mode   → useColorScheme hook
// F14 — Haptic Feedback   → expo-haptics on add-to-cart
// F18 — Localization     → formatPrice
// F11 — Battery-Aware Sync → expo-battery (NEW)
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  Alert,
  ScrollView,
  useColorScheme,
} from 'react-native'

import { supabase } from '../lib/supabase'
import { Ionicons } from '@expo/vector-icons'
import { appStyles } from '../styles/styles'

import { formatPrice } from '../App'

import useCartStore from '../store/useCartStore'
import * as FileSystem from 'expo-file-system'
import * as Haptics from 'expo-haptics'

// ✅ F11 — Battery-Aware Sync (ADDED)
import * as Battery from 'expo-battery'

const CATEGORIES = ['All', 'Tents', 'Bags', 'Apparel', 'Gear']
const CACHE_PATH = FileSystem.documentDirectory + 'products_cache.json'

export default function ProductList({ navigation }) {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [wishlist, setWishlist] = useState([])
  const [stockMap, setStockMap] = useState({})

  const addItem = useCartStore((state) => state.addItem)
  const cartItems = useCartStore((state) => state.items)

  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'

  const colors = {
    background: isDark ? '#0A0A0A' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#1A1A1A',
    subtext: isDark ? '#888888' : '#AAAAAA',
    card: isDark ? '#1A1A1A' : '#FAFAFA',
    border: isDark ? '#333333' : '#F0F0F0',
    chip: isDark ? '#1A1A1A' : '#FFFFFF',
    chipActive: isDark ? '#FFFFFF' : '#1A1A1A',
    chipTextActive: isDark ? '#000000' : '#FFFFFF',
  }

  useEffect(() => {
    fetchProducts()
    fetchWishlist()
  }, [selectedCategory])

  useEffect(() => {
    const channel = supabase
      .channel('realtime-stock')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        (payload) => {
          const updated = payload.new
          if (updated && updated.id) {
            setStockMap((prev) => ({
              ...prev,
              [updated.id]: updated.stock,
            }))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    } catch (error) {
      Alert.alert('Error', error.message)
    }
  }

  // ─────────────────────────────────────────────────────────────
  // F11 — Battery-Aware Sync (ADDED LOGIC)
  // ─────────────────────────────────────────────────────────────
  async function fetchProducts() {
    try {
      const batteryLevel = await Battery.getBatteryLevelAsync()
      const batteryState = await Battery.getBatteryStateAsync()

      const isCharging =
        batteryState === Battery.BatteryState.CHARGING ||
        batteryState === Battery.BatteryState.FULL

      // If low battery → skip network
      if (batteryLevel < 0.15 && !isCharging) {
        const fileInfo = await FileSystem.getInfoAsync(CACHE_PATH)

        if (fileInfo.exists) {
          const cached = await FileSystem.readAsStringAsync(CACHE_PATH, {
            encoding: FileSystem.EncodingType.UTF8,
          })

          setProducts(JSON.parse(cached))

          Alert.alert(
            'Battery Saver',
            'Low battery detected. Showing cached products.'
          )
        }

        setLoading(false)
        return
      }

      setLoading(true)

      let query = supabase
        .from('products')
        .select('id, name, price, category, image_url, stock')

      if (selectedCategory !== 'All') {
        query = query.eq('category', selectedCategory)
      }

      const { data, error } = await query
      if (error) throw error

      if (data) {
        setProducts(data)

        const initialStock = {}
        data.forEach((p) => {
          initialStock[p.id] = p.stock
        })
        setStockMap(initialStock)

        await FileSystem.writeAsStringAsync(
          CACHE_PATH,
          JSON.stringify(data),
          { encoding: FileSystem.EncodingType.UTF8 }
        )
      }
    } catch (error) {
      const fileInfo = await FileSystem.getInfoAsync(CACHE_PATH)

      if (fileInfo.exists) {
        const cached = await FileSystem.readAsStringAsync(CACHE_PATH, {
          encoding: FileSystem.EncodingType.UTF8,
        })
        setProducts(JSON.parse(cached))
      } else {
        Alert.alert('Error', error.message)
      }
    } finally {
      setLoading(false)
    }
  }

  async function fetchWishlist() {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    const { data, error } = await supabase
      .from('wishlist')
      .select('product_id')
      .eq('user_id', user.id)

    if (!error && data) {
      setWishlist(data.map((w) => w.product_id))
    }
  }

  async function toggleWishlist(productId) {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    if (wishlist.includes(productId)) {
      await supabase
        .from('wishlist')
        .delete()
        .eq('user_id', user.id)
        .eq('product_id', productId)

      setWishlist((prev) => prev.filter((id) => id !== productId))
    } else {
      await supabase
        .from('wishlist')
        .insert({ user_id: user.id, product_id: productId })

      setWishlist((prev) => [...prev, productId])
    }
  }

  function handleAddToCart(product) {
    addItem(product)
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
  }

  function renderProduct({ item }) {
    const isWishlisted = wishlist.includes(item.id)
    const currentStock = stockMap[item.id] ?? item.stock
    const isOutOfStock = currentStock === 0

    return (
      <View style={[appStyles.productCard, { backgroundColor: colors.card }]}>
        <View>
          <Image
            source={{ uri: item.image_url }}
            style={appStyles.productImage}
            resizeMode="cover"
          />

          {currentStock !== undefined && (
            <View
              style={[
                appStyles.stockBadge,
                {
                  backgroundColor: isOutOfStock ? '#CC0000' : '#476774',
                },
              ]}
            >
              <Text style={appStyles.stockBadgeText}>
                {isOutOfStock ? 'OUT OF STOCK' : `${currentStock} LEFT`}
              </Text>
            </View>
          )}

          <TouchableOpacity
            onPress={() => toggleWishlist(item.id)}
            style={appStyles.wishlistBtn}
          >
            <Ionicons
              name={isWishlisted ? 'heart' : 'heart-outline'}
              size={18}
              color={isWishlisted ? '#CC0000' : '#888888'}
            />
          </TouchableOpacity>
        </View>

        <View style={appStyles.productInfo}>
          <Text style={[appStyles.productCategory, { color: colors.subtext }]}>
            {item.category}
          </Text>

          <Text style={[appStyles.productName, { color: colors.text }]}>
            {item.name}
          </Text>

          <Text style={[appStyles.productPrice, { color: colors.text }]}>
            {formatPrice(item.price)}
          </Text>

          <TouchableOpacity
            onPress={() => handleAddToCart(item)}
            disabled={isOutOfStock}
            style={[
              appStyles.addToCartBtn,
              {
                backgroundColor: isOutOfStock ? '#CCCCCC' : '#1A1A1A',
              },
            ]}
          >
            <Text style={appStyles.addToCartText}>
              {isOutOfStock ? 'SOLD OUT' : 'ADD TO CART'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  return (
    <View style={[appStyles.container, { backgroundColor: colors.background }]}>
      <View style={appStyles.header}>
        <View style={{ flex: 1, alignItems: 'flex-start' }}>
          <TouchableOpacity
            style={appStyles.backBtn}
            onPress={handleLogout}
          >
            <Ionicons name="chevron-back" size={28} color={colors.text} />
          </TouchableOpacity>
        </View>

        <Text style={[appStyles.headerTitle, { color: colors.text }]}>
          Shop
        </Text>

        <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'flex-end', gap: 12 }}>
          <TouchableOpacity
            onPress={() => navigation.navigate('Barcode')}
          >
            <Ionicons name="barcode-outline" size={24} color={colors.text} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('StoreLocator')}
          >
            <Ionicons name="location-outline" size={24} color={colors.text} />
          </TouchableOpacity>

          <TouchableOpacity
            style={{ padding: 4 }}
            onPress={() => navigation.navigate('Cart')}
          >
            <Ionicons name="bag-outline" size={24} color={colors.text} />

            {cartItems.length > 0 && (
              <View style={appStyles.cartBadge}>
                <Text style={appStyles.cartBadgeText}>
                  {cartItems.reduce((sum, i) => sum + i.quantity, 0)}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <View style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              onPress={() => setSelectedCategory(cat)}
              style={appStyles.filterChip}
            >
              <Text>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <View style={appStyles.loadingContainer}>
          <Text>LOADING</Text>
        </View>
      ) : (
        <FlatList
          data={products}
          renderItem={renderProduct}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
        />
      )}
    </View>
  )
}