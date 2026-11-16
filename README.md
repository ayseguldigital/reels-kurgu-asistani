# Reels Kurgu Asistanı

Kameraya konuştuğun ham videoyu Claude'a verirsin, kendi stilinde bitmiş bir Reels alırsın: sesi temizlenmiş, gereksiz yerleri kesilmiş, Türkçe altyazılı ve grafikli.

Kurgu bilmen gerekmez. Claude ile konuşursun; o keser, sen onaylarsın.

[Ayşegül Digital](https://aysegul.digital) tarafından hazırlandı. Ücretsiz ve açık kaynak.

## Ne yapar

- **Sesi temizler.** Arka plan gürültüsünü azaltır, sesi netleştirir ve Instagram'ın beklediği düzeye getirir.
- **iPhone'un HDR videosunu çevirir.** iPhone videoyu olağan ayarda HDR çeker ve bu, başka araçlarda soluk çıkar. Asistan bunu Reels'in renk aralığına, Apple'ın kendi dönüşümüyle aynı sonucu verecek biçimde çevirir. Telefonunda bir ayar değiştirmen gerekmez.
- **Konuşmanı yazıya döker.** Türkçe, kelime kelime. Bilgisayarında yapılır; sesin hiçbir yere gönderilmez.
- **Kesim önerir.** Kamerayı yerleştirdiğin anları, tekrar çekimleri, çekim arası konuşmaları ve uzun duraklamaları bulur. Sen onaylamadan hiçbir şey kesilmez.
- **Altyazı ekler.** Senin renginde ve yazı tipinde. Söylenen kelime o an renklenir, öne çıkmasını istediğin kelimeler vurgulanır.
- **Grafik ekler.** Başlık, liste, sayı, karşılaştırma, site görüntüsü, kendi görsellerin ve çağrı. Her grafik o anda söylediğini gösterir.
- **Ses efekti ekler.** Grafikler girerken kısa sesler çalar. İstemediğin grafikte kapatırsın ya da hiç kullanmazsın.
- **Önce gösterir.** Kesimleri, altyazıyı ve grafikleri bir inceleme sayfasında görürsün; kelimelere dokunarak değiştirirsin. Sonra önizlemeyi izler, beğenmediğin ana not bırakırsın.
- **Kapak hazırlar.** Videodan kareyi sen seçersin, başlığı yazarsın, sekiz görünümden birini seçersin.
- **Kontrol eder.** Bitmiş videonun boyutunu, ses düzeyini ve kesimde yutulmuş kelime olup olmadığını ölçer.

Sonunda üç dosya çıkar: altyazılı video, altyazısız sürüm ve altyazı dosyası (.srt). Altyazısız sürümü başka bir uygulamada kendi altyazınla kullanabilirsin.

## Nasıl ilerler

1. Telefonunla kameraya konuşarak videonu çek ve Mac'ine aktar.
2. Claude'a videoyu ver ve **"bunu Reels yap"** yaz.
3. İlk seferde Claude sana stilini sorar: renklerin, yazı tipin, altyazı biçimin. Beş dakika sürer, bir daha sorulmaz.
4. Claude bir **inceleme sayfası** açar. Kesilecek kelimeler üstü çizili görünür; dokunursan geri gelir. "Oynat" kesilmiş hâli hemen gösterir.
5. "İncelemeyi bitirdim" dersin. Claude bir önizleme hazırlar (yaklaşık bir dakika).
6. Önizlemeyi izlersin. Tamamsa "tamam" dersin; değilse videoyu o anda durdurup notunu yazarsın.
7. Claude son hâli hazırlar ve kapak isteyip istemediğini sorar.

## Ne gerekir

- **Bir Mac.** Windows ve Linux'ta denenmedi.
- **Claude masaüstü uygulaması ve ücretli bir Claude planı** (Pro ya da üstü).
- **Yaklaşık 10 GB boş alan.** Bunun 1,6 GB'ı konuşmayı yazıya döken model.
- İlk kurulumda internet bağlantısı.

## Kurulum

Daha önce Terminal açmadıysan [KURULUM.md](KURULUM.md) dosyasını izle; her adımı tek tek anlatır.

Homebrew kuruluysa Claude uygulamasında **Code** sekmesini aç ve şunu yaz:

```
github.com/ayseguldigital/reels-kurgu-asistani adresindeki Reels Kurgu Asistanı'nı kur
```

Claude depoyu indirir, eksik araçları kurar ve hazır olduğunda haber verir. İlk kurulum, model indirmesi yüzünden 10–30 dakika sürebilir.

Kendin kurmak istersen:

```bash
git clone https://github.com/ayseguldigital/reels-kurgu-asistani.git ~/.reels-kurgu/kaynak
```

```bash
bash ~/.reels-kurgu/kaynak/kur.sh
```

## Kullanım

Claude uygulamasında Code sekmesinde, videoyu mesaj kutusuna sürükleyip yazman yeterli:

| Ne istiyorsan | Ne yazarsın |
|---|---|
| Videoyu baştan sona kurgulatmak | `bunu Reels yap` |
| Yalnızca altyazı | `bu videoya altyazı ekle` |
| Yalnızca kesim | `bu videodaki boşlukları ve tekrarları kes` |
| Kapak | `bu video için kapak yap` |
| Stilini değiştirmek | `altyazım kutulu olsun` ya da `stilimi değiştirmek istiyorum` |
| Bir kural koymak | `bir daha sayı kartı kullanma` |
| Kendi yazı tipini kullanmak | yazı tipi dosyasını sürükle ve `bu yazı tipini kullan` yaz |
| Ses efektlerini kapatmak | `ses efekti istemiyorum` |

Videoların ve stil dosyan **Filmler → Reels Kurgu** klasöründe durur. Her video kendi klasöründedir; bitmiş dosyalar içindeki `bitmis` klasörüne yazılır.

## Videon nereye gidiyor

- **Döküm, kesim ve video hazırlama bilgisayarında yapılır.** Videon ve sesin bu adımlarda hiçbir yere gönderilmez.
- **Claude** konuşmanın yazıya dökülmüş hâlini ve videodan aldığı birkaç kareyi görür; kurgu kararlarını buna göre verir. Bu, Claude ile yaptığın her konuşma gibi işlenir.
- **İnceleme sayfası** iki yerde açılabilir. Bilgisayarında açarsan hiçbir şey dışarı çıkmaz. Telefonundan da bakmak istersen claude.ai hesabında gizli bir sayfa olarak açılır; o zaman videonun küçültülmüş bir kopyası kendi claude.ai hesabına yüklenir ve yalnızca sen görebilirsin. Hangisini istediğini Claude sana sorar.
- **Kapak stüdyosu** yalnızca bilgisayarında çalışır.
- Videoda adı geçen bir sitenin görüntüsü istenirse Claude o sitenin herkese açık ana sayfasını açar.

## Ücreti var mı

Asistan ücretsizdir. Claude planın dışında hiçbir şey ödemezsin: kullanılan bütün araçlar açık kaynaktır ve bilgisayarında çalışır. Video hazırlamak para değil zaman harcar; 30 saniyelik bir video için önizleme yaklaşık bir dakika, son hâl bir iki dakika sürer.

## Neleri yapamaz

- **Windows ve Linux:** denenmedi.
- **Arka plan müziği:** eklemez. Müziği paylaşırken Instagram'da eklersin; güncel sesler zaten oradadır.
- **Çok kameralı çekim ve röportaj:** tek kişinin kameraya konuştuğu videolar için hazırlandı.
- **Ekran kaydı ve ek görüntü kurgusu:** yok. Kendi ekran görüntülerini ve fotoğraflarını grafik olarak ekleyebilirsin.
- **Kısa "ııı"lar:** uzun duraksamalar kendiliğinden gider ama bir kelimeye yapışık kısa bir "ııı" kalabilir. İnceleme sayfasında dinleyip kesebilirsin.
- **Yazım:** özel adları yanlış duyabilir. Paylaşmadan önce altyazıyı bir kez oku.

## Stilin

Görünüşle ilgili her şey tek dosyadadır: `Filmler/Reels Kurgu/stil.json`. Claude ile konuşarak değiştirirsin; elle açman gerekmez. Bir kural söylediğinde ("bir daha kutulu altyazı kullanma") Claude onu dosyaya yazar ve sonraki videolarda uyar.

Dokuz yazı tipi hazır gelir ve hepsi Türkçe harfleri içerir: Inter, Poppins, Rubik, Nunito, Bricolage Grotesque, Space Grotesk, Playfair Display, DM Serif Display, Bebas Neue. Markana ait bir yazı tipin varsa dosyasını Claude'a ver; onu da kullanabilirsin. Asistan, yazı tipinde eksik Türkçe harf varsa seni uyarır.

Doldurulmuş bir örnek için [ornek/stil.json](ornek/stil.json) dosyasına bakabilirsin.

## Depoda neler var

```
kur.sh                       kurulum ve güncelleme
KURULUM.md                   hiç bilmeyenler için adım adım kurulum
skills/reels-kurgu/
  SKILL.md                   Claude'un izlediği sıra ve kurallar
  rehber/                    her adımın ayrıntısı: stil sohbeti, kesim, altyazı, grafikler, inceleme, kapak
  araclar/                   her adımın aracı: ses temizleme, döküm, kesim, altyazı, video hazırlama, kontrol
  ortak/                     araçların ve inceleme sayfasının birlikte kullandığı hesaplar
  sablon/                    altyazı ve grafiklerin görünüşü ve hareketi
  inceleme/                  inceleme sayfası
  kapak/                     kapak stüdyosu
  fontlar/                   dokuz açık lisanslı yazı tipi
  sesler/                    on açık lisanslı ses efekti
ornek/                       örnek stil dosyası ve örnek animasyon
testler/                     otomatik testler
LISANSLAR.md                 kullanılan araçların ve yazı tiplerinin lisansları
```

Kendi ihtiyacına göre değiştirmek serbest. Claude'a "bu depoda şunu değiştir" demen yeterli; değişikliği yapıp `bash kur.sh` ile yeniden kurar.

## Lisans

[MIT](LICENSE). Dilediğin gibi kullanabilir, değiştirebilir ve paylaşabilirsin.

Asistan şu açık kaynak araçların üstüne kuruludur: HyperFrames, whisper.cpp, FFmpeg, GSAP ve lottie-web. Yazı tipleri SIL Open Font License ile dağıtılır; ses efektleri kamu malı (CC0) kayıtlardır. Ayrıntılar [LISANSLAR.md](LISANSLAR.md) dosyasında.

## Bir yerde takılırsan

Önce Claude'a sor: "kurulumu kontrol et" ya da "şu hatayı aldım" demen çoğu zaman yeter. Çözülmezse Instagram'da [@aysegul.digital](https://instagram.com/aysegul.digital) hesabına yaz.

## Ayşegül Digital

Sosyal medya danışmanlığı, dijital pazarlama stratejileri ve içerik üretimi üzerine notlar ve kaynaklar: [aysegul.digital](https://aysegul.digital)
