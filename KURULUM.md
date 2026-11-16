# Kurulum (hiç bilmeyenler için)

Bu sayfa sizi sıfırdan ilk Reels'inize götürür. Kod bilmeniz gerekmez; Terminal açmanız da gerekmez. Toplam 30-45 dakika sürer ve bunun çoğu beklemek.

**Gerekenler:** bir Mac, ücretli bir Claude planı (Pro ya da üstü), yaklaşık 10 GB boş alan ve internet.

## 1. Claude uygulamasını kurun

1. [claude.com/download](https://claude.com/download) adresinden Mac uygulamasını indirin ve kurun.
2. Uygulamayı açın, hesabınızla giriş yapın.
3. Üstteki sekmelerden **Code** sekmesine geçin. Asistan burada çalışır.

Code sekmesi ilk açılışta bir klasör seçmenizi ister. Belgeler klasörünü ya da boş bir klasörü seçebilirsiniz.

## 2. Homebrew'u kurun

Homebrew, Mac'e araç kurmayı kolaylaştıran ücretsiz bir program. Asistanın kullandığı araçları o kurar. Bu adımı yalnızca bir kez yaparsınız.

1. [Homebrew kurulum dosyasını indirin](https://github.com/Homebrew/brew/releases/latest/download/Homebrew.pkg) (155 MB kadar).
2. İndirilenler klasöründeki **Homebrew.pkg** dosyasına çift tıklayın.
3. Açılan pencerede **Sürdür** (Continue) ve **Yükle** (Install) düğmelerine basın.
4. Mac parolanızı ya da Touch ID'nizi ister. Onaylayın; kurulum bir iki dakika sürer.
5. Kurulumun bittiğini yazınca pencereyi kapatın.

> Parolanızı yalnızca Mac'inizin kendi kurulum penceresine yazarsınız. Claude sizden parola istemez; isterse yazmayın.

### Mac'iniz Intel işlemciliyse

Bu kurulum dosyası Apple çipli Mac'ler içindir (2020 sonundan beri satılan Mac'ler). Emin değilseniz ekranın sol üstündeki Apple menüsünden **Bu Mac Hakkında**'yı açın: "Çip: Apple M…" yazıyorsa yukarıdaki adımlar size göre. "İşlemci: Intel" yazıyorsa Homebrew'u Terminal'den kurarsınız:

1. **Terminal** uygulamasını açın: ⌘ + Boşluk tuşlarına basın, `Terminal` yazın, Enter'a basın.
2. Şu satırı kopyalayın, Terminal'e yapıştırın ve Enter'a basın:

   ```bash
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ```

3. **Mac parolanızı** sorar. Yazarken ekranda hiçbir şey görünmez; bu olağan. Yazın ve Enter'a basın.
4. "Press RETURN to continue" yazınca Enter'a basın. Birkaç dakika sürer.
5. Bittiğinde Terminal en altta **"Next steps"** başlığıyla satırlar gösterirse onları sırayla kopyalayıp yapıştırın ve her birinden sonra Enter'a basın. Bu adımı atlarsanız Homebrew çalışmaz.

Kontrol etmek için şunu yazın:

```bash
brew --version
```

`Homebrew` ile başlayan bir satır görüyorsanız hazırsınız. Terminal'i kapatabilirsiniz.

## 3. Asistanı kurun

Claude uygulamasına dönün, Code sekmesinde şunu yazın:

```
github.com/ayseguldigital/reels-kurgu-asistani adresindeki Reels Kurgu Asistanı'nı kur
```

Claude birkaç kez izin isteyebilir (dosya indirmek, komut çalıştırmak için). İzin verin. Sırasıyla şunları yapar:

- Asistanı indirir.
- Video ve ses araçlarını kurar (FFmpeg, Whisper, HyperFrames).
- Konuşmayı yazıya döken modeli indirir (1,6 GB; bağlantınıza göre 5-20 dakika).

Sonunda **HAZIR** yazdığını söyler. Claude uygulamasını kapatıp yeniden açın.

## 4. İlk Reels'iniz

1. Telefonunuzla kameraya konuşarak kısa bir video çekin. İlk deneme için 30-60 saniye yeter.
2. Videoyu Mac'inize aktarın (AirDrop en kolayı).
3. Claude'da Code sekmesinde videoyu mesaj kutusuna sürükleyin ve yazın:

   ```
   bunu Reels yap
   ```

4. İlk seferde Claude stilinizi sorar: renkleriniz, yazı tipiniz, altyazının nasıl görüneceği. Bilmediğiniz soruya "bilmiyorum, sen öner" diyebilirsiniz. Beş dakika sürer ve bir daha sorulmaz.
5. Claude bir inceleme sayfası açar. Kesilecek yerler üstü çizili görünür:
   - Bir kelimeye dokunursanız kesilir, yeniden dokunursanız geri gelir.
   - **Oynat** kesilmiş hâli hemen gösterir.
   - Altyazı sekmesinde öne çıkmasını istediğiniz kelimelere dokunursunuz.
   - Grafik sekmesinde istemediğiniz grafiği çıkarırsınız.
   - Bitince **İncelemeyi bitir** düğmesine basın ve Claude'a `incelemeyi bitirdim` yazın.
6. Claude önizlemeyi hazırlar. İzleyin; bir şey gözünüze batarsa videoyu orada durdurup notunuzu yazın. Her şey yolundaysa `tamam` yazın.
7. Bitmiş video **Filmler → Reels Kurgu → (videonun klasörü) → bitmis** içinde durur. Telefonunuza AirDrop ile gönderip paylaşabilirsiniz.

### Çekerken işinizi kolaylaştıracak üç şey

- **Dikey çekin.** Telefonu dik tutun; yatay çekilen videonun kenarları kırpılır.
- **Sessiz bir yerde çekin.** Gürültü azaltılır ama rüzgâr ve yoğun trafik tam temizlenmez.
- **Takılırsanız durmayın.** Cümleyi baştan söyleyin ve devam edin; tekrarları Claude bulup keser.

## Güncelleme

Yeni bir sürüm çıktığında Claude'a şunu yazın:

```
Reels Kurgu Asistanı'nı güncelle
```

Kendiniz yapmak isterseniz:

```bash
git -C ~/.reels-kurgu/kaynak pull
```

```bash
bash ~/.reels-kurgu/kaynak/kur.sh
```

Güncelleme videolarınıza ve stil dosyanıza dokunmaz.

## Bir şey ters giderse

Önce Claude'a şunu yazın:

```
Reels Kurgu Asistanı'nın kurulumunu kontrol et
```

Claude neyin eksik olduğunu bulur ve çoğunu kendisi düzeltir.

| Sorun | Çözüm |
|---|---|
| "Homebrew kurulu değil" | 2. adımı yapın. Kurulum penceresi bittiğini yazmadan kapandıysa Homebrew.pkg dosyasına yeniden çift tıklayın. |
| Model indirmesi yarıda kaldı | Claude'a "kurulumu sürdür" yazın; kaldığı yerden devam eder. |
| "Boş alan az" | Bilgisayarınızda en az 10 GB yer açın. |
| Claude asistanı tanımıyor | Claude uygulamasını kapatıp yeniden açın. Hâlâ tanımıyorsa "Reels Kurgu Asistanı'nı kur" yazın. |
| Video soluk ve gri çıktı | HDR kayıt çevrilememiş olabilir. Claude'a "bu video HDR mi, çevrildi mi?" diye sorun. Çözülmezse iPhone'da Ayarlar → Kamera → Video Kaydı → HDR Video'yu kapatıp yeniden çekin. |
| İnceleme sayfası açılmıyor | Claude'a "inceleme sayfasını bu bilgisayarda aç" yazın. |
| Altyazıda yanlış yazılmış kelime | Claude'a söyleyin ("Cloud değil Claude") ya da inceleme sayfasında kalemle düzeltin. |

Çözülmezse bana [@aysegul.digital](https://instagram.com/aysegul.digital) hesabından yazın; aldığınız hata mesajını da ekleyin.

## Kaldırmak

Asistanı kaldırmak için şu iki klasörü silin:

- `~/.claude/skills/reels-kurgu` (asistanın kendisi)
- `~/.reels-kurgu` (indirilen model ve araç dosyaları; 2 GB kadar)

Videolarınız ve stil dosyanız **Filmler → Reels Kurgu** klasöründe durur; onları silmek size kalmış.

## Claude için kurulum adımları

Kişi kurulum ya da güncelleme istediğinde sırayla:

1. `~/.reels-kurgu/kaynak` yoksa depoyu oraya indir: `git clone https://github.com/ayseguldigital/reels-kurgu-asistani.git ~/.reels-kurgu/kaynak`. Varsa `git -C ~/.reels-kurgu/kaynak pull`.
2. `bash ~/.reels-kurgu/kaynak/kur.sh` çalıştır. Model indirmesi uzun sürer; komutu arka planda çalıştır ve kişiye bunun 5–20 dakika alabileceğini söyle.
3. Betik "Homebrew kurulu değil" derse önce `uname -m` ile Mac'in türüne bak.
   - `arm64` (Apple çipli): kurulum dosyasını indir ve aç: `curl -fL -o ~/Downloads/Homebrew.pkg https://github.com/Homebrew/brew/releases/latest/download/Homebrew.pkg && open ~/Downloads/Homebrew.pkg`. Kişiye açılan pencerede **Sürdür** ve **Yükle** düğmelerine basmasını, parolasını o pencereye yazmasını ve bitince sana haber vermesini söyle. Haber gelince `/opt/homebrew/bin/brew --version` ile doğrula ve 2. adımdaki betiği yeniden çalıştır.
   - `x86_64` (Intel): kişiyi bu sayfadaki "Mac'iniz Intel işlemciliyse" bölümüne yönlendir.
   - Parolayı sen isteme ve sen girme; `sudo` ile komut çalıştırma, Homebrew'un Terminal kurulumunu kendin başlatma.
4. Sonunda `bash ~/.reels-kurgu/kaynak/kur.sh --kontrol` ile doğrula. Çıktı **HAZIR** diyorsa kişiye Claude uygulamasını yeniden açmasını ve bir video verip "bunu Reels yap" yazmasını söyle.
