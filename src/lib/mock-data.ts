// Mock data for FinZee AI demo

export const currentUser = {
  id: "1",
  name: "Jason Rivera",
  email: "jason@example.com",
  avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
  tier: "pro" as const,
  region: "US",
  createdAt: "2024-01-15",
};

export const demoUsers = [
  currentUser,
  {
    id: "2",
    name: "Maya Brooks",
    email: "maya@example.com",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face",
    tier: "free" as const,
    region: "US",
    createdAt: "2024-02-20",
  },
];

export const accounts = [
  {
    id: "acc_1",
    userId: "1",
    provider: "Chase",
    name: "Checking ••4521",
    mask: "4521",
    balance: 12847.32,
    status: "active" as const,
    type: "checking" as const,
  },
  {
    id: "acc_2",
    userId: "1",
    provider: "Chase",
    name: "Savings ••8834",
    mask: "8834",
    balance: 28450.00,
    status: "active" as const,
    type: "savings" as const,
  },
  {
    id: "acc_3",
    userId: "1",
    provider: "Amex",
    name: "Platinum ••1002",
    mask: "1002",
    balance: -2340.50,
    status: "active" as const,
    type: "credit" as const,
  },
];

export const transactions = [
  {
    id: "tx_1",
    accountId: "acc_1",
    amount: -142.50,
    currency: "USD",
    timestamp: "2024-11-28T14:30:00Z",
    merchant: "Whole Foods Market",
    logo: "🥬",
    mcc: "5411",
    categories: ["Groceries", "Food"],
    status: "posted" as const,
  },
  {
    id: "tx_2",
    accountId: "acc_1",
    amount: -65.00,
    currency: "USD",
    timestamp: "2024-11-28T09:15:00Z",
    merchant: "Shell Gas Station",
    logo: "⛽",
    mcc: "5541",
    categories: ["Gas", "Transportation"],
    status: "posted" as const,
  },
  {
    id: "tx_3",
    accountId: "acc_3",
    amount: -89.99,
    currency: "USD",
    timestamp: "2024-11-27T20:00:00Z",
    merchant: "Netflix",
    logo: "🎬",
    mcc: "4899",
    categories: ["Entertainment", "Subscription"],
    status: "posted" as const,
  },
  {
    id: "tx_4",
    accountId: "acc_1",
    amount: 3250.00,
    currency: "USD",
    timestamp: "2024-11-25T08:00:00Z",
    merchant: "Employer Direct Deposit",
    logo: "💼",
    mcc: "0000",
    categories: ["Income", "Salary"],
    status: "posted" as const,
  },
  {
    id: "tx_5",
    accountId: "acc_3",
    amount: -234.00,
    currency: "USD",
    timestamp: "2024-11-24T19:30:00Z",
    merchant: "Amazon",
    logo: "📦",
    mcc: "5999",
    categories: ["Shopping", "Online"],
    status: "posted" as const,
  },
  {
    id: "tx_6",
    accountId: "acc_1",
    amount: -48.75,
    currency: "USD",
    timestamp: "2024-11-23T12:45:00Z",
    merchant: "Uber Eats",
    logo: "🍔",
    mcc: "5812",
    categories: ["Food", "Delivery"],
    status: "posted" as const,
  },
  {
    id: "tx_7",
    accountId: "acc_1",
    amount: -1850.00,
    currency: "USD",
    timestamp: "2024-11-22T10:00:00Z",
    merchant: "Rent Payment",
    logo: "🏠",
    mcc: "6513",
    categories: ["Housing", "Rent"],
    status: "posted" as const,
  },
  {
    id: "tx_8",
    accountId: "acc_3",
    amount: -156.00,
    currency: "USD",
    timestamp: "2024-11-21T16:20:00Z",
    merchant: "Con Edison",
    logo: "💡",
    mcc: "4900",
    categories: ["Utilities", "Electric"],
    status: "posted" as const,
  },
  {
    id: "tx_9",
    accountId: "acc_1",
    amount: -32.00,
    currency: "USD",
    timestamp: "2024-11-20T08:30:00Z",
    merchant: "Spotify",
    logo: "🎵",
    mcc: "4899",
    categories: ["Entertainment", "Subscription"],
    status: "posted" as const,
  },
  {
    id: "tx_10",
    accountId: "acc_2",
    amount: 500.00,
    currency: "USD",
    timestamp: "2024-11-20T00:00:00Z",
    merchant: "Transfer from Checking",
    logo: "💰",
    mcc: "0000",
    categories: ["Transfer", "Savings"],
    status: "posted" as const,
  },
];

export const budgets = [
  {
    id: "bud_1",
    userId: "1",
    month: "2024-11",
    category: "Groceries",
    icon: "🥬",
    limitAmount: 600,
    spentAmount: 428.50,
  },
  {
    id: "bud_2",
    userId: "1",
    month: "2024-11",
    category: "Dining",
    icon: "🍽️",
    limitAmount: 400,
    spentAmount: 312.75,
  },
  {
    id: "bud_3",
    userId: "1",
    month: "2024-11",
    category: "Transportation",
    icon: "🚗",
    limitAmount: 300,
    spentAmount: 245.00,
  },
  {
    id: "bud_4",
    userId: "1",
    month: "2024-11",
    category: "Entertainment",
    icon: "🎬",
    limitAmount: 200,
    spentAmount: 189.99,
  },
  {
    id: "bud_5",
    userId: "1",
    month: "2024-11",
    category: "Shopping",
    icon: "🛍️",
    limitAmount: 500,
    spentAmount: 234.00,
  },
];

export const goals = [
  {
    id: "goal_1",
    userId: "1",
    name: "Emergency Fund",
    kind: "savings" as const,
    icon: "🛡️",
    targetAmount: 10000,
    currentAmount: 6250,
    dueDate: "2025-06-01",
    status: "active" as const,
  },
  {
    id: "goal_2",
    userId: "1",
    name: "Vacation to Japan",
    kind: "savings" as const,
    icon: "✈️",
    targetAmount: 5000,
    currentAmount: 2100,
    dueDate: "2025-09-01",
    status: "active" as const,
  },
  {
    id: "goal_3",
    userId: "1",
    name: "New MacBook",
    kind: "savings" as const,
    icon: "💻",
    targetAmount: 2500,
    currentAmount: 800,
    dueDate: "2025-03-01",
    status: "active" as const,
  },
];

export const insights = [
  {
    id: "ins_1",
    userId: "1",
    topic: "Subscription Audit",
    severity: "medium" as const,
    icon: "🔔",
    title: "You have 6 active subscriptions",
    description: "You're spending $189/month on subscriptions. Consider reviewing Netflix, Spotify, and 4 others to see if you're still using them all.",
    costEstimate: 45,
    actionLabel: "Review Subscriptions",
    createdAt: "2024-11-28T10:00:00Z",
  },
  {
    id: "ins_2",
    userId: "1",
    topic: "Dining Trend",
    severity: "high" as const,
    icon: "🍽️",
    title: "Dining spending up 34% this month",
    description: "You've spent $312 on dining out this month, which is above your typical pattern. Consider cooking more at home to save.",
    costEstimate: 120,
    actionLabel: "See Dining Transactions",
    createdAt: "2024-11-27T14:00:00Z",
  },
  {
    id: "ins_3",
    userId: "1",
    topic: "Savings Opportunity",
    severity: "low" as const,
    icon: "💡",
    title: "Great job on grocery spending!",
    description: "You're under budget on groceries this month. Keep it up! You could put the extra $171 towards your Emergency Fund goal.",
    costEstimate: -171,
    actionLabel: "Boost Savings",
    createdAt: "2024-11-26T09:00:00Z",
  },
  {
    id: "ins_4",
    userId: "1",
    topic: "Bill Reminder",
    severity: "medium" as const,
    icon: "📅",
    title: "Rent due in 3 days",
    description: "Your rent payment of $1,850 is coming up on December 1st. Make sure you have enough in your checking account.",
    costEstimate: 0,
    actionLabel: "View Account",
    createdAt: "2024-11-28T08:00:00Z",
  },
];

export const chatMessages = [
  {
    id: "msg_1",
    role: "assistant" as const,
    content: "Hey Jason! 👋 I'm FinzeeAI, your personal finance coach. I've been analyzing your recent spending and have a few suggestions. Want to hear them?",
    timestamp: "2024-11-28T10:00:00Z",
  },
  {
    id: "msg_2",
    role: "user" as const,
    content: "Sure, what do you see?",
    timestamp: "2024-11-28T10:01:00Z",
  },
  {
    id: "msg_3",
    role: "assistant" as const,
    content: "I noticed your dining spending is up 34% compared to last month. You've got a budget of $400 for dining but you're already at $312 with 2 days left. \n\nI also found 2 subscriptions you haven't used in 30+ days: a gym membership ($49/mo) and a news subscription ($15/mo). Want me to help you review these?",
    timestamp: "2024-11-28T10:02:00Z",
  },
];

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
};

export const formatCompactCurrency = (amount: number) => {
  const absAmount = Math.abs(amount);
  const sign = amount < 0 ? "-" : "";
  
  if (absAmount >= 1_000_000) {
    return `${sign}$${(absAmount / 1_000_000).toFixed(1)}M`;
  }
  if (absAmount >= 10_000) {
    return `${sign}$${(absAmount / 1_000).toFixed(1)}K`;
  }
  if (absAmount >= 1_000) {
    return `${sign}$${(absAmount / 1_000).toFixed(2)}K`;
  }
  return formatCurrency(amount);
};

export const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
};

export const formatDateTime = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};
