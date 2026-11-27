import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Switch, View } from 'react-native';

import { Button, Card, Row, Screen, SectionTitle, T } from '@/components/ui';
import { biometricsAvailable, isBiometricsEnabled, setBiometricsEnabled, setPin, verifyPin } from '@/lib/auth';
import { exportAndShare, lastManualExport, listAutoBackups, pickBackupFile, readBackupFile, restore } from '@/lib/backup';
import { formatDate } from '@/lib/dates';
import { cancelReportReminders, remindersScheduled, scheduleReportReminders } from '@/lib/notifications';
import { useData, useDb } from '@/lib/use-data';
import type { BackupData } from '@/db/queries';
import type { Db } from '@/db/types';

export default function Settings() {
  const db = useDb();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const { data: info, reload: refresh } = useData(
    useCallback(async (d: Db) => {
      let autos: ReturnType<typeof listAutoBackups> = [];
      try {
        autos = listAutoBackups();
      } catch {
        autos = [];
      }
      return {
        lastExport: await lastManualExport(d),
        reminders: await remindersScheduled(),
        bioAvail: await biometricsAvailable(),
        bio: await isBiometricsEnabled(),
        autos,
      };
    }, []),
  );
  const lastExport = info?.lastExport ?? null;
  const reminders = info?.reminders ?? false;
  const bioAvail = info?.bioAvail ?? false;
  const bio = info?.bio ?? false;
  const autos = info?.autos ?? [];

  const doExport = async () => {
    setBusy(true);
    try {
      await exportAndShare(db);
      refresh();
    } catch (e) {
      Alert.alert('حصلت مشكلة', (e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const confirmRestore = (label: string, backup: BackupData) => {
    const { contacts, accounts, transactions } = backup.data;
    Alert.alert(
      'استرجاع نسخة احتياطية',
      `${label}\n${contacts.length} شخص · ${accounts.length} حساب · ${transactions.length} حركة\n\nكل البيانات الحالية هتتبدل بالنسخة دي (هيتعمل snapshot من الحالي الأول).`,
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'استرجع',
          style: 'destructive',
          onPress: async () => {
            try {
              await restore(db, backup);
              Alert.alert('تمام', 'البيانات اترجعت');
              router.dismissAll();
            } catch (e) {
              Alert.alert('فشل الاسترجاع', `ولا حاجة اتغيرت. ${(e as Error).message}`);
            }
          },
        },
      ],
    );
  };

  const importFromFile = async () => {
    try {
      const picked = await pickBackupFile();
      if (picked) confirmRestore(picked.name, picked.backup);
    } catch (e) {
      Alert.alert('الملف ده مينفعش', (e as Error).message);
    }
  };

  const toggleReminders = async (on: boolean) => {
    if (on) {
      const ok = await scheduleReportReminders();
      if (!ok) Alert.alert('الإشعارات مقفولة', 'افتح Settings ← دفتري ← Notifications واسمح بالإشعارات.');
    } else {
      await cancelReportReminders();
    }
    refresh();
  };

  const toggleBio = async (on: boolean) => {
    await setBiometricsEnabled(on);
    refresh();
  };

  const changePin = () => {
    Alert.prompt('تغيير الرقم السري', 'اكتب الرقم السري الحالي', async (current) => {
      if (!(await verifyPin(current ?? ''))) return Alert.alert('الرقم السري غلط');
      Alert.prompt(
        'الرقم السري الجديد',
        '6 أرقام',
        async (next) => {
          if (!/^\d{6}$/.test(next ?? '')) return Alert.alert('لازم 6 أرقام');
          await setPin(next!);
          Alert.alert('تمام', 'الرقم السري اتغير');
        },
        'secure-text',
        '',
        'number-pad',
      );
    }, 'secure-text', '', 'number-pad');
  };

  return (
    <Screen>
      <SectionTitle>النسخ الاحتياطي</SectionTitle>
      <Card>
        <T size={14} muted>
          الداتا كلها على الموبايل بس. لو الموبايل ضاع أو اتعمله reset أو الأبلكيشن اتمسح هتروح، إلا لو عندك نسخة برا. احفظ نسخة على
          iCloud Drive أو ابعتها لنفسك كل أسبوع.
        </T>
        <T size={14}>آخر نسخة يدوية: {lastExport ? formatDate(lastExport.slice(0, 10)) : 'لسه ماتعملتش'}</T>
        <Button title="اعمل نسخة احتياطية دلوقتي" onPress={doExport} loading={busy} />
        <Button title="استرجاع من ملف" variant="secondary" onPress={importFromFile} />
      </Card>

      {autos.length ? (
        <>
          <SectionTitle>نسخ تلقائية على الموبايل</SectionTitle>
          <Card>
            <T size={12} muted>
              بتتعمل كل يوم أوتوماتيك (آخر 14 يوم). بتنفع لو مسحت حاجة بالغلط، بس مش بديل عن النسخة اللي برا الموبايل.
            </T>
            {autos.slice(0, 7).map((a) => (
              <Row key={a.name}>
                <T size={14}>{a.name.replace('.json', '')}</T>
                <Button
                  title="استرجاع"
                  variant="ghost"
                  onPress={async () => {
                    try {
                      confirmRestore(a.name, await readBackupFile(a.file));
                    } catch (e) {
                      Alert.alert('الملف ده مينفعش', (e as Error).message);
                    }
                  }}
                />
              </Row>
            ))}
          </Card>
        </>
      ) : null}

      <SectionTitle>التقارير</SectionTitle>
      <Card>
        <Row>
          <View style={{ flex: 1 }}>
            <T>فكّرني بالتقارير</T>
            <T size={12} muted>
              كل جمعة 9 بالليل تقرير الأسبوع، وأول كل شهر 10 الصبح تقرير الشهر اللي فات
            </T>
          </View>
          <Switch value={reminders} onValueChange={toggleReminders} />
        </Row>
      </Card>

      <SectionTitle>الأمان</SectionTitle>
      <Card>
        {bioAvail ? (
          <Row>
            <T>الفتح بـ Face ID</T>
            <Switch value={bio} onValueChange={toggleBio} />
          </Row>
        ) : null}
        <Button title="تغيير الرقم السري" variant="secondary" onPress={changePin} />
      </Card>

      <SectionTitle>البيانات</SectionTitle>
      <Card>
        <Button title="التصنيفات (دخل / مصاريف / ضرائب)" variant="secondary" onPress={() => router.push('/categories')} />
      </Card>
    </Screen>
  );
}
