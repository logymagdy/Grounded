// 📁 lib/notifications.js
// Feature 6: Push Notifications — helper functions
// Source: https://docs.expo.dev/push-notifications/push-notifications-setup/
// Adapted: .ts → .js | Grounded-specific notification types

import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import { Platform } from 'react-native'

// Source: expo-notifications official docs — setNotificationHandler
// Controls behavior when notification arrives while app is foregrounded
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
})

// Source: expo-notifications official docs — registerForPushNotificationsAsync
// Requests permission + returns the Expo push token for this device
export async function registerForPushNotificationsAsync() {
  if (!Device.isDevice) {
    alert('Must use a physical device for push notifications')
    return
  }

  // Android requires a notification channel — from official docs
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      sound: true,
      lightColor: '#FF231F7C',
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      bypassDnd: true,
    })
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync()
  let finalStatus = existingStatus

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync()
    finalStatus = status
  }

  if (finalStatus !== 'granted') {
    alert('Failed to get push token for push notifications!')
    return
  }

  const token = (await Notifications.getExpoPushTokenAsync()).data
  console.log('Expo push token:', token)
  return token
}

// Source: expo-notifications official docs — scheduleNotificationAsync
// Grounded use case: order status update notification
export async function scheduleOrderNotification({ title, body }) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: 'default',
      data: { type: 'order_update' },
    },
    trigger: null, // Send immediately
  })
}

// Source: expo-notifications official docs — scheduleNotificationAsync
// Grounded use case: promotional alert notification
export async function schedulePromoNotification({ title, body }) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: 'default',
      data: { type: 'promo' },
    },
    trigger: null, // Send immediately
  })
}