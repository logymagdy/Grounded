// screens/ProfileScreen.js
// ─────────────────────────────────────────────────────────────────────────────
// FEATURES IN THIS FILE:
//
// F3  — Product Image Upload → expo-image-picker picks photo → uploads to
//                              Supabase Storage → saves product record
//                              Source: https://docs.expo.dev/versions/latest/sdk/image-picker/
//
// F6  — Push Notifications   → expo-notifications registers device token →
//                              saves to Supabase push_tokens table →
//                              sends local demo notification
//                              Source: https://docs.expo.dev/versions/latest/sdk/notifications/
//
// F13 — Dark/Light Mode      → useColorScheme
// F14 — Haptic Feedback      → expo-haptics on upload success
// F18 — Localization         → formatPrice from App.js
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  ScrollView,
  useColorScheme,
  Platform,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '../lib/supabase'

// F3 — Product Image Upload
import * as ImagePicker from 'expo-image-picker'

// F6 — Push Notifications
import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'

// F14 — Haptic Feedback
import * as Haptics from 'expo-haptics'

// F18 — Localization
import { formatPrice } from '../App'

export default function ProfileScreen() {
  const [user, setUser] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [imageUri, setImageUri] = useState(null)
  const [productName, setProductName] = useState('')
  const [productPrice, setProductPrice] = useState('')
  const [productCategory, setProductCategory] = useState('')
  const [notifRegistered, setNotifRegistered] = useState(false)

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

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
    })
  }, [])

  // ─── F3: Pick image from device library ──────────────────────────────────
  async function pickImage() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photo library.')
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    })

    if (!result.canceled) {
      setImageUri(result.assets[0].uri)
    }
  }

  // ─── F3: Upload image to Supabase Storage + insert product record ─────────
  async function handleUploadProduct() {
    if (!imageUri || !productName.trim() || !productPrice.trim()) {
      Alert.alert('Missing Info', 'Please fill in all fields and select an image.')
      return
    }

    try {
      setUploading(true)

      // Convert URI → Blob for upload
      const response = await fetch(imageUri)
      const blob = await response.blob()

      const fileExt = imageUri.split('.').pop()
      const fileName = `${Date.now()}.${fileExt}`
      const filePath = `products/${fileName}`

      // Upload to Supabase Storage bucket 'product-images'
      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, blob, {
          contentType: `image/${fileExt}`,
          upsert: false,
        })

      if (uploadError) throw uploadError

      // Get public URL of uploaded image
      const { data: urlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath)

      const publicUrl = urlData.publicUrl

      // Insert product record into Supabase products table
      const { error: insertError } = await supabase.from('products').insert({
        name: productName.trim(),
        price: parseFloat(productPrice),
        category: productCategory.trim() || 'Gear',
        image_url: publicUrl,
      })

      if (insertError) throw insertError

      // F14 — Haptic success
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)

      // Reset form
      setImageUri(null)
      setProductName('')
      setProductPrice('')
      setProductCategory('')

      Alert.alert('Success', 'Product uploaded successfully!')
    } catch (error) {
      Alert.alert('Upload Error', error.message)
    } finally {
      setUploading(false)
    }
  }

  // ─── F6: Register for Push Notifications ─────────────────────────────────
  async function registerForPushNotifications() {
    if (!Device.isDevice) {
      Alert.alert('Physical device required', 'Push notifications only work on real devices.')
      return
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync()
    let finalStatus = existingStatus

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync()
      finalStatus = status
    }

    if (finalStatus !== 'granted') {
      Alert.alert('Permission denied', 'Enable notifications in your device settings.')
      return
    }

    // Get Expo push token
    const tokenData = await Notifications.getExpoPushTokenAsync()
    const token = tokenData.data

    // Android requires a notification channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#476774',
      })
    }

    // Save token to Supabase push_tokens table
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser()

    if (currentUser) {
      await supabase
        .from('push_tokens')
        .upsert({ user_id: currentUser.id, token }, { onConflict: 'user_id' })
    }

    setNotifRegistered(true)

    // F6 — Schedule a local demo notification to confirm setup works
    // FIX: trigger must use { type, seconds, repeats } object — { seconds: 2 } alone is deprecated
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Notifications enabled!',
        body: 'You will now receive order updates and promotions.',
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 2, repeats: false },
    })
  }

  // ─── Logout ───────────────────────────────────────────────────────────────
  async function handleLogout() {
    const { error } = await supabase.auth.signOut()
    if (error) Alert.alert('Error', error.message)
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 60, paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >
      {/* ─── Header ────────────────────────────────────────────────── */}
      <Text
        style={{
          fontSize: 18,
          fontWeight: '700',
          color: colors.text,
          letterSpacing: 1,
          textTransform: 'uppercase',
          marginBottom: 6,
        }}
      >
        Profile
      </Text>
      {user && (
        <Text style={{ fontSize: 13, color: colors.subtext, marginBottom: 28 }}>
          {user.email}
        </Text>
      )}

      {/* ─── F6: Push Notifications ──────────────────────────────── */}
      <Text
        style={{
          fontSize: 11,
          letterSpacing: 1.4,
          fontWeight: '700',
          color: colors.subtext,
          marginBottom: 12,
          textTransform: 'uppercase',
        }}
      >
        Notifications
      </Text>
      <TouchableOpacity
        onPress={registerForPushNotifications}
        disabled={notifRegistered}
        style={{
          backgroundColor: notifRegistered ? '#476774' : '#1A1A1A',
          height: 50,
          borderRadius: 10,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          marginBottom: 28,
        }}
      >
        <Ionicons
          name={notifRegistered ? 'notifications' : 'notifications-outline'}
          size={18}
          color="#FFFFFF"
        />
        <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '700', letterSpacing: 1 }}>
          {notifRegistered ? 'NOTIFICATIONS ENABLED' : 'ENABLE NOTIFICATIONS'}
        </Text>
      </TouchableOpacity>

      {/* ─── F3: Product Upload ──────────────────────────────────── */}
      <Text
        style={{
          fontSize: 11,
          letterSpacing: 1.4,
          fontWeight: '700',
          color: colors.subtext,
          marginBottom: 12,
          textTransform: 'uppercase',
        }}
      >
        Upload Product
      </Text>

      {/* Image picker area */}
      <TouchableOpacity
        onPress={pickImage}
        style={{
          height: 160,
          backgroundColor: colors.card,
          borderRadius: 10,
          borderWidth: 1,
          borderColor: colors.border,
          borderStyle: 'dashed',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 14,
          overflow: 'hidden',
        }}
      >
        {imageUri ? (
          <Image
            source={{ uri: imageUri }}
            style={{ width: '100%', height: '100%' }}
            resizeMode="cover"
          />
        ) : (
          <View style={{ alignItems: 'center' }}>
            <Ionicons name="image-outline" size={32} color={colors.subtext} />
            <Text
              style={{
                marginTop: 8,
                fontSize: 11,
                color: colors.subtext,
                letterSpacing: 1,
                fontWeight: '600',
              }}
            >
              TAP TO SELECT IMAGE
            </Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Product Name */}
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
        Product Name
      </Text>
      <TextInput
        value={productName}
        onChangeText={setProductName}
        placeholder="e.g. Cave Tent"
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

      {/* Product Price */}
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
        Price
      </Text>
      <TextInput
        value={productPrice}
        onChangeText={setProductPrice}
        placeholder="e.g. 299.99"
        placeholderTextColor={colors.subtext}
        keyboardType="decimal-pad"
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

      {/* Product Category */}
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
        Category
      </Text>
      <TextInput
        value={productCategory}
        onChangeText={setProductCategory}
        placeholder="e.g. Tents"
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
          marginBottom: 20,
        }}
      />

      {/* Upload Button */}
      <TouchableOpacity
        onPress={handleUploadProduct}
        disabled={uploading}
        style={{
          backgroundColor: uploading ? '#888888' : '#1A1A1A',
          height: 54,
          borderRadius: 30,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 28,
        }}
      >
        <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '700', letterSpacing: 1.5 }}>
          {uploading ? 'UPLOADING...' : 'UPLOAD PRODUCT'}
        </Text>
      </TouchableOpacity>

      {/* ─── Logout ──────────────────────────────────────────────── */}
      <View style={{ height: 1, backgroundColor: colors.border, marginBottom: 24 }} />
      <TouchableOpacity
        onPress={handleLogout}
        style={{
          height: 50,
          borderRadius: 10,
          borderWidth: 1,
          borderColor: colors.border,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          gap: 8,
        }}
      >
        <Ionicons name="log-out-outline" size={18} color="#CC0000" />
        <Text style={{ color: '#CC0000', fontSize: 12, fontWeight: '700', letterSpacing: 1 }}>
          SIGN OUT
        </Text>
      </TouchableOpacity>
    </ScrollView>
  )
}