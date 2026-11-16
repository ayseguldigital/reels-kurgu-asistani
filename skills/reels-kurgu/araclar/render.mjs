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
import { lufsOlc } from '../ortak/ses.mjs';
import { hyperframes, araKlasor, jsonOku, klasorAl, secenek } from '../ortak/yollar.mjs';

const BURASI = path.dirname(fileURLToPath(import.meta.url));
const klasor = klasorAl('node araclar/render.mjs <proje klasörü> [--taslak] [--ad "video adı"]');
const taslak = secenek('taslak', false);
const kurgu = await jsonOku(path.join(klasor, 'kurgu.json'));
const ara = await araKlasor(klasor);
const hf = hyperframes();
const ses = path.join(klasor, 'kesim.wav');
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

/** Görüntüye sesi ekler. Görüntü yeniden sıkıştırılmaz. */
async function sesEkle(goruntu, cikis) {
  await calistir('ffmpeg', [
    '-v', 'error', '-y', '-i', goruntu, '-i', ses, '-map', '0:v', '-map', '1:a',
    '-c:v', 'copy', '-c:a', 'aac', '-b:a', '256k', '-ar', '48000', '-shortest', '-movflags', '+faststart', cikis,
  ]);
}

if (taslak) {
  await kur(false);
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
console.log(`  ${bilgi.en}×${bilgi.boy} · ${sureYaz(bilgi.sure)} · ses ${duzey.lufs ?? '?'} LUFS`);
console.log('Şimdi son kontrolü çalıştırın: node araclar/son-kontrol.mjs "<proje klasörü>"');
