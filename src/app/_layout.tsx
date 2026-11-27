import * as Notifications from 'expo-notifications';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { SQLiteProvider } from 'expo-sqlite';
import { useEffect } from 'react';
import { I18nManager, useColorScheme } from 'react-native';

import { LockGate } from '@/components/LockGate';
import { migrate } from '@/db/schema';
import type { Db } from '@/db/types';
import { autoBackupIfDue } from '@/lib/backup';
import { parseReminderData } from '@/lib/notifications';

// Arabic UI. The expo-localization plugin (app.json) forces RTL natively; this is a JS-side fallback.
I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

SplashScreen.preventAutoHideAsync();

async function onInit(db: Db) {
  await migrate(db);
  // Never block startup on the snapshot.
  autoBackupIfDue(db).catch((e) => console.warn('auto backup failed', e));
}

/** Opens the matching report when a reminder notification is tapped. */
function useReportNotificationRouting() {
  const router = useRouter();
  const last = Notifications.useLastNotificationResponse();
  useEffect(() => {
    const data = parseReminderData(last?.notification.request.content.data);
    if (!data) return;
    router.navigate({ pathname: '/reports', params: { period: data.report, offset: String(data.offset) } });
    Notifications.clearLastNotificationResponse();
  }, [last, router]);
}

function AppStack() {
  useReportNotificationRouting();
  return (
    <Stack screenOptions={{ headerBackButtonDisplayMode: 'minimal' }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="transaction/edit" options={{ presentation: 'modal', title: 'حركة' }} />
      <Stack.Screen name="contact/edit" options={{ presentation: 'modal', title: 'شخص' }} />
      <Stack.Screen name="account/edit" options={{ presentation: 'modal', title: 'حساب' }} />
      <Stack.Screen name="contact/[id]" options={{ title: 'كشف حساب' }} />
      <Stack.Screen name="account/[id]" options={{ title: 'كشف حساب' }} />
      <Stack.Screen name="settings" options={{ title: 'الإعدادات' }} />
      <Stack.Screen name="categories" options={{ title: 'التصنيفات' }} />
    </Stack>
  );
}

export default function RootLayout() {
  const scheme = useColorScheme();
  return (
    <ThemeProvider value={scheme === 'dark' ? DarkTheme : DefaultTheme}>
      <SQLiteProvider databaseName="daftari.db" onInit={onInit}>
        <LockGate>
          <AppStack />
        </LockGate>
      </SQLiteProvider>
    </ThemeProvider>
  );
}
