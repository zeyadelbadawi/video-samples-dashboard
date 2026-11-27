import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';

import { createContact, findContactByName, listContacts } from '@/db/queries';
import type { ContactWithBalance } from '@/db/types';
import { useDb } from '@/lib/use-data';
import { radius, space, useTheme } from '@/theme';

import { BalanceLabel, Money, SearchBox, T } from './ui';

/**
 * Inline searchable contact picker with "add new by this name".
 */
export function ContactSelect({
  value,
  onChange,
  required,
}: {
  value: number | null;
  onChange: (id: number | null) => void;
  required?: boolean;
}) {
  const db = useDb();
  const t = useTheme();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ContactWithBalance[]>([]);
  const [selected, setSelected] = useState<ContactWithBalance | null>(null);

  useEffect(() => {
    if (!value) return;
    let alive = true;
    listContacts(db).then((all) => alive && setSelected(all.find((c) => c.id === value) ?? null));
    return () => {
      alive = false;
    };
  }, [db, value]);

  useEffect(() => {
    let alive = true;
    listContacts(db, { search: query }).then((r) => alive && setResults(r.slice(0, 6)));
    return () => {
      alive = false;
    };
  }, [db, query]);

  const shown = value && selected?.id === value ? selected : null;
  if (shown) {
    const selected = shown;
    return (
      <View style={{ gap: space.xs }}>
        <T size={14} muted weight="500">
          الشخص {required ? '' : '(اختياري)'}
        </T>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, backgroundColor: t.inputBg, borderRadius: radius.md, padding: space.md }}>
          <View style={{ flex: 1 }}>
            <T weight="600">{selected.name}</T>
            <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
              <BalanceLabel value={selected.balance} />
              {selected.balance !== 0 ? <Money value={selected.balance} size={13} /> : null}
            </View>
          </View>
          <Pressable onPress={() => onChange(null)} hitSlop={10}>
            <T color={t.primary}>تغيير</T>
          </Pressable>
        </View>
      </View>
    );
  }

  const trimmed = query.trim();
  const exact = results.some((r) => r.name === trimmed);

  const addNew = async () => {
    const existing = await findContactByName(db, trimmed);
    const id = existing ? existing.id : await createContact(db, { name: trimmed, phone: null, notes: null });
    setQuery('');
    onChange(id);
  };

  return (
    <View style={{ gap: space.xs }}>
      <T size={14} muted weight="500">
        الشخص {required ? '' : '(اختياري)'}
      </T>
      <SearchBox value={query} onChangeText={setQuery} placeholder="دوّر بالاسم أو اكتب اسم جديد" style={{ backgroundColor: t.inputBg }} />
      {results.map((c) => (
        <Pressable
          key={c.id}
          onPress={() => {
            setQuery('');
            onChange(c.id);
          }}
          style={({ pressed }) => ({ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, paddingHorizontal: 4, opacity: pressed ? 0.6 : 1 })}>
          <T>{c.name}</T>
          {c.balance !== 0 ? <Money value={c.balance} size={14} /> : <T size={13} muted>متسوّي</T>}
        </Pressable>
      ))}
      {trimmed && !exact ? (
        <Pressable onPress={addNew} style={{ paddingVertical: 10, paddingHorizontal: 4 }}>
          <T color={t.primary}>+ إضافة «{trimmed}» كشخص جديد</T>
        </Pressable>
      ) : null}
    </View>
  );
}
