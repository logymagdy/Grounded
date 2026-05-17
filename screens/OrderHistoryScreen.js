// screens/OrderHistoryScreen.js
// ─────────────────────────────────────────────────────────────────────────────
// FEATURES IN THIS FILE:
//
// F12 — Order History     → fetch paginated orders from Supabase
//                           Source: https://supabase.com/docs/reference/javascript/select
//                           Pagination: .range() method from supabase-js docs
//
// F13 — Dark/Light Mode   → useColorScheme from react-native
//                           Source: https://reactnative.dev/docs/usecolorscheme
//
// F18 — Localization      → formatPrice from App.js for correct currency
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
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '../lib/supabase'
import { useFocusEffect } from '@react-navigation/native'

// F18 — Localization: shared formatPrice from App.js
import { formatPrice } from '../App'

// F12 — Pagination: how many orders to load per page
const PAGE_SIZE = 10

// Status badge color helper
function statusColor(status) {
  switch (status) {
    case 'pending': return '#F0A500'
    case 'shipped': return '#476774'
    case 'delivered': return '#2E7D32'
    case 'cancelled': return '#CC0000'
    default: return '#AAAAAA'
  }
}

export default function OrderHistoryScreen() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
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

  // Reload orders every time this tab is focused
  useFocusEffect(
    useCallback(() => {
      // Reset pagination and fetch fresh on focus
      setPage(0)
      setOrders([])
      setHasMore(true)
      fetchOrders(0, true)
    }, [])
  )

  // F12 — Fetch paginated orders from Supabase
  // Source: https://supabase.com/docs/reference/javascript/select
  // .range(from, to) is the supabase-js pagination method
  async function fetchOrders(pageIndex = 0, reset = false) {
    try {
      if (pageIndex === 0) setLoading(true)
      else setLoadingMore(true)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const from = pageIndex * PAGE_SIZE
      const to = from + PAGE_SIZE - 1

      // F12 — .range(from, to) paginates results
      // .order() sorts by newest first
      // Source: https://supabase.com/docs/reference/javascript/select
      const { data, error } = await supabase
        .from('orders')
        .select('id, total, status, created_at, items, full_name, city')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range(from, to)

      if (error) throw error

      if (data) {
        // If returned less than PAGE_SIZE, no more pages exist
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

  // F12 — Load next page when user scrolls to end of list
  function handleLoadMore() {
    if (!loadingMore && hasMore) {
      fetchOrders(page + 1)
    }
  }

  function renderOrder({ item }) {
    // Parse items array from jsonb
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
        {/* Order header row */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: colors.subtext, letterSpacing: 1 }}>
            ORDER #{item.id}
          </Text>
          {/* Status badge */}
          <View style={{
            backgroundColor: statusColor(item.status),
            paddingHorizontal: 8,
            paddingVertical: 3,
            borderRadius: 4,
          }}>
            <Text style={{ color: '#FFFFFF', fontSize: 9, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' }}>
              {item.status}
            </Text>
          </View>
        </View>

        {/* Order detail rows */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
          <Text style={{ fontSize: 12, color: colors.subtext }}>{date}</Text>
          <Text style={{ fontSize: 12, color: colors.subtext }}>{itemCount} item{itemCount !== 1 ? 's' : ''}</Text>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
          <Text style={{ fontSize: 12, color: colors.subtext }}>{item.city}</Text>
          {/* F18 — formatPrice shows EGP or USD based on device locale */}
          <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text }}>
            {formatPrice(item.total)}
          </Text>
        </View>

        {/* Item name previews */}
        <View style={{ borderTopWidth: 1, borderTopColor: colors.border, marginTop: 10, paddingTop: 10 }}>
          {orderItems.slice(0, 2).map((i, idx) => (
            <Text key={idx} style={{ fontSize: 12, color: colors.subtext, marginBottom: 2 }} numberOfLines={1}>
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

      {/* ─── Header ──────────────────────────────────────────────── */}
      <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 24 }}>
        Orders
      </Text>

      {/* ─── Loading State ────────────────────────────────────────── */}
      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={colors.text} />
        </View>
      ) : orders.length === 0 ? (
        // ─── Empty State ─────────────────────────────────────────
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="receipt-outline" size={48} color={colors.subtext} />
          <Text style={{ marginTop: 16, fontSize: 13, color: colors.subtext, letterSpacing: 1.2, fontWeight: '600' }}>
            NO ORDERS YET
          </Text>
        </View>
      ) : (
        // ─── F12: Orders FlatList with pagination ─────────────────
        // onEndReached triggers handleLoadMore for next page
        // Source: https://supabase.com/docs/reference/javascript/select (.range)
        <FlatList
          data={orders}
          renderItem={renderOrder}
          keyExtractor={(item) => item.id.toString()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 24 }}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator color={colors.text} style={{ marginVertical: 16 }} />
            ) : null
          }
        />
      )}
    </View>
  )
}