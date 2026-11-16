// Dış programları (ffmpeg, ffprobe, whisper-cli) çalıştırmak için küçük yardımcılar.
import { spawn } from 'node:child_process';
import { access } from 'node:fs/promises';
import { constants } from 'node:fs';
import path from 'node:path';

// Homebrew'un kurduğu araçlar (ffmpeg, whisper-cli) bazı kabuklarda yolda görünmez; iki olağan klasör eklenir.
for (const klasor of ['/opt/homebrew/bin', '/usr/local/bin']) {
  if (!(process.env.PATH || '').split(path.delimiter).includes(klasor)) process.env.PATH = `${process.env.PATH || ''}${path.delimiter}${klasor}`;
}

/**
 * Bir programı çalıştırır, bitince çıktısını döndürür.
 * @param {string} komut
 * @param {string[]} argumanlar
 * @param {{ikili?: boolean, izin?: number[], canli?: boolean, ortam?: object, klasor?: string}} [secenek]
 *   ikili: stdout Buffer olarak döner. izin: hata sayılmayacak çıkış kodları. canli: stderr ekrana da akar.
 *   ortam: ortam değişkenleri. klasor: komutun çalışacağı klasör.
 */
export function calistir(komut, argumanlar, secenek = {}) {
  const { ikili = false, izin = [0], canli = false, ortam = undefined, klasor = undefined } = secenek;
  return new Promise((coz, reddet) => {
    const surec = spawn(komut, argumanlar, { stdio: ['ignore', 'pipe', 'pipe'], env: ortam, cwd: klasor });
    const cikti = [];
    let hata = '';
    surec.stdout.on('data', (p) => cikti.push(p));
    surec.stderr.on('data', (p) => {
      hata += p.toString();
      if (canli) process.stderr.write(p);
    });
    surec.on('error', (e) => {
      if (e.code === 'ENOENT') reddet(new Error(`"${komut}" bulunamadı. Önce kurulum kontrolünü çalıştırın: node araclar/kontrol.mjs`));
      else reddet(e);
    });
    surec.on('close', (kod) => {
      const govde = Buffer.concat(cikti);
      if (!izin.includes(kod)) {
        const son = hata.trim().split('\n').slice(-6).join('\n');
        reddet(new Error(`${komut} başarısız oldu (kod ${kod}):\n${son}`));
        return;
      }
      coz({ kod, cikti: ikili ? govde : govde.toString(), hata });
    });
  });
}

/** Program PATH içinde var mı? Varsa tam yolunu döndürür. */
export async function bul(ad) {
  for (const klasor of (process.env.PATH || '').split(path.delimiter)) {
    if (!klasor) continue;
    const aday = path.join(klasor, ad);
    try {
      await access(aday, constants.X_OK);
      return aday;
    } catch {
      /* sıradaki klasöre bak */
    }
  }
  return null;
}

/** Bir medya dosyasının temel bilgisi (ffprobe). */
export async function medyaBilgisi(dosya) {
  const { cikti } = await calistir('ffprobe', [
    '-v', 'error', '-print_format', 'json', '-show_format', '-show_streams', dosya,
  ]);
  const veri = JSON.parse(cikti);
  const goruntu = (veri.streams || []).find((a) => a.codec_type === 'video');
  const ses = (veri.streams || []).find((a) => a.codec_type === 'audio');
  const sure = Number(veri.format?.duration || goruntu?.duration || ses?.duration || 0);
  let en = goruntu?.width ?? 0;
  let boy = goruntu?.height ?? 0;
  const donme = Number(
    (goruntu?.side_data_list || []).find((y) => y.rotation !== undefined)?.rotation ?? goruntu?.tags?.rotate ?? 0,
  );
  if (Math.abs(donme) % 180 === 90) [en, boy] = [boy, en];
  let fps = 0;
  if (goruntu?.avg_frame_rate && goruntu.avg_frame_rate !== '0/0') {
    const [pay, payda] = goruntu.avg_frame_rate.split('/').map(Number);
    fps = payda ? pay / payda : pay;
  }
  return {
    sure,
    goruntuVar: Boolean(goruntu),
    sesVar: Boolean(ses),
    en,
    boy,
    fps,
    donme,
    kodek: goruntu?.codec_name ?? null,
    renkAktarimi: goruntu?.color_transfer ?? null,
    hdr: ['arib-std-b67', 'smpte2084'].includes(goruntu?.color_transfer),
  };
}

/** Saniyeyi "1:23.4" biçiminde yazar. */
export function sureYaz(saniye, ondalik = 1) {
  const s = Math.max(0, saniye);
  const dk = Math.floor(s / 60);
  const kalan = (s - dk * 60).toFixed(ondalik).padStart(ondalik ? 3 + ondalik : 2, '0');
  return `${dk}:${kalan}`;
}

// Araçlar hata verdiğinde kod dökümü yerine tek satırlık anlaşılır bir mesaj göstersin.
// Ayrıntı gerekirse: REELS_KURGU_AYRINTI=1
process.on('uncaughtException', (hata) => {
  if (process.env.REELS_KURGU_AYRINTI) console.error(hata);
  else console.error(`HATA: ${hata?.message ?? hata}`);
  process.exit(1);
});
