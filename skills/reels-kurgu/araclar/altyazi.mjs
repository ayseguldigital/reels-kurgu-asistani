#!/usr/bin/env node
// Altyazı: kesilmiş videonun kelimelerinden altyazı taslağını çıkarır.
//
//   node araclar/altyazi.mjs <proje klasörü> [--yeniden]
//
// Okur:   kesim.json (kalan kelimeler ve yeni zamanları), stil.json (altyazı biçimi, düzeltmeler)
// Yazar:  <proje>/kurgu.json  → "altyazilar" listesi
//
// Yazım düzeltmesi ve vurgu kalıcı olsun diye kararlar.json içine, kelime numarasıyla yazılır:
//   "duzeltme": { "84": "Claude" }   "vurgu": [84, 12]
// Böylece kesim değişip altyazı baştan üretilse de kaybolmazlar. kurgu.json içindeki "kartlar" ve "yuz"
// korunur. Altyazı taslağı varsa ve kesim değişmediyse üstüne yazılmaz; baştan üretmek için --yeniden.
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import '../ortak/calistir.mjs';
import { altyaziUret } from '../ortak/altyazi.mjs';
import { stilOku } from '../ortak/stil.mjs';
import { jsonOku, klasorAl, secenek } from '../ortak/yollar.mjs';

const klasor = klasorAl('node araclar/altyazi.mjs <proje klasörü> [--yeniden]');
const kesim = await jsonOku(path.join(klasor, 'kesim.json'));
const stil = await stilOku(klasor);
const dosya = path.join(klasor, 'kurgu.json');
const eski = await jsonOku(dosya, null);

if (eski?.altyazilar?.length && eski.sure === kesim.sure && !secenek('yeniden', false)) {
  console.log(`Altyazı taslağı zaten var (${eski.altyazilar.length} altyazı); dokunulmadı.`);
  console.log('Baştan üretmek için --yeniden ekleyin. Düzeltme ve vurgular kararlar.json içinde durduğu için kaybolmaz.');
  process.exit(0);
}

// Kişinin inceleme sayfasında yaptığı düzeltmeler ve vurgular kararlar.json içinde, kelime numarasıyla durur.
const kararlar = await jsonOku(path.join(klasor, 'kararlar.json'), {});
const altyazilar = altyaziUret(kesim.kelimeler, stil.altyazi, stil.duzeltmeler, kesim.sure, {
  duzeltme: kararlar.duzeltme,
  vurgu: kararlar.vurgu,
});
const kurgu = {
  surum: 1,
  sure: kesim.sure,
  fps: kesim.fps,
  altyazilar,
  kartlar: eski?.kartlar || [],
};
if (eski?.yuz) kurgu.yuz = eski.yuz;
await writeFile(dosya, JSON.stringify(kurgu, null, 1));

console.log(`Altyazı taslağı hazır: ${altyazilar.length} altyazı (${stil.altyazi.bicim}).`);
console.log(altyazilar.map((a) => `  ${a.bas.toFixed(1).padStart(5)}  ${a.kelimeler.map((k) => k.m).join(' ')}`).join('\n'));
console.log(`Dosya: ${dosya}`);
console.log('Şimdi: yazımı kontrol edin (özel adlar, markalar). Düzeltme ve vurguyu kararlar.json içine kelime numarasıyla yazın:');
console.log('  "duzeltme": { "84": "Claude" }, "vurgu": [84]   (kelime numarası: dokum.txt içinde köşeli parantezdeki sayılar)');
