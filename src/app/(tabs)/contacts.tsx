import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, View } from 'react-native';

import { BalanceLabel, Card, Chips, Empty, Money, Row, Screen, SearchBox, T } from '@/components/ui';
import { listContacts, type ContactFilter } from '@/db/queries';
import { formatDateShort } from '@/lib/dates';
import type { Db } from '@/db/types';
import { useData } from '@/lib/use-data';
import { useTheme } from '@/theme';

const FILTERS: { value: ContactFilter; label: string }[] = [
  { value: 'all', label: 'الكل' },
  { value: 'owes_me', label: 'ليا عندهم' },
  { value: 'i_owe', label: 'عليا ليهم' },
  { value: 'settled', label: 'متسوّيين' },
];

export default function Contacts() {
  const t = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ filter?: ContactFilter }>();
  const [filter, setFilter] = useState<ContactFilter>(params.filter ?? 'all');
  const [search, setSearch] = useState('');

  const [paramFilter, setParamFilter] = useState(params.filter);
  if (params.filter !== paramFilter) {
    setParamFilter(params.filter);
    if (params.filter) setFilter(params.filter);
  }

  const { data } = useData(useCallback((db: Db) => listContacts(db, { search, filter }), [search, filter]));
  const owed = data?.filter((c) => c.balance > 0).reduce((s, c) => s + c.balance, 0) ?? 0;
  const owe = data?.filter((c) => c.balance < 0).reduce((s, c) => s - c.balance, 0) ?? 0;

  return (
    <Screen
      title="الأشخاص"
      right={
        <Pressable onPress={() => router.push('/contact/edit')} hitSlop={12}>
          <T color={t.primary}>+ شخص جديد</T>
        </Pressable>
      }>
      <SearchBox value={search} onChangeText={setSearch} placeholder="دوّر بالاسم أو رقم التليفون" autoFocus={false} />
      <Chips options={FILTERS} value={filter} onChange={setFilter} wrap={false} />
      {data && data.length > 0 ? (
        <Row>
          <T size={13} muted>
            ليك: <Money value={owed} size={13} tone="positive" />
          </T>
          <T size={13} muted>
            عليك: <Money value={owe} size={13} tone="negative" />
          </T>
        </Row>
      ) : null}
      {data && data.length === 0 ? (
        <Empty
          text={search ? `مفيش حد باسم «${search}»` : 'لسه مفيش أشخاص'}
          action={{ title: 'إضافة شخص', onPress: () => router.push({ pathname: '/contact/edit', params: { name: search } }) }}
        />
      ) : null}
      {data?.map((c) => (
        <Card key={c.id} onPress={() => router.push(`/contact/${c.id}`)}>
          <Row>
            <View style={{ flex: 1, gap: 2 }}>
              <T weight="600">{c.name}</T>
              <T size={12} muted>
                {c.tx_count} حركة{c.last_date ? ` · آخر حركة ${formatDateShort(c.last_date)}` : ''}
              </T>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              {c.balance !== 0 ? <Money value={c.balance} /> : null}
              <BalanceLabel value={c.balance} size={12} />
            </View>
          </Row>
        </Card>
      ))}
    </Screen>
  );
}
