#!/usr/bin/env node
// Kur: kesilmiş videoyu, altyazıları ve grafik kartlarını bir HyperFrames projesine çevirir.
//
//   node araclar/kur.mjs <proje klasörü> [--altyazisiz]
//
// Okur:   kesim.mp4, kesim.json, kurgu.json, stil.json
// Yazar:  <proje>/sahne/  (index.html ve yanındaki dosyalar; her çalıştırmada baştan kurulur)
//
// Bu klasör elle düzenlenmez. Değişiklik kurgu.json ya da stil.json içinde yapılır, sonra yeniden kurulur.
import { writeFile, readFile, mkdir, rm, copyFile, link, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import '../ortak/calistir.mjs';
import { stilOku } from '../ortak/stil.mjs';
import { kartlariCoz, zeminAraliklari } from '../ortak/kartlar.mjs';
import { GSAP, LOTTIE, jsonOku, klasorAl, secenek } from '../ortak/yollar.mjs';

const BURASI = path.dirname(fileURLToPath(import.meta.url));
const SABLON = path.join(BURASI, '..', 'sablon');
const FONTLAR = path.join(BURASI, '..', 'fontlar');
const GORSEL_UZANTILARI = ['.png', '.jpg', '.jpeg', '.webp', '.gif'];

const klasor = klasorAl('node araclar/kur.mjs <proje klasörü> [--altyazisiz]');
const altyazisiz = secenek('altyazisiz', false);
const kurgu = await jsonOku(path.join(klasor, 'kurgu.json'));
const kesim = await jsonOku(path.join(klasor, 'kesim.json'));
const stil = await stilOku(klasor);
const fontListesi = await jsonOku(path.join(FONTLAR, 'fontlar.json'));

async function varMi(dosya) {
  try {
    await access(dosya);
    return true;
  } catch {
    return false;
  }
}
if (!(await varMi(GSAP.dosya))) {
  throw new Error('Animasyon kütüphanesi kurulu değil. Önce şunu çalıştırın: node araclar/kontrol.mjs --kur');
}

// --- Kartlar: denetle, zamanlarını çöz ---
const { kartlar, hatalar, uyarilar } = kartlariCoz(kurgu.kartlar || [], kesim);
if (hatalar.length) {
  throw new Error(`kurgu.json içindeki kartlarda düzeltilmesi gerekenler var:\n  - ${hatalar.join('\n  - ')}`);
}

const sahne = path.join(klasor, 'sahne');
await rm(sahne, { recursive: true, force: true });
await mkdir(path.join(sahne, 'medya'), { recursive: true });
await mkdir(path.join(sahne, 'fontlar'), { recursive: true });
await mkdir(path.join(sahne, 'gorsel'), { recursive: true });

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

// --- Kartların dosyaları: görseller sahneye kopyalanır, Lottie dosyaları sayfaya gömülür ---
let gorselSayaci = 0;
async function gorselYerlestir(dosya, kartAdi) {
  const kaynak = path.isAbsolute(dosya) ? dosya : path.join(klasor, dosya);
  const uzanti = path.extname(kaynak).toLowerCase();
  if (!GORSEL_UZANTILARI.includes(uzanti)) {
    throw new Error(`${kartAdi}: "${dosya}" bir görsel değil. Desteklenenler: ${GORSEL_UZANTILARI.join(' ')}`);
  }
  if (!(await varMi(kaynak))) {
    throw new Error(`${kartAdi}: "${dosya}" bulunamadı. Dosyayı proje klasörüne koyun ve yolunu proje klasörüne göre yazın.`);
  }
  const ad = `gorsel/${String(++gorselSayaci).padStart(2, '0')}${uzanti}`;
  await copyFile(kaynak, path.join(sahne, ad));
  return ad;
}

let lottieGerekli = false;
for (const [n, k] of kartlar.entries()) {
  const kartAdi = `${k.tur} kartı (${k.bas.toFixed(1)} sn)`;
  if (k.tur === 'gorsel') {
    k.dosyalar = await Promise.all([].concat(k.dosyalar).map((d) => gorselYerlestir(d, kartAdi)));
  } else if (k.tur === 'site') {
    k.dosya = await gorselYerlestir(k.dosya, kartAdi);
  } else if (k.tur === 'lottie') {
    const kaynak = path.isAbsolute(k.dosya) ? k.dosya : path.join(klasor, k.dosya);
    let veri;
    try {
      veri = JSON.parse(await readFile(kaynak, 'utf8'));
    } catch {
      throw new Error(`${kartAdi}: "${k.dosya}" okunamadı. Lottie dosyası .json uzantılı olmalı (.lottie paketleri desteklenmiyor).`);
    }
    if (!veri.layers || !veri.fr) throw new Error(`${kartAdi}: "${k.dosya}" bir Lottie animasyonu değil.`);
    k.veri = veri;
    k.kareHizi = veri.fr;
    k.kareSayisi = Math.max(1, Math.round((veri.op ?? 0) - (veri.ip ?? 0)));
    if (k.bit === null) k.bit = +Math.min(kesim.sure, k.bas + k.kareSayisi / k.kareHizi + (k.dongu ? 2 : 0.4)).toFixed(3);
    delete k.dosya;
    lottieGerekli = true;
  }
  kartlar[n] = k;
}
if (lottieGerekli) {
  if (!(await varMi(LOTTIE.dosya))) {
    throw new Error('Lottie kütüphanesi kurulu değil. Önce şunu çalıştırın: node araclar/kontrol.mjs --kur');
  }
  await copyFile(LOTTIE.dosya, path.join(sahne, 'lottie.min.js'));
}

// --- Yazı tipleri ---
function fontBul(ad) {
  const f = fontListesi.find((x) => x.aile.toLocaleLowerCase('tr') === String(ad).toLocaleLowerCase('tr'));
  if (!f) {
    const secenekler = fontListesi.map((x) => x.aile).join(', ');
    throw new Error(`"${ad}" yazı tipi pakette yok. Seçenekler: ${secenekler}.`);
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
  yuz: kurgu.yuz || null,
  kartlar,
  zeminAraliklari: zeminAraliklari(kartlar),
};
const sureYazi = Number(kurgu.sure).toFixed(3);
// Lottie kütüphanesi kendi adıyla bırakılmaz: animasyonu yalnızca sahnenin zaman çizelgesi ilerletir.
const lottieEtiketi = lottieGerekli
  ? '\n    <script src="lottie.min.js"></script>\n    <script>window.__lottieKutuphanesi = window.lottie; window.lottie = undefined;</script>'
  : '';
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
    <script src="gsap.min.js"></script>${lottieEtiketi}
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="${sureYazi}" data-width="${kesim.en}" data-height="${kesim.boy}">
      <div id="zemin"></div>
      <div id="konusmaci"><div id="yakin">
        <video id="konusma" class="clip" src="medya/kesim.mp4" muted playsinline data-start="0" data-duration="${sureYazi}" data-track-index="0"></video>
      </div></div>
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
console.log(`  ${veri.altyazilar.length} altyazı${altyazisiz ? ' (gizli)' : ''} · ${kartlar.length} grafik · yazı tipi ${kullanilan.map((f) => f.aile).join(' + ')}`);
for (const k of kartlar) console.log(`  ${k.bas.toFixed(1).padStart(5)}–${k.bit.toFixed(1).padEnd(5)} ${k.tur}${k.zemin ? ' (konuşmacı küçülür)' : ''}`);
for (const u of uyarilar) console.log(`UYARI: ${u}`);
