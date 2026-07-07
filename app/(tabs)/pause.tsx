// FinZee AI™ — 24-Hour Pause List Screen
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, StatusBar, Animated, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Colors, Shadow, Radius } from '../../constants/theme';
import FinZeeLogo from '../../components/FinZeeLogo';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../services/supabaseClient';
import { CONFIG } from '../../constants/config';
import type { PauseListItem } from '../../types';

const DEV_ITEMS: PauseListItem[] = [
  { id: 'p1', userId: 'dev', itemName: 'Designer Handbag', price: 890, category: 'Shopping · Luxury', sourceUrl: '', reason: 'Wanted this for months — bought it after a really stressful week.', createdAt: new Date(Date.now() - 5 * 3600000).toISOString(), reminderDueAt: new Date(Date.now() + 19 * 3600000).toISOString(), status: 'pending' },
  { id: 'p2', userId: 'dev', itemName: 'Standing Desk', price: 449, category: 'Home Office · Productivity', sourceUrl: '', reason: 'My back really hurts — this feels necessary right now.', createdAt: new Date(Date.now() - 17 * 3600000).toISOString(), reminderDueAt: new Date(Date.now() + 7 * 3600000).toISOString(), status: 'pending' },
];

function useCountdown(targetDate: string) {
  const [remaining, setRemaining] = useState('');
  const [expired, setExpired]     = useState(false);
  useEffect(() => {
    function calc() {
      const diff = new Date(targetDate).getTime() - Date.now();
      if (diff <= 0) { setExpired(true); setRemaining('Expired'); return; }
      const h = Math.floor(diff / 3600000), m = Math.floor((diff % 3600000) / 60000);
      setRemaining(`${h}h ${m}m remaining`);
    }
    calc();
    const id = setInterval(calc, 30000);
    return () => clearInterval(id);
  }, [targetDate]);
  return { remaining, expired };
}

function PauseCard({ item, onBuy, onSkip }: { item: PauseListItem; onBuy: (id: string) => void; onSkip: (id: string) => void }) {
  const { remaining, expired } = useCountdown(item.reminderDueAt);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const timerColor = expired ? Colors.green : Colors.amber;
  const pctThrough = Math.min((Date.now() - new Date(item.createdAt).getTime()) / (new Date(item.reminderDueAt).getTime() - new Date(item.createdAt).getTime()), 1);

  function press() {
    Animated.sequence([Animated.timing(scaleAnim, { toValue: 0.97, duration: 80, useNativeDriver: true }), Animated.timing(scaleAnim, { toValue: 1, duration: 80, useNativeDriver: true })]).start();
  }

  return (
    <Animated.View style={[styles.pauseCard, Shadow.sm, { transform: [{ scale: scaleAnim }] }]}>
      <View style={styles.cardTop}>
        <View style={{ flex: 1 }}><Text style={styles.itemName}>{item.itemName}</Text><Text style={styles.itemCat}>{item.category}</Text></View>
        <Text style={styles.itemPrice}>${item.price.toLocaleString()}</Text>
      </View>
      <View style={styles.reasonWrap}>
        <Text style={styles.reasonQuote}>"</Text>
        <Text style={styles.reasonText}>{item.reason}</Text>
        <Text style={styles.reasonQuote}>"</Text>
      </View>
      <View style={styles.countdownWrap}>
        <View style={styles.countdownBar}><View style={[styles.countdownFill, { width: `${pctThrough * 100}%`, backgroundColor: expired ? Colors.green : Colors.amber }]} /></View>
        <View style={styles.countdownRow}>
          <Text style={[styles.countdownText, { color: timerColor }]}>⏱ {expired ? '24hrs complete — ready to decide' : remaining}</Text>
          <Text style={styles.savedText}>{expired ? '✓ Paused' : `${Math.round(pctThrough * 100)}% through`}</Text>
        </View>
      </View>
      {expired && <View style={styles.nudgeBanner}><Text style={styles.nudgeIcon}>🧠</Text><Text style={styles.nudgeMsg}>24 hours have passed. Do you still want this? Many impulse purchases feel less urgent after a pause.</Text></View>}
      <View style={styles.actionsRow}>
        <TouchableOpacity style={[styles.actionBtn, styles.skipBtn]} onPress={() => { press(); onSkip(item.id); }}><Text style={styles.skipBtnText}>Skip It ✕</Text></TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, styles.buyBtn]} onPress={() => { press(); onBuy(item.id); }}><Text style={styles.buyBtnText}>Buy It →</Text></TouchableOpacity>
      </View>
    </Animated.View>
  );
}

export default function PauseScreen() {
  const { user } = useAuth();
  const [items, setItems] = useState<PauseListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const totalHeld = items.reduce((s, i) => s + i.price, 0);

  useEffect(() => { loadItems(); }, [user]);

  async function loadItems() {
    if (CONFIG.DEV_MODE || !user) { setItems(DEV_ITEMS); setLoading(false); return; }
    try {
      const { data, error } = await supabase.from('pause_list_items').select('*').eq('user_id', user.id).eq('status', 'pending').order('created_at', { ascending: false });
      if (error) throw error;
      setItems((data ?? []).map((d: any) => ({ id: d.id, userId: d.user_id, itemName: d.item_name, price: d.price, category: d.category, sourceUrl: d.source_url, reason: d.reason, createdAt: d.created_at, reminderDueAt: d.reminder_due_at, status: d.status })));
    } catch (e) { console.warn('[Pause] load error:', e); setItems(DEV_ITEMS); } finally { setLoading(false); }
  }

  async function updateStatus(id: string, status: 'bought' | 'skipped') {
    setItems(prev => prev.filter(i => i.id !== id));
    if (!CONFIG.DEV_MODE && user) await supabase.from('pause_list_items').update({ status }).eq('id', id);
    Alert.alert(status === 'skipped' ? 'Skipped!' : 'Purchased!', status === 'skipped' ? '💪 Smart move! That money stays in your pocket.' : '🛍 Purchase logged. FinZee will track this spending.');
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      <ScrollView showsVerticalScrollIndicator={false}>
        <LinearGradient colors={['#064e3b', '#065f46', '#059669']} style={styles.hero}>
          <View style={styles.heroBar}>
            <View><Text style={styles.heroEye}>FinZee AI™</Text><Text style={styles.heroTitle}>Pause List ⏸</Text><Text style={styles.heroSub}>Think before you spend</Text></View>
            <FinZeeLogo variant="light" width={90} />
          </View>
          <View style={styles.statsRow}>
            {[{ val: `${items.length}`, lbl: 'Paused' }, { val: `$${totalHeld.toLocaleString()}`, lbl: 'Currently Held' }, { val: '$0', lbl: 'Saved So Far', color: '#34d399' }]
              .map(s => <View key={s.lbl} style={styles.statCard}><Text style={[styles.statVal, s.color ? { color: s.color } : {}]}>{s.val}</Text><Text style={styles.statLbl}>{s.lbl}</Text></View>)}
          </View>
        </LinearGradient>

        <View style={styles.body}>
          <View style={styles.howItWorks}>
            <Text style={styles.howTitle}>How the Pause List works</Text>
            {[{ step: '1', text: 'Add any purchase you\'re unsure about' }, { step: '2', text: 'FinZee AI holds it for 24 hours' }, { step: '3', text: 'After 24 hours, decide with a clear head' }]
              .map(s => <View key={s.step} style={styles.howRow}><View style={styles.howStep}><Text style={styles.howStepText}>{s.step}</Text></View><Text style={styles.howText}>{s.text}</Text></View>)}
          </View>

          {items.length === 0
            ? <View style={styles.emptyState}><Text style={styles.emptyEmoji}>🎉</Text><Text style={styles.emptyTitle}>Nothing paused</Text><Text style={styles.emptySub}>When you're unsure about a purchase, add it here for a 24-hour reflection period.</Text></View>
            : items.map(item => <PauseCard key={item.id} item={item} onBuy={id => updateStatus(id, 'bought')} onSkip={id => updateStatus(id, 'skipped')} />)
          }

          <TouchableOpacity style={styles.addWrap} onPress={() => router.push('/purchase-check')}>
            <LinearGradient colors={['#059669', '#0d9488']} style={styles.addBtn}><Text style={styles.addBtnText}>+ Add Item to Pause List</Text></LinearGradient>
          </TouchableOpacity>
          <View style={styles.aiNote}><Text style={styles.aiNoteEmoji}>🧠</Text><Text style={styles.aiNoteText}>Research shows a 24-hour pause reduces impulse purchases by up to 70%. FinZee is helping you build that habit.</Text></View>
          <View style={{ height: 32 }} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:          { flex: 1, backgroundColor: Colors.bg },
  hero:          { paddingTop: Platform.OS === 'ios' ? 56 : 36, paddingBottom: 24, paddingHorizontal: 20 },
  heroBar:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 },
  heroEye:       { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  heroTitle:     { fontSize: 24, fontWeight: '800', color: '#fff', letterSpacing: -1 },
  heroSub:       { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  statsRow:      { flexDirection: 'row', gap: 8 },
  statCard:      { flex: 1, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: Radius.md, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  statVal:       { fontSize: 18, fontWeight: '800', color: '#fff', letterSpacing: -0.5 },
  statLbl:       { fontSize: 9, fontWeight: '700', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 },
  body:          { padding: 16 },
  howItWorks:    { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: Colors.border2, ...Shadow.sm },
  howTitle:      { fontSize: 13, fontWeight: '800', color: Colors.ink, marginBottom: 12, letterSpacing: -0.2 },
  howRow:        { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  howStep:       { width: 26, height: 26, borderRadius: 13, backgroundColor: Colors.green, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  howStepText:   { fontSize: 12, fontWeight: '800', color: '#fff' },
  howText:       { fontSize: 13, color: Colors.ink3, flex: 1 },
  pauseCard:     { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: 17, marginBottom: 10, borderWidth: 1, borderColor: Colors.border2 },
  cardTop:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 5 },
  itemName:      { fontSize: 16, fontWeight: '800', color: Colors.ink, letterSpacing: -0.4 },
  itemCat:       { fontSize: 10, fontWeight: '700', color: Colors.mute, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 },
  itemPrice:     { fontSize: 18, fontWeight: '800', color: Colors.blue, letterSpacing: -0.5 },
  reasonWrap:    { flexDirection: 'row', gap: 4, backgroundColor: Colors.bg, borderRadius: 10, padding: 11, marginVertical: 10 },
  reasonQuote:   { fontSize: 16, color: Colors.mute3, lineHeight: 18 },
  reasonText:    { fontSize: 12, color: Colors.ink3, lineHeight: 17, flex: 1, fontStyle: 'italic' },
  countdownWrap: { marginBottom: 10 },
  countdownBar:  { height: 4, backgroundColor: Colors.bg2, borderRadius: 2, overflow: 'hidden', marginBottom: 6 },
  countdownFill: { height: '100%', borderRadius: 2 },
  countdownRow:  { flexDirection: 'row', justifyContent: 'space-between' },
  countdownText: { fontSize: 11, fontWeight: '700' },
  savedText:     { fontSize: 11, color: Colors.mute, fontWeight: '600' },
  nudgeBanner:   { flexDirection: 'row', gap: 8, backgroundColor: Colors.greenTint, borderRadius: 10, padding: 11, marginBottom: 10, alignItems: 'flex-start' },
  nudgeIcon:     { fontSize: 15 },
  nudgeMsg:      { fontSize: 12, color: '#065f46', flex: 1, lineHeight: 17, fontWeight: '500' },
  actionsRow:    { flexDirection: 'row', gap: 8 },
  actionBtn:     { flex: 1, padding: 12, borderRadius: Radius.md, alignItems: 'center' },
  skipBtn:       { backgroundColor: Colors.redTint },
  skipBtnText:   { fontSize: 13, fontWeight: '700', color: '#991b1b' },
  buyBtn:        { backgroundColor: Colors.greenTint },
  buyBtnText:    { fontSize: 13, fontWeight: '700', color: '#065f46' },
  emptyState:    { alignItems: 'center', paddingVertical: 40 },
  emptyEmoji:    { fontSize: 48, marginBottom: 12 },
  emptyTitle:    { fontSize: 18, fontWeight: '800', color: Colors.ink, marginBottom: 6 },
  emptySub:      { fontSize: 13, color: Colors.mute, textAlign: 'center', lineHeight: 18, paddingHorizontal: 24 },
  addWrap:       { borderRadius: Radius.md, overflow: 'hidden', marginBottom: 12, ...Shadow.sm },
  addBtn:        { padding: 15, alignItems: 'center', borderRadius: Radius.md },
  addBtnText:    { fontSize: 15, fontWeight: '700', color: '#fff', letterSpacing: -0.2 },
  aiNote:        { flexDirection: 'row', gap: 10, backgroundColor: Colors.purpleTint, borderRadius: Radius.md, padding: 14, alignItems: 'flex-start' },
  aiNoteEmoji:   { fontSize: 16 },
  aiNoteText:    { fontSize: 12, color: Colors.purple, lineHeight: 17, flex: 1, fontWeight: '500' },
});
