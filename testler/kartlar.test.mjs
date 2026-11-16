// Grafik kartlarının denetim ve zamanlama testleri:  node --test testler/*.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { kartlariCoz, zeminAraliklari, KART_TURLERI } from '../skills/reels-kurgu/ortak/kartlar.mjs';

// 20 saniyelik video; kaynak kelime numaraları 10–19, her biri 2 saniyede bir. 13 numara kesilmiş.
const kesim = {
  sure: 20,
  kelimeler: [10, 11, 12, 14, 15, 16, 17, 18, 19].map((i, n) => ({ i, m: `k${i}`, bas: n * 2, bit: n * 2 + 1 })),
};

test('kart bağlandığı kelimeden hemen önce başlar ve türün süresi kadar kalır', () => {
  const { kartlar, hatalar } = kartlariCoz([{ tur: 'baslik', metin: 'Merhaba', kelime: 11 }], kesim);
  assert.equal(hatalar.length, 0);
  assert.ok(Math.abs(kartlar[0].bas - 1.94) < 1e-9);
  assert.ok(Math.abs(kartlar[0].bit - (1.94 + KART_TURLERI.baslik.sure)) < 1e-9);
});

test('kesilmiş kelimeye bağlanan kart hata verir', () => {
  const { hatalar } = kartlariCoz([{ tur: 'etiket', metin: 'x', kelime: 13 }], kesim);
  assert.equal(hatalar.length, 1);
  assert.match(hatalar[0], /13 numaralı kelime/);
});

test('bilinmeyen tür ve eksik alan anlaşılır hata verir', () => {
  const { hatalar } = kartlariCoz([{ tur: 'balon', kelime: 10 }, { tur: 'liste', kelime: 10 }, { tur: 'baslik', metin: 'x' }], kesim);
  assert.equal(hatalar.length, 3);
  assert.match(hatalar[0], /bilinmeyen tür/);
  assert.match(hatalar[1], /"maddeler" alanı eksik/);
  assert.match(hatalar[2], /ne zaman çıkacağı belli değil/);
});

test('liste maddeleri sırayla belirir; kelimeye bağlı madde o kelimede çıkar', () => {
  const { kartlar } = kartlariCoz(
    [{ tur: 'liste', kelime: 10, maddeler: ['bir', { metin: 'iki', kelime: 12 }, 'üç'] }],
    kesim,
  );
  const [a, b, c] = kartlar[0].maddeler.map((m) => m.an);
  assert.ok(a < b && b < c);
  assert.ok(Math.abs(b - 3.94) < 1e-9);
  assert.ok(Math.abs(kartlar[0].bit - (c + 1.8)) < 1e-9);
  assert.equal(kartlar[0].zemin, true);
});

test('çağrı video bitene kadar kalır; bitiş videoyu aşmaz', () => {
  const { kartlar } = kartlariCoz([{ tur: 'cagri', metin: 'Yaz', kelime: 18 }, { tur: 'sayi', deger: 5, kelime: 19 }], kesim);
  assert.equal(kartlar[0].bit, 20);
  assert.ok(kartlar[1].bit <= 20);
});

test('bitKelime ve sure bitişi belirler', () => {
  const { kartlar } = kartlariCoz(
    [{ tur: 'etiket', metin: 'a', kelime: 10, bitKelime: 12 }, { tur: 'etiket', metin: 'b', kelime: 15, sure: 1 }],
    kesim,
  );
  assert.ok(Math.abs(kartlar[0].bit - 5.3) < 1e-9);
  assert.ok(Math.abs(kartlar[1].bit - kartlar[1].bas - 1) < 1e-9);
});

test('aynı bölgede üst üste binen kartlar uyarı verir', () => {
  const { uyarilar } = kartlariCoz(
    [{ tur: 'baslik', metin: 'a', kelime: 10, sure: 5 }, { tur: 'sayi', deger: 3, kelime: 11 }],
    kesim,
  );
  assert.ok(uyarilar.some((u) => /üst üste/.test(u)));
});

test('konuşmacı küçülmüşken yakınlaşma atlanır', () => {
  const { kartlar, uyarilar } = kartlariCoz(
    [{ tur: 'liste', kelime: 10, maddeler: ['a', 'b'] }, { tur: 'yakinlas', kelime: 11 }, { tur: 'yakinlas', kelime: 18 }],
    kesim,
  );
  assert.equal(kartlar.filter((k) => k.tur === 'yakinlas').length, 1);
  assert.ok(uyarilar.some((u) => /Yakınlaşma/.test(u)));
});

test('art arda gelen zeminli kartların aralıkları birleşir', () => {
  const a = zeminAraliklari([
    { zemin: true, bas: 1, bit: 3 },
    { zemin: true, bas: 3.4, bit: 6 },
    { zemin: false, bas: 6.1, bit: 7 },
    { zemin: true, bas: 9, bit: 10 },
  ]);
  assert.deepEqual(a, [[1, 6], [9, 10]]);
});
