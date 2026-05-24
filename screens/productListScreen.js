import React, { useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  Alert,
  ScrollView,
  useColorScheme,
  ActivityIndicator,
} from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { supabase } from '../lib/supabase'
import { Ionicons } from '@expo/vector-icons'
import { appStyles } from '../styles/styles'
import { formatPrice } from '../lib/utils'
import useCartStore from './useCartStore'
import * as Haptics from 'expo-haptics'
import * as FileSystem from 'expo-file-system'
import * as Battery from 'expo-battery'

const CATEGORIES = ['All', 'Tents', 'Bags', 'Apparel', 'Equipment']
const CACHE_PATH = FileSystem.documentDirectory + 'products_cache.json'

function sanitiseForCache(products) {
  return products.map((p) => ({
    id: p.id,
    name: p.name ?? '',
    price: p.price ?? 0,
    category: p.category ?? '',
    image_url: p.image_url ?? '',
    stock: p.stock ?? 0,
    barcode: p.barcode ?? null,
  }))
}

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
  }

  useFocusEffect(
    useCallback(() => {
      fetchProducts()
      fetchWishlist()
    }, [selectedCategory])
  )

  useEffect(() => {
    const channel = supabase
      .channel('realtime-stock')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, (payload) => {
        const updated = payload.new
        if (updated && updated.id) {
          setStockMap((prev) => ({ ...prev, [updated.id]: updated.stock }))
        }
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    } catch (error) {
      Alert.alert('Error', error.message)
    }
  }

  async function fetchProducts() {
    try {
      setLoading(true)

      const batteryLevel = await Battery.getBatteryLevelAsync()
      const batteryState = await Battery.getBatteryStateAsync()
      const isCharging =
        batteryState === Battery.BatteryState.CHARGING ||
        batteryState === Battery.BatteryState.FULL

      if (batteryLevel < 0.15 && !isCharging) {
        const fileInfo = await FileSystem.getInfoAsync(CACHE_PATH)
        if (fileInfo.exists) {
          const cached = await FileSystem.readAsStringAsync(CACHE_PATH, {
            encoding: FileSystem.EncodingType.UTF8,
          })
          const cachedData = JSON.parse(cached)
          setProducts(cachedData)
          const initialStock = {}
          cachedData.forEach((p) => { initialStock[p.id] = p.stock !== undefined ? p.stock : 5 })
          setStockMap(initialStock)
          Alert.alert('Battery Saver', 'Low battery — showing cached products.')
        }
        setLoading(false)
        return
      }

      let query = supabase.from('products').select('*')
      if (selectedCategory !== 'All') {
        query = query.eq('category', selectedCategory)
      }

      const { data, error } = await query

      if (error) {
        Alert.alert('Database Error', error.message)
        return
      }

      if (data) {
        setProducts(data)

        const initialStock = {}
        data.forEach((p) => { initialStock[p.id] = p.stock !== undefined ? p.stock : 5 })
        setStockMap(initialStock)

        try {
          const safe = sanitiseForCache(data)
          await FileSystem.writeAsStringAsync(
            CACHE_PATH,
            JSON.stringify(safe),
            { encoding: FileSystem.EncodingType.UTF8 }
          )
        } catch (cacheWriteError) {
          console.log('Cache write skipped:', cacheWriteError.message)
        }
      }
    } catch (error) {
      try {
        const fileInfo = await FileSystem.getInfoAsync(CACHE_PATH)
        if (fileInfo.exists) {
          const cached = await FileSystem.readAsStringAsync(CACHE_PATH, {
            encoding: FileSystem.EncodingType.UTF8,
          })
          const cachedData = JSON.parse(cached)
          setProducts(cachedData)
          const initialStock = {}
          cachedData.forEach((p) => { initialStock[p.id] = p.stock !== undefined ? p.stock : 5 })
          setStockMap(initialStock)
        } else {
          Alert.alert('Error', error.message)
        }
      } catch (cacheError) {
        Alert.alert('Error', error.message)
      }
    } finally {
      setLoading(false)
    }
  }

  async function fetchWishlist() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data, error } = await supabase
        .from('wishlist')
        .select('product_id')
        .eq('user_id', user.id)
      if (!error && data) setWishlist(data.map((w) => w.product_id))
    } catch (e) {
      console.log('Wishlist fetch error:', e.message)
    }
  }

  async function toggleWishlist(productId) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    if (wishlist.includes(productId)) {
      setWishlist((prev) => prev.filter((id) => id !== productId))
      const { error } = await supabase
        .from('wishlist')
        .delete()
        .eq('user_id', user.id)
        .eq('product_id', productId)
      if (error) {
        setWishlist((prev) => [...prev, productId])
        Alert.alert('Error', error.message)
      }
    } else {
      setWishlist((prev) => [...prev, productId])
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
      const { error } = await supabase
        .from('wishlist')
        .insert({ user_id: user.id, product_id: productId })
      if (error) {
        setWishlist((prev) => prev.filter((id) => id !== productId))
        Alert.alert('Error', error.message)
      }
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
    const imageUrl = item.image_url || null

    return (
      <View style={[appStyles.productCard, { backgroundColor: colors.card, minHeight: 260 }]}>
        <View style={{ backgroundColor: isDark ? '#2A2A2A' : '#E8E8E8' }}>
          {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              style={appStyles.productImage}
              resizeMode="cover"
            />
          ) : (
            <View style={[appStyles.productImage, {
              backgroundColor: isDark ? '#2A2A2A' : '#E8E8E8',
              alignItems: 'center',
              justifyContent: 'center',
            }]}>
              <Ionicons name="image-outline" size={32} color={isDark ? '#555555' : '#BBBBBB'} />
            </View>
          )}

          {currentStock !== undefined && (
            <View style={[appStyles.stockBadge, { backgroundColor: isOutOfStock ? '#CC0000' : '#476774' }]}>
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
            {item.category || 'General'}
          </Text>
          <Text style={[appStyles.productName, { color: colors.text }]}>
            {item.name || 'Unnamed Item'}
          </Text>
          <Text style={[appStyles.productPrice, { color: colors.text }]}>
            {formatPrice(item.price)}
          </Text>
          <TouchableOpacity
            onPress={() => handleAddToCart(item)}
            disabled={isOutOfStock}
            style={[appStyles.addToCartBtn, { backgroundColor: isOutOfStock ? '#CCCCCC' : '#1A1A1A' }]}
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
          <TouchableOpacity style={appStyles.backBtn} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
        <Text style={[appStyles.headerTitle, { color: colors.text }]}>Shop</Text>
        <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'flex-end', gap: 12 }}>
          <TouchableOpacity onPress={() => navigation.navigate('Barcode')}>
            <Ionicons name="barcode-outline" size={24} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('StoreLocator')}>
            <Ionicons name="location-outline" size={24} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity style={{ padding: 4 }} onPress={() => navigation.navigate('Cart')}>
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
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={appStyles.filterContent}
          style={{ paddingVertical: 12 }}
        >
          {CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat
            return (
              <TouchableOpacity
                key={cat}
                onPress={() => setSelectedCategory(cat)}
                style={[appStyles.filterChip, isActive && appStyles.filterChipActive]}
              >
                <Text style={[appStyles.filterChipText, isActive && appStyles.filterChipTextActive]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            )
          })}
        </ScrollView>
      </View>

      {loading ? (
        <View style={appStyles.loadingContainer}>
          <ActivityIndicator color={colors.text} />
          <Text style={[appStyles.loadingText, { color: colors.subtext, marginTop: 12 }]}>LOADING</Text>
        </View>
      ) : products.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="cube-outline" size={48} color={colors.subtext} />
          <Text style={{ marginTop: 16, fontSize: 13, color: colors.subtext, letterSpacing: 1.2, fontWeight: '600' }}>
            NO PRODUCTS FOUND
          </Text>
        </View>
      ) : (
        <FlatList
          data={products}
          renderItem={renderProduct}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          columnWrapperStyle={{ justifyContent: 'space-between', paddingHorizontal: 12 }}
          contentContainerStyle={{ paddingVertical: 16, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  )
}