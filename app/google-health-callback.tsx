// FinZee AI™ — Google Health OAuth Callback
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, StatusBar, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import FinZeeLogo from '../components/FinZeeLogo';
import { Colors, Radius, Shadow } from '../constants/theme';
import { exchangeGoogleHealthCode } from '../services/wearableService';

const REDIRECT_URI = 'finzeeai://google-health-callback';

export default function GoogleHealthCallbackScreen() {
  const params = useLocalSearchParams<{ code?: string; error?: string; error_description?: string }>();
  const handledRef = useRef(false);
  const [status, setStatus] = useState<'working' | 'success' | 'error' | 'waiting'>('working');
  const [message, setMessage] = useState('Completing Google Health connection...');

  useEffect(() => {
    if (handledRef.current) return;
    handledRef.current = true;

    const code = typeof params.code === 'string' ? params.code : null;
    const error = typeof params.error === 'string' ? params.error : null;
    const errorDescription = typeof params.error_description === 'string' ? params.error_description : null;

    if (error) {
      setStatus('error');
      setMessage(errorDescription || error || 'Google authorization failed.');
      return;
    }

    if (!code) {
      setStatus('waiting');
      setMessage('Waiting for Google to return an authorization code...');
      return;
    }

    (async () => {
      try {
        await exchangeGoogleHealthCode(code, REDIRECT_URI);
        setStatus('success');
        setMessage('Google Health connected successfully.');
        setTimeout(() => {
          router.replace('/connect-wearable');
        }, 1200);
      } catch (err) {
        setStatus('error');
        setMessage(err instanceof Error ? err.message : 'Failed to connect Google Health.');
      }
    })();
  }, [params]);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#06080f" translucent={false} />
      <View style={styles.card}>
        <FinZeeLogo variant="light" width={120} />
        <Text style={styles.title}>{status === 'success' ? 'Connected' : status === 'error' ? 'Connection failed' : 'Connecting Google Health'}</Text>
        <Text style={styles.message}>{message}</Text>
        {status === 'working' && <ActivityIndicator size="large" color={Colors.blue} style={{ marginTop: 18 }} />}
        {status !== 'working' && (
          <TouchableOpacity style={styles.button} onPress={() => router.replace('/connect-wearable')}>
            <Text style={styles.buttonText}>{status === 'error' ? 'Back to Connect Screen' : 'Continue'}</Text>
          </TouchableOpacity>
        )}
        {status === 'error' && (
          <TouchableOpacity
            style={[styles.button, { marginTop: 10, backgroundColor: 'transparent', borderWidth: 1, borderColor: Colors.border2 }]}
            onPress={() => {
              Alert.alert('Retry connection', 'Open the Google Health connect flow again to generate a fresh authorization code.', [
                { text: 'OK', onPress: () => router.replace('/connect-wearable') },
              ]);
            }}
          >
            <Text style={[styles.buttonText, { color: Colors.ink }]}>Try Again</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center', padding: 20 },
  card: { width: '100%', maxWidth: 420, backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: Colors.border2, ...Shadow.md },
  title: { fontSize: 22, fontWeight: '800', color: Colors.ink, marginTop: 18, marginBottom: 8, textAlign: 'center' },
  message: { fontSize: 14, color: Colors.mute, textAlign: 'center', lineHeight: 20 },
  button: { marginTop: 18, backgroundColor: Colors.blue, paddingHorizontal: 18, paddingVertical: 12, borderRadius: Radius.md, minWidth: 180, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 14, fontWeight: '800' },
});
