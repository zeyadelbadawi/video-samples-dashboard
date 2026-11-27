import { useCallback } from 'react';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, View } from 'react-native';

import { TxRow } from '@/components/TxRow';
import { AddTxButton, Card, Empty, Money, Row, Screen, SectionTitle, T } from '@/components/ui';
import { ACCOUNT_TYPES } from '@/db/kinds';
import { accountStatement, getAccount } from '@/db/queries';
import type { Db } from '@/db/types';
import { useData } from '@/lib/use-data';
import { useTheme } from '@/theme';

export default function AccountDetail() {
  const t = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const accountId = Number(id);
  const { data } = useData(useCallback(async (db: Db) => {
    const [account, st] = await Promise.all([getAccount(db, accountId), accountStatement(db, accountId)]);
    return { account, opening: st.opening, lines: [...st.lines].reverse() };
  }, [accountId]));

  const a = data?.account;

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen
        options={{
          title: a?.name ?? 'حساب',
          headerRight: () => (
            <Pressable onPress={() => router.push({ pathname: '/account/edit', params: { id: String(accountId) } })} hitSlop={12}>
              <T color={t.primary}>تعديل</T>
            </Pressable>
          ),
        }}
      />
      <Screen>
        {a ? (
          <>
            <Card>
              <T size={13} muted>
                {ACCOUNT_TYPES[a.type]} · الرصيد الحالي
              </T>
              <Money value={a.balance} size={30} weight="800" tone={a.balance < 0 ? 'negative' : 'neutral'} />
              <Row>
                <T size={13} muted>
                  الرصيد الافتتاحي
                </T>
                <Money value={data.opening} size={13} tone={data.opening < 0 ? 'negative' : 'neutral'} />
              </Row>
            </Card>
            <SectionTitle>الحركات</SectionTitle>
            <Card>
              {data.lines.length === 0 ? (
                <Empty text="مفيش حركات على الحساب ده" />
              ) : (
                data.lines.map((l) => <TxRow key={l.tx.id} tx={l.tx} effect={l.effect} />)
              )}
            </Card>
          </>
        ) : null}
      </Screen>
      <AddTxButton params={{ accountId: String(accountId), kind: 'expense_business' }} />
    </View>
  );
}
