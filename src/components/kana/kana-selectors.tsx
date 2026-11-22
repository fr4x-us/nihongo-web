'use client';
import { kanaRows, type KanaScript } from '@/lib/data/kana';
export function ScriptSelect({ value, onChange }: { value: KanaScript; onChange: (script: KanaScript) => void }) {
  return <div><label className="label" htmlFor="kana-script">Jenis kana</label><select id="kana-script" className="input" value={value} onChange={e => onChange(e.target.value as KanaScript)}><option value="hiragana">Hiragana</option><option value="katakana">Katakana</option></select></div>;
}
export function RowSelect({ value, onChange, learnedOption = false }: { value: string; onChange: (row: string) => void; learnedOption?: boolean }) {
  return <div><label className="label" htmlFor="kana-row">{learnedOption ? 'Cakupan' : 'Baris'}</label><select id="kana-row" className="input" value={value} onChange={e => onChange(e.target.value)}>
    {learnedOption && <option value="learned">Semua yang sudah dipelajari</option>}
    {(['basic','dakuten','handakuten','yoon'] as const).map(group => <optgroup key={group} label={{basic:'Dasar',dakuten:'Dakuten',handakuten:'Handakuten',yoon:'Yoon'}[group]}>{kanaRows.filter(r => r.group === group).map(r => <option key={r.row} value={r.row}>Baris {r.row}</option>)}</optgroup>)}
  </select></div>;
}
