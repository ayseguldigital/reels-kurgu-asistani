// Sahne: kurgu verisinden altyazıları kurar ve hepsini verilen zaman çizelgesine bağlar.
// HyperFrames bu çizelgeyi kare kare ilerletir; burada saat, rastgelelik ya da ağ kullanılmaz.
window.sahneKur = function (K, tl) {

  // --- Altyazı ---
  var katman = document.getElementById('altyazi');
  var ayar = K.altyazi || {};
  if (katman && K.altyaziGoster !== false) {
    katman.className = 'konum-' + (ayar.konum || 'alt') + ' zemin-' + (ayar.zemin || 'kontur');
    (K.altyazilar || []).forEach(function (a) {
      var satir = document.createElement('div');
      satir.className = 'satir';
      satir.style.fontSize = a.boyut + 'px';
      var kelimeler = a.kelimeler.map(function (k, n) {
        var s = document.createElement('span');
        s.className = 'kelime' + (k.vurgu ? ' vurgu' : '');
        s.textContent = k.m;
        satir.appendChild(s);
        if (n < a.kelimeler.length - 1) satir.appendChild(document.createTextNode(' '));
        return s;
      });
      katman.appendChild(satir);

      // Görün, hafifçe büyüyerek otur, süresi dolunca kaybol.
      tl.set(satir, { opacity: 1 }, a.bas);
      tl.fromTo(satir, { scale: 0.93 }, { scale: 1, duration: 0.12, ease: 'power2.out' }, a.bas);
      tl.set(satir, { opacity: 0 }, a.bit);

      // Söylenen kelime o an vurgu rengine döner (vurgulu kelimeler zaten o renkte kalır).
      if (ayar.aktifKelime && a.kelimeler.length > 1) {
        a.kelimeler.forEach(function (k, n) {
          if (k.vurgu) return;
          var sonraki = a.kelimeler[n + 1];
          tl.set(kelimeler[n], { color: K.renkler.vurgu }, Math.max(a.bas, k.bas));
          tl.set(kelimeler[n], { color: ayar.renk }, sonraki ? Math.max(k.bit, sonraki.bas) : a.bit);
        });
      }
    });
  }

  // Çizelgenin süresi videonun süresine eşit olsun.
  tl.set({}, {}, K.sure);
  return tl;
};
