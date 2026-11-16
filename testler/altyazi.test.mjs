// Altyazı üretiminin testleri:  node --test testler/*.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { altyaziUret, srtYaz, ALTYAZI_GENISLIK } from '../skills/reels-kurgu/ortak/altyazi.mjs';

const cumle = 'Artık Reels kurgularını bilgisayarına yaptırabilirsin. Nasıl mı? Hadi gel, birlikte bakalım.';
const kelimeler = cumle.split(' ').map((m, i) => ({ i, m, bas: i * 0.4, bit: i * 0.4 + 0.35 }));
const ayar = (ek = {}) => ({ bicim: 'ifade', boyut: 'orta', harf: 'normal', noktalama: false, ...ek });

test('kelime biçiminde her altyazıda tek kelime olur', () => {
  const a = altyaziUret(kelimeler, ayar({ bicim: 'kelime' }));
  assert.equal(a.length, kelimeler.length);
  assert.ok(a.every((x) => x.kelimeler.length === 1));
});

test('ifade biçimi cümle sonunda bölünür ve en çok dört kelime taşır', () => {
  const a = altyaziUret(kelimeler, ayar());
  assert.ok(a.every((x) => x.kelimeler.length <= 4));
  const metinler = a.map((x) => x.kelimeler.map((k) => k.m).join(' '));
  assert.ok(metinler.includes('Nasıl mı?'));
  assert.ok(!metinler.some((m) => m.includes('yaptırabilirsin Nasıl')));
});

test('nokta ve virgül gizlenir, soru işareti kalır', () => {
  const metin = altyaziUret(kelimeler, ayar()).flatMap((x) => x.kelimeler.map((k) => k.m)).join(' ');
  assert.ok(!metin.includes('.') && !metin.includes(','));
  assert.ok(metin.includes('mı?'));
});

test('Türkçe büyük ve küçük harf doğru çevrilir', () => {
  const k = [{ i: 0, m: 'Işık', bas: 0, bit: 0.4 }, { i: 1, m: 'İyi', bas: 0.4, bit: 0.8 }];
  assert.deepEqual(altyaziUret(k, ayar({ harf: 'kucuk' }))[0].kelimeler.map((x) => x.m), ['ışık', 'iyi']);
  assert.deepEqual(altyaziUret(k, ayar({ harf: 'buyuk' }))[0].kelimeler.map((x) => x.m), ['IŞIK', 'İYİ']);
});

test('düzeltmeler uygulanır, noktalama korunur', () => {
  const k = [{ i: 0, m: 'Cloud,', bas: 0, bit: 0.4 }, { i: 1, m: 'harika!', bas: 0.4, bit: 0.8 }];
  const a = altyaziUret(k, ayar({ noktalama: true }), { Cloud: 'Claude' });
  assert.equal(a[0].kelimeler[0].m, 'Claude,');
});

test('altyazılar üst üste binmez ve sırayla gelir', () => {
  const a = altyaziUret(kelimeler, ayar(), {}, 6);
  for (let n = 1; n < a.length; n++) assert.ok(a[n].bas >= a[n - 1].bit - 1e-9, `${n}. altyazı öncekinin üstüne biniyor`);
  assert.ok(a.at(-1).bit <= 6 + 1e-9);
});

test('uzun kelimede yazı küçülür ve alana sığar', () => {
  const k = [{ i: 0, m: 'kurgulayamayacaklarımızdan', bas: 0, bit: 1 }];
  const a = altyaziUret(k, ayar({ bicim: 'kelime', boyut: 'buyuk' }))[0];
  assert.ok(a.boyut < 140);
  assert.ok(a.boyut * 0.6 * k[0].m.length <= ALTYAZI_GENISLIK + 1);
});

test('srt biçimi doğru yazılır', () => {
  const srt = srtYaz([{ bas: 1.5, bit: 3.25, kelimeler: [{ m: 'Merhaba' }, { m: 'dünya' }] }]);
  assert.equal(srt, '1\n00:00:01,500 --> 00:00:03,250\nMerhaba dünya\n');
});
