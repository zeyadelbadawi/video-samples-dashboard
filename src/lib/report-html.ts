import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

import { KINDS, KIND_ORDER } from '@/db/kinds';
import type { Report } from '@/db/reports';
import { formatDate } from './dates';
import { formatMoney } from './money';

const esc = (s: string | null | undefined) =>
  (s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

const m = (v: number) => `<span class="num">${esc(formatMoney(v))}</span>`;

function change(cur: number, prev: number | undefined): string {
  if (prev === undefined || prev === 0) return '';
  const pct = Math.round(((cur - prev) / Math.abs(prev)) * 100);
  if (pct === 0) return '<small class="muted"> (زي الفترة اللي فاتت)</small>';
  return `<small class="muted"> (${pct > 0 ? '+' : ''}${pct}% عن الفترة اللي فاتت)</small>`;
}

export function reportToHtml(r: Report, title: string): string {
  const p = r.previous;
  const sections = KIND_ORDER.filter((k) => r.kinds[k].count > 0)
    .map((k) => {
      const s = r.kinds[k];
      const cats = s.categories.length
        ? `<table>${s.categories.map((c) => `<tr><td>${esc(c.category)} <small class="muted">(${c.count})</small></td><td class="l">${m(c.total)}</td></tr>`).join('')}</table>`
        : '';
      return `<div class="kind"><div class="row"><b>${esc(KINDS[k].label)}</b><span>${m(s.total)} <small class="muted">(${s.count} حركة)</small></span></div>${cats}</div>`;
    })
    .join('');

  const accounts = r.accounts
    .map((a) => `<tr><td>${esc(a.name)}</td><td class="l">${m(a.in)}</td><td class="l">${m(a.out)}</td><td class="l ${a.closing < 0 ? 'neg' : ''}">${m(a.closing)}</td></tr>`)
    .join('');

  const people = (list: Report['topDebtors'], cls: string) =>
    list.length
      ? `<table>${list.map((c) => `<tr><td>${esc(c.name)}</td><td class="l ${cls}">${m(Math.abs(c.balance))}</td></tr>`).join('')}</table>`
      : '<p class="muted">مفيش</p>';

  const txRows = r.transactions
    .map((t) => {
      const who = [t.contact_name, t.category_name].filter(Boolean).map(esc).join(' · ');
      const acc = t.kind === 'transfer' ? `${esc(t.account_name)} ← ${esc(t.to_account_name)}` : esc(t.account_name);
      return `<tr><td>${esc(formatDate(t.date))}</td><td>${esc(KINDS[t.kind].label)}</td><td>${who}</td><td>${acc}</td><td class="l">${m(t.amount)}</td><td>${esc(t.note)}</td></tr>`;
    })
    .join('');

  return `<!doctype html>
<html lang="ar" dir="rtl"><head><meta charset="utf-8">
<style>
  body { font-family: -apple-system, 'Geeza Pro', sans-serif; color: #111; font-size: 12px; margin: 0; }
  h1 { font-size: 20px; margin: 0 0 4px; } h2 { font-size: 15px; margin: 18px 0 6px; border-bottom: 1px solid #ddd; padding-bottom: 4px; }
  .muted { color: #6b7280; } .pos { color: #0e9f6e; } .neg { color: #e02424; }
  .num { direction: ltr; unicode-bidi: isolate; white-space: nowrap; }
  .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
  .box { border: 1px solid #e5e7eb; border-radius: 8px; padding: 8px; } .box b { display: block; font-size: 14px; margin-top: 2px; }
  table { width: 100%; border-collapse: collapse; } td, th { padding: 4px 6px; border-bottom: 1px solid #f0f0f0; text-align: right; vertical-align: top; }
  th { background: #f6f7f9; font-weight: 600; } .l { text-align: left; }
  .row { display: flex; justify-content: space-between; } .kind { margin-bottom: 10px; }
  .tx td { font-size: 10.5px; }
</style></head><body>
<h1>دفتري — ${esc(title)}</h1>
<div class="muted">من ${esc(formatDate(r.from))} إلى ${esc(formatDate(r.to))} · اتعمل ${esc(formatDate(new Date().toISOString().slice(0, 10)))}</div>

<h2>الملخص</h2>
<div class="grid">
  <div class="box">الدخل<b class="pos">${m(r.income)}</b>${change(r.income, p?.income)}</div>
  <div class="box">مصاريف الشغل<b class="neg">${m(r.businessExpenses)}</b>${change(r.businessExpenses, p?.businessExpenses)}</div>
  <div class="box">مصاريف شخصية<b class="neg">${m(r.personalExpenses)}</b>${change(r.personalExpenses, p?.personalExpenses)}</div>
  <div class="box">ضرائب ورسوم<b class="neg">${m(r.taxes)}</b>${change(r.taxes, p?.taxes)}</div>
  <div class="box">صافي ربح الشغل<b class="${r.netBusinessProfit < 0 ? 'neg' : 'pos'}">${m(Math.abs(r.netBusinessProfit))}${r.netBusinessProfit < 0 ? ' خسارة' : ''}</b><small class="muted">الدخل − مصاريف الشغل − الضرائب</small></div>
  <div class="box">صافي حركة الفلوس<b class="${r.netCashFlow < 0 ? 'neg' : 'pos'}">${m(Math.abs(r.netCashFlow))}${r.netCashFlow < 0 ? ' عجز' : ''}</b><small class="muted">داخل ${m(r.cashIn)} · خارج ${m(r.cashOut)}</small></div>
</div>

<h2>المديونيات في آخر الفترة</h2>
<div class="grid">
  <div class="box">ليك عند الناس<b class="pos">${m(r.owedToMe)}</b></div>
  <div class="box">عليك للناس<b class="neg">${m(r.iOwe)}</b></div>
  <div class="box">الصافي<b class="${r.owedToMe - r.iOwe < 0 ? 'neg' : 'pos'}">${m(Math.abs(r.owedToMe - r.iOwe))}</b></div>
</div>
<div class="grid" style="grid-template-columns: 1fr 1fr; margin-top: 8px">
  <div><b>أكبر اللي عليهم فلوس ليك</b>${people(r.topDebtors, 'pos')}</div>
  <div><b>أكبر اللي ليهم فلوس عندك</b>${people(r.topCreditors, 'neg')}</div>
</div>

<h2>التفاصيل حسب النوع والتصنيف</h2>
${sections || '<p class="muted">مفيش حركات في الفترة دي</p>'}

<h2>البنوك والمحافظ</h2>
<table><tr><th>الحساب</th><th class="l">داخل</th><th class="l">خارج</th><th class="l">الرصيد آخر الفترة</th></tr>${accounts}
<tr><th>الإجمالي</th><th></th><th></th><th class="l">${m(r.closingCash)}</th></tr></table>

<h2>كل الحركات (${r.transactions.length})</h2>
<table class="tx"><tr><th>التاريخ</th><th>النوع</th><th>الشخص / التصنيف</th><th>الحساب</th><th class="l">المبلغ</th><th>ملاحظة</th></tr>${txRows}</table>
</body></html>`;
}

export async function shareReportPdf(r: Report, title: string): Promise<void> {
  const { uri } = await Print.printToFileAsync({ html: reportToHtml(r, title), margins: { top: 36, bottom: 36, left: 28, right: 28 } });
  await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf', dialogTitle: title });
}
