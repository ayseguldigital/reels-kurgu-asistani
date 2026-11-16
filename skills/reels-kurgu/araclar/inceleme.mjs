#!/usr/bin/env node
// İnceleme: kişinin kesimleri, altyazıyı ve grafikleri render'dan önce onayladığı sayfa.
//
//   node araclar/inceleme.mjs hazirla <proje klasörü>            sayfanın verisini ve hafif videoyu hazırlar
//   node araclar/inceleme.mjs sunucu  <proje klasörü> [--port N]  sayfayı bu bilgisayarda açar
//   node araclar/inceleme.mjs taslak  <proje klasörü>            taslak.mp4'ü sayfada gösterilecek hâle getirir
//   node araclar/inceleme.mjs paket   <proje klasörü> --kaynak <adres> …  claude.ai sayfasına yazılacak belgeleri hazırlar
//   node araclar/inceleme.mjs aktar   <proje klasörü> [dosya]     kişinin kararlarını kurguya geri yazar
//
// Sayfa iki yerde çalışır: bu bilgisayarda (sunucu) ya da kişinin claude.ai hesabında gizli bir sayfa
// olarak (telefondan da açılır). İkisi de aynı sayfa dosyasını ve aynı zaman çekirdeğini kullanır.
// claude.ai adımları: rehber/inceleme.md
import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { writeFile, readFile, mkdir, stat, access, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { calistir, medyaBilgisi, sureYaz } from '../ortak/calistir.mjs';
import { planla, tempoAl, kararOzeti } from '../ortak/zaman.mjs';
import { stilOku } from '../ortak/stil.mjs';
import { hamBul, jsonOku } from '../ortak/yollar.mjs';
import { goruntuKaynagi } from '../ortak/goruntu.mjs';

const BURASI = path.dirname(fileURLToPath(import.meta.url));
const KOK = path.join(BURASI, '..');
const SAYFA = path.join(KOK, 'inceleme', 'sayfa.html');
// Sayfanın araçlarla ortak kullandığı dosyalar: yayımlanan ad → depodaki yer
export const ORTAK_DOSYALAR = {
  'zaman.js': path.join(KOK, 'ortak', 'zaman.mjs'),
  'altyazi.js': path.join(KOK, 'ortak', 'altyazi.mjs'),
  'kartlar.js': path.join(KOK, 'ortak', 'kartlar.mjs'),
};
const EN_COK_BAYT = 18 * 1024 * 1024; // claude.ai'ye yüklenebilecek dosya sınırının biraz altı

const [komut, klasorArg, ...kalan] = process.argv.slice(2);
if (!['hazirla', 'sunucu', 'taslak', 'paket', 'aktar'].includes(komut) || !klasorArg) {
  console.error('Kullanım: node araclar/inceleme.mjs hazirla|sunucu|taslak|paket|aktar <proje klasörü>');
  process.exit(2);
}
const klasor = path.resolve(klasorArg);
const cikis = path.join(klasor, 'inceleme');
const secenekAl = (ad) => {
  const i = kalan.indexOf(`--${ad}`);
  return i === -1 ? null : kalan[i + 1];
};

async function varMi(dosya) {
  try {
    await access(dosya);
    return true;
  } catch {
    return false;
  }
}

/** Videoyu sayfada rahat oynayacak ve yükleme sınırını aşmayacak boyuta küçültür. */
async function hafifVideo(kaynak, ses, hedef, sure) {
  // Süreye göre bit hızı: dosya sınırın altında kalsın. Çok uzun kayıtta çözünürlük de düşer.
  const sesHizi = 64;
  const toplam = Math.floor((EN_COK_BAYT * 8) / 1000 / Math.max(1, sure));
  const goruntuHizi = Math.max(180, Math.min(900, toplam - sesHizi - 20));
  const boy = goruntuHizi < 350 ? 640 : 960;
  const arg = ['-v', 'error', '-y', '-i', kaynak];
  if (ses) arg.push('-i', ses, '-map', '0:v', '-map', '1:a:0?');
  arg.push(
    '-vf', `scale=-2:${boy}:force_original_aspect_ratio=decrease,scale=trunc(iw/2)*2:trunc(ih/2)*2,fps=30`,
    '-c:v', 'libx264', '-preset', 'veryfast', '-b:v', `${goruntuHizi}k`, '-maxrate', `${Math.round(goruntuHizi * 1.3)}k`,
    '-bufsize', `${goruntuHizi * 2}k`, '-g', '15', '-pix_fmt', 'yuv420p',
    '-c:a', 'aac', '-b:a', `${sesHizi}k`, '-ac', '1', '-movflags', '+faststart', '-shortest', hedef,
  );
  await calistir('ffmpeg', arg);
  return (await stat(hedef)).size;
}

/** Sayfanın verisini (veri.json) proje dosyalarından yeniden yazar. Video ve ses örnekleri ayrı hazırlanır. */
async function veriYaz() {
  const dokum = await jsonOku(path.join(klasor, 'dokum.json'));
  const kararlar = await jsonOku(path.join(klasor, 'kararlar.json'), {});
  const kurgu = await jsonOku(path.join(klasor, 'kurgu.json'), {});
  const sesRapor = await jsonOku(path.join(klasor, 'ses-rapor.json'), null);
  const stil = await stilOku(klasor);
  const sesOrnegi = (await varMi(path.join(cikis, 'ses-once.mp4'))) && (await varMi(path.join(cikis, 'ses-sonra.mp4')));
  const hamSure = (await medyaBilgisi(await hamBul(klasor))).sure;
  const veri = {
    surum: 1,
    ad: path.basename(klasor),
    hazirlandi: new Date().toISOString(),
    sure: Math.min(dokum.sure, hamSure),
    dil: dokum.dil,
    kelimeler: dokum.kelimeler.map((k) => ({ m: k.m, bas: k.bas, bit: k.bit, p: k.p })),
    sesliBosluklar: dokum.sesliBosluklar || [],
    tempo: { ad: kararlar.tempo || stil.tempo, ...tempoAl(kararlar.tempo || stil.tempo) },
    // Claude'un önerisi: kişi sayfada bunun üstünden değişiklik yapar.
    oneri: {
      kes: kararlar.kes || [],
      tutDuraklama: kararlar.tutDuraklama || [],
      bas: kararlar.bas ?? null,
      bit: kararlar.bit ?? null,
      sira: kararlar.sira || null,
      hiz: kararlar.hiz ?? stil.hiz ?? 1,
      duzeltme: kararlar.duzeltme || {},
      vurgu: kararlar.vurgu || [],
    },
    stil: { renkler: stil.renkler, altyazi: stil.altyazi, duzeltmeler: stil.duzeltmeler || {} },
    kartlar: kurgu.kartlar || [],
    sesEfekti: stil.sesEfekti,
    ses: sesRapor ? { once: sesRapor.once, sonra: sesRapor.sonra, gurultuAzaltma: sesRapor.gurultuAzaltma, uyarilar: sesRapor.uyarilar } : null,
    medya: { kaynak: 'medya/kaynak.mp4', sesOnce: sesOrnegi ? 'medya/ses-once.mp4' : null, sesSonra: sesOrnegi ? 'medya/ses-sonra.mp4' : null },
  };
  await writeFile(path.join(cikis, 'veri.json'), JSON.stringify(veri));
  return veri;
}

// ------------------------------------------------------------------ hazirla
if (komut === 'hazirla') {
  await mkdir(cikis, { recursive: true });
  const dokum = await jsonOku(path.join(klasor, 'dokum.json'));
  const ham = await hamBul(klasor);
  const bilgi = await medyaBilgisi(ham);
  const temizSes = path.join(klasor, 'ses-temiz.wav');
  const sesVar = await varMi(temizSes);

  console.error('Sayfa için hafif video hazırlanıyor…');
  const goruntu = (await goruntuKaynagi(klasor)).dosya;
  // Görüntü dönüştürülmüş kopyadan, ses temizlenmiş sesten (o yoksa ham kayıttan) alınır.
  const bayt = await hafifVideo(goruntu, sesVar ? temizSes : ham, path.join(cikis, 'kaynak.mp4'), bilgi.sure);

  // Ses karşılaştırması: konuşmanın başladığı yerden 10 saniye, temizlik öncesi ve sonrası.
  if (sesVar) {
    const bas = Math.max(0, (dokum.kelimeler[0]?.bas ?? 0) - 0.3);
    const ornek = (kaynak, hedef) =>
      calistir('ffmpeg', ['-v', 'error', '-y', '-ss', String(bas), '-t', '10', '-i', kaynak, '-vn', '-c:a', 'aac', '-b:a', '96k', '-ac', '1', hedef]);
    await ornek(ham, path.join(cikis, 'ses-once.mp4'));
    await ornek(temizSes, path.join(cikis, 'ses-sonra.mp4'));
  }

  // Yeni bir inceleme başlıyor: önceki turdan kalan karar ve taslak kayıtları sayfayı yanıltmasın.
  await rm(path.join(cikis, 'kararlar.json'), { force: true });
  await rm(path.join(cikis, 'taslak.json'), { force: true });
  const veri = await veriYaz();

  const plan = planla({ kelimeler: veri.kelimeler, sure: veri.sure }, veri.oneri, veri.tempo);
  console.log(`İnceleme verisi hazır: ${cikis}`);
  console.log(`  ${veri.kelimeler.length} kelime · öneriyle ${sureYaz(veri.sure)} → ${sureYaz(plan.sure)} · ${veri.kartlar.length} grafik · video ${(bayt / 1e6).toFixed(1)} MB`);
  console.log('Sayfayı açmak için iki yol var:');
  console.log(`  bu bilgisayarda : node araclar/inceleme.mjs sunucu "${klasor}"`);
  console.log('  claude.ai\'de    : rehber/inceleme.md dosyasındaki adımlar (telefondan da açılır)');
  process.exit(0);
}

// ------------------------------------------------------------------ taslak
if (komut === 'taslak') {
  const taslak = path.join(klasor, 'taslak.mp4');
  if (!(await varMi(taslak))) throw new Error('Önce önizlemeyi alın: node araclar/render.mjs "<proje klasörü>" --taslak');
  await mkdir(cikis, { recursive: true });
  const bilgi = await medyaBilgisi(taslak);
  const bayt = await hafifVideo(taslak, null, path.join(cikis, 'taslak.mp4'), bilgi.sure);
  // Önizleme, o anda kurguya aktarılmış kararlarla alınmıştır; özeti sayfa "eskidi mi" diye karşılaştırır.
  const kararlar = await jsonOku(path.join(cikis, 'kararlar.json'), null);
  const kayit = { an: new Date().toISOString(), sure: bilgi.sure, ozet: kararlar ? kararOzeti(kararlar) : null, medya: 'medya/taslak.mp4' };
  await writeFile(path.join(cikis, 'taslak.json'), JSON.stringify(kayit));
  console.log(`Taslak sayfa için hazır: ${path.join(cikis, 'taslak.mp4')} (${(bayt / 1e6).toFixed(1)} MB)`);
  console.log('Bu bilgisayardaki sayfa taslağı kendiliğinden gösterir. claude.ai sayfası için rehber/inceleme.md → "Taslağı sayfaya koymak".');
  process.exit(0);
}

// ------------------------------------------------------------------ paket
// claude.ai sayfası verisini kendi deposundan okur. Bu komut, o depoya yazılacak belgeleri hazırlar:
// yüklenen dosyaların adresleri veriye işlenir ve her belge tek bir "json" alanına sarılır.
if (komut === 'paket') {
  const veri = await jsonOku(path.join(cikis, 'veri.json'));
  const adres = { kaynak: secenekAl('kaynak'), sesOnce: secenekAl('ses-once'), sesSonra: secenekAl('ses-sonra'), taslak: secenekAl('taslak') };
  const hedef = path.join(cikis, 'db');
  await mkdir(hedef, { recursive: true });
  const yazilan = [];
  const eskiVeri = await jsonOku(path.join(hedef, 'veri.json'), null);
  const eskiMedya = eskiVeri ? JSON.parse(eskiVeri.json).medya : {};
  // Adresi bu çağrıda verilmeyen dosya, önceki paketteki adresini korur (video her seferinde yeniden yüklenmez).
  veri.medya = {
    kaynak: adres.kaynak || eskiMedya.kaynak || null,
    sesOnce: adres.sesOnce || eskiMedya.sesOnce || null,
    sesSonra: adres.sesSonra || eskiMedya.sesSonra || null,
  };
  if (!veri.medya.kaynak) throw new Error('Videonun adresi yok. Önce inceleme/kaynak.mp4 dosyasını sayfaya yükleyin, dönen adresi --kaynak ile verin.');
  await writeFile(path.join(hedef, 'veri.json'), JSON.stringify({ json: JSON.stringify(veri), hazirlandi: veri.hazirlandi }));
  yazilan.push('veri');

  const kararlar = await jsonOku(path.join(cikis, 'kararlar.json'), null);
  if (kararlar) {
    await writeFile(path.join(hedef, 'kararlar.json'), JSON.stringify({ json: JSON.stringify(kararlar), durum: kararlar.durum || 'suruyor', guncellendi: new Date().toISOString() }));
    yazilan.push('kararlar');
  }
  const taslak = await jsonOku(path.join(cikis, 'taslak.json'), {});
  const eskiTaslak = await jsonOku(path.join(hedef, 'taslak.json'), null);
  const taslakAdresi = adres.taslak || (eskiTaslak ? JSON.parse(eskiTaslak.json).medya : null);
  const taslakBelgesi = { ...(taslak.medya && adres.taslak ? { ...taslak, medya: adres.taslak } : eskiTaslak && !adres.taslak ? JSON.parse(eskiTaslak.json) : {}), veriHazirlandi: veri.hazirlandi };
  if (taslakAdresi && !taslakBelgesi.medya) taslakBelgesi.medya = taslakAdresi;
  await writeFile(path.join(hedef, 'taslak.json'), JSON.stringify({ json: JSON.stringify(taslakBelgesi) }));
  yazilan.push('taslak');

  console.log(`Belgeler hazır: ${hedef}`);
  console.log('Sayfanın deposuna şunları yazın (koleksiyon "inceleme"):');
  for (const ad of yazilan) console.log(`  belge "${ad}"  ←  ${path.join(hedef, `${ad}.json`)}`);
  process.exit(0);
}

// ------------------------------------------------------------------ sunucu
if (komut === 'sunucu') {
  if (!(await varMi(path.join(cikis, 'veri.json')))) {
    throw new Error(`Önce veriyi hazırlayın: node araclar/inceleme.mjs hazirla "${klasor}"`);
  }
  const TURLER = { '.mp4': 'video/mp4', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8' };

  async function dosyaGonder(istek, yanit, dosya) {
    let bilgi;
    try {
      bilgi = await stat(dosya);
    } catch {
      yanit.writeHead(404).end('yok');
      return;
    }
    const tur = TURLER[path.extname(dosya)] || 'application/octet-stream';
    const aralik = /^bytes=(\d*)-(\d*)$/.exec(istek.headers.range || '');
    if (aralik) {
      // Video ileri geri sarılabilsin diye dosyanın istenen parçası gönderilir.
      const bas = aralik[1] ? Number(aralik[1]) : 0;
      const bit = aralik[2] ? Math.min(Number(aralik[2]), bilgi.size - 1) : bilgi.size - 1;
      yanit.writeHead(206, { 'Content-Type': tur, 'Content-Range': `bytes ${bas}-${bit}/${bilgi.size}`, 'Accept-Ranges': 'bytes', 'Content-Length': bit - bas + 1 });
      createReadStream(dosya, { start: bas, end: bit }).pipe(yanit);
    } else {
      yanit.writeHead(200, { 'Content-Type': tur, 'Content-Length': bilgi.size, 'Accept-Ranges': 'bytes', 'Cache-Control': 'no-store' });
      createReadStream(dosya).pipe(yanit);
    }
  }
  const jsonGonder = (yanit, veri, kod = 200) => {
    yanit.writeHead(kod, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }).end(JSON.stringify(veri));
  };

  const sunucu = createServer(async (istek, yanit) => {
    try {
      const yol = decodeURIComponent(new URL(istek.url, 'http://x').pathname);
      if (yol === '/' || yol === '/index.html') {
        // claude.ai sayfayı bir iskeletin içine koyar; burada aynı iskelet elle kurulur.
        const govde = await readFile(SAYFA, 'utf8');
        const html =
          '<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">' +
          '<style>body{margin:0;font:14px system-ui,sans-serif}img{max-width:100%}[hidden]{display:none!important}</style></head><body>' +
          govde +
          '</body></html>';
        yanit.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' }).end(html);
      } else if (ORTAK_DOSYALAR[yol.slice(1)]) {
        await dosyaGonder(istek, yanit, ORTAK_DOSYALAR[yol.slice(1)]);
      } else if (yol === '/api/veri') {
        jsonGonder(yanit, await jsonOku(path.join(cikis, 'veri.json')));
      } else if (yol === '/api/taslak') {
        const taslak = await jsonOku(path.join(cikis, 'taslak.json'), {});
        const veri = await jsonOku(path.join(cikis, 'veri.json'));
        jsonGonder(yanit, { ...taslak, veriHazirlandi: veri.hazirlandi });
      } else if (yol === '/api/kararlar' && istek.method === 'GET') {
        jsonGonder(yanit, await jsonOku(path.join(cikis, 'kararlar.json'), null));
      } else if (yol === '/api/kararlar' && istek.method === 'PUT') {
        let govde = '';
        for await (const parca of istek) {
          govde += parca;
          if (govde.length > 2_000_000) throw new Error('çok büyük');
        }
        JSON.parse(govde); // bozuk veri yazılmasın
        await writeFile(path.join(cikis, 'kararlar.json'), govde);
        jsonGonder(yanit, { tamam: true });
      } else if (yol.startsWith('/medya/')) {
        const ad = path.basename(yol);
        await dosyaGonder(istek, yanit, path.join(cikis, ad));
      } else {
        yanit.writeHead(404).end('yok');
      }
    } catch (e) {
      jsonGonder(yanit, { hata: String(e.message || e) }, 500);
    }
  });
  const port = Number(secenekAl('port') || process.env.PORT || 4317);
  // Yalnızca bu bilgisayardan erişilir; ağdaki başka cihazlar göremez.
  sunucu.listen(port, '127.0.0.1', () => {
    console.log(`İnceleme sayfası açık: http://127.0.0.1:${port}`);
    console.log('Kişi kararlarını verip "İncelemeyi bitir" dedikten sonra:');
    console.log(`  node araclar/inceleme.mjs aktar "${klasor}"`);
  });
  sunucu.on('error', (e) => {
    console.error(e.code === 'EADDRINUSE' ? `HATA: ${port} numaralı kapı dolu. Başka bir kapı deneyin: --port ${port + 1}` : `HATA: ${e.message}`);
    process.exit(1);
  });
}

// ------------------------------------------------------------------ aktar
if (komut === 'aktar') {
  const kaynakDosya = kalan.find((a) => !a.startsWith('--')) || path.join(cikis, 'kararlar.json');
  let k = await jsonOku(path.resolve(kaynakDosya), null);
  // claude.ai sayfasından okunan belge, kararları tek bir "json" alanında taşır.
  const sarili = k?.json ?? k?.data?.json ?? k?.fields?.json;
  if (typeof sarili === 'string') k = JSON.parse(sarili);
  if (!k) throw new Error('Kaydedilmiş karar yok. Kişi sayfada henüz bir değişiklik yapmamış ya da sayfa hiç açılmamış olabilir.');
  const veri = await jsonOku(path.join(cikis, 'veri.json'));
  const eski = await jsonOku(path.join(klasor, 'kararlar.json'), {});
  await mkdir(cikis, { recursive: true });

  // 1. Kesim kararları
  const yeni = {
    ...eski,
    kes: [...new Set(k.kes || [])].sort((a, b) => a - b),
    tutDuraklama: [...new Set(k.tutDuraklama || [])].sort((a, b) => a - b),
    bas: k.bas ?? null,
    bit: k.bit ?? null,
    duzeltme: k.duzeltme || {},
    vurgu: [...new Set(k.vurgu || [])].sort((a, b) => a - b),
  };
  if (k.sira) yeni.sira = k.sira;
  await writeFile(path.join(klasor, 'kararlar.json'), JSON.stringify(yeni, null, 1));

  const tempo = tempoAl(yeni.tempo || veri.tempo?.ad);
  const plan = planla({ kelimeler: veri.kelimeler, sure: veri.sure }, { ...yeni, hiz: yeni.hiz ?? veri.oneri.hiz }, tempo);
  const oncekiKes = new Set(veri.oneri.kes);
  const simdikiKes = new Set(yeni.kes);
  const eklenen = yeni.kes.filter((i) => !oncekiKes.has(i));
  const geriAlinan = veri.oneri.kes.filter((i) => !simdikiKes.has(i));
  const kelimeYaz = (liste) => liste.slice(0, 12).map((i) => `"${veri.kelimeler[i]?.m}"`).join(' ') + (liste.length > 12 ? ' …' : '');

  console.log(`Kararlar aktarıldı${k.durum === 'bitti' ? '' : ' (kişi henüz "İncelemeyi bitir" demedi)'}.`);
  console.log(`  Süre ${sureYaz(veri.sure)} → ${sureYaz(plan.sure)} · ${yeni.kes.length} kelime kesik · ${plan.duraklamalar.filter((d) => !d.tutuldu).length} duraklama kısalıyor`);
  if (eklenen.length) console.log(`  Kişinin ek olarak kestiği ${eklenen.length} kelime: ${kelimeYaz(eklenen)}`);
  if (geriAlinan.length) console.log(`  Kişinin geri aldığı ${geriAlinan.length} kelime: ${kelimeYaz(geriAlinan)}`);
  const duzeltmeSayisi = Object.keys(yeni.duzeltme).length;
  if (duzeltmeSayisi) console.log(`  ${duzeltmeSayisi} yazım düzeltmesi, ${yeni.vurgu.length} vurgulu kelime kararlar.json dosyasına yazıldı.`);

  // 2. Grafik kartları: çıkarılanlar kurgu.json'dan silinir; değişiklik istekleri Claude'a bildirilir.
  const kurguDosyasi = path.join(klasor, 'kurgu.json');
  const kurgu = await jsonOku(kurguDosyasi, null);
  const kartKararlari = k.kartlar || {};
  const istekler = [];
  let kartDegisti = false;
  if (kurgu?.kartlar?.length) {
    const kalanKartlar = [];
    kurgu.kartlar.forEach((kart, n) => {
      const karar = kartKararlari[n] || {};
      const ozet = `${n + 1}. kart (${kart.tur}${kart.metin ? `: ${String(kart.metin).slice(0, 40)}` : ''})`;
      if (karar.durum === 'cikar') {
        console.log(`  ÇIKARILDI: ${ozet}`);
        return;
      }
      if (karar.not && karar.not.trim()) istekler.push(`DEĞİŞİKLİK İSTEĞİ · ${ozet}: ${karar.not.trim()}`);
      // Ses efekti: kişi kartı sessiz yaptıysa ya da sesi geri açtıysa karta işlenir.
      if (karar.ses === false && kart.ses !== false) {
        kart.ses = false;
        kartDegisti = true;
        console.log(`  SESSİZ: ${ozet}`);
      } else if (karar.ses === true && kart.ses === false) {
        delete kart.ses;
        kartDegisti = true;
        console.log(`  SES AÇILDI: ${ozet}`);
      }
      if (kart.kelime !== undefined && simdikiKes.has(kart.kelime)) {
        istekler.push(`KART KELİMESİ KESİLDİ · ${ozet}: bağlı olduğu ${kart.kelime} numaralı kelime artık videoda yok; başka bir kelimeye bağlayın ya da kartı çıkarın.`);
      }
      kalanKartlar.push(kart);
    });
    if (kalanKartlar.length !== kurgu.kartlar.length || kartDegisti) {
      kurgu.kartlar = kalanKartlar;
      await writeFile(kurguDosyasi, JSON.stringify(kurgu, null, 1));
    }
  }

  // 3. Stil istekleri ve notlar: kendiliğinden uygulanmaz, Claude kişiyle teyit eder.
  const stilIstegi = k.stilIstegi?.altyazi || {};
  for (const [alan, deger] of Object.entries(stilIstegi)) {
    if (veri.stil.altyazi[alan] !== deger) {
      istekler.push(
        `STİL İSTEĞİ · altyazı ${alan}: "${veri.stil.altyazi[alan]}" → "${deger}". Kişiye sorun: yalnızca bu video için mi, bundan sonra hep mi? ` +
          `Yalnızca bu video ise proje klasörüne stil-ek.json yazın ({"altyazi": {"${alan}": "${deger}"}}); hep ise stil.json dosyasını güncelleyin.`,
      );
    }
  }
  for (const n of k.notlar || []) {
    istekler.push(`NOT · önizlemede ${sureYaz(n.t)} (${Number(n.t).toFixed(1)} sn): ${n.metin}`);
  }
  if (istekler.length) {
    console.log('\nYapılacaklar (render\'dan önce hepsine bakın):');
    for (const i of istekler) console.log(`  - ${i}`);
  }
  // 4. Sayfayı tazele: uygulanan kararlar artık "öneri"dir; kart kararları, stil istekleri ve notlar tüketildi.
  await veriYaz();
  const temiz = {
    surum: 1, kes: yeni.kes, tutDuraklama: yeni.tutDuraklama, bas: yeni.bas, bit: yeni.bit, sira: yeni.sira ?? null,
    hiz: yeni.hiz ?? veri.oneri.hiz, duzeltme: yeni.duzeltme, vurgu: yeni.vurgu, kartlar: {}, stilIstegi: { altyazi: {} }, notlar: [], durum: 'suruyor',
  };
  temiz.ozet = kararOzeti(temiz);
  await writeFile(path.join(cikis, 'kararlar.json'), JSON.stringify(temiz));

  console.log('\nSıradaki adımlar: (yapılacaklar varsa onlar) → kes.mjs → altyazi.mjs --yeniden → kare.mjs → render.mjs --taslak → inceleme.mjs taslak');
  console.log('claude.ai sayfası kullanılıyorsa güncel inceleme/veri.json ve inceleme/kararlar.json dosyalarını sayfaya yeniden yazın (rehber/inceleme.md).');
}
