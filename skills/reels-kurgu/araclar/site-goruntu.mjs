#!/usr/bin/env node
// Site görüntüsü: videoda adı geçen bir sitenin ya da aracın ana sayfasının ekran görüntüsünü alır.
//
//   node araclar/site-goruntu.mjs <proje klasörü> <adres> [--ad canva]
//
// Yazar:  <proje>/goruntu/<ad>.png   → "site" kartında "dosya" olarak kullanılır
//
// Yalnızca herkese açık sayfalar alınabilir; giriş gerektiren ekranlar (kişinin kendi hesabı, paneli)
// alınamaz. Onlar için kişiden ekran görüntüsü istenir. Bazı siteler otomatik ziyareti engeller ve boş
// bir sayfa döndürür; bu durumda görüntü kullanılmaz (çıkış kodu 2).
import { mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { calistir } from '../ortak/calistir.mjs';
import { hyperframes, klasorAl, secenek } from '../ortak/yollar.mjs';

const klasor = klasorAl('node araclar/site-goruntu.mjs <proje klasörü> <adres> [--ad canva]');
let adres = process.argv.slice(3).find((a) => !a.startsWith('--') && a !== secenek('ad'));
if (!adres) throw new Error('Adres verilmedi. Örnek: node araclar/site-goruntu.mjs "<proje klasörü>" canva.com');
if (!/^https?:\/\//i.test(adres)) adres = `https://${adres}`;
let alanAdi;
try {
  alanAdi = new URL(adres).hostname.replace(/^www\./, '');
} catch {
  throw new Error(`"${adres}" geçerli bir adres değil.`);
}
const ad = String(secenek('ad', alanAdi.split('.')[0])).replace(/[^\p{L}\p{N}_-]+/gu, '-');

const hf = hyperframes();
const { cikti: tarayiciYolu } = await calistir(hf.komut, [...hf.on, 'browser', 'path'], { ortam: hf.ortam });
const tarayici = tarayiciYolu.trim().split('\n').pop();
if (!tarayici) throw new Error('Tarayıcı bulunamadı. Önce şunu çalıştırın: node araclar/kontrol.mjs --kur');

const hedefKlasor = path.join(klasor, 'goruntu');
await mkdir(hedefKlasor, { recursive: true });
const dosya = path.join(hedefKlasor, `${ad}.png`);
await rm(dosya, { force: true });

console.error(`${alanAdi} açılıyor…`);
await calistir(
  tarayici,
  ['--headless', '--hide-scrollbars', '--window-size=1200,800', '--virtual-time-budget=8000', '--lang=tr-TR', `--screenshot=${dosya}`, adres],
  { izin: [0, 1] },
);

// Boş sayfa kontrolü: görüntü neredeyse tek renkse site ziyareti engellemiştir.
let sapma = 0;
try {
  const { cikti } = await calistir('ffmpeg', ['-v', 'error', '-i', dosya, '-vf', 'scale=48:32,format=gray', '-f', 'rawvideo', '-'], { ikili: true });
  const ort = cikti.reduce((t, b) => t + b, 0) / cikti.length;
  sapma = Math.sqrt(cikti.reduce((t, b) => t + (b - ort) ** 2, 0) / cikti.length);
} catch {
  sapma = 0;
}
if (sapma < 12) {
  await rm(dosya, { force: true });
  console.log(`${alanAdi} boş bir sayfa döndürdü (site otomatik ziyareti engelliyor olabilir). Görüntü kullanılmadı.`);
  console.log('Kişiden bu sitenin ekran görüntüsünü isteyin ya da sitenin tanıtım sayfasını deneyin.');
  process.exit(2);
}

console.log(`Görüntü alındı: ${dosya}`);
console.log(`Kartta kullanımı: { "tur": "site", "dosya": "goruntu/${ad}.png", "adres": "${alanAdi}", "kelime": … }`);
console.log('Kullanmadan önce görsele bakın: çerez uyarısı ya da giriş ekranı çıkmış olabilir.');
