// 📁 screens/OrderHistoryScreen.js
// ─────────────────────────────────────────────────────────────────────────────
// CHANGES IN THIS VERSION:
// ✅ FIXED: pull-to-refresh added with RefreshControl
// ✅ FIXED: haptic feedback on refresh — expo-haptics
// ✅ FIXED: status display now handles both 'Pending' and 'pending' cases
// ✅ FIXED: added retry button on empty state
// ✅ KEPT:  F15 pagination, F13 dark/light, F19 formatPrice
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useCallback } from 'react'
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  useColorScheme,
  ActivityIndicator,
  RefreshControl,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '../lib/supabase'
import { useFocusEffect } from '@react-navigation/native'
import { formatPrice } from '../lib/utils'

// F14 — Haptic Feedback on refresh
// Source: expo-haptics docs — impactAsync
import * as Haptics from 'expo-haptics'

const PAGE_SIZE = 10

function statusColor(status) {
  const s = status?.toLowerCase()
  switch (s) {
    case 'pending':   return '#F0A500'
    case 'completed': return '#2E7D32'
    case 'shipped':   return '#476774'
    case 'delivered': return '#2E7D32'
    case 'cancelled': return '#CC0000'
    default:          return '#AAAAAA'
  }
}

export default function OrderHistoryScreen() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)

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

  // Reload every time tab is focused
  useFocusEffect(
    useCallback(() => {
      resetAndFetch()
    }, [])
  )

  function resetAndFetch() {
    setPage(0)
    setOrders([])
    setHasMore(true)
    fetchOrders(0, true)
  }

  // ─── F14: Pull-to-refresh with haptic ────────────────────────────────────
  async function handleRefresh() {
    // Source: expo-haptics docs — impactAsync
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    setRefreshing(true)
    setPage(0)
    setOrders([])
    setHasMore(true)
    await fetchOrders(0, true)
    setRefreshing(false)
  }

  // ─── F15: Fetch paginated orders from Supabase ───────────────────────────
  // Source: supabase-js docs — .range(from, to) for pagination
  async function fetchOrders(pageIndex = 0, reset = false) {
    try {
      if (pageIndex === 0 && !refreshing) setLoading(true)
      else if (pageIndex > 0) setLoadingMore(true)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const from = pageIndex * PAGE_SIZE
      const to = from + PAGE_SIZE - 1

      const { data, error } = await supabase
        .from('orders')
        .select('id, total, status, created_at, items, full_name, city')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range(from, to)

      if (error) throw error

      if (data) {
        setHasMore(data.length === PAGE_SIZE)
        setOrders((prev) => (reset ? data : [...prev, ...data]))
        setPage(pageIndex)
      }
    } catch (error) {
      Alert.alert('Error', error.message)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  function handleLoadMore() {
    if (!loadingMore && hasMore) {
      fetchOrders(page + 1)
    }
  }

  function renderOrder({ item }) {
    const orderItems = Array.isArray(item.items) ? item.items : []
    const itemCount = orderItems.reduce((sum, i) => sum + (i.quantity ?? 1), 0)
    const date = new Date(item.created_at).toLocaleDateString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric',
    })

    return (
      <View style={{
        backgroundColor: colors.card,
        borderRadius: 10,
        padding: 16,
        marginBottom: 12,
      }}>
        {/* Order header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: colors.subtext, letterSpacing: 1 }}>
            ORDER #{item.id}
          </Text>
          <View style={{ backgroundColor: statusColor(item.status), paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 }}>
            <Text style={{ color: '#FFFFFF', fontSize: 9, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' }}>
              {item.status}
            </Text>
          </View>
        </View>

        {/* Date + item count */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
          <Text style={{ fontSize: 12, color: colors.subtext }}>{date}</Text>
          <Text style={{ fontSize: 12, color: colors.subtext }}>{itemCount} item{itemCount !== 1 ? 's' : ''}</Text>
        </View>

        {/* City + total */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
          <Text style={{ fontSize: 12, color: colors.subtext }}>{item.city}</Text>
          {/* F19 — formatPrice for correct currency */}
          <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text }}>
            {formatPrice(item.total)}
          </Text>
        </View>

        {/* Item previews */}
        <View style={{ borderTopWidth: 1, borderTopColor: colors.border, marginTop: 10, paddingTop: 10 }}>
          {orderItems.slice(0, 2).map((i, idx) => (
            <Text
              key={i.product_id ?? i.id ?? `item-${idx}`}
              style={{ fontSize: 12, color: colors.subtext, marginBottom: 2 }}
              numberOfLines={1}
            >
              · {i.name} × {i.quantity}
            </Text>
          ))}
          {orderItems.length > 2 && (
            <Text style={{ fontSize: 11, color: colors.subtext, marginTop: 2 }}>
              +{orderItems.length - 2} more items
            </Text>
          )}
        </View>
      </View>
    )
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingHorizontal: 20, paddingTop: 60 }}>

      {/* Header */}
      <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 24 }}>
        Orders
      </Text>

      {loading && !refreshing ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={colors.text} />
        </View>
      ) : orders.length === 0 ? (
        // Empty state with retry button
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="receipt-outline" size={48} color={colors.subtext} />
          <Text style={{ marginTop: 16, fontSize: 13, color: colors.subtext, letterSpacing: 1.2, fontWeight: '600', marginBottom: 20 }}>
            NO ORDERS YET
          </Text>
          <TouchableOpacity
            onPress={handleRefresh}
            style={{ backgroundColor: '#1A1A1A', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 }}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '700', letterSpacing: 1.4 }}>
              REFRESH
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        // F15 — Paginated FlatList with pull-to-refresh
        <FlatList
          data={orders}
          renderItem={renderOrder}
          keyExtractor={(item) => item.id.toString()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 24 }}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.4}
          // F14 — RefreshControl with haptic
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.text}
              colors={['#1A1A1A']}
            />
          }
          ListFooterComponent={
            loadingMore
              ? <ActivityIndicator color={colors.text} style={{ marginVertical: 16 }} />
              : null
          }
        />
      )}
    </View>
  )
}