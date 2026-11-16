// Ses düzeyi ölçümü: kaydın arka plan gürültüsünü, konuşma düzeyini ve sessiz aralıkları bulur.
//
// Sabit bir "sessizlik" eşiği kullanılmaz. Sessiz odada çekilen kayıtla kafede çekilen kaydın
// arka planı aynı değildir; eşik her kaydın kendi gürültüsüne göre konur.
import { calistir } from './calistir.mjs';

const HZ = 16000;
const ADIM = 0.01; // saniye
const KARE = HZ * ADIM; // bir ölçüm adımındaki örnek sayısı

function yuzdelik(siraliDizi, oran) {
  if (!siraliDizi.length) return -100;
  const i = Math.min(siraliDizi.length - 1, Math.max(0, Math.round((siraliDizi.length - 1) * oran)));
  return siraliDizi[i];
}

/**
 * @param {string} dosya ses ya da video dosyası
 * @param {{enAzSessizlik?: number}} [secenek] bu süreden (sn) kısa sessizlikler listeye girmez
 * @returns {Promise<{adim:number, db:Float32Array, sure:number, taban:number, konusma:number, esik:number,
 *   sessizlikler:{bas:number, bit:number}[]}>}
 */
export async function duzeyOlc(dosya, secenek = {}) {
  const { enAzSessizlik = 0.1 } = secenek;
  const { cikti } = await calistir(
    'ffmpeg',
    ['-v', 'error', '-i', dosya, '-vn', '-ac', '1', '-ar', String(HZ), '-f', 's16le', '-'],
    { ikili: true },
  );
  const ornek = new Int16Array(cikti.buffer, cikti.byteOffset, Math.floor(cikti.byteLength / 2));
  const kareSayisi = Math.floor(ornek.length / KARE);
  const guc = new Float64Array(kareSayisi);
  for (let k = 0; k < kareSayisi; k++) {
    let toplam = 0;
    const bas = k * KARE;
    for (let i = 0; i < KARE; i++) {
      const o = ornek[bas + i] / 32768;
      toplam += o * o;
    }
    guc[k] = toplam / KARE;
  }
  // Üç adımlık ortalama: tek adımlık sıçramalar (tık, dudak sesi) düzeyi oynatmasın.
  const db = new Float32Array(kareSayisi);
  for (let k = 0; k < kareSayisi; k++) {
    const once = guc[Math.max(0, k - 1)];
    const sonra = guc[Math.min(kareSayisi - 1, k + 1)];
    const ort = (once + guc[k] + sonra) / 3;
    db[k] = ort > 1e-10 ? 10 * Math.log10(ort) : -100;
  }

  // Tam dijital sessizlik (kayıt başındaki boşluk gibi) tabanı yanıltmasın.
  const sirali = Array.from(db).filter((d) => d > -95).sort((a, b) => a - b);
  const taban = yuzdelik(sirali, 0.1);
  const konusma = yuzdelik(sirali, 0.9);
  const aralik = Math.max(0, konusma - taban);
  const esik = taban + Math.min(12, Math.max(4, aralik * 0.3));

  // Eşiğin altında kalan aralıklar. 20 ms'den kısa sıçramalar sessizliği bölmez.
  const sessizlikler = [];
  let bas = -1;
  let ustte = 0;
  for (let k = 0; k <= kareSayisi; k++) {
    const sessiz = k < kareSayisi && db[k] < esik;
    if (sessiz) {
      if (bas === -1) bas = k;
      ustte = 0;
    } else if (bas !== -1) {
      ustte++;
      if (ustte > 2 || k === kareSayisi) {
        const bit = k - ustte + 1;
        if ((bit - bas) * ADIM >= enAzSessizlik) {
          sessizlikler.push({ bas: +(bas * ADIM).toFixed(2), bit: +(bit * ADIM).toFixed(2) });
        }
        bas = -1;
        ustte = 0;
      }
    }
  }

  return {
    adim: ADIM,
    db,
    sure: kareSayisi * ADIM,
    taban: +taban.toFixed(1),
    konusma: +konusma.toFixed(1),
    esik: +esik.toFixed(1),
    sessizlikler,
  };
}

/** Verilen aralıkta eşiğin üstünde kalan sürenin toplamı (sn). "Kelime yok ama ses var" yerlerini bulmak için. */
export function sesliSure(olcum, bas, bit) {
  const k0 = Math.max(0, Math.floor(bas / olcum.adim));
  const k1 = Math.min(olcum.db.length, Math.ceil(bit / olcum.adim));
  let sayi = 0;
  for (let k = k0; k < k1; k++) if (olcum.db[k] >= olcum.esik) sayi++;
  return sayi * olcum.adim;
}

/**
 * İki ses dosyası arasındaki zaman kaymasını ölçer (saniye). Artı değer: `islenmis`, `asil`dan geç kalıyor.
 * Gürültü azaltma gibi süzgeçler sesi birkaç on milisaniye geciktirebilir; görüntüyle eşleşme bozulmasın diye
 * ölçülür ve düzeltilir. Konuşmanın en güçlü olduğu üç saniyede, ±80 ms içinde aranır.
 */
export async function kaymaOlc(asil, islenmis) {
  const oku = async (dosya) => {
    const { cikti } = await calistir('ffmpeg', ['-v', 'error', '-i', dosya, '-vn', '-ac', '1', '-ar', String(HZ), '-f', 's16le', '-'], { ikili: true });
    return new Int16Array(cikti.buffer, cikti.byteOffset, Math.floor(cikti.byteLength / 2));
  };
  const a = await oku(asil);
  const b = await oku(islenmis);
  const n = Math.min(a.length, b.length);
  const pencere = HZ * 3;
  const enCok = Math.round(HZ * 0.08);
  if (n < pencere + enCok * 4) return 0;
  // En güçlü üç saniye
  let enIyiBas = enCok;
  let enIyiGuc = -1;
  for (let i = enCok; i < n - pencere - enCok; i += HZ / 2) {
    let guc = 0;
    for (let j = i; j < i + pencere; j += 16) guc += Math.abs(a[j]);
    if (guc > enIyiGuc) {
      enIyiGuc = guc;
      enIyiBas = i;
    }
  }
  let enIyiKayma = 0;
  let enIyiIlinti = -Infinity;
  for (let k = -enCok; k <= enCok; k++) {
    let toplam = 0;
    for (let i = enIyiBas; i < enIyiBas + pencere; i += 2) toplam += a[i] * b[i + k];
    if (toplam > enIyiIlinti) {
      enIyiIlinti = toplam;
      enIyiKayma = k;
    }
  }
  return enIyiKayma / HZ;
}
