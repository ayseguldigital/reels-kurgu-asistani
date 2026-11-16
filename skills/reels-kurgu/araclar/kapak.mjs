#!/usr/bin/env node
// Kapak stüdyosu: videodan bir kare seçip üstüne başlık yazarak Reels kapağı hazırlanan sayfa.
//
//   node araclar/kapak.mjs <proje klasörü> [--port N]
//
// Sayfa yalnızca bu bilgisayarda açılır (127.0.0.1). Kareler videodan tam kalitede alınır; hiçbir şey
// bilgisayardan çıkmaz. Kişinin seçimleri <proje>/kapak.json dosyasında durur ve sayfa yeniden açıldığında
// kaldığı yerden devam eder. Kaydedilen kapaklar <proje>/bitmis/ klasörüne yazılır.
//
// Yüz ifadesini kişi seçer. Örnek kareler videoya eşit aralıklarla dağıtılmıştır; hiçbiri "en iyi kare"
// diye sunulmaz.
import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { writeFile, readFile, mkdir, stat, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { calistir, medyaBilgisi } from '../ortak/calistir.mjs';
import { stilOku } from '../ortak/stil.mjs';
import { hamBul, araKlasor, jsonOku, klasorAl, secenek } from '../ortak/yollar.mjs';

const BURASI = path.dirname(fileURLToPath(import.meta.url));
const KOK = path.join(BURASI, '..');
const SAYFA = path.join(KOK, 'kapak', 'sayfa.html');
const FONTLAR = path.join(KOK, 'fontlar');
const EN = 1080;
const BOY = 1920;
const BOYUTLAR = { 1920: 'kapak-1080x1920.png', 1440: 'kapak-1080x1440.png', 1080: 'kapak-1080x1080.png' };

const klasor = klasorAl('node araclar/kapak.mjs <proje klasörü> [--port N]');
const port = Number(secenek('port', process.env.PORT || 4318));
const ara = await araKlasor(klasor);
const stil = await stilOku(klasor);
const fontListesi = await jsonOku(path.join(FONTLAR, 'fontlar.json'));

async function varMi(dosya) {
  try {
    await access(dosya);
    return true;
  } catch {
    return false;
  }
}

// --- Kaynaklar: kesilmiş video (varsa) ve ham kayıt. Ham kayıtta kesilen yerlerden de kare seçilebilir.
const kaynaklar = [];
const kesim = path.join(klasor, 'kesim.mp4');
if (await varMi(kesim)) {
  const b = await medyaBilgisi(kesim);
  kaynaklar.push({ ad: 'kesim', etiket: 'Kesilmiş video', dosya: kesim, onizleme: kesim, sure: b.sure, fps: b.fps || 30 });
}
const ham = await hamBul(klasor);
{
  const b = await medyaBilgisi(ham);
  // Ham kayıt her tarayıcıda oynamayabilir (telefon kayıtları); gezinmek için hafif bir kopyası kullanılır.
  let onizleme = path.join(klasor, 'inceleme', 'kaynak.mp4');
  if (!(await varMi(onizleme))) {
    onizleme = path.join(ara, 'kapak-ham-onizleme.mp4');
    if (!(await varMi(onizleme))) {
      console.error('Ham kayıt için gezinme kopyası hazırlanıyor…');
      await calistir('ffmpeg', [
        '-v', 'error', '-y', '-i', ham, '-an',
        '-vf', 'scale=-2:960:force_original_aspect_ratio=decrease,scale=trunc(iw/2)*2:trunc(ih/2)*2,fps=30',
        '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '28', '-g', '10', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', onizleme,
      ]);
    }
  }
  kaynaklar.push({ ad: 'ham', etiket: 'Ham kayıt (kesilen yerler dahil)', dosya: ham, onizleme, sure: b.sure, fps: b.fps > 30.5 ? 30 : b.fps || 30 });
}

/** Videodan tek kare: tam kalite PNG (kapak için) ya da küçük JPEG (örnek kareler için). */
const kareOnbellegi = new Map();
async function kareAl(kaynak, t, kucuk) {
  const anahtar = `${kaynak.ad}:${t.toFixed(3)}:${kucuk ? 'k' : 'b'}`;
  if (kareOnbellegi.has(anahtar)) return kareOnbellegi.get(anahtar);
  const an = Math.max(0, Math.min(t, kaynak.sure - 0.05));
  const olcek = kucuk ? 'scale=216:384:force_original_aspect_ratio=increase,crop=216:384' : `scale=${EN}:${BOY}:force_original_aspect_ratio=increase:flags=lanczos,crop=${EN}:${BOY}`;
  const { cikti } = await calistir(
    'ffmpeg',
    ['-v', 'error', '-ss', an.toFixed(3), '-i', kaynak.dosya, '-frames:v', '1', '-vf', olcek, '-f', 'image2pipe', '-c:v', kucuk ? 'mjpeg' : 'png', ...(kucuk ? ['-q:v', '4'] : []), '-'],
    { ikili: true },
  );
  if (kareOnbellegi.size > 40) kareOnbellegi.delete(kareOnbellegi.keys().next().value);
  kareOnbellegi.set(anahtar, cikti);
  return cikti;
}

function dosyaGonder(istek, yanit, dosya, tur) {
  return stat(dosya).then(
    (bilgi) => {
      const aralik = /^bytes=(\d*)-(\d*)$/.exec(istek.headers.range || '');
      if (aralik) {
        const bas = aralik[1] ? Number(aralik[1]) : 0;
        const bit = aralik[2] ? Math.min(Number(aralik[2]), bilgi.size - 1) : bilgi.size - 1;
        yanit.writeHead(206, { 'Content-Type': tur, 'Content-Range': `bytes ${bas}-${bit}/${bilgi.size}`, 'Accept-Ranges': 'bytes', 'Content-Length': bit - bas + 1 });
        createReadStream(dosya, { start: bas, end: bit }).pipe(yanit);
      } else {
        yanit.writeHead(200, { 'Content-Type': tur, 'Content-Length': bilgi.size, 'Accept-Ranges': 'bytes' });
        createReadStream(dosya).pipe(yanit);
      }
    },
    () => yanit.writeHead(404).end('yok'),
  );
}
const jsonGonder = (yanit, veri, kod = 200) =>
  yanit.writeHead(kod, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }).end(JSON.stringify(veri));
async function govdeOku(istek, sinir) {
  const parcalar = [];
  let toplam = 0;
  for await (const p of istek) {
    toplam += p.length;
    if (toplam > sinir) throw new Error('çok büyük');
    parcalar.push(p);
  }
  return Buffer.concat(parcalar);
}

const sunucu = createServer(async (istek, yanit) => {
  try {
    const adres = new URL(istek.url, 'http://x');
    const yol = decodeURIComponent(adres.pathname);
    if (yol === '/' || yol === '/index.html') {
      yanit.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' }).end(await readFile(SAYFA));
    } else if (yol === '/api/durum') {
      jsonGonder(yanit, {
        ad: path.basename(klasor),
        renkler: stil.renkler,
        fontlar: fontListesi.map((f) => ({ aile: f.aile, tur: f.tur, aciklama: f.aciklama, dosyalar: f.dosyalar })),
        stilFontlari: stil.fontlar,
        kaynaklar: kaynaklar.map((k) => ({ ad: k.ad, etiket: k.etiket, sure: k.sure, fps: k.fps })),
        kapak: await jsonOku(path.join(klasor, 'kapak.json'), null),
      });
    } else if (yol === '/api/kapak' && istek.method === 'PUT') {
      const govde = (await govdeOku(istek, 200_000)).toString();
      JSON.parse(govde);
      await writeFile(path.join(klasor, 'kapak.json'), govde);
      jsonGonder(yanit, { tamam: true });
    } else if (yol === '/api/kare') {
      const kaynak = kaynaklar.find((k) => k.ad === adres.searchParams.get('kaynak')) || kaynaklar[0];
      const kucuk = adres.searchParams.has('kucuk');
      const veri = await kareAl(kaynak, Number(adres.searchParams.get('t')) || 0, kucuk);
      yanit.writeHead(200, { 'Content-Type': kucuk ? 'image/jpeg' : 'image/png', 'Content-Length': veri.length, 'Cache-Control': 'no-store' }).end(veri);
    } else if (yol === '/api/kaydet' && istek.method === 'POST') {
      const ad = BOYUTLAR[adres.searchParams.get('boy')];
      if (!ad) throw new Error('bilinmeyen boyut');
      const veri = await govdeOku(istek, 30_000_000);
      if (veri.subarray(1, 4).toString() !== 'PNG') throw new Error('PNG değil');
      const hedefKlasor = path.join(klasor, 'bitmis');
      await mkdir(hedefKlasor, { recursive: true });
      await writeFile(path.join(hedefKlasor, ad), veri);
      jsonGonder(yanit, { dosya: path.join(hedefKlasor, ad) });
    } else if (yol.startsWith('/medya/')) {
      const kaynak = kaynaklar.find((k) => `/medya/${k.ad}.mp4` === yol);
      if (!kaynak) yanit.writeHead(404).end('yok');
      else await dosyaGonder(istek, yanit, kaynak.onizleme, 'video/mp4');
    } else if (yol.startsWith('/fontlar/') && yol.endsWith('.woff2') && !yol.includes('..')) {
      await dosyaGonder(istek, yanit, path.join(FONTLAR, yol.slice('/fontlar/'.length)), 'font/woff2');
    } else {
      yanit.writeHead(404).end('yok');
    }
  } catch (e) {
    jsonGonder(yanit, { hata: String(e.message || e) }, 500);
  }
});
sunucu.listen(port, '127.0.0.1', () => {
  console.log(`Kapak stüdyosu açık: http://127.0.0.1:${port}`);
  console.log(`Kaydedilen kapaklar: ${path.join(klasor, 'bitmis')}`);
});
sunucu.on('error', (e) => {
  console.error(e.code === 'EADDRINUSE' ? `HATA: ${port} numaralı kapı dolu. Başka bir kapı deneyin: --port ${port + 1}` : `HATA: ${e.message}`);
  process.exit(1);
});
