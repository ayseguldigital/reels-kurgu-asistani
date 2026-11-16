# Kapak stüdyosu

Reels kapağı: videodan bir kare, üstünde kısa bir başlık. Kişi kareyi ve görünümü kendisi seçer; sen sayfayı açar, bir başlık önerir ve çıkan dosyaların yerini söylersin.

## Açmak

```bash
node araclar/kapak.mjs "<proje klasörü>"
```

Komutu arka planda çalıştır ve yazdırdığı adresi kişiye ver (`http://127.0.0.1:4318`). Sayfa yalnızca bu bilgisayarda açılır; kareler videodan tam kalitede alınır ve hiçbir şey bilgisayardan çıkmaz. Bilgisayar yeniden başlarsa sayfa kapanır; kişi isterse aynı komutla yeniden açarsın, seçimleri yerinde durur.

Kişi "kapak yap", "kapak stüdyosunu aç" ya da "bir kapak lazım" dediğinde de aynı komutu çalıştır.

## Açmadan önce: başlık öner

Sayfa boş açılmasın. Videonun ne anlattığını biliyorsun; `<proje>/kapak.json` dosyasına bir başlık önerisi yaz:

```json
{ "baslik": "Reels kurgusu\nartık *çok kolay*", "gorunum": "yalin" }
```

- En çok 2–3 satır, satır başına 2–3 kelime. Kısa başlık büyük görünür ve küçük ekranda okunur.
- `\n` satır böler. `*yıldız*` arasındaki kelime vurgu rengine döner.
- Başlık videonun vaadini söyler, altyazıdaki ilk cümleyi tekrar etmez.
- Yalnızca `baslik` (ve istersen `gorunum`) yaz; gerisini kişi sayfada seçer. Dosya zaten varsa üstüne yazma, kişinin seçimleri oradadır.

## Sayfada ne var

1. **Kare.** Kesilmiş video ya da ham kayıt. Ham kayıtta kesilen yerler de vardır; en iyi gülümseme çoğu zaman çekim arasındadır. Altı örnek kare videoya eşit aralıklarla dağıtılmıştır, hiçbiri "en iyi" diye seçilmemiştir. Çubuk ve "1 kare" düğmeleri tam kareyi ayarlar.
2. **Başlık.** Elle satır bölünür; sığmayan yazı kendiliğinden küçülür.
3. **Görünüm.** Sekiz seçenek, hepsi kişinin kendi renkleri ve yazı tipleriyle:

   | Görünüm | Ne zaman iyi durur |
   |---|---|
   | Yalın | Arka plan sade, yazının arkası koyuysa |
   | Koyu geçiş | Arka plan açık ya da kalabalıksa |
   | Panel | Yazının her koşulda okunması gerekiyorsa |
   | Bantlar | İki üç kısa satır varsa |
   | Fosforlu | Tek bir kelime öne çıkacaksa (kelimeyi yıldızla) |
   | Kontur | Arka plan çok renkliyse |
   | Yarım blok | Yüz kadrajın bir yarısındaysa |
   | Çerçeve | Seri içerikte ("3 İPUCU", "2. BÖLÜM" gibi küçük bir etiketle) |

4. **Kontrol ve kayıt.** Instagram kapağı profil ızgarasında ortadan kırpar. Kırpma çizgileri başlığın içeride kalıp kalmadığını gösterir; çizgiler kaydedilen dosyada görünmez.

## Çıkan dosyalar

Kişi kaydettikçe `<proje>/bitmis/` klasörüne yazılır:

| Dosya | Nerede kullanılır |
|---|---|
| `kapak-1080x1920.png` | Reels kapağı olarak yüklenir |
| `kapak-1080x1440.png` | Profil ızgarasındaki 3:4 görünüm |
| `kapak-1080x1080.png` | Kare görünüm, başka yerlerde paylaşım |

Kişiye dosyaların yerini söyle. Kapağı Instagram'a yüklerken "Kapağı düzenle → Cihazdan ekle" yolunu izler.

## Sen kapağı görmek istersen

Kişi "nasıl olmuş, bak" derse kaydedilen PNG dosyasını oku ve şunlara bak: başlık kare kırpmanın içinde mi, yüzü kapatıyor mu, küçük boyutta okunuyor mu. Gördüğünü söyle; kararı kişi verir.
