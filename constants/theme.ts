export const Colors = {
  ink:        '#06080f',
  ink2:       '#111827',
  ink3:       '#374151',
  mute:       '#6b7280',
  mute2:      '#9ca3af',
  mute3:      '#d1d5db',
  border:     'rgba(0,0,0,0.07)',
  border2:    'rgba(0,0,0,0.04)',
  surface:    '#ffffff',
  bg:         '#f7f8fc',
  bg2:        '#eef1f8',
  blue:       '#1a56db',
  blue2:      '#1e40af',
  blueTint:   '#eff4ff',
  green:      '#059669',
  greenTint:  '#ecfdf5',
  amber:      '#d97706',
  amberTint:  '#fffbeb',
  red:        '#dc2626',
  redTint:    '#fff1f1',
  purple:     '#7c3aed',
  purpleTint: '#f5f3ff',
  dark:       '#06080f',
  dark2:      '#0d1226',
  dark3:      '#1a2444',
};

export const Gradients = {
  blue:    ['#1a56db', '#4f46e5'] as const,
  green:   ['#059669', '#0d9488'] as const,
  dark:    ['#0f172a', '#1e3a5f', '#1a56db'] as const,
  purple:  ['#0f172a', '#1e1b4b', '#4c1d95'] as const,
  score:   ['#34d399', '#60a5fa'] as const,
  wellness:['#f59e0b', '#fbbf24'] as const,
};

export const Typography = {
  h1: { fontSize: 32, fontWeight: '800' as const, letterSpacing: -1.5 },
  h2: { fontSize: 24, fontWeight: '800' as const, letterSpacing: -1 },
  h3: { fontSize: 20, fontWeight: '800' as const, letterSpacing: -0.5 },
  h4: { fontSize: 17, fontWeight: '700' as const, letterSpacing: -0.3 },
  h5: { fontSize: 15, fontWeight: '700' as const, letterSpacing: -0.2 },
  body: { fontSize: 14, fontWeight: '400' as const, lineHeight: 22 },
  bodyMd: { fontSize: 13, fontWeight: '400' as const, lineHeight: 20 },
  bodySm: { fontSize: 12, fontWeight: '400' as const, lineHeight: 18 },
  label: { fontSize: 10, fontWeight: '700' as const, letterSpacing: 0.8, textTransform: 'uppercase' as const },
  caption: { fontSize: 11, fontWeight: '500' as const },
};

export const Spacing = {
  xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32,
};

export const Radius = {
  sm: 10, md: 14, lg: 20, xl: 26, full: 999,
};

export const Shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.12,
    shadowRadius: 48,
    elevation: 8,
  },
  blue: {
    shadowColor: '#1a56db',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 6,
  },
};
