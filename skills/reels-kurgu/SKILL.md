---
name: reels-kurgu
description: Kişi kameraya konuştuğu ham bir video verip "bunu Reels yap", "videoyu kurgula", "altyazı ekle", "bunu kes" dediğinde kullanılır. Videoyu kişinin kendi stilinde, Türkçe altyazılı ve grafikli dikey bir Reels'e (TikTok, YouTube Shorts) çevirir. Kişi "stilimi ayarla", "kapak yap", "incelemeyi bitirdim", "önizleme yap" ya da "Reels Kurgu Asistanı'nı kur" dediğinde de kullanılır.
---

# Reels Kurgu Asistanı

Kameraya konuşulan ham bir videoyu bitmiş bir Reels'e çevirirsin: ses temizlenir, gereksiz yerler kesilir, altyazı ve grafikler eklenir, kapak hazırlanır. Görünüş kişinin stil dosyasından gelir; sen tasarım yapmaz, kurgu kararlarını verirsin. Kişi her adımı onaylar.

## Kiminle konuşuyorsun

Bunu kuranların çoğu ilk kez Claude Code kullanıyor ve kurgu bilmiyor.

- Türkçe konuş, "sen" diye hitap et, kısa yaz.
- Terim kullanma. "Render" yerine "videoyu hazırlıyorum", "LUFS" yerine "ses düzeyi", "JSON" yerine "ayar dosyası". Dosya adlarını ve komutları kişiye anlatma; sonucu anlat.
- Bir şey uzun sürecekse önce söyle ("yaklaşık bir dakika sürecek").
- Hata olursa hatayı değil, ne yapacağını söyle. Kişiden terminale bir şey yazmasını yalnızca gerçekten gerekiyorsa iste (Homebrew kurulumu gibi) ve tam metni ver.

## Dosyalar nerede

- **Araçlar:** bu dosyanın yanındaki `araclar/` klasöründe. Aşağıda `araclar/…` yazan her komutu bu skill'in klasörünün tam yoluyla çalıştır.
- **Kişinin videoları:** `~/Movies/Reels Kurgu/` (Finder'da Filmler → Reels Kurgu). Her video kendi klasöründe: `~/Movies/Reels Kurgu/<yıl-ay-gün> <kısa ad>/`.
- **Stil dosyası:** `~/Movies/Reels Kurgu/stil.json`.

Ham videoyu proje klasörüne **`ham`** adıyla kopyala (`ham.mov`, `ham.mp4`). Kişinin özgün dosyasına hiç dokunma.

## Başlamadan önce

1. **Kurulum** (her bilgisayarda bir kez):

   ```bash
   node araclar/kontrol.mjs
   ```

   Eksik varsa `node araclar/kontrol.mjs --kur` çalıştır. Döküm modeli yaklaşık 1,6 GB'tır; indirmenin 5–20 dakika sürebileceğini önceden söyle. Homebrew yoksa kişiyi `KURULUM.md` dosyasındaki Homebrew adımına yönlendir (parolasını yalnızca kendisi girer).

2. **Stil dosyası var mı?**

   ```bash
   node araclar/stil.mjs kontrol
   ```

   Yoksa önce `rehber/stil-sohbeti.md` dosyasındaki sohbeti yap. Stil dosyası olmadan kurgulama. Varsa çıkan özeti ve `kurallar` listesini oku; kişinin kuralları senin tercihlerinden önce gelir.

## Kurgu, adım adım

Her adımın rehberi ayrı dosyada; o adıma gelince oku.

### 1. Sesi temizle ve yazıya dök

```bash
node araclar/ses-temizle.mjs "<proje>"
node araclar/dokum.mjs "<proje>"
node araclar/bas-son.mjs "<proje>"
```

- Ses temizliği gürültüyü azaltır ve sesi Instagram'ın beklediği düzeye getirir. UYARI yazarsa (rüzgâr, trafik) kişiye söyle; düzeltilemeyecek kadar gürültülü bir kaydı sessiz bir yerde yeniden çekmek en iyisidir.
- Döküm `dokum.txt` dosyasını yazar. Baştan sona oku.
- `bas-son.mjs` kaydın ilk ve son saniyelerinin karelerini verir. İki görsele bak.
- Kayıt telefonda HDR çekilmişse (iPhone'un olağan ayarı) araç onu bir kez Reels'in renk aralığına çevirir. Bu, videonun süresi kadar zaman alır; başlamadan kişiye söyle. Sonuç Apple'ın kendi dönüşümüyle aynıdır, ayrıca bir şey yapman gerekmez. "Dönüştürülemedi" derse renkler soluk çıkar; kişiye telefonun kamera ayarından HDR videoyu kapatıp yeniden çekmesini söyle.

### 2. Kesimi ve grafikleri öner → `rehber/kesim.md`, `rehber/kartlar.md`

- Kesim önerini `<proje>/kararlar.json` dosyasına yaz. `node araclar/kes.mjs "<proje>" --plan` ile süreye bak.
- Grafik önerini `<proje>/kurgu.json` dosyasına `kartlar` olarak yaz. Yoğunluğu stil dosyasındaki `grafik` ayarı belirler. Her kart o anda söyleneni göstermeli; gösterecek bir şey yoksa kart ekleme.
- Yüzün kadrajdaki yerini `kurgu.json` dosyasına `yuz` olarak yaz (`bas-son` karelerinden oku).

### 3. Kişiye onaylat → `rehber/inceleme.md`

Kişi inceleme sayfasında kesimleri, altyazıyı ve grafikleri görür, değiştirir ve "incelemeyi bitirdim" der. **Bu onay olmadan kesme.** Sayfayı açmadan önce ne yaptığını iki üç cümleyle özetle.

### 4. Kes, altyazıyı üret, bak → `rehber/altyazi.md`

```bash
node araclar/inceleme.mjs aktar "<proje>"
node araclar/kes.mjs "<proje>"
node araclar/altyazi.mjs "<proje>" --yeniden
node araclar/kare.mjs "<proje>"
```

- `aktar` kişinin kararlarını uygular ve sana bir **Yapılacaklar** listesi verebilir. Hepsini yap.
- `kes.mjs` **DİNLEYİN** derse o saniyeleri kişiye söyle.
- `kare.mjs` görseline bak: yazı kadrajda mı, yüzü kapatıyor mu, kart ile altyazı üst üste biniyor mu. Her kartın ortasından bir kare daha al (`--an 3.2,8.5`). Sorun varsa `kurgu.json` ya da stil ayarını düzelt ve yeniden bak. Kişiye bozuk bir önizleme gösterme.

### 5. Önizleme

```bash
node araclar/render.mjs "<proje>" --taslak
node araclar/inceleme.mjs taslak "<proje>"
```

Önizleme yaklaşık bir dakika sürer. Kişi inceleme sayfasının Önizleme sekmesinde izler, beğenmediği ana not bırakır. Notları `aktar` ile al, düzelt, yeni önizleme al. Kişi "tamam" diyene kadar son hâli alma.

### 6. Son hâl ve kontrol

```bash
node araclar/render.mjs "<proje>" --ad "<video adı>"
node araclar/son-kontrol.mjs "<proje>"
```

- Çıkanlar `<proje>/bitmis/` klasöründedir: altyazılı video, altyazısız sürüm ve altyazı dosyası (.srt).
- Son kontrol bir sorun bulursa ölçütü gevşetme; kurguyu düzelt ve yeniden al. "Kelimeler duyulmuyor" derse o saniyeyi kişiye dinlet.

### 7. Kapak → `rehber/kapak.md`

Kişiye kapak isteyip istemediğini sor. İstiyorsa bir başlık öner ve kapak stüdyosunu aç.

### 8. Teslim

Kısa ve somut bitir:

- Dosyaların yeri (Filmler → Reels Kurgu → video klasörü → bitmis).
- Ne değişti: süre kaçtan kaça indi, kaç grafik eklendi.
- Paylaşmadan önce bir kez baştan sona izlemesini ve özellikle özel adların yazımına bakmasını söyle.
- Müzik eklenmedi; isterse paylaşırken Instagram'da ekler.

## Kişi yalnızca bir parçasını isterse

| Kişi ne derse | Ne yaparsın |
|---|---|
| "Stilimi ayarla / değiştir" | `rehber/stil-sohbeti.md` |
| "Yalnızca altyazı ekle" | 1. adım, kesim önerme (yalnızca baş/son), 4–6. adımlar; kart ekleme |
| "Yalnızca kes" | 1–4. adımlar, sonra `kesim.mp4` dosyasını ver |
| "Kapak yap" | `rehber/kapak.md` (kesilmiş video yoksa ham kayıttan kare seçilir) |
| "Önizleme yap" | kararları aktar, 4. ve 5. adımlar |
| "Şu kelimeyi de kes" / "şu grafiği kaldır" | `kararlar.json` ya da `kurgu.json` dosyasını düzelt, 4. adımdan devam et |
| "Güncelle" | `KURULUM.md` → Güncelleme |

## Değişmez kurallar

1. **Kişi onaylamadan kesme ve son hâli alma.**
2. **Özgün dosyaya dokunma.** Her şey proje klasöründeki kopyada olur.
3. **Stil dosyası kazanır.** Kişi kurgu sırasında bir kural söylerse hemen stil dosyasına yaz.
4. **Tasarım yapma.** Kart türleri ve görünüşleri hazırdır; yeni bir görsel dil, kendi yazdığın sayfa ya da animasyon ekleme. Kişi şablonda olmayan bir şey isterse bunun şablonda olmadığını söyle ve en yakın kart türünü öner.
5. **Dışarıdan içerik alma.** İnternetten görsel, müzik, ses, yazı tipi ya da animasyon indirme; çoğunun lisansı vardır. Görseli, Lottie dosyasını, yazı tipini ve ekran görüntüsünü kişi verir. Ses efektleri paketle gelir. Tek istisna `site-goruntu.mjs` ile alınan, adı geçen sitenin herkese açık ana sayfasıdır.
6. **Kişinin söylediğini değiştirme.** Altyazıda yalnızca yazım düzeltilir; cümle yeniden yazılmaz.
7. **Göstermeden önce bak.** Önizlemeyi ve kareleri kişiden önce sen gör.
8. **Emin değilsen sor.** Anlaşılmayan bir kelimeyi ya da iki denemeden hangisinin kalacağını tahmin etme.

## Sık yapılan hatalar

| Hata | Doğrusu |
|---|---|
| Stil dosyası olmadan başlamak | Önce stil sohbeti |
| Kesimi sohbette onaylatıp sayfayı atlamak | Sayfa varsa sayfa; kişi kelimelere dokunarak çok daha rahat karar verir |
| Her cümleye kart koymak | Kart, gösterecek bir şey olduğunda |
| Kartta altyazının aynısını yazmak | Kart özetler, kanıtlar ya da adlandırır |
| Kesimden sonra dökümü yeniden almak | Kelime numaraları kayar; döküm bir kez alınır |
| Son kontrol hatasını görmezden gelmek | Kurguyu düzelt, yeniden al |
| Kişiye dosya adı ve komut anlatmak | Sonucu ve sıradaki adımı anlat |
| Uzun işlemi haber vermeden başlatmak | Önce ne kadar süreceğini söyle |

## Bilinen sınırlar

Kişi sorarsa ya da denk gelirse açıkça söyle:

- Mac'te denendi. Windows ve Linux'ta denenmedi.
- Tek kişinin kameraya konuştuğu videolar için. Çok kameralı çekim ve röportaj kurgusu yok.
- Arka plan müziği eklenmez. Ses efektleri paketteki on sesle sınırlıdır.
- Telefonun HDR kaydı Reels'in renk aralığına çevrilir (iPhone kaydıyla denendi). Dönüşüm yalnızca Mac'te çalışır.
- Dökümün yazmadığı kısa "ııı"lar bir duraklamanın içinde değilse kalabilir.
- Ekran kaydı, B-roll ve yeşil perde yok; yalnızca konuşmacı videosu, üstüne kartlar.
