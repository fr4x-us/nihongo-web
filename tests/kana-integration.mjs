import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { mkdir } from 'node:fs/promises';
import { createClient } from '@supabase/supabase-js';
import { chromium } from 'playwright';
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
assert.ok(url && ['127.0.0.1','localhost'].includes(new URL(url).hostname), 'Pengujian hanya untuk Supabase lokal.');
const admin = createClient(url,process.env.SUPABASE_TEST_SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:3000';
function ok(result) { assert.equal(result.error,null,result.error?.message); return result.data; }
const browser = await chromium.launch({executablePath:process.env.CHROMIUM_PATH || '/usr/bin/chromium',headless:true,args:['--no-sandbox']});
const page = await browser.newPage({viewport:{width:375,height:900}});
const pageErrors=[]; page.on('pageerror',error => pageErrors.push(error.message));
let userId;
const reads = {'か':'ka','き':'ki','く':'ku','け':'ke','こ':'ko'};
async function learnKa() {
  await page.goto(base+'/kana/learn?script=hiragana&row=ka');
  await page.getByRole('button',{name:'Mulai belajar',exact:true}).click();
  for (let i=0;i<5;i++) {
    const flip=page.getByRole('button',{name:/Soal. Balik untuk melihat jawaban/});
    await flip.focus(); await flip.press(i%2 ? 'Space' : 'Enter');
    await page.getByRole('button',{name:/Jawaban. Balik untuk melihat soal/}).waitFor();
    if(i===0) await page.screenshot({path:'test-results/kana-learn-375.png',fullPage:true});
    await page.getByRole('button',{name:i===4?'Selesaikan baris':'Kartu berikutnya',exact:true}).click();
  }
  await page.getByRole('heading',{name:'Baris ka selesai!',exact:true}).waitFor();
}
try {
  await mkdir('test-results',{recursive:true});
  const email=`kana-${randomUUID()}@example.test`; const password=randomUUID()+'Aa!';
  userId=ok(await admin.auth.admin.createUser({email,password,email_confirm:true})).user.id;
  await page.goto(base+'/login');
  await page.getByLabel('Email',{exact:true}).fill(email);await page.getByLabel('Kata sandi',{exact:true}).fill(password);
  await page.locator('form').getByRole('button',{name:'Masuk',exact:true}).click();await page.waitForURL('**/dashboard');
  await page.goto(base+'/kana/quiz?row=learned');
  await page.getByText('0 kana sudah dipelajari untuk script ini.',{exact:true}).waitFor();
  await page.getByRole('button',{name:'Mulai kuis',exact:true}).click();await page.getByText(/Belum ada kana yang bisa ditanyakan/).waitFor();
  await page.goto(base+'/kana');
  for(const width of [375,1280]) {
    await page.setViewportSize({width,height:900});
    await page.getByRole('button',{name:'し, shi',exact:true}).waitFor();
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    await page.screenshot({path:`test-results/kana-table-${width}.png`,fullPage:true});
  }
  await page.setViewportSize({width:375,height:900});
  await page.getByRole('tab',{name:'Katakana',exact:true}).click();
  await page.getByRole('button',{name:'シ, shi',exact:true}).click();
  await page.getByRole('dialog',{name:'Kenali kana'}).waitFor();
  await page.screenshot({path:'test-results/kana-panel-375.png',fullPage:true});
  await page.keyboard.press('Escape');assert.equal(await page.getByRole('dialog').count(),0);
  await page.getByRole('button',{name:'Yoon',exact:true}).click();
  await page.getByRole('button',{name:'シャ, sha',exact:true}).waitFor();
  await page.screenshot({path:'test-results/kana-yoon-375.png',fullPage:true});
  await learnKa();
  const cards=ok(await admin.from('cards').select('*').eq('user_id',userId).eq('item_type','kana').order('item_id'));
  assert.equal(cards.length,5);assert.deepEqual(cards.map(c=>c.item_id).sort(),['hira:ka','hira:ke','hira:ki','hira:ko','hira:ku']);
  for(const card of cards){assert.equal(card.ease,2.5);assert.equal(card.interval_days,0);assert.equal(card.repetitions,0);assert.equal(card.lapses,0);assert.ok(card.due_at);}
  console.log('PASS: belajar baris ka lewat keyboard menyimpan 5 kartu dengan default database.');
  const oldDue='2030-01-02T03:04:05+00:00';
  ok(await admin.from('cards').update({ease:3,interval_days:14,repetitions:7,lapses:2,due_at:oldDue}).eq('user_id',userId).eq('item_id','hira:ka'));
  await learnKa();
  const repeated=ok(await admin.from('cards').select('*').eq('user_id',userId));assert.equal(repeated.length,5);
  const saved=repeated.find(c=>c.item_id==='hira:ka');assert.equal(saved.ease,3);assert.equal(saved.interval_days,14);assert.equal(saved.repetitions,7);assert.equal(saved.lapses,2);assert.equal(Date.parse(saved.due_at),Date.parse(oldDue));
  console.log('PASS: penyelesaian ulang tetap 5 kartu dan seluruh nilai SRS lama utuh.');
  await page.getByRole('link',{name:'Kuis baris ini',exact:true}).click();await page.waitForURL('**/kana/quiz?script=hiragana&row=ka');
  assert.equal(await page.getByLabel('Cakupan',{exact:true}).inputValue(),'ka');
  await page.getByRole('button',{name:'Mulai kuis',exact:true}).click();
  for(let i=0;i<5;i++){
    const char=(await page.getByLabel('Soal',{exact:true}).innerText()).trim(); const correct=reads[char];assert.ok(correct);
    const options=page.getByRole('group',{name:'Pilih satu jawaban'}).getByRole('button');assert.equal(await options.count(),4);
    const labels=await options.allTextContents();const chosen=i===0?labels.find(s=>s!==correct):correct;
    const choice=page.getByRole('button',{name:chosen,exact:true});await choice.focus();await choice.press('Enter');
    if(i===0) {await page.getByText(/Belum tepat/).waitFor();await page.screenshot({path:'test-results/kana-quiz-375.png',fullPage:true});}
    await page.getByRole('button',{name:i===4?'Lihat hasil':'Soal berikutnya',exact:true}).click();
  }
  await page.getByText('Skor 4 / 5',{exact:true}).waitFor();
  let logs=ok(await admin.from('review_logs').select('item_id,grade').eq('user_id',userId));assert.equal(logs.length,5);assert.equal(logs.filter(l=>l.grade===1).length,1);assert.equal(logs.filter(l=>l.grade===5).length,4);
  await page.getByRole('button',{name:'Ulangi soal yang salah',exact:true}).click();await page.getByText(/Soal 1 dari 1/).waitFor();
  const char=(await page.getByLabel('Soal',{exact:true}).innerText()).trim();await page.getByRole('button',{name:reads[char],exact:true}).click();await page.getByRole('button',{name:'Lihat hasil',exact:true}).click();await page.getByText('Skor 1 / 1',{exact:true}).waitFor();
  logs=ok(await admin.from('review_logs').select('grade').eq('user_id',userId));assert.equal(logs.length,6);assert.equal(logs.filter(l=>l.grade===5).length,5);
  console.log('PASS: kuis baris ka, skor 4/5, ulang hanya satu soal salah, 6 log dengan grade 1/5 sesuai jawaban.');
  await page.goto(base+'/kana');await page.getByRole('region',{name:'Baris ka',exact:true}).getByText('✓ Dipelajari',{exact:true}).waitFor();
  await page.goto(base+'/kana/quiz?row=learned');await page.getByText('5 kana sudah dipelajari untuk script ini.',{exact:true}).waitFor();
  await page.setViewportSize({width:1280,height:900});await page.screenshot({path:'test-results/kana-quiz-setup-1280.png',fullPage:true});
  await page.getByLabel('Jenis kana',{exact:true}).selectOption('katakana');await page.getByText('0 kana sudah dipelajari untuk script ini.',{exact:true}).waitFor();
  await page.getByLabel('Jenis kana',{exact:true}).selectOption('hiragana');await page.getByLabel('Cakupan',{exact:true}).selectOption('da');await page.getByLabel('Arah soal',{exact:true}).selectOption('romaji-kana');
  await page.getByRole('button',{name:'Mulai kuis',exact:true}).click();await page.getByText(/Soal 1 dari 3/).waitFor();
  assert.ok(['da','de','do'].includes((await page.getByLabel('Soal',{exact:true}).innerText()).trim()));
  assert.deepEqual(pageErrors,[]);
  console.log('PASS: penanda dipelajari, cakupan progres per script, soal ambigu dilewati, viewport 375/1280 tanpa pageerror.');
} finally { await browser.close(); if(userId)ok(await admin.auth.admin.deleteUser(userId)); }
