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

export default function AuthScreen({ navigation }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const styles = appStyles

  async function signInWithEmail() {
    if (!email || !password) {
      Alert.alert('Please enter your email and password.')
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) Alert.alert(error.message)
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

        {/* WELCOME TEXT */}
        <Text style={styles.welcomeTitle}>Welcome</Text>
        <Text style={styles.welcomeSubtitle}>
          Glad to meet you again! Please login to use the app.
        </Text>

        {/* EMAIL */}
        <View style={styles.inputContainer}>
          <MaterialCommunityIcons name="email-outline" size={20} color="#7C3AED" style={styles.inputIcon} />
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
          <Ionicons name="lock-closed-outline" size={20} color="#68666d" style={styles.inputIcon} />
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
              color="#66646d"
            />
          </TouchableOpacity>
        </View>

        {/* FORGOT PASSWORD */}
        <View style={styles.forgotPasswordContainer}>
          <TouchableOpacity>
            <Text style={styles.forgotPasswordText}>Forgot password?</Text>
          </TouchableOpacity>
        </View>

        {/* SIGN IN */}
        <TouchableOpacity
          style={[styles.signInButton, loading && styles.buttonDisabled]}
          onPress={signInWithEmail}
          disabled={loading}
        >
          <Text style={styles.buttonTextWhite}>{loading ? 'Signing in...' : 'Sign In'}</Text>
        </TouchableOpacity>

        {/* OR */}
        <View style={styles.orContainer}>
          <View style={styles.orLine} />
          <Text style={styles.orText}>or</Text>
          <View style={styles.orLine} />
        </View>

        {/* GOOGLE */}
        <TouchableOpacity style={styles.socialButton}>
          <Ionicons name="logo-google" size={20} color="#34A853" style={{ marginRight: 10 }} />
          <Text style={styles.socialButtonText}>Sign in with Google</Text>
        </TouchableOpacity>

        {/* FOOTER */}
        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
            <Text style={styles.signUpLink}>Sign up</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  )
}