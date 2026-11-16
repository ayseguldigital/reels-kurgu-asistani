#!/usr/bin/env node
// Altyazı: kesilmiş videonun kelimelerinden altyazı taslağını çıkarır.
//
//   node araclar/altyazi.mjs <proje klasörü> [--yeniden]
//
// Okur:   kesim.json (kalan kelimeler ve yeni zamanları), stil.json (altyazı biçimi, düzeltmeler)
// Yazar:  <proje>/kurgu.json  → "altyazilar" listesi
//
// kurgu.json elle düzeltilebilir: yanlış yazılmış bir kelimenin "m" alanı değiştirilir, öne çıkması
// istenen kelimeye "vurgu": true yazılır. Dosya varsa üstüne yazılmaz; baştan üretmek için --yeniden.
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import '../ortak/calistir.mjs';
import { altyaziUret } from '../ortak/altyazi.mjs';
import { stilOku } from '../ortak/stil.mjs';
import { jsonOku, klasorAl, secenek } from '../ortak/yollar.mjs';

const klasor = klasorAl('node araclar/altyazi.mjs <proje klasörü> [--yeniden]');
const kesim = await jsonOku(path.join(klasor, 'kesim.json'));
const stil = await stilOku();
const dosya = path.join(klasor, 'kurgu.json');
const eski = await jsonOku(dosya, null);

if (eski?.altyazilar?.length && !secenek('yeniden', false)) {
  console.log(`Altyazı taslağı zaten var (${eski.altyazilar.length} altyazı); dokunulmadı.`);
  console.log('Baştan üretmek için --yeniden ekleyin (elle yapılan düzeltmeler silinir).');
  process.exit(0);
}

const altyazilar = altyaziUret(kesim.kelimeler, stil.altyazi, stil.duzeltmeler, kesim.sure);
const kurgu = {
  surum: 1,
  sure: kesim.sure,
  fps: kesim.fps,
  altyazilar,
  kartlar: eski?.kartlar || [],
};
await writeFile(dosya, JSON.stringify(kurgu, null, 1));

console.log(`Altyazı taslağı hazır: ${altyazilar.length} altyazı (${stil.altyazi.bicim}).`);
console.log(altyazilar.map((a) => `  ${a.bas.toFixed(1).padStart(5)}  ${a.kelimeler.map((k) => k.m).join(' ')}`).join('\n'));
console.log(`Dosya: ${dosya}`);
console.log('Şimdi: yazımı kontrol edin (özel adlar, markalar) ve her cümlede en çok bir kelimeye "vurgu": true verin.');
