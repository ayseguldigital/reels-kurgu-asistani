# Kesim önerisi

Dökümü okur, neyin kalıp neyin gideceğini önerirsin. Karar kişinindir: önerin `kararlar.json` dosyasına yazılır, kişi inceleme sayfasında onaylar ya da değiştirir. Kişi onaylamadan `kes.mjs` çalıştırılmaz.

## Dökümü okumak

`dokum.txt` şöyle görünür:

```
  1   0:02.2–0:09.2  [0–14]  Reels paylaşmadan hesabın büyüyemez diyenlere …
  2   0:09.3–0:15.7  [15–19]  Artık Reels kurgularını bilgisayarına yaptırabilirsin.   ♪7.4
  3   0:23.1–0:26.9  [20–31]  Şöyle bir iki(?) üç gülümse …
```

- Köşeli parantezdeki sayılar o satırın **ilk ve son kelime numarasıdır**. Kararlar ve kartlar kelime numarasıyla yazılır. Tek tek kelimelerin numarası için `dokum.json` içindeki `kelimeler` listesine bak (sıra numarası = kelime numarası).
- `(?)`: dökümün emin olamadığı kelime. Önemliyse kişiye sor ("0:23'te 'iki' mi dedin?"); tahmin etme.
- `⏸1.2`: satırdan sonra 1,2 saniyelik sessizlik.
- `♪7.4`: kelime çıkmamış ama ses var. "Iıı", gülme, öksürük, arka plan konuşması ya da dökümün atladığı bir söz olabilir.

## Ne kesilir

1. **Baş ve son.** Kayıt çoğu zaman telefonu yerleştirirken başlar, kaydı durdurmaya uzanırken biter. `bas-son.mjs` karelerine bak (kareler ilk kelimenin 3 saniye öncesinden ve son kelimenin 1 saniye öncesinden başlar; hangi karenin hangi saniye olduğunu araç yazar): kişinin kadraja yerleşip kameraya baktığı ilk kareyi ve kayıttan çıkmaya başladığı kareyi bul. O anların dışını, üstünde konuşma olsa bile `bas` ve `bit` ile at. İlk kelimeden önce kişi zaten yerleşmiş ve bekliyorsa `bas` yazmana gerek yoktur; konuşmadan önceki sessizlik kendiliğinden gider.
2. **Çekim arası konuşma.** "Oldu mu?", "bir daha alıyorum", kamera arkasındaki kişiyle konuşma, gülüp toparlanma. Bunlar videoya ait değildir.
3. **Tekrar çekimler.** Aynı cümle ya da bölüm birden çok kez söylendiyse **son denemeyi** tut, öncekileri kes; kişi çoğu zaman beğenene kadar tekrar eder. İki deneme belirgin biçimde farklıysa ikisini de kişiye göster, hangisini istediğini sor.
4. **Yarım kalan cümleler.** Başlanıp bırakılan, sonra baştan alınan cümleler.
5. **Dökümün yazdığı dolgular.** "Iı", "eee", "hmm" kelime olarak çıktıysa kes. "Şey", "yani", "hani" gibi sözcükleri yalnızca kişi stil dosyasında (`dolguSozcukler`) istediyse kes; yoksa dokunma, konuşmanın doğallığıdır.
6. **Konuyla ilgisiz uzun sapmalar.** Kendiliğinden kesme; öner ve gerekçesini söyle.

## Ne kendiliğinden olur

- **Duraklamalar.** Art arda kalan iki kelime arasındaki boşluk tempoya göre kısaltılır (sakin 0,7 sn, dengeli 0,45 sn, hızlı 0,28 sn üstü). Bunları tek tek yazmazsın.
- **Kelimesiz dolgular.** Dökümün yazmadığı bir "ııı" çoğu zaman bir duraklamanın içindedir ve duraklamayla birlikte gider.
- Bir duraklama anlam taşıyorsa (espriden önceki bekleme, vurgu için susma) `tutDuraklama` ile koru.

**Dikkat: `♪` işaretli yerler.** Orada dökümün atladığı gerçek bir söz olabilir ve duraklama diye kesilebilir. Videoda kalacak iki kelimenin arasında `♪` varsa kişiye söyle: "0:41'de bir şey söylüyorsun ama anlaşılmadı; kalsın mı?" Kalacaksa o duraklamayı `tutDuraklama` ile koru.

## Sıra değiştirmek

Videonun en güçlü cümlesi ortadaysa başa almayı, çağrı cümlesi ortadaysa sona almayı önerebilirsin. `sira` bölümlerin oynama sırasını verir; her bölüm `[ilk kelime, son kelime]` çiftidir.

- Bir bölümün içindeki bir kelime ya da cümleyi çıkarmak için `kes` kullan.
- `sira` içinde yer almayan kelimeler videoya girmez; çekim arası konuşmaları ve eski denemeleri tek tek `kes` ile yazmak yerine `sira` dışında bırakabilirsin.
- Sırayı değiştirdiğinde cümlelerin birbirine bağlanıp bağlanmadığını oku: "bu yüzden" ile başlayan bir cümle başa alınamaz.

## kararlar.json

```json
{
  "bas": 2.0,
  "bit": 112.5,
  "sira": [[75, 97], [0, 19], [60, 72]],
  "kes": [84, 85],
  "tutDuraklama": [66],
  "tempo": "dengeli"
}
```

| Alan | Anlamı |
|---|---|
| `bas`, `bit` | Ham kayıtta bu saniyeden öncesi ve sonrası atılır |
| `sira` | Bölümlerin oynama sırası. Yazılmazsa her şey kayıttaki sırasıyla oynar |
| `kes` | Kesilecek kelimelerin numaraları |
| `tutDuraklama` | Kısaltılmayacak duraklamalar: duraklamadan **önceki** kelimenin numarası |
| `tempo` | Yalnızca bu video stil dosyasındakinden farklı olacaksa |
| `duzeltme`, `vurgu` | Altyazı için; kelime numarasıyla. Bkz. `rehber/altyazi.md` |

Yazdıktan sonra sonucu gör (hiçbir şey üretmez):

```bash
node araclar/kes.mjs "<proje klasörü>" --plan
```

Süreye bak. Reels için 20–60 saniye iyi bir aralıktır; 90 saniyeyi geçiyorsa neyin çıkarılabileceğini öner ama kişinin anlatmak istediğini kısaltma kararını ona bırak. Kısa çıkması sorun değildir: ham kayıt zaten kısaysa video 5–10 saniye olabilir. Süreyi uzatmak için kesilmesi gereken yerleri bırakma; yalnızca kişiye sürenin kaç saniye olduğunu söyle.

## Kişiye sunmak

Asıl yol inceleme sayfasıdır (`rehber/inceleme.md`): kişi önerini orada görür, kelimelere dokunarak değiştirir ve kesilmiş hâli hemen izler.

Sayfayı açmadan önce sohbette kısaca özetle; kelime listesi dökme:

> Videon 1 dakika 56 saniyeden 30 saniyeye iniyor. Çekim arası konuşmaları ve ilk iki denemeyi çıkardım, son denemeyi tuttum. "Çektiğim videoları nasıl kurgulayacağını bilmiyorsan" cümlesini başa aldım çünkü en güçlü giriş o. 0:23'teki "iki" kelimesinden emin değilim; sayfada bakar mısın?

Sayfa açılamıyorsa (araçlar yok, kişi tarayıcı açamıyor) incelemeyi sohbette yap: `dokum.txt` satırlarını numaralarıyla göster, kesilecek satırları işaretle ve "Hangi satırlar kalsın ya da gitsin, numarasını söyle" de.

## Kestikten sonra

`kes.mjs` iki şeyi kendisi denetler:

- **Süreler tutuyor mu.** Görüntü, ses ve plan aynı uzunlukta değilse hata verir; yeniden çalıştır.
- **DİNLEYİN satırı.** Bir kesim noktası, hiçbir kelimeye ait olmayan bir sesin ortasından geçiyorsa saniyesini yazar. Bu yerleri kişiye söyle ("0:24'teki geçişi bir dinler misin?"); yarım hece ya da kesik nefes duyuluyorsa o noktadaki kelimeyi kes ya da duraklamayı koru.

Kesilmiş video yeniden yazıya dökülmez. Kalan kelimelerin yeni zamanları `kesim.json` dosyasına yazılır ve altyazı oradan üretilir.

Döküm bir kez alınır. Kararlar kelime numarasına bağlı olduğu için `kararlar.json` varken `dokum.mjs` yeniden çalışmaz; gerçekten baştan almak gerekiyorsa `--yeniden` kullan, `kararlar.json` dosyasını sil ve kesimleri yeniden onaylat.
