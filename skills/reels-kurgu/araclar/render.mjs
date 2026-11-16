#!/usr/bin/env node
// Render: sahneyi videoya çevirir.
//
//   node araclar/render.mjs <proje klasörü> --taslak          hızlı önizleme → <proje>/taslak.mp4
//   node araclar/render.mjs <proje klasörü> [--ad "video adı"]  son hâli   → <proje>/bitmis/
//
// Son hâlde üç dosya çıkar:
//   <ad>.mp4               altyazılı, grafikli bitmiş video
//   <ad>-altyazisiz.mp4    altyazısız sürüm (altyazıyı başka bir uygulamada eklemek isteyenler için)
//   <ad>.srt               altyazı dosyası
//
// Kişi önizlemeyi onaylamadan son hâl alınmaz.
import { writeFile, mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { calistir, medyaBilgisi, sureYaz } from '../ortak/calistir.mjs';
import { srtYaz } from '../ortak/altyazi.mjs';
import { lufsOlc, duzeyeGetir, TEPE } from '../ortak/ses.mjs';
import { hyperframes, araKlasor, jsonOku, klasorAl, secenek } from '../ortak/yollar.mjs';

const BURASI = path.dirname(fileURLToPath(import.meta.url));
const klasor = klasorAl('node araclar/render.mjs <proje klasörü> [--taslak] [--ad "video adı"]');
const taslak = secenek('taslak', false);
const kurgu = await jsonOku(path.join(klasor, 'kurgu.json'));
const ara = await araKlasor(klasor);
const hf = hyperframes();
const konusma = path.join(klasor, 'kesim.wav');
let ses = konusma; // ses efekti varsa karışımın yolu olur
const sahne = path.join(klasor, 'sahne');

// Son hâlin sıkıştırması: sabit 10 Mbit/sn. Instagram videoyu zaten yeniden sıkıştırır; bu değer 1080p için
// fazlasıyla yeterlidir ve dosya boyutu önceden bellidir (her 30 saniye yaklaşık 38 MB), telefona kolay aktarılır.
const BIT_HIZI = '10M';
const TASLAK = ['-q', 'draft'];
const SON = ['-q', 'high', '--video-bitrate', BIT_HIZI];

async function kur(altyazisiz) {
  const arg = [path.join(BURASI, 'kur.mjs'), klasor];
  if (altyazisiz) arg.push('--altyazisiz');
  await calistir(process.execPath, arg);
}

/** Sahneyi sessiz bir videoya çevirir. */
async function goruntuAl(cikis, kalite) {
  const basladi = Date.now();
  await calistir(
    hf.komut,
    [...hf.on, 'render', sahne, '-o', cikis, '-f', String(kurgu.fps), ...kalite, '--quiet', '--strict'],
    { ortam: hf.ortam, klasor: sahne },
  );
  return Math.round((Date.now() - basladi) / 1000);
}

/**
 * Konuşmanın altına ses efektlerini yerleştirir. Plan kur.mjs tarafından yazılır (hangi ses, hangi an, ne kadar yüksek).
 * Efekt yoksa konuşma olduğu gibi kullanılır.
 */
async function sesKaristir() {
  const { olaylar } = await jsonOku(path.join(ara, 'ses-plani.json'), { olaylar: [] });
  if (!olaylar.length) return { dosya: konusma, adet: 0 };
  const girdiler = ['-i', konusma];
  const suzgec = [];
  olaylar.forEach((o, n) => {
    girdiler.push('-i', o.dosya);
    suzgec.push(`[${n + 1}:a]adelay=${Math.round(o.an * 1000)}:all=1,volume=${o.kazanc}dB[e${n}]`);
  });
  const sinir = Math.pow(10, TEPE / 20).toFixed(3);
  suzgec.push(
    `[0:a]${olaylar.map((_, n) => `[e${n}]`).join('')}amix=inputs=${olaylar.length + 1}:duration=first:normalize=0,` +
      `alimiter=limit=${sinir}:attack=3:release=60:level=false:latency=true[cikis]`,
  );
  const karisim = path.join(ara, 'karisim.wav');
  await calistir('ffmpeg', ['-v', 'error', '-y', ...girdiler, '-filter_complex', suzgec.join(';'), '-map', '[cikis]', '-ar', '48000', '-ac', '1', '-c:a', 'pcm_s16le', karisim]);
  await duzeyeGetir(karisim);
  return { dosya: karisim, adet: olaylar.length };
}

/** Görüntüye sesi ekler. Görüntü yeniden sıkıştırılmaz. */
async function sesEkle(goruntu, cikis) {
  await calistir('ffmpeg', [
    '-v', 'error', '-y', '-i', goruntu, '-i', ses, '-map', '0:v', '-map', '1:a',
    '-c:v', 'copy', '-c:a', 'aac', '-b:a', '256k', '-ar', '48000', '-shortest', '-movflags', '+faststart', cikis,
  ]);
}

if (taslak) {
  await kur(false);
  ses = (await sesKaristir()).dosya;
  const sessiz = path.join(ara, 'taslak-sessiz.mp4');
  console.error('Önizleme hazırlanıyor…');
  const saniye = await goruntuAl(sessiz, TASLAK);
  const cikis = path.join(klasor, 'taslak.mp4');
  await sesEkle(sessiz, cikis);
  await rm(sessiz, { force: true });
  console.log(`Önizleme hazır (${saniye} sn sürdü): ${cikis}`);
  console.log('Kişiye gösterin. "Tamam" demeden son hâli almayın.');
  process.exit(0);
}

// --- Son hâl ---
const ad = String(secenek('ad', path.basename(klasor))).replace(/[/\\:*?"<>|]/g, '-').trim() || 'video';
const bitmis = path.join(klasor, 'bitmis');
await mkdir(bitmis, { recursive: true });

await kur(false);
const karisim = await sesKaristir();
ses = karisim.dosya;
const sessiz = path.join(ara, 'son-sessiz.mp4');
console.error('Video hazırlanıyor…');
const saniye = await goruntuAl(sessiz, SON);
const son = path.join(bitmis, `${ad}.mp4`);
await sesEkle(sessiz, son);
await rm(sessiz, { force: true });

// Altyazısız sürüm: grafik yoksa kesilmiş video zaten odur; grafik varsa altyazı gizlenip yeniden alınır.
const altyazisizDosya = path.join(bitmis, `${ad}-altyazisiz.mp4`);
if (!(kurgu.kartlar || []).length) {
  await calistir('ffmpeg', [
    '-v', 'error', '-y', '-i', path.join(klasor, 'kesim.mp4'), '-i', ses, '-map', '0:v', '-map', '1:a',
    '-c:v', 'libx264', '-preset', 'medium', '-b:v', BIT_HIZI, '-maxrate', '12M', '-bufsize', '20M', '-pix_fmt', 'yuv420p',
    '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709',
    '-c:a', 'aac', '-b:a', '256k', '-ar', '48000', '-shortest', '-movflags', '+faststart', altyazisizDosya,
  ]);
} else {
  await kur(true);
  const sessiz2 = path.join(ara, 'son-altyazisiz-sessiz.mp4');
  console.error('Altyazısız sürüm hazırlanıyor…');
  await goruntuAl(sessiz2, SON);
  await sesEkle(sessiz2, altyazisizDosya);
  await rm(sessiz2, { force: true });
  await kur(false); // sahne klasörü altyazılı hâliyle kalsın
}

const srt = path.join(bitmis, `${ad}.srt`);
await writeFile(srt, srtYaz(kurgu.altyazilar || []));

const bilgi = await medyaBilgisi(son);
const duzey = await lufsOlc(son);
console.log(`Bitti (${saniye} sn sürdü).`);
console.log(`  ${son}`);
console.log(`  ${altyazisizDosya}`);
console.log(`  ${srt}`);
console.log(`  ${bilgi.en}×${bilgi.boy} · ${sureYaz(bilgi.sure)} · ses ${duzey.lufs ?? '?'} LUFS · ${karisim.adet} ses efekti`);
console.log('Şimdi son kontrolü çalıştırın: node araclar/son-kontrol.mjs "<proje klasörü>"');
