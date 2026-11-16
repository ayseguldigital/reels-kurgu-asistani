// Stil: kişinin videolarının nasıl görüneceği. Hepsi tek dosyada durur (stil.json) ve ilk kullanımdaki
// kısa sohbetle doldurulur. Burada yalnızca başlangıç değerleri ve dosyayı okuyan yardımcı vardır.
import path from 'node:path';
import { jsonOku, STIL_DOSYASI } from './yollar.mjs';

export const VARSAYILAN_STIL = {
  surum: 1,
  dil: 'tr',
  renkler: {
    ana: '#14213D', // kartların ve blokların zemin rengi
    vurgu: '#00C2A8', // öne çıkan kelime, çağrı, ince çizgiler
    acik: '#FFFFFF',
    koyu: '#111111',
  },
  fontlar: {
    govde: 'Inter', // altyazı ve kart yazıları
    vurgu: 'Inter', // vurgulu kelime ve başlıklar (farklı bir font seçilebilir)
  },
  altyazi: {
    bicim: 'ifade', // 'kelime' (tek tek) · 'ifade' (2–4 kelime) · 'cumle' (iki satıra kadar)
    boyut: 'orta', // 'kucuk' · 'orta' · 'buyuk'
    konum: 'alt', // 'alt' · 'orta'
    harf: 'normal', // 'normal' · 'kucuk' · 'buyuk'
    zemin: 'kontur', // 'kontur' (ince koyu çerçeve) · 'golge' · 'kutu'
    renk: '#FFFFFF',
    aktifKelime: true, // söylenen kelime o an vurgu rengine döner
    noktalama: false, // nokta ve virgül altyazıda gösterilmez (soru ve ünlem kalır)
  },
  tempo: 'dengeli', // 'sakin' · 'dengeli' · 'hizli'
  hiz: 1, // 1 = olduğu gibi
  grafik: 'dengeli', // 'az' · 'dengeli' · 'yogun'
  sesEfekti: 'az', // 'yok' · 'az' · 'cok'
  cagri: '', // videoların sonundaki çağrı cümlesi
  ozelAdlar: [], // dökümde doğru yazılması istenen adlar: ["Claude", "Reels"]
  duzeltmeler: {}, // dökümde hep yanlış çıkan kelimeler: {"Cloud": "Claude"}
  dolguSozcukler: [], // kişi kesilmesini istediyse: ["şey", "yani"]
  kurallar: [], // kişinin sonradan söylediği kurallar, düz yazıyla
};

function birlestir(taban, ust) {
  const sonuc = Array.isArray(taban) ? [...taban] : { ...taban };
  for (const [anahtar, deger] of Object.entries(ust || {})) {
    if (deger && typeof deger === 'object' && !Array.isArray(deger) && typeof taban[anahtar] === 'object' && !Array.isArray(taban[anahtar])) {
      sonuc[anahtar] = birlestir(taban[anahtar], deger);
    } else if (deger !== undefined && deger !== null) {
      sonuc[anahtar] = deger;
    }
  }
  return sonuc;
}

/**
 * stil.json dosyasını okur; eksik alanlar başlangıç değerleriyle tamamlanır.
 * Proje klasörü verilirse o klasördeki stil-ek.json da üstüne eklenir: yalnızca o videoya özel ayarlar
 * (örneğin bu videoda altyazı kutulu olsun) orada durur, kişinin genel stili değişmez.
 */
export async function stilOku(projeKlasoru = null, dosya = STIL_DOSYASI) {
  const kisi = await jsonOku(dosya, {});
  let stil = birlestir(VARSAYILAN_STIL, kisi);
  if (projeKlasoru) stil = birlestir(stil, await jsonOku(path.join(projeKlasoru, 'stil-ek.json'), {}));
  return stil;
}

/** Stil dosyası var mı? (Yoksa önce stil sohbeti yapılır.) */
export async function stilVar(dosya = STIL_DOSYASI) {
  const kisi = await jsonOku(dosya, null);
  return kisi !== null;
}
