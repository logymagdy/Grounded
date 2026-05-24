// screens/StoreLocatorScreen.js
// ─────────────────────────────────────────────────────────────────────────────
// FEATURES IN THIS FILE:
//
// F7  — Store Locator     → expo-location gets user GPS coordinates →
//                           react-native-maps shows map with store markers
//                           Source: https://docs.expo.dev/versions/latest/sdk/location/
//                                   https://github.com/react-native-maps/react-native-maps
//
// F13 — Dark/Light Mode   → useColorScheme + map customUserLocationAnnotationTitle
// F14 — Haptic Feedback   → expo-haptics on marker press
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  useColorScheme,
  ActivityIndicator,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'

// F7 — expo-location: get device GPS coordinates
// Source: https://docs.expo.dev/versions/latest/sdk/location/
import * as Location from 'expo-location'

// F7 — react-native-maps: render map with markers
// Source: https://github.com/react-native-maps/react-native-maps
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps'

// F14 — Haptic Feedback
import * as Haptics from 'expo-haptics'

// ─── Dummy store locations (replace with real coords later) ──────────────────
const STORES = [
  {
    id: 1,
    name: 'Grounded Cairo',
    description: 'Mall of Egypt, 6th of October',
    coordinate: { latitude: 29.9792, longitude: 30.9388 },
  },
  {
    id: 2,
    name: 'Grounded Alexandria',
    description: 'San Stefano Grand Plaza',
    coordinate: { latitude: 31.2357, longitude: 29.9553 },
  },
  {
    id: 3,
    name: 'Grounded New Cairo',
    description: 'Cairo Festival City Mall',
    coordinate: { latitude: 30.0131, longitude: 31.4061 },
  },
  {
    id: 4,
    name: 'Grounded Maadi',
    description: 'Carrefour Maadi City Centre',
    coordinate: { latitude: 29.9625, longitude: 31.2572 },
  },
  {
    id: 5,
    name: 'Grounded Zamalek',
    description: '26th of July Corridor',
    coordinate: { latitude: 30.0619, longitude: 31.2178 },
  },
]

export default function StoreLocatorScreen({ navigation }) {
  const [userLocation, setUserLocation] = useState(null)
  const [loadingLocation, setLoadingLocation] = useState(true)
  const [selectedStore, setSelectedStore] = useState(null)

  // F13 — Dark/Light Mode
  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'
  const colors = {
    background: isDark ? '#0A0A0A' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#1A1A1A',
    subtext: isDark ? '#888888' : '#AAAAAA',
    card: isDark ? '#1A1A1A' : '#FFFFFF',
    border: isDark ? '#333333' : '#F0F0F0',
  }

  useEffect(() => {
    getLocation()
  }, [])

  // ─── F7: Request location permission + get current position ──────────────
  // Source: https://docs.expo.dev/versions/latest/sdk/location/
  // Location.requestForegroundPermissionsAsync asks for while-in-use permission
  async function getLocation() {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location access is needed to find nearby stores.')
        setLoadingLocation(false)
        return
      }

      // F7 — Location.getCurrentPositionAsync gets one-time GPS fix
      // Source: https://docs.expo.dev/versions/latest/sdk/location/
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      })

      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.5,
        longitudeDelta: 0.5,
      })
    } catch (error) {
      Alert.alert('Error', error.message)
    } finally {
      setLoadingLocation(false)
    }
  }

  // F14 — Haptic on store marker press
  function handleMarkerPress(store) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setSelectedStore(store)
  }

  // Default map region centered on Cairo if location not yet available
  const defaultRegion = {
    latitude: 30.0444,
    longitude: 31.2357,
    latitudeDelta: 1.5,
    longitudeDelta: 1.5,
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>

      {/* ─── Header ────────────────────────────────────────────────── */}
      <View style={{
        position: 'absolute', top: 50, left: 20, right: 20,
        zIndex: 10, flexDirection: 'row', alignItems: 'center',
      }}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ backgroundColor: colors.card, borderRadius: 20, padding: 8, marginRight: 12, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 }}
        >
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={{ backgroundColor: colors.card, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10, flex: 1, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text, letterSpacing: 1, textTransform: 'uppercase' }}>
            Store Locator
          </Text>
          <Text style={{ fontSize: 11, color: colors.subtext, marginTop: 2 }}>
            {STORES.length} locations
          </Text>
        </View>
      </View>

      {/* ─── F7: MapView with store markers ──────────────────────── */}
      {/* Source: https://github.com/react-native-maps/react-native-maps */}
      {loadingLocation ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={colors.text} />
          <Text style={{ marginTop: 12, color: colors.subtext, fontSize: 12, letterSpacing: 1 }}>
            FINDING YOUR LOCATION...
          </Text>
        </View>
      ) : (
        <MapView
          style={{ flex: 1 }}
          provider={PROVIDER_DEFAULT}
          initialRegion={userLocation ?? defaultRegion}
          showsUserLocation={true}           // shows blue dot for user location
          showsMyLocationButton={true}
        >
          {/* F7 — Render a Marker for each store location */}
          {/* Source: https://github.com/react-native-maps/react-native-maps */}
          {STORES.map((store) => (
            <Marker
              key={store.id}
              coordinate={store.coordinate}
              title={store.name}
              description={store.description}
              pinColor="#476774"
              onPress={() => handleMarkerPress(store)}
            />
          ))}
        </MapView>
      )}

      {/* ─── Selected store info card ─────────────────────────────── */}
      {selectedStore && (
        <View style={{
          position: 'absolute',
          bottom: 0, left: 0, right: 0,
          backgroundColor: colors.card,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          padding: 24,
          paddingBottom: 40,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          shadowColor: '#000',
          shadowOpacity: 0.15,
          shadowRadius: 10,
          elevation: 8,
        }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View>
              <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 4 }}>
                {selectedStore.name}
              </Text>
              <Text style={{ fontSize: 13, color: colors.subtext }}>
                {selectedStore.description}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setSelectedStore(null)}
              style={{ padding: 4 }}
            >
              <Ionicons name="close" size={20} color={colors.subtext} />
            </TouchableOpacity>
          </View>

          {/* Store indicator dot */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 16, gap: 8 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#476774' }} />
            <Text style={{ fontSize: 11, color: '#476774', fontWeight: '700', letterSpacing: 0.8 }}>
             Grounded STORE
            </Text>
          </View>
        </View>
      )}
    </View>
  )
}