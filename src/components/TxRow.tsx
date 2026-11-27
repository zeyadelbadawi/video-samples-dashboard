import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { KINDS } from '@/db/kinds';
import type { TransactionView } from '@/db/types';
import { formatDateShort } from '@/lib/dates';
import { formatAmount } from '@/lib/money';
import { space, useTheme } from '@/theme';

import { Money, T } from './ui';

/**
 * One transaction line. `effect` overrides the displayed sign/color
 * (e.g. on a contact statement the color follows the contact balance effect).
 */
export function TxRow({ tx, effect, running }: { tx: TransactionView; effect?: number; running?: number }) {
  const t = useTheme();
  const router = useRouter();
  const def = KINDS[tx.kind];
  const shown = effect ?? def.cash * tx.amount;

  const subtitle = [
    tx.contact_name,
    tx.category_name,
    tx.kind === 'transfer' ? `${tx.account_name ?? ''} ← ${tx.to_account_name ?? ''}` : tx.account_name,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <Pressable
      onPress={() => router.push({ pathname: '/transaction/edit', params: { id: String(tx.id) } })}
      style={({ pressed }) => [styles.row, { borderColor: t.border, opacity: pressed ? 0.6 : 1 }]}>
      <View style={{ flex: 1, gap: 2 }}>
        <T weight="600">{def.label}</T>
        {subtitle ? (
          <T size={13} muted numberOfLines={1}>
            {subtitle}
          </T>
        ) : null}
        {tx.note ? (
          <T size={13} muted numberOfLines={1}>
            {tx.note}
          </T>
        ) : null}
      </View>
      <View style={{ alignItems: 'flex-end', gap: 2 }}>
        <Money value={shown} tone={shown === 0 ? 'neutral' : 'auto'} />
        <T size={12} muted>
          {formatDateShort(tx.date)}
        </T>
        {running !== undefined ? (
          <T size={11} muted>
            الرصيد: {running === 0 ? 'صفر' : `${running > 0 ? 'ليك' : 'عليك'} ${formatAmount(Math.abs(running))}`}
          </T>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingVertical: space.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
