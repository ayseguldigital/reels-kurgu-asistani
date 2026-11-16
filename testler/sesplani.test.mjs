// Ses planının testleri:  node --test testler/*.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { sesPlani, OLAGAN_SES } from '../skills/reels-kurgu/ortak/sesplani.mjs';
import { KART_TURLERI } from '../skills/reels-kurgu/ortak/kartlar.mjs';
import { turkceEksikleri } from '../skills/reels-kurgu/ortak/fontlar.mjs';

const SESLER_KLASORU = new URL('../skills/reels-kurgu/sesler/', import.meta.url);
const sesler = JSON.parse(readFileSync(new URL('sesler.json', SESLER_KLASORU), 'utf8'));
const kartlar = [
  { tur: 'baslik', bas: 1, bit: 3.5, metin: 'a' },
  { tur: 'liste', bas: 5, bit: 9, maddeler: [{ metin: 'x', an: 5.5 }, { metin: 'y', an: 6.2 }] },
  { tur: 'sayi', bas: 10, bit: 12.5, deger: 5 },
  { tur: 'yakinlas', bas: 13, bit: 14.5 },
];

test('her ses dosyası yerinde ve her kart türünün olağan sesi listede var', () => {
  for (const s of sesler) assert.ok(existsSync(new URL(`${s.ad}.wav`, SESLER_KLASORU)), `${s.ad}.wav yok`);
  const adlar = new Set(sesler.map((s) => s.ad));
  for (const tur of Object.keys(KART_TURLERI)) {
    assert.ok(tur in OLAGAN_SES, `${tur} için olağan ses tanımlı değil`);
    if (OLAGAN_SES[tur]) assert.ok(adlar.has(OLAGAN_SES[tur]), `${OLAGAN_SES[tur]} sesi pakette yok`);
  }
  for (const ad of ['tik', 'tok', 'cin', 'para', 'klavye']) assert.ok(adlar.has(ad));
});

test('"yok" ayarında ses çalmaz, "az" ayarında kart başına tek ses', () => {
  assert.equal(sesPlani(kartlar, 'yok', sesler, 20).olaylar.length, 0);
  const az = sesPlani(kartlar, 'az', sesler, 20).olaylar;
  assert.deepEqual(az.map((o) => o.ad), ['whoosh', 'gecis', 'gecis']);
  assert.ok(!az.some((o) => o.kart === 3), 'yakınlaşma sessiz olmalı');
});

test('"cok" ayarında maddelerde tık ve sayıda çın eklenir', () => {
  const cok = sesPlani(kartlar, 'cok', sesler, 20).olaylar;
  assert.equal(cok.filter((o) => o.ad === 'tik').length, 2);
  assert.equal(cok.filter((o) => o.ad === 'cin').length, 1);
});

test('sesin en yüksek anı kartın girişine denk gelir', () => {
  const [ilk] = sesPlani(kartlar, 'az', sesler, 20).olaylar;
  const whoosh = sesler.find((s) => s.ad === 'whoosh');
  assert.ok(Math.abs(ilk.an + whoosh.zirve - (1 + 0.06)) < 0.002);
  assert.ok(ilk.an < 1, 'whoosh karttan önce başlamalı');
});

test('kart başına "ses": false susturur, "ses": "para" değiştirir, bilinmeyen ad hata verir', () => {
  const p = sesPlani(
    [{ tur: 'baslik', bas: 1, bit: 3, ses: false }, { tur: 'sayi', bas: 5, bit: 7, ses: 'para' }, { tur: 'etiket', bas: 9, bit: 11, ses: 'davul' }],
    'az', sesler, 20,
  );
  assert.deepEqual(p.olaylar.map((o) => o.ad), ['para']);
  assert.equal(p.hatalar.length, 1);
  assert.match(p.hatalar[0], /"davul" diye bir ses yok/);
});

test('stil "yok" dese de karta elle yazılan ses çalar', () => {
  const p = sesPlani([{ tur: 'sayi', bas: 5, bit: 7, ses: 'para' }, { tur: 'baslik', bas: 1, bit: 3 }], 'yok', sesler, 20);
  assert.deepEqual(p.olaylar.map((o) => o.ad), ['para']);
});

test('üst üste binen sesler seyreltilir, video dışına taşan ses atılır', () => {
  const p = sesPlani(
    [{ tur: 'etiket', bas: 2, bit: 4 }, { tur: 'etiket', bas: 2.03, bit: 4 }, { tur: 'etiket', bas: 19.99, bit: 20 }],
    'az', sesler, 20,
  );
  assert.equal(p.olaylar.length, 1);
});

test('ses düzeyi ayarı bütün efektlere eklenir', () => {
  const olagan = sesPlani(kartlar, 'az', sesler, 20).olaylar[0].kazanc;
  const kisik = sesPlani(kartlar, 'az', sesler, 20, -6).olaylar[0].kazanc;
  assert.equal(kisik, olagan - 6);
});

test('sıkıştırılmış yazı tipinde Türkçe harf kontrolü "bakılamadı" der', async () => {
  const yol = new URL('../skills/reels-kurgu/fontlar/inter/inter-400-900-latin.woff2', import.meta.url).pathname;
  assert.equal(await turkceEksikleri(decodeURIComponent(yol)), null);
});
