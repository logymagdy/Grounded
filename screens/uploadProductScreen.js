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
import * as FileSystem from 'expo-file-system'
import { supabase } from '../lib/supabase'

export default function UploadProductScreen() {
  const [imageUri, setImageUri] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [productName, setProductName] = useState('')
  const [productPrice, setProductPrice] = useState('')
  const [productCategory, setProductCategory] = useState('')

  // ─── F3: Pick image from gallery ─────────────────────────────────────────
  async function pickImage() {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!permissionResult.granted) {
      Alert.alert('Permission required', 'Permission to access the media library is required.')
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 1,
    })

    if (!result.canceled) {
      setImageUri(result.assets[0].uri)
    }
  }

  // ─── F3: Capture from camera ──────────────────────────────────────────────
  async function openCamera() {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync()
    if (!permissionResult.granted) {
      Alert.alert('Permission required', 'Permission to access the camera is required.')
      return
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    })

    if (!result.canceled) {
      setImageUri(result.assets[0].uri)
    }
  }

  // ─── F3: Upload image + save product record ───────────────────────────────
  async function uploadProduct() {
    if (!imageUri) {
      Alert.alert('No image', 'Please select or capture a product image first.')
      return
    }
    if (!productName.trim() || !productPrice.trim() || !productCategory.trim()) {
      Alert.alert('Missing fields', 'Please fill in all product details.')
      return
    }

    try {
      setUploading(true)

      // Log the imageUri to inspect the local file path being processed
      console.log('Selected Image URI:', imageUri)

      // Normalise category to match filter chips exactly
      const validCategories = ['Tents', 'Bags', 'Apparel', 'Equipment']
      const inputCategory = productCategory.trim()
      const matchedCategory = validCategories.find(
        (c) => c.toLowerCase() === inputCategory.toLowerCase()
      )
      const finalCategory = matchedCategory || inputCategory

      // Convert local URI → ArrayBuffer for Supabase Storage upload
      const arraybuffer = await fetch(imageUri).then((res) => res.arrayBuffer())

      const fileExt = imageUri.split('.').pop()?.toLowerCase() ?? 'jpeg'
      const filename = `${Date.now()}.${fileExt}`

      // ─── IMPORTANT: upload path must match what productListScreen expects.
      //     Storage structure confirmed from Supabase dashboard:
      //      bucket: product-images
      //      subfolder: products/
      //     So the correct storage path is: products/{filename}
      // ─────────────────────────────────────────────────────────────────────
      const storagePath = `products/${filename}`

      // F3 — Upload to 'product-images' bucket under 'products/' subfolder
      const { data: storageData, error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(storagePath, arraybuffer, { contentType: `image/${fileExt}` })

      if (uploadError) throw uploadError

      // F3 — Get the full public https:// URL from the confirmed storage path
      const { data: publicUrlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(storageData.path)

      if (!publicUrlData?.publicUrl) {
        throw new Error('Could not get public URL from Supabase Storage.')
      }

      // F3 — Insert product record. image_url holds the full public URL
      // so productListScreen's resolveImageUrl() can extract the filename
      // and build: getPublicUrl(`products/${filename}`) correctly.
      const { error: dbError } = await supabase.from('products').insert({
        name: productName.trim(),
        price: parseFloat(productPrice),
        category: finalCategory,
        image_url: publicUrlData.publicUrl,
        stock: 10,
      })

      if (dbError) throw dbError

      // F8 — Bust the local file-system cache so productListScreen
      // fetches fresh data on its next useFocusEffect call
      const cachePath = FileSystem.documentDirectory + 'products_cache.json'
      await FileSystem.deleteAsync(cachePath, { idempotent: true })

      Alert.alert('Success', 'Product uploaded successfully!')
      setImageUri(null)
      setProductName('')
      setProductPrice('')
      setProductCategory('')
    } catch (error) {
      Alert.alert('Upload Failed', error.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      {/* ─── Header ──────────────────────────────────────────────────────── */}
      <Text style={styles.screenTitle}>ADD PRODUCT</Text>
      <View style={styles.divider} />

      {/* ─── Image Preview ────────────────────────────────────────────────── */}
      <View style={styles.imagePreviewBox}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="cover" />
        ) : (
          <Text style={styles.placeholderText}>NO IMAGE SELECTED</Text>
        )}
      </View>

      {/* ─── Gallery / Camera buttons ─────────────────────────────────────── */}
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

      {/* ─── Product Name ─────────────────────────────────────────────────── */}
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

      {/* ─── Price ────────────────────────────────────────────────────────── */}
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

      {/* ─── Category ─────────────────────────────────────────────────────── */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>CATEGORY</Text>
        <TextInput
          value={productCategory}
          onChangeText={setProductCategory}
          placeholder="Tents / Bags / Apparel / Equipment"
          placeholderTextColor="#AAAAAA"
          style={styles.input}
        />
      </View>

      {/* ─── Upload button ────────────────────────────────────────────────── */}
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
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { padding: 24, paddingTop: 40 },
  screenTitle: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 2,
    color: '#1A1A1A',
    marginBottom: 12,
  },
  divider: { height: 1, backgroundColor: '#EEEEEE', marginBottom: 24 },
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
  previewImage: { width: '100%', height: '100%' },
  placeholderText: {
    fontSize: 10,
    letterSpacing: 2,
    color: '#BBBBBB',
    fontWeight: '600',
  },
  buttonRow: { flexDirection: 'row', gap: 10, marginBottom: 28 },
  halfButton: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.4 },
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
  fieldGroup: { marginBottom: 18 },
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
  },
})