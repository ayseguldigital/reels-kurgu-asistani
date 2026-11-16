// Zaman çekirdeği: "hangi kelimeler kalıyor" kararını "videonun hangi parçaları oynayacak" planına çevirir.
//
// Bu dosyayı hem kesim aracı hem de inceleme sayfası kullanır. İkisi aynı hesabı yaptığı için
// sayfada görülen kesim ile ortaya çıkan video birbirinin aynısıdır. Bu yüzden burada dosya,
// ağ ya da Node'a özgü hiçbir şey yoktur; tarayıcıda da aynen çalışır.
//
// İki zaman vardır:
//   kaynak zamanı = ham kayıttaki saniye
//   kurgu zamanı  = kesilmiş videodaki saniye

/** Tempo: duraklamalar ne kadar kısaltılsın. "pay" her kesimin iki yanında bırakılan nefes payıdır. */
export const TEMPOLAR = {
  sakin: { duraklamaEnAz: 0.7, pay: 0.15 },
  dengeli: { duraklamaEnAz: 0.45, pay: 0.1 },
  hizli: { duraklamaEnAz: 0.28, pay: 0.06 },
};

export function tempoAl(ad) {
  return TEMPOLAR[ad] || TEMPOLAR.dengeli;
}

/**
 * @typedef {{m:string, bas:number, bit:number}} Kelime
 * @typedef {{
 *   kes?: number[],            // kesilecek kelimelerin sıra numaraları
 *   tutDuraklama?: number[],   // kısaltılmayacak duraklamalar (duraklamadan ÖNCEKİ kelimenin numarası)
 *   bas?: number|null,         // kaynakta bu saniyeden önceki her şey atılır (kamera kurulumu)
 *   bit?: number|null,         // kaynakta bu saniyeden sonraki her şey atılır
 *   sira?: [number, number][]|null, // bölümlerin oynama sırası: [ilk kelime, son kelime] çiftleri
 *   hiz?: number               // 1 = olduğu gibi, 1.1 = %10 hızlı
 * }} Kararlar
 */

/**
 * @param {{kelimeler: Kelime[], sure: number}} dokum
 * @param {Kararlar} [kararlar]
 * @param {{duraklamaEnAz:number, pay:number}} [tempo]
 * @param {number} [fps] verilirse parça sınırları kare çizgisine oturtulur
 */
export function planla(dokum, kararlar = {}, tempo = TEMPOLAR.dengeli, fps = 0) {
  const K = dokum.kelimeler;
  const sure = dokum.sure;
  const hiz = kararlar.hiz && kararlar.hiz > 0 ? kararlar.hiz : 1;
  const kesilen = new Set(kararlar.kes || []);
  const tutulanDuraklama = new Set(kararlar.tutDuraklama || []);
  const altSinir = kararlar.bas ?? 0;
  const ustSinir = kararlar.bit ?? sure;

  const kaliyor = (i) => !kesilen.has(i) && K[i].bas >= altSinir - 1e-6 && K[i].bit <= ustSinir + 1e-6;

  const bolumler = kararlar.sira && kararlar.sira.length ? kararlar.sira : [[0, K.length - 1]];
  /** @type {{a:number, b:number, bolum:number}[]} */
  let parcalar = [];
  const duraklamalar = [];

  bolumler.forEach(([ilk, son], bolum) => {
    const sirali = [];
    for (let i = Math.max(0, ilk); i <= Math.min(K.length - 1, son); i++) if (kaliyor(i)) sirali.push(i);
    let a = null;
    sirali.forEach((i, n) => {
      const k = K[i];
      if (a === null) a = parcaBasi(i);
      const j = sirali[n + 1];
      if (j === undefined) {
        parcalar.push({ a, b: parcaSonu(i), bolum });
        a = null;
        return;
      }
      const bitisik = j === i + 1;
      const bosluk = K[j].bas - k.bit;
      let bol = !bitisik;
      if (bitisik && bosluk > tempo.duraklamaEnAz) {
        const tutuldu = tutulanDuraklama.has(i);
        duraklamalar.push({ sonra: i, bas: k.bit, bit: K[j].bas, uzunluk: +bosluk.toFixed(3), tutuldu });
        bol = !tutuldu;
      }
      if (bol) {
        parcalar.push({ a, b: parcaSonu(i), bolum });
        a = null;
      }
    });
  });

  // Bir parçanın başı: kelimenin biraz öncesi. Önceki kelime kesildiyse onun sesine taşmaz.
  function parcaBasi(i) {
    let a = K[i].bas - tempo.pay;
    if (i > 0) a = Math.max(a, Math.min(K[i].bas, K[i - 1].bit));
    return Math.max(0, altSinir, a);
  }
  // Bir parçanın sonu: kelimenin biraz sonrası. Sonraki kelime kesildiyse onun sesine taşmaz.
  function parcaSonu(i) {
    let b = K[i].bit + tempo.pay;
    if (i < K.length - 1) b = Math.min(b, Math.max(K[i].bit, K[i + 1].bas));
    return Math.min(sure, ustSinir, b);
  }

  parcalar = parcalar.filter((p) => p.b - p.a > 0.02);
  if (fps > 0) parcalar = kareyeOturt(parcalar, fps);

  // Kurgu zamanı: parçalar oynama sırasıyla art arda dizilir.
  const baslangiclar = [];
  let toplam = 0;
  for (const p of parcalar) {
    baslangiclar.push(toplam);
    toplam += (p.b - p.a) / hiz;
  }

  /** Kaynak saniyesi → kurgu saniyesi. Kesilmiş bir yere denk gelirse sonraki kalan ana kayar. */
  function kaynaktanKurguya(t) {
    let enYakin = -1;
    for (let n = 0; n < parcalar.length; n++) {
      const p = parcalar[n];
      if (t >= p.a - 1e-6 && t <= p.b + 1e-6) return baslangiclar[n] + (Math.min(Math.max(t, p.a), p.b) - p.a) / hiz;
      if (p.a > t && (enYakin === -1 || p.a < parcalar[enYakin].a)) enYakin = n;
    }
    return enYakin === -1 ? toplam : baslangiclar[enYakin];
  }

  /** Kurgu saniyesi → kaynak saniyesi (önizlemede oynatma kafasını taşımak için). */
  function kurgudanKaynaga(c) {
    for (let n = 0; n < parcalar.length; n++) {
      const uzunluk = (parcalar[n].b - parcalar[n].a) / hiz;
      if (c <= baslangiclar[n] + uzunluk + 1e-6) return parcalar[n].a + Math.max(0, c - baslangiclar[n]) * hiz;
    }
    return parcalar.length ? parcalar[parcalar.length - 1].b : 0;
  }

  /** Kalan kelimeler, kurgu zamanıyla. Altyazı bunu kullanır; kesilmiş video yeniden yazıya dökülmez. */
  function kurguKelimeleri() {
    const liste = [];
    parcalar.forEach((p, n) => {
      for (let i = 0; i < K.length; i++) {
        if (!kaliyor(i)) continue;
        if (!bolumIcinde(i, p.bolum)) continue;
        const orta = (K[i].bas + K[i].bit) / 2;
        if (orta < p.a || orta > p.b) continue;
        const bas = baslangiclar[n] + (Math.max(K[i].bas, p.a) - p.a) / hiz;
        const bit = baslangiclar[n] + (Math.min(K[i].bit, p.b) - p.a) / hiz;
        liste.push({ i, m: K[i].m, bas: +bas.toFixed(3), bit: +Math.max(bit, bas + 0.04).toFixed(3) });
      }
    });
    return liste;
  }
  function bolumIcinde(i, bolum) {
    const [ilk, son] = bolumler[bolum];
    return i >= ilk && i <= son;
  }

  return {
    parcalar,
    baslangiclar,
    duraklamalar,
    sure: toplam,
    hiz,
    kaliyor,
    kaynaktanKurguya,
    kurgudanKaynaga,
    kurguKelimeleri,
  };
}

/**
 * Parça sınırlarını kare çizgisine oturtur. Görüntü kare kare, ses örnek örnek kesilir; sınırlar
 * tam kareye denk gelmezse her kesimde ses ile görüntü arasında küçük bir kayma birikir.
 */
export function kareyeOturt(parcalar, fps) {
  const cikti = [];
  for (const p of parcalar) {
    const a = Math.round(p.a * fps);
    const b = Math.round(p.b * fps);
    if (b - a < 2) continue; // iki kareden kısa parça görünmez, yalnızca titreme yapar
    const onceki = cikti[cikti.length - 1];
    // Aynı bölümde art arda gelen ve arasında boşluk kalmayan parçalar birleşir.
    if (onceki && onceki.bolum === p.bolum && a <= onceki.kb && a >= onceki.ka) {
      onceki.kb = Math.max(onceki.kb, b);
      onceki.b = onceki.kb / fps;
      continue;
    }
    cikti.push({ a: a / fps, b: b / fps, bolum: p.bolum, ka: a, kb: b });
  }
  return cikti;
}

/**
 * Kelimeleri konuşma satırlarına böler: cümle sonunda ya da belirgin duraklamada yeni satır.
 * Kesim önerisi ve inceleme sayfası kelimeleri bu satırlarla gösterir.
 */
export function satirlaraBol(kelimeler, enAzBosluk = 0.45, enCokKelime = 18) {
  const satirlar = [];
  let simdiki = [];
  kelimeler.forEach((k, i) => {
    simdiki.push(i);
    const sonraki = kelimeler[i + 1];
    const cumleSonu = /[.!?…]["')\]]?$/.test(k.m);
    const bosluk = sonraki ? sonraki.bas - k.bit : Infinity;
    if (!sonraki || cumleSonu || bosluk >= enAzBosluk || simdiki.length >= enCokKelime) {
      satirlar.push({ ilk: simdiki[0], son: i, bas: kelimeler[simdiki[0]].bas, bit: k.bit });
      simdiki = [];
    }
  });
  return satirlar;
}

/**
 * Kararların kısa özeti. Önizleme hangi kararlarla alındı, sonradan bir şey değişti mi diye karşılaştırmak
 * için kullanılır; sayfa ve araçlar aynı özeti üretir.
 */
export function kararOzeti(k) {
  const sirali = (liste) => [...(liste || [])].sort((a, b) => a - b);
  const cekirdek = JSON.stringify([
    sirali(k.kes),
    sirali(k.tutDuraklama),
    k.bas ?? null,
    k.bit ?? null,
    k.sira ?? null,
    Object.entries(k.duzeltme || {}).sort(([a], [b]) => Number(a) - Number(b)),
    sirali(k.vurgu),
    Object.entries(k.kartlar || {}).map(([n, d]) => [n, d.durum || 'tut', d.not || '', d.ses === false ? 'sessiz' : d.ses === true ? 'sesli' : '']).sort(([a], [b]) => Number(a) - Number(b)),
    Object.entries(k.stilIstegi?.altyazi || {}).sort(),
  ]);
  let h = 2166136261;
  for (let i = 0; i < cekirdek.length; i++) h = Math.imul(h ^ cekirdek.charCodeAt(i), 16777619);
  return (h >>> 0).toString(16);
}
