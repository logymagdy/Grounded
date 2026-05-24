import { useState, useEffect, useRef } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Platform } from 'react-native'
import * as Notifications from 'expo-notifications'
import {
  registerForPushNotificationsAsync,
  scheduleOrderNotification,
  schedulePromoNotification,
} from '../lib/notifications'

export default function NotificationsScreen() {
  const [expoPushToken, setExpoPushToken] = useState('')
  const [notification, setNotification] = useState(null)

  const notificationListener = useRef()
  const responseListener = useRef()

  useEffect(() => {
    registerForPushNotificationsAsync().then((token) => {
      if (token) setExpoPushToken(token)
    })

    notificationListener.current = Notifications.addNotificationReceivedListener(
      (notification) => {
        setNotification(notification)
      }
    )

    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        console.log('Notification tapped:', response)
      }
    )

    return () => {
      notificationListener.current?.remove()
      responseListener.current?.remove()
    }
  }, [])

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      {/* ─── Header ──────────────────────────────────────────────────────── */}
      <Text style={styles.screenTitle}>NOTIFICATIONS</Text>
      <View style={styles.divider} />

      {/* ─── Push Token ──────────────────────────────────────────────────── */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>DEVICE PUSH TOKEN</Text>
        <Text style={styles.tokenText} numberOfLines={2}>
          {expoPushToken || 'Requesting token...'}
        </Text>
      </View>

      <View style={styles.divider} />

      {/* ─── Order Status Notifications ──────────────────────────────────── */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>ORDER UPDATES</Text>
        <Text style={styles.sectionSubtitle}>
          Simulate order status push notifications
        </Text>

        <TouchableOpacity
          style={styles.button}
          onPress={() =>
            scheduleOrderNotification({
              title: 'Order Confirmed',
              body: 'Your Grounded order #1042 has been confirmed.',
            })
          }
        >
          <Text style={styles.buttonText}>ORDER CONFIRMED</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={() =>
            scheduleOrderNotification({
              title: 'Order Shipped',
              body: 'Your package is on its way! Estimated delivery: 3-5 days.',
            })
          }
        >
          <Text style={styles.buttonText}>ORDER SHIPPED</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={() =>
            scheduleOrderNotification({
              title: 'Order Delivered',
              body: 'Your Grounded order has been delivered. Enjoy the outdoors!',
            })
          }
        >
          <Text style={styles.buttonText}>ORDER DELIVERED</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.divider} />

      {/* ─── Promotional Alerts ───────────────────────────────────────────── */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>PROMOTIONAL ALERTS</Text>
        <Text style={styles.sectionSubtitle}>
          Simulate promotional push notifications
        </Text>

        <TouchableOpacity
          style={styles.button}
          onPress={() =>
            schedulePromoNotification({
              title: 'New Arrival',
              body: 'The Cave XL is back in stock. Shop now before it sells out.',
            })
          }
        >
          <Text style={styles.buttonText}>NEW ARRIVAL</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={() =>
            schedulePromoNotification({
              title: 'Flash Sale',
              body: '20% off all Bags & Backpacks — today only.',
            })
          }
        >
          <Text style={styles.buttonText}>FLASH SALE</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.divider} />

      {/* ─── Last Received Notification ──────────────────────────────────── */}
      {notification && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>LAST RECEIVED</Text>
          <Text style={styles.notifTitle}>
            {notification.request.content.title}
          </Text>
          <Text style={styles.notifBody}>
            {notification.request.content.body}
          </Text>
          <Text style={styles.notifMeta}>
            Type: {notification.request.content.data?.type}
          </Text>
        </View>
      )}

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
    marginVertical: 20,
  },

  section: {
    marginBottom: 4,
  },
  sectionLabel: {
    fontSize: 10,
    letterSpacing: 1.8,
    fontWeight: '700',
    color: '#AAAAAA',
    marginBottom: 6,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#888888',
    marginBottom: 14,
    letterSpacing: 0.2,
  },

  tokenText: {
    fontSize: 11,
    color: '#555555',
    letterSpacing: 0.3,
    lineHeight: 18,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },

  button: {
    backgroundColor: '#1A1A1A',
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
  },

  notifTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  notifBody: {
    fontSize: 13,
    color: '#555555',
    lineHeight: 20,
    marginBottom: 6,
  },
  notifMeta: {
    fontSize: 10,
    letterSpacing: 1.2,
    color: '#AAAAAA',
    textTransform: 'uppercase',
  },
})