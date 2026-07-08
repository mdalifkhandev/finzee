import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { usePurchaseIntervention } from '../../hooks/use-purchase-intervention';
import { PurchaseInterventionModal } from '../../components/PurchaseInterventionModal';
import { HealthConnectCard } from '../../components/HealthConnectCard';

const TAB_BAR_SPACING = Platform.OS === 'ios' ? 50 : 30;

export default function Dashboard() {
  const [interventionVisible, setInterventionVisible] = useState(false);
  const { stage, evaluation, evaluate, reset } = usePurchaseIntervention();

  const accounts = [
    { name: 'Checking ••4521', value: '$12,847.32', change: 'Available balance', positive: true },
    { name: 'Savings ••8834', value: '$28,450.00', change: '+$340 this month', positive: true },
    { name: 'Credit ••1002', value: '-$2,340.50', change: 'Due in 12 days', positive: false },
  ];

  const closeIntervention = () => {
    setInterventionVisible(false);
    reset();
  };

  const handleSimulatePurchase = () => {
    setInterventionVisible(true);
    evaluate(184.5, 'Shopping');
  };

  const handleProceed = () => {
    closeIntervention();
  };

  const handleWait = () => {
    closeIntervention();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.greeting}>Good Morning!</Text>
        <Text style={styles.subtitle}>Your FinZee Dashboard</Text>
      </View>

      {/* Net Worth Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Net Worth</Text>
        <Text style={styles.netWorthValue}>$38,956.82</Text>
        <Text style={styles.netWorthChange}>+$1,248.32 (+3.3%) this month</Text>
      </View>

      {/* Accounts */}
      <Text style={styles.sectionTitle}>Accounts</Text>
      {accounts.map((item, index) => (
        <View key={index} style={styles.accountRow}>
          <View style={styles.accountLeft}>
            <Ionicons
              name={item.positive ? 'wallet-outline' : 'card-outline'}
              size={24}
              color="#00E5FF"
            />
            <Text style={styles.accountName}>{item.name}</Text>
          </View>
          <View style={styles.accountRight}>
            <Text style={styles.accountValue}>{item.value}</Text>
            <Text
              style={[
                styles.accountChange,
                { color: item.positive ? '#00FF88' : '#FF4444' },
              ]}>
              {item.change}
            </Text>
          </View>
        </View>
      ))}

      {/* AI Coach Section */}
      <Text style={styles.sectionTitle}>FinZee AI Coach</Text>
      <Link href="/profile" asChild>
        <TouchableOpacity style={styles.insightCard}>
          <Ionicons name="bulb" size={28} color="#FFB800" />
          <View style={styles.insightText}>
            <Text style={styles.insightTitle}>You're $120 ahead of your savings goal</Text>
            <Text style={styles.insightSubtitle}>
              Keep it up — a little discipline this week pays off big later.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#8B949E" />
        </TouchableOpacity>
      </Link>

      {/* Wearables / Health */}
      <Text style={styles.sectionTitle}>Wearables</Text>
      <HealthConnectCard />

      {/* Smart Purchase Check */}
      <Text style={styles.sectionTitle}>Smart Purchase Check</Text>
      <View style={styles.purchaseCheckCard}>
        <Ionicons name="shield-checkmark-outline" size={28} color="#00E5FF" />
        <View style={styles.insightText}>
          <Text style={styles.insightTitle}>About to buy something?</Text>
          <Text style={styles.insightSubtitle}>
            FinZee AI walks through behavior, goal impact, and a personalized intervention before you decide.
          </Text>
        </View>
      </View>
      <TouchableOpacity style={styles.simulateBtn} onPress={handleSimulatePurchase}>
        <Text style={styles.simulateBtnText}>Try a Purchase Check</Text>
      </TouchableOpacity>

      {/* Quick Actions */}
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.quickActions}>
        <Link href="/profile" asChild>
          <TouchableOpacity style={styles.quickAction}>
            <Ionicons name="flag-outline" size={28} color="#00E5FF" />
            <Text style={styles.quickActionText}>Goals</Text>
          </TouchableOpacity>
        </Link>
        <Link href="/profile" asChild>
          <TouchableOpacity style={styles.quickAction}>
            <Ionicons name="pie-chart-outline" size={28} color="#FFB800" />
            <Text style={styles.quickActionText}>Budgets</Text>
          </TouchableOpacity>
        </Link>
        <Link href="/profile" asChild>
          <TouchableOpacity style={styles.quickAction}>
            <Ionicons name="settings" size={28} color="#8B949E" />
            <Text style={styles.quickActionText}>Settings</Text>
          </TouchableOpacity>
        </Link>
      </View>

      <PurchaseInterventionModal
        visible={interventionVisible}
        stage={stage}
        evaluation={evaluation}
        onProceed={handleProceed}
        onWait={handleWait}
        onClose={closeIntervention}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D1117',
  },
  content: {
    paddingBottom: TAB_BAR_SPACING,
  },
  header: {
    padding: 24,
    paddingTop: 60,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '700',
    color: '#F0F6FC',
  },
  subtitle: {
    fontSize: 16,
    color: '#8B949E',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#161B22',
    borderRadius: 16,
    padding: 24,
    marginHorizontal: 16,
    marginBottom: 24,
  },
  cardTitle: {
    fontSize: 14,
    color: '#8B949E',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  netWorthValue: {
    fontSize: 36,
    fontWeight: '700',
    color: '#F0F6FC',
    marginTop: 8,
  },
  netWorthChange: {
    fontSize: 16,
    color: '#00FF88',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F0F6FC',
    marginLeft: 16,
    marginTop: 8,
    marginBottom: 12,
  },
  accountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#161B22',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
  },
  accountLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  accountName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F0F6FC',
  },
  accountRight: {
    alignItems: 'flex-end',
  },
  accountValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F0F6FC',
  },
  accountChange: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 2,
  },
  insightCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161B22',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
  },
  purchaseCheckCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161B22',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
  },
  insightText: {
    flex: 1,
    marginLeft: 16,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F0F6FC',
  },
  insightSubtitle: {
    fontSize: 14,
    color: '#8B949E',
    marginTop: 4,
  },
  simulateBtn: {
    backgroundColor: '#00E5FF',
    borderRadius: 12,
    paddingVertical: 14,
    marginHorizontal: 16,
    marginBottom: 24,
    alignItems: 'center',
  },
  simulateBtnText: {
    color: '#0D1117',
    fontSize: 15,
    fontWeight: '700',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  quickAction: {
    alignItems: 'center',
    backgroundColor: '#161B22',
    padding: 16,
    borderRadius: 12,
    minWidth: 80,
  },
  quickActionText: {
    color: '#F0F6FC',
    fontSize: 12,
    marginTop: 8,
  },
});
