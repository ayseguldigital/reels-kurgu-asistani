#!/usr/bin/env node
// Kesim: onaylanan kararları uygular ve kesilmiş videoyu üretir.
//
//   node araclar/kes.mjs <proje klasörü> [--plan]
//
// Okur:   dokum.json, kararlar.json (yoksa hiçbir kelime kesilmez), ses-temiz.wav, stil.json (tempo, hız)
// Yazar:  <proje>/kesim.mp4   (1080×1920, kesilmiş görüntü + temiz ses)
//         <proje>/kesim.wav   (kesilmiş temiz ses, sıkıştırılmamış)
//         <proje>/kesim.json  (parçalar ve kalan kelimelerin yeni zamanları; altyazı bunu kullanır)
//
// --plan: hiçbir şey üretmez, yalnızca kesimin sonucunu (süre, parça sayısı) söyler.
import { writeFile, access, rm } from 'node:fs/promises';
import path from 'node:path';
import { calistir, medyaBilgisi, sureYaz } from '../ortak/calistir.mjs';
import { planla, tempoAl } from '../ortak/zaman.mjs';
import { HEDEF_LUFS, duzeyeGetir } from '../ortak/ses.mjs';
import { duzeyOlc, sesliSure } from '../ortak/duzey.mjs';
import { goruntuKaynagi } from '../ortak/goruntu.mjs';
import { STIL_DOSYASI, hamBul, araKlasor, jsonOku, klasorAl, secenek } from '../ortak/yollar.mjs';

const EN = 1080;
const BOY = 1920;
const GECIS = 0.004; // her parçanın başında ve sonunda 4 ms ses geçişi: kesim yerinde "tık" olmasın

const klasor = klasorAl('node araclar/kes.mjs <proje klasörü> [--plan]');
const yalnizPlan = secenek('plan', false);
const dokum = await jsonOku(path.join(klasor, 'dokum.json'));
const kararlar = await jsonOku(path.join(klasor, 'kararlar.json'), {});
const stil = await jsonOku(STIL_DOSYASI, {});
const tempo = tempoAl(kararlar.tempo || stil.tempo);
if (kararlar.hiz === undefined && stil.hiz) kararlar.hiz = stil.hiz;

const ham = await hamBul(klasor);
const bilgi = await medyaBilgisi(ham);
if (!bilgi.goruntuVar) throw new Error('Bu dosyada görüntü yok.');
// Kare hızı kaynaktan gelir (24, 25, 30). Daha hızlı çekimler 30'a indirilir.
const fps = bilgi.fps > 30.5 ? 30 : Math.round(bilgi.fps * 1000) / 1000 || 30;

const plan = planla({ kelimeler: dokum.kelimeler, sure: Math.min(dokum.sure, bilgi.sure) }, kararlar, tempo, fps);
if (!plan.parcalar.length) throw new Error('Kesimden sonra geriye hiçbir şey kalmıyor. kararlar.json dosyasını kontrol edin.');

const ozet =
  `${sureYaz(bilgi.sure)} → ${sureYaz(plan.sure)} · ${plan.parcalar.length} parça · ` +
  `${plan.duraklamalar.filter((d) => !d.tutuldu).length} duraklama kısaltıldı · tempo ${kararlar.tempo || stil.tempo || 'dengeli'}` +
  (plan.hiz !== 1 ? ` · hız ${plan.hiz}×` : '');
if (yalnizPlan) {
  console.log(`Kesim planı: ${ozet}`);
  process.exit(0);
}

let ses = path.join(klasor, 'ses-temiz.wav');
try {
  await access(ses);
} catch {
  console.error('Not: ses-temiz.wav yok, ham kaydın sesi kullanılıyor. Önce ses-temizle.mjs çalıştırmanız önerilir.');
  ses = ham;
}
// HDR kayıt olağan renk aralığına çevrilmiş kopyasından kesilir (bkz. ortak/goruntu.mjs).
const goruntuKaynak = await goruntuKaynagi(klasor);
if (goruntuKaynak.uyari) console.error(`UYARI: ${goruntuKaynak.uyari}`);
if (bilgi.en > bilgi.boy) {
  console.error('Not: Kayıt yatay çekilmiş. Dikey videoya sığması için ortadan kırpılıyor; kenarlar görünmeyecek.');
}

const ara = await araKlasor(klasor);

// --- Görüntü ---
// Parçalar kaynakta ileri doğru gittiği sürece tek geçişte kesilir. Sıra değiştiyse (örneğin çağrı
// cümlesi sona alındıysa) her blok ayrı kesilir, sonra yeniden sıkıştırmadan birleştirilir.
const bloklar = [];
for (const p of plan.parcalar) {
  const son = bloklar[bloklar.length - 1];
  if (son && p.ka >= son[son.length - 1].kb) son.push(p);
  else bloklar.push([p]);
}

const kareAraligi = Math.max(1, Math.round(fps / 2));
const blokDosyalari = [];
console.error(`Kesiliyor: ${ozet}`);
for (let n = 0; n < bloklar.length; n++) {
  const blok = bloklar[n];
  const ilkKare = blok[0].ka;
  const baslangic = ilkKare / fps;
  const uzunluk = (blok[blok.length - 1].kb - ilkKare) / fps + 0.5;
  const secim = blok.map((p) => `between(n\\,${p.ka - ilkKare}\\,${p.kb - ilkKare - 1})`).join('+');
  const suzgec = [
    `fps=${fps}`,
    `scale=${EN}:${BOY}:force_original_aspect_ratio=increase`,
    `crop=${EN}:${BOY}`,
    `select='${secim}'`,
    `setpts=N/(${fps}*TB)`,
  ];
  if (plan.hiz !== 1) suzgec.push(`setpts=PTS/${plan.hiz}`, `fps=${fps}`);
  suzgec.push('format=yuv420p');
  const dosya = path.join(ara, `blok-${n}.mp4`);
  await calistir('ffmpeg', [
    '-v', 'error', '-y', '-ss', baslangic.toFixed(6), '-t', uzunluk.toFixed(6), '-i', goruntuKaynak.dosya,
    '-an', '-vf', suzgec.join(','),
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '15', '-g', String(kareAraligi), '-bf', '2',
    '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709', '-color_range', 'tv',
    '-video_track_timescale', '90000', dosya,
  ]);
  blokDosyalari.push(dosya);
}

const goruntu = path.join(ara, 'kesim-goruntu.mp4');
if (blokDosyalari.length === 1) {
  await rm(goruntu, { force: true });
  await calistir('ffmpeg', ['-v', 'error', '-y', '-i', blokDosyalari[0], '-c', 'copy', goruntu]);
} else {
  const liste = path.join(ara, 'bloklar.txt');
  await writeFile(liste, blokDosyalari.map((d) => `file '${d.replace(/'/g, "'\\''")}'`).join('\n') + '\n');
  await calistir('ffmpeg', ['-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', liste, '-c', 'copy', goruntu]);
}

// --- Ses ---
// Ses, görüntüyle aynı kare sınırlarından örnek örnek kesilir; böylece ikisi kaymaz.
const P = plan.parcalar;
const sesSuzgec = [];
if (P.length > 1) sesSuzgec.push(`[0:a]asplit=${P.length}${P.map((_, i) => `[g${i}]`).join('')}`);
P.forEach((p, i) => {
  const uzunluk = p.b - p.a;
  const giris = P.length > 1 ? `[g${i}]` : '[0:a]';
  sesSuzgec.push(
    `${giris}atrim=start=${p.a.toFixed(6)}:end=${p.b.toFixed(6)},asetpts=PTS-STARTPTS,` +
      `afade=t=in:d=${GECIS},afade=t=out:st=${Math.max(0, uzunluk - GECIS).toFixed(6)}:d=${GECIS}[p${i}]`,
  );
});
let cikis = '[p0]';
if (P.length > 1) {
  sesSuzgec.push(`${P.map((_, i) => `[p${i}]`).join('')}concat=n=${P.length}:v=0:a=1[birlesik]`);
  cikis = '[birlesik]';
}
if (plan.hiz !== 1) {
  sesSuzgec.push(`${cikis}atempo=${plan.hiz}[hizli]`);
  cikis = '[hizli]';
}
const kesimSes = path.join(klasor, 'kesim.wav');
await calistir('ffmpeg', [
  '-v', 'error', '-y', '-i', ses, '-filter_complex', sesSuzgec.join(';'), '-map', cikis,
  '-ar', '48000', '-ac', '1', '-c:a', 'pcm_s16le', kesimSes,
]);

// Ses düzeyi burada, yalnızca videoda kalan konuşma üzerinden hedefe getirilir.
const duzey = await duzeyeGetir(kesimSes);

// --- Birleştir ---
const kesim = path.join(klasor, 'kesim.mp4');
await calistir('ffmpeg', [
  '-v', 'error', '-y', '-i', goruntu, '-i', kesimSes, '-map', '0:v', '-map', '1:a',
  '-c:v', 'copy', '-c:a', 'aac', '-b:a', '256k', '-shortest', '-movflags', '+faststart', kesim,
]);

// Ara dosyalar yer kaplamasın.
for (const d of [...blokDosyalari, goruntu]) await rm(d, { force: true });

// --- Sınır kontrolü ---
// Bir parçanın hemen dışında, hiçbir kelimeye ait olmayan bir ses varsa kesim o sesin ortasından
// geçiyor olabilir (yarım kalan hece, dökümün atladığı söz). Bu yerler dinlenmek üzere bildirilir.
const olcum = await duzeyOlc(ses);
const K = dokum.kelimeler;
const kelimeVar = (t0, t1) => K.some((k) => k.bit > t0 && k.bas < t1);
const supheliSinirlar = [];
let kurguAni = 0;
for (const p of P) {
  const uzunluk = (p.b - p.a) / plan.hiz;
  if (!kelimeVar(p.a - 0.15, p.a) && sesliSure(olcum, p.a - 0.15, p.a) >= 0.1) supheliSinirlar.push(+kurguAni.toFixed(2));
  if (!kelimeVar(p.b, p.b + 0.15) && sesliSure(olcum, p.b, p.b + 0.15) >= 0.1) supheliSinirlar.push(+(kurguAni + uzunluk).toFixed(2));
  kurguAni += uzunluk;
}

// --- Kayıt ve kontrol ---
const son = await medyaBilgisi(kesim);
const sesSon = await medyaBilgisi(kesimSes);
const fark = Math.abs(son.sure - plan.sure);
await writeFile(
  path.join(klasor, 'kesim.json'),
  JSON.stringify(
    {
      surum: 1,
      fps,
      en: EN,
      boy: BOY,
      sure: +plan.sure.toFixed(3),
      hiz: plan.hiz,
      parcalar: P.map((p) => ({ a: +p.a.toFixed(4), b: +p.b.toFixed(4), bolum: p.bolum })),
      supheliSinirlar,
      kelimeler: plan.kurguKelimeleri(),
    },
    null,
    1,
  ),
);

console.log(`Kesim hazır: ${kesim}`);
console.log(`  ${ozet}`);
console.log(`  görüntü ${sureYaz(son.sure, 2)} · ses ${sureYaz(sesSon.sure, 2)} · plan ${sureYaz(plan.sure, 2)}`);
console.log(`  ses düzeyi ${duzey.lufs ?? '?'} LUFS (hedef ${HEDEF_LUFS}) · en yüksek an ${duzey.tepe ?? '?'} dB`);
if (supheliSinirlar.length) {
  console.log(`DİNLEYİN: ${supheliSinirlar.length} kesim noktası bir sesin ortasından geçiyor olabilir. Kesilmiş videoda şu saniyeler: ${supheliSinirlar.map((t) => sureYaz(t)).join(', ')}`);
}
if (fark > 2 / fps || Math.abs(son.sure - sesSon.sure) > 2 / fps) {
  console.log('UYARI: Görüntü, ses ve plan süreleri birbirini tutmuyor. Ses ile görüntü kaymış olabilir; kesimi yeniden çalıştırın.');
  process.exitCode = 1;
}
