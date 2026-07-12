// FinZee AI™ — Connect Bank Screen (Plaid Link)
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Platform, StatusBar, ActivityIndicator, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors, Shadow, Radius, Gradients } from '../constants/theme';
import FinZeeLogo from '../components/FinZeeLogo';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../services/supabaseClient';
import { CONFIG } from '../constants/config';

const SECURITY_POINTS = [
  { icon: 'lock-closed-outline', text: 'FinZee never sees your bank username or password' },
  { icon: 'shield-checkmark-outline', text: 'Bank-level 256-bit encryption via Plaid' },
  { icon: 'eye-outline', text: 'Read-only access — we cannot move your money' },
  { icon: 'unlink-outline', text: 'Disconnect anytime from your profile settings' },
  { icon: 'flag-outline', text: 'Plaid is used by Venmo, Coinbase, and 7,000+ apps' },
];

const SUPPORTED_BANKS = [
  { name: 'Chase', icon: 'business-outline' }, { name: 'Bank of America', icon: 'card-outline' },
  { name: 'Wells Fargo', icon: 'cash-outline' }, { name: 'Citi', icon: 'globe-outline' },
  { name: 'US Bank', icon: 'star-outline' }, { name: '+ 10,000 more', icon: 'grid-outline' },
];

export default function ConnectBankScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);

  async function handleConnect() {
    if (!user) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 1500));
    if (CONFIG.DEV_MODE) {
      setConnected(true);
    } else {
      Alert.alert('Configuration Required', 'Set EXPO_PUBLIC_API_BASE_URL and configure Plaid on your backend.');
    }
    setLoading(false);
  }

  if (connected) {
    return (
      <View style={styles.root}>
        <StatusBar barStyle="light-content" />
        <LinearGradient colors={['#064e3b', '#059669']} style={styles.successHero}>
          <TouchableOpacity style={styles.back} onPress={() => router.back()}><Ionicons name="arrow-back" size={16} color="rgba(255,255,255,0.85)" /><Text style={styles.backText}>Back</Text></TouchableOpacity>
          <Ionicons name="checkmark-circle-outline" size={54} color="#fff" />
          <Text style={styles.successTitle}>Bank Connected!</Text>
          <Text style={styles.successSub}>FinZee AI can now analyze your transactions and provide personalized financial insights.</Text>
        </LinearGradient>
        <View style={styles.sheet}>
          <View style={styles.connectedCard}>
            <Ionicons name="business-outline" size={24} color="#fff" />
            <View style={{ flex: 1 }}><Text style={styles.connectedName}>Bank Account</Text><Text style={styles.connectedSub}>Connected securely via Plaid</Text></View>
            <View style={styles.connectedBadge}><Ionicons name="checkmark-circle-outline" size={12} color="#065f46" /><Text style={styles.connectedBadgeText}>Live</Text></View>
          </View>
          <TouchableOpacity style={styles.ctaWrap} onPress={() => router.replace('/(tabs)/home')}>
            <LinearGradient colors={Gradients.blue} style={styles.cta}><Text style={styles.ctaText}>Go to Dashboard →</Text></LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#06080f', '#0f172a', '#1a2444']} style={styles.hero}>
        <TouchableOpacity style={styles.back} onPress={() => router.back()}><Ionicons name="arrow-back" size={16} color="rgba(255,255,255,0.85)" /><Text style={styles.backText}>Back</Text></TouchableOpacity>
        <FinZeeLogo variant="light" width={140} />
        <Text style={styles.heroTitle}>Connect your <Text style={styles.heroBlue}>bank account.</Text></Text>
        <Text style={styles.heroSub}>FinZee uses Plaid — the same secure connection used by Venmo, Robinhood, and 7,000+ apps.</Text>
      </LinearGradient>
      <View style={styles.sheet}>
        <Text style={styles.sectionLabel}>Bank-level security</Text>
        {SECURITY_POINTS.map((p, i) => (
          <View key={i} style={styles.securityRow}>
            <View style={styles.securityIcon}><Ionicons name={p.icon as any} size={16} color={Colors.blue} /></View>
            <Text style={styles.securityText}>{p.text}</Text>
          </View>
        ))}
        <Text style={[styles.sectionLabel, { marginTop: 20 }]}>Works with your bank</Text>
        <View style={styles.banksGrid}>
          {SUPPORTED_BANKS.map(b => (
            <View key={b.name} style={styles.bankChip}>
              <View style={styles.bankIcon}><Ionicons name={b.icon as any} size={20} color={Colors.blue} /></View>
              <Text style={styles.bankName}>{b.name}</Text>
            </View>
          ))}
        </View>
        <TouchableOpacity style={[styles.ctaWrap, loading && { opacity: 0.7 }]} onPress={handleConnect} disabled={loading}>
          <LinearGradient colors={Gradients.blue} style={[styles.cta, { flexDirection: 'row', justifyContent: 'center', gap: 8 }]}>
            {loading ? <><ActivityIndicator color="#fff" /><Text style={styles.ctaText}>Connecting…</Text></> : <Text style={styles.ctaText}>Connect Bank Account →</Text>}
          </LinearGradient>
        </TouchableOpacity>
        <Text style={styles.plaidNote}>Powered by Plaid · Bank connections are read-only · FinZee never stores your credentials</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root:             { flex: 1, backgroundColor: Colors.dark },
  hero:             { paddingTop: Platform.OS === 'ios' ? 64 : 44, paddingBottom: 36, paddingHorizontal: 24 },
  back:             { marginBottom: 16 },
  backText:         { fontSize: 14, fontWeight: '700', color: 'rgba(255,255,255,0.6)' },
  heroTitle:        { fontSize: 32, fontWeight: '800', color: '#fff', letterSpacing: -1.5, lineHeight: 38, marginTop: 14, marginBottom: 8 },
  heroBlue:         { color: '#60a5fa' },
  heroSub:          { fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 19 },
  sheet:            { flex: 1, backgroundColor: Colors.bg, borderRadius: 28, marginTop: -20, padding: 22, paddingBottom: 40 },
  sectionLabel:     { fontSize: 11, fontWeight: '700', color: Colors.mute, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 },
  securityRow:      { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.bg2 },
  securityIcon:     { fontSize: 18, width: 26 },
  securityText:     { fontSize: 13, color: Colors.ink3, flex: 1, lineHeight: 18 },
  banksGrid:        { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  bankChip:         { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.surface, borderRadius: Radius.md, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: Colors.border, ...Shadow.sm },
  bankIcon:         { fontSize: 16 },
  bankName:         { fontSize: 12, fontWeight: '700', color: Colors.ink3 },
  ctaWrap:          { borderRadius: Radius.md, overflow: 'hidden', marginTop: 20, marginBottom: 14, ...Shadow.blue },
  cta:              { padding: 16, alignItems: 'center' },
  ctaText:          { fontSize: 16, fontWeight: '800', color: '#fff', letterSpacing: -0.3 },
  plaidNote:        { fontSize: 11, color: Colors.mute2, textAlign: 'center', lineHeight: 16 },
  successHero:      { paddingTop: Platform.OS === 'ios' ? 64 : 44, paddingBottom: 36, paddingHorizontal: 24 },
  successEmoji:     { fontSize: 52, marginBottom: 10, marginTop: 14 },
  successTitle:     { fontSize: 28, fontWeight: '800', color: '#fff', letterSpacing: -1, marginBottom: 8 },
  successSub:       { fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 19 },
  connectedCard:    { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.surface, borderRadius: Radius.md, padding: 15, borderWidth: 1, borderColor: Colors.border2, marginBottom: 20, ...Shadow.sm },
  connectedName:    { fontSize: 14, fontWeight: '700', color: Colors.ink },
  connectedSub:     { fontSize: 11, color: Colors.mute, marginTop: 1 },
  connectedBadge:   { backgroundColor: Colors.greenTint, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  connectedBadgeText: { fontSize: 11, fontWeight: '700', color: Colors.green },
});
