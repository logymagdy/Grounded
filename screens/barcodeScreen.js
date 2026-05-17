// screens/BarcodeScreen.js
// ─────────────────────────────────────────────────────────────────────────────
// FEATURES IN THIS FILE:
//
// F4  — Barcode Scanner   → expo-camera CameraView scans barcodes →
//                           looks up product in Supabase by barcode field →
//                           shows result → add to cart
//                           Source: https://docs.expo.dev/versions/latest/sdk/camera/
//
// F5  — Shopping Cart     → useCartStore addItem on scan result
//
// F13 — Dark/Light Mode   → useColorScheme
//
// F14 — Haptic Feedback   → expo-haptics on successful scan + add to cart
// F18 — Localization      → formatPrice from App.js
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect, useRef } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  StyleSheet,
  useColorScheme,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '../lib/supabase'

// F4 — Barcode Scanner using expo-camera CameraView
// Source: https://docs.expo.dev/versions/latest/sdk/camera/
import { CameraView, useCameraPermissions } from 'expo-camera'

// F5 — Cart
import useCartStore from './useCartStore'

// F14 — Haptic Feedback
import * as Haptics from 'expo-haptics'

// F18 — Localization
import { formatPrice } from '../App'

export default function BarcodeScreen({ navigation }) {
  const [scanned, setScanned] = useState(false)
  const [foundProduct, setFoundProduct] = useState(null)
  const [searching, setSearching] = useState(false)

  // F4 — Request camera permissions using expo-camera hook
  // Source: https://docs.expo.dev/versions/latest/sdk/camera/
  const [permission, requestPermission] = useCameraPermissions()

  // F5 — Cart
  const addItem = useCartStore((state) => state.addItem)

  // F13 — Dark/Light Mode
  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'
  const colors = {
    background: isDark ? '#0A0A0A' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#1A1A1A',
    subtext: isDark ? '#888888' : '#AAAAAA',
    card: isDark ? '#1A1A1A' : '#F5F5F5',
    border: isDark ? '#333333' : '#EEEEEE',
  }

  // ─── F4: Handle barcode scan result ──────────────────────────────────────
  // Source: https://docs.expo.dev/versions/latest/sdk/camera/
  // onBarcodeScanned fires when CameraView detects a barcode
  async function handleBarcodeScanned({ type, data }) {
    if (scanned || searching) return
    setScanned(true)
    setSearching(true)

    // F14 — Haptic impact on scan
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)

    try {
      // F4 — Look up product in Supabase by barcode value
      // Source: https://supabase.com/docs/reference/javascript/select
      const { data: products, error } = await supabase
        .from('products')
        .select('id, name, price, category, image_url, stock')
        .eq('barcode', data)
        .limit(1)

      if (error) throw error

      if (products && products.length > 0) {
        setFoundProduct(products[0])
      } else {
        Alert.alert(
          'Not Found',
          `No product found for barcode: ${data}`,
          [{ text: 'Scan Again', onPress: () => setScanned(false) }]
        )
      }
    } catch (error) {
      Alert.alert('Error', error.message)
      setScanned(false)
    } finally {
      setSearching(false)
    }
  }

  // ─── F5 + F14: Add scanned product to cart ───────────────────────────────
  function handleAddToCart() {
    if (!foundProduct) return
    addItem(foundProduct)
    // F14 — Haptic success on add to cart
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    Alert.alert('Added!', `${foundProduct.name} added to cart.`, [
      { text: 'Keep Scanning', onPress: () => { setFoundProduct(null); setScanned(false) } },
      { text: 'View Cart', onPress: () => navigation.navigate('Cart') },
    ])
  }

  // ─── Permission not yet determined ───────────────────────────────────────
  if (!permission) {
    return <View style={{ flex: 1, backgroundColor: colors.background }} />
  }

  // ─── Permission denied ────────────────────────────────────────────────────
  if (!permission.granted) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
        <Ionicons name="camera-outline" size={48} color={colors.subtext} />
        <Text style={{ marginTop: 16, fontSize: 14, color: colors.text, fontWeight: '600', textAlign: 'center', marginBottom: 20 }}>
          Camera access is required to scan barcodes.
        </Text>
        <TouchableOpacity
          onPress={requestPermission}
          style={{ backgroundColor: '#1A1A1A', paddingHorizontal: 28, height: 50, borderRadius: 30, alignItems: 'center', justifyContent: 'center' }}
        >
          <Text style={{ color: '#FFFFFF', fontWeight: '700', letterSpacing: 1 }}>GRANT PERMISSION</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#000000' }}>

      {/* ─── F4: CameraView with barcode scanning enabled ──────── */}
      {/* Source: https://docs.expo.dev/versions/latest/sdk/camera/ */}
      {/* barcodeScannerSettings defines which barcode types to detect */}
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: [
            'qr', 'ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39',
          ],
        }}
      />

      {/* ─── Header overlay ──────────────────────────────────────── */}
      <View style={{ position: 'absolute', top: 50, left: 20, right: 20, flexDirection: 'row', alignItems: 'center' }}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20, padding: 8, marginRight: 12 }}
        >
          <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' }}>
          Scan Barcode
        </Text>
      </View>

      {/* ─── Scan frame overlay ───────────────────────────────────── */}
      <View style={{
        position: 'absolute',
        top: '30%',
        alignSelf: 'center',
        width: 240,
        height: 160,
        borderWidth: 2,
        borderColor: '#FFFFFF',
        borderRadius: 12,
        backgroundColor: 'transparent',
      }}>
        {/* Corner accents */}
        {[
          { top: -2, left: -2 },
          { top: -2, right: -2 },
          { bottom: -2, left: -2 },
          { bottom: -2, right: -2 },
        ].map((pos, i) => (
          <View key={i} style={[{
            position: 'absolute',
            width: 20, height: 20,
            borderColor: '#476774',
            borderTopWidth: i < 2 ? 3 : 0,
            borderBottomWidth: i >= 2 ? 3 : 0,
            borderLeftWidth: i % 2 === 0 ? 3 : 0,
            borderRightWidth: i % 2 !== 0 ? 3 : 0,
          }, pos]} />
        ))}
      </View>

      {/* ─── Status text ──────────────────────────────────────────── */}
      <View style={{ position: 'absolute', top: '58%', alignSelf: 'center' }}>
        <Text style={{ color: '#FFFFFF', fontSize: 12, letterSpacing: 1.2, fontWeight: '600', textAlign: 'center' }}>
          {searching ? 'SEARCHING CATALOG...' : scanned ? '' : 'ALIGN BARCODE IN FRAME'}
        </Text>
      </View>

      {/* ─── Found Product card ───────────────────────────────────── */}
      {foundProduct && (
        <View style={{
          position: 'absolute',
          bottom: 0, left: 0, right: 0,
          backgroundColor: colors.background,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          padding: 24,
          paddingBottom: 40,
        }}>
          <Text style={{ fontSize: 9, letterSpacing: 1.4, color: colors.subtext, fontWeight: '700', textTransform: 'uppercase', marginBottom: 4 }}>
            {foundProduct.category}
          </Text>
          <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 4 }}>
            {foundProduct.name}
          </Text>
          {/* F18 — formatPrice for correct currency */}
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#476774', marginBottom: 20 }}>
            {formatPrice(foundProduct.price)}
          </Text>

          <View style={{ flexDirection: 'row', gap: 12 }}>
            {/* Scan Again */}
            <TouchableOpacity
              onPress={() => { setFoundProduct(null); setScanned(false) }}
              style={{
                flex: 1, height: 50, borderRadius: 30,
                borderWidth: 1, borderColor: colors.border,
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Text style={{ color: colors.text, fontSize: 11, fontWeight: '700', letterSpacing: 1 }}>
                SCAN AGAIN
              </Text>
            </TouchableOpacity>

            {/* Add to Cart */}
            <TouchableOpacity
              onPress={handleAddToCart}
              style={{
                flex: 2, height: 50, borderRadius: 30,
                backgroundColor: '#1A1A1A',
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '700', letterSpacing: 1 }}>
                ADD TO CART
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  )
}