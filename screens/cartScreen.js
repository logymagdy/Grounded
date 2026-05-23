import React from 'react'
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  useColorScheme,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { formatPrice } from '../lib/utils'


import useCartStore from './useCartStore'

import * as Haptics from 'expo-haptics'

export default function CartScreen({ navigation }) {
  const items          = useCartStore((state) => state.items)
  const removeItem     = useCartStore((state) => state.removeItem)
  const updateQuantity = useCartStore((state) => state.updateQuantity)
  const total          = items.reduce((sum, i) => sum + i.price * i.quantity, 0)

  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'
  const colors = {
    background: isDark ? '#0A0A0A' : '#FFFFFF',
    text:       isDark ? '#FFFFFF' : '#1A1A1A',
    subtext:    isDark ? '#888888' : '#AAAAAA',
    card:       isDark ? '#1A1A1A' : '#FAFAFA',
    border:     isDark ? '#333333' : '#F0F0F0',
  }

  const handleQuantityChange = (id, newQty) => {
    updateQuantity(id, newQty)
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
  }

  const handleRemoveItem = (id) => {
    removeItem(id)
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: 50, paddingHorizontal: 24 }}>

      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ marginRight: 12 }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, textTransform: 'uppercase', letterSpacing: 1 }}>
          Your Cart
        </Text>
      </View>

      {items.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Ionicons name="bag-handle-outline" size={64} color={colors.subtext} />
          <Text style={{ color: colors.subtext, marginTop: 16, fontSize: 11, fontWeight: '700', letterSpacing: 1.5 }}>
            YOUR CART IS EMPTY
          </Text>
        </View>
      ) : (
        <>
          <FlatList
            data={items}
            keyExtractor={(item) => item.id.toString()}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <View style={{
                flexDirection: 'row',
                padding: 12,
                backgroundColor: colors.card,
                borderRadius: 12,
                marginBottom: 12,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: colors.border,
              }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.text, fontSize: 15, fontWeight: '600' }}>{item.name}</Text>
                  <Text style={{ color: colors.subtext, fontSize: 13, marginTop: 2 }}>{formatPrice(item.price)}</Text>
                </View>

                {/* Quantity controller */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginRight: 16 }}>
                  <TouchableOpacity
                    onPress={() => item.quantity > 1
                      ? handleQuantityChange(item.id, item.quantity - 1)
                      : handleRemoveItem(item.id)
                    }
                    style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: colors.border, alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Ionicons name="remove" size={16} color={colors.text} />
                  </TouchableOpacity>
                  <Text style={{ color: colors.text, fontSize: 15, fontWeight: '700' }}>{item.quantity}</Text>
                  <TouchableOpacity
                    onPress={() => handleQuantityChange(item.id, item.quantity + 1)}
                    style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: colors.border, alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Ionicons name="add" size={16} color={colors.text} />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity onPress={() => handleRemoveItem(item.id)}>
                  <Ionicons name="trash-outline" size={20} color="#CC0000" />
                </TouchableOpacity>
              </View>
            )}
          />

          {/* Footer */}
          <View style={{ borderTopWidth: 1, borderTopColor: colors.border, paddingVertical: 20, marginBottom: 20 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={{ color: colors.text, fontSize: 16, fontWeight: '600' }}>Total Amount</Text>
              <Text style={{ color: colors.text, fontSize: 20, fontWeight: '800' }}>{formatPrice(total)}</Text>
            </View>
            <TouchableOpacity
              onPress={() => navigation.navigate('Checkout')}
              style={{ backgroundColor: '#1A1A1A', height: 50, borderRadius: 10, alignItems: 'center', justifyContent: 'center' }}
            >
              <Text style={{ color: '#FFFFFF', fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' }}>
                Proceed To Checkout
              </Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  )
}