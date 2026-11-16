// Altyazı üretimi: kurgu zamanlı kelimeleri ekranda görünecek altyazı gruplarına böler.
// Zaman çekirdeği gibi bu dosya da hem araçlarda hem inceleme sayfasında çalışır; Node'a özgü bir şey yoktur.

// Reels'te yazının güvenle durabileceği alan (1080×1920): yanlarda ve altta Instagram'ın düğmeleri vardır.
export const GUVENLI = { sol: 110, sag: 970, ust: 250, alt: 1500 };
export const ALTYAZI_GENISLIK = GUVENLI.sag - GUVENLI.sol;

const BICIMLER = {
  kelime: { enCokKelime: 1, enCokHarf: 16, taban: { kucuk: 96, orta: 118, buyuk: 140 } },
  ifade: { enCokKelime: 4, enCokHarf: 22, taban: { kucuk: 64, orta: 78, buyuk: 94 } },
  cumle: { enCokKelime: 9, enCokHarf: 44, taban: { kucuk: 52, orta: 62, buyuk: 74 } },
};
// Kalın bir yazı tipinde bir harfin ortalama genişliği, yazı boyutunun yaklaşık bu kadarıdır.
const HARF_ORANI = 0.6;
const EN_AZ_SURE = 0.28; // bir altyazı en az bu kadar ekranda kalır
const BIRLESME_BOSLUGU = 0.3; // sonraki altyazı bu kadar yakınsa arada boşluk bırakılmaz

function yaziHazirla(m, ayar, duzeltmeler) {
  let y = m;
  const yalin = y.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '');
  if (duzeltmeler && duzeltmeler[yalin] !== undefined) y = y.replace(yalin, duzeltmeler[yalin]);
  if (!ayar.noktalama) y = y.replace(/[.,;:]+$/u, '').replace(/^["“”'‘’(]+|["“”'‘’)]+$/gu, '');
  if (ayar.harf === 'kucuk') y = y.toLocaleLowerCase('tr');
  else if (ayar.harf === 'buyuk') y = y.toLocaleUpperCase('tr');
  return y;
}

/**
 * @param {{i:number, m:string, bas:number, bit:number}[]} kelimeler kurgu zamanlı kelimeler
 * @param {object} ayar stil.altyazi
 * @param {Record<string,string>} [duzeltmeler] stil.duzeltmeler
 * @param {number} [sure] videonun süresi
 * @returns {{bas:number, bit:number, boyut:number, kelimeler:{i:number, m:string, bas:number, bit:number, vurgu:boolean}[]}[]}
 */
export function altyaziUret(kelimeler, ayar, duzeltmeler = {}, sure = Infinity) {
  const bicim = BICIMLER[ayar.bicim] || BICIMLER.ifade;
  const taban = bicim.taban[ayar.boyut] || bicim.taban.orta;
  const gruplar = [];
  let simdiki = [];
  let harf = 0;

  const kapat = () => {
    if (simdiki.length) gruplar.push(simdiki);
    simdiki = [];
    harf = 0;
  };

  kelimeler.forEach((k, n) => {
    const yazi = yaziHazirla(k.m, ayar, duzeltmeler);
    if (!yazi) return;
    const eklenince = harf + (simdiki.length ? 1 : 0) + yazi.length;
    if (simdiki.length && (simdiki.length >= bicim.enCokKelime || eklenince > bicim.enCokHarf)) kapat();
    simdiki.push({ i: k.i, m: yazi, bas: k.bas, bit: k.bit, vurgu: false });
    harf += (simdiki.length > 1 ? 1 : 0) + yazi.length;
    const sonraki = kelimeler[n + 1];
    const cumleSonu = /[.!?…]["')\]]?$/.test(k.m);
    const araSonu = /[,;:]$/.test(k.m);
    const bosluk = sonraki ? sonraki.bas - k.bit : Infinity;
    // Cümle sonunda ve belirgin duraklamada grup kapanır; virgülde yalnızca grup yeterince dolduysa.
    if (cumleSonu || bosluk > 0.35 || (araSonu && simdiki.length >= 2)) kapat();
  });
  kapat();

  const altyazilar = gruplar.map((g) => {
    const enUzun = Math.max(...g.map((k) => k.m.length));
    const toplam = g.reduce((t, k) => t + k.m.length, 0) + g.length - 1;
    // Tek satıra sığmayan grup iki satıra bölünür; en uzun kelime tek başına satıra sığmalıdır.
    // Satırlar eşit bölünmez; uzun bir kelime bir satırı tek başına doldurabilir. O yüzden yarıdan biraz fazlası hesaplanır.
    const satirHarfi = ayar.bicim === 'cumle' ? Math.max(enUzun, Math.ceil(toplam / 2) + 3) : Math.max(enUzun, Math.min(toplam, 14));
    // Kutu zemininde yazının iki yanında boşluk vardır; yazıya kalan alan daralır.
    const genislik = ALTYAZI_GENISLIK - (ayar.zemin === 'kutu' ? 90 : 0);
    const sigan = Math.floor(genislik / (HARF_ORANI * Math.max(1, satirHarfi)));
    return { bas: g[0].bas, bit: g[g.length - 1].bit, boyut: Math.max(40, Math.min(taban, sigan)), kelimeler: g };
  });

  // Süreler: çok kısa kalmasın, arada göz kırpar gibi boşluk olmasın, sonrakinin üstüne binmesin.
  altyazilar.forEach((a, n) => {
    const sonraki = altyazilar[n + 1];
    const sinir = sonraki ? sonraki.bas : sure;
    if (sonraki && sonraki.bas - a.bit < BIRLESME_BOSLUGU) a.bit = sonraki.bas;
    else a.bit = Math.min(sinir, a.bit + 0.12);
    if (a.bit - a.bas < EN_AZ_SURE) a.bit = Math.min(sinir, a.bas + EN_AZ_SURE);
    a.bas = +a.bas.toFixed(3);
    a.bit = +a.bit.toFixed(3);
  });
  return altyazilar.filter((a) => a.bit > a.bas);
}

function srtZamani(t) {
  const ms = Math.round(Math.max(0, t) * 1000);
  const s = Math.floor(ms / 3600000);
  const d = Math.floor((ms % 3600000) / 60000);
  const sn = Math.floor((ms % 60000) / 1000);
  const kalan = ms % 1000;
  const iki = (n) => String(n).padStart(2, '0');
  return `${iki(s)}:${iki(d)}:${iki(sn)},${String(kalan).padStart(3, '0')}`;
}

/** Altyazıları .srt biçiminde yazar (başka uygulamalara aktarmak için). */
export function srtYaz(altyazilar) {
  return (
    altyazilar
      .map((a, n) => `${n + 1}\n${srtZamani(a.bas)} --> ${srtZamani(a.bit)}\n${a.kelimeler.map((k) => k.m).join(' ')}\n`)
      .join('\n')
  );
}
