// screens/checkOutScreen.js
// ─────────────────────────────────────────────────────────────────────────────
// FEATURES IN THIS FILE:
//
// F5  — Shopping Cart     → useCartStore items + clearCart after order
// F9  — Secure Checkout   → Saves order record to Supabase
//                           Source: https://supabase.com/docs/reference/javascript/insert
// F13 — Dark/Light Mode   → useColorScheme
// F14 — Haptic Feedback   → expo-haptics success on order placed
// F17 — Receipt PDF       → expo-print + expo-sharing
//                           Source: https://docs.expo.dev/versions/latest/sdk/print/
//                                   https://docs.expo.dev/versions/latest/sdk/sharing/
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  useColorScheme,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '../lib/supabase'

// F5 — Cart: useCartStore lives in screens/ folder
import useCartStore from './useCartStore'

// F14 — Haptic Feedback
import * as Haptics from 'expo-haptics'

// F17 — PDF Receipt
import * as Print from 'expo-print'
import * as Sharing from 'expo-sharing'

// F18 — Localization
import { formatPrice } from '../App'

export default function CheckoutScreen({ navigation }) {

  // F5 — Cart state
  const items = useCartStore((state) => state.items)
  const clearCart = useCartStore((state) => state.clearCart)
  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0)

  // F13 — Dark/Light Mode
  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'
  const colors = {
    background: isDark ? '#0A0A0A' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#1A1A1A',
    subtext: isDark ? '#888888' : '#AAAAAA',
    card: isDark ? '#1A1A1A' : '#FAFAFA',
    border: isDark ? '#333333' : '#EEEEEE',
  }

  const [fullName, setFullName] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [placing, setPlacing] = useState(false)

  // ─── F17: Generate and share PDF receipt ─────────────────────────────────
  // Source: https://docs.expo.dev/versions/latest/sdk/print/
  async function generateReceipt(orderId) {
    const itemRows = items
      .map(
        (i) =>
          `<tr>
            <td>${i.name}</td>
            <td style="text-align:center">${i.quantity}</td>
            <td style="text-align:right">$${(i.price * i.quantity).toFixed(2)}</td>
          </tr>`
      )
      .join('')

    const html = `
      <html>
        <body style="font-family: helvetica; padding: 40px; color: #1A1A1A;">
          <h1 style="letter-spacing: 4px; font-size: 22px;">GROUNDED</h1>
          <p style="color: #888; font-size: 12px; letter-spacing: 1px;">ORDER RECEIPT</p>
          <hr/>
          <p><strong>Order ID:</strong> ${orderId}</p>
          <p><strong>Name:</strong> ${fullName}</p>
          <p><strong>Address:</strong> ${address}, ${city}</p>
          <hr/>
          <table width="100%" cellpadding="6">
            <thead>
              <tr style="border-bottom: 1px solid #eee;">
                <th style="text-align:left">Item</th>
                <th style="text-align:center">Qty</th>
                <th style="text-align:right">Price</th>
              </tr>
            </thead>
            <tbody>${itemRows}</tbody>
          </table>
          <hr/>
          <p style="text-align:right; font-size: 18px; font-weight: bold;">
            TOTAL: $${total.toFixed(2)}
          </p>
        </body>
      </html>
    `

    // F17 — Convert HTML → PDF file on device
    const { uri } = await Print.printToFileAsync({ html })

    // F17 — Open native share sheet to save/send the PDF
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: 'Save your receipt',
      UTI: 'com.adobe.pdf',
    })
  }

  // ─── F9: Place Order ─────────────────────────────────────────────────────
  async function handlePlaceOrder() {
    if (!fullName.trim() || !address.trim() || !city.trim()) {
      Alert.alert('Missing Info', 'Please fill in all shipping fields.')
      return
    }

    try {
      setPlacing(true)

      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // F9 — Insert order into Supabase orders table
      const { data, error } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          items: items,
          total: total,
          full_name: fullName,
          address: address,
          city: city,
          status: 'pending',
          created_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) throw error

      // F14 — Haptic success
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)

      // F5 — Clear cart after successful order
      clearCart()

      // F17 — Generate + share PDF receipt
      await generateReceipt(data.id)

      Alert.alert('Order Placed!', 'Your order has been confirmed.', [
        { text: 'OK', onPress: () => navigation.navigate('ProductList') },
      ])
    } catch (error) {
      Alert.alert('Error', error.message)
    } finally {
      setPlacing(false)
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 50, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Header ────────────────────────────────────────────── */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 32 }}>
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
            Checkout
          </Text>
        </View>

        {/* ─── Shipping Details ─────────────────────────────────── */}
        <Text
          style={{
            fontSize: 11,
            letterSpacing: 1.4,
            fontWeight: '700',
            color: colors.subtext,
            marginBottom: 16,
            textTransform: 'uppercase',
          }}
        >
          Shipping Details
        </Text>

        {/* Full Name */}
        <Text
          style={{
            fontSize: 11,
            color: colors.subtext,
            letterSpacing: 1,
            fontWeight: '600',
            marginBottom: 6,
            textTransform: 'uppercase',
          }}
        >
          Full Name
        </Text>
        <TextInput
          value={fullName}
          onChangeText={setFullName}
          placeholder="John Doe"
          placeholderTextColor={colors.subtext}
          style={{
            height: 50,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 10,
            paddingHorizontal: 14,
            fontSize: 15,
            color: colors.text,
            backgroundColor: colors.card,
            marginBottom: 14,
          }}
        />

        {/* Address */}
        <Text
          style={{
            fontSize: 11,
            color: colors.subtext,
            letterSpacing: 1,
            fontWeight: '600',
            marginBottom: 6,
            textTransform: 'uppercase',
          }}
        >
          Address
        </Text>
        <TextInput
          value={address}
          onChangeText={setAddress}
          placeholder="123 Main Street"
          placeholderTextColor={colors.subtext}
          style={{
            height: 50,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 10,
            paddingHorizontal: 14,
            fontSize: 15,
            color: colors.text,
            backgroundColor: colors.card,
            marginBottom: 14,
          }}
        />

        {/* City */}
        <Text
          style={{
            fontSize: 11,
            color: colors.subtext,
            letterSpacing: 1,
            fontWeight: '600',
            marginBottom: 6,
            textTransform: 'uppercase',
          }}
        >
          City
        </Text>
        <TextInput
          value={city}
          onChangeText={setCity}
          placeholder="Cairo"
          placeholderTextColor={colors.subtext}
          style={{
            height: 50,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 10,
            paddingHorizontal: 14,
            fontSize: 15,
            color: colors.text,
            backgroundColor: colors.card,
            marginBottom: 28,
          }}
        />

        {/* ─── Order Summary ────────────────────────────────────── */}
        <Text
          style={{
            fontSize: 11,
            letterSpacing: 1.4,
            fontWeight: '700',
            color: colors.subtext,
            marginBottom: 16,
            textTransform: 'uppercase',
          }}
        >
          Order Summary
        </Text>

        {items.map((item) => (
          <View
            key={item.id}
            style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}
          >
            <Text
              style={{ fontSize: 13, color: colors.text, flex: 1 }}
              numberOfLines={1}
            >
              {item.name} × {item.quantity}
            </Text>
            <Text style={{ fontSize: 13, fontWeight: '600', color: colors.text }}>
              {formatPrice(item.price * item.quantity)}
            </Text>
          </View>
        ))}

        <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 14 }} />

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 32 }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text }}>TOTAL</Text>
          <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text }}>
            {formatPrice(total)}
          </Text>
        </View>

        {/* ─── Place Order Button ───────────────────────────────── */}
        <TouchableOpacity
          onPress={handlePlaceOrder}
          disabled={placing}
          style={{
            backgroundColor: placing ? '#888888' : '#1A1A1A',
            height: 54,
            borderRadius: 30,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '700', letterSpacing: 1.5 }}>
            {placing ? 'PLACING ORDER...' : 'PLACE ORDER'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  )
}