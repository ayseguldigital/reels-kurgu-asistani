#!/usr/bin/env node
// Kurulum kontrolü: gereken araçlar bilgisayarda var mı?
//
//   node araclar/kontrol.mjs          yalnızca kontrol eder, hiçbir şey kurmaz
//   node araclar/kontrol.mjs --kur    eksikleri kurar (Homebrew ile) ve döküm modelini indirir
//
// Çıkış kodu eksik sayısıdır; 0 ise her şey hazır.
import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { stat, mkdir, rename, rm, statfs } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { bul, calistir } from '../ortak/calistir.mjs';
import { MODEL, GSAP, LOTTIE, CALISMA, HYPERFRAMES_SURUM, hyperframes } from '../ortak/yollar.mjs';

const kur = process.argv.includes('--kur');
let eksik = 0;
const tamam = (m) => console.log(`  ✓ ${m}`);
const yok = (m) => {
  console.log(`  ✗ ${m}`);
  eksik++;
};
const not = (m) => console.log(`  ! ${m}`);

/** Çıktısı ekrana akan komut (kurulum uzun sürer, kişi ilerlemeyi görsün). */
function canliCalistir(komut, argumanlar) {
  return new Promise((coz) => {
    const s = spawn(komut, argumanlar, { stdio: 'inherit' });
    s.on('error', () => coz(1));
    s.on('close', (kod) => coz(kod ?? 1));
  });
}

function ozetAl(dosya, tur) {
  return new Promise((coz, reddet) => {
    const ozet = createHash(tur);
    createReadStream(dosya).on('data', (p) => ozet.update(p)).on('end', () => coz(ozet.digest('hex'))).on('error', reddet);
  });
}

console.log('\nReels Kurgu Asistanı · kurulum kontrolü\n');

if (os.platform() !== 'darwin') {
  not("Bu araç Mac'te denendi. Windows ve Linux'ta denenmedi; bazı adımlar çalışmayabilir.");
}

// 1. Node.js
const nodeSurum = Number(process.versions.node.split('.')[0]);
if (nodeSurum >= 22) tamam(`Node.js ${process.versions.node}`);
else yok(`Node.js eski (${process.versions.node}). 22 ya da üstü gerekiyor: brew install node`);

// 2. Homebrew (yalnızca bir şey kurmak gerekirse lazım)
const brew = await bul('brew');

async function aracKontrol(ad, paket, aciklama) {
  if (await bul(ad)) {
    tamam(`${aciklama} (${ad})`);
    return;
  }
  if (!kur) {
    yok(`${aciklama} kurulu değil (${ad})`);
    return;
  }
  if (!brew) {
    yok(`${aciklama} kurulamadı: önce Homebrew gerekiyor. KURULUM.md dosyasındaki Homebrew adımını izleyin.`);
    return;
  }
  console.log(`  … ${aciklama} kuruluyor (birkaç dakika sürebilir)`);
  await canliCalistir('brew', ['install', paket]);
  if (await bul(ad)) tamam(`${aciklama} kuruldu`);
  else yok(`${aciklama} kurulamadı. Terminale "brew install ${paket}" yazıp çıkan hatayı okuyun.`);
}

// 3. FFmpeg: videoyu keser, sesi temizler
await aracKontrol('ffmpeg', 'ffmpeg', 'FFmpeg');
// 4. Whisper: konuşmayı yazıya döker
await aracKontrol('whisper-cli', 'whisper-cpp', 'Whisper');

// 5. Döküm modeli
async function modelTamam() {
  try {
    return (await stat(MODEL.dosya)).size === MODEL.bayt;
  } catch {
    return false;
  }
}
if (await modelTamam()) {
  tamam(`Döküm modeli (${MODEL.ad})`);
} else if (!kur) {
  yok(`Döküm modeli indirilmemiş (${MODEL.ad}, yaklaşık 1,6 GB)`);
} else {
  console.log(`  … Döküm modeli indiriliyor (${MODEL.ad}, yaklaşık 1,6 GB). Bağlantı hızına göre 5–20 dakika sürebilir.`);
  await mkdir(path.dirname(MODEL.dosya), { recursive: true });
  const gecici = `${MODEL.dosya}.indiriliyor`;
  // -C - : yarıda kalan indirme kaldığı yerden sürer.
  const kod = await canliCalistir('curl', ['-L', '--fail', '--progress-bar', '-C', '-', '-o', gecici, MODEL.adres]);
  if (kod !== 0) {
    yok('Model indirilemedi. İnternet bağlantınızı kontrol edip komutu yeniden çalıştırın; indirme kaldığı yerden sürer.');
  } else if ((await ozetAl(gecici, 'sha1')) !== MODEL.sha1) {
    await rm(gecici, { force: true });
    yok('İndirilen model dosyası bozuk çıktı ve silindi. Komutu yeniden çalıştırın.');
  } else {
    await rename(gecici, MODEL.dosya);
    tamam(`Döküm modeli indirildi (${MODEL.ad})`);
  }
}

// 6. Animasyon kütüphaneleri: altyazı ve grafik hareketleri (GSAP), hazır animasyonlar (Lottie)
async function kutuphane(k, ad) {
  const tamamMi = async () => {
    try {
      return (await ozetAl(k.dosya, 'sha256')) === k.sha256;
    } catch {
      return false;
    }
  };
  if (await tamamMi()) return tamam(`${ad} ${k.surum}`);
  if (!kur) return yok(`${ad} ${k.surum} indirilmemiş`);
  await mkdir(path.dirname(k.dosya), { recursive: true });
  await canliCalistir('curl', ['-L', '--fail', '--silent', '--show-error', '-o', k.dosya, k.adres]);
  if (await tamamMi()) return tamam(`${ad} ${k.surum} indirildi`);
  await rm(k.dosya, { force: true });
  return yok(`${ad} indirilemedi ya da beklenen dosya değil. Komutu yeniden çalıştırın.`);
}
await kutuphane(GSAP, 'Animasyon kütüphanesi GSAP');
await kutuphane(LOTTIE, 'Lottie oynatıcısı');

// 7. HyperFrames ve onun kullandığı tarayıcı: videonun kendisini üretir
const hf = hyperframes();
// HyperFrames kendi tarayıcısını indirir. İndirilmemişse bilgisayardaki Chrome'a düşer; sonuç sürümden
// sürüme değişebileceği için hep kendi tarayıcısı kullanılır.
async function hfTarayiciVar() {
  try {
    const { cikti } = await calistir(hf.komut, [...hf.on, 'browser', 'path'], { ortam: hf.ortam });
    return /hyperframes/i.test(cikti.trim().split('\n').pop() || '');
  } catch {
    return false;
  }
}
if (nodeSurum < 22) {
  yok('HyperFrames kontrol edilemedi: önce Node.js güncellenmeli.');
} else if (await hfTarayiciVar()) {
  tamam(`HyperFrames ${HYPERFRAMES_SURUM} ve tarayıcısı`);
} else if (!kur) {
  yok(`HyperFrames ${HYPERFRAMES_SURUM} ya da tarayıcısı hazır değil`);
} else {
  console.log('  … HyperFrames ve tarayıcısı indiriliyor (yaklaşık 300 MB)');
  await new Promise((coz) => {
    const s = spawn(hf.komut, [...hf.on, 'browser', 'ensure', '--force'], { stdio: 'inherit', env: hf.ortam });
    s.on('error', () => coz(1));
    s.on('close', coz);
  });
  if (await hfTarayiciVar()) tamam(`HyperFrames ${HYPERFRAMES_SURUM} ve tarayıcısı kuruldu`);
  else yok('HyperFrames kurulamadı. İnternet bağlantınızı kontrol edip komutu yeniden çalıştırın.');
}

// 8. Boş alan
try {
  const d = await statfs(os.homedir());
  const gb = Math.floor((d.bavail * d.bsize) / 1e9);
  if (gb >= 10) tamam(`Boş alan yeterli (${gb} GB)`);
  else not(`Boş alan az (${gb} GB). Bir video üzerinde çalışırken 5–10 GB gerekebilir.`);
} catch {
  /* ölçülemezse geç */
}

// 9. Çalışma klasörü
await mkdir(CALISMA, { recursive: true });
tamam(`Çalışma klasörü: ${CALISMA}`);

console.log('');
if (eksik === 0) console.log('HAZIR. Bir video verip "bunu Reels yap" diyebilirsiniz.\n');
else if (kur) console.log(`${eksik} eksik giderilemedi. Yukarıdaki ✗ satırlarına bakın.\n`);
else console.log(`${eksik} eksik var. Kurmak için: node araclar/kontrol.mjs --kur\n`);
process.exit(eksik);
