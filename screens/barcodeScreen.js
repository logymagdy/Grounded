import React, { useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  StyleSheet,
  useColorScheme,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '../lib/supabase'
import { CameraView, useCameraPermissions } from 'expo-camera'
import useCartStore from './useCartStore'
import * as Haptics from 'expo-haptics'
import { formatPrice } from '../lib/utils'

export default function BarcodeScreen({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions()
  const [scanned, setScanned]           = useState(false)
  const [searching, setSearching]       = useState(false)
  const [manualCode, setManualCode]     = useState('')

  const addItem = useCartStore((state) => state.addItem)

  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'
  const colors = {
    background: isDark ? '#0A0A0A' : '#FFFFFF',
    text:       isDark ? '#FFFFFF' : '#1A1A1A',
    subtext:    isDark ? '#888888' : '#AAAAAA',
    border:     isDark ? '#333333' : '#EEEEEE',
    input:      isDark ? '#1A1A1A' : '#F5F5F5',
  }

  function resetScan() {
    setScanned(false)
    setSearching(false)
    setManualCode('')
  }

  // ─── Core lookup — shared by camera scan AND manual entry ─────────────────
  async function lookupBarcode(data) {
    if (searching) return
    setSearching(true)
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)

    try {
      const { data: products, error } = await supabase
        .from('products')
        .select('id, name, price, category, image_url,barcode')
        .eq('barcode', data.trim())
        .limit(1)

      if (error) throw error

      if (!products || products.length === 0) {
        Alert.alert(
          'Not Found',
          `No product matched barcode:\n${data}`,
          [{ text: 'Try Again', onPress: resetScan }]
        )
        return
      }

      const product = products[0]

      if (product.stock === 0) {
        Alert.alert(
          'Out of Stock',
          `${product.name} is currently out of stock.`,
          [{ text: 'Scan Again', onPress: resetScan }]
        )
        return
      }

      // ✅ Add to cart directly
      addItem(product)
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)

      Alert.alert(
        '✓ Added to Cart',
        `${product.name}\n${formatPrice(product.price)}`,
        [
          { text: 'Scan Another', onPress: resetScan },
          { text: 'View Cart',    onPress: () => navigation.navigate('Cart') },
        ]
      )
    } catch (err) {
      Alert.alert('Error', err.message)
      resetScan()
    } finally {
      setSearching(false)
    }
  }

  // ─── Camera scan handler ──────────────────────────────────────────────────
  async function handleBarcodeScanned({ data }) {
    if (scanned || searching) return
    setScanned(true)
    await lookupBarcode(data)
  }

  async function handleManualSubmit() {
    if (!manualCode.trim()) {
      Alert.alert('Enter a barcode number first.')
      return
    }
    setScanned(true)
    await lookupBarcode(manualCode.trim())
  }

  if (!permission) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.subtext, fontSize: 12, letterSpacing: 1.2 }}>
          REQUESTING CAMERA PERMISSION...
        </Text>
      </View>
    )
  }

  if (!permission.granted) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background, paddingHorizontal: 32 }]}>
        <Ionicons name="camera-outline" size={48} color={colors.subtext} />
        <Text style={{ marginTop: 16, fontSize: 14, color: colors.text, fontWeight: '600', textAlign: 'center', marginBottom: 20 }}>
          Camera access is required to scan barcodes.
        </Text>
        <TouchableOpacity onPress={requestPermission} style={styles.darkBtn}>
          <Text style={styles.darkBtnText}>GRANT PERMISSION</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#000000' }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Camera */}
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39', 'qr'],
        }}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>SCAN BARCODE</Text>
      </View>

      {/* Scan frame */}
      <View style={styles.frameWrapper}>
        <View style={styles.frame}>
          {[
            { top: -2, left: -2 },
            { top: -2, right: -2 },
            { bottom: -2, left: -2 },
            { bottom: -2, right: -2 },
          ].map((pos, i) => (
            <View
              key={i}
              style={[styles.corner, {
                borderTopWidth:    i < 2  ? 3 : 0,
                borderBottomWidth: i >= 2 ? 3 : 0,
                borderLeftWidth:   i % 2 === 0 ? 3 : 0,
                borderRightWidth:  i % 2 !== 0 ? 3 : 0,
              }, pos]}
            />
          ))}
        </View>
      </View>

      {/* Status */}
      <View style={styles.statusWrapper}>
        <Text style={styles.statusText}>
          {searching ? 'SEARCHING CATALOG...' : 'ALIGN BARCODE IN FRAME'}
        </Text>
      </View>

      {/* ─── Manual entry panel (bottom) ──────────────────────────────────────
          Works in Expo Go — type the barcode number and tap Search.
          Same lookupBarcode() function as camera scan.          */}
      <View style={[styles.manualPanel, { backgroundColor: colors.background }]}>
        <Text style={[styles.manualLabel, { color: colors.subtext }]}>
          OR ENTER BARCODE MANUALLY
        </Text>
        <View style={styles.manualRow}>
          <TextInput
            style={[styles.manualInput, {
              backgroundColor: colors.input,
              color: colors.text,
              borderColor: colors.border,
            }]}
            placeholder="e.g. 5901234123457"
            placeholderTextColor={colors.subtext}
            value={manualCode}
            onChangeText={setManualCode}
            keyboardType="numeric"
            returnKeyType="search"
            onSubmitEditing={handleManualSubmit}
            editable={!searching}
          />
          <TouchableOpacity
            onPress={handleManualSubmit}
            disabled={searching}
            style={[styles.manualBtn, searching && { opacity: 0.5 }]}
          >
            <Ionicons name="search" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  darkBtn: {
    backgroundColor: '#1A1A1A',
    paddingHorizontal: 28,
    height: 50,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  darkBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    letterSpacing: 1,
  },
  header: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 10,
  },
  backBtn: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 8,
    marginRight: 12,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
  },
  frameWrapper: {
    position: 'absolute',
    top: '28%',
    alignSelf: 'center',
  },
  frame: {
    width: 240,
    height: 160,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  corner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: '#476774',
  },
  statusWrapper: {
    position: 'absolute',
    top: '54%',
    alignSelf: 'center',
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    letterSpacing: 1.2,
    fontWeight: '600',
    textAlign: 'center',
  },
  // Manual entry
  manualPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 36,
  },
  manualLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.4,
    marginBottom: 12,
    textAlign: 'center',
  },
  manualRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  manualInput: {
    flex: 1,
    height: 50,
    borderRadius: 30,
    borderWidth: 1,
    paddingHorizontal: 18,
    fontSize: 15,
  },
  manualBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
    justifyContent: 'center',
  },
})