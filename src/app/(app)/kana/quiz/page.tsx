import { KanaQuiz } from '@/components/kana/kana-quiz';
import { parseRow, parseScript } from '@/lib/data/kana';
export default async function Page({ searchParams }: { searchParams: Promise<{ script?: string; row?: string }> }) {
  const params = await searchParams;
  return <KanaQuiz initialScript={parseScript(params.script ?? null)} initialRow={params.row === 'learned' ? 'learned' : parseRow(params.row ?? null)}/>;
}
