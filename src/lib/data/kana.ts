export type KanaScript = 'hiragana' | 'katakana';
export type KanaGroup = 'basic' | 'dakuten' | 'handakuten' | 'yoon';
export type Kana = Readonly<{
  id: string;
  char: string;
  romaji: string;
  script: KanaScript;
  group: KanaGroup;
  row: string;
}>;

type RowDefinition = { row: string; group: KanaGroup; entries: readonly (readonly [key: string, hiragana: string, katakana: string, romaji: string])[] };
// Key di/du membedakan ぢ/づ dari じ/ず; romaji yang ditampilkan tetap Hepburn ji/zu.
const definitions: readonly RowDefinition[] = [
  { row: 'a', group: 'basic', entries: [['a','あ','ア','a'],['i','い','イ','i'],['u','う','ウ','u'],['e','え','エ','e'],['o','お','オ','o']] },
  { row: 'ka', group: 'basic', entries: [['ka','か','カ','ka'],['ki','き','キ','ki'],['ku','く','ク','ku'],['ke','け','ケ','ke'],['ko','こ','コ','ko']] },
  { row: 'sa', group: 'basic', entries: [['sa','さ','サ','sa'],['shi','し','シ','shi'],['su','す','ス','su'],['se','せ','セ','se'],['so','そ','ソ','so']] },
  { row: 'ta', group: 'basic', entries: [['ta','た','タ','ta'],['chi','ち','チ','chi'],['tsu','つ','ツ','tsu'],['te','て','テ','te'],['to','と','ト','to']] },
  { row: 'na', group: 'basic', entries: [['na','な','ナ','na'],['ni','に','ニ','ni'],['nu','ぬ','ヌ','nu'],['ne','ね','ネ','ne'],['no','の','ノ','no']] },
  { row: 'ha', group: 'basic', entries: [['ha','は','ハ','ha'],['hi','ひ','ヒ','hi'],['fu','ふ','フ','fu'],['he','へ','ヘ','he'],['ho','ほ','ホ','ho']] },
  { row: 'ma', group: 'basic', entries: [['ma','ま','マ','ma'],['mi','み','ミ','mi'],['mu','む','ム','mu'],['me','め','メ','me'],['mo','も','モ','mo']] },
  { row: 'ya', group: 'basic', entries: [['ya','や','ヤ','ya'],['yu','ゆ','ユ','yu'],['yo','よ','ヨ','yo']] },
  { row: 'ra', group: 'basic', entries: [['ra','ら','ラ','ra'],['ri','り','リ','ri'],['ru','る','ル','ru'],['re','れ','レ','re'],['ro','ろ','ロ','ro']] },
  { row: 'wa', group: 'basic', entries: [['wa','わ','ワ','wa'],['wo','を','ヲ','wo']] },
  { row: 'n', group: 'basic', entries: [['n','ん','ン','n']] },
  { row: 'ga', group: 'dakuten', entries: [['ga','が','ガ','ga'],['gi','ぎ','ギ','gi'],['gu','ぐ','グ','gu'],['ge','げ','ゲ','ge'],['go','ご','ゴ','go']] },
  { row: 'za', group: 'dakuten', entries: [['za','ざ','ザ','za'],['ji','じ','ジ','ji'],['zu','ず','ズ','zu'],['ze','ぜ','ゼ','ze'],['zo','ぞ','ゾ','zo']] },
  { row: 'da', group: 'dakuten', entries: [['da','だ','ダ','da'],['di','ぢ','ヂ','ji'],['du','づ','ヅ','zu'],['de','で','デ','de'],['do','ど','ド','do']] },
  { row: 'ba', group: 'dakuten', entries: [['ba','ば','バ','ba'],['bi','び','ビ','bi'],['bu','ぶ','ブ','bu'],['be','べ','ベ','be'],['bo','ぼ','ボ','bo']] },
  { row: 'pa', group: 'handakuten', entries: [['pa','ぱ','パ','pa'],['pi','ぴ','ピ','pi'],['pu','ぷ','プ','pu'],['pe','ぺ','ペ','pe'],['po','ぽ','ポ','po']] },
  { row: 'kya', group: 'yoon', entries: [['kya','きゃ','キャ','kya'],['kyu','きゅ','キュ','kyu'],['kyo','きょ','キョ','kyo']] },
  { row: 'sha', group: 'yoon', entries: [['sha','しゃ','シャ','sha'],['shu','しゅ','シュ','shu'],['sho','しょ','ショ','sho']] },
  { row: 'cha', group: 'yoon', entries: [['cha','ちゃ','チャ','cha'],['chu','ちゅ','チュ','chu'],['cho','ちょ','チョ','cho']] },
  { row: 'nya', group: 'yoon', entries: [['nya','にゃ','ニャ','nya'],['nyu','にゅ','ニュ','nyu'],['nyo','にょ','ニョ','nyo']] },
  { row: 'hya', group: 'yoon', entries: [['hya','ひゃ','ヒャ','hya'],['hyu','ひゅ','ヒュ','hyu'],['hyo','ひょ','ヒョ','hyo']] },
  { row: 'mya', group: 'yoon', entries: [['mya','みゃ','ミャ','mya'],['myu','みゅ','ミュ','myu'],['myo','みょ','ミョ','myo']] },
  { row: 'rya', group: 'yoon', entries: [['rya','りゃ','リャ','rya'],['ryu','りゅ','リュ','ryu'],['ryo','りょ','リョ','ryo']] },
  { row: 'gya', group: 'yoon', entries: [['gya','ぎゃ','ギャ','gya'],['gyu','ぎゅ','ギュ','gyu'],['gyo','ぎょ','ギョ','gyo']] },
  { row: 'ja', group: 'yoon', entries: [['ja','じゃ','ジャ','ja'],['ju','じゅ','ジュ','ju'],['jo','じょ','ジョ','jo']] },
  { row: 'bya', group: 'yoon', entries: [['bya','びゃ','ビャ','bya'],['byu','びゅ','ビュ','byu'],['byo','びょ','ビョ','byo']] },
  { row: 'pya', group: 'yoon', entries: [['pya','ぴゃ','ピャ','pya'],['pyu','ぴゅ','ピュ','pyu'],['pyo','ぴょ','ピョ','pyo']] },
];
export const kana: readonly Kana[] = (['hiragana', 'katakana'] as const).flatMap(script =>
  definitions.flatMap(({ row, group, entries }) => entries.map(([key, hiragana, katakana, romaji]) => ({
    id: `${script === 'hiragana' ? 'hira' : 'kata'}:${key}`, char: script === 'hiragana' ? hiragana : katakana, romaji, script, group, row,
  }))),
);
export const kanaRows = definitions.map(({ row, group }) => ({ row, group }));
export function rowKana(script: KanaScript, row: string): Kana[] { return kana.filter(k => k.script === script && k.row === row); }
export function parseScript(value: string | null): KanaScript { return value === 'katakana' ? 'katakana' : 'hiragana'; }
export function parseRow(value: string | null): string { return kanaRows.some(r => r.row === value) ? value! : 'a'; }
