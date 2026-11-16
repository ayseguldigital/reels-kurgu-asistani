#!/usr/bin/env node
// Proje: her video kendi klasöründe durur. Bu araç klasörü açar ve videonun bir kopyasını içine koyar.
//
//   node araclar/proje.mjs yeni "<video dosyası>" --ad "<kısa ad>"
//   node araclar/proje.mjs liste
//
// Klasör: ~/Movies/Reels Kurgu/<yıl-ay-gün> <kısa ad>/   (Finder'da Filmler → Reels Kurgu)
// Video klasöre "ham" adıyla kopyalanır (ham.mov, ham.mp4). Kişinin özgün dosyasına dokunulmaz;
// sonraki bütün araçlar bu klasörün yolunu alır.
import { copyFile, mkdir, readdir, stat, access } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { medyaBilgisi, sureYaz } from '../ortak/calistir.mjs';
import { CALISMA, secenek } from '../ortak/yollar.mjs';

const komut = process.argv[2];

async function varMi(yol) {
  try {
    await access(yol);
    return true;
  } catch {
    return false;
  }
}

if (komut === 'liste') {
  await mkdir(CALISMA, { recursive: true });
  const klasorler = [];
  for (const ad of await readdir(CALISMA)) {
    const yol = path.join(CALISMA, ad);
    if (!(await stat(yol)).isDirectory() || ad === 'fontlar') continue;
    const dosyalar = await readdir(yol);
    if (!dosyalar.some((d) => /^ham\./i.test(d))) continue;
    const durum = dosyalar.includes('bitmis') ? 'bitmiş' : dosyalar.includes('kesim.mp4') ? 'kesildi' : dosyalar.includes('dokum.json') ? 'döküm alındı' : 'yeni';
    klasorler.push(`  ${ad.padEnd(40)} ${durum}`);
  }
  console.log(klasorler.length ? `Videolar (${CALISMA}):\n${klasorler.sort().join('\n')}` : `Henüz video yok: ${CALISMA}`);
  process.exit(0);
}

if (komut !== 'yeni') {
  console.error('Kullanım: node araclar/proje.mjs yeni "<video dosyası>" --ad "<kısa ad>"   |   node araclar/proje.mjs liste');
  process.exit(2);
}

const verilen = process.argv[3];
if (!verilen || verilen.startsWith('--')) throw new Error('Video dosyası verilmedi. Örnek: node araclar/proje.mjs yeni "~/Desktop/cekim.mov" --ad "kahve tarifi"');
const video = path.resolve(verilen.replace(/^~(?=$|\/)/, os.homedir()));
if (!(await varMi(video))) throw new Error(`Video bulunamadı: ${video}`);

const bilgi = await medyaBilgisi(video).catch(() => null);
if (!bilgi?.goruntuVar) throw new Error('Bu dosya bir video değil ya da açılamıyor.');
if (!bilgi.sesVar) throw new Error('Bu videoda ses yok. Asistan kameraya konuşulan videolar için; sessiz videoda döküm ve altyazı çıkarılamaz.');

// Kısa ad: dosya adlarında sorun çıkaran işaretler atılır; verilmezse videonun adı kullanılır.
const hamAd = String(secenek('ad', path.basename(video, path.extname(video))));
const ad = hamAd.replace(/[/\\:*?"<>|]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 60) || 'video';
const bugun = new Date();
const tarih = `${bugun.getFullYear()}-${String(bugun.getMonth() + 1).padStart(2, '0')}-${String(bugun.getDate()).padStart(2, '0')}`;
let klasor = path.join(CALISMA, `${tarih} ${ad}`);
// Aynı gün aynı adla ikinci bir video: klasörün üstüne yazılmaz, sonuna sayı eklenir.
for (let n = 2; await varMi(klasor); n++) klasor = path.join(CALISMA, `${tarih} ${ad} ${n}`);

await mkdir(klasor, { recursive: true });
const hedef = path.join(klasor, `ham${path.extname(video).toLowerCase() || '.mp4'}`);
await copyFile(video, hedef);

console.log(`Proje klasörü: ${klasor}`);
console.log(`  ${path.basename(hedef)} · ${sureYaz(bilgi.sure)} · ${bilgi.en}×${bilgi.boy}${bilgi.hdr ? ' · HDR (ilk adımda çevrilecek)' : ''}${bilgi.en > bilgi.boy ? ' · yatay çekilmiş (kenarları kırpılacak)' : ''}`);
console.log('Sonraki araçların hepsine bu klasörün yolunu verin.');
