// FinZee AI™ — Edit Profile
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Shadow } from '../constants/theme';
import { useAuth } from '../hooks/useAuth';
import { callFunction } from '../services/api';

type ProfilePayload = {
  first_name?: string | null;
  last_name?: string | null;
  age?: number | null;
  bio?: string | null;
  avatar_url?: string | null;
  tags?: string[] | null;
  income_pattern?: string | null;
  pain_points?: string[] | null;
  goals?: string[] | null;
  preferred_language?: string | null;
};

type ProfileResponse = {
  profile?: ProfilePayload & { user_id?: string };
};

const TAG_HINT = 'Comma separated, e.g. saver, student, family';

function splitList(value: string) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function joinList(value?: string[] | null) {
  return (value ?? []).join(', ');
}

export default function EditProfileScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [age, setAge] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [tags, setTags] = useState('');
  const [incomePattern, setIncomePattern] = useState('');
  const [painPoints, setPainPoints] = useState('');
  const [goals, setGoals] = useState('');
  const [preferredLanguage, setPreferredLanguage] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await callFunction<ProfileResponse>('user-profile', { method: 'GET' });
      const profile = response?.profile ?? {};

      setFirstName(profile.first_name ?? '');
      setLastName(profile.last_name ?? '');
      setAge(profile.age == null ? '' : String(profile.age));
      setBio(profile.bio ?? '');
      setAvatarUrl(profile.avatar_url ?? '');
      setTags(joinList(profile.tags ?? null));
      setIncomePattern(profile.income_pattern ?? '');
      setPainPoints(joinList(profile.pain_points ?? null));
      setGoals(joinList(profile.goals ?? null));
      setPreferredLanguage(profile.preferred_language ?? '');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load profile';
      Alert.alert('Profile load failed', message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  const parsedTags = useMemo(() => splitList(tags), [tags]);
  const parsedPainPoints = useMemo(() => splitList(painPoints), [painPoints]);
  const parsedGoals = useMemo(() => splitList(goals), [goals]);

  const handleSave = useCallback(async () => {
    if (!user) {
      Alert.alert('Sign in required', 'Please sign in before updating your profile.');
      return;
    }

    const cleanFirst = firstName.trim();
    const cleanLast = lastName.trim();
    const cleanBio = bio.trim();
    const cleanAvatar = avatarUrl.trim();
    const cleanLanguage = preferredLanguage.trim();
    const cleanIncome = incomePattern.trim();
    const cleanAge = age.trim();
    const nextAge = cleanAge ? Number(cleanAge) : null;

    if (cleanAge && (!Number.isFinite(nextAge) || Number.isNaN(nextAge) || nextAge < 0)) {
      Alert.alert('Invalid age', 'Please enter a valid age.');
      return;
    }

    setSaving(true);
    try {
      const { profile } = await callFunction<ProfileResponse>('user-profile', {
        method: 'PUT',
        body: {
          first_name: cleanFirst || null,
          last_name: cleanLast || null,
          age: nextAge,
          bio: cleanBio || null,
          avatar_url: cleanAvatar || null,
          tags: parsedTags,
          income_pattern: cleanIncome || null,
          pain_points: parsedPainPoints,
          goals: parsedGoals,
          preferred_language: cleanLanguage || null,
        } as ProfilePayload,
      });

      Alert.alert('Profile updated', 'Your profile information has been saved successfully.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
      if (profile?.first_name !== undefined) {
        void load();
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save profile';
      Alert.alert('Save failed', message);
    } finally {
      setSaving(false);
    }
  }, [age, avatarUrl, bio, firstName, incomePattern, load, parsedGoals, parsedPainPoints, parsedTags, preferredLanguage, user]);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#06080f" translucent={false} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.blue} />}
        >
          <LinearGradient colors={['#06080f', '#0f172a', '#1a2444']} style={styles.hero}>
            <TouchableOpacity style={styles.backRow} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={18} color="rgba(255,255,255,0.9)" />
              <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>
            <Text style={styles.kicker}>FinZee AI™</Text>
            <Text style={styles.title}>Edit Profile</Text>
            <Text style={styles.subtitle}>Update the details FinZee uses for personalization and display.</Text>
          </LinearGradient>

          <View style={styles.body}>
            {loading ? (
              <View style={[styles.card, styles.loadingCard, Shadow.sm]}>
                <ActivityIndicator color={Colors.blue} />
                <Text style={styles.loadingText}>Loading profile…</Text>
              </View>
            ) : (
              <>
                <View style={[styles.card, Shadow.sm]}>
                  <Text style={styles.sectionTitle}>Basic Info</Text>
                  <View style={styles.row}>
                    <View style={styles.fieldHalf}>
                      <Text style={styles.label}>First name</Text>
                      <TextInput style={styles.input} value={firstName} onChangeText={setFirstName} placeholder="Maya" placeholderTextColor={Colors.mute2} />
                    </View>
                    <View style={styles.fieldHalf}>
                      <Text style={styles.label}>Last name</Text>
                      <TextInput style={styles.input} value={lastName} onChangeText={setLastName} placeholder="Brooks" placeholderTextColor={Colors.mute2} />
                    </View>
                  </View>
                  <View style={styles.row}>
                    <View style={styles.fieldHalf}>
                      <Text style={styles.label}>Age</Text>
                      <TextInput style={styles.input} value={age} onChangeText={setAge} placeholder="27" placeholderTextColor={Colors.mute2} keyboardType="number-pad" />
                    </View>
                    <View style={styles.fieldHalf}>
                      <Text style={styles.label}>Language</Text>
                      <TextInput style={styles.input} value={preferredLanguage} onChangeText={setPreferredLanguage} placeholder="en" placeholderTextColor={Colors.mute2} autoCapitalize="none" />
                    </View>
                  </View>
                </View>

                <View style={[styles.card, Shadow.sm]}>
                  <Text style={styles.sectionTitle}>Profile Details</Text>
                  <Text style={styles.label}>Bio</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={bio}
                    onChangeText={setBio}
                    placeholder="Tell FinZee a little about you"
                    placeholderTextColor={Colors.mute2}
                    multiline
                  />
                  <Text style={styles.label}>Avatar URL</Text>
                  <TextInput style={styles.input} value={avatarUrl} onChangeText={setAvatarUrl} placeholder="https://..." placeholderTextColor={Colors.mute2} autoCapitalize="none" />
                  <Text style={styles.label}>Income Pattern</Text>
                  <TextInput style={styles.input} value={incomePattern} onChangeText={setIncomePattern} placeholder="salary / irregular_freelance" placeholderTextColor={Colors.mute2} autoCapitalize="none" />
                </View>

                <View style={[styles.card, Shadow.sm]}>
                  <Text style={styles.sectionTitle}>Personalization Tags</Text>
                  <Text style={styles.helper}>{TAG_HINT}</Text>
                  <TextInput style={styles.input} value={tags} onChangeText={setTags} placeholder="gen-z, saver, parent" placeholderTextColor={Colors.mute2} />

                  <Text style={styles.label}>Pain Points</Text>
                  <TextInput style={styles.input} value={painPoints} onChangeText={setPainPoints} placeholder="impulse-spending, cash-flow, subscriptions" placeholderTextColor={Colors.mute2} />

                  <Text style={styles.label}>Goals</Text>
                  <TextInput style={styles.input} value={goals} onChangeText={setGoals} placeholder="emergency-fund, vacation, debt-payoff" placeholderTextColor={Colors.mute2} />
                </View>

                <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.8 }]} onPress={handleSave} disabled={saving}>
                  <LinearGradient colors={['#2563eb', '#4f46e5']} style={styles.saveGrad}>
                    <Text style={styles.saveText}>{saving ? 'Saving…' : 'Save Changes'}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  flex: { flex: 1 },
  content: { flexGrow: 1 },
  hero: {
    paddingTop: Platform.OS === 'ios' ? 56 : 36,
    paddingHorizontal: 20,
    paddingBottom: 22,
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  backText: { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.9)' },
  kicker: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.38)',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  title: { fontSize: 30, fontWeight: '800', color: '#fff', letterSpacing: -1.1 },
  subtitle: { fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 18, marginTop: 6 },
  body: { padding: 16, gap: 12 },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border2,
  },
  loadingCard: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    minHeight: 120,
  },
  loadingText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.mute,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.ink,
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  fieldHalf: {
    flex: 1,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.mute,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 6,
    marginTop: 10,
  },
  helper: {
    fontSize: 11,
    color: Colors.mute,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.bg,
    borderWidth: 1,
    borderColor: Colors.border2,
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: Colors.ink,
  },
  textArea: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
  saveBtn: {
    borderRadius: Radius.md,
    overflow: 'hidden',
    marginTop: 4,
  },
  saveGrad: {
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#fff',
  },
});
