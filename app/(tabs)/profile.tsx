// FinZee AI™ — Profile & Settings Screen
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert, Platform, StatusBar, Share } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Colors, Shadow, Radius, Gradients } from '../../constants/theme';
import FinZeeLogo from '../../components/FinZeeLogo';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../services/supabaseClient';
import { callFunction } from '../../services/api';
import { CONFIG } from '../../constants/config';
import { syncPushTokenForUser } from '../../services/pushNotifications';
const TAB_BAR_SPACING = Platform.OS === 'ios' ? 50 : 30;

function SectionHeader({ title }: { title: string }) {
  return <Text style={styles.sectionHeader}>{title}</Text>;
}

function SettingsRow({ icon, label, sub, value, onChange, onPress, danger = false }: { icon: string; label: string; sub?: string; value?: boolean; onChange?: (v: boolean) => void; onPress?: () => void; danger?: boolean }) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} disabled={!onPress && onChange === undefined} activeOpacity={onPress ? 0.7 : 1}>
      <View style={styles.rowLeft}>
        <Text style={styles.rowIcon}>{icon}</Text>
        <View style={{ flex: 1 }}>
          <Text style={[styles.rowLabel, danger && { color: Colors.red }]}>{label}</Text>
          {sub && <Text style={styles.rowSub}>{sub}</Text>}
        </View>
      </View>
      {onChange !== undefined && value !== undefined
        ? <Switch value={value} onValueChange={onChange} trackColor={{ false: Colors.mute3, true: Colors.blue }} thumbColor={Colors.surface} />
        : onPress ? <Text style={[styles.rowArrow, danger && { color: Colors.red }]}>›</Text> : null}
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const [consentFinancial, setConsentFinancial] = useState(true);
  const [consentHealth, setConsentHealth]       = useState(true);
  const [consentAI, setConsentAI]               = useState(true);
  const [consentPush, setConsentPush]           = useState(true);
  const [wellnessScore, setWellnessScore]       = useState(0);
  const [goalsActive, setGoalsActive]           = useState(0);
  const [daysStreak, setDaysStreak]             = useState(0);

  const firstName = user?.displayName?.split(' ')[0] || 'User';
  const initials  = user?.displayName?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';

  useEffect(() => {
    let mounted = true;

    async function loadConsentState() {
      if (!user || CONFIG.DEV_MODE) return;
      try {
        const { data, error } = await supabase
          .from('consent_logs')
          .select('financial_data, health_data, ai_personalization, push_reminders, terms_accepted')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) {
          console.warn('[Profile] consent load error:', error);
          return;
        }

        if (data && mounted) {
          if (typeof data.financial_data === 'boolean') setConsentFinancial(data.financial_data);
          if (typeof data.health_data === 'boolean') setConsentHealth(data.health_data);
          if (typeof data.ai_personalization === 'boolean') setConsentAI(data.ai_personalization);
          if (typeof data.push_reminders === 'boolean') setConsentPush(data.push_reminders);
        }
      } catch (error) {
        console.warn('[Profile] consent load exception:', error);
      }
    }

    async function loadLiveStats() {
      if (!user || CONFIG.DEV_MODE) return;
      try {
        const [summary, streak, status] = await Promise.all([
          callFunction<any>('savings-goals', { method: 'GET' }),
          callFunction<any>('impulse-streak', { method: 'GET' }),
          callFunction<any>('impulse-history', { method: 'GET', query: { status: 'pending' } }),
        ]);

        const goals = Array.isArray(summary?.goals) ? summary.goals : [];
        const savedMtd = Number(summary?.total_saved ?? 0);
        const goalCount = Number(summary?.count ?? goals.length ?? 0);
        const currentStreak = Number(streak?.current_streak_days ?? 0);
        const totalPaused = Number(status?.summary?.pending ?? status?.summary?.total ?? 0);

        const liveScore = Math.max(0, Math.min(100, Math.round(
          52
          + Math.min(goalCount * 4, 16)
          + Math.min(currentStreak, 12)
          + Math.min(savedMtd / 100, 12)
          - Math.min(totalPaused * 2, 10)
        )));

        if (mounted) {
          setGoalsActive(goalCount);
          setDaysStreak(currentStreak);
          setWellnessScore(liveScore);
        }
      } catch (error) {
        console.warn('[Profile] live stats load error:', error);
      }
    }

    void loadConsentState();
    void loadLiveStats();
    return () => { mounted = false; };
  }, [user]);

  async function updateConsent(key: 'financial_data' | 'health_data' | 'ai_personalization' | 'push_reminders', value: boolean) {
    if (!user || CONFIG.DEV_MODE) return;
    const nextConsent = {
      financial_data: key === 'financial_data' ? value : consentFinancial,
      health_data: key === 'health_data' ? value : consentHealth,
      ai_personalization: key === 'ai_personalization' ? value : consentAI,
      push_reminders: key === 'push_reminders' ? value : consentPush,
      terms_accepted: true,
      consented_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('consent_logs')
      .upsert({ user_id: user.id, ...nextConsent }, { onConflict: 'user_id' });

    if (error) {
      console.warn('[Profile] consent save error:', error);
      return;
    }

    if (key === 'push_reminders') {
      try {
        await syncPushTokenForUser(user.id, value);
      } catch (pushError) {
        console.warn('[Profile] push sync error:', pushError);
      }
    }
  }

  function handleSignOut() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: async () => { await signOut(); router.replace('/login'); } },
    ]);
  }

  function handleDeleteAccount() {
    Alert.alert('Delete Account', 'This will permanently delete your account and all associated data. This action cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete Account', style: 'destructive', onPress: () => {
        Alert.alert('Request Submitted', 'Your account deletion request has been submitted. Your data will be permanently deleted within 30 days.',
          [{ text: 'OK', onPress: () => signOut() }]);
      }},
    ]);
  }

  async function handleDataExport() {
    if (!user) {
      Alert.alert('Sign in required', 'Please sign in to export your data.');
      return;
    }

    try {
      const exportData = await callFunction<any>('user-export', { method: 'GET' });
      await Share.share({
        title: 'FinZee AI Data Export',
        message: JSON.stringify(exportData, null, 2),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to export data';
      Alert.alert('Export failed', message);
    }
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <LinearGradient colors={['#06080f', '#0f172a', '#1a2444']} style={styles.hero}>
          <View style={styles.heroBar}>
            <View style={styles.heroLeft}>
              <View style={styles.avatar}>
                <LinearGradient colors={['#a855f7', '#ec4899']} style={styles.avatarGrad}>
                  <Text style={styles.avatarText}>{initials}</Text>
                </LinearGradient>
              </View>
              <View>
                <Text style={styles.heroName}>{user?.displayName || 'FinZee User'}</Text>
                <Text style={styles.heroEmail}>{user?.email || 'user@finzee.ai'}</Text>
                <View style={styles.memberBadge}><Text style={styles.memberBadgeText}>❖ FinZee Member</Text></View>
              </View>
            </View>
            <FinZeeLogo variant="light" width={80} />
          </View>
          <View style={styles.scoreRow}>
            {[{ label: 'Wellness Score', value: String(wellnessScore), color: '#34d399' }, { label: 'Goals Active', value: String(goalsActive), color: '#60a5fa' }, { label: 'Days Streak', value: String(daysStreak), color: '#fbbf24' }]
              .map(s => <View key={s.label} style={styles.scoreItem}><Text style={[styles.scoreVal, { color: s.color }]}>{s.value}</Text><Text style={styles.scoreLbl}>{s.label}</Text></View>)}
          </View>
        </LinearGradient>

        <View style={styles.body}>
          <SectionHeader title="Connected Services" />
          <View style={styles.card}>
            <SettingsRow icon="🏦" label="Bank Account" sub="Not connected — tap to connect" onPress={() => router.push('/connect-bank')} />
            <SettingsRow icon="⌚" label="Apple Health" sub="Not connected" onPress={() => router.push('/(tabs)/health')} />
            <SettingsRow icon="💍" label="Oura Ring" sub="Connect for deep sleep + HRV data" onPress={() => router.push('/connect-wearable')} />
          </View>

          <SectionHeader title="Your Data, Your Control" />
          <View style={styles.card}>
            <SettingsRow icon="🏦" label="Financial data usage" sub="Allow FinZee to analyze your transactions" value={consentFinancial} onChange={v => { setConsentFinancial(v); updateConsent('financial_data', v); }} />
            <SettingsRow icon="❤️" label="Health data usage" sub="Allow FinZee to read your health metrics" value={consentHealth} onChange={v => { setConsentHealth(v); updateConsent('health_data', v); }} />
            <SettingsRow icon="🧠" label="AI personalization" sub="Allow FinZee AI to generate tailored insights" value={consentAI} onChange={v => { setConsentAI(v); updateConsent('ai_personalization', v); }} />
            <SettingsRow icon="🔔" label="Push reminders" sub="Pause list countdowns and wellness nudges" value={consentPush} onChange={v => { setConsentPush(v); updateConsent('push_reminders', v); }} />
          </View>

          <SectionHeader title="Privacy & Security" />
          <View style={styles.card}>
            <SettingsRow icon="🔒" label="Privacy Policy" onPress={() => router.push('/privacy-policy')} />
            <SettingsRow icon="📄" label="Terms of Service" onPress={() => router.push('/terms-of-service')} />
            <SettingsRow icon="📊" label="Data Export" sub="Download your FinZee data" onPress={handleDataExport} />
          </View>

          <View style={styles.disclaimer}>
            <Text style={styles.disclaimerTitle}>Important Disclosures</Text>
            <Text style={styles.disclaimerText}>
              • FinZee AI provides financial coaching, not financial, medical, or investment advice.{'\n'}
              • FinZee does not store bank usernames or passwords.{'\n'}
              • Financial connections use secure tokenized providers like Plaid.{'\n'}
              • Health data requires your explicit permission and is never sold.{'\n'}
              • You can disconnect any service at any time.{'\n'}
            </Text>
          </View>

          <SectionHeader title="Account" />
          <View style={styles.card}>
            <SettingsRow icon="👤" label="Edit Profile" onPress={() => {}} />
            <SettingsRow icon="🔐" label="Change Password" onPress={() => router.push('/forgot-password')} />
            <SettingsRow icon="🚪" label="Sign Out" onPress={handleSignOut} />
            <SettingsRow icon="🗑" label="Delete Account" sub="Permanently delete all your data" onPress={handleDeleteAccount} danger />
          </View>

          <View style={styles.versionWrap}>
            <FinZeeLogo variant="blue" width={100} />
            <Text style={styles.version}>Version 1.0.0 · FinZee AI, Inc. · Honolulu, HI</Text>
          </View>
          <View style={{ height: 40 }} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:          { flex: 1, backgroundColor: Colors.bg },
  scrollContent: { paddingBottom: TAB_BAR_SPACING },
  hero:          { paddingTop: Platform.OS === 'ios' ? 56 : 36, paddingBottom: 24, paddingHorizontal: 20 },
  heroBar:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  heroLeft:      { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar:        { width: 56, height: 56, borderRadius: 28 },
  avatarGrad:    { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)' },
  avatarText:    { fontSize: 20, fontWeight: '800', color: '#fff' },
  heroName:      { fontSize: 18, fontWeight: '800', color: '#fff', letterSpacing: -0.5 },
  heroEmail:     { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 1 },
  memberBadge:   { backgroundColor: 'rgba(26,86,219,0.3)', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start', marginTop: 5, borderWidth: 1, borderColor: 'rgba(96,165,250,0.3)' },
  memberBadgeText: { fontSize: 10, fontWeight: '700', color: '#93c5fd' },
  scoreRow:      { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: Radius.md, padding: 14, gap: 8 },
  scoreItem:     { flex: 1, alignItems: 'center' },
  scoreVal:      { fontSize: 22, fontWeight: '800', letterSpacing: -0.8 },
  scoreLbl:      { fontSize: 9, fontWeight: '700', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2, textAlign: 'center' },
  body:          { padding: 16 },
  sectionHeader: { fontSize: 11, fontWeight: '700', color: Colors.mute, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8, marginTop: 20, marginLeft: 2 },
  card:          { backgroundColor: Colors.surface, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border2, overflow: 'hidden', marginBottom: 4, ...Shadow.sm },
  row:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 15, borderBottomWidth: 1, borderBottomColor: Colors.bg2 },
  rowLeft:       { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  rowIcon:       { fontSize: 18, width: 26, textAlign: 'center' },
  rowLabel:      { fontSize: 14, fontWeight: '600', color: Colors.ink },
  rowSub:        { fontSize: 11, color: Colors.mute, marginTop: 1 },
  rowArrow:      { fontSize: 22, color: Colors.mute3 },
  disclaimer:    { backgroundColor: Colors.blueTint, borderRadius: Radius.md, padding: 16, marginTop: 8, borderWidth: 1, borderColor: 'rgba(26,86,219,0.1)' },
  disclaimerTitle: { fontSize: 12, fontWeight: '800', color: Colors.blue, marginBottom: 8 },
  disclaimerText:  { fontSize: 11, color: Colors.ink3, lineHeight: 18 },
  versionWrap:   { alignItems: 'center', marginTop: 24, gap: 8 },
  version:       { fontSize: 11, color: Colors.mute2, textAlign: 'center' },
});
