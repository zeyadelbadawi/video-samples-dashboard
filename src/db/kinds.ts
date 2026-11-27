/**
 * Every money movement in the app is one of these kinds. This file is the single
 * source of truth for how each kind affects account (cash) balances and
 * contact (ليك/عليك) balances. SQL aggregates are generated from it.
 *
 * Contact balance sign: positive = the contact owes me (ليا عنده),
 *                       negative = I owe the contact (عليا له).
 */

export type Kind =
  | 'income'
  | 'expense_business'
  | 'expense_personal'
  | 'tax'
  | 'receivable'
  | 'payable'
  | 'loan_given'
  | 'loan_taken'
  | 'collection'
  | 'repayment'
  | 'transfer';

export type ContactMode = 'none' | 'optional' | 'required';

export interface KindDef {
  label: string;
  /** Short hint shown under the kind in the form. */
  hint: string;
  /** +1 money enters the account, -1 leaves it, 0 no cash movement. Transfer: source side. */
  cash: 1 | -1 | 0;
  /** Effect on the contact balance (see sign convention above). */
  contact: 1 | -1 | 0;
  contactMode: ContactMode;
  needsAccount: boolean;
  hasCategories: boolean;
  /** Report section this kind belongs to. */
  group: 'income' | 'expenses' | 'taxes' | 'debts' | 'transfers';
}

export const KINDS: Record<Kind, KindDef> = {
  income: {
    label: 'دخل',
    hint: 'أتعاب أو أي فلوس دخلت لك كإيراد',
    cash: 1, contact: 0, contactMode: 'optional', needsAccount: true, hasCategories: true, group: 'income',
  },
  expense_business: {
    label: 'مصاريف شغل',
    hint: 'إيجار، مرتبات، كهرباء، انتقالات…',
    cash: -1, contact: 0, contactMode: 'optional', needsAccount: true, hasCategories: true, group: 'expenses',
  },
  expense_personal: {
    label: 'مصاريف شخصية',
    hint: 'بيت، أكل، عربية، علاج…',
    cash: -1, contact: 0, contactMode: 'optional', needsAccount: true, hasCategories: true, group: 'expenses',
  },
  tax: {
    label: 'ضرائب ورسوم',
    hint: 'سداد ضريبة دخل، قيمة مضافة، تأمينات…',
    cash: -1, contact: 0, contactMode: 'none', needsAccount: true, hasCategories: true, group: 'taxes',
  },
  receivable: {
    label: 'دين ليا على حد',
    hint: 'حد بقى عليه فلوس ليك من غير ما فلوس تتحرك (مثلاً أتعاب لسه مادفعهاش)',
    cash: 0, contact: 1, contactMode: 'required', needsAccount: false, hasCategories: false, group: 'debts',
  },
  payable: {
    label: 'دين عليا لحد',
    hint: 'بقى عليك فلوس لحد من غير ما فلوس تتحرك',
    cash: 0, contact: -1, contactMode: 'required', needsAccount: false, hasCategories: false, group: 'debts',
  },
  loan_given: {
    label: 'سلفة إديتها',
    hint: 'فلوس طلعت من حسابك سلفة لحد',
    cash: -1, contact: 1, contactMode: 'required', needsAccount: true, hasCategories: false, group: 'debts',
  },
  loan_taken: {
    label: 'سلفة خدتها',
    hint: 'فلوس دخلت حسابك سلفة من حد',
    cash: 1, contact: -1, contactMode: 'required', needsAccount: true, hasCategories: false, group: 'debts',
  },
  collection: {
    label: 'تحصيل',
    hint: 'حد دفع لك من الفلوس اللي عليه',
    cash: 1, contact: -1, contactMode: 'required', needsAccount: true, hasCategories: false, group: 'debts',
  },
  repayment: {
    label: 'سداد',
    hint: 'دفعت لحد من الفلوس اللي عليك',
    cash: -1, contact: 1, contactMode: 'required', needsAccount: true, hasCategories: false, group: 'debts',
  },
  transfer: {
    label: 'تحويل بين حساباتي',
    hint: 'من بنك لمحفظة، من كاش لبنك…',
    cash: -1, contact: 0, contactMode: 'none', needsAccount: true, hasCategories: false, group: 'transfers',
  },
};

export const KIND_ORDER: Kind[] = [
  'income',
  'expense_business',
  'expense_personal',
  'tax',
  'collection',
  'repayment',
  'loan_given',
  'loan_taken',
  'receivable',
  'payable',
  'transfer',
];

export function isKind(v: unknown): v is Kind {
  return typeof v === 'string' && v in KINDS;
}

/** SQL CASE expression: signed contact effect of a transaction row aliased `t`. */
export function contactEffectSql(alias = 't'): string {
  const parts = (Object.keys(KINDS) as Kind[])
    .filter((k) => KINDS[k].contact !== 0)
    .map((k) => `WHEN '${k}' THEN ${KINDS[k].contact === 1 ? '' : '-'}${alias}.amount`);
  return `(CASE ${alias}.kind ${parts.join(' ')} ELSE 0 END)`;
}

/** SQL CASE expression: signed cash effect on `${alias}.account_id` (source side for transfers). */
export function cashEffectSql(alias = 't'): string {
  const parts = (Object.keys(KINDS) as Kind[])
    .filter((k) => KINDS[k].cash !== 0)
    .map((k) => `WHEN '${k}' THEN ${KINDS[k].cash === 1 ? '' : '-'}${alias}.amount`);
  return `(CASE ${alias}.kind ${parts.join(' ')} ELSE 0 END)`;
}

export const ACCOUNT_TYPES = {
  cash: 'كاش',
  bank: 'بنك',
  wallet: 'محفظة إلكترونية',
} as const;

export type AccountType = keyof typeof ACCOUNT_TYPES;

export const DEFAULT_CATEGORIES: Partial<Record<Kind, string[]>> = {
  income: [
    'أتعاب مراجعة حسابات',
    'أتعاب استشارات',
    'إعداد إقرارات ضريبية',
    'مسك دفاتر',
    'تأسيس شركات',
    'إيراد آخر',
  ],
  expense_business: [
    'إيجار المكتب',
    'مرتبات',
    'كهرباء ومياه',
    'إنترنت وتليفونات',
    'انتقالات',
    'أدوات مكتبية وطباعة',
    'اشتراكات وبرامج',
    'رسوم نقابة وجمعيات',
    'ضيافة',
    'مصروف شغل آخر',
  ],
  expense_personal: [
    'مصاريف البيت',
    'أكل وشرب',
    'عربية وبنزين',
    'علاج',
    'تعليم',
    'ملابس',
    'ترفيه',
    'مصروف شخصي آخر',
  ],
  tax: [
    'ضريبة الدخل',
    'ضريبة القيمة المضافة',
    'ضريبة كسب العمل',
    'خصم وإضافة',
    'تأمينات اجتماعية',
    'دمغة ورسوم حكومية',
  ],
};
