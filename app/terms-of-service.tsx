import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Platform, BackHandler } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Shadow } from '../constants/theme';

const TAB_BAR_SPACING = Platform.OS === 'ios' ? 50 : 30;

export default function TermsOfServiceScreen() {
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
          <Text style={styles.title}>Terms of Service</Text>
          <Text style={styles.subtitle}>Rules for using FinZee AI and the services we provide.</Text>
        </LinearGradient>

        <View style={styles.body}>
          <View style={[styles.card, Shadow.sm]}>
            <Text style={styles.sectionTitle}>1. Service Purpose</Text>
            <Text style={styles.paragraph}>
              FinZee AI is a financial wellness assistant. It helps with budgeting, spending awareness, goal tracking,
              pause-list decisions, and optional health insights.
            </Text>
          </View>

          <View style={[styles.card, Shadow.sm]}>
            <Text style={styles.sectionTitle}>2. User Responsibilities</Text>
            <Text style={styles.paragraph}>
              You agree to provide accurate information, keep your account secure, and use the app only for lawful,
              personal financial wellness purposes.
            </Text>
          </View>

          <View style={[styles.card, Shadow.sm]}>
            <Text style={styles.sectionTitle}>3. AI & Advice</Text>
            <Text style={styles.paragraph}>
              AI responses are informational and should not be treated as financial, medical, or legal advice.
              Always use your own judgment before making important decisions.
            </Text>
          </View>

          <View style={[styles.card, Shadow.sm]}>
            <Text style={styles.sectionTitle}>4. Suspension & Changes</Text>
            <Text style={styles.paragraph}>
              We may update these terms or suspend access if required to protect the service, users, or compliance.
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
