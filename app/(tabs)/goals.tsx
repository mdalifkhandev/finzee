// FinZee AI™ — Financial Goals Screen
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Modal, TextInput, Alert, ActivityIndicator, Platform, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Shadow, Radius, Gradients } from '../../constants/theme';
import FinZeeLogo from '../../components/FinZeeLogo';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../services/supabaseClient';
import { CONFIG } from '../../constants/config';

interface Goal {
  id: string; user_id: string; name: string; emoji: string;
  target: number; current: number; deadline?: string; created_at: string;
}

const DEFAULT_GOALS: Goal[] = [
  { id: 'g1', user_id: 'dev', name: 'Emergency Fund',     emoji: '🛡️', target: 15000, current: 15000, created_at: '' },
  { id: 'g2', user_id: 'dev', name: 'House Down Payment', emoji: '🏠', target: 60000, current: 25200, deadline: '2027-12-01', created_at: '' },
  { id: 'g3', user_id: 'dev', name: 'Japan Vacation',     emoji: '✈️', target: 5000,  current: 3500,  deadline: '2026-02-01', created_at: '' },
];

const EMOJI_OPTIONS = ['🏠','✈️','🚗','🎓','💍','🛡️','💻','🏻','🌴','💰','🎯','🏦'];

function GoalCard({ goal, onCelebrate }: { goal: Goal; onCelebrate: (g: Goal) => void }) {
  const pct      = Math.min(Math.round((goal.current / goal.target) * 100), 100);
  const complete = pct >= 100;
  const pctColor = complete ? Colors.green : Colors.blue;
  return (
    <TouchableOpacity style={[styles.goalCard, Shadow.sm]} onPress={() => complete && onCelebrate(goal)} activeOpacity={0.85}>
      <View style={styles.goalTop}>
        <View style={styles.goalLeft}>
          <View style={styles.goalEmoji}><Text style={{ fontSize: 22 }}>{goal.emoji}</Text></View>
          <View>
            <Text style={styles.goalName}>{goal.name}</Text>
            <Text style={styles.goalSub}>{complete ? 'Goal complete!' : `$${(goal.target - goal.current).toLocaleString()} to go`}</Text>
          </View>
        </View>
        <Text style={[styles.goalPct, { color: pctColor }]}>{pct}%</Text>
      </View>
      <View style={styles.goalBarBg}><View style={[styles.goalBarFill, { width: `${pct}%`, backgroundColor: pctColor }]} /></View>
      <View style={styles.goalBot}>
        <Text style={styles.goalBotLeft}>${goal.current.toLocaleString()} of ${goal.target.toLocaleString()}</Text>
        {complete
          ? <TouchableOpacity onPress={() => onCelebrate(goal)}><Text style={styles.celebrateBtn}>View achievement 🎉</Text></TouchableOpacity>
          : <Text style={styles.goalBotRight}>{goal.deadline ? new Date(goal.deadline).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'No deadline'}</Text>
        }
      </View>
    </TouchableOpacity>
  );
}

function CelebrationModal({ goal, onClose }: { goal: Goal | null; onClose: () => void }) {
  if (!goal) return null;
  return (
    <Modal transparent animationType="slide" visible={!!goal} onRequestClose={onClose}>
      <View style={cel.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={cel.sheet}>
          <View style={cel.pip} />
          <Text style={cel.emoji}>🎉</Text>
          <Text style={cel.title}>Goal Achieved!</Text>
          <Text style={cel.desc}>You've fully funded your {goal.name}. This is a major milestone in your financial journey.</Text>
          <View style={cel.box}><Text style={cel.amount}>${goal.target.toLocaleString()}</Text><Text style={cel.tag}>{goal.name} — Complete ✅</Text></View>
          <TouchableOpacity style={cel.ctaWrap} onPress={onClose}><LinearGradient colors={Gradients.blue} style={cel.cta}><Text style={cel.ctaText}>Continue My Journey →</Text></LinearGradient></TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function AddGoalModal({ visible, onClose, onAdd }: { visible: boolean; onClose: () => void; onAdd: (g: Omit<Goal,'id'|'user_id'|'created_at'>) => void }) {
  const [name, setName]       = useState('');
  const [target, setTarget]   = useState('');
  const [current, setCurrent] = useState('0');
  const [emoji, setEmoji]     = useState('🎯');
  const [deadline, setDeadline] = useState('');

  function handleAdd() {
    if (!name.trim() || !target.trim()) { Alert.alert('Missing fields', 'Please enter a goal name and target amount.'); return; }
    onAdd({ name: name.trim(), emoji, target: parseFloat(target), current: parseFloat(current) || 0, deadline: deadline || undefined });
    setName(''); setTarget(''); setCurrent('0'); setEmoji('🎯'); setDeadline('');
    onClose();
  }

  return (
    <Modal transparent animationType="slide" visible={visible} onRequestClose={onClose}>
      <View style={add.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} />
        <ScrollView style={add.sheet} keyboardShouldPersistTaps="handled">
          <View style={add.pip} />
          <Text style={add.title}>New Financial Goal</Text>
          <Text style={add.label}>Choose an emoji</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={add.emojiScroll}>
            {EMOJI_OPTIONS.map(e => <TouchableOpacity key={e} style={[add.emojiBtn, emoji === e && add.emojiBtnSel]} onPress={() => setEmoji(e)}><Text style={{ fontSize: 22 }}>{e}</Text></TouchableOpacity>)}
          </ScrollView>
          {[
            { label: 'Goal Name', value: name, set: setName, placeholder: 'e.g. House Down Payment', type: 'default' },
            { label: 'Target Amount ($)', value: target, set: setTarget, placeholder: '60000', type: 'decimal-pad' },
            { label: 'Current Amount ($)', value: current, set: setCurrent, placeholder: '0', type: 'decimal-pad' },
            { label: 'Target Date (optional)', value: deadline, set: setDeadline, placeholder: 'YYYY-MM-DD', type: 'default' },
          ].map(f => (
            <View key={f.label} style={add.fieldWrap}>
              <Text style={add.fieldLabel}>{f.label}</Text>
              <TextInput style={add.input} value={f.value} onChangeText={f.set} placeholder={f.placeholder} placeholderTextColor={Colors.mute2} keyboardType={f.type as any} />
            </View>
          ))}
          <TouchableOpacity style={add.ctaWrap} onPress={handleAdd}><LinearGradient colors={Gradients.blue} style={add.cta}><Text style={add.ctaText}>Add Goal →</Text></LinearGradient></TouchableOpacity>
          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </Modal>
  );
}

export default function GoalsScreen() {
  const { user } = useAuth();
  const [goals, setGoals]         = useState<Goal[]>([]);
  const [loading, setLoading]     = useState(true);
  const [celebrated, setCelebrated] = useState<Goal | null>(null);
  const [showAdd, setShowAdd]     = useState(false);

  useEffect(() => { loadGoals(); }, [user]);

  async function loadGoals() {
    if (CONFIG.DEV_MODE || !user) { setGoals(DEFAULT_GOALS); setLoading(false); return; }
    try {
      const { data, error } = await supabase.from('goals').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      if (error) throw error;
      setGoals(data ?? DEFAULT_GOALS);
    } catch (e) { console.warn('[Goals] load error:', e); setGoals(DEFAULT_GOALS); } finally { setLoading(false); }
  }

  async function addGoal(g: Omit<Goal,'id'|'user_id'|'created_at'>) {
    if (CONFIG.DEV_MODE || !user) {
      setGoals(prev => [{ ...g, id: Date.now().toString(), user_id: 'dev', created_at: '' }, ...prev]); return;
    }
    const { data, error } = await supabase.from('goals').insert({ ...g, user_id: user.id }).select().single();
    if (!error && data) setGoals(prev => [data, ...prev]);
  }

  const totalSaved  = goals.reduce((s, g) => s + g.current, 0);
  const completed   = goals.filter(g => g.current >= g.target).length;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      <ScrollView showsVerticalScrollIndicator={false}>
        <LinearGradient colors={['#06080f', '#0f172a', '#1a2444']} style={styles.hero}>
          <View style={styles.heroBar}>
            <View><Text style={styles.heroEye}>FinZee AI™</Text><Text style={styles.heroTitle}>Financial Goals</Text><Text style={styles.heroSub}>Your future, funded one goal at a time</Text></View>
            <FinZeeLogo variant="light" width={90} />
          </View>
          <View style={styles.summaryRow}>
            {[{ val: `$${(totalSaved / 1000).toFixed(1)}k`, lbl: 'Total Saved' }, { val: `${goals.length}`, lbl: 'Active Goals' }, { val: `${completed}`, lbl: 'Completed', color: '#34d399' }]
              .map(s => <View key={s.lbl} style={styles.summaryCard}><Text style={[styles.summaryVal, s.color ? { color: s.color } : {}]}>{s.val}</Text><Text style={styles.summaryLbl}>{s.lbl}</Text></View>)}
          </View>
        </LinearGradient>

        <View style={styles.body}>
          {loading
            ? <ActivityIndicator color={Colors.blue} style={{ marginTop: 40 }} />
            : goals.map(g => <GoalCard key={g.id} goal={g} onCelebrate={setCelebrated} />)
          }
          <TouchableOpacity style={styles.addWrap} onPress={() => setShowAdd(true)}>
            <LinearGradient colors={Gradients.blue} style={styles.addBtn}><Text style={styles.addBtnText}>+ Add New Goal</Text></LinearGradient>
          </TouchableOpacity>
          <View style={styles.nudge}>
            <Text style={styles.nudgeEmoji}>💡</Text>
            <Text style={styles.nudgeText}>FinZee AI is tracking your goals against your spending. Ask the AI Coach for a personalized savings plan.</Text>
          </View>
          <View style={{ height: 32 }} />
        </View>
      </ScrollView>
      <CelebrationModal goal={celebrated} onClose={() => setCelebrated(null)} />
      <AddGoalModal visible={showAdd} onClose={() => setShowAdd(false)} onAdd={addGoal} />
    </View>
  );
}

const styles = StyleSheet.create({
  root:         { flex: 1, backgroundColor: Colors.bg },
  hero:         { paddingTop: Platform.OS === 'ios' ? 56 : 36, paddingBottom: 24, paddingHorizontal: 20 },
  heroBar:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 },
  heroEye:      { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  heroTitle:    { fontSize: 24, fontWeight: '800', color: '#fff', letterSpacing: -1 },
  heroSub:      { fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 2 },
  summaryRow:   { flexDirection: 'row', gap: 8 },
  summaryCard:  { flex: 1, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: Radius.md, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  summaryVal:   { fontSize: 20, fontWeight: '800', color: '#fff', letterSpacing: -0.5 },
  summaryLbl:   { fontSize: 9, fontWeight: '700', color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 },
  body:         { padding: 16 },
  goalCard:     { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: 17, marginBottom: 10, borderWidth: 1, borderColor: Colors.border2 },
  goalTop:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  goalLeft:     { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  goalEmoji:    { width: 44, height: 44, borderRadius: 13, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  goalName:     { fontSize: 14, fontWeight: '800', color: Colors.ink, letterSpacing: -0.2 },
  goalSub:      { fontSize: 11, color: Colors.mute, marginTop: 2 },
  goalPct:      { fontSize: 15, fontWeight: '800' },
  goalBarBg:    { height: 5, backgroundColor: Colors.bg2, borderRadius: 3, overflow: 'hidden', marginBottom: 7 },
  goalBarFill:  { height: '100%', borderRadius: 3 },
  goalBot:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  goalBotLeft:  { fontSize: 11, color: Colors.mute },
  goalBotRight: { fontSize: 11, color: Colors.mute },
  celebrateBtn: { fontSize: 11, fontWeight: '700', color: Colors.green },
  addWrap:      { borderRadius: Radius.md, overflow: 'hidden', marginBottom: 12, ...Shadow.blue },
  addBtn:       { padding: 15, alignItems: 'center', borderRadius: Radius.md },
  addBtnText:   { fontSize: 15, fontWeight: '700', color: '#fff', letterSpacing: -0.2 },
  nudge:        { flexDirection: 'row', gap: 10, backgroundColor: Colors.blueTint, borderRadius: Radius.md, padding: 14, alignItems: 'flex-start' },
  nudgeEmoji:   { fontSize: 16 },
  nudgeText:    { fontSize: 12, color: Colors.blue, lineHeight: 17, flex: 1, fontWeight: '500' },
});
const cel = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(6,8,15,0.65)', justifyContent: 'flex-end' },
  sheet:   { backgroundColor: Colors.surface, borderRadius: 30, padding: 24, paddingBottom: 40, margin: 8 },
  pip:     { width: 40, height: 4, backgroundColor: Colors.bg2, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  emoji:   { fontSize: 52, textAlign: 'center', marginBottom: 8 },
  title:   { fontSize: 26, fontWeight: '800', color: Colors.ink, textAlign: 'center', letterSpacing: -1, marginBottom: 6 },
  desc:    { fontSize: 13, color: Colors.mute, textAlign: 'center', lineHeight: 19, marginBottom: 18 },
  box:     { backgroundColor: Colors.greenTint, borderRadius: 16, padding: 16, alignItems: 'center', marginBottom: 18 },
  amount:  { fontSize: 34, fontWeight: '800', color: Colors.green, letterSpacing: -1.5 },
  tag:     { fontSize: 12, color: '#065f46', fontWeight: '700', marginTop: 4 },
  ctaWrap: { borderRadius: Radius.md, overflow: 'hidden', ...Shadow.blue },
  cta:     { padding: 16, alignItems: 'center', borderRadius: Radius.md },
  ctaText: { fontSize: 15, fontWeight: '800', color: '#fff', letterSpacing: -0.3 },
});
const add = StyleSheet.create({
  overlay:    { flex: 1, backgroundColor: 'rgba(6,8,15,0.65)', justifyContent: 'flex-end' },
  sheet:      { backgroundColor: Colors.bg, borderRadius: 28, padding: 22, margin: 8, maxHeight: '90%' },
  pip:        { width: 40, height: 4, backgroundColor: Colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  title:      { fontSize: 20, fontWeight: '800', color: Colors.ink, letterSpacing: -0.5, marginBottom: 16 },
  label:      { fontSize: 11, fontWeight: '700', color: Colors.mute, textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 8 },
  emojiScroll:{ marginBottom: 16 },
  emojiBtn:   { width: 46, height: 46, borderRadius: 13, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center', marginRight: 8, borderWidth: 1.5, borderColor: Colors.border },
  emojiBtnSel:{ borderColor: Colors.blue, backgroundColor: Colors.blueTint },
  fieldWrap:  { marginBottom: 12 },
  fieldLabel: { fontSize: 11, fontWeight: '700', color: Colors.mute, textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 6 },
  input:      { backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.md, padding: 13, fontSize: 15, color: Colors.ink },
  ctaWrap:    { borderRadius: Radius.md, overflow: 'hidden', marginTop: 8, ...Shadow.blue },
  cta:        { padding: 15, alignItems: 'center', borderRadius: Radius.md },
  ctaText:    { fontSize: 15, fontWeight: '800', color: '#fff' },
});
