import { useState, useEffect, useRef } from 'react'
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

// Screens
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

// F10 — Network
import * as Network from 'expo-network'

// F15 — Deep Linking
import * as Linking from 'expo-linking'

// F18 — Localization
import { getLocales } from 'expo-localization'

// F6 — Push Notifications root listener
import * as Notifications from 'expo-notifications'

// ─── F18: Currency formatter ─────────────────────────────────────────────────
const deviceLocale = getLocales()[0]
export const currencyCode = deviceLocale?.regionCode === 'EG' ? 'EGP' : 'USD'
export const formatPrice = (amount) =>
  new Intl.NumberFormat(deviceLocale?.languageTag ?? 'en-US', {
    style: 'currency',
    currency: currencyCode,
  }).format(amount)

// ─── F15: Deep Linking prefix ────────────────────────────────────────────────
const prefix = Linking.createURL('/')

// ─── F6: Notification handler — foreground behavior ──────────────────────────
// Source: https://docs.expo.dev/versions/latest/sdk/notifications/
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,   // FIX: shouldShowBanner/shouldShowList are invalid keys
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
})

// ─── Navigators ──────────────────────────────────────────────────────────────
const Stack = createNativeStackNavigator()
const Tab = createBottomTabNavigator()

// ─── Shop Stack (Tab 1) ───────────────────────────────────────────────────────
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

// ─── Authenticated Bottom Tab Navigator ──────────────────────────────────────
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

// ─── Root App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [userId, setUserId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isConnected, setIsConnected] = useState(true)

  const notificationListener = useRef()
  const responseListener = useRef()

  // F15 — Deep Linking config
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
    // ─── FIX: supabase.auth.getClaims() does not exist in supabase-js v2.
    //         getSession() is the correct method — returns { data: { session } } ───
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id ?? null)
      setLoading(false)
    })

    // ─── FIX: onAuthStateChange v2 passes session directly as 2nd arg.
    //         No secondary getClaims() call needed. ───
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null)
    })

    // F10 — Network polling every 4 s
    const networkInterval = setInterval(async () => {
      const state = await Network.getNetworkStateAsync()
      setIsConnected(state.isConnected && state.isInternetReachable)
    }, 4000)

    // F6 — Foreground notification received listener
    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        console.log('Notification received:', notification)
      })

    // F6 — User tapped notification listener
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log('Notification tapped:', response)
      })

    return () => {
      // ─── FIX: v2 cleanup is subscription.unsubscribe(), not listener.subscription.unsubscribe() ───
      subscription?.unsubscribe()
      clearInterval(networkInterval)
      Notifications.removeNotificationSubscription(notificationListener.current)
      Notifications.removeNotificationSubscription(responseListener.current)
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
})