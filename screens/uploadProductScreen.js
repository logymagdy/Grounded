import { useState } from 'react'
import {
  View,
  Text,
  Image,
  Alert,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
} from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { supabase } from '../lib/supabase'

export default function UploadProductScreen() {
  const [imageUri, setImageUri] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [productName, setProductName] = useState('')
  const [productPrice, setProductPrice] = useState('')
  const [productCategory, setProductCategory] = useState('')

  // ─── Pick from gallery ─────────────────────────────────────────────────────
  // Source: expo-image-picker docs — requestMediaLibraryPermissionsAsync + launchImageLibraryAsync
  async function pickImage() {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync()

    if (permissionResult.granted === false) {
      Alert.alert('Permission required', 'Permission to access the media library is required.')
      return
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 1,
    })

    if (!result.canceled) {
      setImageUri(result.assets[0].uri)
    } else {
      Alert.alert('No image selected.')
    }
  }

  // ─── Capture from camera ───────────────────────────────────────────────────
  // Source: expo-image-picker docs — requestCameraPermissionsAsync + launchCameraAsync
  async function openCamera() {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync()

    if (permissionResult.granted === false) {
      Alert.alert('Permission required', 'Permission to access the camera is required.')
      return
    }

    let result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    })

    if (!result.canceled) {
      setImageUri(result.assets[0].uri)
    }
  }

  // ─── Upload to Supabase Storage ────────────────────────────────────────────
  // Source: Supabase official docs — Avatar.tsx uploadAvatar()
  async function uploadProduct() {
    if (!imageUri) {
      Alert.alert('Please select or capture a product image first.')
      return
    }
    if (!productName || !productPrice || !productCategory) {
      Alert.alert('Please fill in all product details.')
      return
    }

    try {
      setUploading(true)

      // Convert URI to arraybuffer — from Supabase Avatar.tsx docs
      const arraybuffer = await fetch(imageUri).then((res) => res.arrayBuffer())

      const fileExt = imageUri.split('.').pop()?.toLowerCase() ?? 'jpeg'
      const path = `${Date.now()}.${fileExt}`

      // Upload image to Supabase Storage bucket: 'product-images'
      const { data, error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(path, arraybuffer, {
          contentType: `image/${fileExt}`,
        })

      if (uploadError) throw uploadError

      // Save product record to DB with the storage path
      const { error: dbError } = await supabase.from('products').insert({
        name: productName,
        price: parseFloat(productPrice),
        category: productCategory,
        image_url: data.path,
      })

      if (dbError) throw dbError

      Alert.alert('Product uploaded successfully!')
      setImageUri(null)
      setProductName('')
      setProductPrice('')
      setProductCategory('')
    } catch (error) {
      Alert.alert(error.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      {/* ─── Header ────────────────────────────────────────────────────────── */}
      <Text style={styles.screenTitle}>ADD PRODUCT</Text>
      <View style={styles.divider} />

      {/* ─── Image Preview ─────────────────────────────────────────────────── */}
      <View style={styles.imagePreviewBox}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="cover" />
        ) : (
          <Text style={styles.placeholderText}>NO IMAGE SELECTED</Text>
        )}
      </View>

      {/* ─── Image Source Buttons ──────────────────────────────────────────── */}
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.halfButton, uploading && styles.buttonDisabled]}
          onPress={pickImage}
          disabled={uploading}
        >
          <Text style={styles.buttonText}>GALLERY</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.halfButton, uploading && styles.buttonDisabled]}
          onPress={openCamera}
          disabled={uploading}
        >
          <Text style={styles.buttonText}>CAMERA</Text>
        </TouchableOpacity>
      </View>

      {/* ─── Product Details ───────────────────────────────────────────────── */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>PRODUCT NAME</Text>
        <TextInput
          value={productName}
          onChangeText={setProductName}
          placeholder="e.g. The Cave XL"
          placeholderTextColor="#AAAAAA"
          style={styles.input}
        />
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>PRICE (USD)</Text>
        <TextInput
          value={productPrice}
          onChangeText={setProductPrice}
          placeholder="e.g. 1007.56"
          placeholderTextColor="#AAAAAA"
          keyboardType="decimal-pad"
          style={styles.input}
        />
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>CATEGORY</Text>
        <TextInput
          value={productCategory}
          onChangeText={setProductCategory}
          placeholder="Tents / Bags / Apparel / Gear"
          placeholderTextColor="#AAAAAA"
          style={styles.input}
        />
      </View>

      {/* ─── Upload Button ─────────────────────────────────────────────────── */}
      <TouchableOpacity
        style={[styles.uploadButton, uploading && styles.buttonDisabled]}
        onPress={uploadProduct}
        disabled={uploading}
      >
        <Text style={styles.uploadButtonText}>
          {uploading ? 'UPLOADING ...' : 'UPLOAD PRODUCT'}
        </Text>
      </TouchableOpacity>

    </ScrollView>
  )
}

const styles = StyleSheet.create({
  // ─── Layout ──────────────────────────────────────────────────────────────
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    padding: 24,
    paddingTop: 40,
  },

  // ─── Header ──────────────────────────────────────────────────────────────
  screenTitle: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 2,
    color: '#1A1A1A',
    marginBottom: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#EEEEEE',
    marginBottom: 24,
  },

  // ─── Image Preview ───────────────────────────────────────────────────────
  imagePreviewBox: {
    width: '100%',
    height: 220,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  placeholderText: {
    fontSize: 10,
    letterSpacing: 2,
    color: '#BBBBBB',
    fontWeight: '600',
  },

  // ─── Buttons ─────────────────────────────────────────────────────────────
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 28,
  },
  halfButton: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.8,
  },
  uploadButton: {
    backgroundColor: '#1A1A1A',
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  uploadButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
  },

  // ─── Form Fields ─────────────────────────────────────────────────────────
  fieldGroup: {
    marginBottom: 18,
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1.4,
    color: '#999999',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    padding: 12,
    fontSize: 14,
    color: '#1A1A1A',
    backgroundColor: '#FAFAFA',
    borderRadius: 0,
  },
})