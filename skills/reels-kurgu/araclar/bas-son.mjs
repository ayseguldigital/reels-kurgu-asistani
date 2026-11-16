#!/usr/bin/env node
// Baş ve son kontrolü: kaydın ilk ve son 4 saniyesinden yarım saniyede bir kare alır.
//
//   node araclar/bas-son.mjs <proje klasörü>
//
// Telefonu yerleştirirken, kamerayı çevirirken ya da kaydı durdurmaya uzanırken de konuşulur.
// Döküm o sözleri "konuşma var" diye tutar; video sallanan bir görüntüyle açılır. Bu araç
// kareleri yan yana koyar ki video, kişinin kadraja yerleştiği ilk kareden başlatılabilsin.
//
// Yazar:  <proje>/.ara/bas.jpg ve son.jpg (soldan sağa, üstten alta 8'er kare)
import path from 'node:path';
import { calistir, medyaBilgisi } from '../ortak/calistir.mjs';
import { hamBul, araKlasor, klasorAl } from '../ortak/yollar.mjs';

const PENCERE = 4; // saniye
const ARALIK = 0.5;

const klasor = klasorAl('node araclar/bas-son.mjs <proje klasörü>');
const ham = await hamBul(klasor);
const ara = await araKlasor(klasor);
const bilgi = await medyaBilgisi(ham);
const pencere = Math.min(PENCERE, bilgi.sure / 2);
const adet = Math.max(1, Math.floor(pencere / ARALIK));

async function pafta(baslangic, cikis) {
  await calistir('ffmpeg', [
    '-v', 'error', '-y', '-ss', String(baslangic), '-t', String(pencere), '-i', ham,
    '-vf', `fps=${1 / ARALIK},scale=270:480:force_original_aspect_ratio=increase,crop=270:480,tile=${Math.min(4, adet)}x${Math.ceil(adet / 4)}`,
    '-frames:v', '1', '-q:v', '3', cikis,
  ]);
}

const basDosya = path.join(ara, 'bas.jpg');
const sonDosya = path.join(ara, 'son.jpg');
const sonBaslangic = Math.max(0, bilgi.sure - pencere);
await pafta(0, basDosya);
await pafta(sonBaslangic, sonDosya);

const anlar = (b) => Array.from({ length: adet }, (_, i) => (b + i * ARALIK).toFixed(1)).join(' · ');
console.log(`Baş kareleri: ${basDosya}`);
console.log(`  soldan sağa, üstten alta saniyeler: ${anlar(0)}`);
console.log(`Son kareleri: ${sonDosya}`);
console.log(`  soldan sağa, üstten alta saniyeler: ${anlar(sonBaslangic)}`);
console.log('İki görsele bakın. Kişi kadraja yerleşmeden önceki ve kayıttan çıkmaya başladıktan sonraki kısmı');
console.log('kararlar.json içinde "bas" ve "bit" saniyeleriyle dışarıda bırakın.');
