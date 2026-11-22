import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { mkdir } from 'node:fs/promises';
import { createClient } from '@supabase/supabase-js';
import { chromium } from 'playwright';

// Sengaja hanya menerima Supabase lokal agar tidak membuat data uji di produksi.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_TEST_SERVICE_ROLE_KEY;
const baseURL = process.env.TEST_BASE_URL || 'http://127.0.0.1:3000';
assert.ok(url && ['127.0.0.1', 'localhost'].includes(new URL(url).hostname), 'Gunakan Supabase lokal.');
assert.ok(anonKey && serviceKey, 'Siapkan key lokal melalui environment, bukan kode.');
const opts = { auth: { persistSession: false, autoRefreshToken: false } };
const admin = createClient(url, serviceKey, opts);
const client = createClient(url, anonKey, opts);
const anonymous = createClient(url, anonKey, opts);
const email = `test-${randomUUID()}@example.test`;
const password = `Nw-${randomUUID()}!`;
const users = [];
let questionId;
let browser;
function ok(result) { assert.equal(result.error, null, result.error?.message); return result.data; }
try {
  browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 375, height: 812 } });
  await mkdir('test-results', { recursive: true });
  for (const width of [375, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(baseURL);
    await page.getByRole('heading', { name: 'Nihongo Wakaranai.' }).waitFor();
    assert.equal(await page.locator('article').count(), 4);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `Landing overflow ${width}`);
    await page.screenshot({ path: `test-results/landing-${width}.png`, fullPage: true });
  }
  for (const path of ['dashboard', 'kana', 'review', 'vocab', 'kanji', 'grammar', 'jlpt']) {
    await page.goto(`${baseURL}/${path}`);
    await page.waitForURL('**/login');
  }
  console.log('PASS: semua halaman privat mengarah ke /login tanpa sesi.');
  await page.setViewportSize({ width: 375, height: 812 });
  await page.getByRole('button', { name: 'Daftar', exact: true }).click();
  await page.getByLabel('Nama panggilan').fill('Pelajar Uji');
  await page.getByLabel('Email', { exact: true }).fill(email);
  await page.getByLabel('Kata sandi', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Buat Akun', exact: true }).click();
  await page.waitForURL('**/dashboard');
  const login = ok(await client.auth.signInWithPassword({ email, password }));
  users.push(login.user.id);
  const profile = ok(await client.from('profiles').select('*').eq('id', login.user.id).single());
  assert.equal(profile.display_name, 'Pelajar Uji'); assert.equal(profile.plan, 'free');
  console.log('PASS: daftar melalui UI dan profil otomatis dengan plan free.');
  for (const change of [{ plan: 'premium' }, { plan_expires_at: '2099-01-01T00:00:00Z' }, { display_name: 'Bypass', plan: 'premium' }]) {
    const result = await client.from('profiles').update(change).eq('id', login.user.id).select();
    assert.equal(result.error?.code, '42501');
    console.log(`PASS: update klien ${Object.keys(change).join(', ')} ditolak (${result.status}, SQLSTATE ${result.error.code}).`);
  }
  const upsert = await client.from('profiles').upsert({ id: login.user.id, plan: 'premium' });
  assert.equal(upsert.error?.code, '42501');
  ok(await client.from('profiles').update({ display_name: 'Nama Baru' }).eq('id', login.user.id));
  assert.equal(ok(await client.from('profiles').select('plan').single()).plan, 'free');
  ok(await admin.from('profiles').update({ plan: 'premium' }).eq('id', login.user.id));
  assert.equal(ok(await client.from('profiles').select('plan').single()).plan, 'premium');
  console.log('PASS: upsert plan ditolak, nama dapat diubah, service role dapat mengubah plan.');
  const second = ok(await admin.auth.admin.createUser({ email: `test-${randomUUID()}@example.test`, password, email_confirm: true, user_metadata: { plan: 'premium' } }));
  users.push(second.user.id);
  assert.equal(ok(await admin.from('profiles').select('plan').eq('id', second.user.id).single()).plan, 'free');
  assert.deepEqual(ok(await client.from('profiles').select('*').eq('id', second.user.id)), []);
  assert.deepEqual(ok(await client.from('profiles').update({ display_name: 'Dilarang' }).eq('id', second.user.id).select()), []);
  questionId = ok(await admin.from('questions').insert({ section: 'moji_goi', jlpt_level: 5, prompt: 'Uji', choices: ['a', 'b'], answer_index: 0, explanation_id: 'Penjelasan uji' }).select('id').single()).id;
  const rows = {
    cards: { item_type: 'kana', item_id: 'a' },
    review_logs: { item_type: 'kana', item_id: 'a', grade: 5 },
    question_attempts: { question_id: questionId, chosen_index: 0, correct: true },
    quiz_attempts: { mode: 'practice', jlpt_level: 5, score: 1, total: 1 },
  };
  for (const [table, row] of Object.entries(rows)) {
    ok(await admin.from(table).insert({ ...row, user_id: second.user.id }));
    assert.deepEqual(ok(await client.from(table).select('*').eq('user_id', second.user.id)), []);
    assert.ok((await client.from(table).insert({ ...row, user_id: second.user.id })).error);
    assert.deepEqual(ok(await client.from(table).update(row).eq('user_id', second.user.id).select()), []);
    assert.deepEqual(ok(await client.from(table).delete().eq('user_id', second.user.id).select()), []);
    ok(await client.from(table).insert({ ...row, user_id: login.user.id }));
  }
  for (const table of ['vocab', 'kanji', 'grammar', 'questions']) {
    ok(await client.from(table).select('*').limit(1));
    assert.ok((await anonymous.from(table).select('*')).error);
    assert.equal((await client.from(table).delete().gte('id', 0)).error?.code, '42501');
  }
  console.log('PASS: isolasi pemilik dan katalog hanya-baca untuk pengguna terautentikasi.');
  await page.goto(`${baseURL}/login`); await page.waitForURL('**/dashboard');
  for (const width of [375, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await page.getByRole('heading', { name: 'Dashboard', exact: true }).waitFor();
    const nav = page.getByRole('navigation', { name: 'Navigasi utama' });
    assert.equal(await nav.getByRole('link').count(), 7);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `Layout overflow ${width}`);
    for (const link of await nav.getByRole('link').all()) {
      const rect = await link.boundingBox();
      assert.ok(rect && rect.x >= 0 && rect.x + rect.width <= width && rect.height >= 44);
    }
    await page.screenshot({ path: `test-results/layout-${width}.png`, fullPage: true });
  }
  for (const [label, path] of [['Kana', 'kana'], ['Review', 'review'], ['Kotoba', 'vocab'], ['Kanji', 'kanji'], ['Bunpou', 'grammar'], ['Latihan JLPT', 'jlpt']]) {
    await page.getByRole('navigation').getByRole('link', { name: label, exact: true }).click();
    await page.waitForURL(`**/${path}`);
    await page.getByRole('heading', { name: label, exact: true }).waitFor();
  }
  await page.getByRole('button', { name: 'Keluar', exact: true }).click();
  await page.waitForURL('**/login');
  await page.goto(`${baseURL}/dashboard`); await page.waitForURL('**/login');
  await page.getByLabel('Email', { exact: true }).fill(email);
  await page.getByLabel('Kata sandi', { exact: true }).fill(password);
  await page.locator('form').getByRole('button', { name: 'Masuk', exact: true }).click();
  await page.waitForURL('**/dashboard');
  await page.reload(); await page.getByRole('heading', { name: 'Dashboard' }).waitFor();
  console.log('PASS: login, reload sesi, redirect /login, navigasi, logout, dan viewport 375/1280.');
} finally {
  await browser?.close();
  // Menangani juga akun yang dibuat UI sebelum assertion pertama gagal.
  const listed = await admin.auth.admin.listUsers();
  for (const user of listed.data?.users ?? []) if (user.email === email && !users.includes(user.id)) users.push(user.id);
  for (const id of users) ok(await admin.auth.admin.deleteUser(id));
  if (questionId) ok(await admin.from('questions').delete().eq('id', questionId));
}
