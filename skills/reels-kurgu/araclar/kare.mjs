#!/usr/bin/env node
// Kare: videoyu render etmeden, istenen saniyelerdeki görüntüyü çıkarır.
//
//   node araclar/kare.mjs <proje klasörü> --an 1.2,5,12.5
//   node araclar/kare.mjs <proje klasörü>            (--an verilmezse her altyazının ortasından örnekler alır)
//
// Yazar:  <proje>/.ara/kareler/pafta-altyazi.jpg   (--an verilmediyse)
//         <proje>/.ara/kareler/pafta-<saniyeler>.jpg (--an verildiyse; önceki paftalar silinmez)
//
// Render dakikalar sürer, kare saniyeler. Yazı kadrajdan taşıyor mu, yüzü kapatıyor mu, okunuyor mu diye
// önce buna bakılır; sorun varsa kurgu.json ya da stil.json düzeltilir.
import { readdir, rm, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { calistir } from '../ortak/calistir.mjs';
import { hyperframes, araKlasor, jsonOku, klasorAl, secenek } from '../ortak/yollar.mjs';

const BURASI = path.dirname(fileURLToPath(import.meta.url));
const klasor = klasorAl('node araclar/kare.mjs <proje klasörü> [--an 1.2,5,12.5]');
const kurgu = await jsonOku(path.join(klasor, 'kurgu.json'));
const ara = await araKlasor(klasor);
const hf = hyperframes();

let anlar;
const verilen = secenek('an', null);
if (typeof verilen === 'string') {
  anlar = verilen.split(',').map(Number).filter((t) => Number.isFinite(t) && t >= 0 && t <= kurgu.sure);
} else {
  // En çok 8 örnek: altyazıların ortaları, videoya eşit yayılmış.
  const ortalar = (kurgu.altyazilar || []).map((a) => (a.bas + a.bit) / 2);
  const adet = Math.min(8, ortalar.length);
  anlar = Array.from({ length: adet }, (_, i) => ortalar[Math.floor((i * ortalar.length) / adet)]);
}
if (!anlar.length) throw new Error('Gösterilecek an yok. --an ile saniye verin (örnek: --an 2,7.5).');
anlar = anlar.map((t) => +t.toFixed(2));

await calistir(process.execPath, [path.join(BURASI, 'kur.mjs'), klasor]);
const paftaKlasoru = path.join(ara, 'kareler');
await mkdir(paftaKlasoru, { recursive: true });
// Tek tek kareler her çağrıda yenilenir; paftalar birikir ki art arda iki bakış birbirini silmesin.
const cikis = path.join(paftaKlasoru, 'tek');
await rm(cikis, { recursive: true, force: true });
await mkdir(cikis, { recursive: true });
const sahne = path.join(klasor, 'sahne');
await calistir(hf.komut, [...hf.on, 'snapshot', sahne, '-o', cikis, '--at', anlar.join(','), '--no-end'], {
  ortam: hf.ortam,
  klasor: sahne,
});

const pngler = (await readdir(cikis)).filter((d) => d.endsWith('.png')).sort((a, b) => parseFloat(a.replace(/[^\d.]/g, '')) - parseFloat(b.replace(/[^\d.]/g, '')));
if (!pngler.length) throw new Error('Kare alınamadı. Sahne kurulmuş mu ve HyperFrames hazır mı kontrol edin: node araclar/kontrol.mjs');

// Pafta: kareler küçültülüp yan yana dizilir (satır başına en çok 4).
const sutun = Math.min(4, pngler.length);
const satir = Math.ceil(pngler.length / sutun);
const girdiler = pngler.flatMap((d) => ['-i', path.join(cikis, d)]);
const olcek = pngler.map((_, i) => `[${i}:v]scale=405:720[k${i}]`).join(';');
const dizilim = pngler.map((_, i) => `${(i % sutun) * 405}_${Math.floor(i / sutun) * 720}`).join('|');
const ozelCikti = secenek('cikti', null);
const paftaAdi = typeof verilen === 'string' ? `pafta-${anlar.join('_').slice(0, 60)}.jpg` : 'pafta-altyazi.jpg';
const pafta = typeof ozelCikti === 'string' ? path.resolve(ozelCikti) : path.join(paftaKlasoru, paftaAdi);
const birlestir =
  pngler.length === 1
    ? `${olcek};[k0]copy[cikis]`
    : `${olcek};${pngler.map((_, i) => `[k${i}]`).join('')}xstack=inputs=${pngler.length}:layout=${dizilim}:fill=black[cikis]`;
await calistir('ffmpeg', ['-v', 'error', '-y', ...girdiler, '-filter_complex', birlestir, '-map', '[cikis]', '-frames:v', '1', '-q:v', '3', pafta]);

console.log(`Kareler hazır: ${pafta}`);
console.log(`  soldan sağa, üstten alta saniyeler: ${anlar.join(' · ')}  (${sutun}×${satir})`);
console.log('Görsele bakın: yazı kadrajın içinde mi, okunuyor mu, yüzü kapatıyor mu?');
