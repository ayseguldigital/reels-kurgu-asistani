#!/usr/bin/env node
// Döküm: konuşmayı kelime kelime yazıya döker ve her kelimenin zamanını çıkarır.
//
//   node araclar/dokum.mjs <proje klasörü> [--dil tr]
//
// Yazar:  <proje>/dokum.json  (kelimeler, zamanlar, sessizlikler)
//         <proje>/dokum.txt   (numaralı satırlar; kesim önerisi bunun üstünden konuşulur)
//
// Döküm bilgisayarda yapılır (Whisper); ses hiçbir yere gönderilmez.
import { writeFile, access } from 'node:fs/promises';
import path from 'node:path';
import { calistir, sureYaz } from '../ortak/calistir.mjs';
import { duzeyOlc, sesliSure } from '../ortak/duzey.mjs';
import { satirlaraBol } from '../ortak/zaman.mjs';
import { MODEL, STIL_DOSYASI, hamBul, araKlasor, jsonOku, klasorAl, secenek } from '../ortak/yollar.mjs';

// Whisper'ın kelime zamanı ölçümü (DTW) kelimeyi yaklaşık bu kadar geç gösterir.
const GECIKME = 0.18;
// Kelimenin son hecesinden sonra en çok bu kadar uzar; duraklama kelimeye katılmaz.
const BITIS_PAYI = 0.35;

const klasor = klasorAl('node araclar/dokum.mjs <proje klasörü> [--dil tr]');
const stil = await jsonOku(STIL_DOSYASI, {});
const dil = secenek('dil', stil.dil || 'tr');

try {
  await access(MODEL.dosya);
} catch {
  console.error('Döküm modeli kurulu değil. Önce şunu çalıştırın: node araclar/kontrol.mjs --kur');
  process.exit(1);
}

const ham = await hamBul(klasor);
const ara = await araKlasor(klasor);

// Kesim kararları kelime numaralarına bağlıdır. Döküm yenilenirse numaralar değişebilir ve
// onaylanmış kararlar yanlış kelimeleri gösterir; bu yüzden karar varken döküm kendiliğinden yenilenmez.
try {
  await access(path.join(klasor, 'kararlar.json'));
  await access(path.join(klasor, 'dokum.json'));
  if (!secenek('yeniden', false)) {
    console.error('Bu videonun dökümü ve onaylanmış kesim kararları zaten var; döküm yenilenmedi.');
    console.error('Dökümü baştan almak isterseniz --yeniden ekleyin. O zaman kararlar.json silinmeli ve kesimler yeniden onaylanmalıdır.');
    process.exit(3);
  }
} catch {
  /* karar ya da döküm yok: devam */
}

// Temizlenmiş ses varsa onu kullan: gürültüsüz seste kelimeler daha doğru çıkar.
let kaynakSes = path.join(klasor, 'ses-temiz.wav');
try {
  await access(kaynakSes);
} catch {
  kaynakSes = ham;
}

const ses16 = path.join(ara, 'dokum-16k.wav');
await calistir('ffmpeg', ['-v', 'error', '-y', '-i', kaynakSes, '-vn', '-ac', '1', '-ar', '16000', ses16]);

console.error('Konuşma yazıya dökülüyor…');
const cikisOnEki = path.join(ara, 'whisper');
const whisperArg = ['-m', MODEL.dosya, '-f', ses16, '-l', dil, '-ojf', '-of', cikisOnEki, '-dtw', 'large.v3.turbo', '-nfa', '-np'];
// Özel adlar (marka, kişi, ürün adı) ipucu olarak verilir; döküm onları doğru yazmaya yatkın olur.
const ozelAdlar = (stil.ozelAdlar || []).filter(Boolean);
if (ozelAdlar.length) whisperArg.push('--prompt', `${ozelAdlar.join(', ')}.`);
await calistir('whisper-cli', whisperArg);
const whisper = await jsonOku(`${cikisOnEki}.json`);
const olcum = await duzeyOlc(ses16, { enAzSessizlik: 0.1 });

// --- Parçalardan (token) kelimelere ---
const kelimeler = [];
for (const bolut of whisper.transcription || []) {
  for (const parca of bolut.tokens || []) {
    const yazi = parca.text ?? '';
    if (!yazi.trim() || yazi.startsWith('[_') || /^\[.*\]$/.test(yazi.trim())) continue;
    const dtw = typeof parca.t_dtw === 'number' && parca.t_dtw >= 0;
    const an = dtw ? parca.t_dtw / 100 - GECIKME : (parca.offsets?.from ?? 0) / 1000;
    const yeniKelime = yazi.startsWith(' ') || !kelimeler.length;
    const yalnizNoktalama = /^[\s.,!?;:…"'’”)\]-]+$/.test(yazi);
    if (yeniKelime && !yalnizNoktalama) {
      kelimeler.push({ m: yazi.trim(), bas: Math.max(0, an), son: Math.max(0, an), p: parca.p ?? 1 });
    } else if (kelimeler.length) {
      const k = kelimeler[kelimeler.length - 1];
      k.m += yazi.trim();
      if (!yalnizNoktalama) {
        k.son = Math.max(k.son, an);
        k.p = Math.min(k.p, parca.p ?? 1);
      }
    }
  }
}

// Bitişler: sonraki kelimenin başı, ama son heceden en çok BITIS_PAYI sonra.
kelimeler.forEach((k, i) => {
  const sonraki = kelimeler[i + 1];
  const tavan = k.son + BITIS_PAYI;
  k.bit = Math.min(sonraki ? sonraki.bas : olcum.sure, tavan);
  if (k.bit < k.bas + 0.06) k.bit = k.bas + 0.06;
});

// Sınırları ölçülmüş sessizliğe oturt: kelime sessizliğin içinde başlamaz ve bitmez.
const sessiz = olcum.sessizlikler.filter((s) => s.bit - s.bas >= 0.12);
for (const k of kelimeler) {
  for (const s of sessiz) {
    if (s.bit <= k.bas || s.bas >= k.bit) continue;
    const basIcinde = k.bas >= s.bas && k.bas < s.bit;
    if (basIcinde && s.bit < k.bit - 0.06) k.bas = s.bit;
    else if (s.bas > k.bas + 0.08 && s.bit >= k.bit - 0.02) k.bit = Math.max(k.bas + 0.06, s.bas + 0.03);
  }
}
// Yetim kelime: Whisper bazen bir kelimeyi, atladığı bir sesin (çekim arası konuşma, gülme) yerine
// erken yerleştirir. Düşük güvenli, önü ve arkası boş bir kelimenin asıl yeri çoğu zaman sonraki
// kelimenin hemen öncesindeki "sahipsiz" sestir; oraya taşınır.
kelimeler.forEach((k, i) => {
  const onceki = kelimeler[i - 1];
  const sonraki = kelimeler[i + 1];
  if (!sonraki || k.p >= 0.3) return;
  if (sonraki.bas - k.bit < 1 || (onceki && k.bas - onceki.bit < 1)) return;
  const sonSessizlik = sessiz.filter((s) => s.bit <= sonraki.bas + 0.02 && s.bas >= k.bit).pop();
  if (!sonSessizlik) return;
  const sahipsiz = sonraki.bas - sonSessizlik.bit;
  if (sahipsiz >= 0.12 && sahipsiz <= 1.2) {
    k.bas = sonSessizlik.bit;
    k.bit = sonraki.bas;
    k.tasindi = true;
  }
});
// Sıra bozulmasın, kelimeler üst üste binmesin.
kelimeler.forEach((k, i) => {
  const onceki = kelimeler[i - 1];
  if (onceki && k.bas < onceki.bas) k.bas = onceki.bas + 0.01;
  if (onceki && onceki.bit > k.bas) onceki.bit = Math.max(onceki.bas + 0.04, k.bas);
  if (k.bit <= k.bas) k.bit = k.bas + 0.06;
});

// Kelime yok ama ses var: "ııı", gülme, öksürük ya da Whisper'ın atladığı bir söz olabilir.
const sesliBosluklar = [];
kelimeler.forEach((k, i) => {
  const sonraki = kelimeler[i + 1];
  if (!sonraki) return;
  const bosluk = sonraki.bas - k.bit;
  if (bosluk < 0.3) return;
  const sesli = sesliSure(olcum, k.bit + 0.03, sonraki.bas - 0.03);
  if (sesli >= 0.2) sesliBosluklar.push({ sonra: i, bas: +k.bit.toFixed(2), bit: +sonraki.bas.toFixed(2), sesli: +sesli.toFixed(2) });
});

const cikti = {
  surum: 1,
  dil,
  model: MODEL.ad,
  sure: +olcum.sure.toFixed(2),
  duzey: { taban: olcum.taban, konusma: olcum.konusma, esik: olcum.esik },
  kelimeler: kelimeler.map((k) => ({ m: k.m, bas: +k.bas.toFixed(2), bit: +k.bit.toFixed(2), p: +k.p.toFixed(2) })),
  sessizlikler: sessiz,
  sesliBosluklar,
};
await writeFile(path.join(klasor, 'dokum.json'), JSON.stringify(cikti, null, 1));

// --- Okunur döküm ---
const satirlar = satirlaraBol(cikti.kelimeler);
const yazi = [];
yazi.push(`Süre ${sureYaz(cikti.sure)} · ${cikti.kelimeler.length} kelime · dil ${dil}`);
yazi.push('Satır başındaki sayı satır numarası, köşeli parantezdeki sayılar o satırın ilk ve son kelime numarasıdır.');
yazi.push('Her satırın altında kelimeler numaralarıyla yazılır (12·kelime); kesim kararları ve grafikler bu numaralarla verilir.');
yazi.push('(?) = emin olunamayan kelime · ⏸ = duraklama (sn) · ♪ = kelime yok ama ses var (ııı, gülme ya da atlanmış söz olabilir)');
yazi.push('');
satirlar.forEach((s, n) => {
  const parcalar = [];
  for (let i = s.ilk; i <= s.son; i++) {
    const k = cikti.kelimeler[i];
    parcalar.push(k.p < 0.5 ? `${k.m}(?)` : k.m);
    const bos = sesliBosluklar.find((b) => b.sonra === i);
    if (bos && i < s.son) parcalar.push(`♪${(bos.bit - bos.bas).toFixed(1)}`);
  }
  const sonraki = satirlar[n + 1];
  let ek = '';
  if (sonraki) {
    const bosluk = sonraki.bas - s.bit;
    const bos = sesliBosluklar.find((b) => b.sonra === s.son);
    if (bos) ek = `   ♪${(bos.bit - bos.bas).toFixed(1)}`;
    else if (bosluk >= 0.6) ek = `   ⏸${bosluk.toFixed(1)}`;
  }
  yazi.push(
    `${String(n + 1).padStart(3)}  ${sureYaz(s.bas).padStart(7)}–${sureYaz(s.bit).padEnd(7)} [${s.ilk}–${s.son}]  ${parcalar.join(' ')}${ek}`,
  );
  const numarali = [];
  for (let i = s.ilk; i <= s.son; i++) numarali.push(`${i}·${cikti.kelimeler[i].m}`);
  yazi.push(`       ${numarali.join('  ')}`);
});
await writeFile(path.join(klasor, 'dokum.txt'), yazi.join('\n') + '\n');

const supheli = cikti.kelimeler.filter((k) => k.p < 0.5).length;
console.log(`Döküm hazır: ${cikti.kelimeler.length} kelime, ${satirlar.length} satır, süre ${sureYaz(cikti.sure)}.`);
if (supheli) console.log(`Emin olunamayan ${supheli} kelime var; dokum.txt içinde (?) ile işaretli. Kişiye sorun.`);
if (sesliBosluklar.length) console.log(`Kelime çıkmayan ama ses olan ${sesliBosluklar.length} yer var; dokum.txt içinde ♪ ile işaretli.`);
console.log(`Dosyalar: ${path.join(klasor, 'dokum.txt')} · ${path.join(klasor, 'dokum.json')}`);
