// FinZee AI™ — Sign Up Screen
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, Switch,
  StatusBar, ActivityIndicator, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Colors, Shadow, Radius, Gradients } from '../constants/theme';
import FinZeeLogo from '../components/FinZeeLogo';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../services/supabaseClient';

export default function SignUpScreen() {
  const { signUp } = useAuth();
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [consentFinancial, setConsentFinancial] = useState(false);
  const [consentHealth, setConsentHealth]       = useState(false);
  const [consentAI, setConsentAI]               = useState(false);
  const [consentTerms, setConsentTerms]         = useState(false);

  async function handleSignUp() {
    if (!name.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Missing fields', 'Please fill in all fields.'); return;
    }
    if (!consentTerms) {
      Alert.alert('Terms required', 'Please accept the Terms of Service to continue.'); return;
    }
    if (password.length < 8) {
      Alert.alert('Weak password', 'Password must be at least 8 characters.'); return;
    }
    console.log('[SignUp] submitting', {
      email: email.trim(),
      name: name.trim(),
      consentFinancial,
      consentHealth,
      consentAI,
      consentTerms,
    });
    setLoading(true);
    const result = await signUp(email.trim(), password, name.trim());
    if ('error' in result && result.error) {
      console.log('[SignUp] auth error', result.error);
      setLoading(false);
      Alert.alert('Sign up failed', result.error?.message || String(result.error) || 'Unknown error');
      return;
    }
    const session = result.data?.session ?? null;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      console.log('[SignUp] current user', user?.id ?? null);
      if (user) {
        const consentResult = await supabase.from('consent_logs').upsert({
          user_id: user.id,
          financial_data: consentFinancial,
          health_data: consentHealth,
          ai_personalization: consentAI,
          terms_accepted: consentTerms,
          consented_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });
        console.log('[SignUp] consent log result', consentResult);
      }
    } catch (e) { console.warn('[SignUp] consent log error:', e); }
    setLoading(false);
    if (session) {
      Alert.alert('Account created', 'Your account is ready. You can sign in now.',
        [{ text: 'OK', onPress: () => router.replace('/login') }]
      );
    } else {
      Alert.alert('Check your email ✉️', 'We sent you a confirmation link. Click it to activate your account.',
        [{ text: 'OK', onPress: () => router.replace('/login') }]
      );
    }
  }

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <LinearGradient colors={['#06080f', '#0f172a', '#1a2444']} style={styles.hero}>
          <View style={styles.glow} />
          <Text style={styles.eyebrow}>FinZee AI™</Text>
          <FinZeeLogo variant="light" width={160} />
          <Text style={styles.heroTitle}>Start your financial <Text style={styles.heroBlue}>wellness journey.</Text></Text>
        </LinearGradient>

        <View style={styles.sheet}>
          <Text style={styles.sheetLabel}>Create your account</Text>

          {[{ label: 'Full Name', value: name, set: setName, placeholder: 'Maya Brooks', type: 'default' },
            { label: 'Email', value: email, set: setEmail, placeholder: 'you@example.com', type: 'email-address' }]
            .map(f => (
              <View key={f.label} style={styles.fieldWrap}>
                <Text style={styles.fieldLabel}>{f.label}</Text>
                <TextInput style={styles.input} value={f.value} onChangeText={f.set} placeholder={f.placeholder} placeholderTextColor={Colors.mute2} keyboardType={f.type as any} autoCapitalize={f.type === 'email-address' ? 'none' : 'words'} autoCorrect={false} />
              </View>
            ))
          }

          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>Password</Text>
            <View style={styles.passWrap}>
              <TextInput style={[styles.input, { paddingRight: 64 }]} value={password} onChangeText={setPassword} placeholder="Min. 8 characters" placeholderTextColor={Colors.mute2} secureTextEntry={!showPass} returnKeyType="done" />
              <TouchableOpacity style={styles.passToggle} onPress={() => setShowPass(v => !v)}>
                <Text style={styles.passToggleText}>{showPass ? 'Hide' : 'Show'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <Text style={[styles.sheetLabel, { marginTop: 20 }]}>Your data, your control</Text>
          {[
            { label: 'Financial data', sub: 'Allow FinZee to read transactions via Plaid', value: consentFinancial, set: setConsentFinancial },
            { label: 'Health data', sub: 'Allow FinZee to read steps, sleep, heart rate from Apple Health', value: consentHealth, set: setConsentHealth },
            { label: 'AI personalization', sub: 'Allow FinZee AI to use your data for personalized insights', value: consentAI, set: setConsentAI },
          ].map(c => (
            <View key={c.label} style={styles.toggleRow}>
              <View style={styles.toggleInfo}>
                <Text style={styles.toggleLabel}>{c.label}</Text>
                <Text style={styles.toggleSub}>{c.sub}</Text>
              </View>
              <Switch value={c.value} onValueChange={c.set} trackColor={{ false: Colors.mute3, true: Colors.blue }} thumbColor={Colors.surface} />
            </View>
          ))}

          <TouchableOpacity style={styles.termsRow} onPress={() => setConsentTerms(v => !v)}>
            <View style={[styles.checkbox, consentTerms && { backgroundColor: Colors.blue, borderColor: Colors.blue }]}>
              {consentTerms && <Text style={{ color: '#fff', fontSize: 12, fontWeight: '800' }}>✓</Text>}
            </View>
            <Text style={styles.termsText}>
              I agree to the{' '}
              <Text style={styles.termsLink} onPress={() => router.push('/terms-of-service')}>
                Terms of Service
              </Text>{' '}
              and{' '}
              <Text style={styles.termsLink} onPress={() => router.push('/privacy-policy')}>
                Privacy Policy
              </Text>
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.ctaWrap, !consentTerms && { opacity: 0.6 }]} onPress={handleSignUp} disabled={loading || !consentTerms}>
            <LinearGradient colors={Gradients.blue} style={styles.cta}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.ctaText}>Create Account →</Text>}
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.loginLink} onPress={() => router.back()}>
            <Text style={styles.loginLinkText}>Already have an account? <Text style={{ color: Colors.blue, fontWeight: '700' }}>Sign in</Text></Text>
          </TouchableOpacity>

          <View style={styles.privacyNote}>
            <Text style={styles.privacyIcon}>🔒</Text>
            <Text style={styles.privacyText}>FinZee never stores bank credentials. Financial connections use secure tokenized providers. You can disconnect anytime.</Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root:           { flex: 1, backgroundColor: Colors.dark },
  scroll:         { flexGrow: 1 },
  hero:           { paddingTop: Platform.OS === 'ios' ? 64 : 44, paddingBottom: 36, paddingHorizontal: 24, position: 'relative', overflow: 'hidden' },
  glow:           { position: 'absolute', width: 240, height: 240, borderRadius: 120, top: -50, right: -50, shadowColor: Colors.blue, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.25, shadowRadius: 80 },
  eyebrow:        { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 },
  heroTitle:      { fontSize: 32, fontWeight: '800', color: '#fff', letterSpacing: -1.2, lineHeight: 38, marginTop: 14 },
  heroBlue:       { color: '#60a5fa' },
  sheet:          { flex: 1, backgroundColor: Colors.bg, borderRadius: 28, marginTop: -20, padding: 24, paddingBottom: 48 },
  sheetLabel:     { fontSize: 11, fontWeight: '700', color: Colors.mute, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 16 },
  fieldWrap:      { marginBottom: 14 },
  fieldLabel:     { fontSize: 11, fontWeight: '700', color: Colors.mute, textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 7 },
  input:          { backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.md, padding: 14, fontSize: 15, color: Colors.ink, ...Shadow.sm },
  passWrap:       { position: 'relative' },
  passToggle:     { position: 'absolute', right: 14, top: 0, bottom: 0, justifyContent: 'center' },
  passToggleText: { fontSize: 13, fontWeight: '700', color: Colors.blue },
  toggleRow:      { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: Radius.md, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: Colors.border2, gap: 12, ...Shadow.sm },
  toggleInfo:     { flex: 1 },
  toggleLabel:    { fontSize: 14, fontWeight: '700', color: Colors.ink, marginBottom: 2 },
  toggleSub:      { fontSize: 11, color: Colors.mute, lineHeight: 15 },
  termsRow:       { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginTop: 8, marginBottom: 20 },
  checkbox:       { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: Colors.mute3, alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 },
  termsText:      { fontSize: 13, color: Colors.mute, lineHeight: 18, flex: 1 },
  termsLink:      { color: Colors.blue, fontWeight: '700' },
  ctaWrap:        { borderRadius: Radius.md, overflow: 'hidden', marginBottom: 16, ...Shadow.blue },
  cta:            { padding: 16, alignItems: 'center', borderRadius: Radius.md },
  ctaText:        { fontSize: 16, fontWeight: '800', color: '#fff', letterSpacing: -0.3 },
  loginLink:      { alignItems: 'center', marginBottom: 20 },
  loginLinkText:  { fontSize: 14, color: Colors.mute },
  privacyNote:    { flexDirection: 'row', gap: 10, backgroundColor: Colors.blueTint, borderRadius: Radius.md, padding: 14, alignItems: 'flex-start' },
  privacyIcon:    { fontSize: 16, flexShrink: 0 },
  privacyText:    { fontSize: 11, color: Colors.ink3, lineHeight: 16, flex: 1 },
});
