import { useCallback } from 'react';
import { useRouter } from 'expo-router';
import { Pressable, View } from 'react-native';

import { BrandLogo } from '@/components/BrandLogo';
import { TxRow } from '@/components/TxRow';
import { AddTxButton, Card, Empty, Money, Row, Screen, SectionTitle, T } from '@/components/ui';
import { ACCOUNT_TYPES } from '@/db/kinds';
import { getSummary, listAccounts, listContacts, listTransactions } from '@/db/queries';
import { buildReport } from '@/db/reports';
import { lastManualExport } from '@/lib/backup';
import { getPeriod } from '@/lib/dates';
import type { Db } from '@/db/types';
import { useData } from '@/lib/use-data';
import { space, useTheme } from '@/theme';

const BACKUP_WARN_DAYS = 7;

export default function Dashboard() {
  const t = useTheme();
  const router = useRouter();
  const { data } = useData(useCallback(async (db: Db) => {
    const month = getPeriod('month');
    const [summary, accounts, recent, debtors, creditors, report, lastExport] = await Promise.all([
      getSummary(db),
      listAccounts(db),
      listTransactions(db, { limit: 5 }),
      listContacts(db, { filter: 'owes_me' }),
      listContacts(db, { filter: 'i_owe' }),
      buildReport(db, month.from, month.to),
      lastManualExport(db),
    ]);
    const daysSinceExport = lastExport ? Math.floor((Date.now() - new Date(lastExport).getTime()) / 86_400_000) : null;
    return { summary, accounts, recent, debtors: debtors.slice(0, 3), creditors: creditors.slice(0, 3), report, month, daysSinceExport };
  }, []));

  const settingsButton = (
    <Pressable onPress={() => router.push('/settings')} hitSlop={12}>
      <T color={t.primary}>الإعدادات</T>
    </Pressable>
  );

  if (!data) return <Screen title={<BrandLogo width={110} />} right={settingsButton}>{null}</Screen>;
  const { summary, accounts, recent, debtors, creditors, report, month, daysSinceExport } = data;
  const hasData = recent.length > 0;

  return (
    <View style={{ flex: 1 }}>
      <Screen title={<BrandLogo width={110} />} right={settingsButton}>
        {hasData && (daysSinceExport === null || daysSinceExport >= BACKUP_WARN_DAYS) ? (
          <Card onPress={() => router.push('/settings')} style={{ borderColor: t.warning }}>
            <T color={t.warning} weight="600">
              {daysSinceExport === null ? 'لسه ماعملتش نسخة احتياطية برا الموبايل' : `آخر نسخة احتياطية من ${daysSinceExport} يوم`}
            </T>
            <T size={13} muted>
              لو الموبايل ضاع أو اتمسح الأبلكيشن الداتا هتروح. دوس هنا واحفظ نسخة على iCloud Drive.
            </T>
          </Card>
        ) : null}

        <View style={{ flexDirection: 'row', gap: space.md }}>
          <Card style={{ flex: 1 }} onPress={() => router.push({ pathname: '/contacts', params: { filter: 'owes_me' } })}>
            <T size={13} muted>ليك عند الناس</T>
            <Money value={summary.owedToMe} tone="positive" size={20} weight="700" />
            <T size={12} muted>{summary.debtorsCount} شخص</T>
          </Card>
          <Card style={{ flex: 1 }} onPress={() => router.push({ pathname: '/contacts', params: { filter: 'i_owe' } })}>
            <T size={13} muted>عليك للناس</T>
            <Money value={summary.iOwe} tone="negative" size={20} weight="700" />
            <T size={12} muted>{summary.creditorsCount} شخص</T>
          </Card>
        </View>

        <Card onPress={() => router.push('/accounts')}>
          <Row>
            <T size={13} muted>إجمالي الفلوس في البنوك والمحافظ</T>
            <Money value={summary.cashTotal} tone={summary.cashTotal < 0 ? 'negative' : 'neutral'} size={20} weight="700" />
          </Row>
          {accounts.map((a) => (
            <Row key={a.id}>
              <T size={14}>
                {a.name} <T size={12} muted>({ACCOUNT_TYPES[a.type]})</T>
              </T>
              <Money value={a.balance} size={14} tone={a.balance < 0 ? 'negative' : 'neutral'} />
            </Row>
          ))}
        </Card>

        <SectionTitle
          right={
            <Pressable onPress={() => router.push({ pathname: '/reports', params: { period: 'month', offset: '0' } })}>
              <T size={14} color={t.primary}>التقرير الكامل</T>
            </Pressable>
          }>
          {month.label}
        </SectionTitle>
        <Card>
          <Row>
            <T>الدخل</T>
            <Money value={report.income} tone="positive" />
          </Row>
          <Row>
            <T>مصاريف الشغل</T>
            <Money value={report.businessExpenses} tone="negative" />
          </Row>
          <Row>
            <T>مصاريف شخصية</T>
            <Money value={report.personalExpenses} tone="negative" />
          </Row>
          <Row>
            <T>ضرائب ورسوم</T>
            <Money value={report.taxes} tone="negative" />
          </Row>
          <Row>
            <T weight="700">صافي ربح الشغل</T>
            <Money value={report.netBusinessProfit} weight="700" />
          </Row>
        </Card>

        {debtors.length || creditors.length ? (
          <>
            <SectionTitle>أكبر المديونيات</SectionTitle>
            <Card>
              {[...debtors, ...creditors].map((c) => (
                <Pressable key={c.id} onPress={() => router.push(`/contact/${c.id}`)}>
                  <Row style={{ paddingVertical: 4 }}>
                    <T>{c.name}</T>
                    <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                      <T size={12} muted>{c.balance > 0 ? 'ليك' : 'عليك'}</T>
                      <Money value={c.balance} size={15} />
                    </View>
                  </Row>
                </Pressable>
              ))}
            </Card>
          </>
        ) : null}

        <SectionTitle
          right={
            <Pressable onPress={() => router.push('/transactions')}>
              <T size={14} color={t.primary}>الكل</T>
            </Pressable>
          }>
          آخر الحركات
        </SectionTitle>
        <Card>
          {hasData ? (
            recent.map((tx) => <TxRow key={tx.id} tx={tx} />)
          ) : (
            <Empty text="لسه مفيش حركات. ابدأ بإضافة أول حركة." action={{ title: 'إضافة حركة', onPress: () => router.push('/transaction/edit') }} />
          )}
        </Card>
      </Screen>
      <AddTxButton />
    </View>
  );
}
