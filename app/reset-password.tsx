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

function maskValue(value: string | null | undefined) {
  if (!value) return null;
  if (value.length <= 8) return `${value.slice(0, 2)}…${value.slice(-2)}`;
  return `${value.slice(0, 4)}…${value.slice(-4)} (len=${value.length})`;
}

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
    console.log('[ResetPassword] persistRecoverySession called:', {
      hasSession: !!session,
      accessToken: maskValue(session?.access_token),
      refreshToken: maskValue(session?.refresh_token),
    });
    if (!session) return false;
    const { error } = await supabase.auth.setSession({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
    });
    console.log('[ResetPassword] setSession result:', {
      ok: !error,
      error: error?.message || null,
    });
    if (error) throw error;
    return true;
  }

  useEffect(() => {
    let mounted = true;
    console.log('[ResetPassword] screen mounted');

    const applySessionFromUrl = async (url?: string | null) => {
      console.log('[ResetPassword] applySessionFromUrl called:', {
        hasUrl: !!url,
        urlPreview: url ? url.slice(0, 180) : null,
        handledAlready: recoveryHandledRef.current,
      });
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
          baseUrl,
          code,
          tokenHash,
          type,
          hasAccessToken: !!accessToken,
          hasRefreshToken: !!refreshToken,
          error,
          errorCode,
          errorDescription,
          fragmentPreview: fragment ? fragment.slice(0, 120) : null,
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
          console.warn('[ResetPassword] link error detected:', {
            message,
            error,
            errorCode,
            errorDescription,
          });
          return;
        }

        if (type === 'recovery' && accessToken && refreshToken) {
          console.log('[ResetPassword] recovery token pair detected. Setting session from access/refresh token.');
          await persistRecoverySession({ access_token: accessToken, refresh_token: refreshToken });
          if (mounted) {
            recoveryHandledRef.current = true;
            setReady(true);
          }
          console.log('[ResetPassword] recovery session ready via access_token/refresh_token');
          return;
        }

        if (code) {
          console.log('[ResetPassword] auth code detected, exchanging code for session:', maskValue(code));
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          console.log('[ResetPassword] exchangeCodeForSession result:', {
            ok: !error,
            hasSession: !!data?.session,
            error: error?.message || null,
          });
          if (error) throw error;
          await persistRecoverySession(data.session);
          if (mounted) {
            recoveryHandledRef.current = true;
            setReady(true);
          }
          console.log('[ResetPassword] recovery session ready via code');
          return;
        }

        if (tokenHash && type === 'recovery') {
          console.log('[ResetPassword] token_hash detected, verifying OTP:', maskValue(tokenHash));
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: 'recovery',
          });
          console.log('[ResetPassword] verifyOtp result:', {
            ok: !error,
            hasSession: !!data?.session,
            error: error?.message || null,
          });
          if (error) throw error;
          await persistRecoverySession(data.session);
          if (mounted) {
            recoveryHandledRef.current = true;
            setReady(true);
          }
          console.log('[ResetPassword] recovery session ready via token_hash');
          return;
        }

        console.warn('[ResetPassword] no recognizable recovery params found on URL');
      } catch (error) {
        console.warn('[ResetPassword] link parse error:', error);
      } finally {
        console.log('[ResetPassword] applySessionFromUrl finished');
        if (mounted) setCheckingLink(false);
      }
    };

    Linking.getInitialURL().then(async (url) => {
      console.log('[ResetPassword] Linking.getInitialURL result:', url ? url.slice(0, 180) : null);
      await applySessionFromUrl(url);
      if (mounted) setCheckingLink(false);
    });

    const subscription = Linking.addEventListener('url', ({ url }) => {
      console.log('[ResetPassword] Linking url event received:', url ? url.slice(0, 180) : null);
      void applySessionFromUrl(url);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('[ResetPassword] supabase.auth.getSession result on mount:', {
        hasSession: !!session,
        hasAccessToken: !!session?.access_token,
        userId: session?.user?.id || null,
        recoveryHandled: recoveryHandledRef.current,
      });
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
    console.log('[ResetPassword] handleUpdate called:', {
      passwordLength: password.length,
      confirmPasswordLength: confirmPassword.length,
      ready,
      checkingLink,
      done,
      recoveryHandled: recoveryHandledRef.current,
      recoveryUrlPreview: recoveryUrl ? recoveryUrl.slice(0, 180) : null,
    });
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
      console.log('[ResetPassword] handleUpdate session check #1:', {
        hasSession: !!session,
        hasAccessToken: !!session?.access_token,
        userId: session?.user?.id || null,
      });
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
          console.log('[ResetPassword] handleUpdate parsed recovery url:', {
            baseUrl,
            tokenHash: maskValue(tokenHash),
            type,
            code: maskValue(code),
            hasAccessToken: !!accessToken,
            hasRefreshToken: !!refreshToken,
          });

          if (type === 'recovery' && accessToken && refreshToken) {
            console.log('[ResetPassword] handleUpdate using access/refresh token from recovery URL');
            await persistRecoverySession({ access_token: accessToken, refresh_token: refreshToken });
          } else if (code) {
            console.log('[ResetPassword] handleUpdate exchanging code for session:', maskValue(code));
            const { data, error } = await supabase.auth.exchangeCodeForSession(code);
            console.log('[ResetPassword] handleUpdate exchange result:', {
              ok: !error,
              hasSession: !!data?.session,
              error: error?.message || null,
            });
            if (error) throw error;
            await persistRecoverySession(data.session);
          } else if (tokenHash) {
            console.log('[ResetPassword] handleUpdate verifying token_hash:', maskValue(tokenHash));
            const { data, error } = await supabase.auth.verifyOtp({
              token_hash: tokenHash,
              type: (type as any) || 'recovery',
            });
            console.log('[ResetPassword] handleUpdate verifyOtp result:', {
              ok: !error,
              hasSession: !!data?.session,
              error: error?.message || null,
            });
            if (error) throw error;
            await persistRecoverySession(data.session);
          } else {
            console.warn('[ResetPassword] handleUpdate found recoveryUrl but no session params');
          }
        } catch (error) {
          console.warn('[ResetPassword] ensure session error:', error);
        }
      }
      const { data: { session: latestSession } } = await supabase.auth.getSession();
      console.log('[ResetPassword] handleUpdate session check #2:', {
        hasSession: !!latestSession,
        hasAccessToken: !!latestSession?.access_token,
        userId: latestSession?.user?.id || null,
      });
      if (latestSession) return true;
      return false;
    })();

    if (!sessionReady) {
      console.warn('[ResetPassword] sessionReady=false; prompting user to reopen reset link');
      setLoading(false);
      Alert.alert('Reset link needed', 'Please reopen the password reset email link, then try again.');
      return;
    }

    const { error } = await supabase.auth.updateUser({ password });
    console.log('[ResetPassword] updateUser result:', {
      ok: !error,
      error: error?.message || null,
    });
    setLoading(false);

    if (error) {
      Alert.alert('Error', error.message);
      return;
    }

    setDone(true);
    console.log('[ResetPassword] password update success');
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
