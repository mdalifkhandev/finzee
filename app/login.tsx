// FinZee AI™ — Login Screen
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView,
  StatusBar, ActivityIndicator, Alert, RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Colors, Shadow, Radius, Gradients } from '../constants/theme';
import FinZeeLogo from '../components/FinZeeLogo';
import { useAuth } from '../hooks/useAuth';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  async function handleLogin() {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing fields', 'Please enter your email and password.');
      return;
    }
    console.log('[Login] submitting', { email: email.trim() });
    setLoading(true);
    const result = await signIn(email.trim(), password);
    setLoading(false);
    if ('error' in result && result.error) {
      console.log('[Login] auth error', result.error);
      Alert.alert('Login failed', result.error?.message || String(result.error) || 'Unknown error');
    } else {
      console.log('[Login] success');
      router.replace('/(tabs)/home');
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      setEmail('');
      setPassword('');
      setShowPass(false);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.blue} />}
      >
        <LinearGradient colors={['#06080f', '#0f172a', '#1a2444']} style={styles.hero}>
          <View style={styles.glow} />
          <View style={styles.heroContent}>
            <Text style={styles.eyebrow}>FinZee AI™</Text>
            <FinZeeLogo variant="light" width={180} />
            <Text style={styles.heroTitle}>Your financial companion is <Text style={styles.heroTitleBlue}>ready.</Text></Text>
            <Text style={styles.heroSub}>Premium AI-powered financial wellness. Built for how you think and feel about money.</Text>
          </View>
        </LinearGradient>

        <View style={styles.sheet}>
          <Text style={styles.sheetLabel}>Sign in to your account</Text>

          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>Email</Text>
            <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="you@example.com" placeholderTextColor={Colors.mute2} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} returnKeyType="next" />
          </View>

          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>Password</Text>
            <View style={styles.passWrap}>
              <TextInput style={[styles.input, styles.passInput]} value={password} onChangeText={setPassword} placeholder="••••••••" placeholderTextColor={Colors.mute2} secureTextEntry={!showPass} returnKeyType="done" onSubmitEditing={handleLogin} />
              <TouchableOpacity style={styles.passToggle} onPress={() => setShowPass(v => !v)}>
                <Text style={styles.passToggleText}>{showPass ? 'Hide' : 'Show'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity style={styles.forgotWrap} onPress={() => router.push('/forgot-password')}>
            <Text style={styles.forgotText}>Forgot password?</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.ctaWrap} onPress={handleLogin} disabled={loading}>
            <LinearGradient colors={Gradients.blue} style={styles.cta}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.ctaText}>Sign In →</Text>}
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.push('/signup')}>
            <Text style={styles.secondaryBtnText}>Create new account</Text>
          </TouchableOpacity>

          <Text style={styles.disclaimer}>FinZee AI provides financial coaching, not financial, medical, or investment advice. Your data is encrypted and never sold.</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root:           { flex: 1, backgroundColor: Colors.dark },
  scroll:         { flexGrow: 1 },
  hero:           { paddingTop: Platform.OS === 'ios' ? 64 : 44, paddingBottom: 36, paddingHorizontal: 24, position: 'relative', overflow: 'hidden' },
  glow:           { position: 'absolute', width: 280, height: 280, borderRadius: 140, top: -60, right: -60, backgroundColor: 'transparent', shadowColor: Colors.blue, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.3, shadowRadius: 80 },
  heroContent:    { gap: 0 },
  eyebrow:        { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 },
  heroTitle:      { fontSize: 36, fontWeight: '800', color: '#fff', letterSpacing: -1.5, lineHeight: 42, marginTop: 14, marginBottom: 10 },
  heroTitleBlue:  { color: '#60a5fa' },
  heroSub:        { fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 19, letterSpacing: 0.1 },
  sheet:          { flex: 1, backgroundColor: Colors.bg, borderRadius: 28, marginTop: -20, padding: 24, paddingBottom: 40 },
  sheetLabel:     { fontSize: 11, fontWeight: '700', color: Colors.mute, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 20 },
  fieldWrap:      { marginBottom: 14 },
  fieldLabel:     { fontSize: 11, fontWeight: '700', color: Colors.mute, textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 7 },
  input:          { backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.md, padding: 14, fontSize: 15, color: Colors.ink, ...Shadow.sm },
  passWrap:       { position: 'relative' },
  passInput:      { paddingRight: 64 },
  passToggle:     { position: 'absolute', right: 14, top: 0, bottom: 0, justifyContent: 'center' },
  passToggleText: { fontSize: 13, fontWeight: '700', color: Colors.blue },
  forgotWrap:     { alignItems: 'flex-end', marginBottom: 20, marginTop: 4 },
  forgotText:     { fontSize: 13, fontWeight: '700', color: Colors.blue },
  ctaWrap:        { borderRadius: Radius.md, overflow: 'hidden', marginBottom: 18, ...Shadow.blue },
  cta:            { padding: 16, alignItems: 'center', borderRadius: Radius.md },
  ctaText:        { fontSize: 16, fontWeight: '800', color: '#fff', letterSpacing: -0.3 },
  divider:        { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 18 },
  dividerLine:    { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText:    { fontSize: 13, color: Colors.mute2, fontWeight: '500' },
  secondaryBtn:   { backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.md, padding: 15, alignItems: 'center', ...Shadow.sm },
  secondaryBtnText: { fontSize: 15, fontWeight: '700', color: Colors.ink3 },
  disclaimer:     { fontSize: 11, color: Colors.mute2, textAlign: 'center', lineHeight: 16, marginTop: 20 },
});
