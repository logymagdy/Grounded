import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import { Platform } from 'react-native'
import Constants from 'expo-constants' 

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
})

export async function registerForPushNotificationsAsync() {
  if (!Device.isDevice) {
    alert('Must use a physical device for push notifications')
    return
  }

  // Android Channel Setup
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

  // Check Permissions
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

  try {
    const projectId = 
      Constants?.expoConfig?.extra?.eas?.projectId ?? 
      Constants?.easConfig?.projectId;

    if (!projectId) {
      console.warn("Project ID not found. Ensure you have a 'projectId' in app.json under expo.extra.eas");
    }

    const token = (await Notifications.getExpoPushTokenAsync({
      projectId: projectId, 
    })).data
    
    console.log('Expo push token:', token)
    return token
  } catch (e) {
    console.error('Error getting push token:', e)
  }
}

// Order Status Helper
export async function scheduleOrderNotification({ title, body }) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: 'default',
      data: { type: 'order_update' },
    },
    trigger: null, 
  })
}

// Promo Helper
export async function schedulePromoNotification({ title, body }) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: 'default',
      data: { type: 'promo' },
    },
    trigger: null,
  })
}