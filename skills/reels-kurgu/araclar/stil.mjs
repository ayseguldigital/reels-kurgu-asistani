#!/usr/bin/env node
// Stil: kişinin stil dosyasını denetler ve nasıl görüneceğini gösterir.
//
//   node araclar/stil.mjs kontrol            stil.json'u denetler, okunur bir özet yazar
//   node araclar/stil.mjs onizleme           altyazı ve örnek kartların görüntüsünü çıkarır (video gerekmez)
//   node araclar/stil.mjs fontlar            paketteki yazı tiplerini listeler
//
// Stil dosyası: ~/Movies/Reels Kurgu/stil.json. Elle ya da stil sohbetiyle doldurulur (rehber/stil-sohbeti.md).
// Önizleme, kişi bir renge ya da yazı tipine karar vermeden önce "böyle görünecek" diyebilmek içindir.
import { writeFile, mkdir, rm, copyFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { calistir } from '../ortak/calistir.mjs';
import { stilOku, VARSAYILAN_STIL } from '../ortak/stil.mjs';
import { TEMPOLAR } from '../ortak/zaman.mjs';
import { DEPO, STIL_DOSYASI, jsonOku } from '../ortak/yollar.mjs';

const BURASI = path.dirname(fileURLToPath(import.meta.url));
const FONTLAR = path.join(BURASI, '..', 'fontlar');
const komut = process.argv[2];
const fontListesi = await jsonOku(path.join(FONTLAR, 'fontlar.json'));

const SECENEKLER = {
  'altyazi.bicim': ['kelime', 'ifade', 'cumle'],
  'altyazi.boyut': ['kucuk', 'orta', 'buyuk'],
  'altyazi.konum': ['alt', 'orta'],
  'altyazi.harf': ['normal', 'kucuk', 'buyuk'],
  'altyazi.zemin': ['kontur', 'golge', 'kutu'],
  tempo: Object.keys(TEMPOLAR),
  grafik: ['az', 'dengeli', 'yogun'],
  sesEfekti: ['yok', 'az', 'cok'],
};

/** Stil dosyasındaki hataları bulur. Boş liste dönerse dosya kullanılabilir. */
function denetle(stil, ham) {
  const sorunlar = [];
  const al = (yol) => yol.split('.').reduce((o, a) => o?.[a], stil);
  for (const [yol, liste] of Object.entries(SECENEKLER)) {
    if (!liste.includes(al(yol))) sorunlar.push(`"${yol}" değeri "${al(yol)}" olamaz. Seçenekler: ${liste.join(', ')}`);
  }
  for (const [ad, renk] of Object.entries({ ...stil.renkler, 'altyazi.renk': stil.altyazi.renk })) {
    if (!/^#[0-9a-f]{6}$/i.test(String(renk))) sorunlar.push(`"${ad}" rengi "${renk}" geçerli değil. Altı haneli renk kodu yazın, örneğin #1F2A44.`);
  }
  for (const rol of ['govde', 'vurgu']) {
    const ad = stil.fontlar[rol];
    if (!fontListesi.some((f) => f.aile.toLocaleLowerCase('tr') === String(ad).toLocaleLowerCase('tr'))) {
      sorunlar.push(`"${ad}" yazı tipi pakette yok. Seçenekler: ${fontListesi.map((f) => f.aile).join(', ')}`);
    }
  }
  if (typeof stil.hiz !== 'number' || stil.hiz < 0.8 || stil.hiz > 1.3) sorunlar.push(`"hiz" 0.8 ile 1.3 arasında bir sayı olmalı (şu an: ${stil.hiz}).`);
  for (const alan of ['ozelAdlar', 'dolguSozcukler', 'kurallar']) {
    if (!Array.isArray(stil[alan])) sorunlar.push(`"${alan}" bir liste olmalı.`);
  }
  // Tanınmayan alanlar: çoğu zaman yazım hatasıdır (ör. "altyazı" ya da "renk").
  const bilinen = new Set([...Object.keys(VARSAYILAN_STIL), 'incelemeSayfasi']);
  for (const alan of Object.keys(ham || {})) if (!bilinen.has(alan)) sorunlar.push(`"${alan}" diye bir alan yok; yazım hatası olabilir.`);
  return sorunlar;
}

if (komut === 'fontlar') {
  console.log('Paketteki yazı tipleri (hepsi Türkçe harfleri içerir):');
  for (const f of fontListesi) console.log(`  ${f.aile.padEnd(22)} ${f.aciklama}`);
  process.exit(0);
}

const ham = await jsonOku(STIL_DOSYASI, null);
const stil = await stilOku();

if (komut === 'kontrol') {
  if (!ham) {
    console.log(`Stil dosyası yok: ${STIL_DOSYASI}`);
    console.log('Önce stil sohbetini yapın (rehber/stil-sohbeti.md). Dosya yokken başlangıç değerleri kullanılır.');
    process.exit(3);
  }
  const sorunlar = denetle(stil, ham);
  const a = stil.altyazi;
  console.log(`Stil dosyası: ${STIL_DOSYASI}\n`);
  console.log(`  Renkler      ana ${stil.renkler.ana} · vurgu ${stil.renkler.vurgu} · açık ${stil.renkler.acik} · koyu ${stil.renkler.koyu}`);
  console.log(`  Yazı tipi    ${stil.fontlar.govde}${stil.fontlar.vurgu !== stil.fontlar.govde ? ` (vurgu ve başlıklarda ${stil.fontlar.vurgu})` : ''}`);
  console.log(`  Altyazı      ${a.bicim} · ${a.boyut} · ${a.konum} · zemin ${a.zemin} · harf ${a.harf}${a.aktifKelime ? ' · söylenen kelime renklenir' : ''}`);
  console.log(`  Tempo        ${stil.tempo}${stil.hiz !== 1 ? ` · hız ${stil.hiz}×` : ''}`);
  console.log(`  Grafik       ${stil.grafik} · ses efekti ${stil.sesEfekti}`);
  console.log(`  Çağrı        ${stil.cagri || '(yok)'}`);
  if (stil.ozelAdlar.length) console.log(`  Özel adlar   ${stil.ozelAdlar.join(', ')}`);
  if (Object.keys(stil.duzeltmeler).length) console.log(`  Düzeltmeler  ${Object.entries(stil.duzeltmeler).map(([y, d]) => `${y} → ${d}`).join(', ')}`);
  if (stil.dolguSozcukler.length) console.log(`  Kesilecek dolgu sözcükler: ${stil.dolguSozcukler.join(', ')}`);
  for (const k of stil.kurallar) console.log(`  Kural        ${k}`);
  if (sorunlar.length) {
    console.log(`\n${sorunlar.length} sorun var:`);
    for (const s of sorunlar) console.log(`  ✗ ${s}`);
  } else console.log('\nTAMAM. Stil dosyası kullanılabilir.');
  process.exit(sorunlar.length);
}

if (komut === 'onizleme') {
  const sorunlar = denetle(stil, ham);
  if (sorunlar.length) throw new Error(`Stil dosyasında düzeltilmesi gerekenler var:\n  - ${sorunlar.join('\n  - ')}`);

  // Videosuz bir deneme projesi: nötr bir arka plan ve örnek cümleler.
  const proje = path.join(DEPO, 'onizleme');
  await rm(proje, { recursive: true, force: true });
  await mkdir(proje, { recursive: true });
  const sure = 12;
  await calistir('ffmpeg', [
    '-v', 'error', '-y', '-f', 'lavfi', '-i',
    `gradients=s=1080x1920:c0=0x8E96A3:c1=0xC9CED6:x0=0:y0=0:x1=1080:y1=1920:d=${sure}:r=30`,
    '-f', 'lavfi', '-i', `anullsrc=r=48000:cl=mono:d=${sure}`,
    '-t', String(sure), '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '30', '-g', '15', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-shortest',
    path.join(proje, 'kesim.mp4'),
  ]);
  const cumle = 'Bugün sana üç dakikada Reels hazırlamayı gösteriyorum. Önce videonu çek sonra gerisini bana bırak. Hazırsan başlayalım mı?';
  const kelimeler = cumle.split(' ').map((m, i) => ({ i, m, bas: +(0.3 + i * 0.6).toFixed(2), bit: +(0.3 + i * 0.6 + 0.5).toFixed(2) }));
  await writeFile(path.join(proje, 'kesim.json'), JSON.stringify({ surum: 1, fps: 30, en: 1080, boy: 1920, sure, hiz: 1, parcalar: [], kelimeler }));
  await writeFile(path.join(proje, 'kararlar.json'), JSON.stringify({ vurgu: [3, 13] }));
  await writeFile(
    path.join(proje, 'kurgu.json'),
    JSON.stringify({
      surum: 1,
      kartlar: [
        { tur: 'baslik', bas: 0.2, sure: 3, ustYazi: 'ÖRNEK', metin: 'Başlık böyle / *görünecek*' },
        { tur: 'liste', bas: 4, sure: 3.4, baslik: 'Liste *kartı*', maddeler: ['Birinci madde', 'İkinci madde', 'Üçüncü madde'], zemin: false },
        { tur: 'sayi', bas: 8, sure: 2, onEk: '%', deger: 80, aciklama: 'örnek bir oran' },
        { tur: 'cagri', bas: 10.3, metin: stil.cagri || 'Yorumlara *REELS* yaz' },
      ],
    }),
  );
  await calistir(process.execPath, [path.join(BURASI, 'altyazi.mjs'), proje, '--yeniden']);
  const { cikti } = await calistir(process.execPath, [path.join(BURASI, 'kare.mjs'), proje, '--an', '2.4,5.6,9.2,11.4']);
  const pafta = path.join(proje, '.ara', 'kareler', 'pafta.jpg');
  const hedef = path.join(DEPO, 'stil-onizleme.jpg');
  await copyFile(pafta, hedef);
  if (!cikti.includes('Kareler hazır')) throw new Error('Önizleme alınamadı.');
  console.log(`Stil önizlemesi hazır: ${hedef}`);
  console.log('Soldan sağa: başlık ve altyazı · liste kartı · sayı kartı · çağrı.');
  console.log('Görsele bakın ve kişiye gösterin. Arka plan örnek bir gri; gerçek videoda kişinin kendi görüntüsü olur.');
  process.exit(0);
}

console.error('Kullanım: node araclar/stil.mjs kontrol | onizleme | fontlar');
process.exit(2);
