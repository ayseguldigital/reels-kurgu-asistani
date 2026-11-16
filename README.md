# Reels Kurgu Asistanı

Kameraya konuştuğunuz ham videoyu Claude'a verin, kendi stilinizde bitmiş bir Reels alın: sesi temizlenmiş, gereksiz yerleri kesilmiş, Türkçe altyazılı ve grafikli.

Kurgu bilmeniz gerekmez. Claude ile konuşursunuz; o keser, siz onaylarsınız.

[Ayşegül Digital](https://aysegul.digital) tarafından hazırlandı. Ücretsiz ve açık kaynak.

## Ne yapar?

- **Sesi temizler.** Arka plan gürültüsünü azaltır, sesi netleştirir ve Instagram'ın beklediği düzeye getirir.
- **iPhone'un HDR videosunu çevirir.** iPhone videoyu olağan ayarda HDR çeker ve bu video başka araçlarda soluk çıkar. Asistan onu Reels'in renk aralığına çevirir; sonuç Apple'ın kendi dönüşümüyle aynıdır. Telefonunuzda bir ayar değiştirmeniz gerekmez.
- **Konuşmanızı yazıya döker.** Türkçe, kelime kelime. Bu iş bilgisayarınızda yapılır; sesiniz hiçbir yere gönderilmez.
- **Kesim önerir.** Kamerayı yerleştirdiğiniz anları, tekrar çekimleri, çekim arası konuşmaları ve uzun duraklamaları bulur. Siz onaylamadan hiçbir şey kesilmez.
- **Altyazı ekler.** Sizin renginizde ve yazı tipinizde. Söylenen kelime o an renklenir, öne çıkmasını istediğiniz kelimeler vurgulanır.
- **Grafik ekler.** Başlık, liste, sayı, karşılaştırma, site görüntüsü, kendi görselleriniz ve çağrı. Her grafik o anda söylediğinizi gösterir.
- **Ses efekti ekler.** Grafikler girerken kısa sesler çalar. İstemediğiniz grafikte kapatırsınız ya da hiç kullanmazsınız.
- **Önce gösterir.** Kesimleri, altyazıyı ve grafikleri bir inceleme sayfasında görürsünüz; kelimelere dokunarak değiştirirsiniz. Sonra önizlemeyi izler, beğenmediğiniz ana not bırakırsınız.
- **Kapak hazırlar.** Videodan kareyi siz seçersiniz, başlığı siz yazarsınız, sekiz görünümden birini seçersiniz.
- **Kontrol eder.** Bitmiş videonun boyutunu, ses düzeyini ve kesimde yutulmuş kelime olup olmadığını ölçer.

Sonunda elinizde üç dosya olur: altyazılı video, altyazısız sürüm ve altyazı dosyası (.srt). Altyazısız sürümü başka bir uygulamada kendi altyazınızla kullanabilirsiniz.

## Nasıl ilerler?

1. Telefonunuzla kameraya konuşarak videonuzu çekin ve Mac'inize aktarın.
2. Videoyu Claude'a verin ve **"bunu Reels yap"** yazın.
3. İlk seferde Claude size stilinizi sorar: renkleriniz, yazı tipiniz, altyazı biçiminiz. Beş dakika sürer, bir daha sorulmaz.
4. Claude bir **inceleme sayfası** açar. Kesilecek kelimeler üstü çizili görünür; dokunursanız geri gelir. "Oynat" kesilmiş hâli hemen gösterir.
5. "İncelemeyi bitirdim" dersiniz. Claude bir önizleme hazırlar (yaklaşık bir dakika).
6. Önizlemeyi izlersiniz. Tamamsa "tamam" dersiniz; değilse videoyu o anda durdurup notunuzu yazarsınız.
7. Claude son hâli hazırlar ve kapak isteyip istemediğinizi sorar.

## Ne gerekir?

- **Bir Mac.** Windows ve Linux'ta denenmedi.
- **Claude masaüstü uygulaması ve ücretli bir Claude planı** (Pro ya da üstü).
- **Yaklaşık 10 GB boş alan.** Bunun 1,6 GB'ı konuşmayı yazıya döken model.
- İlk kurulumda internet bağlantısı.

## Kurulum

Daha önce Terminal açmadıysanız [KURULUM.md](KURULUM.md) dosyasını izleyin; her adımı tek tek anlatıyorum.

Homebrew kuruluysa Claude uygulamasında **Code** sekmesini açın ve şunu yazın:

```
github.com/ayseguldigital/reels-kurgu-asistani adresindeki Reels Kurgu Asistanı'nı kur
```

Claude depoyu indirir, eksik araçları kurar ve hazır olduğunda haber verir. İlk kurulum, model indirmesi yüzünden 10-30 dakika sürebilir.

Kendiniz kurmak isterseniz:

```bash
git clone https://github.com/ayseguldigital/reels-kurgu-asistani.git ~/.reels-kurgu/kaynak
```

```bash
bash ~/.reels-kurgu/kaynak/kur.sh
```

## Kullanım

Claude uygulamasında Code sekmesinde videoyu mesaj kutusuna sürükleyip yazmanız yeterli:

| Ne istiyorsanız | Ne yazarsınız |
|---|---|
| Videoyu baştan sona kurgulatmak | `bunu Reels yap` |
| Yalnızca altyazı | `bu videoya altyazı ekle` |
| Yalnızca kesim | `bu videodaki boşlukları ve tekrarları kes` |
| Kapak | `bu video için kapak yap` |
| Stilinizi değiştirmek | `altyazım kutulu olsun` ya da `stilimi değiştirmek istiyorum` |
| Bir kural koymak | `bir daha sayı kartı kullanma` |
| Kendi yazı tipinizi kullanmak | yazı tipi dosyasını sürükleyin ve `bu yazı tipini kullan` yazın |
| Ses efektlerini kapatmak | `ses efekti istemiyorum` |

Videolarınız ve stil dosyanız **Filmler → Reels Kurgu** klasöründe durur. Her video kendi klasöründedir; bitmiş dosyalar içindeki `bitmis` klasörüne yazılır.

## Videonuz nereye gidiyor?

- **Döküm, kesim ve video hazırlama bilgisayarınızda yapılır.** Videonuz ve sesiniz bu adımlarda hiçbir yere gönderilmez.
- **Claude** konuşmanızın yazıya dökülmüş hâlini ve videodan aldığı birkaç kareyi görür; kurgu kararlarını buna göre verir. Bu, Claude ile yaptığınız her konuşma gibi işlenir.
- **İnceleme sayfası** iki yerde açılabilir. Bilgisayarınızda açarsanız hiçbir şey dışarı çıkmaz. Telefonunuzdan da bakmak isterseniz claude.ai hesabınızda gizli bir sayfa olarak açılır; o zaman videonun küçültülmüş bir kopyası kendi claude.ai hesabınıza yüklenir ve yalnızca siz görebilirsiniz. Hangisini istediğinizi Claude size sorar.
- **Kapak stüdyosu** yalnızca bilgisayarınızda çalışır.
- Videoda adı geçen bir sitenin görüntüsü istenirse Claude o sitenin herkese açık ana sayfasını açar.

## Ücreti var mı?

Asistan ücretsiz. Claude planınızın dışında hiçbir şey ödemezsiniz: kullanılan bütün araçlar açık kaynak ve bilgisayarınızda çalışır. Video hazırlamanın tek bedeli zaman. 30 saniyelik bir video için önizleme yaklaşık bir dakika, son hâl bir iki dakika sürer.

## Neleri yapamaz?

- **Windows ve Linux:** denenmedi.
- **Arka plan müziği:** eklemez. Müziği paylaşırken Instagram'da eklersiniz; güncel sesler zaten orada.
- **Çok kameralı çekim ve röportaj:** tek kişinin kameraya konuştuğu videolar için hazırlandı.
- **Ekran kaydı ve ek görüntü kurgusu:** yok. Kendi ekran görüntülerinizi ve fotoğraflarınızı grafik olarak ekleyebilirsiniz.
- **Kısa "ııı"lar:** uzun duraklamalar kendiliğinden gider, ama bir kelimeye yapışık kısa bir "ııı" kalabilir. İnceleme sayfasında dinleyip kesebilirsiniz.
- **Yazım:** özel adları yanlış duyabilir. Paylaşmadan önce altyazıyı bir kez okuyun.

## Stiliniz

Görünüşle ilgili her şey tek dosyada durur: `Filmler/Reels Kurgu/stil.json`. Claude ile konuşarak değiştirirsiniz; dosyayı elle açmanız gerekmez. Bir kural söylediğinizde ("bir daha kutulu altyazı kullanma") Claude onu dosyaya yazar ve sonraki videolarda uyar.

Dokuz yazı tipi hazır gelir ve hepsi Türkçe harfleri içerir: Inter, Poppins, Rubik, Nunito, Bricolage Grotesque, Space Grotesk, Playfair Display, DM Serif Display, Bebas Neue. Markanıza ait bir yazı tipiniz varsa dosyasını Claude'a verin; onu da kullanabilirsiniz. Yazı tipinde eksik Türkçe harf varsa asistan sizi uyarır.

Doldurulmuş bir örnek görmek isterseniz [ornek/stil.json](ornek/stil.json) dosyasına bakın.

## Depoda neler var?

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

Kendi ihtiyacınıza göre değiştirmek serbest. Claude'a "bu depoda şunu değiştir" demeniz yeterli; değişikliği yapar ve `bash kur.sh` ile yeniden kurar.

## Lisans

[MIT](LICENSE). Dilediğiniz gibi kullanabilir, değiştirebilir ve paylaşabilirsiniz.

Asistan şu açık kaynak araçların üstüne kurulu: HyperFrames, whisper.cpp, FFmpeg, GSAP ve lottie-web. Yazı tipleri SIL Open Font License ile dağıtılır; ses efektleri kamu malı (CC0) kayıtlardır. Ayrıntılar [LISANSLAR.md](LISANSLAR.md) dosyasında.

## Bir yerde takılırsanız

Önce Claude'a sorun: "kurulumu kontrol et" ya da "şu hatayı aldım" demeniz çoğu zaman yeter. Çözülmezse bana Instagram'da [@aysegul.digital](https://instagram.com/aysegul.digital) hesabından yazın.

## Ayşegül Digital

Sosyal medya danışmanlığı, dijital pazarlama stratejileri ve içerik üretimi üzerine notlar ve kaynaklar: [aysegul.digital](https://aysegul.digital)
