import { KanaLearn } from '@/components/kana/kana-learn';
import { parseRow, parseScript } from '@/lib/data/kana';
export default async function Page({ searchParams }: { searchParams: Promise<{ script?: string; row?: string }> }) {
  const params = await searchParams;
  return <KanaLearn initialScript={parseScript(params.script ?? null)} initialRow={parseRow(params.row ?? null)}/>;
}
