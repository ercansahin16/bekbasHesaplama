// ---------- Ortak yardımcılar ----------
const fmt = (n, d = 2) =>
  new Intl.NumberFormat('tr-TR', { minimumFractionDigits: d, maximumFractionDigits: d }).format(n);
const tl = n => fmt(n) + ' ₺';
const DASH = '—';

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
  card.querySelectorAll('input[data-key]').forEach(i => { i.value = i.dataset.default ?? ''; });
  render(card);
  const first = card.querySelector('input[data-key]');
  if (first) first.focus();
}

function initCards() {
  document.querySelectorAll('.card[data-calc]').forEach(card => {
    const inputs = [...card.querySelectorAll('input[data-key]')];
    inputs.forEach((input, idx) => {
      input.addEventListener('input', () => render(card));
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
});

// Fare tekerleği number input değerini değiştirmesin
document.addEventListener('wheel', () => {
  if (document.activeElement && document.activeElement.type === 'number') document.activeElement.blur();
}, { passive: true });
