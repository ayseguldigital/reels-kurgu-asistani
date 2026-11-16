// Zaman çekirdeğinin testleri:  node --test testler/
import test from 'node:test';
import assert from 'node:assert/strict';
import { planla, kareyeOturt, satirlaraBol, TEMPOLAR } from '../skills/reels-kurgu/ortak/zaman.mjs';

// 0–1 sn: "bir", 1–2: "iki", (2 sn duraklama) 4–5: "üç", 5–6: "dört", 6–7: "beş"
const dokum = {
  sure: 10,
  kelimeler: [
    { m: 'bir', bas: 0.5, bit: 1 },
    { m: 'iki', bas: 1, bit: 2 },
    { m: 'üç', bas: 4, bit: 5 },
    { m: 'dört', bas: 5, bit: 6 },
    { m: 'beş', bas: 6, bit: 7 },
  ],
};
const tempo = TEMPOLAR.dengeli; // duraklamaEnAz 0.45, pay 0.1
const yakin = (a, b, pay = 1e-6) => assert.ok(Math.abs(a - b) <= pay, `${a} ≠ ${b}`);

test('karar yokken yalnızca uzun duraklama kısalır', () => {
  const p = planla(dokum, {}, tempo);
  assert.equal(p.parcalar.length, 2);
  yakin(p.parcalar[0].a, 0.4);
  yakin(p.parcalar[0].b, 2.1);
  yakin(p.parcalar[1].a, 3.9);
  yakin(p.parcalar[1].b, 7.1);
  yakin(p.sure, 1.7 + 3.2);
  assert.equal(p.duraklamalar.length, 1);
  assert.equal(p.duraklamalar[0].sonra, 1);
});

test('tutulan duraklama kısaltılmaz', () => {
  const p = planla(dokum, { tutDuraklama: [1] }, tempo);
  assert.equal(p.parcalar.length, 1);
  yakin(p.sure, 7.1 - 0.4);
});

test('kesilen kelimenin sesi komşu parçaya taşmaz', () => {
  const p = planla(dokum, { kes: [3] }, tempo);
  // "üç" 5.0'da biter, "dört" 5.0'da başlar: pay sıfırlanır
  const ucParcasi = p.parcalar.find((x) => x.a < 4.5 && x.b > 4.5);
  yakin(ucParcasi.b, 5);
  const besParcasi = p.parcalar.find((x) => x.b > 6.5);
  yakin(besParcasi.a, 6);
});

test('baş ve son sınırı dışındaki kelimeler atılır', () => {
  const p = planla(dokum, { bas: 0.9, bit: 6.2 }, tempo);
  const kalan = p.kurguKelimeleri().map((k) => k.m);
  assert.deepEqual(kalan, ['iki', 'üç', 'dört']);
  assert.ok(p.parcalar[0].a >= 0.9);
  assert.ok(p.parcalar.at(-1).b <= 6.2 + 1e-9);
});

test('zaman dönüşümleri birbirinin tersidir', () => {
  const p = planla(dokum, {}, tempo);
  for (const t of [0.6, 1.5, 4.2, 6.9]) yakin(p.kurgudanKaynaga(p.kaynaktanKurguya(t)), t);
  // kesilmiş duraklamanın ortası, sonraki parçanın başına kayar
  yakin(p.kaynaktanKurguya(3), p.kaynaktanKurguya(3.9));
});

test('sıra değişince parçalar yeni sırayla dizilir', () => {
  const p = planla(dokum, { sira: [[2, 4], [0, 1]] }, tempo);
  assert.equal(p.parcalar.length, 2);
  yakin(p.parcalar[0].a, 3.9);
  yakin(p.parcalar[1].a, 0.4);
  assert.deepEqual(p.kurguKelimeleri().map((k) => k.m), ['üç', 'dört', 'beş', 'bir', 'iki']);
  yakin(p.kaynaktanKurguya(0.5), 3.2 + 0.1);
});

test('hız kurgu süresini kısaltır', () => {
  const p = planla(dokum, { hiz: 1.25 }, tempo);
  yakin(p.sure, (1.7 + 3.2) / 1.25);
});

test('kareye oturtma: sınırlar tam kare, kısa parça atılır, bitişikler birleşir', () => {
  const o = kareyeOturt(
    [
      { a: 0.41, b: 2.09, bolum: 0 },
      { a: 2.1, b: 2.13, bolum: 0 }, // 1 kare: atılır
      { a: 3.0, b: 4.0, bolum: 0 },
      { a: 4.01, b: 5.0, bolum: 0 }, // öncekine bitişik: birleşir
    ],
    30,
  );
  assert.equal(o.length, 2);
  for (const p of o) {
    yakin(p.a * 30, Math.round(p.a * 30), 1e-9);
    yakin(p.b * 30, Math.round(p.b * 30), 1e-9);
  }
  assert.equal(o[1].ka, 90);
  assert.equal(o[1].kb, 150);
});

test('kurgu kelimeleri sırayla ve üst üste binmeden gelir', () => {
  const p = planla(dokum, { kes: [1] }, tempo, 30);
  const k = p.kurguKelimeleri();
  assert.deepEqual(k.map((x) => x.m), ['bir', 'üç', 'dört', 'beş']);
  for (let i = 1; i < k.length; i++) assert.ok(k[i].bas >= k[i - 1].bas);
  assert.ok(k.at(-1).bit <= p.sure + 0.05);
});

test('satırlar cümle sonunda ve duraklamada bölünür', () => {
  const s = satirlaraBol([
    { m: 'Merhaba.', bas: 0, bit: 0.5 },
    { m: 'Bugün', bas: 0.6, bit: 1 },
    { m: 'güzel', bas: 1, bit: 1.4 },
    { m: 'sonra', bas: 2.2, bit: 2.6 },
  ]);
  assert.deepEqual(s.map((x) => [x.ilk, x.son]), [[0, 0], [1, 2], [3, 3]]);
});
