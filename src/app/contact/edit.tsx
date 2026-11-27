import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Pressable, ScrollView, View } from 'react-native';

import { Button, Chips, Field, T } from '@/components/ui';
import { createContact, createTransaction, deleteContact, getContact, updateContact, UserError } from '@/db/queries';
import { today } from '@/lib/dates';
import { parseAmount } from '@/lib/money';
import { useDb } from '@/lib/use-data';
import { space, useTheme } from '@/theme';

type Opening = 'none' | 'receivable' | 'payable';

export default function ContactEdit() {
  const db = useDb();
  const t = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string; name?: string }>();
  const editingId = params.id ? Number(params.id) : null;

  const [name, setName] = useState(params.name ?? '');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [opening, setOpening] = useState<Opening>('none');
  const [openingAmount, setOpeningAmount] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!editingId) return;
    getContact(db, editingId).then((c) => {
      if (!c) return;
      setName(c.name);
      setPhone(c.phone ?? '');
      setNotes(c.notes ?? '');
    });
  }, [db, editingId]);

  const save = async () => {
    setSaving(true);
    try {
      const input = { name, phone, notes };
      if (editingId) {
        await updateContact(db, editingId, input);
        router.back();
        return;
      }
      let openingPiasters: number | null = null;
      if (opening !== 'none') {
        openingPiasters = parseAmount(openingAmount);
        if (!openingPiasters) throw new UserError('اكتب مبلغ الرصيد الافتتاحي أو اختار «مفيش»');
      }
      await db.withExclusiveTransactionAsync(async (txn) => {
        const id = await createContact(txn, input);
        if (opening !== 'none' && openingPiasters) {
          await createTransaction(txn, {
            kind: opening,
            date: today(),
            amount: openingPiasters,
            contact_id: id,
            account_id: null,
            to_account_id: null,
            category_id: null,
            note: 'رصيد افتتاحي',
          });
        }
      });
      router.back();
    } catch (e) {
      Alert.alert('مينفعش يتحفظ', e instanceof UserError ? e.message : (e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const remove = () => {
    if (!editingId) return;
    Alert.alert('مسح الشخص', 'متأكد؟', [
      { text: 'لأ', style: 'cancel' },
      {
        text: 'امسح',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteContact(db, editingId);
            router.dismissTo('/contacts');
          } catch (e) {
            Alert.alert('مينفعش', (e as Error).message);
          }
        },
      },
    ]);
  };

  return (
    <KeyboardAvoidingView behavior="padding" style={{ flex: 1, backgroundColor: t.background }}>
      <Stack.Screen
        options={{
          title: editingId ? 'تعديل شخص' : 'شخص جديد',
          headerLeft: () => (
            <Pressable onPress={() => router.back()} hitSlop={12}>
              <T color={t.primary}>إلغاء</T>
            </Pressable>
          ),
        }}
      />
      <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.lg }} keyboardShouldPersistTaps="handled">
        <Field label="الاسم" value={name} onChangeText={setName} placeholder="الاسم بالكامل" autoFocus={!editingId} />
        <Field label="التليفون (اختياري)" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        <Field label="ملاحظات (اختياري)" value={notes} onChangeText={setNotes} multiline />

        {!editingId ? (
          <View style={{ gap: space.sm }}>
            <T size={14} muted weight="500">
              فيه حساب قديم بينكم؟
            </T>
            <Chips
              options={[
                { value: 'none', label: 'مفيش' },
                { value: 'receivable', label: 'ليا عنده' },
                { value: 'payable', label: 'عليا له' },
              ]}
              value={opening}
              onChange={(v) => setOpening(v as Opening)}
            />
            {opening !== 'none' ? (
              <Field label="المبلغ (جنيه)" value={openingAmount} onChangeText={setOpeningAmount} keyboardType="decimal-pad" />
            ) : null}
          </View>
        ) : null}

        <Button title="حفظ" onPress={save} loading={saving} />
        {editingId ? <Button title="مسح الشخص" variant="ghost" onPress={remove} /> : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
