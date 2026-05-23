import React, { useState, useEffect, useRef } from 'react'
import { supabase } from './lib/supabase'
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  useColorScheme,
} from 'react-native'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Ionicons } from '@expo/vector-icons'

import AuthScreen from './screens/authScreen'
import SignUpScreen from './screens/signUpScreen'
import ProductListScreen from './screens/productListScreen'
import CartScreen from './screens/cartScreen'
import CheckoutScreen from './screens/checkOutScreen'
import WishlistScreen from './screens/wishListScreen'
import OrderHistoryScreen from './screens/OrderHistoryScreen'
import ProfileScreen from './screens/ProfileScreen'
import BarcodeScreen from './screens/barcodeScreen'
import StoreLocatorScreen from './screens/storeLocatorScreen'

import * as Network from 'expo-network'
import * as Linking from 'expo-linking'
import * as Notifications from 'expo-notifications'
import * as Battery from 'expo-battery' // ✅ Battery-Aware Sync
import { registerForPushNotificationsAsync } from './lib/notifications'

const prefix = Linking.createURL('/')

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
})

const Stack = createNativeStackNavigator()
const Tab = createBottomTabNavigator()

function ShopStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProductList" component={ProductListScreen} />
      <Stack.Screen name="Cart" component={CartScreen} />
      <Stack.Screen name="Checkout" component={CheckoutScreen} />
      <Stack.Screen name="Barcode" component={BarcodeScreen} />
      <Stack.Screen name="StoreLocator" component={StoreLocatorScreen} />
    </Stack.Navigator>
  )
}

function AuthenticatedTabs() {
  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName
          if (route.name === 'Shop') {
            iconName = focused ? 'storefront' : 'storefront-outline'
          } else if (route.name === 'Wishlist') {
            iconName = focused ? 'heart' : 'heart-outline'
          } else if (route.name === 'Orders') {
            iconName = focused ? 'receipt' : 'receipt-outline'
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline'
          }
          return <Ionicons name={iconName} size={size} color={color} />
        },
        tabBarActiveTintColor: isDark ? '#FFFFFF' : '#1A1A1A',
        tabBarInactiveTintColor: '#AAAAAA',
        tabBarStyle: {
          backgroundColor: isDark ? '#0A0A0A' : '#FFFFFF',
          borderTopColor: isDark ? '#333333' : '#F0F0F0',
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          letterSpacing: 0.8,
          textTransform: 'uppercase',
        },
      })}
    >
      <Tab.Screen name="Shop" component={ShopStack} />
      <Tab.Screen name="Wishlist" component={WishlistScreen} />
      <Tab.Screen name="Orders" component={OrderHistoryScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  )
}

export default function App() {
  const [userId, setUserId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isConnected, setIsConnected] = useState(true)
  const [isBatteryLow, setIsBatteryLow] = useState(false) // ✅ Battery state
  const notificationListener = useRef()
  const responseListener = useRef()

  const linking = {
    prefixes: [prefix],
    config: {
      screens: {
        Main: {
          screens: {
            Shop: {
              screens: {
                ProductList: 'products',
                Cart: 'cart',
                Barcode: 'barcode',
                StoreLocator: 'stores',
              },
            },
            Wishlist: 'wishlist',
            Orders: 'orders',
            Profile: 'profile',
          },
        },
      },
    },
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUserId = session?.user?.id ?? null
      setUserId(currentUserId)
      setLoading(false)
      if (currentUserId) registerForPushNotificationsAsync()
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUserId = session?.user?.id ?? null
      setUserId(currentUserId)
      if (currentUserId) registerForPushNotificationsAsync()
    })

    // ✅ Battery-Aware Sync — check battery on startup
    Battery.getBatteryLevelAsync().then((level) => {
      if (level < 0.15) setIsBatteryLow(true)
    })

    // ✅ Battery-Aware Sync — listen for battery level changes
    const batterySubscription = Battery.addBatteryLevelListener(({ batteryLevel }) => {
      if (batteryLevel < 0.35) {
        setIsBatteryLow(true)
      } else {
        setIsBatteryLow(false)
      }
    })

    // ✅ Network check — paused when battery is critically low
    const networkInterval = setInterval(async () => {
      if (isBatteryLow) return
      const state = await Network.getNetworkStateAsync()
      setIsConnected(state.isConnected && state.isInternetReachable)
    }, 4000)

    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      console.log('Notification received:', notification)
    })

    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('Notification tapped:', response)
    })

    return () => {
      subscription?.unsubscribe()
      clearInterval(networkInterval)
      batterySubscription.remove() 
      if (notificationListener.current) {
        notificationListener.current.remove()
      }
      if (responseListener.current) {
        responseListener.current.remove()
      }
    }
  }, [])

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1A1A1A" />
      </View>
    )
  }

  return (
    <View style={styles.root}>
      {/* F10 — Offline banner */}
      {!isConnected && (
        <View style={styles.offlineBanner}>
          <Ionicons name="cloud-offline-outline" size={14} color="#FFFFFF" />
          <Text style={styles.offlineBannerText}>YOU ARE OFFLINE</Text>
        </View>
      )}

      {/* ✅ Low battery banner */}
      {isBatteryLow && (
        <View style={styles.batteryBanner}>
          <Ionicons name="battery-dead-outline" size={14} color="#FFFFFF" />
          <Text style={styles.batteryBannerText}>LOW BATTERY — SYNC PAUSED</Text>
        </View>
      )}

      <NavigationContainer linking={linking}>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {userId ? (
            <Stack.Screen name="Main" component={AuthenticatedTabs} />
          ) : (
            <>
              <Stack.Screen name="Auth" component={AuthScreen} />
              <Stack.Screen name="SignUp" component={SignUpScreen} />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  offlineBanner: {
    backgroundColor: '#CC0000',
    paddingVertical: 8,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    zIndex: 999,
  },
  offlineBannerText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  // ✅ Battery banner style
  batteryBanner: {
    backgroundColor: '#B45309',
    paddingVertical: 8,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    zIndex: 999,
  },
  batteryBannerText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
})