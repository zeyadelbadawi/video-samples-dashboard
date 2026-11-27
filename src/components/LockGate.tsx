import * as SplashScreen from 'expo-splash-screen';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Alert, AppState, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  biometricsAvailable,
  hasPin,
  isBiometricsEnabled,
  setBiometricsEnabled,
  setPin,
  unlockWithBiometrics,
  verifyDeviceOwner,
  verifyPin,
} from '@/lib/auth';
import { radius, space, useTheme } from '@/theme';

import { Loading } from './ui';

type State = 'loading' | 'setup' | 'confirm' | 'locked' | 'unlocked';

const PIN_LENGTH = 6;
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 30_000;
const clock = () => Date.now();

/**
 * Wraps the whole app. Asks for the PIN (or Face ID) on launch and every time the app
 * comes back from the background, and hides content in the app switcher.
 */
export function LockGate({ children }: { children: ReactNode }) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const [state, setState] = useState<State>('loading');
  const [entry, setEntry] = useState('');
  const [firstPin, setFirstPin] = useState('');
  const [error, setError] = useState('');
  const [bio, setBio] = useState(false);
  const [covered, setCovered] = useState(false);
  const [everUnlocked, setEverUnlocked] = useState(false);
  const attempts = useRef(0);
  const lockedUntil = useRef(0);
  const prompting = useRef(false);

  const unlock = useCallback(() => {
    setState('unlocked');
    setEverUnlocked(true);
  }, []);

  const tryBiometrics = useCallback(async () => {
    if (prompting.current) return;
    prompting.current = true;
    try {
      if (await unlockWithBiometrics()) {
        unlock();
        setEntry('');
        setError('');
      }
    } finally {
      prompting.current = false;
    }
  }, [unlock]);

  // Initial state
  useEffect(() => {
    (async () => {
      if (!(await hasPin())) return setState('setup');
      const enabled = (await isBiometricsEnabled()) && (await biometricsAvailable());
      setBio(enabled);
      setState('locked');
      if (enabled) tryBiometrics();
    })();
  }, [tryBiometrics]);

  // Re-lock when the app goes to the background; cover content in the app switcher.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => {
      if (prompting.current) return; // Face ID prompt itself makes the app "inactive"
      if (s === 'inactive') setCovered(true);
      if (s === 'background') {
        setCovered(true);
        setState((cur) => (cur === 'unlocked' ? 'locked' : cur));
        setEntry('');
      }
      if (s === 'active') {
        setCovered(false);
        setState((cur) => {
          if (cur === 'locked' && bio) setTimeout(tryBiometrics, 300);
          return cur;
        });
      }
    });
    return () => sub.remove();
  }, [bio, tryBiometrics]);

  const onDigit = async (d: string) => {
    setError('');
    if (clock() < lockedUntil.current) {
      setError('استنى شوية وحاول تاني');
      return;
    }
    const next = (entry + d).slice(0, PIN_LENGTH);
    setEntry(next);
    if (next.length < PIN_LENGTH) return;

    if (state === 'setup') {
      setFirstPin(next);
      setEntry('');
      setState('confirm');
      return;
    }
    if (state === 'confirm') {
      if (next !== firstPin) {
        setEntry('');
        setFirstPin('');
        setState('setup');
        setError('الرقمين مش زي بعض، ابدأ تاني');
        return;
      }
      await setPin(next);
      setEntry('');
      if (await biometricsAvailable()) {
        Alert.alert('Face ID', 'عايز تفتح الأبلكيشن بـ Face ID؟', [
          { text: 'لأ', style: 'cancel', onPress: () => unlock() },
          {
            text: 'آه',
            onPress: async () => {
              await setBiometricsEnabled(true);
              setBio(true);
              unlock();
            },
          },
        ]);
      } else {
        unlock();
      }
      return;
    }
    // locked
    if (await verifyPin(next)) {
      attempts.current = 0;
      setEntry('');
      unlock();
    } else {
      attempts.current += 1;
      setEntry('');
      if (attempts.current >= MAX_ATTEMPTS) {
        attempts.current = 0;
        lockedUntil.current = clock() + LOCKOUT_MS;
        setError('محاولات كتير غلط، استنى 30 ثانية');
      } else {
        setError('الرقم السري غلط');
      }
    }
  };

  const forgot = async () => {
    prompting.current = true;
    try {
      if (await verifyDeviceOwner()) {
        setEntry('');
        setError('');
        setState('setup');
      }
    } finally {
      prompting.current = false;
    }
  };

  useEffect(() => {
    if (state !== 'loading') SplashScreen.hideAsync();
  }, [state]);

  if (state === 'loading') return <Loading />;

  const title =
    state === 'setup' ? 'اختار رقم سري من 6 أرقام' : state === 'confirm' ? 'اكتب الرقم السري تاني للتأكيد' : 'اكتب الرقم السري';

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', bio && state === 'locked' ? 'bio' : '', '0', 'del'];

  const lockScreen = (
    <View style={[styles.wrap, { backgroundColor: t.background, paddingTop: insets.top + 60, paddingBottom: insets.bottom + 24 }]}>
      <Text style={{ color: t.text, fontSize: 28, fontWeight: '800' }}>دفتري</Text>
      <Text style={{ color: t.muted, fontSize: 16, marginTop: space.sm }}>{title}</Text>
      <View style={styles.dots}>
        {Array.from({ length: PIN_LENGTH }, (_, i) => (
          <View key={i} style={[styles.dot, { borderColor: t.text, backgroundColor: i < entry.length ? t.text : 'transparent' }]} />
        ))}
      </View>
      <Text style={{ color: t.negative, minHeight: 22 }}>{error}</Text>
      {/* Keypad is always LTR like the iOS lock screen */}
      <View style={[styles.pad, { direction: 'ltr' }]}>
        {keys.map((k, i) => (
          <Pressable
            key={i}
            disabled={!k}
            onPress={() => (k === 'del' ? setEntry((e) => e.slice(0, -1)) : k === 'bio' ? tryBiometrics() : onDigit(k))}
            style={({ pressed }) => [styles.key, { backgroundColor: k && k !== 'del' && k !== 'bio' ? t.card : 'transparent', opacity: pressed ? 0.6 : 1 }]}>
            <Text style={{ color: t.text, fontSize: k === 'bio' || k === 'del' ? 16 : 28 }}>
              {k === 'del' ? 'مسح' : k === 'bio' ? 'Face ID' : k}
            </Text>
          </Pressable>
        ))}
      </View>
      {state === 'locked' ? (
        <Pressable onPress={forgot} style={{ marginTop: space.lg }}>
          <Text style={{ color: t.primary }}>نسيت الرقم السري؟</Text>
        </Pressable>
      ) : null}
    </View>
  );

  if (!everUnlocked) return state === 'unlocked' ? <>{children}</> : lockScreen;

  // After the first unlock keep the app mounted (navigation state survives) and present the
  // lock as a native modal so it also covers any open form sheets.
  const locked = state !== 'unlocked';
  return (
    <>
      {children}
      <Modal visible={locked || covered} animationType="none" presentationStyle="fullScreen">
        {locked ? lockScreen : <View style={{ flex: 1, backgroundColor: t.background }} />}
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center' },
  dots: { flexDirection: 'row', gap: 16, marginTop: space.xl, marginBottom: space.md, direction: 'ltr' },
  dot: { width: 14, height: 14, borderRadius: 7, borderWidth: 1.5 },
  pad: { flexDirection: 'row', flexWrap: 'wrap', width: 300, justifyContent: 'space-between', rowGap: 16, marginTop: space.lg },
  key: { width: 84, height: 84, borderRadius: radius.lg * 3, alignItems: 'center', justifyContent: 'center' },
});
