// FinZee AI™ — Should I Buy This? Screen
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, KeyboardAvoidingView, Platform,
  StatusBar, Alert, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadow, Radius, Gradients } from '../constants/theme';
import FinZeeLogo from '../components/FinZeeLogo';
import { useAuth } from '../hooks/useAuth';
import { evaluatePurchase } from '../services/insightEngine';
import { supabase } from '../services/supabaseClient';
import { CONFIG, DEV_SAMPLE } from '../constants/config';

type Urgency = 'low' | 'medium' | 'high';
type Mood    = 'stressed' | 'neutral' | 'happy';

const MOODS: { key: Mood; icon: string; label: string }[] = [
  { key: 'stressed', icon: 'alert-circle-outline', label: 'Stressed' },
  { key: 'neutral',  icon: 'remove-circle-outline', label: 'Neutral'  },
  { key: 'happy',    icon: 'happy-outline', label: 'Happy'    },
];

const CATEGORIES = ['Electronics', 'Clothing', 'Dining', 'Home', 'Fitness', 'Travel', 'Entertainment', 'Other'];

export default function PurchaseCheckScreen() {
  const { user } = useAuth();
  const params = useLocalSearchParams<{ from?: string }>();
  const navigation = useNavigation();
  const [itemName,  setItemName]  = useState('');
  const [price,     setPrice]     = useState('');
  const [category,  setCategory]  = useState('');
  const [urgency,   setUrgency]   = useState<Urgency>('low');
  const [mood,      setMood]      = useState<Mood>('neutral');
  const [reason,    setReason]    = useState('');
  const [result,    setResult]    = useState<ReturnType<typeof evaluatePurchase> | null>(null);
  const [loading,   setLoading]   = useState(false);
  const [savedToPause, setSavedToPause] = useState(false);

  const goBack = () => {
    const origin = Array.isArray(params.from) ? params.from[0] : params.from;
    if (origin === 'pause') {
      router.replace('/(tabs)/pause');
      return;
    }
    if (origin === 'home') {
      router.replace('/(tabs)/home');
      return;
    }
    if (navigation.canGoBack()) navigation.goBack();
    else router.replace('/(tabs)/home');
  };

  async function handleEvaluate() {
    if (!itemName.trim() || !price.trim()) { Alert.alert('Missing info', 'Please enter an item name and price.'); return; }
    setLoading(true); setResult(null); setSavedToPause(false);
    await new Promise(r => setTimeout(r, 800));
    const evaluation = evaluatePurchase({
      price: parseFloat(price), category: category || 'General', urgency, mood, reason,
      monthlyBudgetRemaining: DEV_SAMPLE.monthlyBudget * 0.4,
      currentGoalProgress: 0.42,
    });
    setResult(evaluation);
    setLoading(false);
    if (!CONFIG.DEV_MODE && user) {
      await supabase.from('purchase_checks').insert({
        user_id: user.id, item_name: itemName.trim(), price: parseFloat(price),
        category, urgency, reason, mood_level: mood,
        recommendation: evaluation.recommendation,
        budget_impact: evaluation.budgetImpact,
        goal_impact: evaluation.goalImpact,
        emotional_risk: evaluation.emotionalRisk,
      });
    }
  }

  async function handleAddToPause() {
    if (!itemName || !price) return;
    const due = new Date(); due.setHours(due.getHours() + 24);
    if (!CONFIG.DEV_MODE && user) {
      const { error } = await supabase.from('pause_list_items').insert({
        user_id: user.id, item_name: itemName.trim(), price: parseFloat(price),
        category, reason: reason || 'No reason given', reminder_due_at: due.toISOString(), status: 'pending',
      });
      if (error) {
        Alert.alert('Could not add to Pause List', error.message);
        return;
      }
    }
    setSavedToPause(true);
    Alert.alert('Added to Pause List', `We'll remind you about "${itemName}" in 24 hours. Take that time to reflect.`,
      [{ text: 'View Pause List', onPress: () => router.push('/(tabs)/pause') }, { text: 'OK' }]
    );
  }

  const recConfig = result ? {
    buy:   { emoji: 'checkmark-circle-outline', label: 'Green Light',          desc: 'This fits your financial plan.',      bg: Colors.greenTint, color: '#065f46', border: Colors.green },
    wait:  { emoji: 'hourglass-outline', label: 'Sleep On It',          desc: 'Low urgency — wait 24 hours.',        bg: Colors.amberTint, color: '#92400e', border: Colors.amber },
    pause: { emoji: 'pause-circle-outline', label: 'Pause This Purchase', desc: 'High emotional risk detected.',       bg: Colors.redTint,   color: '#991b1b', border: Colors.red },
  }[result.recommendation] : null;

  const riskColor = result ? { low: Colors.green, medium: Colors.amber, high: Colors.red }[result.emotionalRisk] : Colors.mute;

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle="light-content" />
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1 }}>
        <LinearGradient colors={['#06080f', '#0f172a', '#1a56db']} style={styles.hero}>
          <TouchableOpacity style={styles.backBtn} onPress={goBack}><Ionicons name="arrow-back" size={16} color="rgba(255,255,255,0.65)" /><Text style={styles.backText}>Back</Text></TouchableOpacity>
          <FinZeeLogo variant="light" width={120} />
          <Text style={styles.heroTitle}>Should I Buy This?</Text>
          <Text style={styles.heroSub}>FinZee AI evaluates your purchase before you spend</Text>
        </LinearGradient>

        <View style={styles.body}>
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>What are you buying?</Text>
            <TextInput style={styles.input} value={itemName} onChangeText={setItemName} placeholder="e.g. AirPods Pro" placeholderTextColor={Colors.mute2} />
            <TextInput style={[styles.input, { marginTop: 10 }]} value={price} onChangeText={setPrice} placeholder="Price ($)" placeholderTextColor={Colors.mute2} keyboardType="decimal-pad" />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.chipRow}>
                {CATEGORIES.map(c => (
                  <TouchableOpacity key={c} style={[styles.chip, category === c && styles.chipActive]} onPress={() => setCategory(c)}>
                    <Text style={[styles.chipText, category === c && styles.chipTextActive]}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>How urgent is this?</Text>
            <View style={styles.urgencyRow}>
              {(['low', 'medium', 'high'] as Urgency[]).map(u => (
                <TouchableOpacity key={u} style={[styles.urgencyBtn, urgency === u && styles.urgencyActive]} onPress={() => setUrgency(u)}>
                  <Text style={[styles.urgencyText, urgency === u && styles.urgencyTextActive]}>{u.charAt(0).toUpperCase() + u.slice(1)}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>How are you feeling right now?</Text>
            <View style={styles.moodRow}>
              {MOODS.map(m => (
                <TouchableOpacity key={m.key} style={[styles.moodBtn, mood === m.key && styles.moodActive]} onPress={() => setMood(m.key)}>
                  <Ionicons name={m.icon as any} size={22} color={mood === m.key ? Colors.blue : Colors.mute} />
                  <Text style={[styles.moodLabel, mood === m.key && { color: Colors.blue }]}>{m.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Why do you want this? (optional)</Text>
            <TextInput style={[styles.input, styles.textArea]} value={reason} onChangeText={setReason} placeholder="I want this because..." placeholderTextColor={Colors.mute2} multiline numberOfLines={3} />
          </View>

          <TouchableOpacity style={styles.evalWrap} onPress={handleEvaluate} disabled={loading}>
            <LinearGradient colors={Gradients.blue} style={styles.evalBtn}>
              {loading ? <><ActivityIndicator color="#fff" /><Text style={styles.evalText}> Analyzing…</Text></> : <Text style={styles.evalText}>Evaluate with FinZee AI →</Text>}
            </LinearGradient>
          </TouchableOpacity>

          {result && recConfig && (
            <View style={[styles.resultCard, Shadow.md]}>
              <View style={[styles.recHero, { backgroundColor: recConfig.bg, borderColor: recConfig.border }]}>
                <Ionicons name={recConfig.emoji as any} size={40} color={recConfig.color} />
                <Text style={[styles.recLabel, { color: recConfig.color }]}>{recConfig.label}</Text>
                <Text style={[styles.recDesc, { color: recConfig.color + 'cc' }]}>{recConfig.desc}</Text>
              </View>
              {[
                { label: 'Budget Impact',  value: result.budgetImpact },
                { label: 'Goal Impact',    value: result.goalImpact },
                { label: 'Health Context', value: 'Sleep was 6.2 hrs last night — impulse risk elevated 34%' },
              ].map(r => (
                <View key={r.label} style={styles.resultRow}>
                  <Text style={styles.resultRowLabel}>{r.label}</Text>
                  <Text style={styles.resultRowValue}>{r.value}</Text>
                </View>
              ))}
              <View style={[styles.resultRow, { borderBottomWidth: 0 }]}>
                <Text style={styles.resultRowLabel}>Emotional Risk</Text>
                <View style={[styles.riskBadge, { backgroundColor: riskColor + '20' }]}>
                  <Text style={[styles.riskText, { color: riskColor }]}>{result.emotionalRisk.toUpperCase()}</Text>
                </View>
              </View>
              {!savedToPause ? (
                <TouchableOpacity style={styles.pauseCta} onPress={handleAddToPause}>
                  <Text style={styles.pauseCtaText}>Add to 24-Hour Pause List</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.savedBanner}>
                  <Text style={styles.savedBannerText}>Added to your Pause List — we'll remind you in 24 hours.</Text>
                </View>
              )}
            </View>
          )}
          <View style={{ height: 40 }} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root:           { flex: 1, backgroundColor: Colors.bg },
  hero:           { paddingTop: Platform.OS === 'ios' ? 56 : 36, paddingBottom: 28, paddingHorizontal: 20, alignItems: 'flex-start' },
  backBtn:        { marginBottom: 14 },
  backText:       { fontSize: 14, fontWeight: '700', color: 'rgba(255,255,255,0.65)' },
  heroTitle:      { fontSize: 24, fontWeight: '800', color: '#fff', letterSpacing: -1, marginTop: 14, marginBottom: 4 },
  heroSub:        { fontSize: 13, color: 'rgba(255,255,255,0.5)' },
  body:           { padding: 16 },
  section:        { marginBottom: 20 },
  sectionLabel:   { fontSize: 11, fontWeight: '700', color: Colors.mute, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 },
  input:          { backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.md, padding: 14, fontSize: 15, color: Colors.ink, ...Shadow.sm },
  textArea:       { height: 80, textAlignVertical: 'top' },
  chipRow:        { flexDirection: 'row', gap: 8 },
  chip:           { paddingHorizontal: 16, paddingVertical: 9, borderRadius: Radius.full, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.surface },
  chipActive:     { backgroundColor: Colors.blue, borderColor: Colors.blue },
  chipText:       { fontSize: 13, fontWeight: '700', color: Colors.mute },
  chipTextActive: { color: '#fff' },
  urgencyRow:     { flexDirection: 'row', gap: 8 },
  urgencyBtn:     { flex: 1, padding: 11, borderRadius: Radius.md, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.surface, alignItems: 'center' },
  urgencyActive:  { backgroundColor: Colors.blue, borderColor: Colors.blue },
  urgencyText:    { fontSize: 13, fontWeight: '700', color: Colors.mute },
  urgencyTextActive: { color: '#fff' },
  moodRow:        { flexDirection: 'row', gap: 8 },
  moodBtn:        { flex: 1, padding: 14, borderRadius: Radius.md, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.surface, alignItems: 'center', gap: 4 },
  moodActive:     { borderColor: Colors.blue, backgroundColor: Colors.blueTint },
  moodEmoji:      { fontSize: 24 },
  moodLabel:      { fontSize: 11, fontWeight: '700', color: Colors.mute },
  evalWrap:       { borderRadius: Radius.md, overflow: 'hidden', marginBottom: 16, ...Shadow.blue },
  evalBtn:        { padding: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 },
  evalText:       { fontSize: 16, fontWeight: '800', color: '#fff', letterSpacing: -0.3 },
  resultCard:     { backgroundColor: Colors.surface, borderRadius: Radius.lg, overflow: 'hidden', borderWidth: 1, borderColor: Colors.border2 },
  recHero:        { padding: 20, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: Colors.border2 },
  recEmoji:       { fontSize: 36, marginBottom: 6 },
  recLabel:       { fontSize: 22, fontWeight: '800', letterSpacing: -0.8, marginBottom: 4 },
  recDesc:        { fontSize: 13, fontWeight: '600', textAlign: 'center' },
  resultRow:      { padding: 14, borderBottomWidth: 1, borderBottomColor: Colors.bg2, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  resultRowLabel: { fontSize: 11, fontWeight: '700', color: Colors.mute2, textTransform: 'uppercase', letterSpacing: 0.6, flex: 0.7 },
  resultRowValue: { fontSize: 13, fontWeight: '600', color: Colors.ink3, flex: 1, textAlign: 'right' },
  riskBadge:      { paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.full },
  riskText:       { fontSize: 11, fontWeight: '800' },
  pauseCta:       { margin: 14, backgroundColor: Colors.amberTint, borderRadius: Radius.md, padding: 14, alignItems: 'center', borderWidth: 1.5, borderColor: '#fde68a' },
  pauseCtaText:   { fontSize: 14, fontWeight: '700', color: '#92400e' },
  savedBanner:    { margin: 14, backgroundColor: Colors.greenTint, borderRadius: Radius.md, padding: 14, alignItems: 'center' },
  savedBannerText: { fontSize: 13, fontWeight: '700', color: '#065f46', textAlign: 'center' },
});
