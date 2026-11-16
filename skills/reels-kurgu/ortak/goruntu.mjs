// Görüntü kaynağı: araçların kare okuduğu video. Çoğu zaman ham kaydın kendisidir.
//
// Telefonlar (özellikle iPhone) videoyu olağan ayarda HDR çeker: daha geniş bir parlaklık ve renk aralığı.
// Reels ise olağan renk aralığında (SDR) hazırlanır. HDR kayıt dönüştürülmeden kullanılırsa renkler soluk
// ve gri çıkar. Bu yüzden HDR kayıt bir kez SDR'ye çevrilir ve sonraki bütün adımlar o kopyayı kullanır.
// Dönüşümü Mac'in kendi görüntü işlemcisi (VideoToolbox) yapar. Gerçek bir iPhone kaydında (HLG, Dolby Vision)
// Apple'ın kendi dışa aktarımıyla karşılaştırıldı: iki sonuç gözle ayırt edilemeyecek kadar yakın (PSNR 44 dB).
import { stat } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { calistir, medyaBilgisi } from './calistir.mjs';
import { hamBul, araKlasor } from './yollar.mjs';

/**
 * @param {string} klasor proje klasörü
 * @returns {Promise<{dosya:string, ham:string, hdr:boolean, donusturuldu:boolean, uyari:string|null}>}
 */
export async function goruntuKaynagi(klasor) {
  const ham = await hamBul(klasor);
  const bilgi = await medyaBilgisi(ham);
  if (!bilgi.hdr) return { dosya: ham, ham, hdr: false, donusturuldu: false, uyari: null };

  const hedef = path.join(await araKlasor(klasor), 'ham-sdr.mp4');
  try {
    const [h, s] = await Promise.all([stat(ham), stat(hedef)]);
    if (s.size > 0 && s.mtimeMs >= h.mtimeMs) return { dosya: hedef, ham, hdr: true, donusturuldu: true, uyari: null };
  } catch {
    /* henüz dönüştürülmemiş */
  }
  if (os.platform() !== 'darwin') {
    return {
      dosya: ham, ham, hdr: true, donusturuldu: false,
      uyari: 'Bu kayıt HDR çekilmiş ve bu bilgisayarda dönüştürülemiyor; renkler soluk çıkabilir. Telefonun kamera ayarından HDR videoyu kapatıp yeniden çekin.',
    };
  }

  console.error('Kayıt HDR çekilmiş; olağan renk aralığına çevriliyor (bir kez yapılır)…');
  // Donanım kareleri üstünde döndürme yapılamadığı için kendiliğinden döndürme kapatılır ve elle uygulanır.
  const aci = ((Math.round(bilgi.donme) % 360) + 360) % 360;
  const dondur = aci === 270 ? 'transpose=1,' : aci === 90 ? 'transpose=2,' : aci === 180 ? 'hflip,vflip,' : '';
  // Telefonlar 4K ve saniyede 60 kare çekebilir; Reels 1080×1920 ve en çok 30 karedir. Dönüşüm doğrudan
  // hedef boyutta yapılır, yoksa iki dakikalık bir kayıt on dakikadan uzun sürer.
  const yan = aci === 90 || aci === 270; // kayıt yan duruyor: depolanan kare, görünenin 90° dönmüşü
  const oran = Math.min(1, Math.max(1080 / bilgi.en, 1920 / bilgi.boy)); // kadrajı dolduracak kadar küçült, büyütme
  const cift = (x) => Math.max(2, Math.round((x * oran) / 2) * 2);
  const [gEn, gBoy] = [cift(bilgi.en), cift(bilgi.boy)];
  const olcek = yan ? `w=${gBoy}:h=${gEn}` : `w=${gEn}:h=${gBoy}`;
  const kareHizi = bilgi.fps > 30.5 ? 'fps=30,' : '';
  try {
    await calistir('ffmpeg', [
      '-v', 'error', '-y', '-noautorotate', '-hwaccel', 'videotoolbox', '-hwaccel_output_format', 'videotoolbox_vld', '-i', ham, '-an',
      '-vf', `scale_vt=${olcek}:color_matrix=bt709:color_primaries=bt709:color_transfer=bt709,hwdownload,format=p010le,${kareHizi}${dondur}sidedata=mode=delete:type=DISPLAYMATRIX,format=yuv420p`,
      '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '14', '-g', '15',
      '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709', '-color_range', 'tv',
      hedef,
    ]);
    const sonuc = await medyaBilgisi(hedef);
    if (!sonuc.goruntuVar || Math.abs(sonuc.sure - bilgi.sure) > 0.5) throw new Error('dönüştürülen dosya eksik');
    return {
      dosya: hedef, ham, hdr: true, donusturuldu: true,
      uyari: 'Kayıt HDR çekilmişti; Reels\'in renk aralığına çevrildi (bir kez yapılır, sonraki adımlar bu kopyayı kullanır).',
    };
  } catch (e) {
    return {
      dosya: ham, ham, hdr: true, donusturuldu: false,
      uyari: `Bu kayıt HDR çekilmiş ama dönüştürülemedi (${String(e.message).split('\n')[0]}); renkler soluk çıkabilir. Telefonun kamera ayarından HDR videoyu kapatıp yeniden çekin.`,
    };
  }
}
