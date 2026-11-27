import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Pressable, ScrollView, Switch, View } from 'react-native';

import { Button, Chips, Field, Row, T } from '@/components/ui';
import { ACCOUNT_TYPES, type AccountType } from '@/db/kinds';
import { createAccount, deleteAccount, getAccount, updateAccount, UserError } from '@/db/queries';
import { amountToInput, parseAmount } from '@/lib/money';
import { useDb } from '@/lib/use-data';
import { space, useTheme } from '@/theme';

export default function AccountEdit() {
  const db = useDb();
  const t = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const editingId = params.id ? Number(params.id) : null;

  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('bank');
  const [opening, setOpening] = useState('');
  const [negative, setNegative] = useState(false);
  const [archived, setArchived] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!editingId) return;
    getAccount(db, editingId).then((a) => {
      if (!a) return;
      setName(a.name);
      setType(a.type);
      setOpening(a.opening_balance ? amountToInput(a.opening_balance) : '');
      setNegative(a.opening_balance < 0);
      setArchived(!!a.archived);
    });
  }, [db, editingId]);

  const save = async () => {
    setSaving(true);
    try {
      const parsed = opening.trim() ? parseAmount(opening) : 0;
      if (parsed === null) throw new UserError('الرصيد الافتتاحي مش رقم صحيح');
      const input = { name, type, opening_balance: negative ? -parsed : parsed };
      if (editingId) await updateAccount(db, editingId, { ...input, archived });
      else await createAccount(db, input);
      router.back();
    } catch (e) {
      Alert.alert('مينفعش يتحفظ', (e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const remove = () => {
    if (!editingId) return;
    Alert.alert('مسح الحساب', 'متأكد؟', [
      { text: 'لأ', style: 'cancel' },
      {
        text: 'امسح',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteAccount(db, editingId);
            router.dismissTo('/accounts');
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
          title: editingId ? 'تعديل حساب' : 'حساب جديد',
          headerLeft: () => (
            <Pressable onPress={() => router.back()} hitSlop={12}>
              <T color={t.primary}>إلغاء</T>
            </Pressable>
          ),
        }}
      />
      <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.lg }} keyboardShouldPersistTaps="handled">
        <View style={{ gap: space.xs }}>
          <T size={14} muted weight="500">
            النوع
          </T>
          <Chips
            options={(Object.keys(ACCOUNT_TYPES) as AccountType[]).map((k) => ({ value: k, label: ACCOUNT_TYPES[k] }))}
            value={type}
            onChange={setType}
          />
        </View>
        <Field
          label="الاسم"
          value={name}
          onChangeText={setName}
          placeholder={type === 'bank' ? 'مثلاً: البنك الأهلي' : type === 'wallet' ? 'مثلاً: فودافون كاش' : 'مثلاً: الخزنة'}
        />
        <Field
          label="الرصيد الافتتاحي (جنيه)"
          value={opening}
          onChangeText={setOpening}
          keyboardType="decimal-pad"
          placeholder="0"
          hint="الرصيد اللي في الحساب النهارده قبل ما تبدأ تسجل حركات"
        />
        <Row>
          <View style={{ flex: 1 }}>
            <T>الرصيد ده عليا (مدين / سحب على المكشوف / قرض)</T>
          </View>
          <Switch value={negative} onValueChange={setNegative} />
        </Row>
        {editingId ? (
          <Row>
            <T>أرشفة (يختفي من الاختيارات)</T>
            <Switch value={archived} onValueChange={setArchived} />
          </Row>
        ) : null}
        <Button title="حفظ" onPress={save} loading={saving} />
        {editingId ? <Button title="مسح الحساب" variant="ghost" onPress={remove} /> : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
