// FinZee AI™ — Forgot Password Screen
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, StatusBar, ActivityIndicator, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Colors, Shadow, Radius, Gradients } from '../constants/theme';
import FinZeeLogo from '../components/FinZeeLogo';
import { useAuth } from '../hooks/useAuth';

export default function ForgotPasswordScreen() {
  const { resetPassword } = useAuth();
  const [email, setEmail]     = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);

  async function handleReset() {
    if (!email.trim()) { Alert.alert('Missing email', 'Please enter your email address.'); return; }
    setLoading(true);
    const err = await resetPassword(email.trim());
    setLoading(false);
    if (err) { Alert.alert('Error', err.message); } else { setSent(true); }
  }

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#06080f', '#0f172a', '#1a2444']} style={styles.hero}>
        <TouchableOpacity style={styles.back} onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <FinZeeLogo variant="light" width={140} />
        <Text style={styles.heroTitle}>Reset your <Text style={styles.heroBlue}>password.</Text></Text>
        <Text style={styles.heroSub}>Enter your email and we'll send you a secure reset link.</Text>
      </LinearGradient>

      <View style={styles.sheet}>
        {!sent ? (
          <>
            <Text style={styles.label}>Email Address</Text>
            <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="you@example.com" placeholderTextColor={Colors.mute2} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} returnKeyType="send" onSubmitEditing={handleReset} />
            <TouchableOpacity style={styles.ctaWrap} onPress={handleReset} disabled={loading}>
              <LinearGradient colors={Gradients.blue} style={styles.cta}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.ctaText}>Send Reset Link →</Text>}
              </LinearGradient>
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.successCard}>
            <Text style={styles.successEmoji}>📬</Text>
            <Text style={styles.successTitle}>Check your inbox</Text>
            <Text style={styles.successDesc}>We sent a password reset link to <Text style={styles.successEmail}>{email}</Text></Text>
            <Text style={styles.successNote}>Click the link in the email to set a new password. The link expires in 1 hour.</Text>
            <TouchableOpacity style={styles.ctaWrap} onPress={() => router.replace('/login')}>
              <LinearGradient colors={Gradients.blue} style={styles.cta}>
                <Text style={styles.ctaText}>Back to Sign In →</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
        <TouchableOpacity style={styles.signInLink} onPress={() => router.replace('/login')}>
          <Text style={styles.signInText}>Remember your password? <Text style={{ color: Colors.blue, fontWeight: '700' }}>Sign in</Text></Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root:         { flex: 1, backgroundColor: Colors.dark },
  hero:         { paddingTop: Platform.OS === 'ios' ? 64 : 44, paddingBottom: 36, paddingHorizontal: 24 },
  back:         { marginBottom: 16 },
  backText:     { fontSize: 14, fontWeight: '700', color: 'rgba(255,255,255,0.6)' },
  heroTitle:    { fontSize: 34, fontWeight: '800', color: '#fff', letterSpacing: -1.5, lineHeight: 40, marginTop: 16, marginBottom: 8 },
  heroBlue:     { color: '#60a5fa' },
  heroSub:      { fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 19 },
  sheet:        { flex: 1, backgroundColor: Colors.bg, borderRadius: 28, marginTop: -20, padding: 24, paddingBottom: 40 },
  label:        { fontSize: 11, fontWeight: '700', color: Colors.mute, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 },
  input:        { backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.md, padding: 14, fontSize: 15, color: Colors.ink, marginBottom: 20, ...Shadow.sm },
  ctaWrap:      { borderRadius: Radius.md, overflow: 'hidden', ...Shadow.blue },
  cta:          { padding: 16, alignItems: 'center' },
  ctaText:      { fontSize: 16, fontWeight: '800', color: '#fff', letterSpacing: -0.3 },
  successCard:  { alignItems: 'center', paddingVertical: 16 },
  successEmoji: { fontSize: 52, marginBottom: 14 },
  successTitle: { fontSize: 22, fontWeight: '800', color: Colors.ink, letterSpacing: -0.8, marginBottom: 8 },
  successDesc:  { fontSize: 14, color: Colors.mute, textAlign: 'center', lineHeight: 20, marginBottom: 10 },
  successEmail: { color: Colors.blue, fontWeight: '700' },
  successNote:  { fontSize: 12, color: Colors.mute2, textAlign: 'center', lineHeight: 17, marginBottom: 24 },
  signInLink:   { alignItems: 'center', marginTop: 20 },
  signInText:   { fontSize: 14, color: Colors.mute },
});
