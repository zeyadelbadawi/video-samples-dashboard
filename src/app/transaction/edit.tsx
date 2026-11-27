import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Pressable, ScrollView, View } from 'react-native';

import { ContactSelect } from '@/components/ContactSelect';
import { DateField } from '@/components/DateField';
import { Button, Chips, Field, T } from '@/components/ui';
import { isKind, KINDS, KIND_ORDER, type Kind } from '@/db/kinds';
import {
  createCategory,
  createTransaction,
  deleteTransaction,
  getTransaction,
  listAccounts,
  listCategories,
  updateTransaction,
  UserError,
} from '@/db/queries';
import type { AccountWithBalance, Category } from '@/db/types';
import { today } from '@/lib/dates';
import { amountToInput, parseAmount } from '@/lib/money';
import { useDb } from '@/lib/use-data';
import { space, useTheme } from '@/theme';

export default function TransactionEdit() {
  const db = useDb();
  const t = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string; kind?: string; contactId?: string; accountId?: string }>();
  const editingId = params.id ? Number(params.id) : null;

  const [kind, setKind] = useState<Kind>(isKind(params.kind) ? params.kind : 'income');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(today());
  const [accountId, setAccountId] = useState<number | null>(params.accountId ? Number(params.accountId) : null);
  const [toAccountId, setToAccountId] = useState<number | null>(null);
  const [contactId, setContactId] = useState<number | null>(params.contactId ? Number(params.contactId) : null);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [note, setNote] = useState('');
  const [accounts, setAccounts] = useState<AccountWithBalance[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(!editingId);

  const def = KINDS[kind];

  useEffect(() => {
    listAccounts(db).then((a) => {
      setAccounts(a);
      setAccountId((cur) => cur ?? (a.length === 1 ? a[0].id : null));
    });
  }, [db]);

  useEffect(() => {
    if (!editingId) return;
    getTransaction(db, editingId).then((tx) => {
      if (!tx) return router.back();
      setKind(tx.kind);
      setAmount(amountToInput(tx.amount));
      setDate(tx.date);
      setAccountId(tx.account_id);
      setToAccountId(tx.to_account_id);
      setContactId(tx.contact_id);
      setCategoryId(tx.category_id);
      setNote(tx.note ?? '');
      setLoaded(true);
    });
  }, [db, editingId, router]);

  useEffect(() => {
    if (!def.hasCategories) return;
    let alive = true;
    listCategories(db, kind).then((c) => alive && setCategories(c));
    return () => {
      alive = false;
    };
  }, [db, kind, def.hasCategories]);

  const pickKind = (k: Kind) => {
    setKind(k);
    setCategoryId(null);
  };

  const addCategory = () => {
    Alert.prompt('تصنيف جديد', `تحت «${def.label}»`, async (name) => {
      if (!name?.trim()) return;
      const id = await createCategory(db, kind, name);
      setCategories(await listCategories(db, kind));
      setCategoryId(id);
    });
  };

  const save = async () => {
    const parsed = parseAmount(amount);
    if (parsed === null || parsed <= 0) return Alert.alert('المبلغ', 'اكتب مبلغ صحيح (رقمين بعد العلامة بالكتير)');
    setSaving(true);
    try {
      const input = {
        kind,
        date,
        amount: parsed,
        account_id: accountId,
        to_account_id: toAccountId,
        contact_id: contactId,
        category_id: categoryId,
        note,
      };
      if (editingId) await updateTransaction(db, editingId, input);
      else await createTransaction(db, input);
      router.back();
    } catch (e) {
      Alert.alert('مينفعش تتحفظ', e instanceof UserError ? e.message : `حصلت مشكلة: ${(e as Error).message}`);
    } finally {
      setSaving(false);
    }
  };

  const remove = () => {
    if (!editingId) return;
    Alert.alert('مسح الحركة', 'متأكد؟ الأرصدة هتتحسب من غيرها.', [
      { text: 'لأ', style: 'cancel' },
      {
        text: 'امسح',
        style: 'destructive',
        onPress: async () => {
          await deleteTransaction(db, editingId);
          router.back();
        },
      },
    ]);
  };

  const accountOptions = accounts.map((a) => ({ value: a.id, label: a.name }));

  if (!loaded) return null;

  return (
    <KeyboardAvoidingView behavior="padding" style={{ flex: 1, backgroundColor: t.background }}>
      <Stack.Screen
        options={{
          title: editingId ? 'تعديل حركة' : 'حركة جديدة',
          headerLeft: () => (
            <Pressable onPress={() => router.back()} hitSlop={12}>
              <T color={t.primary}>إلغاء</T>
            </Pressable>
          ),
        }}
      />
      <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.lg, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
        <View style={{ gap: space.xs }}>
          <T size={14} muted weight="500">
            نوع الحركة
          </T>
          <Chips options={KIND_ORDER.map((k) => ({ value: k, label: KINDS[k].label }))} value={kind} onChange={pickKind} />
          <T size={12} muted>
            {def.hint}
          </T>
        </View>

        <Field
          label="المبلغ (جنيه)"
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
          placeholder="0"
          style={{ fontSize: 24, fontWeight: '700' }}
        />

        {def.contactMode !== 'none' ? (
          <ContactSelect value={contactId} onChange={setContactId} required={def.contactMode === 'required'} />
        ) : null}

        {def.needsAccount ? (
          <View style={{ gap: space.xs }}>
            <T size={14} muted weight="500">
              {kind === 'transfer' ? 'من حساب' : def.cash === 1 ? 'الفلوس دخلت في' : 'الفلوس طلعت من'}
            </T>
            <Chips options={accountOptions} value={accountId} onChange={setAccountId} />
          </View>
        ) : null}

        {kind === 'transfer' ? (
          <View style={{ gap: space.xs }}>
            <T size={14} muted weight="500">
              إلى حساب
            </T>
            <Chips options={accountOptions.filter((a) => a.value !== accountId)} value={toAccountId} onChange={setToAccountId} />
          </View>
        ) : null}

        {def.hasCategories ? (
          <View style={{ gap: space.xs }}>
            <T size={14} muted weight="500">
              التصنيف
            </T>
            <Chips
              options={[...(categories[0]?.kind === kind ? categories : []).map((c) => ({ value: c.id, label: c.name })), { value: -1, label: '+ تصنيف جديد' }]}
              value={categoryId}
              onChange={(v) => (v === -1 ? addCategory() : setCategoryId(v === categoryId ? null : v))}
            />
          </View>
        ) : null}

        <DateField value={date} onChange={setDate} />

        <Field label="ملاحظة (اختياري)" value={note} onChangeText={setNote} multiline placeholder="رقم الفاتورة، تفاصيل…" />

        <Button title="حفظ" onPress={save} loading={saving} />
        {editingId ? <Button title="مسح الحركة" variant="ghost" onPress={remove} /> : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
