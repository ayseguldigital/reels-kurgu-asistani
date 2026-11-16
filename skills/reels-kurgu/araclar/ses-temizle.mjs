#!/usr/bin/env node
// Ses temizleme: arka plan gürültüsünü azaltır, sesi netleştirir ve Instagram'ın beklediği düzeye getirir.
//
//   node araclar/ses-temizle.mjs <proje klasörü> [--gurultu otomatik|yok|hafif|guclu]
//
// Yazar:  <proje>/ses-temiz.wav   (48 kHz, tek kanal)
//         <proje>/ses-rapor.json  (önce ve sonra ölçümleri)
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { calistir } from '../ortak/calistir.mjs';
import { duzeyOlc, kaymaOlc } from '../ortak/duzey.mjs';
import { HEDEF_LUFS, TEPE, duzeyeGetir } from '../ortak/ses.mjs';
import { hamBul, araKlasor, klasorAl, secenek } from '../ortak/yollar.mjs';

const klasor = klasorAl('node araclar/ses-temizle.mjs <proje klasörü> [--gurultu otomatik|yok|hafif|guclu]');
const gurultuSecimi = secenek('gurultu', 'otomatik');
const ham = await hamBul(klasor);
const ara = await araKlasor(klasor);

const hamSes = path.join(ara, 'ses-ham.wav');
await calistir('ffmpeg', ['-v', 'error', '-y', '-i', ham, '-vn', '-ac', '1', '-ar', '48000', hamSes]);
const once = await duzeyOlc(hamSes);
const onceFark = once.konusma - once.taban;

// Gürültü azaltma gücü: konuşma ile arka plan arasındaki fark ne kadar azsa o kadar güçlü.
let guc = 0;
if (gurultuSecimi === 'hafif') guc = 8;
else if (gurultuSecimi === 'guclu') guc = 18;
else if (gurultuSecimi === 'otomatik') guc = onceFark >= 45 ? 0 : onceFark >= 35 ? 8 : onceFark >= 25 ? 12 : 18;

const zincir = ['highpass=f=75'];
if (guc > 0) {
  const taban = Math.min(-20, Math.max(-80, Math.round(once.taban + 3)));
  zincir.push(`afftdn=nr=${guc}:nf=${taban}:tn=1`);
}
zincir.push(
  'equalizer=f=240:t=q:w=1.1:g=-2', // boğukluğu al
  'equalizer=f=3800:t=q:w=1.2:g=2', // anlaşılırlığı artır
  'deesser=i=0.35:m=0.5:f=0.5', // sert "s" seslerini yumuşat
  'acompressor=threshold=-21dB:ratio=2.5:attack=8:release=120', // alçak ve yüksek yerleri yaklaştır
);
const on = zincir.join(',');
const duzeyAyari = `loudnorm=I=${HEDEF_LUFS}:TP=${TEPE}:LRA=9`;

// Ses düzeyi iki geçişte ayarlanır: önce ölç, sonra ölçüme göre düzelt. Tek geçiş sesi "pompalar".
const ilk = await calistir('ffmpeg', [
  '-hide_banner', '-nostats', '-i', hamSes, '-af', `${on},${duzeyAyari}:print_format=json`, '-f', 'null', '-',
]);
const olcumMetni = ilk.hata.slice(ilk.hata.lastIndexOf('{'), ilk.hata.lastIndexOf('}') + 1);
let ikinci = duzeyAyari;
try {
  const o = JSON.parse(olcumMetni);
  ikinci =
    `${duzeyAyari}:measured_I=${o.input_i}:measured_TP=${o.input_tp}:measured_LRA=${o.input_lra}` +
    `:measured_thresh=${o.input_thresh}:offset=${o.target_offset}:linear=true`;
} catch {
  console.error('Not: ses düzeyi ölçümü okunamadı, tek geçişle ayarlanıyor.');
}

const temiz = path.join(klasor, 'ses-temiz.wav');
await calistir('ffmpeg', ['-v', 'error', '-y', '-i', hamSes, '-af', `${on},${ikinci}`, '-ar', '48000', '-ac', '1', temiz]);

// Süzgeçler (özellikle gürültü azaltma) sesi birkaç on milisaniye geciktirebilir. Ölçülür ve geri alınır;
// yoksa ses, dudak hareketinin gerisinde kalır.
const kayma = await kaymaOlc(hamSes, temiz);
if (Math.abs(kayma) >= 0.001) {
  const hizali = path.join(ara, 'ses-hizali.wav');
  const duzeltme = kayma > 0 ? `atrim=start=${kayma.toFixed(5)},asetpts=PTS-STARTPTS,apad=pad_dur=${kayma.toFixed(5)}` : `adelay=${Math.round(-kayma * 1000)}:all=1`;
  await calistir('ffmpeg', ['-v', 'error', '-y', '-i', temiz, '-af', duzeltme, '-ar', '48000', '-ac', '1', hizali]);
  await calistir('ffmpeg', ['-v', 'error', '-y', '-i', hizali, '-c', 'copy', temiz]);
}

// Düzeyi hedefe oturt ve sonucu ölç. Asıl ayar kesimden sonra, yalnızca videoda kalan konuşma
// üzerinden bir kez daha yapılır (kes.mjs); çünkü kesilecek yerler (çekim arası konuşma, uzun
// sessizlik) ortalamayı yanıltır.
const { lufs } = await duzeyeGetir(temiz);
const sonra = await duzeyOlc(temiz);

const sonraFark = sonra.konusma - sonra.taban;
const uyarilar = [];
if (sonra.taban > -45 && sonraFark < 35) {
  uyarilar.push(
    'Kelime aralarında hâlâ belirgin arka plan sesi var (rüzgâr, trafik, hışırtı olabilir). Daha sessiz bir yerde ya da mikrofonla çekmek en iyi çözümdür.',
  );
}

const rapor = {
  gurultuAzaltma: guc,
  once: { taban: once.taban, konusma: once.konusma, fark: +onceFark.toFixed(1) },
  sonra: { taban: sonra.taban, konusma: sonra.konusma, fark: +sonraFark.toFixed(1), lufs },
  hedefLufs: HEDEF_LUFS,
  uyarilar,
};
await writeFile(path.join(klasor, 'ses-rapor.json'), JSON.stringify(rapor, null, 1));

console.log(`Ses temizlendi: ${temiz}`);
console.log(`Arka plan gürültüsü ${once.taban} dB → ${sonra.taban} dB · konuşma ile arka plan farkı ${rapor.once.fark} dB → ${rapor.sonra.fark} dB`);
console.log(`Ses düzeyi ${lufs ?? '?'} LUFS (hedef ${HEDEF_LUFS}) · gürültü azaltma: ${guc ? `${guc} dB` : 'gerekmedi'}`);
for (const u of uyarilar) console.log(`UYARI: ${u}`);
