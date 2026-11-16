#!/usr/bin/env node
// Son kontrol: bitmiş videoyu paylaşmadan önce ölçer.
//
//   node araclar/son-kontrol.mjs <proje klasörü> [video dosyası]
//
// Bakar:  boyut ve kare hızı · süre · ses düzeyi · sesle görüntünün aynı uzunlukta olması ·
//         siyah açılış · kesimde yutulmuş ya da yarım kalmış kelime
// Çıkış kodu sorun sayısıdır; 0 ise video paylaşılabilir.
//
// Bir sorun çıkarsa çözüm ölçütü gevşetmek değil, kurguyu düzeltip yeniden render almaktır.
import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { calistir, medyaBilgisi, sureYaz } from '../ortak/calistir.mjs';
import { lufsOlc, HEDEF_LUFS, TEPE } from '../ortak/ses.mjs';
import { MODEL, araKlasor, jsonOku, klasorAl } from '../ortak/yollar.mjs';
import { stilOku } from '../ortak/stil.mjs';

const klasor = klasorAl('node araclar/son-kontrol.mjs <proje klasörü> [video dosyası]');
const verilen = process.argv.slice(3).find((a) => !a.startsWith('--'));
let video = verilen ? path.resolve(verilen) : null;
if (!video) {
  const bitmis = path.join(klasor, 'bitmis');
  let dosyalar = [];
  try {
    dosyalar = (await readdir(bitmis)).filter((d) => d.endsWith('.mp4') && !d.endsWith('-altyazisiz.mp4'));
  } catch {
    /* klasör yok */
  }
  if (!dosyalar.length) throw new Error('Kontrol edilecek bitmiş video yok. Önce render alın: node araclar/render.mjs "<proje klasörü>"');
  video = path.join(bitmis, dosyalar[0]);
}

const kesim = await jsonOku(path.join(klasor, 'kesim.json'));
const stil = await stilOku();
const ara = await araKlasor(klasor);
let sorun = 0;
const iyi = (m) => console.log(`  ✓ ${m}`);
const kotu = (m) => {
  console.log(`  ✗ ${m}`);
  sorun++;
};
const bilgi = (m) => console.log(`  ! ${m}`);

console.log(`\nSon kontrol: ${path.basename(video)}\n`);

// 1. Boyut ve kare hızı
const b = await medyaBilgisi(video);
if (b.en === 1080 && b.boy === 1920) iyi('Boyut 1080×1920 (Reels için doğru)');
else kotu(`Boyut ${b.en}×${b.boy}; 1080×1920 olmalı`);
if (Math.abs(b.fps - kesim.fps) < 0.01) iyi(`Kare hızı ${b.fps}`);
else kotu(`Kare hızı ${b.fps}; kesim ${kesim.fps} idi`);

// 2. Süre
if (Math.abs(b.sure - kesim.sure) <= 0.15) iyi(`Süre ${sureYaz(b.sure)}`);
else kotu(`Süre ${sureYaz(b.sure, 2)}; kesim ${sureYaz(kesim.sure, 2)} idi. Görüntü ile ses kaymış olabilir.`);
if (b.sure > 90) bilgi('Video 90 saniyeden uzun. Reels için daha kısa videolar genelde daha çok izlenir.');

// 3. Ses var mı, düzeyi doğru mu
if (!b.sesVar) {
  kotu('Videoda ses yok');
} else {
  const d = await lufsOlc(video);
  if (d.lufs !== null && Math.abs(d.lufs - HEDEF_LUFS) <= 1) iyi(`Ses düzeyi ${d.lufs} LUFS (hedef ${HEDEF_LUFS})`);
  else kotu(`Ses düzeyi ${d.lufs} LUFS; hedef ${HEDEF_LUFS}. Kesimi yeniden alın.`);
  if (d.tepe !== null && d.tepe <= TEPE + 1.2) iyi(`En yüksek an ${d.tepe} dB (cızırtı yok)`);
  else kotu(`En yüksek an ${d.tepe} dB; ses cızırdayabilir`);
}

// 4. Siyah açılış
const siyah = await calistir('ffmpeg', ['-hide_banner', '-nostats', '-t', '2', '-i', video, '-vf', 'blackdetect=d=0.1:pix_th=0.06', '-an', '-f', 'null', '-']);
if (/black_start:0(\.0+)?\b/.test(siyah.hata)) kotu('Video siyah bir kareyle açılıyor');
else iyi('Açılış karesi dolu');

// 5. Kelime kontrolü: bitmiş videonun sesi yeniden yazıya dökülür ve beklenen metinle karşılaştırılır.
const yalin = (m) => m.toLocaleLowerCase('tr').replace(/[^\p{L}\p{N}]+/gu, '');
const beklenen = kesim.kelimeler.map((k) => yalin(k.m)).filter(Boolean);
const ses16 = path.join(ara, 'kontrol-16k.wav');
await calistir('ffmpeg', ['-v', 'error', '-y', '-i', video, '-vn', '-ac', '1', '-ar', '16000', ses16]);
const onEk = path.join(ara, 'kontrol');
const arg = ['-m', MODEL.dosya, '-f', ses16, '-l', stil.dil, '-oj', '-of', onEk, '-np'];
const ozelAdlar = (stil.ozelAdlar || []).filter(Boolean);
if (ozelAdlar.length) arg.push('--prompt', `${ozelAdlar.join(', ')}.`);
await calistir('whisper-cli', arg);
const duyulan = (await jsonOku(`${onEk}.json`)).transcription
  .flatMap((t) => t.text.split(/\s+/))
  .map(yalin)
  .filter(Boolean);

// En uzun ortak dizi: beklenen kelimelerden hangileri sırasıyla duyuldu?
const n = beklenen.length;
const m = duyulan.length;
const tablo = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1));
for (let i = n - 1; i >= 0; i--) {
  for (let j = m - 1; j >= 0; j--) {
    tablo[i][j] = beklenen[i] === duyulan[j] ? tablo[i + 1][j + 1] + 1 : Math.max(tablo[i + 1][j], tablo[i][j + 1]);
  }
}
const eksik = [];
for (let i = 0, j = 0; i < n; ) {
  if (j < m && beklenen[i] === duyulan[j]) {
    i++;
    j++;
  } else if (j < m && tablo[i][j + 1] >= tablo[i + 1][j]) {
    j++;
  } else {
    eksik.push(i);
    i++;
  }
}
const oran = n ? (n - eksik.length) / n : 1;
// Tek tük farklar dökümün yazım farkıdır ("mı" / "mi" gibi). Art arda iki kelime ya da ilk/son kelime eksikse gerçek sorundur.
const ardisik = eksik.some((i, k) => eksik[k + 1] === i + 1);
const ucEksik = eksik.includes(0) || eksik.includes(n - 1);
if (oran >= 0.97 && !ardisik && !ucEksik) {
  iyi(`Kelimeler yerinde (${n} kelimenin ${n - eksik.length}'i aynen duyuldu)`);
} else {
  const ornek = eksik.slice(0, 8).map((i) => `"${kesim.kelimeler[i].m}" (${sureYaz(kesim.kelimeler[i].bas)})`).join(', ');
  kotu(`Bazı kelimeler duyulmuyor ya da yarım kalmış: ${ornek}. Bu yerleri dinleyin; gerekirse kesimi düzeltin.`);
}
if (kesim.supheliSinirlar?.length) {
  bilgi(`Kesim sırasında işaretlenen ${kesim.supheliSinirlar.length} yer var; şu saniyeleri dinleyin: ${kesim.supheliSinirlar.map((t) => sureYaz(t)).join(', ')}`);
}

console.log('');
if (sorun === 0) console.log('TAMAM. Video paylaşılabilir. Yine de bir kez baştan sona izlemenizi öneririz.\n');
else console.log(`${sorun} sorun var. Düzeltip yeniden render alın.\n`);
process.exit(sorun);
