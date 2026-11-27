import { useCallback } from 'react';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Linking, Pressable, View } from 'react-native';

import { TxRow } from '@/components/TxRow';
import { AddTxButton, BalanceLabel, Button, Card, Empty, Money, Row, Screen, SectionTitle, T } from '@/components/ui';
import { contactStatement, getContact } from '@/db/queries';
import type { Db } from '@/db/types';
import { useData } from '@/lib/use-data';
import { space, useTheme } from '@/theme';

export default function ContactDetail() {
  const t = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const contactId = Number(id);
  const { data } = useData(useCallback(async (db: Db) => {
    const [contact, lines] = await Promise.all([getContact(db, contactId), contactStatement(db, contactId)]);
    return { contact, lines: [...lines].reverse() };
  }, [contactId]));

  const c = data?.contact;

  const quick = (kind: string) =>
    router.push({ pathname: '/transaction/edit', params: { kind, contactId: String(contactId) } });

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen
        options={{
          title: c?.name ?? 'كشف حساب',
          headerRight: () => (
            <Pressable onPress={() => router.push({ pathname: '/contact/edit', params: { id: String(contactId) } })} hitSlop={12}>
              <T color={t.primary}>تعديل</T>
            </Pressable>
          ),
        }}
      />
      <Screen>
        {c ? (
          <>
            <Card>
              <BalanceLabel value={c.balance} size={14} />
              <Money value={c.balance} size={30} weight="800" />
              {c.phone ? (
                <Pressable onPress={() => Linking.openURL(`tel:${c.phone}`)}>
                  <T color={t.primary}>{c.phone}</T>
                </Pressable>
              ) : null}
              {c.notes ? <T muted size={14}>{c.notes}</T> : null}
            </Card>

            <View style={{ flexDirection: 'row', gap: space.sm, flexWrap: 'wrap' }}>
              {c.balance > 0 ? <Button title="تحصيل منه" onPress={() => quick('collection')} style={{ flex: 1 }} /> : null}
              {c.balance < 0 ? <Button title="سداد له" onPress={() => quick('repayment')} style={{ flex: 1 }} /> : null}
              <Button title="دين ليا عليه" variant="secondary" onPress={() => quick('receivable')} style={{ flex: 1 }} />
              <Button title="دين عليا له" variant="secondary" onPress={() => quick('payable')} style={{ flex: 1 }} />
            </View>

            <SectionTitle>كشف الحساب ({c.tx_count} حركة)</SectionTitle>
            <Card>
              {data.lines.length === 0 ? (
                <Empty text="مفيش حركات للشخص ده" />
              ) : (
                data.lines.map((l) => <TxRow key={l.tx.id} tx={l.tx} effect={l.effect} running={l.running} />)
              )}
            </Card>
            <Row>
              <T size={12} muted>
                الأخضر = زوّد اللي ليك عنده · الأحمر = زوّد اللي عليك له أو قلّل اللي ليك
              </T>
            </Row>
          </>
        ) : null}
      </Screen>
      <AddTxButton params={{ contactId: String(contactId), kind: 'receivable' }} />
    </View>
  );
}
