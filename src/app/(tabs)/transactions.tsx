import { useState, useCallback } from 'react';
import { View } from 'react-native';

import { TxRow } from '@/components/TxRow';
import { AddTxButton, Button, Card, Chips, Empty, Screen, SearchBox } from '@/components/ui';
import { KINDS, type Kind } from '@/db/kinds';
import { listTransactions } from '@/db/queries';
import type { Db } from '@/db/types';
import { useData } from '@/lib/use-data';

type Filter = 'all' | 'income' | 'expenses' | 'taxes' | 'debts' | 'transfers';

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'الكل' },
  { value: 'income', label: 'دخل' },
  { value: 'expenses', label: 'مصاريف' },
  { value: 'taxes', label: 'ضرائب' },
  { value: 'debts', label: 'ديون وسلف' },
  { value: 'transfers', label: 'تحويلات' },
];

const PAGE = 200;

export default function Transactions() {
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');
  const [limit, setLimit] = useState(PAGE);

  // Fetch one extra row to know whether there is more.
  const { data } = useData(
    useCallback(
      (db: Db) => {
        const kinds = filter === 'all' ? undefined : (Object.keys(KINDS) as Kind[]).filter((k) => KINDS[k].group === filter);
        return listTransactions(db, { kinds, search, limit: limit + 1 });
      },
      [filter, search, limit],
    ),
  );
  const rows = data?.slice(0, limit) ?? [];
  const hasMore = (data?.length ?? 0) > limit;

  return (
    <View style={{ flex: 1 }}>
      <Screen title="الحركات">
        <SearchBox value={search} onChangeText={setSearch} placeholder="دوّر باسم الشخص أو الملاحظة أو التصنيف" />
        <Chips options={FILTERS} value={filter} onChange={setFilter} wrap={false} />
        <Card>{data && rows.length === 0 ? <Empty text="مفيش حركات" /> : rows.map((tx) => <TxRow key={tx.id} tx={tx} />)}</Card>
        {hasMore ? <Button title="اعرض أكتر" variant="secondary" onPress={() => setLimit((l) => l + PAGE)} /> : null}
      </Screen>
      <AddTxButton />
    </View>
  );
}
