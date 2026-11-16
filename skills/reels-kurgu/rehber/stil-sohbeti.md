# Stil sohbeti

Kişinin videoları her seferinde aynı görünsün diye renkleri, yazı tipi, altyazı biçimi ve alışkanlıkları bir kez sorulur ve `~/Movies/Reels Kurgu/stil.json` dosyasına yazılır. Bu dosya yokken video kurgulama; "fark etmez, sen seç" dese bile sohbeti yap. Beş dakika sürer ve sonraki her videoda zaman kazandırır.

## Nasıl sorulur

- **Her seferinde tek soru.** Cevabı bekle, sonra sıradakine geç.
- **Seçenek sun.** "Altyazın nasıl olsun?" yerine üç seçeneği anlat. Kişi tasarımcı değil; boş bir soruya cevap veremez.
- **"Bilmiyorum" derse sen öner.** O ana kadar anlattıklarına uyan bir seçim yap, nedenini bir cümleyle söyle ve devam et. Sonradan değiştirilebileceğini hatırlat.
- **Terim kullanma.** "Hex kodu" deme, "renk kodu (örneğin #1F2A44)" de. Kodu bilmiyorsa rengi tarif etsin ya da logosunu göstersin; kodu sen bul.
- **Göstererek sor.** Renk ve yazı tipi belli olunca önizlemeyi çıkar ve kişiye göster (aşağıda).

## Sorular

1. **Hesabın ne hakkında ve seni kimler izliyor?** Tonu belirler: ciddi mi, samimi mi, eğlenceli mi. (Dosyaya yazılmaz; sonraki önerilerin için.)
2. **Beğendiğin bir Reels var mı?** Bağlantısını ya da ekran görüntüsünü istersin. Altyazı biçimine ve tempoya oradan bakarsın. Birebir kopyalama; yalnızca yönü al.
3. **Marka renklerin neler?** İki renk yeter: bir ana renk (kartların zemini, koyu ya da doygun bir renk) ve bir vurgu rengi (öne çıkan kelime ve çağrı; ana rengin üstünde parlayan bir renk). Rengi yoksa hesabının tonuna uyan iki çift öner.
4. **Yazı tipi.** Kullandığı bir yazı tipi varsa pakette var mı bak (`node araclar/stil.mjs fontlar`). Yoksa hesabın tonuna göre pakettekilerden üçünü öner. Vurgulu kelimeler ve başlıklar için ikinci bir yazı tipi isteyip istemediğini sor (örneğin gövde Poppins, vurgu Playfair Display); istemezse ikisi aynı olur.
5. **Altyazı biçimi.** Üç seçenek:
   - *Tek kelime*: her kelime tek tek, büyük. Hızlı ve enerjik videolar için.
   - *Kısa ifade*: 2–4 kelime bir arada. En yaygını; çoğu hesap için doğru seçim.
   - *Cümle*: iki satıra kadar. Sakin, anlatı ağırlıklı videolar için.
6. **Altyazı zemini.** Kontur (yazının çevresinde ince koyu çizgi; her arka planda okunur), gölge (daha sade) ya da kutu (yazının arkasında renkli zemin).
7. **Tempo.** Sakin (duraklamalar az kısaltılır, doğal konuşma), dengeli ya da hızlı (boşluklar sıkı kesilir). Emin değilse dengeli.
8. **Grafik ne kadar olsun?** Az (yalnızca gerektiğinde), dengeli ya da yoğun.
9. **Kesilmesini istediğin dolgu sözcüğü var mı?** "Şey", "yani", "hani", "aslında" gibi. Bunlar kendiliğinden kesilmez; kişi isterse listeye yazılır.
10. **Videolarını nasıl bitiriyorsun?** Hep kullandığı çağrı cümlesi ("Yorumlara REHBER yaz", "Kaydet, sonra lazım olacak"). Yoksa boş kalır.
11. **Doğru yazılması gereken adlar var mı?** Marka adı, kendi adı, ürün adları, sık andığı araçlar. Döküm bunları yanlış duyabilir.

## Dosyaya yazmak

Yalnızca kişinin seçtiği alanları yaz; yazılmayan alanlar başlangıç değerini alır.

```json
{
  "renkler": { "ana": "#3B1D5E", "vurgu": "#FFB703" },
  "fontlar": { "govde": "Poppins", "vurgu": "Playfair Display" },
  "altyazi": { "bicim": "ifade", "zemin": "kontur", "boyut": "orta", "harf": "normal" },
  "tempo": "dengeli",
  "grafik": "dengeli",
  "cagri": "Yorumlara *REHBER* yaz",
  "ozelAdlar": ["Claude", "Reels"],
  "dolguSozcukler": ["şey"],
  "kurallar": []
}
```

| Alan | Seçenekler |
|---|---|
| `renkler.ana`, `renkler.vurgu` | altı haneli renk kodu |
| `renkler.acik`, `renkler.koyu` | genelde `#FFFFFF` ve `#111111`; dokunma |
| `fontlar.govde`, `fontlar.vurgu` | paketteki yazı tiplerinden biri |
| `altyazi.bicim` | `kelime` · `ifade` · `cumle` |
| `altyazi.zemin` | `kontur` · `golge` · `kutu` |
| `altyazi.boyut` | `kucuk` · `orta` · `buyuk` |
| `altyazi.konum` | `alt` · `orta` |
| `altyazi.harf` | `normal` · `kucuk` (hepsi küçük harf) · `buyuk` (hepsi büyük harf) |
| `altyazi.renk` | altyazının rengi; genelde beyaz |
| `altyazi.aktifKelime` | `true`: söylenen kelime o an vurgu rengine döner |
| `tempo` | `sakin` · `dengeli` · `hizli` |
| `hiz` | `1` olduğu gibi; `1.05` biraz hızlı. Kişi istemedikçe dokunma |
| `grafik` | `az` · `dengeli` · `yogun` |
| `duzeltmeler` | dökümde hep yanlış çıkan kelimeler: `{"Cloud": "Claude"}` |
| `kurallar` | kişinin düz yazıyla söylediği kurallar |

Yazdıktan sonra denetle:

```bash
node araclar/stil.mjs kontrol
```

Sorun çıkarsa düzelt; kişiye teknik ayrıntı anlatma.

## Göster

```bash
node araclar/stil.mjs onizleme
```

Çıkan görsele önce sen bak, sonra kişiye göster: başlık, altyazı, liste kartı, sayı kartı ve çağrı, kişinin kendi renkleri ve yazı tipiyle. Arka plan örnek bir gridir.

Bakarken kontrol et:

- Vurgu rengi ana rengin üstünde okunuyor mu? (Koyu laciverdin üstünde koyu mor okunmaz.)
- Vurgu rengi beyaz altyazının yanında yeterince ayrışıyor mu?
- Yazı tipi kalın ve net mi?

Kişi bir şeyi beğenmezse dosyayı değiştir, önizlemeyi yeniden çıkar. İki üç turda oturur.

## Sonradan

- Kişi kurgu sırasında bir kural söylerse ("bir daha kutulu altyazı kullanma", "videolarımda sayı kartı istemiyorum") hemen `kurallar` listesine yaz; ayarı karşılayan bir alan varsa onu da değiştir. Aynı şeyi ikinci kez söylemek zorunda kalmasın.
- Her videoya başlarken `kurallar` listesini oku ve uy. Stil dosyası ile senin zevkin çelişirse stil dosyası kazanır.
- Yalnızca tek bir videoya özel istekler (örneğin "bu videoda altyazı kutulu olsun") stil dosyasına değil, o videonun klasöründeki `stil-ek.json` dosyasına yazılır.
- Kişi "stilimi değiştirmek istiyorum" derse baştan sorma; neyi değiştirmek istediğini sor, yalnızca onu değiştir ve önizlemeyi göster.
