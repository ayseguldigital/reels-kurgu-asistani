#!/bin/bash
# Reels Kurgu Asistanı · kurulum
#
#   bash kur.sh            asistanı kurar ya da günceller, eksik araçları tamamlar
#   bash kur.sh --kontrol  hiçbir şey kurmaz, yalnızca neyin eksik olduğunu söyler
#
# Yaptıkları:
#   1. Node.js yoksa ya da eskiyse Homebrew ile kurar (22 ve üstü gerekir).
#   2. Asistanı Claude'un göreceği yere kopyalar: ~/.claude/skills/reels-kurgu
#   3. Kalan araçları (FFmpeg, Whisper, döküm modeli, HyperFrames) kurar ve kontrol eder.
#
# Homebrew'u bu betik kurmaz: kurulumu parola ister ve onu yalnızca siz girmelisiniz. Adımı KURULUM.md anlatır
# (Apple çipli Mac'te çift tıklanan bir kurulum dosyası, Terminal gerekmez).

set -u
KONTROL=0
[ "${1:-}" = "--kontrol" ] && KONTROL=1
BURASI="$(cd "$(dirname "$0")" && pwd)"
HEDEF="$HOME/.claude/skills/reels-kurgu"
export PATH="$PATH:/opt/homebrew/bin:/usr/local/bin"

echo
echo "Reels Kurgu Asistanı · kurulum"
echo

if [ "$(uname)" != "Darwin" ]; then
  echo "  ! Bu kurulum Mac'te denendi. Windows ve Linux'ta denenmedi; bazı adımlar çalışmayabilir."
fi

node_surumu() { node -v 2>/dev/null | sed 's/^v//' | cut -d. -f1; }
node_tamam() { command -v node >/dev/null 2>&1 && [ "$(node_surumu)" -ge 22 ] 2>/dev/null; }

# 1. Node.js
if node_tamam; then
  echo "  ✓ Node.js $(node -v)"
elif [ $KONTROL -eq 1 ]; then
  echo "  ✗ Node.js yok ya da eski (22 ve üstü gerekir)"
  echo
  echo "Kurmak için: bash kur.sh"
  exit 1
elif command -v brew >/dev/null 2>&1; then
  echo "  … Node.js kuruluyor (birkaç dakika sürebilir)"
  brew install node >/dev/null 2>&1 || brew upgrade node >/dev/null 2>&1
  if node_tamam; then
    echo "  ✓ Node.js $(node -v) kuruldu"
  else
    echo "  ✗ Node.js kurulamadı. Terminale 'brew install node' yazıp çıkan hatayı okuyun."
    exit 1
  fi
else
  echo "  ✗ Homebrew kurulu değil. Önce KURULUM.md dosyasındaki 'Homebrew' adımını yapın, sonra bu betiği yeniden çalıştırın."
  exit 1
fi

# 2. Asistanı Claude'un göreceği yere kopyala
if [ $KONTROL -eq 0 ]; then
  if [ ! -f "$BURASI/skills/reels-kurgu/SKILL.md" ]; then
    echo "  ✗ skills/reels-kurgu klasörü bulunamadı. Depoyu eksiksiz indirdiğinizden emin olun."
    exit 1
  fi
  mkdir -p "$HEDEF"
  # Eski sürümden kalan dosyalar da silinsin diye klasör eşitlenir. Kişinin videoları ve stil dosyası burada durmaz.
  rsync -a --delete "$BURASI/skills/reels-kurgu/" "$HEDEF/"
  echo "  ✓ Asistan kuruldu: $HEDEF"
elif [ -f "$HEDEF/SKILL.md" ]; then
  echo "  ✓ Asistan kurulu: $HEDEF"
else
  echo "  ✗ Asistan kurulu değil"
  echo
  echo "Kurmak için: bash kur.sh"
  exit 1
fi

# 3. Kalan araçlar
if [ $KONTROL -eq 1 ]; then
  node "$HEDEF/araclar/kontrol.mjs"
else
  node "$HEDEF/araclar/kontrol.mjs" --kur
fi
SONUC=$?
if [ $SONUC -eq 0 ] && [ $KONTROL -eq 0 ]; then
  echo "Kurulum tamam. Claude'u yeniden başlatın, sonra bir video verip şunu yazın: bunu Reels yap"
  echo
fi
exit $SONUC
