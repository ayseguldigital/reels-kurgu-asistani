// Yazı tipleri: paketle gelen dokuz yazı tipi ve kişinin kendi eklediği dosyalar tek listede toplanır.
//
// Kişi kendi yazı tipini kullanmak isterse dosyayı ~/Movies/Reels Kurgu/fontlar/ klasörüne koyar ve
// stil.json dosyasına tanıtır:
//
//   "ozelFontlar": [
//     { "aile": "Markam", "dosya": "Markam-Bold.ttf" },
//     { "aile": "Markam İki", "dosyalar": [
//         { "dosya": "MarkamIki-Regular.otf", "agirlik": "400" },
//         { "dosya": "MarkamIki-Bold.otf", "agirlik": "700" } ] }
//   ]
//
// Tek dosya verilirse her kalınlıkta o dosya kullanılır. Desteklenen biçimler: .ttf .otf .woff .woff2
import { readFile, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CALISMA, jsonOku } from './yollar.mjs';

const PAKET = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'fontlar');
export const KISI_FONT_KLASORU = path.join(CALISMA, 'fontlar');
const BICIMLER = { '.ttf': 'truetype', '.otf': 'opentype', '.woff': 'woff', '.woff2': 'woff2' };
const TURKCE = 'çğıöşüÇĞİÖŞÜ';

/**
 * Bütün yazı tiplerini verir.
 * @returns {Promise<{aile:string, tur:string, aciklama:string, kisi:boolean,
 *   dosyalar:{yol:string, ad:string, agirlik:string, stil:string, aralik:string|null, bicim:string}[]}[]>}
 */
export async function fontlariListele(stil = {}) {
  const paket = await jsonOku(path.join(PAKET, 'fontlar.json'));
  const liste = paket.map((f) => ({
    aile: f.aile,
    tur: f.tur,
    aciklama: f.aciklama,
    kisi: false,
    dosyalar: f.dosyalar.map((d) => ({ yol: path.join(PAKET, d.dosya), ad: path.basename(d.dosya), agirlik: d.agirlik, stil: d.stil, aralik: d.aralik, bicim: 'woff2' })),
  }));
  for (const f of stil.ozelFontlar || []) {
    if (!f?.aile) continue;
    const dosyalar = f.dosyalar || (f.dosya ? [{ dosya: f.dosya }] : []);
    liste.push({
      aile: String(f.aile),
      tur: 'kisi',
      aciklama: 'Kendi yazı tipin',
      kisi: true,
      dosyalar: dosyalar.map((d) => {
        const ad = path.basename(String(d.dosya));
        return {
          yol: path.isAbsolute(String(d.dosya)) ? String(d.dosya) : path.join(KISI_FONT_KLASORU, String(d.dosya)),
          ad,
          agirlik: String(d.agirlik ?? '100 900'),
          stil: d.stil === 'italic' ? 'italic' : 'normal',
          aralik: null,
          bicim: BICIMLER[path.extname(ad).toLowerCase()] || null,
        };
      }),
    });
  }
  return liste;
}

export function fontBul(liste, ad) {
  return liste.find((f) => f.aile.toLocaleLowerCase('tr') === String(ad).toLocaleLowerCase('tr')) || null;
}

/** Bir yazı tipinin @font-face kuralları. `adres(dosya)` her dosyanın sayfadaki adresini verir. */
export function fontCss(font, adres) {
  return font.dosyalar
    .map(
      (d) =>
        `@font-face{font-family:"${font.aile}";font-style:${d.stil};font-weight:${d.agirlik};font-display:block;` +
        `src:url("${adres(d)}") format("${d.bicim}");${d.aralik ? `unicode-range:${d.aralik};` : ''}}`,
    )
    .join('\n');
}

/**
 * Kişinin eklediği yazı tiplerini denetler: dosya var mı, biçimi destekleniyor mu, Türkçe harfleri içeriyor mu.
 * @returns {Promise<string[]>} sorunlar
 */
export async function kisiFontlariniDenetle(liste) {
  const sorunlar = [];
  for (const f of liste.filter((x) => x.kisi)) {
    if (!f.dosyalar.length) {
      sorunlar.push(`"${f.aile}" için dosya yazılmamış. "dosya" alanına yazı tipi dosyasının adını yazın.`);
      continue;
    }
    for (const d of f.dosyalar) {
      if (!d.bicim) {
        sorunlar.push(`"${f.aile}": ${d.ad} desteklenen bir yazı tipi dosyası değil. Desteklenenler: ${Object.keys(BICIMLER).join(' ')}`);
        continue;
      }
      try {
        await access(d.yol);
      } catch {
        sorunlar.push(`"${f.aile}": ${d.ad} bulunamadı. Dosyayı şu klasöre koyun: ${KISI_FONT_KLASORU}`);
        continue;
      }
      const eksik = await turkceEksikleri(d.yol);
      if (eksik && eksik.length) {
        sorunlar.push(`"${f.aile}" (${d.ad}) şu Türkçe harfleri içermiyor: ${eksik.join(' ')}. Bu harfler videoda başka bir yazı tipiyle görünür; Türkçe destekli bir sürüm kullanın.`);
      }
    }
  }
  return sorunlar;
}

/**
 * Yazı tipinin içermediği Türkçe harfleri verir. .ttf ve .otf dosyalarında bakılabilir;
 * sıkıştırılmış biçimlerde (.woff, .woff2) ve çoklu dosyalarda bakılamaz (null döner).
 */
export async function turkceEksikleri(yol) {
  let b;
  try {
    b = await readFile(yol);
  } catch {
    return null;
  }
  const imza = b.toString('latin1', 0, 4);
  if (!['\x00\x01\x00\x00', 'OTTO', 'true'].includes(imza)) return null;
  const tabloSayisi = b.readUInt16BE(4);
  let cmap = -1;
  for (let i = 0; i < tabloSayisi; i++) {
    const kayit = 12 + i * 16;
    if (b.toString('latin1', kayit, kayit + 4) === 'cmap') cmap = b.readUInt32BE(kayit + 8);
  }
  if (cmap < 0) return null;
  // Unicode alt tablolarından en kapsamlısını seç: önce 32 bitlik (biçim 12), yoksa 16 bitlik (biçim 4).
  const altSayisi = b.readUInt16BE(cmap + 2);
  let secilen = null;
  for (let i = 0; i < altSayisi; i++) {
    const k = cmap + 4 + i * 8;
    const platform = b.readUInt16BE(k);
    const kodlama = b.readUInt16BE(k + 2);
    const konum = cmap + b.readUInt32BE(k + 4);
    const bicim = b.readUInt16BE(konum);
    const unicode = platform === 0 || (platform === 3 && (kodlama === 1 || kodlama === 10));
    if (!unicode || (bicim !== 4 && bicim !== 12)) continue;
    if (!secilen || bicim > secilen.bicim) secilen = { bicim, konum };
  }
  // Unicode tablosu olmayan dosya bir simge yazı tipidir; harf içermez.
  if (!secilen) return [...TURKCE];

  const var_mi = (kod) => {
    const t = secilen.konum;
    if (secilen.bicim === 12) {
      const grup = b.readUInt32BE(t + 12);
      for (let g = 0; g < grup; g++) {
        const p = t + 16 + g * 12;
        if (kod >= b.readUInt32BE(p) && kod <= b.readUInt32BE(p + 4)) return true;
      }
      return false;
    }
    const dilim = b.readUInt16BE(t + 6) / 2;
    const bitisler = t + 14;
    const baslar = bitisler + dilim * 2 + 2;
    const kaymalar = baslar + dilim * 2;
    const araliklar = kaymalar + dilim * 2;
    for (let s = 0; s < dilim; s++) {
      if (kod > b.readUInt16BE(bitisler + s * 2)) continue;
      const bas = b.readUInt16BE(baslar + s * 2);
      if (kod < bas) return false;
      const kayma = b.readInt16BE(kaymalar + s * 2);
      const aralik = b.readUInt16BE(araliklar + s * 2);
      if (aralik === 0) return ((kod + kayma) & 0xffff) !== 0;
      const glif = b.readUInt16BE(araliklar + s * 2 + aralik + (kod - bas) * 2);
      return glif !== 0;
    }
    return false;
  };
  return [...TURKCE].filter((h) => !var_mi(h.codePointAt(0)));
}
