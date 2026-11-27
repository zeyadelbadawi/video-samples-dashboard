import { useState, useCallback } from 'react';
import { Alert, Pressable } from 'react-native';

import { Card, Chips, Row, Screen, T } from '@/components/ui';
import { KINDS, KIND_ORDER, type Kind } from '@/db/kinds';
import { createCategory, listCategories, renameCategory, setCategoryArchived } from '@/db/queries';
import type { Db } from '@/db/types';
import { useData, useDb } from '@/lib/use-data';
import { useTheme } from '@/theme';

const CATEGORY_KINDS = KIND_ORDER.filter((k) => KINDS[k].hasCategories);

export default function Categories() {
  const db = useDb();
  const t = useTheme();
  const [kind, setKind] = useState<Kind>('income');
  const { data, reload } = useData(useCallback((d: Db) => listCategories(d, kind, true), [kind]));

  const add = () =>
    Alert.prompt('تصنيف جديد', KINDS[kind].label, async (name) => {
      if (!name?.trim()) return;
      await createCategory(db, kind, name);
      reload();
    });

  const edit = (id: number, name: string, archived: boolean) =>
    Alert.alert(name, undefined, [
      {
        text: 'تغيير الاسم',
        onPress: () =>
          Alert.prompt(
            'الاسم الجديد',
            undefined,
            async (n) => {
              if (!n?.trim()) return;
              await renameCategory(db, id, n);
              reload();
            },
            'plain-text',
            name,
          ),
      },
      {
        text: archived ? 'رجّعه' : 'إخفاء',
        onPress: async () => {
          await setCategoryArchived(db, id, !archived);
          reload();
        },
      },
      { text: 'إلغاء', style: 'cancel' },
    ]);

  return (
    <Screen>
      <Chips options={CATEGORY_KINDS.map((k) => ({ value: k, label: KINDS[k].label }))} value={kind} onChange={setKind} />
      <Card>
        {data?.map((c) => (
          <Pressable key={c.id} onPress={() => edit(c.id, c.name, !!c.archived)}>
            <Row style={{ paddingVertical: 8, opacity: c.archived ? 0.4 : 1 }}>
              <T>{c.name}</T>
              {c.archived ? <T size={12} muted>مخفي</T> : null}
            </Row>
          </Pressable>
        ))}
        <Pressable onPress={add}>
          <T color={t.primary} style={{ paddingVertical: 8 }}>
            + تصنيف جديد
          </T>
        </Pressable>
      </Card>
      <T size={12} muted>
        إخفاء التصنيف مش بيمسح الحركات اللي عليه، بس بيشيله من الاختيارات.
      </T>
    </Screen>
  );
}
