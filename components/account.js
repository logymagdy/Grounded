// components/Account.js
// Source: Supabase official docs — components/Account.tsx
// Adapted: .tsx → .js | TypeScript types removed | Avatar import + usage removed (shop doesn't need profile photos)

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { View, Alert, TextInput, Text, TouchableOpacity } from 'react-native'
import { appStyles } from '../styles/styles'

export default function Account({ userId, email }) {
  const [loading, setLoading] = useState(true)
  const [username, setUsername] = useState('')
  const [website, setWebsite] = useState('')
  const styles = appStyles

  useEffect(() => {
    if (userId) getProfile()
  }, [userId])

  // Supabase DB — reads profile row for the authenticated user
  async function getProfile() {
    try {
      setLoading(true)
      let { data, error, status } = await supabase
        .from('profiles')
        .select(`username, website, avatar_url`)
        .eq('id', userId)
        .single()

      if (error && status !== 406) {
        throw error
      }

      if (data) {
        setUsername(data.username)
        setWebsite(data.website)
      }
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert(error.message)
      }
    } finally {
      setLoading(false)
    }
  }

  // Supabase DB — upserts profile row; JWT userId ensures user can only update their own row (RLS)
  async function updateProfile({ username, website }) {
    try {
      setLoading(true)
      const updates = {
        id: userId,
        username,
        website,
        updated_at: new Date(),
      }
      let { error } = await supabase.from('profiles').upsert(updates)
      if (error) {
        throw error
      }
    } catch (error) {
      Alert.alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.container}>

      <View style={[styles.verticallySpaced, styles.mt20]}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          value={email ?? ''}
          editable={false}
          selectTextOnFocus={false}
          style={[styles.input, styles.inputDisabled]}
        />
      </View>

      <View style={styles.verticallySpaced}>
        <Text style={styles.label}>Username</Text>
        <TextInput
          value={username || ''}
          onChangeText={(text) => setUsername(text)}
          style={styles.input}
        />
      </View>

      <View style={styles.verticallySpaced}>
        <Text style={styles.label}>Website</Text>
        <TextInput
          value={website || ''}
          onChangeText={(text) => setWebsite(text)}
          style={styles.input}
        />
      </View>

      <View style={[styles.verticallySpaced, styles.mt20]}>
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={() => updateProfile({ username, website })}
          disabled={loading}
        >
          <Text style={styles.buttonText}>{loading ? 'Loading ...' : 'Update'}</Text>
        </TouchableOpacity>
      </View>

      {/* Supabase Auth — signOut clears the JWT session */}
      <View style={styles.verticallySpaced}>
        <TouchableOpacity style={styles.button} onPress={() => supabase.auth.signOut()}>
          <Text style={styles.buttonText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

    </View>
  )
}