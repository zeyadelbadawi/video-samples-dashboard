import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { formatMoney } from '@/lib/money';
import { radius, space, useTheme } from '@/theme';

/** Scrollable page with a large title, used by tab screens (which have no native header). */
export function Screen({
  title,
  right,
  children,
  scroll = true,
  footer,
}: {
  /** A string renders as a large title; pass an element (e.g. the logo) for a custom header. */
  title?: ReactNode;
  right?: ReactNode;
  children: ReactNode;
  scroll?: boolean;
  footer?: ReactNode;
}) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const header = title ? (
    <View style={styles.header}>
      {typeof title === 'string' ? <Text style={[styles.title, { color: t.text }]}>{title}</Text> : title}
      {right}
    </View>
  ) : null;
  return (
    <View style={{ flex: 1, backgroundColor: t.background, paddingTop: title ? insets.top : 0 }}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={{ padding: space.lg, paddingBottom: 120, gap: space.md }}
          keyboardShouldPersistTaps="handled">
          {header}
          {children}
        </ScrollView>
      ) : (
        <View style={{ flex: 1, paddingHorizontal: space.lg, gap: space.md }}>
          {header}
          {children}
        </View>
      )}
      {footer}
    </View>
  );
}

export function Card({ children, style, onPress }: { children: ReactNode; style?: ViewStyle; onPress?: () => void }) {
  const t = useTheme();
  const base = [styles.card, { backgroundColor: t.card, borderColor: t.border }, style];
  if (!onPress) return <View style={base}>{children}</View>;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [base, pressed && { opacity: 0.7 }]}>
      {children}
    </Pressable>
  );
}

export function T({
  children,
  muted,
  size = 16,
  weight,
  color,
  style,
  numberOfLines,
}: {
  children: ReactNode;
  muted?: boolean;
  size?: number;
  weight?: TextStyle['fontWeight'];
  color?: string;
  style?: TextStyle;
  numberOfLines?: number;
}) {
  const th = useTheme();
  return (
    <Text
      numberOfLines={numberOfLines}
      style={[{ color: color ?? (muted ? th.muted : th.text), fontSize: size, fontWeight: weight }, style]}>
      {children}
    </Text>
  );
}

export function SectionTitle({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <View style={[styles.rowBetween, { marginTop: space.sm }]}>
      <T size={14} muted weight="600">
        {children}
      </T>
      {right}
    </View>
  );
}

export function Row({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return <View style={[styles.rowBetween, style]}>{children}</View>;
}

export function Divider() {
  const t = useTheme();
  return <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: t.border, marginVertical: space.xs }} />;
}

/**
 * Money with meaning: for contact balances positive = ليك (green), negative = عليك (red).
 * The sign is shown as words/color, not a minus, so it reads correctly in RTL.
 */
export function Money({
  value,
  size = 16,
  weight = '600',
  tone = 'auto',
}: {
  value: number;
  size?: number;
  weight?: TextStyle['fontWeight'];
  tone?: 'auto' | 'neutral' | 'positive' | 'negative';
}) {
  const t = useTheme();
  const color =
    tone === 'neutral'
      ? t.text
      : tone === 'positive'
        ? t.positive
        : tone === 'negative'
          ? t.negative
          : value > 0
            ? t.positive
            : value < 0
              ? t.negative
              : t.text;
  return (
    <Text style={{ color, fontSize: size, fontWeight: weight, fontVariant: ['tabular-nums'] }}>
      {formatMoney(Math.abs(value))}
    </Text>
  );
}

export function BalanceLabel({ value, size = 13 }: { value: number; size?: number }) {
  const t = useTheme();
  if (value === 0) return <T size={size} muted>متسوّي</T>;
  return (
    <T size={size} color={value > 0 ? t.positive : t.negative}>
      {value > 0 ? 'ليك عنده' : 'عليك له'}
    </T>
  );
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled,
  loading,
  style,
}: {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
}) {
  const t = useTheme();
  const bg = { primary: t.primary, secondary: t.chip, danger: t.negative, ghost: 'transparent' }[variant];
  const fg = { primary: t.primaryText, secondary: t.text, danger: '#fff', ghost: t.primary }[variant];
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: bg, opacity: disabled ? 0.5 : pressed ? 0.8 : 1 },
        style,
      ]}>
      {loading ? <ActivityIndicator color={fg} /> : <Text style={{ color: fg, fontSize: 16, fontWeight: '600' }}>{title}</Text>}
    </Pressable>
  );
}

export function Field({ label, hint, ...props }: TextInputProps & { label: string; hint?: string }) {
  const t = useTheme();
  return (
    <View style={{ gap: space.xs }}>
      <T size={14} muted weight="500">
        {label}
      </T>
      <TextInput
        placeholderTextColor={t.muted}
        {...props}
        style={[
          styles.input,
          { backgroundColor: t.inputBg, color: t.text, borderColor: t.border },
          props.multiline && { minHeight: 80, textAlignVertical: 'top' },
          props.style,
        ]}
      />
      {hint ? (
        <T size={12} muted>
          {hint}
        </T>
      ) : null}
    </View>
  );
}

export function SearchBox(props: TextInputProps) {
  const t = useTheme();
  return (
    <TextInput
      placeholderTextColor={t.muted}
      clearButtonMode="while-editing"
      autoCorrect={false}
      returnKeyType="search"
      {...props}
      style={[styles.input, { backgroundColor: t.card, color: t.text, borderColor: t.border }, props.style]}
    />
  );
}

export function Chips<V extends string | number>({
  options,
  value,
  onChange,
  wrap = true,
}: {
  options: { value: V; label: string }[];
  value: V | null | undefined;
  onChange: (v: V) => void;
  wrap?: boolean;
}) {
  const t = useTheme();
  const content = options.map((o) => {
    const active = o.value === value;
    return (
      <Pressable
        key={String(o.value)}
        onPress={() => onChange(o.value)}
        style={[styles.chip, { backgroundColor: active ? t.primary : t.chip }]}>
        <Text style={{ color: active ? t.primaryText : t.text, fontSize: 14, fontWeight: active ? '600' : '400' }}>
          {o.label}
        </Text>
      </Pressable>
    );
  });
  if (wrap) return <View style={styles.chipsWrap}>{content}</View>;
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.sm }}>
      {content}
    </ScrollView>
  );
}

export function Empty({ text, action }: { text: string; action?: { title: string; onPress: () => void } }) {
  return (
    <View style={{ alignItems: 'center', paddingVertical: space.xl, gap: space.md }}>
      <T muted>{text}</T>
      {action ? <Button title={action.title} variant="secondary" onPress={action.onPress} /> : null}
    </View>
  );
}

export function Loading() {
  const t = useTheme();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: t.background }}>
      <ActivityIndicator />
    </View>
  );
}

/** Floating "+" button that opens the new-transaction form. */
export function AddTxButton({ params }: { params?: Record<string, string> }) {
  const t = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  return (
    <Pressable
      accessibilityLabel="إضافة حركة"
      onPress={() => router.push({ pathname: '/transaction/edit', params })}
      style={({ pressed }) => [
        styles.fab,
        { backgroundColor: t.primary, bottom: insets.bottom + 72, opacity: pressed ? 0.85 : 1 },
      ]}>
      <Text style={{ color: '#fff', fontSize: 30, lineHeight: 32, fontWeight: '400' }}>+</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: space.sm, paddingBottom: space.xs },
  title: { fontSize: 32, fontWeight: '800' },
  card: { borderRadius: radius.lg, padding: space.lg, gap: space.sm, borderWidth: StyleSheet.hairlineWidth },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.sm },
  button: { height: 50, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', paddingHorizontal: space.lg },
  input: { borderWidth: StyleSheet.hairlineWidth, borderRadius: radius.md, paddingHorizontal: space.md, paddingVertical: 12, fontSize: 16 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999 },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  fab: {
    position: 'absolute',
    end: space.lg,
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
});
