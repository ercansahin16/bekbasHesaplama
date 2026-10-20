// ---------- Ortak yardımcılar ----------
const fmt = (n, d = 2) =>
  new Intl.NumberFormat('tr-TR', { minimumFractionDigits: d, maximumFractionDigits: d }).format(n);
const tl = n => fmt(n) + ' ₺';
const DASH = '—';
const today = () => { const d = new Date(); return new Date(d - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10); };

// ---------- Hesaplamalar ----------
// Her fonksiyon girilen değerleri alır, [etiket, değer, ana?] satırları döner.
const CALC = {
  // ÇALIŞ 1: Stok bazlı ortalama fiyat
  ortalama(v) {
    const kg = v.depoKg + v.gelenKg;
    const ok = kg > 0 && [v.depoKg, v.depoFiyat, v.gelenKg, v.gelenFiyat].every(x => x !== null);
    return [
      ['Toplam Miktar', ok ? fmt(kg) + ' kg' : DASH],
      ['Ortalama Fiyat', ok ? tl((v.depoKg * v.depoFiyat + v.gelenKg * v.gelenFiyat) / kg) + '/kg' : DASH, true],
    ];
  },

  // ÇALIŞ 2: KG'dan adet
  kgAdet(v) {
    const ok = v.gram > 0 && v.toplamKg !== null && v.fiyat !== null;
    const haric = ok ? v.fiyat * (v.gram / 1000) : 0;
    return [
      ['Toplam Adet', ok ? fmt(Math.round((v.toplamKg * 1000) / v.gram), 0) + ' adet' : DASH],
      ['Adet Fiyatı (KDV Hariç)', ok ? tl(haric) : DASH],
      ['Adet Fiyatı (KDV Dahil)', ok ? tl(haric * (1 + (v.kdv || 0) / 100)) : DASH, true],
    ];
  },

  // ÇALIŞ 3: Adet'ten kg
  adetKg(v) {
    const ok = v.gram > 0 && v.adet !== null && v.fiyat !== null;
    const haric = ok ? v.fiyat / (v.gram / 1000) : 0;
    return [
      ['Toplam Miktar', ok ? fmt((v.adet * v.gram) / 1000) + ' kg' : DASH],
      ['KG Fiyatı (KDV Hariç)', ok ? tl(haric) : DASH],
      ['KG Fiyatı (KDV Dahil)', ok ? tl(haric * (1 + (v.kdv || 0) / 100)) : DASH, true],
    ];
  },

  // ÇALIŞ 4: Ağırlık bazlı ortalama
  agirlikli(v) {
    const kg = v.kg1 + v.kg2;
    const ok = kg > 0 && [v.kg1, v.fiyat1, v.kg2, v.fiyat2].every(x => x !== null);
    return [
      ['Toplam Miktar', ok ? fmt(kg) + ' kg' : DASH],
      ['Ağırlıklı Ortalama', ok ? tl((v.kg1 * v.fiyat1 + v.kg2 * v.fiyat2) / kg) + '/kg' : DASH, true],
    ];
  },

  // ÇALIŞ 6: İki tarih arası gün
  gun(v) {
    const ok = v.bas !== null && v.bit !== null;
    if (!ok) return [['Toplam Gün', DASH, true], ['Hafta + Gün', DASH], ['İş Günü (Pzt–Cum)', DASH], ['Yıl / Ay / Gün', DASH]];
    const DAY = 86400000;
    let a = v.bas, b = v.bit;
    const gun = Math.round((b - a) / DAY);
    if (a > b) [a, b] = [b, a];
    // iş günü: iki tarih dahil, cumartesi-pazar hariç
    let is = 0;
    for (let t = a; t <= b; t += DAY) { const g = new Date(t).getUTCDay(); if (g !== 0 && g !== 6) is++; }
    // yıl/ay/gün
    const d1 = new Date(a), d2 = new Date(b);
    let y = d2.getUTCFullYear() - d1.getUTCFullYear(), m = d2.getUTCMonth() - d1.getUTCMonth(), d = d2.getUTCDate() - d1.getUTCDate();
    if (d < 0) { m--; d += new Date(Date.UTC(d2.getUTCFullYear(), d2.getUTCMonth(), 0)).getUTCDate(); }
    if (m < 0) { y--; m += 12; }
    const n = Math.abs(gun);
    return [
      ['Toplam Gün', fmt(gun, 0) + ' gün', true],
      ['Hafta + Gün', `${Math.floor(n / 7)} hafta ${n % 7} gün`],
      ['İş Günü (Pzt–Cum)', fmt(is, 0) + ' gün'],
      ['Yıl / Ay / Gün', `${y} yıl ${m} ay ${d} gün`],
    ];
  },

  // ÇALIŞ 5: Kademeli iskonto + KDV (önce iskontolar düşer, kalan tutara KDV eklenir)
  iskonto(v) {
    let net = v.tutar || 0;
    ['i1', 'i2', 'i3', 'i4'].forEach(k => { net *= 1 - (v[k] || 0) / 100; });
    return [['Net Toplam', tl(net * (1 + (v.kdv || 0) / 100)), true]];
  },
};

// ---------- Kart bağlama ----------
function readValues(card) {
  const v = {};
  card.querySelectorAll('input[data-key]').forEach(i => {
    if (i.type === 'date') { v[i.dataset.key] = i.value ? Date.parse(i.value + 'T00:00:00Z') : null; return; }
    const n = parseFloat(i.value.replace(',', '.'));
    v[i.dataset.key] = isNaN(n) ? null : n;
  });
  return v;
}

function render(card) {
  const fn = CALC[card.dataset.calc];
  const out = card.querySelector('.result');
  if (!fn || !out) return;
  out.innerHTML = fn(readValues(card))
    .map(([label, val, main]) =>
      `<div class="result-row${main ? ' main' : ''}"><span>${label}</span><b>${val}</b></div>`)
    .join('');
}

function resetCard(card) {
  card.querySelectorAll('input[data-key]').forEach(i => { i.value = i.dataset.default === 'today' ? today() : (i.dataset.default ?? ''); });
  render(card);
  const first = card.querySelector('input[data-key]');
  if (first) first.focus();
}

function initCards() {
  document.querySelectorAll('input[data-default="today"]').forEach(i => { if (!i.value) i.value = today(); });
  document.querySelectorAll('.card[data-calc]').forEach(card => {
    const inputs = [...card.querySelectorAll('input[data-key]')];
    inputs.forEach((input, idx) => {
      input.addEventListener('input', () => render(card));
      input.addEventListener('change', () => render(card));
      // Enter ile kart içinde bir sonraki alana geç
      input.addEventListener('keydown', e => {
        if (e.key !== 'Enter') return;
        e.preventDefault();
        const next = inputs[(idx + 1) % inputs.length];
        next.focus();
        next.select();
      });
    });
    card.querySelector('.reset')?.addEventListener('click', () => resetCard(card));
    card.querySelector('.info')?.addEventListener('click', () => card.classList.toggle('show-desc'));
    render(card);
  });
}

// ---------- Arama ----------
// Türkçe karakterleri sadeleştirir: "Tarih Arası" -> "tarih arasi"
const norm = t => t.toLocaleLowerCase('tr-TR')
  .replace(/ı/g, 'i').replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's').replace(/ö/g, 'o').replace(/ç/g, 'c')
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '');

function initSearch() {
  const box = document.getElementById('search');
  if (!box) return;
  const cards = [...document.querySelectorAll('.grid .card')];
  const empty = document.getElementById('noResult');
  // Her kartın aranabilir metni: başlık + açıklama + anahtar kelimeler + etiketler
  cards.forEach(c => {
    c._text = norm([
      c.querySelector('.card-kicker')?.textContent, c.querySelector('.card-title')?.textContent,
      c.querySelector('.desc')?.textContent, c.dataset.tags,
      ...[...c.querySelectorAll('label')].map(l => l.textContent),
    ].join(' '));
  });
  const run = () => {
    const words = norm(box.value).split(/\s+/).filter(Boolean);
    let shown = 0;
    cards.forEach(c => {
      const hit = words.every(w => c._text.includes(w));
      c.hidden = !hit;
      if (hit) shown++;
    });
    if (empty) empty.hidden = shown > 0;
  };
  const clear = document.getElementById('searchClear');
  const sync = () => { if (clear) clear.hidden = !box.value; };
  box.addEventListener('input', () => { run(); sync(); });
  box.addEventListener('search', () => { run(); sync(); });
  clear?.addEventListener('click', () => { box.value = ''; run(); sync(); box.focus(); });
  box.addEventListener('keydown', e => {
    if (e.key === 'Escape') { box.value = ''; run(); sync(); }
    if (e.key === 'Enter') { // ilk bulunan tablonun ilk alanına geç
      const first = cards.find(c => !c.hidden)?.querySelector('input[data-key]');
      if (first) { e.preventDefault(); first.focus(); first.select?.(); }
    }
  });
  // "/" tuşu ile aramaya git
  document.addEventListener('keydown', e => {
    if (e.key === '/' && document.activeElement.tagName !== 'INPUT') { e.preventDefault(); box.focus(); }
  });
}

// ---------- Tema ----------
function applyTheme(t) {
  document.documentElement.classList.remove('pre-dark');
  document.body.classList.toggle('dark', t === 'dark');
}
function toggleTheme() {
  const t = document.body.classList.contains('dark') ? 'light' : 'dark';
  applyTheme(t);
  try { localStorage.setItem('bekbas-theme', t); } catch (e) {}
}

document.addEventListener('DOMContentLoaded', () => {
  try { applyTheme(localStorage.getItem('bekbas-theme') || 'light'); } catch (e) {}
  initCards();
  initSearch();
});

// Fare tekerleği number input değerini değiştirmesin
document.addEventListener('wheel', () => {
  if (document.activeElement && document.activeElement.type === 'number') document.activeElement.blur();
}, { passive: true });
