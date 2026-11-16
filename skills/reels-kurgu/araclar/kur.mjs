#!/usr/bin/env node
// Kur: kesilmiş videoyu, altyazıları ve grafikleri bir HyperFrames projesine çevirir.
//
//   node araclar/kur.mjs <proje klasörü> [--altyazisiz]
//
// Okur:   kesim.mp4, kurgu.json, stil.json
// Yazar:  <proje>/sahne/  (index.html ve yanındaki dosyalar; her çalıştırmada baştan kurulur)
//
// Bu klasör elle düzenlenmez. Değişiklik kurgu.json ya da stil.json içinde yapılır, sonra yeniden kurulur.
import { writeFile, mkdir, rm, copyFile, link, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import '../ortak/calistir.mjs';
import { stilOku } from '../ortak/stil.mjs';
import { GSAP, jsonOku, klasorAl, secenek } from '../ortak/yollar.mjs';

const BURASI = path.dirname(fileURLToPath(import.meta.url));
const SABLON = path.join(BURASI, '..', 'sablon');
const FONTLAR = path.join(BURASI, '..', 'fontlar');

const klasor = klasorAl('node araclar/kur.mjs <proje klasörü> [--altyazisiz]');
const altyazisiz = secenek('altyazisiz', false);
const kurgu = await jsonOku(path.join(klasor, 'kurgu.json'));
const kesim = await jsonOku(path.join(klasor, 'kesim.json'));
const stil = await stilOku();
const fontListesi = await jsonOku(path.join(FONTLAR, 'fontlar.json'));

try {
  await access(GSAP.dosya);
} catch {
  throw new Error('Animasyon kütüphanesi kurulu değil. Önce şunu çalıştırın: node araclar/kontrol.mjs --kur');
}

const sahne = path.join(klasor, 'sahne');
await rm(sahne, { recursive: true, force: true });
await mkdir(path.join(sahne, 'medya'), { recursive: true });
await mkdir(path.join(sahne, 'fontlar'), { recursive: true });

// Büyük dosyalar kopyalanmaz, aynı diskteyse bağlanır (yer kaplamaz).
async function yerlestir(kaynak, hedef) {
  try {
    await link(kaynak, hedef);
  } catch {
    await copyFile(kaynak, hedef);
  }
}
await yerlestir(path.join(klasor, 'kesim.mp4'), path.join(sahne, 'medya', 'kesim.mp4'));
await copyFile(GSAP.dosya, path.join(sahne, 'gsap.min.js'));
await copyFile(path.join(SABLON, 'sahne.js'), path.join(sahne, 'sahne.js'));
await copyFile(path.join(SABLON, 'sahne.css'), path.join(sahne, 'sahne.css'));

// --- Yazı tipleri ---
function fontBul(ad) {
  const f = fontListesi.find((x) => x.aile.toLocaleLowerCase('tr') === String(ad).toLocaleLowerCase('tr'));
  if (!f) {
    const secenekler = fontListesi.map((x) => x.aile).join(', ');
    throw new Error(`"${ad}" yazı tipi pakette yok. Seçenekler: ${secenekler}. (Kendi yazı tipinizi eklemek için rehber/fontlar.md)`);
  }
  return f;
}
const kullanilan = [...new Set([stil.fontlar.govde, stil.fontlar.vurgu])].map(fontBul);
const fontCss = [];
for (const f of kullanilan) {
  for (const d of f.dosyalar) {
    const ad = path.basename(d.dosya);
    await copyFile(path.join(FONTLAR, d.dosya), path.join(sahne, 'fontlar', ad));
    fontCss.push(
      `@font-face{font-family:"${f.aile}";font-style:${d.stil};font-weight:${d.agirlik};font-display:block;` +
        `src:url("fontlar/${ad}") format("woff2");unicode-range:${d.aralik};}`,
    );
  }
}

// --- Sayfa ---
const veri = {
  sure: kurgu.sure,
  fps: kurgu.fps,
  renkler: stil.renkler,
  altyazi: stil.altyazi,
  altyaziGoster: !altyazisiz,
  altyazilar: kurgu.altyazilar || [],
  kartlar: kurgu.kartlar || [],
};
const sureYazi = Number(kurgu.sure).toFixed(3);
const html = `<!doctype html>
<html lang="${stil.dil}" data-resolution="portrait">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=${kesim.en}, height=${kesim.boy}" />
    <style>
${fontCss.join('\n')}
:root{
  --font-govde:"${stil.fontlar.govde}";
  --font-vurgu:"${stil.fontlar.vurgu}";
  --renk-ana:${stil.renkler.ana};
  --renk-vurgu:${stil.renkler.vurgu};
  --renk-acik:${stil.renkler.acik};
  --renk-koyu:${stil.renkler.koyu};
  --altyazi-renk:${stil.altyazi.renk};
}
    </style>
    <link rel="stylesheet" href="sahne.css" />
    <script src="gsap.min.js"></script>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="${sureYazi}" data-width="${kesim.en}" data-height="${kesim.boy}">
      <video id="konusma" class="clip" src="medya/kesim.mp4" muted playsinline data-start="0" data-duration="${sureYazi}" data-track-index="0"></video>
      <div id="grafik"></div>
      <div id="altyazi"></div>
    </div>
    <script>window.KURGU = ${JSON.stringify(veri).replace(/</g, '\\u003c')};</script>
    <script src="sahne.js"></script>
    <script>
      const tl = gsap.timeline({ paused: true });
      window.sahneKur(window.KURGU, tl);
      window.__timelines = window.__timelines || {};
      window.__timelines["main"] = tl;
      tl.seek(0);
    </script>
  </body>
</html>
`;
await writeFile(path.join(sahne, 'index.html'), html);
await writeFile(
  path.join(sahne, 'hyperframes.json'),
  JSON.stringify({ paths: { blocks: 'compositions', components: 'compositions/components', assets: 'assets' }, media: { autoProxy: false } }, null, 1),
);
await writeFile(path.join(sahne, 'package.json'), JSON.stringify({ name: 'sahne', private: true, type: 'module' }, null, 1));

console.log(`Sahne kuruldu: ${sahne}`);
console.log(`  ${veri.altyazilar.length} altyazı${altyazisiz ? ' (gizli)' : ''} · ${veri.kartlar.length} grafik · yazı tipi ${kullanilan.map((f) => f.aile).join(' + ')}`);
