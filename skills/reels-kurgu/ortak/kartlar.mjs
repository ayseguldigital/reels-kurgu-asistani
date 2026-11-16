// Grafik kartları: kurgu.json içindeki "kartlar" listesini denetler ve zamanlarını çözer.
// Zaman çekirdeği gibi burada da dosya ya da ağ yoktur; inceleme sayfası da aynı dosyayı kullanır.
//
// Her kart bir "tur" taşır ve bir kelimeye bağlanır: "kelime" alanı, dokum.txt'deki kelime numarasıdır.
// Kelimeye bağlı kart, kesim değişse bile doğru anda çıkar. İstenirse "bas" ile saniye de verilebilir.

/** Tür başına: zorunlu alanlar, varsayılan süre (sn) ve konuşmacının küçülüp yer açması gerekip gerekmediği. */
export const KART_TURLERI = {
  baslik: { zorunlu: ['metin'], sure: 2.6, zemin: false, aciklama: 'Büyük başlık (açılış, bölüm adı)' },
  etiket: { zorunlu: ['metin'], sure: 2.4, zemin: false, aciklama: 'Küçük hap etiket (isim, terim)' },
  liste: { zorunlu: ['maddeler'], sure: null, zemin: true, aciklama: 'Maddeleri tek tek beliren kart' },
  sayi: { zorunlu: ['deger'], sure: 2.8, zemin: false, aciklama: 'Sayan büyük rakam' },
  cagri: { zorunlu: ['metin'], sure: null, zemin: false, aciklama: 'Çağrı hapı (video sonu)' },
  gorsel: { zorunlu: ['dosyalar'], sure: 3.2, zemin: true, aciklama: '1–3 görsel (ekran görüntüsü, fotoğraf)' },
  site: { zorunlu: ['dosya'], sure: 3.6, zemin: true, aciklama: 'Tarayıcı çerçevesinde site görüntüsü' },
  karsilastirma: { zorunlu: ['sol', 'sag'], sure: 4.2, zemin: true, aciklama: 'İki sütun: önce/sonra, yanlış/doğru' },
  lottie: { zorunlu: ['dosya'], sure: null, zemin: false, aciklama: 'Lottie animasyonu (kişinin kendi dosyası)' },
  yakinlas: { zorunlu: [], sure: 1.6, zemin: false, aciklama: 'Konuşmacıya kısa yakınlaşma' },
};

const GIRIS_PAYI = 0.06; // kart, bağlandığı kelimeden bu kadar önce belirmeye başlar
const MADDE_ARALIGI = 0.7;

/**
 * @param {object[]} kartlar kurgu.json → kartlar
 * @param {{kelimeler:{i:number, bas:number, bit:number}[], sure:number}} kesim
 * @returns {{kartlar: object[], hatalar: string[], uyarilar: string[]}}
 */
export function kartlariCoz(kartlar, kesim) {
  const hatalar = [];
  const uyarilar = [];
  const kelime = new Map(kesim.kelimeler.map((k) => [k.i, k]));
  const sure = kesim.sure;

  function an(kart, alan, ad) {
    const no = kart[alan];
    if (no === undefined || no === null) return null;
    const k = kelime.get(no);
    if (!k) {
      hatalar.push(`${ad}: ${no} numaralı kelime videoda yok (kesilmiş olabilir). Kalan bir kelimeye bağlayın.`);
      return null;
    }
    return k;
  }

  const cozulmus = [];
  (kartlar || []).forEach((kart, n) => {
    const ad = `${n + 1}. kart (${kart.tur ?? 'türü yok'})`;
    const tur = KART_TURLERI[kart.tur];
    if (!tur) {
      hatalar.push(`${ad}: bilinmeyen tür. Seçenekler: ${Object.keys(KART_TURLERI).join(', ')}`);
      return;
    }
    for (const alan of tur.zorunlu) {
      const d = kart[alan];
      if (d === undefined || d === null || d === '' || (Array.isArray(d) && !d.length)) {
        hatalar.push(`${ad}: "${alan}" alanı eksik.`);
        return;
      }
    }

    // Başlangıç
    let bas;
    const basKelime = an(kart, 'kelime', ad);
    if (basKelime) bas = Math.max(0, basKelime.bas - GIRIS_PAYI);
    else if (typeof kart.bas === 'number') bas = kart.bas;
    else if (kart.kelime === undefined) {
      hatalar.push(`${ad}: ne zaman çıkacağı belli değil. "kelime" (kelime numarası) ya da "bas" (saniye) verin.`);
      return;
    } else return;

    const k = { ...kart, bas };
    if (k.zemin === undefined) k.zemin = tur.zemin;

    // Liste maddelerinin belirme anları
    if (kart.tur === 'liste') {
      let sonraki = bas + 0.45;
      k.maddeler = kart.maddeler.map((m) => {
        const madde = typeof m === 'string' ? { metin: m } : { ...m };
        const mk = an(madde, 'kelime', `${ad}, "${madde.metin}" maddesi`);
        const t = mk ? Math.max(bas + 0.2, mk.bas - GIRIS_PAYI) : sonraki;
        sonraki = t + MADDE_ARALIGI;
        return { metin: String(madde.metin ?? ''), an: +t.toFixed(3) };
      });
    }

    // Bitiş
    let bit;
    const bitKelime = an(kart, 'bitKelime', ad);
    if (bitKelime) bit = bitKelime.bit + 0.3;
    else if (typeof kart.bit === 'number') bit = kart.bit;
    else if (typeof kart.sure === 'number') bit = bas + kart.sure;
    else if (kart.tur === 'cagri') bit = sure;
    else if (kart.tur === 'liste') bit = k.maddeler[k.maddeler.length - 1].an + 1.8;
    else if (kart.tur === 'lottie') bit = null; // animasyonun kendi süresi; kur.mjs doldurur
    else bit = bas + tur.sure;

    if (bit !== null) {
      bit = Math.min(sure, bit);
      if (bit - bas < 0.5) {
        uyarilar.push(`${ad}: ekranda yarım saniyeden az kalıyor (${(bit - bas).toFixed(2)} sn); okunmayabilir.`);
      }
    }
    k.bas = +bas.toFixed(3);
    k.bit = bit === null ? null : +bit.toFixed(3);
    cozulmus.push(k);
  });

  // Aynı anda iki kart: yakınlaşma dışındaki kartlar üst üste binmesin.
  const gorunur = cozulmus.filter((k) => k.tur !== 'yakinlas' && k.bit !== null).sort((a, b) => a.bas - b.bas);
  for (let n = 1; n < gorunur.length; n++) {
    const once = gorunur[n - 1];
    const simdi = gorunur[n];
    const ayniYer = konumBolgesi(once) === konumBolgesi(simdi);
    if (ayniYer && simdi.bas < once.bit - 0.05) {
      uyarilar.push(
        `${simdi.tur} kartı (${simdi.bas.toFixed(1)} sn) önceki ${once.tur} kartı bitmeden başlıyor (${once.bit.toFixed(1)} sn); üst üste binebilir.`,
      );
    }
  }
  // Konuşmacı küçülmüşken yakınlaşma yapılmaz.
  const zeminli = cozulmus.filter((k) => k.zemin && k.bit !== null);
  const sonuc = cozulmus.filter((k) => {
    if (k.tur !== 'yakinlas') return true;
    const cakisiyor = zeminli.some((z) => k.bas < z.bit + 0.45 && k.bit > z.bas - 0.2);
    if (cakisiyor) uyarilar.push(`Yakınlaşma (${k.bas.toFixed(1)} sn) konuşmacının küçüldüğü bir karta denk geliyor; atlandı.`);
    return !cakisiyor;
  });

  return { kartlar: sonuc, hatalar, uyarilar };
}

/** Kartın kadrajda kapladığı kaba bölge; üst üste binme uyarısı için. */
export function konumBolgesi(kart) {
  if (kart.tur === 'cagri') return kart.konum === 'ust' ? 'ust' : 'alt';
  const konum = String(kart.konum || 'ust');
  if (konum.startsWith('orta')) return 'orta';
  if (konum.startsWith('alt')) return 'alt';
  return 'ust';
}

/** Zeminli kartların aralıklarını birleştirir: art arda gelen kartlarda konuşmacı gidip gelmesin. */
export function zeminAraliklari(kartlar, birlesme = 0.7) {
  const sirali = kartlar.filter((k) => k.zemin && k.bit !== null).map((k) => [k.bas, k.bit]).sort((a, b) => a[0] - b[0]);
  const cikti = [];
  for (const [a, b] of sirali) {
    const son = cikti[cikti.length - 1];
    if (son && a - son[1] <= birlesme) son[1] = Math.max(son[1], b);
    else cikti.push([a, b]);
  }
  return cikti;
}
