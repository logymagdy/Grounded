import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ScrollView,
  useColorScheme,
  ActivityIndicator,
} from 'react-native'
import { supabase } from '../lib/supabase'
import { Ionicons } from '@expo/vector-icons'
import useCartStore from './useCartStore'
import { formatPrice } from '../lib/utils'
import * as Haptics from 'expo-haptics'
import * as Print from 'expo-print'
import * as Sharing from 'expo-sharing'

export default function CheckoutScreen({ navigation }) {
  const cartItems = useCartStore((state) => state.items)
  const clearCart = useCartStore((state) => state.clearCart)

  const [fullName, setFullName] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [loading, setLoading] = useState(false)

  const totalAmount = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)

  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'
  const colors = {
    background: isDark ? '#0A0A0A' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#1A1A1A',
    subtext: isDark ? '#888888' : '#AAAAAA',
    inputBg: isDark ? '#1A1A1A' : '#F5F5F5',
    border: isDark ? '#333333' : '#E0E0E0',
    buttonBg: '#1A1A1A',
    buttonText: '#FFFFFF',
  }

  async function generateReceipt(orderId) {
    const itemRows = cartItems.map((i) =>
      `<tr><td>${i.name}</td><td style="text-align:center">${i.quantity}</td><td style="text-align:right">${formatPrice(i.price * i.quantity)}</td></tr>`
    ).join('')

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
            TOTAL: ${formatPrice(totalAmount)}
          </p>
        </body>
      </html>
    `

    const { uri } = await Print.printToFileAsync({ html })
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: 'Save your receipt',
      UTI: 'com.adobe.pdf',
    })
  }

  async function handlePlaceOrder() {
    if (cartItems.length === 0) return
    if (!fullName.trim() || !address.trim() || !city.trim()) {
      Alert.alert('Missing Info', 'Please fill in your shipping details.')
      return
    }

    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()

      // F9 — Decrement stock for each item before placing order
      for (const item of cartItems) {
        const { data: product, error: fetchError } = await supabase
          .from('products')
          .select('stock')
          .eq('id', item.id)
          .single()

        if (fetchError) throw fetchError

        if (product.stock < item.quantity) {
          throw new Error(`Insufficient stock for ${item.name}`)
        }

        const { error: updateError } = await supabase
          .from('products')
          .update({ stock: product.stock - item.quantity })
          .eq('id', item.id)

        if (updateError) throw updateError
      }

      // F9 — Insert order record into Supabase
      const { data, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          full_name: fullName.trim(),
          address: address.trim(),
          city: city.trim(),
          total: totalAmount,
          items: cartItems,
          status: 'completed',
          created_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (orderError) throw orderError

      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)

      
      clearCart()

      
      await generateReceipt(data.id)

      Alert.alert('Success!', 'Order placed successfully.', [
        { text: 'OK', onPress: () => navigation.navigate('Shop') },
      ])
    } catch (error) {
      Alert.alert('Checkout Failed', error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>CHECKOUT</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>SHIPPING DETAILS</Text>

        <TextInput
          style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
          placeholder="Full Name"
          placeholderTextColor={colors.subtext}
          value={fullName}
          onChangeText={setFullName}
        />
        <TextInput
          style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
          placeholder="Address"
          placeholderTextColor={colors.subtext}
          value={address}
          onChangeText={setAddress}
        />
        <TextInput
          style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
          placeholder="City"
          placeholderTextColor={colors.subtext}
          value={city}
          onChangeText={setCity}
        />

        <View style={[styles.summaryCard, { borderColor: colors.border }]}>
          <Text style={[styles.summaryTitle, { color: colors.text }]}>ORDER SUMMARY</Text>
          {cartItems.map((item, idx) => (
            <View key={item.id ?? idx} style={styles.summaryRow}>
              <Text style={{ color: colors.subtext, flex: 1 }} numberOfLines={1}>
                {item.name} × {item.quantity}
              </Text>
              <Text style={{ color: colors.text, fontWeight: '600' }}>
                {formatPrice(item.price * item.quantity)}
              </Text>
            </View>
          ))}
          <View style={[styles.summaryRow, {
            marginTop: 8,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            paddingTop: 8,
          }]}>
            <Text style={[styles.totalLabel, { color: colors.text }]}>Total Amount:</Text>
            <Text style={[styles.totalPrice, { color: colors.text }]}>{formatPrice(totalAmount)}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.placeOrderButton, { backgroundColor: colors.buttonBg }]}
          onPress={handlePlaceOrder}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color={colors.buttonText} />
            : <Text style={{ color: colors.buttonText, fontWeight: '700', letterSpacing: 1 }}>PLACE ORDER</Text>
          }
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 60,
  },
  headerTitle: { fontSize: 16, fontWeight: '700' },
  content: { padding: 20 },
  sectionTitle: { fontSize: 12, fontWeight: '700', marginBottom: 20, letterSpacing: 1.4 },
  input: { height: 48, borderRadius: 8, borderWidth: 1, paddingHorizontal: 16, marginBottom: 20 },
  summaryCard: { borderWidth: 1, borderRadius: 8, padding: 16, marginBottom: 30 },
  summaryTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 1.4, marginBottom: 12 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 4 },
  totalLabel: { fontSize: 13, fontWeight: '700' },
  totalPrice: { fontSize: 16, fontWeight: '700' },
  placeOrderButton: { height: 50, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
})