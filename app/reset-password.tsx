// FinZee AI™ — Reset Password Screen
import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, StatusBar, ActivityIndicator, Alert, Linking,
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
  const [checkingLink, setCheckingLink] = useState(true);
  const [recoveryUrl, setRecoveryUrl] = useState<string | null>(null);
  const [linkError, setLinkError] = useState<string | null>(null);
  const recoveryHandledRef = useRef(false);

  async function persistRecoverySession(session: { access_token: string; refresh_token: string } | null | undefined) {
    if (!session) return false;
    const { error } = await supabase.auth.setSession({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
    });
    if (error) throw error;
    return true;
  }

  useEffect(() => {
    let mounted = true;

    const applySessionFromUrl = async (url?: string | null) => {
      if (!url) return;
      if (mounted) setRecoveryUrl(url);
      if (mounted) setLinkError(null);
      console.log('[ResetPassword] incoming url:', url);

      try {
        const [baseUrl, fragment = ''] = url.split('#');
        const parsed = new URL(baseUrl);
        const params = new URLSearchParams(fragment || parsed.search);
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');
        const code = params.get('code');
        const tokenHash = params.get('token_hash');
        const type = params.get('type');
        const errorCode = params.get('error_code');
        const errorDescription = params.get('error_description');
        const error = params.get('error');
        console.log('[ResetPassword] parsed params:', {
          code,
          tokenHash,
          type,
          hasAccessToken: !!accessToken,
          hasRefreshToken: !!refreshToken,
        });

        if (error || errorCode || errorDescription) {
          const message =
            errorDescription ||
            (errorCode === 'otp_expired'
              ? 'This reset link has expired. Please request a new one.'
              : 'This reset link is invalid. Please request a new one.');
          if (mounted) {
            setLinkError(message);
            setReady(false);
          }
          return;
        }

        if (type === 'recovery' && accessToken && refreshToken) {
          await persistRecoverySession({ access_token: accessToken, refresh_token: refreshToken });
          if (mounted) {
            recoveryHandledRef.current = true;
            setReady(true);
          }
          return;
        }

        if (code) {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
          await persistRecoverySession(data.session);
          if (mounted) {
            recoveryHandledRef.current = true;
            setReady(true);
          }
          return;
        }

        if (tokenHash && type === 'recovery') {
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: 'recovery',
          });
          if (error) throw error;
          await persistRecoverySession(data.session);
          if (mounted) {
            recoveryHandledRef.current = true;
            setReady(true);
          }
          return;
        }
      } catch (error) {
        console.warn('[ResetPassword] link parse error:', error);
      } finally {
        if (mounted) setCheckingLink(false);
      }
    };

    Linking.getInitialURL().then(async (url) => {
      await applySessionFromUrl(url);
      if (mounted) setCheckingLink(false);
    });

    const subscription = Linking.addEventListener('url', ({ url }) => {
      void applySessionFromUrl(url);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted) {
        if (recoveryHandledRef.current) return;
        setReady(!!session);
        setCheckingLink(false);
      }
    });

    return () => {
      mounted = false;
      subscription.remove();
    };
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
    const sessionReady = await (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) return true;
      if (recoveryUrl) {
        try {
          const [baseUrl, fragment = ''] = recoveryUrl.split('#');
          const parsed = new URL(baseUrl);
          const params = new URLSearchParams(fragment || parsed.search);
          const tokenHash = params.get('token_hash');
          const type = params.get('type');
          const code = params.get('code');
          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');

          if (type === 'recovery' && accessToken && refreshToken) {
            await persistRecoverySession({ access_token: accessToken, refresh_token: refreshToken });
          } else if (code) {
            const { data, error } = await supabase.auth.exchangeCodeForSession(code);
            if (error) throw error;
            await persistRecoverySession(data.session);
          } else if (tokenHash) {
            const { data, error } = await supabase.auth.verifyOtp({
              token_hash: tokenHash,
              type: (type as any) || 'recovery',
            });
            if (error) throw error;
            await persistRecoverySession(data.session);
          }
        } catch (error) {
          console.warn('[ResetPassword] ensure session error:', error);
        }
      }
      const { data: { session: latestSession } } = await supabase.auth.getSession();
      if (latestSession) return true;
      return false;
    })();

    if (!sessionReady) {
      setLoading(false);
      Alert.alert('Reset link needed', 'Please reopen the password reset email link, then try again.');
      return;
    }

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
        {checkingLink ? (
          <View style={styles.notice}>
            <Text style={styles.noticeTitle}>Opening reset link…</Text>
            <Text style={styles.noticeText}>
              We’re checking your email recovery link and preparing the password reset session.
            </Text>
          </View>
        ) : linkError ? (
          <View style={styles.notice}>
            <Text style={styles.noticeTitle}>Reset link expired</Text>
            <Text style={styles.noticeText}>{linkError}</Text>
            <TouchableOpacity style={styles.ctaWrap} onPress={() => router.replace('/forgot-password')}>
              <LinearGradient colors={Gradients.blue} style={styles.cta}>
                <Text style={styles.ctaText}>Send New Reset Link</Text>
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
            {!ready && (
              <View style={{ marginBottom: 16 }}>
                <Text style={{ color: Colors.mute, fontSize: 12, lineHeight: 18 }}>
                  Waiting for your secure reset session. If this stays here, reopen the email link.
                </Text>
              </View>
            )}
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
            <TouchableOpacity style={styles.ctaWrap} onPress={handleUpdate} disabled={loading || checkingLink}>
              <LinearGradient colors={Gradients.blue} style={styles.cta}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.ctaText}>Update Password →</Text>}
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryLink} onPress={() => router.replace('/forgot-password')}>
              <Text style={styles.secondaryLinkText}>Resend reset link</Text>
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
  secondaryLink: { alignItems: 'center', marginTop: 16 },
  secondaryLinkText: { fontSize: 13, fontWeight: '700', color: Colors.blue },
});
