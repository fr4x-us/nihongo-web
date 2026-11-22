import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { mkdir } from 'node:fs/promises';
import { createClient } from '@supabase/supabase-js';
import { chromium } from 'playwright';
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
assert.ok(url && ['127.0.0.1','localhost'].includes(new URL(url).hostname), 'Pengujian hanya untuk Supabase lokal.');
assert.ok(process.env.SUPABASE_TEST_SERVICE_ROLE_KEY, 'Siapkan service role lokal melalui environment.');
const admin = createClient(url, process.env.SUPABASE_TEST_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const base = process.env.TEST_BASE_URL || 'http://localhost:3000';
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 375, height: 900 } });
const pageErrors = []; page.on('pageerror', error => pageErrors.push(error.message));
let userId;
function ok(result) { assert.equal(result.error, null, result.error?.message); return result.data; }
async function cards() { return ok(await admin.from('cards').select('*').eq('user_id', userId).order('item_id')); }
async function logs() { return ok(await admin.from('review_logs').select('*').eq('user_id', userId).order('id')); }
async function current(char) { await page.getByRole('button', { name: /Soal. Balik untuk melihat jawaban/ }).filter({ hasText: char }).waitFor(); }
async function flip(key = 'Enter') {
  const button = page.getByRole('button', { name: /Soal. Balik untuk melihat jawaban/ });
  await button.focus(); await button.press(key);
  await page.getByRole('group', { name: 'Nilai ingatanmu', exact: true }).waitFor();
}
async function rateWithKeyboard(label) {
  // Fokus tetap pada kartu; Tab membawa ke Lagi, lalu tombol berikutnya.
  const steps = { Lagi: 1, Sulit: 2, Baik: 3, Mudah: 4 }[label];
  for (let i = 0; i < steps; i++) await page.keyboard.press('Tab');
  assert.ok((await page.locator(':focus').innerText()).startsWith(label));
  await page.keyboard.press('Enter');
}
async function capture(name) {
  for (const width of [375, 1280]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.mouse.move(0, 0);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${name}: overflow ${width}`);
    await page.screenshot({ path: `test-results/${name}-${width}.png`, fullPage: true });
  }
  await page.setViewportSize({ width: 375, height: 1000 });
}
function assertScheduled(card, expected, start, end) {
  for (const [key, value] of Object.entries(expected)) if (key !== 'delay') assert.equal(card[key], value, key);
  const due = Date.parse(card.due_at);
  assert.ok(due >= start + expected.delay && due <= end + expected.delay, 'dueAt sesuai waktu penilaian');
}
try {
  await mkdir('test-results', { recursive: true });
  const email = `review-${randomUUID()}@example.test`; const password = randomUUID() + 'Aa!';
  userId = ok(await admin.auth.admin.createUser({ email, password, email_confirm: true })).user.id;
  ok(await admin.from('profiles').update({ display_name: 'Pelajar SRS', streak: 7, xp: 42, last_study_date: '2026-11-20' }).eq('id', userId));
  const seededAt = Date.now();
  const seeds = [
    { item_type: 'kana', item_id: 'hira:a', due_at: new Date(seededAt - 60000).toISOString() },
    { item_type: 'kana', item_id: 'hira:ka', due_at: new Date(seededAt - 50000).toISOString(), interval_days: 6, repetitions: 2 },
    { item_type: 'kana', item_id: 'hira:sa', due_at: new Date(seededAt - 40000).toISOString(), interval_days: 30, repetitions: 5 },
    { item_type: 'kana', item_id: 'kata:a', due_at: new Date(seededAt + 30 * 86400000).toISOString() },
    { item_type: 'vocab', item_id: '1', due_at: new Date(seededAt - 80000).toISOString() },
    { item_type: 'kana', item_id: 'hira:missing', due_at: new Date(seededAt - 90000).toISOString() },
  ];
  for (const seed of seeds) ok(await admin.from('cards').insert({ user_id: userId, ...seed }));
  const before = await cards();
  await page.goto(base + '/login');
  await page.getByLabel('Email', { exact: true }).fill(email); await page.getByLabel('Kata sandi', { exact: true }).fill(password);
  await page.locator('form').getByRole('button', { name: 'Masuk', exact: true }).click(); await page.waitForURL('**/dashboard');
  await page.getByText('Halo, Pelajar SRS!', { exact: true }).waitFor();
  await page.getByRole('heading', { name: 'Jatuh tempo: 3', exact: true }).waitFor();
  await page.getByRole('heading', { name: 'Total kartu: 4', exact: true }).waitFor();
  await page.getByRole('heading', { name: 'Streak: 7 hari', exact: true }).waitFor();
  await capture('srs-dashboard');
  console.log('PASS: seed 6 kartu; dashboard hanya menghitung 3 jatuh tempo dan 4 total kana valid, streak 7.');
  await page.getByRole('link', { name: 'Mulai review', exact: true }).click(); await current('あ');
  await page.getByText('3 kartu dalam sesi · 3 tersisa · 0 penilaian selesai', { exact: true }).waitFor();
  assert.equal(await page.getByRole('group', { name: 'Nilai ingatanmu' }).count(), 0);
  await flip(); await capture('srs-review');
  const errorText = 'Penilaian belum selesai disimpan. Coba lagi untuk melanjutkan kartu ini.';
  const abortUpdate = route => route.request().method() === 'PATCH' ? route.abort('failed') : route.continue();
  await page.route('**/rest/v1/cards?*', abortUpdate);
  const start5 = Date.now(); await rateWithKeyboard('Mudah');
  await page.getByText(errorText, { exact: true }).waitFor();
  assert.equal((await logs()).length, 0); assert.deepEqual(await cards(), before);
  await page.unroute('**/rest/v1/cards?*', abortUpdate);
  await page.getByRole('button', { name: 'Coba lagi', exact: true }).press('Enter'); await current('か');
  let all = await cards(); let logRows = await logs();
  assertScheduled(all.find(c => c.item_id === 'hira:a'), { ease: 2.6, interval_days: 1, repetitions: 1, lapses: 0, delay: 86400000 }, start5, Date.now());
  assert.deepEqual(logRows.map(l => l.grade), [5]);
  console.log('PASS: PATCH abort menahan kartu tanpa log; retry sukses, tepat satu grade 5, interval 1 hari/ease 2.6.');

  // INSERT gagal sesudah UPDATE sukses: retry tidak boleh mengirim UPDATE lagi.
  await flip('Space');
  const abortLog = route => route.request().method() === 'POST' ? route.abort('failed') : route.continue();
  await page.route('**/rest/v1/review_logs?*', abortLog);
  // INSERT tanpa parameter query juga dicakup.
  await page.route('**/rest/v1/review_logs', abortLog);
  let updates = 0;
  const countUpdate = request => { if (request.method() === 'PATCH' && request.url().includes('/rest/v1/cards')) updates++; };
  page.on('request', countUpdate);
  const start4 = Date.now(); await rateWithKeyboard('Baik');
  await page.getByText(errorText, { exact: true }).waitFor();
  assert.equal((await logs()).length, 1);
  const afterUpdate = (await cards()).find(c => c.item_id === 'hira:ka');
  assertScheduled(afterUpdate, { ease: 2.5, interval_days: 15, repetitions: 3, lapses: 0, delay: 15 * 86400000 }, start4, Date.now());
  assert.equal(updates, 1);
  await page.unroute('**/rest/v1/review_logs?*', abortLog); await page.unroute('**/rest/v1/review_logs', abortLog);
  await page.getByRole('button', { name: 'Coba lagi', exact: true }).click(); await current('さ');
  assert.equal(updates, 1); page.off('request', countUpdate);
  assert.deepEqual((await logs()).map(l => l.grade), [5, 4]);
  assert.deepEqual((await cards()).find(c => c.item_id === 'hira:ka'), afterUpdate);
  console.log('PASS: INSERT gagal setelah UPDATE; retry hanya log, tanpa UPDATE ulang atau log ganda.');

  await flip(); const start1 = Date.now(); await rateWithKeyboard('Lagi');
  await page.getByText('3 kartu dalam sesi · 1 tersisa · 3 penilaian selesai', { exact: true }).waitFor(); await current('さ');
  all = await cards(); logRows = await logs();
  assertScheduled(all.find(c => c.item_id === 'hira:sa'), { ease: 2.3, interval_days: 0, repetitions: 0, lapses: 1, delay: 600000 }, start1, Date.now());
  assert.deepEqual(logRows.map(l => l.grade), [5, 4, 1]);
  // Kartu Lagi dimunculkan lagi dengan state baru (preview satu hari, bukan interval lama 30 hari).
  await flip('Space');
  await page.getByRole('button', { name: 'Sulit 1 hari', exact: true }).waitFor();
  const start3 = Date.now(); await rateWithKeyboard('Sulit');
  await page.getByRole('heading', { name: 'Review selesai', exact: true }).waitFor();
  await page.getByText('Jumlah penilaian: 4', { exact: true }).waitFor();
  logRows = await logs(); assert.deepEqual(logRows.map(l => l.grade), [5, 4, 1, 3]);
  all = await cards();
  assertScheduled(all.find(c => c.item_id === 'hira:sa'), { ease: 2.16, interval_days: 1, repetitions: 1, lapses: 1, delay: 86400000 }, start3, Date.now());
  for (const id of ['kata:a', '1', 'hira:missing']) assert.deepEqual(all.find(c => c.item_id === id), before.find(c => c.item_id === id));
  const profile = ok(await admin.from('profiles').select('streak,xp,last_study_date').eq('id', userId).single());
  assert.deepEqual(profile, { streak: 7, xp: 42, last_study_date: '2026-11-20' });
  await capture('srs-summary');
  console.log('PASS: grade 1 kembali ke akhir antrean memakai state terbaru; log tepat [5,4,1,3], profil dan 3 kartu pengecualian utuh.');
  await page.getByRole('link', { name: 'Kembali ke dashboard', exact: true }).click();
  await page.getByRole('heading', { name: 'Jatuh tempo: 0', exact: true }).waitFor();
  assert.ok(await page.getByRole('button', { name: 'Mulai review', exact: true }).isDisabled());
  await page.goto(base + '/review'); await page.getByRole('heading', { name: 'Belum ada kartu jatuh tempo', exact: true }).waitFor();
  await page.getByRole('link', { name: 'Belajar kana', exact: true }).waitFor(); await capture('srs-empty');

  // Kegagalan query dashboard dapat dipulihkan.
  const abortRead = route => route.request().method() === 'GET' ? route.abort('failed') : route.continue();
  await page.route('**/rest/v1/cards?*', abortRead); await page.goto(base + '/dashboard');
  await page.getByText('Dashboard belum dapat dimuat. Silakan coba lagi.', { exact: true }).waitFor();
  await page.unroute('**/rest/v1/cards?*', abortRead); await page.getByRole('button', { name: 'Coba lagi', exact: true }).click();
  await page.getByRole('heading', { name: 'Jatuh tempo: 0', exact: true }).waitFor();
  // Respons INSERT hilang setelah commit di server: retry harus membaca log yang sudah ada.
  ok(await admin.from('cards').update({ due_at: new Date(Date.now() - 1000).toISOString() }).eq('user_id', userId).eq('item_id', 'hira:a'));
  await page.goto(base + '/review'); await current('あ'); await flip();
  let inserted = 0;
  const loseResponse = async route => {
    if (route.request().method() !== 'POST') return route.continue();
    await route.fetch(); inserted++; await route.abort('failed');
  };
  await page.route('**/rest/v1/review_logs', loseResponse);
  await page.getByRole('button', { name: 'Baik 6 hari', exact: true }).evaluate(button => { button.click(); button.click(); });
  await page.getByText(errorText, { exact: true }).waitFor();
  assert.equal(inserted, 1); assert.equal((await logs()).length, 5);
  await page.unroute('**/rest/v1/review_logs', loseResponse);
  await page.getByRole('button', { name: 'Coba lagi', exact: true }).click();
  await page.getByRole('heading', { name: 'Review selesai', exact: true }).waitFor();
  assert.equal((await logs()).length, 5);
  console.log('PASS: klik ganda terkunci; respons INSERT hilang dipulihkan lewat readback tanpa log ganda.');

  // ID tak dikenal di depan antrean tidak mengurangi batas 20 kartu valid.
  ok(await admin.from('cards').delete().eq('user_id', userId));
  const ids = ['a','i','u','e','o','ka','ki','ku','ke','ko','sa','shi','su','se','so','ta','chi','tsu','te','to','na'];
  const limitNow = Date.now();
  ok(await admin.from('cards').insert([{ user_id: userId, item_type: 'kana', item_id: 'hira:missing', due_at: new Date(limitNow - 100000).toISOString() }, ...ids.map((id, i) => ({ user_id: userId, item_type: 'kana', item_id: `hira:${id}`, due_at: new Date(limitNow - 50000 + i * 100).toISOString() }))]));
  await page.goto(base + '/dashboard'); await page.getByRole('heading', { name: 'Jatuh tempo: 21', exact: true }).waitFor();
  await page.getByRole('link', { name: 'Mulai review', exact: true }).click();
  await page.getByText('20 kartu dalam sesi · 20 tersisa · 0 penilaian selesai', { exact: true }).waitFor(); await current('あ');
  console.log('PASS: dashboard menghitung 21 valid; sesi hanya 20, ID tak dikenal dilewati sebelum batas sesi.');
  assert.deepEqual(pageErrors, []);
  console.log('PASS: dashboard akhir 0, empty state, pemulihan error query, keyboard Enter/Spasi/Tab, viewport 375/1280 tanpa pageerror.');
} finally { await browser.close(); if (userId) ok(await admin.auth.admin.deleteUser(userId)); }
