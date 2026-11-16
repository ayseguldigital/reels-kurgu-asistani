# Grafik kartları

Kartlar `kurgu.json` dosyasındaki `kartlar` listesine yazılır. Tasarım yapılmaz: renk, yazı tipi ve hareket şablondan ve kişinin stil dosyasından gelir. Senin işin hangi cümlede hangi kartın çıkacağına karar vermek.

## Önce şu üç kural

1. **Her kart o anda söyleneni gösterir.** Süs olsun diye kart eklenmez. Gösterecek bir şey yoksa o cümle kartsız kalır.
2. **Aynı cümleyi kartta yeniden yazma.** Altyazı zaten sözü yazıyor. Kart sözü *özetler* (liste), *kanıtlar* (site, görsel), *sayıya döker* (sayı) ya da *adlandırır* (etiket).
3. **Yoğunluk stil dosyasındaki `grafik` ayarına uyar:** `az` yaklaşık 10 saniyede bir, `dengeli` 5–6 saniyede bir, `yogun` 3–4 saniyede bir kart. Yakınlaşma bu sayıya girmez.

## Zamanlama

Her kart bir kelimeye bağlanır:

```json
{ "tur": "etiket", "metin": "Claude Code", "kelime": 84 }
```

- `kelime`: `dokum.txt` dosyasında köşeli parantez içinde görünen kelime numarası. Kart o kelime söylenirken çıkar. Kesilmiş bir kelimeye bağlanamaz.
- Bitiş için üç yol var: `bitKelime` (o kelime bitince kaybolur), `sure` (saniye) ya da hiçbiri (türün olağan süresi).
- Kelime yerine `bas` ile kesilmiş videodaki saniye de verilebilir; ama kelimeye bağlamak daha sağlamdır.

Yazılarda `*yıldız*` arasına alınan kelime vurgu rengine döner.

## Kart türleri

| Tür | Ne zaman | Zorunlu alan | Olağan süre |
|---|---|---|---|
| `baslik` | Açılış cümlesi, bölüm adı | `metin` | 2,6 sn |
| `etiket` | Bir isim, araç ya da terim geçtiğinde | `metin` | 2,4 sn |
| `liste` | Adımlar ya da maddeler sayılırken | `maddeler` | son maddeden 1,8 sn sonra |
| `sayi` | Bir oran ya da rakam söylenirken | `deger` | 2,8 sn |
| `cagri` | Videonun sonundaki çağrı | `metin` | video bitene kadar |
| `gorsel` | Kişinin verdiği ekran görüntüsü ya da fotoğraf | `dosyalar` | 3,2 sn |
| `site` | Adı geçen bir site ya da araç | `dosya` | 3,6 sn |
| `karsilastirma` | Önce/sonra, yanlış/doğru | `sol`, `sag` | 4,2 sn |
| `lottie` | Kişinin verdiği Lottie animasyonu | `dosya` | animasyonun süresi |
| `yakinlas` | Vurgulu bir cümlede konuşmacıya yaklaşma | yok | 1,6 sn |

### baslik

```json
{ "tur": "baslik", "kelime": 0, "metin": "Reels kurgusu / artık *çok kolay*", "ustYazi": "YENİ", "konum": "ust" }
```

- `/` satır böler. En çok 3 satır, satır başına en çok 14–16 harf; kısa satır büyük görünür.
- `ustYazi` (isteğe bağlı): başlığın üstündeki küçük etiket ("1. ADIM", "YENİ").
- `konum`: `ust` (olağan), `orta`, `alt`.

### etiket

```json
{ "tur": "etiket", "kelime": 84, "metin": "Claude Code", "konum": "ust-sag" }
```

`konum`: `ust-sol` (olağan), `ust-sag`, `ust`, `orta-sol`, `orta-sag`. Yüzün üstüne gelmeyen köşeyi seç.

### liste

```json
{ "tur": "liste", "kelime": 12, "baslik": "Claude *senin için*",
  "maddeler": ["Sessizlikleri keser", { "metin": "Altyazı ekler", "kelime": 31 }, "Grafik yerleştirir"] }
```

- En çok 5 madde, madde başına en çok 28 harf.
- Madde düz yazı olabilir (sırayla belirir) ya da `kelime` ile söylendiği ana bağlanabilir. Kişi maddeleri tek tek sayıyorsa bağla.
- `numara: false` numara yerine sade liste verir.

### sayi

```json
{ "tur": "sayi", "kelime": 40, "deger": 80, "onEk": "%", "aciklama": "daha az kurgu zamanı" }
```

`onEk` ve `sonEk` sayının önüne ve arkasına yazılır (`%`, ` bin`, ` sn`). `ondalik: 1` virgülden sonra bir hane gösterir. Sayı sıfırdan hedefe sayar; başka yerden başlasın istersen `baslangic`.

### cagri

```json
{ "tur": "cagri", "kelime": 68, "metin": "Yorumlara *REELS* yaz" }
```

Yıldızlı kelime kutu içinde öne çıkar. Olağan yeri altyazının üstüdür (`konum: "alt"`); çeneyi ya da eli kapatıyorsa `konum: "ust"` ver.

### gorsel

```json
{ "tur": "gorsel", "kelime": 22, "dosyalar": ["ekran-1.png", "ekran-2.png"] }
```

1–3 görsel. Dosya yolu proje klasörüne göredir. Görseli kişi verir; internetten görsel indirme.

### site

```json
{ "tur": "site", "kelime": 15, "dosya": "goruntu/canva.png", "adres": "canva.com" }
```

Görüntüyü şu araç alır:

```bash
node araclar/site-goruntu.mjs "<proje klasörü>" canva.com
```

- Yalnızca herkese açık ana sayfayı alır. Kişinin kendi hesabının içi (panel, istatistik, mesajlar) alınamaz; onu kişiden iste.
- Çıkış kodu 2 ise site boş sayfa döndürmüştür: görüntü kullanılmaz. Kişiden ekran görüntüsü iste.
- Kullanmadan önce görsele bak. Çerez uyarısı ya da giriş ekranı çıktıysa kullanma.

### karsilastirma

```json
{ "tur": "karsilastirma", "kelime": 50,
  "sol": { "baslik": "Eskiden", "maddeler": ["Saatler süren kurgu", "Elle altyazı"] },
  "sag": { "baslik": "Şimdi", "maddeler": ["Dakikalar içinde", "Otomatik altyazı"] } }
```

Sol sütun soluk ve çarpılı, sağ sütun vurgulu ve onaylıdır. Sütun başına en çok 3 madde, madde başına en çok 20 harf.

### lottie

```json
{ "tur": "lottie", "kelime": 60, "dosya": "onay.json", "konum": "ust-sag", "boyut": 300 }
```

- Dosyayı kişi verir ve `.json` uzantılı olmalıdır (`.lottie` paketleri desteklenmez).
- `dongu: true` animasyonu süre boyunca tekrarlar. `sure` verilmezse animasyon bir kez oynar.
- İnternetten Lottie indirme: çoğunun kendi lisansı vardır. Kişi kendi indirdiği ya da yaptığı dosyayı verir.

### yakinlas

```json
{ "tur": "yakinlas", "kelime": 92, "oran": 1.12 }
```

Konuşmacıya kısa bir yaklaşma. Vurgulu, tek cümlelik anlarda kullan; art arda iki kez kullanma. Konuşmacının küçüldüğü bir kartla aynı ana gelirse kendiliğinden atlanır.

## Konuşmacının yer açması (`zemin`)

Uzun kartlar (`liste`, `gorsel`, `site`, `karsilastirma`) yüzü kapatmasın diye konuşmacı küçülüp alttaki pencereye çekilir, arkası kişinin ana rengiyle dolar. Bu olağan davranıştır. Kartın videonun üstünde durmasını istersen `"zemin": false` yaz; `baslik` ve `sayi` için tersine `"zemin": true` yazabilirsin (bölüm geçişi gibi durur).

Art arda gelen zeminli kartlarda konuşmacı gidip gelmez, küçük kalır.

Pencerenin yüzü ortalaması için `kurgu.json` dosyasının en üstüne yüzün yerini yaz (kadrajın soldan ve üstten oranı):

```json
"yuz": { "x": 0.5, "y": 0.42 }
```

Yüzün yerini `bas-son.mjs` karelerinden ya da `kare.mjs` çıktısından oku. Yazılmazsa `0.5, 0.4` kabul edilir.

## Bitirmeden önce bak

```bash
node araclar/kare.mjs "<proje klasörü>" --an 1.5,7.2,13.9
```

Her kartın ortasından bir kare al ve görsele bak:

- Yazı kadrajın içinde mi, kesilmiş kelime var mı?
- Kart yüzü, gözleri ya da ağzı kapatıyor mu?
- Kart ile altyazı üst üste biniyor mu?
- İki kart aynı anda aynı yerde mi? (`kur.mjs` bunu UYARI olarak da söyler.)

Sorun varsa metni kısalt, `konum` değiştir ya da kartı başka kelimeye bağla. Sonra yeniden bak.
