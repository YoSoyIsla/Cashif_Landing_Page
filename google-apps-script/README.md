# Bekleme listesi → Google E-Tablolar

Landing sayfasındaki bekleme listesi formu, e-postaları bir Google E-Tablo'ya yazan
ücretsiz bir Google Apps Script web uygulamasına gönderir.

## Kurulum (bir kez, ~5 dakika)

1. cashif Google hesabıyla [sheets.new](https://sheets.new) adresinden yeni bir tablo aç, adını "cashif bekleme listesi" yap.
2. Menüden **Uzantılar → Apps Script**'i aç.
3. Açılan editördeki kodu silip `bekleme-listesi.gs` dosyasının içeriğini yapıştır, kaydet.
4. Sağ üstten **Dağıt → Yeni dağıtım**:
   - Tür: **Web uygulaması**
   - Şu kullanıcı olarak çalıştır: **Ben**
   - Erişimi olanlar: **Herkes**
5. **Dağıt**'a bas, istenen izinleri ver ve verilen **Web uygulaması URL'sini** kopyala
   (`https://script.google.com/macros/s/.../exec` biçiminde).
6. `index.html` içindeki bekleme listesi formunun `action=""` değerine bu URL'yi yaz,
   ardından `npm run build` çalıştır.

Kayıtlar tablodaki **Bekleme listesi** sayfasına `Tarih | E-posta | Açık rıza` olarak düşer.
Aynı e-posta ikinci kez gelirse yeni satır açılmaz.

## Notlar

- Script'i değiştirirsen **Dağıt → Dağıtımları yönet → Düzenle → Yeni sürüm** ile yeniden yayınla; URL aynı kalır.
- Tabloyu kimseyle paylaşma: içinde kişisel veri (e-posta adresleri) var.
- Listeden çıkmak isteyen olursa satırını silmen yeterli.
