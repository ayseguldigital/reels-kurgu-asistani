# Kurulum (hiç bilmeyenler için)

Bu sayfa seni sıfırdan ilk Reels'ine götürür. Kod bilmen gerekmez; yalnızca birkaç satırı kopyalayıp yapıştıracaksın. Toplam 30–45 dakika sürer ve bunun çoğu beklemektir.

**Gerekenler:** bir Mac, ücretli bir Claude planı (Pro ya da üstü), yaklaşık 10 GB boş alan ve internet.

## 1. Claude uygulamasını kur

1. [claude.com/download](https://claude.com/download) adresinden Mac uygulamasını indir ve kur.
2. Uygulamayı aç, hesabınla giriş yap.
3. Üstteki sekmelerden **Code** sekmesine geç. Asistan burada çalışır.

Code sekmesi ilk açılışta bir klasör seçmeni ister. Belgeler klasörünü ya da boş bir klasörü seçebilirsin.

## 2. Homebrew'u kur

Homebrew, Mac'e araç kurmayı kolaylaştıran ücretsiz bir programdır. Asistanın kullandığı araçları o kurar. Bu adımı yalnızca bir kez yaparsın.

1. **Terminal** uygulamasını aç: ⌘ + Boşluk tuşlarına bas, `Terminal` yaz, Enter'a bas.
2. Şu satırı kopyala, Terminal'e yapıştır ve Enter'a bas:

   ```bash
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ```

3. **Mac parolanı** sorar. Yazarken ekranda hiçbir şey görünmez; bu olağandır. Yaz ve Enter'a bas.
4. "Press RETURN to continue" yazınca Enter'a bas. Birkaç dakika sürer.
5. Bittiğinde Terminal en altta **"Next steps"** başlığıyla iki üç satır gösterir. O satırları sırayla kopyalayıp yapıştır ve her birinden sonra Enter'a bas. Bu adımı atlarsan Homebrew çalışmaz.

Kontrol etmek için şunu yaz:

```bash
brew --version
```

`Homebrew 4…` gibi bir satır görüyorsan hazırsın. Terminal'i kapatabilirsin.

> Parolanı yalnızca kendi Terminal'ine yazarsın. Claude senden parola istemez; isterse yazma.

## 3. Asistanı kur

Claude uygulamasına dön, Code sekmesinde şunu yaz:

```
github.com/ayseguldigital/reels-kurgu-asistani adresindeki Reels Kurgu Asistanı'nı kur
```

Claude birkaç kez izin isteyebilir (dosya indirmek, komut çalıştırmak için). İzin ver. Şunları yapar:

- Asistanı indirir.
- Video ve ses araçlarını kurar (FFmpeg, Whisper, HyperFrames).
- Konuşmayı yazıya döken modeli indirir (1,6 GB; bağlantına göre 5–20 dakika).

Sonunda **HAZIR** yazdığını söyler. Claude uygulamasını kapatıp yeniden aç.

## 4. İlk Reels'in

1. Telefonunla kameraya konuşarak kısa bir video çek. İlk deneme için 30–60 saniye yeter.
2. Videoyu Mac'ine aktar (AirDrop en kolayı).
3. Claude'da Code sekmesinde videoyu mesaj kutusuna sürükle ve yaz:

   ```
   bunu Reels yap
   ```

4. İlk seferde Claude stilini sorar: renklerin, yazı tipin, altyazının nasıl görüneceği. Bilmediğin soruya "bilmiyorum, sen öner" diyebilirsin. Beş dakika sürer ve bir daha sorulmaz.
5. Claude bir inceleme sayfası açar. Kesilecek yerler üstü çizili görünür:
   - Bir kelimeye dokunursan kesilir, yeniden dokunursan geri gelir.
   - **Oynat** kesilmiş hâli hemen gösterir.
   - Altyazı sekmesinde öne çıkmasını istediğin kelimelere dokunursun.
   - Grafik sekmesinde istemediğin grafiği çıkarırsın.
   - Bitince **İncelemeyi bitir** düğmesine bas ve Claude'a `incelemeyi bitirdim` yaz.
6. Claude önizlemeyi hazırlar. İzle; bir şey gözüne batarsa videoyu orada durdurup notunu yaz. Her şey yolundaysa `tamam` yaz.
7. Bitmiş video **Filmler → Reels Kurgu → (videonun klasörü) → bitmis** içindedir. Telefonuna AirDrop ile gönderip paylaşabilirsin.

### Çekerken işini kolaylaştıracak üç şey

- **HDR'yi kapat.** iPhone'da Ayarlar → Kamera → Video Kaydı → HDR Video kapalı olsun. Açık çekilen video da işlenir ama renkler telefonda gördüğünden biraz farklı çıkabilir.
- **Sessiz bir yerde çek.** Gürültü azaltılır ama rüzgâr ve yoğun trafik tam temizlenmez.
- **Takılırsan durma.** Cümleyi baştan söyle ve devam et; tekrarları Claude bulup keser.

## Güncelleme

Yeni bir sürüm çıktığında Claude'a şunu yaz:

```
Reels Kurgu Asistanı'nı güncelle
```

Kendin yapmak istersen:

```bash
git -C ~/.reels-kurgu/kaynak pull
```

```bash
bash ~/.reels-kurgu/kaynak/kur.sh
```

Güncelleme videolarına ve stil dosyana dokunmaz.

## Bir şey ters giderse

Önce Claude'a şunu yaz:

```
Reels Kurgu Asistanı'nın kurulumunu kontrol et
```

Claude neyin eksik olduğunu bulur ve çoğunu kendisi düzeltir.

| Sorun | Çözüm |
|---|---|
| "Homebrew kurulu değil" | 2. adımı yap. "Next steps" satırlarını yapıştırdığından emin ol. |
| Model indirmesi yarıda kaldı | Claude'a "kurulumu sürdür" yaz; kaldığı yerden devam eder. |
| "Boş alan az" | Bilgisayarında en az 10 GB yer aç. |
| Claude asistanı tanımıyor | Claude uygulamasını kapatıp yeniden aç. Hâlâ tanımıyorsa "Reels Kurgu Asistanı'nı kur" yaz. |
| Renkler telefondakinden farklı | Video HDR çekilmiş ve çevrilmiş. Telefonda HDR'yi kapatıp yeniden çekersen renkler birebir tutar. |
| İnceleme sayfası açılmıyor | Claude'a "inceleme sayfasını bu bilgisayarda aç" yaz. |
| Altyazıda yanlış yazılmış kelime | Claude'a söyle ("Cloud değil Claude") ya da inceleme sayfasında kalemle düzelt. |

Çözülmezse [@aysegul.digital](https://instagram.com/aysegul.digital) hesabına yaz; aldığın hata mesajını da ekle.

## Kaldırmak

Asistanı kaldırmak için şu iki klasörü sil:

- `~/.claude/skills/reels-kurgu` (asistanın kendisi)
- `~/.reels-kurgu` (indirilen model ve araç dosyaları; 2 GB kadar)

Videoların ve stil dosyan **Filmler → Reels Kurgu** klasöründedir; onları silmek sana kalmış.

## Claude için kurulum adımları

Kişi kurulum ya da güncelleme istediğinde sırayla:

1. `~/.reels-kurgu/kaynak` yoksa depoyu oraya indir: `git clone https://github.com/ayseguldigital/reels-kurgu-asistani.git ~/.reels-kurgu/kaynak`. Varsa `git -C ~/.reels-kurgu/kaynak pull`.
2. `bash ~/.reels-kurgu/kaynak/kur.sh` çalıştır. Model indirmesi uzun sürer; komutu arka planda çalıştır ve kişiye bunun 5–20 dakika alabileceğini söyle.
3. Betik "Homebrew kurulu değil" derse kişiyi bu sayfadaki 2. adıma yönlendir. Homebrew kurulumu parola ister; onu sen çalıştırma.
4. Sonunda `bash ~/.reels-kurgu/kaynak/kur.sh --kontrol` ile doğrula. Çıktı **HAZIR** diyorsa kişiye Claude uygulamasını yeniden açmasını ve bir video verip "bunu Reels yap" yazmasını söyle.
