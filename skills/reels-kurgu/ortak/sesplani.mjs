// Ses planı: hangi kartta hangi ses efekti, hangi anda ve ne kadar yüksek çalacak.
// Dosya ya da ağ kullanmaz; kur.mjs ve testler aynı hesabı çalıştırır.
//
// Yoğunluk stil dosyasındaki "sesEfekti" ayarından gelir:
//   yok → hiç ses efekti yok
//   az  → her kart girerken tek bir ses
//   cok → ayrıca liste maddelerinde tık, sayı tamamlanınca çın, karşılaştırmanın ikinci sütununda tok
// Kart başına: "ses": false o kartı sessiz yapar, "ses": "para" giriş sesini değiştirir.

/** Kart türünün olağan giriş sesi. null: o tür sessizdir. */
export const OLAGAN_SES = {
  baslik: 'whoosh',
  etiket: 'pop',
  liste: 'gecis',
  sayi: 'gecis',
  cagri: 'bildirim',
  gorsel: 'deklansor',
  site: 'gecis',
  karsilastirma: 'gecis',
  lottie: 'pop',
  yakinlas: null,
};

/** Her sesin konuşmanın altındaki düzeyi (dB). Sesler tepe −3 dB'ye eşitlenmiş dosyalardır. */
const KAZANC = { whoosh: -14, gecis: -13, pop: -11, tik: -14, tok: -13, cin: -16, klavye: -15, deklansor: -14, bildirim: -14, para: -14 };
const VURUS_PAYI = 0.06; // sesin en yüksek anı, kartın belirmeye başlamasından bu kadar sonra gelir

/**
 * @param {object[]} kartlar zamanları çözülmüş kartlar (kartlariCoz çıktısı)
 * @param {'yok'|'az'|'cok'} duzey
 * @param {{ad:string, sure:number, zirve:number}[]} sesler sesler.json
 * @param {number} sure videonun süresi
 * @param {number} [ekKazanc] bütün efektlere eklenecek dB (stil.sesEfektiDuzeyi)
 * @returns {{olaylar:{ad:string, an:number, kazanc:number, kart:number}[], hatalar:string[]}}
 */
export function sesPlani(kartlar, duzey, sesler, sure, ekKazanc = 0) {
  const bilgi = new Map(sesler.map((s) => [s.ad, s]));
  const hatalar = [];
  const olaylar = [];

  const ekle = (ad, vurus, kart, fark = 0) => {
    const s = bilgi.get(ad);
    if (!s) {
      hatalar.push(`${kart + 1}. kart: "${ad}" diye bir ses yok. Seçenekler: ${[...bilgi.keys()].join(', ')}`);
      return;
    }
    const an = Math.max(0, vurus - s.zirve);
    if (an >= sure - 0.05) return;
    olaylar.push({ ad, an: +an.toFixed(3), kazanc: (KAZANC[ad] ?? -14) + fark + ekKazanc, kart });
  };

  kartlar.forEach((k, n) => {
    if (k.ses === false || k.bit === null) return;
    const ozel = typeof k.ses === 'string' ? k.ses : null;
    // Stil "yok" dese de karta elle yazılmış ses çalar; kişi o kartta özellikle istemiştir.
    if (duzey === 'yok' && !ozel) return;
    const giris = ozel || OLAGAN_SES[k.tur];
    if (giris) ekle(giris, k.bas + VURUS_PAYI, n);
    if (duzey !== 'cok') return;

    if (k.tur === 'liste') {
      for (const m of k.maddeler || []) ekle('tik', m.an + 0.03, n);
    } else if (k.tur === 'sayi') {
      const sayma = Math.max(0.5, Math.min(1.5, (k.bit - k.bas) * 0.5));
      ekle('cin', k.bas + 0.1 + sayma, n);
    } else if (k.tur === 'karsilastirma') {
      ekle('tok', k.bas + Math.min(0.9, (k.bit - k.bas) * 0.3) + VURUS_PAYI, n);
    }
  });

  // Aynı anda üst üste binen sesler kulağı yorar: 80 ms içinde ikinci ses atılır.
  olaylar.sort((a, b) => a.an - b.an);
  const seyrek = [];
  for (const o of olaylar) {
    const son = seyrek[seyrek.length - 1];
    if (son && o.an - son.an < 0.08) continue;
    seyrek.push(o);
  }
  return { olaylar: seyrek, hatalar };
}
