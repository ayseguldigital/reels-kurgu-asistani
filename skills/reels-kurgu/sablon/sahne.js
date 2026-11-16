// Sahne: kurgu verisinden altyazıları ve grafik kartlarını kurar, hepsini verilen zaman çizelgesine bağlar.
// HyperFrames bu çizelgeyi kare kare ilerletir; burada saat, rastgelelik ya da ağ kullanılmaz.
window.sahneKur = function (K, tl) {
  var EN = 1080;
  var BOY = 1920;
  var renk = K.renkler;

  function el(etiket, sinif, ust) {
    var e = document.createElement(etiket);
    if (sinif) e.className = sinif;
    if (ust) ust.appendChild(e);
    return e;
  }
  function kacis(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  // *yıldız* arasındaki kelimeler vurgu rengine döner.
  function bicimle(s) {
    return kacis(s).replace(/\*([^*]+)\*/g, '<span class="v">$1</span>');
  }
  function duz(s) {
    return String(s).replace(/\*/g, '');
  }
  function sinirla(x, alt, ust) {
    return Math.max(alt, Math.min(ust, x));
  }

  // ---------------------------------------------------------------- Altyazı
  var katman = document.getElementById('altyazi');
  var ayar = K.altyazi || {};
  if (katman && K.altyaziGoster !== false) {
    katman.className = 'konum-' + (ayar.konum || 'alt') + ' zemin-' + (ayar.zemin || 'kontur');
    (K.altyazilar || []).forEach(function (a) {
      var satir = el('div', 'satir', katman);
      satir.style.fontSize = a.boyut + 'px';
      var kelimeler = a.kelimeler.map(function (k, n) {
        var s = el('span', 'kelime' + (k.vurgu ? ' vurgu' : ''), satir);
        s.textContent = k.m;
        if (n < a.kelimeler.length - 1) satir.appendChild(document.createTextNode(' '));
        return s;
      });

      // Görün, hafifçe büyüyerek otur, süresi dolunca kaybol.
      tl.set(satir, { opacity: 1 }, a.bas);
      tl.fromTo(satir, { scale: 0.93 }, { scale: 1, duration: 0.12, ease: 'power2.out' }, a.bas);
      tl.set(satir, { opacity: 0 }, a.bit);

      // Söylenen kelime o an vurgu rengine döner (vurgulu kelimeler zaten o renkte kalır).
      if (ayar.aktifKelime && a.kelimeler.length > 1) {
        a.kelimeler.forEach(function (k, n) {
          if (k.vurgu) return;
          var sonraki = a.kelimeler[n + 1];
          tl.set(kelimeler[n], { color: renk.vurgu }, Math.max(a.bas, k.bas));
          tl.set(kelimeler[n], { color: ayar.renk }, sonraki ? Math.max(k.bit, sonraki.bas) : a.bit);
        });
      }
    });
  }

  // ---------------------------------------------------------------- Konuşmacı
  // Zeminli kartlarda konuşmacı küçülüp alttaki pencereye çekilir, üstte karta yer açılır.
  var yuz = K.yuz || { x: 0.5, y: 0.4 };
  var PENCERE = { x: 150, y: 810, en: 780, boy: 680 };
  var kirpEn = 980;
  var kirpBoy = (kirpEn * PENCERE.boy) / PENCERE.en;
  var merkezX = sinirla(yuz.x * EN, kirpEn / 2, EN - kirpEn / 2);
  var merkezY = sinirla(yuz.y * BOY, kirpBoy / 2, BOY - kirpBoy / 2);
  var sol = merkezX - kirpEn / 2;
  var ust = merkezY - kirpBoy / 2;
  var olcek = PENCERE.en / kirpEn;
  var DAR = {
    clipPath: 'inset(' + ust + 'px ' + (EN - sol - kirpEn) + 'px ' + (BOY - ust - kirpBoy) + 'px ' + sol + 'px round 70px)',
    scale: olcek,
    x: PENCERE.x - olcek * sol,
    y: PENCERE.y - olcek * ust,
  };
  var GENIS = { clipPath: 'inset(0px 0px 0px 0px round 0px)', scale: 1, x: 0, y: 0 };
  var konusmaci = document.getElementById('konusmaci');
  (K.zeminAraliklari || []).forEach(function (aralik) {
    var a = aralik[0];
    var b = aralik[1];
    if (a < 0.2) tl.set(konusmaci, DAR, 0);
    else tl.to(konusmaci, Object.assign({ duration: 0.55, ease: 'power3.inOut' }, DAR), a - 0.15);
    if (b < K.sure - 0.2) tl.to(konusmaci, Object.assign({ duration: 0.5, ease: 'power3.inOut' }, GENIS), b - 0.1);
  });

  // ---------------------------------------------------------------- Kartlar
  var grafik = document.getElementById('grafik');
  function cikis(e, k, sure) {
    if (k.bit >= K.sure - 0.05) return; // video bitene kadar kalan kart çıkış yapmaz
    tl.to(e, { opacity: 0, y: -24, duration: sure || 0.25, ease: 'power2.in' }, Math.max(k.bas + 0.3, k.bit - (sure || 0.25)));
  }
  function yukselerekGir(e, k) {
    tl.fromTo(e, { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: 0.45, ease: 'power3.out' }, k.bas);
  }

  var kurucular = {
    baslik: function (k) {
      var e = el('div', 'kart k-baslik konum-' + (k.konum || 'ust') + (k.zemin ? '' : ' video-ustu'), grafik);
      var ustYazi = null;
      if (k.ustYazi) {
        var sar = el('div', '', e);
        ustYazi = el('span', 'ust-yazi', sar);
        ustYazi.textContent = k.ustYazi;
      }
      var satirlar = String(k.metin).split('/').map(function (s) { return s.trim(); }).filter(Boolean);
      var enUzun = Math.max.apply(null, satirlar.map(function (s) { return duz(s).length; }));
      e.style.fontSize = sinirla(Math.round(860 / (0.56 * enUzun)), 64, 150) + 'px';
      var icler = satirlar.map(function (s) {
        var ic = el('span', 'b-ic', el('span', 'b-satir', e));
        ic.innerHTML = bicimle(s);
        return ic;
      });
      tl.set(e, { opacity: 1 }, k.bas);
      if (ustYazi) tl.fromTo(ustYazi, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' }, k.bas);
      icler.forEach(function (ic, n) {
        tl.fromTo(ic, { yPercent: 118 }, { yPercent: 0, duration: 0.5, ease: 'power3.out' }, k.bas + (ustYazi ? 0.1 : 0) + n * 0.09);
      });
      cikis(e, k);
    },

    etiket: function (k) {
      var konum = k.konum || 'ust-sol';
      var e = el('div', 'kart k-etiket golgeli konum-' + konum, grafik);
      el('span', 'nokta', e);
      el('span', '', e).innerHTML = bicimle(k.metin);
      if (konum === 'ust') gsap.set(e, { xPercent: -50 });
      tl.fromTo(e, { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1, duration: 0.4, ease: 'back.out(1.8)' }, k.bas);
      cikis(e, k, 0.2);
    },

    liste: function (k) {
      var e = el('div', 'kart k-liste golgeli', grafik);
      if (k.baslik) el('div', 'l-baslik', e).innerHTML = bicimle(k.baslik);
      var satirlar = k.maddeler.map(function (m, n) {
        var satir = el('div', 'l-madde', e);
        if (k.numara !== false) el('span', 'l-no', satir).textContent = String(n + 1);
        el('span', '', satir).innerHTML = bicimle(m.metin);
        return satir;
      });
      yukselerekGir(e, k);
      satirlar.forEach(function (satir, n) {
        tl.fromTo(satir, { opacity: 0, x: -28 }, { opacity: 1, x: 0, duration: 0.35, ease: 'power2.out' }, k.maddeler[n].an);
      });
      cikis(e, k);
    },

    sayi: function (k) {
      var e = el('div', 'kart k-sayi konum-' + (k.konum || 'ust') + (k.zemin ? ' zeminde' : ' golgeli'), grafik);
      gsap.set(e, { xPercent: -50 });
      var deger = el('div', 's-deger', e);
      if (k.aciklama) el('div', 's-aciklama', e).innerHTML = bicimle(k.aciklama);
      var ondalik = k.ondalik || 0;
      var sayac = { v: Number(k.baslangic) || 0 };
      function yaz() {
        deger.textContent =
          (k.onEk || '') + sayac.v.toLocaleString('tr-TR', { minimumFractionDigits: ondalik, maximumFractionDigits: ondalik }) + (k.sonEk || '');
      }
      yaz();
      yukselerekGir(e, k);
      tl.to(sayac, { v: Number(k.deger), duration: sinirla((k.bit - k.bas) * 0.5, 0.5, 1.5), ease: 'power2.out', onUpdate: yaz }, k.bas + 0.1);
      cikis(e, k);
    },

    cagri: function (k) {
      var e = el('div', 'kart k-cagri golgeli konum-' + (k.konum || 'alt'), grafik);
      e.innerHTML = bicimle(k.metin);
      gsap.set(e, { xPercent: -50 });
      tl.fromTo(e, { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1, duration: 0.45, ease: 'back.out(1.7)' }, k.bas);
      var tur = Math.floor((k.bit - k.bas - 0.7) / 1.1);
      if (tur >= 1) tl.to(e, { scale: 1.05, duration: 0.55, ease: 'sine.inOut', yoyo: true, repeat: tur * 2 - 1 }, k.bas + 0.6);
      cikis(e, k, 0.2);
    },

    gorsel: function (k) {
      var e = el('div', 'kart k-gorsel', grafik);
      var n = Math.min(3, k.dosyalar.length);
      var egim = [[-2], [-5, 4], [-7, 0, 7]][n - 1];
      var kayma = [[0], [-195, 195], [-275, 0, 275]][n - 1];
      var enCokEn = [760, 440, 340][n - 1];
      tl.set(e, { opacity: 1 }, k.bas);
      k.dosyalar.slice(0, n).forEach(function (dosya, i) {
        var g = el('img', 'golgeli', e);
        g.src = dosya;
        g.style.maxWidth = enCokEn + 'px';
        gsap.set(g, { xPercent: -50, yPercent: -50, x: kayma[i], rotation: egim[i] });
        tl.fromTo(g, { opacity: 0, scale: 0.7 }, { opacity: 1, scale: 1, duration: 0.45, ease: 'back.out(1.4)' }, k.bas + i * 0.12);
      });
      cikis(e, k);
    },

    site: function (k) {
      var e = el('div', 'kart k-site golgeli', grafik);
      var cubuk = el('div', 'cubuk', e);
      el('i', '', cubuk);
      el('i', '', cubuk);
      el('i', '', cubuk);
      el('div', 'adres', cubuk).textContent = k.adres || '';
      el('img', '', e).src = k.dosya;
      yukselerekGir(e, k);
      cikis(e, k);
    },

    karsilastirma: function (k) {
      var e = el('div', 'kart k-karsilastirma', grafik);
      var CARPI = '<svg viewBox="0 0 36 36" fill="none" stroke="currentColor" stroke-width="4.5" stroke-linecap="round"><path d="M9 9l18 18M27 9L9 27"/></svg>';
      var TIK = '<svg viewBox="0 0 36 36" fill="none" stroke="currentColor" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"><path d="M7 19l8 8 14-17"/></svg>';
      function sutun(veri, sinif, ikon) {
        var s = el('div', 'sutun golgeli ' + sinif, e);
        if (veri.baslik) el('div', 's-baslik', s).innerHTML = bicimle(veri.baslik);
        (veri.maddeler || []).forEach(function (m) {
          var satir = el('div', 's-madde', s);
          satir.innerHTML = ikon + '<span>' + bicimle(m) + '</span>';
        });
        return s;
      }
      var solSutun = sutun(k.sol, 'sol', CARPI);
      var sagSutun = sutun(k.sag, 'sag', TIK);
      tl.set(e, { opacity: 1 }, k.bas);
      tl.fromTo(solSutun, { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: 0.45, ease: 'power3.out' }, k.bas);
      tl.fromTo(sagSutun, { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: 0.45, ease: 'power3.out' }, k.bas + Math.min(0.9, (k.bit - k.bas) * 0.3));
      cikis(e, k);
    },

    lottie: function (k) {
      var kutuphane = window.__lottieKutuphanesi;
      if (!kutuphane || !k.veri) return;
      var konum = k.konum || 'ust';
      var boyut = k.boyut || 420;
      var e = el('div', 'kart k-lottie konum-' + konum, grafik);
      e.style.width = boyut + 'px';
      e.style.height = boyut + 'px';
      if (konum === 'ust' || konum === 'orta') {
        e.style.left = '540px';
        gsap.set(e, { xPercent: -50 });
      }
      var anim = kutuphane.loadAnimation({ container: e, renderer: 'svg', loop: false, autoplay: false, animationData: k.veri });
      var toplam = k.kareSayisi;
      var sure = k.bit - k.bas;
      var ilerleme = { t: 0 };
      function kareyeGit() {
        var kare = ilerleme.t * k.kareHizi;
        anim.goToAndStop(k.dongu ? kare % toplam : Math.min(toplam - 1, kare), true);
      }
      anim.goToAndStop(0, true);
      tl.fromTo(e, { opacity: 0 }, { opacity: 1, duration: 0.15 }, k.bas);
      tl.to(ilerleme, { t: sure, duration: sure, ease: 'none', onUpdate: kareyeGit }, k.bas);
      cikis(e, k, 0.2);
    },

    yakinlas: function (k) {
      var yakin = document.getElementById('yakin');
      gsap.set(yakin, { transformOrigin: yuz.x * 100 + '% ' + yuz.y * 100 + '%' });
      tl.to(yakin, { scale: k.oran || 1.12, duration: 0.3, ease: 'power2.out' }, k.bas);
      tl.to(yakin, { scale: 1, duration: 0.4, ease: 'power2.inOut' }, Math.max(k.bas + 0.3, k.bit - 0.4));
    },
  };

  (K.kartlar || []).forEach(function (k) {
    if (kurucular[k.tur]) kurucular[k.tur](k);
  });

  // Çizelgenin süresi videonun süresine eşit olsun.
  tl.set({}, {}, K.sure);
  return tl;
};
