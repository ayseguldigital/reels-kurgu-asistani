# Altyazı

Altyazı, kesimden sonra kalan kelimelerden kendiliğinden üretilir; biçimi kişinin stil dosyasından gelir. Senin işin üç şey: yazımı düzeltmek, öne çıkacak kelimeleri seçmek ve görüntüye bakmak.

```bash
node araclar/altyazi.mjs "<proje klasörü>"
```

Komut altyazıları sırasıyla yazdırır. Oku.

## Yazımı düzelt

Döküm özel adları ve yabancı kelimeleri yanlış duyabilir ("Cloud" → "Claude"). Düzeltme kelime numarasıyla `kararlar.json` dosyasına yazılır:

```json
"duzeltme": { "84": "Claude", "12": "Reels'i" }
```

- Kelimenin numarasını `dokum.txt` dosyasından al (`84·Cloud`).
- Yalnızca yazımı düzelt. Kişinin söylediği kelimeyi değiştirme, cümleyi güzelleştirme.
- Aynı kelime her videoda yanlış çıkıyorsa stil dosyasındaki `duzeltmeler` listesine ekle (`{"Cloud": "Claude"}`) ve doğru yazımı `ozelAdlar` listesine de yaz; sonraki dökümler doğru gelir.
- Emin olmadığın bir kelimeyi kişiye sor.

## Vurguyu seç

Vurgulu kelime kalıcı olarak vurgu renginde görünür:

```json
"vurgu": [84, 23, 61]
```

- **Cümle başına en çok bir kelime.** Her şey vurguluysa hiçbir şey vurgulu değildir.
- Cümlenin anlamını taşıyan kelimeyi seç: sayı, sonuç, karşıtlık, ürün ya da kavram adı. "Bir", "çok", "ve" gibi kelimeleri değil.
- Tek kelime biçiminde (`kelime`) vurguyu daha da seyrek kullan.

Değişiklikten sonra altyazıyı yeniden üret:

```bash
node araclar/altyazi.mjs "<proje klasörü>" --yeniden
```

Düzeltmeler ve vurgular `kararlar.json` içinde durduğu için kesim değişse de kaybolmaz. Kişi bunları inceleme sayfasının Altyazı sekmesinde kendisi de yapabilir.

## Görüntüye bak

```bash
node araclar/kare.mjs "<proje klasörü>"
```

Sekiz altyazının karesini tek görselde verir. Bak:

- Yazı kadrajın içinde mi, kesilmiş harf var mı?
- İki satırı geçen altyazı var mı?
- Yazı yüzün, özellikle ağzın üstüne geliyor mu? Geliyorsa stil dosyasında `altyazi.konum` değerini değiştirmeyi öner.
- Arka planla karışıyor mu? Karışıyorsa `altyazi.zemin` için `kontur` ya da `kutu` öner.

## Yalnızca bu videoya özel ayar

Kişi tek bir videoda farklı bir altyazı isterse stil dosyasına dokunma; proje klasörüne `stil-ek.json` yaz:

```json
{ "altyazi": { "zemin": "kutu", "boyut": "buyuk" } }
```

Bu dosya yalnızca o videoyu etkiler.
