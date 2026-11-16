# İnceleme sayfası

Kişi render'dan önce her şeyi tek sayfada onaylar: kesimler, altyazı, grafikler ve ses. Sonra önizlemeyi aynı sayfada izler ve beğenmediği ana not bırakır. Hiçbir şey kişi onaylamadan render edilmez.

Sayfa iki yerde açılabilir. İkisi de aynı sayfadır ve aynı zaman hesabını kullanır; sayfada görülen kesim, çıkan videonun aynısıdır.

| | Bu bilgisayarda | claude.ai'de |
|---|---|---|
| Nerede açılır | Yalnızca bu bilgisayarın tarayıcısında | Kişinin claude.ai hesabında; telefondan da açılır |
| Ne gerekir | Hiçbir şey | Bu oturumda `Artifact` ve `ArtifactData` araçları |
| Video nereye gider | Hiçbir yere; bilgisayarda kalır | Küçültülmüş bir kopyası kişinin claude.ai hesabına yüklenir (sayfa gizlidir, yalnızca kişi açabilir) |

**Hangisi?** Kişi telefondan bakmak istiyorsa ve araçlar varsa claude.ai. Araçlar yoksa ya da kişi videosunun bilgisayardan çıkmasını istemiyorsa bu bilgisayarda. Emin değilsen sor; videonun bir kopyasının yükleneceğini açıkça söyle.

`Artifact` araçları bu oturumda yoksa ve kişi tarayıcı da açamıyorsa incelemeyi sohbette yap: `dokum.txt` satırlarını göster, kesilecekleri işaretle, onay iste.

## Sayfadan önce

Şunlar hazır olmalı: `dokum.json`, kesim önerin (`kararlar.json`) ve grafik önerin (`kurgu.json` içinde `kartlar`). Sonra:

```bash
node araclar/inceleme.mjs hazirla "<proje klasörü>"
```

Bu, `<proje>/inceleme/` klasörüne sayfanın verisini, küçültülmüş videoyu (`kaynak.mp4`) ve ses karşılaştırmasını (`ses-once.mp4`, `ses-sonra.mp4`) yazar.

## Bu bilgisayarda açmak

```bash
node araclar/inceleme.mjs sunucu "<proje klasörü>"
```

Komutu arka planda çalıştır ve yazdırdığı adresi kişiye ver (`http://127.0.0.1:4317`). Sayfa yalnızca bu bilgisayardan açılır.

Kişi "incelemeyi bitirdim" dediğinde:

```bash
node araclar/inceleme.mjs aktar "<proje klasörü>"
```

## claude.ai'de açmak

1. **Sayfayı yayımla** (ilk seferde). `Artifact` aracıyla `inceleme/sayfa.html` dosyasını yayımla. Yanında üç dosya gider ve tür olarak `text/javascript` verilir:

   | Yayımlanan ad | Kaynak |
   |---|---|
   | `zaman.js` | `ortak/zaman.mjs` |
   | `altyazi.js` | `ortak/altyazi.mjs` |
   | `kartlar.js` | `ortak/kartlar.mjs` |

   Yetenekler: `{"db": {"rules": [{"path": "inceleme", "read": "admin", "write": "admin"}]}, "assets": {}}`. Bu kural veriyi yalnızca sayfanın sahibine açar.

   Sayfanın adresini `~/Movies/Reels Kurgu/stil.json` dosyasına `incelemeSayfasi` olarak yaz. Sonraki videolarda yeniden yayımlama; aynı adresi kullan ve yalnızca dosyaları ve veriyi yenile.

2. **Dosyaları yükle.** Aynı adrese `asset: true` ile `inceleme/kaynak.mp4`, `ses-once.mp4` ve `ses-sonra.mp4` dosyalarını yükle. Her yükleme `/_blob/…` biçiminde bir adres döndürür.

3. **Belgeleri hazırla ve yaz.**

   ```bash
   node araclar/inceleme.mjs paket "<proje klasörü>" --kaynak /_blob/… --ses-once /_blob/… --ses-sonra /_blob/…
   ```

   Çıkan dosyaları `ArtifactData` ile `inceleme` koleksiyonuna yaz: `veri`, `kararlar` (varsa) ve `taslak` belgeleri, her biri `file_path` ile. Var olan bir belgenin üstüne yazarken önce oku ve `if_version` ver.

4. **Bağlantıyı ver.** Kişiye kısaca anlat: kelimeye dokununca kesilir, yeniden dokununca geri gelir; "Oynat" kesilmiş hâli gösterir; bitince "İncelemeyi bitir".

5. **Kararları al.** Kişi "incelemeyi bitirdim" dediğinde `ArtifactData` ile `inceleme/kararlar` belgesini bir klasöre kaydet (`out_dir`) ve:

   ```bash
   node araclar/inceleme.mjs aktar "<proje klasörü>" "<kaydedilen kararlar.json>"
   ```

6. **Sayfayı tazele.** `aktar` veriyi günceller. `paket` komutunu yeniden çalıştır (adres vermeden; öncekileri korur) ve üç belgeyi yeniden yaz. Açık olan sayfa kendiliğinden tazelenir.

## `aktar` ne yapar, sen ne yaparsın

`aktar` kesim kararlarını, yazım düzeltmelerini ve vurguları `kararlar.json` dosyasına yazar; kişinin çıkardığı grafikleri `kurgu.json` dosyasından siler. Geri kalanını **Yapılacaklar** başlığıyla sana bırakır. Render'dan önce hepsine bak:

- **DEĞİŞİKLİK İSTEĞİ**: kişi bir grafik için not yazmış. Kartı `kurgu.json` içinde ona göre düzelt.
- **KART KELİMESİ KESİLDİ**: kartın bağlı olduğu kelime artık videoda yok. Kartı kalan bir kelimeye bağla ya da çıkar.
- **STİL İSTEĞİ**: kişi altyazı biçimini, zeminini ya da boyutunu değiştirmiş. Sor: yalnızca bu video için mi, bundan sonra hep mi? Yalnızca bu video ise proje klasörüne `stil-ek.json` yaz; hep ise `stil.json` dosyasını güncelle.
- **NOT**: kişi önizlemede bir ana not bırakmış. O saniyenin karesine bak (`kare.mjs --an …`), sorunu düzelt.

Sonra sıra şudur:

```bash
node araclar/kes.mjs "<proje klasörü>"
node araclar/altyazi.mjs "<proje klasörü>" --yeniden
node araclar/kare.mjs "<proje klasörü>"
node araclar/render.mjs "<proje klasörü>" --taslak
node araclar/inceleme.mjs taslak "<proje klasörü>"
```

## Taslağı sayfaya koymak

`inceleme.mjs taslak` önizlemeyi küçültür ve hangi kararlarla alındığını kaydeder.

- **Bu bilgisayarda:** başka bir şey gerekmez. Sayfada "Önizleme" sekmesi birkaç saniye içinde belirir.
- **claude.ai'de:** `inceleme/taslak.mp4` dosyasını `asset: true` ile yükle, sonra `paket … --taslak /_blob/…` çalıştır ve `taslak` belgesini yeniden yaz.

Kişi önizlemeden sonra bir şey değiştirirse sayfa "bu önizleme eski" der. O zaman kararları yeniden aktar ve yeni bir önizleme al. Kişi "tamam" demeden son hâli alma.

## Kişiye söylenecekler

- Sayfada yapılan her şey kendiliğinden kaydedilir; "Geri al" son değişikliği geri getirir.
- Sayfadaki video ham kayıttır. Kesilmiş hâli, kesilen yerlerin üstünden atlayarak oynatılır; altyazı önizlemesi yaklaşık görünümdür, grafikler burada görünmez. Gerçek görüntü "Önizleme" sekmesindedir.
- "Videoya alınmayan çekimler" bölümündeki satırlara dokunulmaz. Kişi onlardan birini videoya almak isterse sana söyler; sen `kararlar.json` içindeki `sira` ve `kes` alanlarını düzeltir, sayfayı yeniden hazırlarsın.
