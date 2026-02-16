// Tema değiştirme fonksiyonu (sadece class değiştirir, localStorage yok)
function toggleTheme() {
  document.body.classList.toggle("light");
  document.body.classList.toggle("dark");
}

// Sayfa tam yüklendiğinde bile dark modu garantiye al (ama zaten yukarıdaki script halleder)
window.addEventListener('load', function() {
  // Eğer hala light varsa düzelt (opsiyonel)
  if (!document.body.classList.contains('dark')) {
    document.body.classList.add('dark');
    document.body.classList.remove('light');
  }
});

// İsteğe bağlı: input scroll engelleme
document.addEventListener("wheel", function (e) {
  if (document.activeElement.type === "number") {
    document.activeElement.blur();
  }
}, { passive: false });