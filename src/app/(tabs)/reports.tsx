import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Pressable, View } from 'react-native';

import { Button, Card, Chips, Divider, Money, Row, Screen, SectionTitle, T } from '@/components/ui';
import { KINDS, KIND_ORDER } from '@/db/kinds';
import { buildReport } from '@/db/reports';
import { getPeriod, PERIOD_LABELS, type PeriodType } from '@/lib/dates';
import { shareReportPdf } from '@/lib/report-html';
import type { Db } from '@/db/types';
import { useData } from '@/lib/use-data';
import { space, useTheme } from '@/theme';

function Delta({ cur, prev }: { cur: number; prev?: number }) {
  if (prev === undefined || prev === 0) return null;
  const pct = Math.round(((cur - prev) / Math.abs(prev)) * 100);
  return (
    <T size={11} muted>
      {pct === 0 ? 'زي اللي فات' : `${pct > 0 ? '+' : ''}${pct}% عن اللي فات`}
    </T>
  );
}

export default function Reports() {
  const t = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ period?: PeriodType; offset?: string }>();
  const [type, setType] = useState<PeriodType>(params.period ?? 'month');
  const [offset, setOffset] = useState(Number(params.offset ?? 0) || 0);
  const [sharing, setSharing] = useState(false);

  // When opened from a notification / link, jump to the requested period.
  const paramKey = `${params.period ?? ''}|${params.offset ?? ''}`;
  const [seenParamKey, setSeenParamKey] = useState(paramKey);
  if (paramKey !== seenParamKey) {
    setSeenParamKey(paramKey);
    if (params.period) setType(params.period);
    if (params.offset !== undefined) setOffset(Number(params.offset) || 0);
  }

  const period = getPeriod(type, offset);
  const { data: r } = useData(
    useCallback(
      (db: Db) => {
        const cur = getPeriod(type, offset);
        return buildReport(db, cur.from, cur.to, getPeriod(type, offset - 1));
      },
      [type, offset],
    ),
  );

  const share = async () => {
    if (!r) return;
    setSharing(true);
    try {
      await shareReportPdf(r, `تقرير ${period.label}`);
    } catch (e) {
      Alert.alert('حصلت مشكلة', (e as Error).message);
    } finally {
      setSharing(false);
    }
  };

  return (
    <Screen title="التقارير">
      <Chips
        options={(Object.keys(PERIOD_LABELS) as PeriodType[]).map((v) => ({ value: v, label: PERIOD_LABELS[v] }))}
        value={type}
        onChange={(v) => {
          setType(v);
          setOffset(0);
        }}
      />
      <Row>
        <Pressable onPress={() => setOffset((o) => o - 1)} hitSlop={12}>
          <T color={t.primary}>→ اللي فات</T>
        </Pressable>
        <T weight="700">{period.label}</T>
        <Pressable onPress={() => setOffset((o) => Math.min(o + 1, 0))} disabled={offset >= 0} hitSlop={12}>
          <T color={offset >= 0 ? t.muted : t.primary}>اللي بعده ←</T>
        </Pressable>
      </Row>

      {r ? (
        <>
          <Button title="شارك التقرير PDF" onPress={share} loading={sharing} />

          <View style={{ flexDirection: 'row', gap: space.md }}>
            <Card style={{ flex: 1 }}>
              <T size={13} muted>الدخل</T>
              <Money value={r.income} tone="positive" size={18} weight="700" />
              <Delta cur={r.income} prev={r.previous?.income} />
            </Card>
            <Card style={{ flex: 1 }}>
              <T size={13} muted>مصاريف شغل</T>
              <Money value={r.businessExpenses} tone="negative" size={18} weight="700" />
              <Delta cur={r.businessExpenses} prev={r.previous?.businessExpenses} />
            </Card>
          </View>
          <View style={{ flexDirection: 'row', gap: space.md }}>
            <Card style={{ flex: 1 }}>
              <T size={13} muted>مصاريف شخصية</T>
              <Money value={r.personalExpenses} tone="negative" size={18} weight="700" />
              <Delta cur={r.personalExpenses} prev={r.previous?.personalExpenses} />
            </Card>
            <Card style={{ flex: 1 }}>
              <T size={13} muted>ضرائب ورسوم</T>
              <Money value={r.taxes} tone="negative" size={18} weight="700" />
              <Delta cur={r.taxes} prev={r.previous?.taxes} />
            </Card>
          </View>

          <Card>
            <Row>
              <T weight="700">صافي ربح الشغل</T>
              <Money value={r.netBusinessProfit} weight="700" />
            </Row>
            <T size={12} muted>
              الدخل − مصاريف الشغل − الضرائب{r.netBusinessProfit < 0 ? ' (خسارة)' : ''}
            </T>
            <Divider />
            <Row>
              <T>فلوس دخلت</T>
              <Money value={r.cashIn} tone="positive" />
            </Row>
            <Row>
              <T>فلوس خرجت</T>
              <Money value={r.cashOut} tone="negative" />
            </Row>
            <Row>
              <T weight="700">صافي حركة الفلوس</T>
              <Money value={r.netCashFlow} weight="700" />
            </Row>
            <T size={12} muted>
              بيشمل التحصيل والسداد والسلف، ومش بيشمل التحويل بين حساباتك.
            </T>
          </Card>

          <SectionTitle>المديونيات في آخر الفترة</SectionTitle>
          <Card>
            <Row>
              <T>ليك عند الناس</T>
              <Money value={r.owedToMe} tone="positive" />
            </Row>
            <Row>
              <T>عليك للناس</T>
              <Money value={r.iOwe} tone="negative" />
            </Row>
            {[...r.topDebtors.slice(0, 5), ...r.topCreditors.slice(0, 5)].map((c) => (
              <Pressable key={c.id} onPress={() => router.push(`/contact/${c.id}`)}>
                <Row style={{ paddingVertical: 2 }}>
                  <T size={14} muted>
                    {c.name}
                  </T>
                  <Money value={c.balance} size={14} />
                </Row>
              </Pressable>
            ))}
          </Card>

          <SectionTitle>التفاصيل</SectionTitle>
          {KIND_ORDER.filter((k) => r.kinds[k].count > 0).map((k) => {
            const s = r.kinds[k];
            return (
              <Card key={k}>
                <Row>
                  <T weight="700">{KINDS[k].label}</T>
                  <Money value={s.total} tone="neutral" weight="700" />
                </Row>
                <T size={12} muted>
                  {s.count} حركة
                </T>
                {s.categories.map((c) => (
                  <Row key={c.category}>
                    <T size={14} muted>
                      {c.category} ({c.count})
                    </T>
                    <Money value={c.total} size={14} tone="neutral" weight="400" />
                  </Row>
                ))}
              </Card>
            );
          })}
          {r.transactions.length === 0 ? <T muted>مفيش حركات في الفترة دي.</T> : null}

          <SectionTitle>البنوك والمحافظ</SectionTitle>
          <Card>
            {r.accounts.map((a) => (
              <View key={a.id} style={{ gap: 2, paddingVertical: 4 }}>
                <Row>
                  <T weight="600">{a.name}</T>
                  <Money value={a.closing} tone={a.closing < 0 ? 'negative' : 'neutral'} />
                </Row>
                <T size={12} muted>
                  داخل <Money value={a.in} size={12} tone="positive" weight="400" /> · خارج{' '}
                  <Money value={a.out} size={12} tone="negative" weight="400" />
                </T>
              </View>
            ))}
            <Divider />
            <Row>
              <T weight="700">الرصيد آخر الفترة</T>
              <Money value={r.closingCash} weight="700" tone={r.closingCash < 0 ? 'negative' : 'neutral'} />
            </Row>
          </Card>
        </>
      ) : null}
    </Screen>
  );
}
