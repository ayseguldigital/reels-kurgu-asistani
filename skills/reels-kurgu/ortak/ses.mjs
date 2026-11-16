// Ses düzeyi: ölçme ve hedefe getirme.
import { rename, rm } from 'node:fs/promises';
import { calistir } from './calistir.mjs';

export const HEDEF_LUFS = -14; // Instagram ve TikTok'un sesi getirdiği düzey
export const TEPE = -1.5; // en yüksek anın geçmemesi gereken sınır (dB)

/** Bir ses dosyasının ortalama düzeyini (LUFS) ve en yüksek anını (dB) ölçer. */
export async function lufsOlc(dosya) {
  const o = await calistir('ffmpeg', ['-hide_banner', '-nostats', '-i', dosya, '-af', 'ebur128=peak=true', '-f', 'null', '-']);
  const ozet = o.hata.slice(o.hata.lastIndexOf('Summary:'));
  const duzey = /I:\s+(-?[\d.]+) LUFS/.exec(ozet);
  const tepe = /Peak:\s+(-?[\d.]+) dBFS/.exec(ozet);
  return { lufs: duzey ? Number(duzey[1]) : null, tepe: tepe ? Number(tepe[1]) : null };
}

/**
 * Dosyanın ortalama düzeyini hedefe getirir (dosyayı yerinde günceller).
 * Önce düz kazanç dener. En yüksek anlar sınırı aşacaksa sınırlayıcı devreye girer; sınırlayıcı
 * düzeyi biraz düşürdüğü için ölçüp birkaç kez yineler.
 * @returns {Promise<{lufs:number|null, tepe:number|null}>} son ölçüm
 */
export async function duzeyeGetir(dosya, hedef = HEDEF_LUFS, secenek = {}) {
  const { hz = 48000, kanal = 1 } = secenek;
  const sinir = Math.pow(10, TEPE / 20).toFixed(3);
  let olcum = await lufsOlc(dosya);
  for (let tur = 0; tur < 4; tur++) {
    if (olcum.lufs === null || olcum.lufs < -60) break; // ölçülemedi ya da neredeyse sessiz: dokunma
    const fark = hedef - olcum.lufs;
    if (Math.abs(fark) <= 0.4) break;
    const sinirGerek = (olcum.tepe ?? 0) + fark > TEPE;
    const suzgec = sinirGerek
      ? `volume=${fark.toFixed(2)}dB,alimiter=limit=${sinir}:attack=3:release=60:level=false`
      : `volume=${fark.toFixed(2)}dB`;
    const gecici = `${dosya}.duzey.wav`;
    await calistir('ffmpeg', ['-v', 'error', '-y', '-i', dosya, '-af', suzgec, '-ar', String(hz), '-ac', String(kanal), '-c:a', 'pcm_s16le', gecici]);
    await rm(dosya, { force: true });
    await rename(gecici, dosya);
    olcum = await lufsOlc(dosya);
  }
  return olcum;
}
