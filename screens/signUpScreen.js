import { useState } from 'react'
import {
  Alert,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native'
import { supabase } from '../lib/supabase'
import { appStyles } from '../styles/styles'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'

export default function SignUpScreen({ navigation }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const styles = appStyles

  async function signUpWithEmail() {
    if (!email || !password) {
      Alert.alert('Please fill in all fields.')
      return
    }
    if (password !== confirmPassword) {
      Alert.alert('Passwords do not match.')
      return
    }
    if (password.length < 6) {
      Alert.alert('Password must be at least 6 characters.')
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.signUp({
      email,
      password,
    })
    if (error) {
      Alert.alert(error.message)
    } else {
      Alert.alert(
        'Account created!',
        'Please check your email to confirm your account, then sign in.',
        [{ text: 'OK', onPress: () => navigation.navigate('Auth') }]
      )
    }
    setLoading(false)
  }

  return (
    <KeyboardAvoidingView
      style={styles.keyboardView}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >

        {/* LOGO */}
        <View style={styles.logoContainer}>
          <Image
            source={require('../assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        {/* HEADER TEXT */}
        <Text style={styles.welcomeTitle}>Create Account</Text>
        <Text style={styles.welcomeSubtitle}>
          Sign up to get started with the app.
        </Text>

        {/* EMAIL */}
        <View style={styles.inputContainer}>
          <MaterialCommunityIcons name="email-outline" size={20} color="#6c6a70" style={styles.inputIcon} />
          <TextInput
            onChangeText={setEmail}
            value={email}
            placeholder="Email address"
            autoCapitalize="none"
            keyboardType="email-address"
            style={styles.inputFlex}
            placeholderTextColor="#AAAAAA"
          />
        </View>

        {/* PASSWORD */}
        <View style={styles.inputContainer}>
          <Ionicons name="lock-closed-outline" size={20} color="#48464c" style={styles.inputIcon} />
          <TextInput
            onChangeText={setPassword}
            value={password}
            secureTextEntry={!showPassword}
            placeholder="Password"
            autoCapitalize="none"
            style={styles.inputFlex}
            placeholderTextColor="#AAAAAA"
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Ionicons
              name={showPassword ? "eye-outline" : "eye-off-outline"}
              size={20}
              color="#454347"
            />
          </TouchableOpacity>
        </View>

        {/* CONFIRM PASSWORD */}
        <View style={styles.inputContainer}>
          <Ionicons name="lock-closed-outline" size={20} color="#656269" style={styles.inputIcon} />
          <TextInput
            onChangeText={setConfirmPassword}
            value={confirmPassword}
            secureTextEntry={!showConfirm}
            placeholder="Confirm password"
            autoCapitalize="none"
            style={styles.inputFlex}
            placeholderTextColor="#AAAAAA"
          />
          <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
            <Ionicons
              name={showConfirm ? "eye-outline" : "eye-off-outline"}
              size={20}
              color="#5e5b64"
            />
          </TouchableOpacity>
        </View>

        {/* SIGN UP BUTTON */}
        <TouchableOpacity
          style={[styles.signUpButton, { marginTop: 24 }, loading && styles.buttonDisabled]}
          onPress={signUpWithEmail}
          disabled={loading}
        >
          <Text style={styles.buttonTextWhite}>{loading ? 'Creating account...' : 'Create Account'}</Text>
        </TouchableOpacity>

        {/* FOOTER */}
        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Auth')}>
            <Text style={styles.signUpLink}>Sign in</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  )
}