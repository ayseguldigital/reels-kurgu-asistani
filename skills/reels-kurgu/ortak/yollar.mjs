// Dosyaların durduğu yerler. Tek yerde tanımlı ki bütün araçlar aynı klasörlere baksın.
import os from 'node:os';
import path from 'node:path';
import { readdir, readFile, mkdir } from 'node:fs/promises';

/** Kişinin videolarının ve stil dosyasının durduğu klasör. Finder'da: Filmler → Reels Kurgu */
export const CALISMA = process.env.REELS_KURGU_KLASORU || path.join(os.homedir(), 'Movies', 'Reels Kurgu');

/** İndirilen model ve önbellek. Gizli klasör; silinirse yeniden indirilir. */
export const DEPO = process.env.REELS_KURGU_DEPO || path.join(os.homedir(), '.reels-kurgu');

export const MODEL = {
  ad: 'large-v3-turbo',
  dosya: path.join(DEPO, 'modeller', 'ggml-large-v3-turbo.bin'),
  adres: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v3-turbo.bin',
  sha1: '4af2b29d7ec73d781377bfd1758ca957a807e941',
  bayt: 1624555275,
};

/** Animasyon kütüphanesi (GSAP). Depoda dağıtılmaz; kurulumda resmî kaynağından indirilir. */
export const GSAP = {
  surum: '3.14.2',
  dosya: path.join(DEPO, 'gsap', 'gsap.min.js'),
  adres: 'https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js',
  sha256: 'c174bfce53a729418d57a8ad8625e7247c793a22fef8e2851e3cfa3de9cd8280',
};

/** HyperFrames sürümü sabittir; yeni sürüm ancak denendikten sonra buradan yükseltilir. */
export const HYPERFRAMES_SURUM = '0.8.167';

/** HyperFrames komutu ve ortamı. Telemetri, güncelleme denetimi ve kendiliğinden kurulumlar kapalıdır. */
export function hyperframes() {
  const ozel = process.env.REELS_KURGU_HYPERFRAMES;
  return {
    komut: ozel || 'npx',
    on: ozel ? [] : ['-y', `hyperframes@${HYPERFRAMES_SURUM}`],
    ortam: {
      ...process.env,
      HYPERFRAMES_NO_TELEMETRY: '1',
      DO_NOT_TRACK: '1',
      HYPERFRAMES_NO_UPDATE_CHECK: '1',
      HYPERFRAMES_NO_AUTO_INSTALL: '1',
      HYPERFRAMES_SKIP_SKILLS: '1',
      NO_COLOR: '1',
    },
  };
}

export const STIL_DOSYASI = path.join(CALISMA, 'stil.json');

const VIDEO_UZANTILARI = ['.mov', '.mp4', '.m4v', '.mkv', '.webm', '.avi'];

/** Proje klasöründeki ham kaydı bulur ("ham.mov", "ham.mp4" …). */
export async function hamBul(klasor) {
  const dosyalar = await readdir(klasor);
  const ham = dosyalar.find((d) => {
    const u = path.extname(d).toLowerCase();
    return path.basename(d, path.extname(d)).toLowerCase() === 'ham' && VIDEO_UZANTILARI.includes(u);
  });
  if (!ham) {
    throw new Error(
      `"${klasor}" içinde ham kayıt yok. Videoyu bu klasöre "ham" adıyla kopyalayın (örnek: ham.mov). Özgün dosyaya dokunulmaz.`,
    );
  }
  return path.join(klasor, ham);
}

/** Proje klasöründe ara dosyaların durduğu alt klasör. */
export async function araKlasor(klasor) {
  const yol = path.join(klasor, '.ara');
  await mkdir(yol, { recursive: true });
  return yol;
}

/** JSON dosyasını okur; dosya yoksa varsayılanı döndürür. */
export async function jsonOku(dosya, varsayilan = undefined) {
  try {
    return JSON.parse(await readFile(dosya, 'utf8'));
  } catch (e) {
    if (e.code === 'ENOENT' && varsayilan !== undefined) return varsayilan;
    if (e.code === 'ENOENT') throw new Error(`"${dosya}" bulunamadı.`);
    throw new Error(`"${dosya}" okunamadı: ${e.message}`);
  }
}

/** Komut satırından proje klasörünü alır; verilmediyse kullanım yazısıyla durur. */
export function klasorAl(kullanim) {
  const klasor = process.argv.slice(2).find((a) => !a.startsWith('--'));
  if (!klasor) {
    console.error(`Kullanım: ${kullanim}`);
    process.exit(2);
  }
  return path.resolve(klasor.replace(/^~(?=$|\/)/, os.homedir()));
}

/** "--ad deger" biçimindeki seçeneği okur. */
export function secenek(ad, varsayilan = null) {
  const i = process.argv.indexOf(`--${ad}`);
  if (i === -1) return varsayilan;
  const deger = process.argv[i + 1];
  return deger === undefined || deger.startsWith('--') ? true : deger;
}
