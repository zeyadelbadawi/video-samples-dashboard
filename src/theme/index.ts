import { useColorScheme } from 'react-native';

const light = {
  background: '#F2F3F7',
  card: '#FFFFFF',
  text: '#111418',
  muted: '#6B7280',
  border: '#E3E5EA',
  primary: '#1E5EFF',
  primaryText: '#FFFFFF',
  positive: '#0E9F6E', // ليك / دخل
  negative: '#E02424', // عليك / مصروف
  warning: '#B45309',
  chip: '#E8ECF5',
  inputBg: '#F6F7F9',
};

const dark: typeof light = {
  background: '#0B0D10',
  card: '#16191E',
  text: '#F3F4F6',
  muted: '#9CA3AF',
  border: '#262A31',
  primary: '#5B8CFF',
  primaryText: '#FFFFFF',
  positive: '#34D399',
  negative: '#F87171',
  warning: '#FBBF24',
  chip: '#232833',
  inputBg: '#1D2127',
};

export type Theme = typeof light;

export function useTheme(): Theme {
  return useColorScheme() === 'dark' ? dark : light;
}

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 };
export const radius = { sm: 8, md: 12, lg: 16 };
