import { useCallback } from 'react';
import { useRouter } from 'expo-router';
import { Pressable, View } from 'react-native';

import { Card, Empty, Money, Row, Screen, T } from '@/components/ui';
import { ACCOUNT_TYPES } from '@/db/kinds';
import { listAccounts } from '@/db/queries';
import type { Db } from '@/db/types';
import { useData } from '@/lib/use-data';
import { useTheme } from '@/theme';

export default function Accounts() {
  const t = useTheme();
  const router = useRouter();
  const { data } = useData(useCallback((db: Db) => listAccounts(db, { includeArchived: true }), []));
  const active = data?.filter((a) => !a.archived) ?? [];
  const archived = data?.filter((a) => a.archived) ?? [];
  const total = active.reduce((s, a) => s + a.balance, 0);

  return (
    <Screen
      title="البنوك والمحافظ"
      right={
        <Pressable onPress={() => router.push('/account/edit')} hitSlop={12}>
          <T color={t.primary}>+ حساب</T>
        </Pressable>
      }>
      <Card>
        <Row>
          <T muted>الإجمالي</T>
          <Money value={total} size={22} weight="700" tone={total < 0 ? 'negative' : 'neutral'} />
        </Row>
      </Card>
      {data && data.length === 0 ? <Empty text="مفيش حسابات" /> : null}
      {active.map((a) => (
        <Card key={a.id} onPress={() => router.push(`/account/${a.id}`)}>
          <Row>
            <View>
              <T weight="600">{a.name}</T>
              <T size={12} muted>
                {ACCOUNT_TYPES[a.type]}
              </T>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Money value={a.balance} tone={a.balance < 0 ? 'negative' : 'neutral'} />
              {a.balance < 0 ? (
                <T size={12} color={t.negative}>
                  عليه (مدين)
                </T>
              ) : null}
            </View>
          </Row>
        </Card>
      ))}
      {archived.length ? (
        <>
          <T size={13} muted>
            مؤرشفة
          </T>
          {archived.map((a) => (
            <Card key={a.id} onPress={() => router.push(`/account/${a.id}`)} style={{ opacity: 0.6 }}>
              <Row>
                <T>{a.name}</T>
                <Money value={a.balance} tone="neutral" />
              </Row>
            </Card>
          ))}
        </>
      ) : null}
    </Screen>
  );
}
