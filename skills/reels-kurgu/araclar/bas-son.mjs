#!/usr/bin/env node
// Baş ve son kontrolü: konuşmanın başladığı ve bittiği anların çevresinden yarım saniyede bir kare alır.
//
//   node araclar/bas-son.mjs <proje klasörü>
//
// Telefonu yerleştirirken, kamerayı çevirirken ya da kaydı durdurmaya uzanırken de konuşulur.
// Döküm o sözleri "konuşma var" diye tutar; video sallanan bir görüntüyle açılır. Bu araç
// kareleri yan yana koyar ki video, kişinin kadraja yerleştiği ilk kareden başlatılabilsin.
//
// Döküm alındıysa kareler ilk kelimenin 3 saniye öncesinden ve son kelimenin 1 saniye öncesinden
// başlar (kişi kaydı başlatıp birkaç saniye sonra konuşmaya başlamış olabilir). Döküm yoksa kaydın
// ilk ve son 4 saniyesi alınır.
//
// Yazar:  <proje>/.ara/bas.jpg ve son.jpg (soldan sağa, üstten alta 8'er kare)
import path from 'node:path';
import { calistir, medyaBilgisi } from '../ortak/calistir.mjs';
import { araKlasor, jsonOku, klasorAl } from '../ortak/yollar.mjs';
import { goruntuKaynagi } from '../ortak/goruntu.mjs';

const PENCERE = 4; // saniye
const ARALIK = 0.5;

const klasor = klasorAl('node araclar/bas-son.mjs <proje klasörü>');
const kaynak = await goruntuKaynagi(klasor);
if (kaynak.uyari) console.log(`UYARI: ${kaynak.uyari}`);
const ham = kaynak.dosya;
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
const dokum = await jsonOku(path.join(klasor, 'dokum.json'), null);
const ilkKelime = dokum?.kelimeler?.[0];
const sonKelime = dokum?.kelimeler?.[dokum.kelimeler.length - 1];
const sinirla = (t) => Math.max(0, Math.min(bilgi.sure - pencere, t));
// Kareler yarım saniyelik çizgiye oturtulur; saniyeler okunaklı olsun.
const yuvarla = (t) => Math.floor(t / ARALIK) * ARALIK;
const basBaslangic = ilkKelime ? sinirla(yuvarla(ilkKelime.bas - 3)) : 0;
const sonBaslangic = sonKelime ? sinirla(yuvarla(sonKelime.bit - 1)) : Math.max(0, bilgi.sure - pencere);
await pafta(basBaslangic, basDosya);
await pafta(sonBaslangic, sonDosya);

const anlar = (b) => Array.from({ length: adet }, (_, i) => (b + i * ARALIK).toFixed(1)).join(' · ');
console.log(`Baş kareleri: ${basDosya}`);
console.log(`  soldan sağa, üstten alta saniyeler: ${anlar(basBaslangic)}`);
if (ilkKelime) console.log(`  ilk kelime ${ilkKelime.bas.toFixed(1)}. saniyede: "${ilkKelime.m}"`);
console.log(`Son kareleri: ${sonDosya}`);
console.log(`  soldan sağa, üstten alta saniyeler: ${anlar(sonBaslangic)}`);
if (sonKelime) console.log(`  son kelime ${sonKelime.bit.toFixed(1)}. saniyede bitiyor: "${sonKelime.m}" · kayıt ${bilgi.sure.toFixed(1)} saniye`);
console.log('İki görsele bakın. Kişi kadraja yerleşmeden önceki ve kayıttan çıkmaya başladıktan sonraki kısmı');
console.log('kararlar.json içinde "bas" ve "bit" saniyeleriyle dışarıda bırakın.');
