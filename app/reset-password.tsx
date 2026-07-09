// FinZee AI™ — Reset Password Screen
import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, StatusBar, ActivityIndicator, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Colors, Shadow, Radius, Gradients } from '../constants/theme';
import FinZeeLogo from '../components/FinZeeLogo';
import { supabase } from '../services/supabaseClient';

export default function ResetPasswordScreen() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setReady(!!session);
    });
  }, []);

  async function handleUpdate() {
    if (!password.trim() || !confirmPassword.trim()) {
      Alert.alert('Missing password', 'Please enter and confirm your new password.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Password mismatch', 'Both passwords must match.');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      Alert.alert('Error', error.message);
      return;
    }

    setDone(true);
  }

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#06080f', '#0f172a', '#1a2444']} style={styles.hero}>
        <FinZeeLogo variant="light" width={140} />
        <Text style={styles.heroTitle}>Set a new <Text style={styles.heroBlue}>password</Text></Text>
        <Text style={styles.heroSub}>Use the link from your email, then choose a new secure password.</Text>
      </LinearGradient>

      <View style={styles.sheet}>
        {!ready ? (
          <View style={styles.notice}>
            <Text style={styles.noticeTitle}>Reset link needed</Text>
            <Text style={styles.noticeText}>
              Open the password reset email link first, then return here to set a new password.
            </Text>
            <TouchableOpacity style={styles.ctaWrap} onPress={() => router.replace('/forgot-password')}>
              <LinearGradient colors={Gradients.blue} style={styles.cta}>
                <Text style={styles.ctaText}>Send Reset Link</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : done ? (
          <View style={styles.notice}>
            <Text style={styles.noticeTitle}>Password updated</Text>
            <Text style={styles.noticeText}>Your password has been changed successfully.</Text>
            <TouchableOpacity style={styles.ctaWrap} onPress={() => router.replace('/login')}>
              <LinearGradient colors={Gradients.blue} style={styles.cta}>
                <Text style={styles.ctaText}>Back to Sign In →</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text style={styles.label}>New Password</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor={Colors.mute2}
              secureTextEntry
              autoCapitalize="none"
            />
            <Text style={styles.label}>Confirm Password</Text>
            <TextInput
              style={styles.input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="••••••••"
              placeholderTextColor={Colors.mute2}
              secureTextEntry
              autoCapitalize="none"
            />
            <TouchableOpacity style={styles.ctaWrap} onPress={handleUpdate} disabled={loading}>
              <LinearGradient colors={Gradients.blue} style={styles.cta}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.ctaText}>Update Password →</Text>}
              </LinearGradient>
            </TouchableOpacity>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.dark },
  hero: { paddingTop: Platform.OS === 'ios' ? 64 : 44, paddingBottom: 36, paddingHorizontal: 24 },
  heroTitle: { fontSize: 32, fontWeight: '800', color: '#fff', letterSpacing: -1.2, lineHeight: 38, marginTop: 16, marginBottom: 8 },
  heroBlue: { color: '#60a5fa' },
  heroSub: { fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 19 },
  sheet: { flex: 1, backgroundColor: Colors.bg, borderRadius: 28, marginTop: -20, padding: 24, paddingBottom: 40 },
  label: { fontSize: 11, fontWeight: '700', color: Colors.mute, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 },
  input: { backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.md, padding: 14, fontSize: 15, color: Colors.ink, marginBottom: 18, ...Shadow.sm },
  ctaWrap: { borderRadius: Radius.md, overflow: 'hidden', ...Shadow.blue },
  cta: { padding: 16, alignItems: 'center' },
  ctaText: { fontSize: 16, fontWeight: '800', color: '#fff', letterSpacing: -0.3 },
  notice: { alignItems: 'center', paddingVertical: 16 },
  noticeTitle: { fontSize: 22, fontWeight: '800', color: Colors.ink, letterSpacing: -0.8, marginBottom: 8 },
  noticeText: { fontSize: 14, color: Colors.mute, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
});
