// Tema değiştirme fonksiyonu (sadece class değiştirir, localStorage yok)
function toggleTheme() {
  document.body.classList.toggle("light");
  document.body.classList.toggle("dark");
}

// Sayfa tam yüklendiğinde dark modu garantiye al (opsiyonel, ama zaten body'de class var)
window.addEventListener('load', function() {
  // Eğer bir şekilde light eklenmişse düzelt
  if (!document.body.classList.contains('dark')) {
    document.body.classList.add('dark');
    document.body.classList.remove('light');
  }
});

// input scroll engelleme
document.addEventListener("wheel", function (e) {
  if (document.activeElement.type === "number") {
    document.activeElement.blur();
  }
}, { passive: false });