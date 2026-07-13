import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Platform, BackHandler } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Shadow } from '../constants/theme';

const TAB_BAR_SPACING = Platform.OS === 'ios' ? 50 : 30;

export default function PrivacyPolicyScreen() {
  useEffect(() => {
    const onBackPress = () => {
      router.replace('/(tabs)/profile');
      return true;
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, []);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#06080f" translucent={false} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <LinearGradient colors={['#06080f', '#0f172a', '#1a2444']} style={styles.hero}>
          <TouchableOpacity style={styles.backRow} onPress={() => router.replace('/(tabs)/profile')}>
            <Ionicons name="arrow-back" size={18} color="rgba(255,255,255,0.9)" />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.kicker}>FinZee AI™</Text>
          <Text style={styles.title}>Privacy Policy</Text>
          <Text style={styles.subtitle}>How your data is collected, used, and protected inside FinZee AI.</Text>
        </LinearGradient>

        <View style={styles.body}>
          <View style={[styles.card, Shadow.sm]}>
            <Text style={styles.sectionTitle}>1. Data We Collect</Text>
            <Text style={styles.paragraph}>
              We collect only the data needed to provide financial wellness features, such as account connections,
              transactions, goals, pause-list items, consent choices, and optional health metrics if you allow them.
            </Text>
          </View>

          <View style={[styles.card, Shadow.sm]}>
            <Text style={styles.sectionTitle}>2. How We Use It</Text>
            <Text style={styles.paragraph}>
              We use your data to display budgets, goals, spending insights, pause-block alerts, health wellness
              summaries, and AI-generated coaching responses. We do not sell your personal data.
            </Text>
          </View>

          <View style={[styles.card, Shadow.sm]}>
            <Text style={styles.sectionTitle}>3. Storage & Security</Text>
            <Text style={styles.paragraph}>
              Financial connections use tokenized providers, not raw credentials. Consent preferences are stored in
              your account so you can control what is processed at any time.
            </Text>
          </View>

          <View style={[styles.card, Shadow.sm]}>
            <Text style={styles.sectionTitle}>4. Your Choices</Text>
            <Text style={styles.paragraph}>
              You can update consent, disconnect services, request deletion, or export your data from the Profile
              screen.
            </Text>
          </View>

          <View style={{ height: TAB_BAR_SPACING }} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
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
  body: { padding: 16 },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border2,
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: Colors.ink, marginBottom: 8, letterSpacing: -0.3 },
  paragraph: { fontSize: 13, color: Colors.ink3, lineHeight: 20 },
});
