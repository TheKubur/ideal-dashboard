// ====== FİYAT & ZAM (KURUM FİYAT LİSTESİ + YIL BAŞI ZAM TAKİBİ) ======
// Firestore koleksiyonu: priceBook  (kurumsal / cari: kurum başına doküman, bireysel: ürün başına doküman)
let allPriceBook = [];
let pbUnsub = null;
let pbGroup = 'kurumsal';
let pbOpen = new Set();
let pbEditId = null;

const PB_STATUSES = ['Bekliyor', 'Bildirildi', 'Görüşülüyor', 'Onaylandı', 'İtiraz / Pazarlık'];
const PB_STATUS_COLORS = {
  'Bekliyor': '#94a3b8',
  'Bildirildi': '#457b9d',
  'Görüşülüyor': '#f59e0b',
  'Onaylandı': '#16a34a',
  'İtiraz / Pazarlık': '#e63946'
};
const PB_GROUP_LABELS = { kurumsal: 'Kurumsal', cari: 'Cari Müşteriler', bireysel: 'Bireysel' };

function pbEsc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function pbMoney(n) {
  if (n === null || n === undefined || n === '' || isNaN(n)) return '<span style="color:var(--ink3)">—</span>';
  return Number(n).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function pbMoneyPlain(n) {
  return Number(n || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ₺';
}
function pbPct(rate) {
  if (rate === null || rate === undefined || isNaN(rate)) return '—';
  return '%' + (Math.round(rate * 1000) / 10).toLocaleString('tr-TR');
}
function pbCanEdit() { return !currentUser || currentUser.role !== 'viewer'; }
function pbIsAdmin() { return !!currentUser && currentUser.role === 'admin'; }

function listenToPriceBook() {
  if (pbUnsub || typeof db === 'undefined') return;
  pbUnsub = db.collection('priceBook').onSnapshot(snap => {
    allPriceBook = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    const tab = document.getElementById('tab-fiyat');
    if (tab && tab.classList.contains('active')) renderPriceBook();
  }, err => {
    console.error('PriceBook listener error:', err);
    showToast('Fiyat listesi okunamadı: ' + err.message, 'error');
  });
  if (typeof globalUnsubscribeFns !== 'undefined') globalUnsubscribeFns.push(pbUnsub);
}

function pbItemSum(k, year) {
  return (k.items || []).reduce((s, i) => s + (Number(i['p' + year]) || 0), 0);
}

function pbGroupList() {
  const search = (document.getElementById('pbSearch')?.value || '').trim().toLowerCase();
  const status = document.getElementById('pbStatusFilter')?.value || 'all';
  return allPriceBook
    .filter(k => (k.group || 'kurumsal') === pbGroup)
    .filter(k => {
      if (status !== 'all' && pbGroup !== 'bireysel' && (k.status || 'Bekliyor') !== status) return false;
      if (!search) return true;
      const hay = `${k.name || ''} ${k.note || ''} ${(k.items || []).map(i => i.name).join(' ')}`.toLowerCase();
      return hay.includes(search);
    })
    .sort((a, b) => pbGroup === 'bireysel'
      ? (a.order ?? 0) - (b.order ?? 0)
      : (a.name || '').localeCompare(b.name || '', 'tr'));
}

function renderPriceBook() {
  listenToPriceBook();
  const root = document.getElementById('pb-root');
  if (!root) return;

  // arama kutusu odağını koru
  const hadFocus = document.activeElement && document.activeElement.id === 'pbSearch';
  const searchVal = document.getElementById('pbSearch')?.value || '';
  const statusVal = document.getElementById('pbStatusFilter')?.value || 'all';

  const canEdit = pbCanEdit();
  const isAdmin = pbIsAdmin();
  const corpAll = allPriceBook.filter(k => (k.group || 'kurumsal') !== 'bireysel');

  if (!allPriceBook.length) {
    root.innerHTML = `
      <div style="font-size:1.6rem; font-weight:800; background:linear-gradient(135deg,#e63946,#8b5cf6); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; margin-bottom:1.5rem;">Fiyat & Zam</div>
      <div style="background:var(--surface); border:1px solid var(--border); border-radius:20px; padding:3rem; text-align:center; box-shadow:var(--shadow);">
        <div style="font-size:1.05rem; font-weight:700; color:var(--ink); margin-bottom:0.5rem;">Fiyat listesi henüz boş</div>
        <div style="color:var(--ink3); font-size:0.88rem; margin-bottom:1.5rem;">2027 Zamlı Fiyatlar Excel'indeki kurumsal, cari ve bireysel fiyatlar tek tıkla buraya yüklenir.</div>
        ${isAdmin
          ? `<button class="modal-save" style="padding:0.85rem 1.6rem; width:auto;" onclick="importPriceSeed()">Excel Verisini Yükle</button>`
          : `<div style="color:var(--ink3); font-size:0.85rem;">Yükleme için yönetici girişi gerekli.</div>`}
      </div>`;
    return;
  }

  const list = pbGroupList();
  const tot26 = corpAll.reduce((s, k) => s + pbItemSum(k, 2026), 0);
  const tot27 = corpAll.reduce((s, k) => s + pbItemSum(k, 2027), 0);
  const diff = tot26 ? (tot27 / tot26 - 1) : 0;
  const statusCounts = {};
  corpAll.forEach(k => { const s = k.status || 'Bekliyor'; statusCounts[s] = (statusCounts[s] || 0) + 1; });
  const done = statusCounts['Onaylandı'] || 0;

  const kpi = (label, value, color, sub) => `
    <div style="flex:1; min-width:190px; background:var(--surface); border:1px solid var(--border); border-left:4px solid ${color}; border-radius:14px; padding:1rem 1.25rem; box-shadow:var(--shadow);">
      <div style="font-size:0.7rem; font-weight:700; letter-spacing:0.06em; text-transform:uppercase; color:var(--ink3);">${label}</div>
      <div style="font-size:1.3rem; font-weight:800; color:var(--ink); margin-top:0.3rem;">${value}</div>
      ${sub ? `<div style="font-size:0.72rem; color:var(--ink3); margin-top:0.15rem;">${sub}</div>` : ''}
    </div>`;

  const groupBtn = (g) => {
    const active = pbGroup === g;
    const cnt = allPriceBook.filter(k => (k.group || 'kurumsal') === g).length;
    return `<button type="button" onclick="pbSetGroup('${g}')" style="padding:0.5rem 1.1rem; border-radius:10px; border:1px solid ${active ? 'transparent' : 'var(--border)'}; background:${active ? 'linear-gradient(135deg,#e63946,#8b5cf6)' : 'var(--surface)'}; color:${active ? '#fff' : 'var(--ink2)'}; font-weight:700; font-size:0.85rem; cursor:pointer;">${PB_GROUP_LABELS[g]} <span style="opacity:0.8; font-weight:600;">(${cnt})</span></button>`;
  };

  let body = '';
  if (pbGroup === 'bireysel') body = pbRenderRetail(list, canEdit, isAdmin);
  else body = pbRenderCorp(list, canEdit, isAdmin);

  root.innerHTML = `
    <div style="display:flex; align-items:flex-start; justify-content:space-between; flex-wrap:wrap; gap:1rem; margin-bottom:1.5rem;">
      <div>
        <div style="font-size:1.6rem; font-weight:800; background:linear-gradient(135deg,#e63946,#8b5cf6); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;">Fiyat & Zam</div>
        <div style="color:var(--ink3); font-size:0.85rem; margin-top:0.2rem;">Kurum bazlı ürün fiyatları ve yıl başı zam takibi</div>
      </div>
      <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
        ${canEdit ? `<button class="add-activity-btn" style="width:auto; padding:0.55rem 1rem;" onclick="pbOpenModal(null)">+ ${pbGroup === 'bireysel' ? 'Ürün' : 'Kurum'} Ekle</button>` : ''}
        ${isAdmin && pbGroup !== 'bireysel' ? `<button class="add-activity-btn" style="width:auto; padding:0.55rem 1rem;" onclick="pbBulkRate()">Toplu Zam Oranı</button>` : ''}
        <button class="add-activity-btn" style="width:auto; padding:0.55rem 1rem;" onclick="pbExportExcel()">Excel'e Aktar</button>
      </div>
    </div>

    <div style="display:flex; gap:1rem; flex-wrap:wrap; margin-bottom:1.5rem;">
      ${kpi('Kurum / Müşteri', corpAll.length, '#0d1f61', `${allPriceBook.filter(k => k.group === 'kurumsal').length} kurumsal · ${allPriceBook.filter(k => k.group === 'cari').length} cari`)}
      ${kpi('2026 Proje Toplamı', pbMoneyPlain(tot26), '#f59e0b', 'Proje kalemleri (PRO/CEP hariç)')}
      ${kpi('2027 Proje Toplamı', pbMoneyPlain(tot27), '#16a34a', `Artış: ${pbPct(diff)}`)}
      ${kpi('Zam Durumu', `${done} / ${corpAll.length} onaylandı`, '#8b5cf6', `${statusCounts['Bekliyor'] || 0} bekliyor · ${statusCounts['Bildirildi'] || 0} bildirildi`)}
    </div>

    <div style="display:flex; flex-wrap:wrap; gap:0.75rem; align-items:center; margin-bottom:1.25rem;">
      <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">${groupBtn('kurumsal')}${groupBtn('cari')}${groupBtn('bireysel')}</div>
      <input type="text" id="pbSearch" class="modal-input" placeholder="Kurum, ürün veya not ara..." oninput="renderPriceBook()" style="flex:1; min-width:220px; height:38px; font-size:0.85rem; margin:0;" value="${pbEsc(searchVal)}">
      ${pbGroup !== 'bireysel' ? `<select id="pbStatusFilter" class="modal-select" onchange="renderPriceBook()" style="min-width:170px; height:38px; font-size:0.85rem; margin:0;">
        <option value="all">Tüm Durumlar</option>
        ${PB_STATUSES.map(s => `<option value="${s}" ${statusVal === s ? 'selected' : ''}>${s}</option>`).join('')}
      </select>` : ''}
    </div>

    ${body}`;

  if (hadFocus) {
    const el = document.getElementById('pbSearch');
    if (el) { el.focus(); el.setSelectionRange(el.value.length, el.value.length); }
  }
}

function pbSetGroup(g) {
  pbGroup = g;
  const s = document.getElementById('pbSearch');
  if (s) s.value = '';
  renderPriceBook();
}

function pbToggle(id) {
  if (pbOpen.has(id)) pbOpen.delete(id); else pbOpen.add(id);
  renderPriceBook();
}

function pbRenderCorp(list, canEdit, isAdmin) {
  if (!list.length) {
    return `<div style="background:var(--surface); border:1px solid var(--border); border-radius:16px; padding:2.5rem; text-align:center; color:var(--ink3);">Bu kriterlere uygun kayıt yok.</div>`;
  }
  const th = 'padding:0.55rem 0.7rem; font-size:0.72rem; text-transform:uppercase; letter-spacing:0.05em; color:var(--ink3); text-align:right; white-space:nowrap;';
  const td = 'padding:0.55rem 0.7rem; font-size:0.84rem; text-align:right; white-space:nowrap;';

  return list.map(k => {
    const status = k.status || 'Bekliyor';
    const color = PB_STATUS_COLORS[status] || '#94a3b8';
    const open = pbOpen.has(k.id);
    const s26 = pbItemSum(k, 2026), s27 = pbItemSum(k, 2027);
    const itemCount = (k.items || []).length;
    const rateTag = (k.pro && k.pro.rate != null) ? k.pro.rate : ((k.items || []).find(i => i.rate != null) || {}).rate;

    let detail = '';
    if (open) {
      const unitRow = (label, u) => u ? `
        <tr style="background:rgba(13,31,97,0.04);">
          <td style="padding:0.55rem 0.7rem; font-size:0.84rem; font-weight:700;">${label} <span style="font-weight:500; color:var(--ink3); font-size:0.72rem;">(kullanıcı / ay)</span></td>
          <td style="${td}">${pbMoney(u.p2024)}</td><td style="${td}">${pbMoney(u.p2025)}</td><td style="${td}">${pbMoney(u.p2026)}</td>
          <td style="${td} font-weight:800; color:#16a34a;">${pbMoney(u.p2027)}</td><td style="${td}">${pbPct(u.rate)}</td><td></td>
        </tr>` : '';
      const itemRows = (k.items || []).map(i => `
        <tr style="border-top:1px solid var(--border);">
          <td style="padding:0.55rem 0.7rem; font-size:0.84rem; white-space:normal; min-width:220px;">${pbEsc(i.name)}</td>
          <td style="${td}">${pbMoney(i.p2024)}</td><td style="${td}">${pbMoney(i.p2025)}</td><td style="${td}">${pbMoney(i.p2026)}</td>
          <td style="${td} font-weight:800; color:#16a34a;">${pbMoney(i.p2027)}</td><td style="${td}">${pbPct(i.rate)}</td>
          <td style="${td} color:var(--ink3);">${i.exempt != null ? pbMoney(i.exempt) : '—'}</td>
        </tr>`).join('');
      detail = `
        <div style="padding:0 1.25rem 1.25rem; overflow-x:auto;">
          <table style="width:100%; border-collapse:collapse;">
            <thead><tr>
              <th style="${th} text-align:left;">Ürün / Hizmet</th><th style="${th}">2024</th><th style="${th}">2025</th><th style="${th}">2026</th>
              <th style="${th}">2027</th><th style="${th}">Zam</th><th style="${th}">Muafiyet</th>
            </tr></thead>
            <tbody>${unitRow('PRO', k.pro)}${unitRow('CEP', k.cep)}${itemRows}
              ${itemCount ? `<tr style="border-top:2px solid var(--border); background:var(--bg);">
                <td style="padding:0.6rem 0.7rem; font-weight:800; font-size:0.84rem;">Proje Toplamı</td>
                <td style="${td}">${pbMoney(pbItemSum(k, 2024))}</td><td style="${td}">${pbMoney(pbItemSum(k, 2025))}</td>
                <td style="${td} font-weight:700;">${pbMoney(s26)}</td><td style="${td} font-weight:900; color:#16a34a;">${pbMoney(s27)}</td><td style="${td}">${s26 ? pbPct(s27 / s26 - 1) : '—'}</td><td></td>
              </tr>` : ''}
            </tbody>
          </table>
          ${k.note ? `<div style="margin-top:0.8rem; font-size:0.82rem; color:var(--ink2); background:var(--bg); border-left:3px solid #f59e0b; padding:0.6rem 0.9rem; border-radius:8px; white-space:pre-wrap;">${pbEsc(k.note)}</div>` : ''}
          <div style="margin-top:0.9rem; display:flex; gap:0.5rem; flex-wrap:wrap;">
            ${canEdit ? `<button class="crm-action-btn" style="cursor:pointer; padding:0.35rem 0.8rem;" onclick="pbOpenModal('${k.id}')">Düzenle</button>` : ''}
            <button class="crm-action-btn" style="cursor:pointer; padding:0.35rem 0.8rem;" onclick="pbLetterPDF('${k.id}')">📄 Zam Mektubu PDF</button>
            ${isAdmin ? `<button class="crm-action-btn" style="cursor:pointer; padding:0.35rem 0.8rem; background:#fee2e2; color:#dc2626; border:1px solid #fca5a5;" onclick="pbDelete('${k.id}')">Sil</button>` : ''}
          </div>
        </div>`;
    }

    return `
      <div style="background:var(--surface); border:1px solid var(--border); border-radius:16px; margin-bottom:0.7rem; box-shadow:var(--shadow); overflow:hidden;">
        <div onclick="pbToggle('${k.id}')" style="display:flex; align-items:center; gap:1rem; flex-wrap:wrap; padding:0.95rem 1.25rem; cursor:pointer;">
          <span style="font-size:0.8rem; color:var(--ink3); width:14px;">${open ? '▼' : '▶'}</span>
          <div style="flex:1; min-width:200px;">
            <div style="font-weight:800; font-size:0.95rem; color:var(--ink);">${pbEsc(k.name)}</div>
            <div style="font-size:0.74rem; color:var(--ink3); margin-top:0.1rem;">${itemCount} kalem${k.pro ? ' · PRO' : ''}${k.cep ? ' · CEP' : ''}${rateTag != null ? ' · zam ' + pbPct(rateTag) : ''}</div>
          </div>
          <div style="text-align:right; min-width:120px;">
            <div style="font-size:0.68rem; color:var(--ink3); text-transform:uppercase;">2026</div>
            <div style="font-weight:700; font-size:0.88rem;">${itemCount ? pbMoneyPlain(s26) : '—'}</div>
          </div>
          <div style="text-align:right; min-width:120px;">
            <div style="font-size:0.68rem; color:var(--ink3); text-transform:uppercase;">2027</div>
            <div style="font-weight:800; font-size:0.88rem; color:#16a34a;">${itemCount ? pbMoneyPlain(s27) : '—'}</div>
          </div>
          <span style="font-size:0.72rem; font-weight:700; padding:0.25rem 0.7rem; border-radius:99px; background:${color}22; color:${color}; border:1px solid ${color}55; white-space:nowrap;">${pbEsc(status)}</span>
        </div>
        ${detail}
      </div>`;
  }).join('');
}

function pbRenderRetail(list, canEdit, isAdmin) {
  if (!list.length) {
    return `<div style="background:var(--surface); border:1px solid var(--border); border-radius:16px; padding:2.5rem; text-align:center; color:var(--ink3);">Bu kriterlere uygun ürün yok.</div>`;
  }
  const th = 'padding:0.6rem 0.8rem; font-size:0.72rem; text-transform:uppercase; letter-spacing:0.05em; color:var(--ink3); text-align:right; white-space:nowrap;';
  const td = 'padding:0.6rem 0.8rem; font-size:0.85rem; text-align:right; white-space:nowrap;';
  let rows = '', lastSection = null;
  list.forEach(p => {
    if (p.section && p.section !== lastSection) {
      rows += `<tr><td colspan="${canEdit ? 8 : 7}" style="padding:0.7rem 0.8rem; font-weight:800; font-size:0.78rem; letter-spacing:0.06em; color:#0d1f61; background:rgba(13,31,97,0.06);">${pbEsc(p.section)}</td></tr>`;
    }
    lastSection = p.section || lastSection;
    const chg = (p.p2026 && p.p2027) ? pbPct(p.p2027 / p.p2026 - 1) : '—';
    rows += `
      <tr style="border-top:1px solid var(--border);">
        <td style="padding:0.6rem 0.8rem; font-size:0.85rem; font-weight:600;">${pbEsc(p.name)}</td>
        <td style="${td}">${pbMoney(p.p2023)}</td><td style="${td}">${pbMoney(p.p2024)}</td><td style="${td}">${pbMoney(p.p2025)}</td>
        <td style="${td} font-weight:700;">${pbMoney(p.p2026)}</td>
        <td style="${td} font-weight:800; color:#16a34a;">${pbMoney(p.p2027)}</td>
        <td style="${td}">${chg}</td>
        ${canEdit ? `<td style="${td}"><button class="crm-action-btn" style="cursor:pointer; padding:0.25rem 0.6rem; font-size:0.72rem;" onclick="pbOpenModal('${p.id}')">Düzenle</button>
          ${isAdmin ? `<button class="crm-action-btn" style="cursor:pointer; padding:0.25rem 0.6rem; font-size:0.72rem; background:#fee2e2; color:#dc2626; border:1px solid #fca5a5;" onclick="pbDelete('${p.id}')">Sil</button>` : ''}</td>` : ''}
      </tr>`;
  });
  return `
    <div class="crm-table-wrap" style="overflow-x:auto;">
      <table style="width:100%; border-collapse:collapse; background:var(--surface); border:1px solid var(--border); border-radius:16px;">
        <thead><tr>
          <th style="${th} text-align:left;">Ürün</th><th style="${th}">2023</th><th style="${th}">2024</th><th style="${th}">2025</th>
          <th style="${th}">2026</th><th style="${th}">2027</th><th style="${th}">Zam</th>${canEdit ? `<th style="${th}">İşlem</th>` : ''}
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

/* ── İLK YÜKLEME (EXCEL VERİSİ) ── */
function importPriceSeed() {
  if (!pbIsAdmin()) return;
  const seed = window.PRICE_SEED;
  if (!seed) { showToast('Başlangıç verisi bulunamadı.', 'error'); return; }
  if (allPriceBook.length && !confirm('Fiyat listesi zaten dolu. Yine de yüklensin mi? (Kayıtlar çoğalabilir)')) return;

  const docs = [];
  [...(seed.kurumsal || []), ...(seed.cari || [])].forEach(k => docs.push({ ...k, status: 'Bekliyor', note: '' }));
  (seed.bireysel || []).forEach((p, idx) => docs.push({ ...p, group: 'bireysel', order: idx }));

  const now = new Date().toISOString();
  const chunks = [];
  for (let i = 0; i < docs.length; i += 400) chunks.push(docs.slice(i, i + 400));

  showToast('Fiyat listesi yükleniyor...', 'success');
  Promise.all(chunks.map(chunk => {
    const batch = db.batch();
    chunk.forEach(d => batch.set(db.collection('priceBook').doc(), { ...d, createdAt: now, updatedAt: now }));
    return batch.commit();
  })).then(() => showToast(`${docs.length} kayıt yüklendi.`, 'success'))
    .catch(e => showToast('Yükleme hatası: ' + e.message, 'error'));
}

/* ── DÜZENLEME MODALI ── */
function pbNumOrNull(v) {
  const s = String(v ?? '').trim().replace(',', '.');
  if (s === '') return null;
  const n = parseFloat(s);
  return isNaN(n) ? null : n;
}
function pbInput(cls, val, w) {
  return `<input class="modal-input ${cls}" type="number" step="0.01" value="${val ?? ''}" style="margin:0; width:${w || 100}px; font-size:0.8rem; padding:0.35rem 0.5rem;">`;
}

function pbItemRowHtml(i) {
  i = i || {};
  return `
    <tr class="pb-item-row">
      <td><input class="modal-input pb-i-name" value="${pbEsc(i.name || '')}" placeholder="Ürün / hizmet adı" style="margin:0; min-width:200px; font-size:0.8rem; padding:0.35rem 0.5rem;"></td>
      <td>${pbInput('pb-i-24', i.p2024, 90)}</td><td>${pbInput('pb-i-25', i.p2025, 90)}</td>
      <td>${pbInput('pb-i-26', i.p2026, 100)}</td><td>${pbInput('pb-i-27', i.p2027, 100)}</td>
      <td>${pbInput('pb-i-rate', i.rate != null ? Math.round(i.rate * 1000) / 10 : '', 60)}</td>
      <td><button type="button" class="modal-cancel" style="padding:0.25rem 0.6rem; font-size:0.72rem;" onclick="this.closest('tr').remove()">✕</button></td>
    </tr>`;
}
function pbUnitRowHtml(label, key, u) {
  u = u || {};
  return `
    <tr class="pb-unit-row" data-key="${key}">
      <td style="font-weight:700; font-size:0.85rem; padding-right:0.6rem;">${label}</td>
      <td>${pbInput('pb-u-24', u.p2024, 90)}</td><td>${pbInput('pb-u-25', u.p2025, 90)}</td>
      <td>${pbInput('pb-u-26', u.p2026, 100)}</td><td>${pbInput('pb-u-27', u.p2027, 100)}</td>
      <td>${pbInput('pb-u-rate', u.rate != null ? Math.round(u.rate * 1000) / 10 : '', 60)}</td><td></td>
    </tr>`;
}

function pbOpenModal(id) {
  if (!pbCanEdit()) return;
  pbEditId = id || null;
  const rec = id ? allPriceBook.find(x => x.id === id) : null;
  const isRetail = rec ? rec.group === 'bireysel' : pbGroup === 'bireysel';

  document.getElementById('pbModal')?.remove();
  const ov = document.createElement('div');
  ov.className = 'modal-overlay';
  ov.id = 'pbModal';

  let inner = '';
  if (isRetail) {
    const r = rec || {};
    inner = `
      <div class="modal-title">${rec ? 'Ürünü Düzenle' : 'Yeni Bireysel Ürün'}</div>
      <label class="modal-label">Ürün Adı</label>
      <input class="modal-input" id="pbName" value="${pbEsc(r.name || '')}">
      <label class="modal-label">Bölüm (opsiyonel)</label>
      <input class="modal-input" id="pbSection" value="${pbEsc(r.section || '')}" placeholder="Örn: BORSA LİSANSLARI">
      <div style="display:grid; grid-template-columns:repeat(5,1fr); gap:0.6rem; margin-top:0.5rem;">
        ${['2023', '2024', '2025', '2026', '2027'].map(y => `<div><label class="modal-label" style="margin-top:0">${y}</label><input class="modal-input" type="number" step="0.01" id="pbR${y}" value="${r['p' + y] ?? ''}"></div>`).join('')}
      </div>`;
  } else {
    const k = rec || { group: pbGroup, status: 'Bekliyor', items: [] };
    inner = `
      <div class="modal-title">${rec ? 'Kurumu Düzenle' : 'Yeni Kurum'}</div>
      <div style="display:grid; grid-template-columns:2fr 1fr 1fr; gap:0.8rem;">
        <div><label class="modal-label" style="margin-top:0">Kurum Adı</label><input class="modal-input" id="pbName" value="${pbEsc(k.name || '')}"></div>
        <div><label class="modal-label" style="margin-top:0">Liste</label>
          <select class="modal-select" id="pbGroupSel">
            <option value="kurumsal" ${k.group === 'kurumsal' ? 'selected' : ''}>Kurumsal</option>
            <option value="cari" ${k.group === 'cari' ? 'selected' : ''}>Cari</option>
          </select></div>
        <div><label class="modal-label" style="margin-top:0">Zam Durumu</label>
          <select class="modal-select" id="pbStatusSel">${PB_STATUSES.map(s => `<option ${((k.status || 'Bekliyor') === s) ? 'selected' : ''}>${s}</option>`).join('')}</select></div>
      </div>
      <label class="modal-label">Not</label>
      <textarea class="modal-textarea" id="pbNote" rows="2" placeholder="Görüşme notu, özel anlaşma...">${pbEsc(k.note || '')}</textarea>
      <div style="overflow-x:auto; margin-top:1rem;">
        <table style="border-collapse:separate; border-spacing:0.35rem 0.3rem;">
          <thead><tr style="font-size:0.7rem; color:var(--ink3); text-transform:uppercase;"><th style="text-align:left">Kalem</th><th>2024</th><th>2025</th><th>2026</th><th>2027</th><th>Zam %</th><th></th></tr></thead>
          <tbody>
            ${pbUnitRowHtml('PRO', 'pro', k.pro)}
            ${pbUnitRowHtml('CEP', 'cep', k.cep)}
          </tbody>
          <tbody id="pbItemsBody">${(k.items || []).map(pbItemRowHtml).join('')}</tbody>
        </table>
      </div>
      <div style="display:flex; gap:0.5rem; margin-top:0.6rem; flex-wrap:wrap;">
        <button type="button" class="add-activity-btn" style="width:auto; padding:0.4rem 0.9rem;" onclick="document.getElementById('pbItemsBody').insertAdjacentHTML('beforeend', pbItemRowHtml())">+ Kalem Ekle</button>
        <button type="button" class="add-activity-btn" style="width:auto; padding:0.4rem 0.9rem;" onclick="pbRecalcForm()">Zam oranıyla 2027'yi hesapla</button>
      </div>`;
  }

  ov.innerHTML = `<div class="modal" style="max-width:${isRetail ? '560px' : '900px'}; width:94vw; max-height:90vh; overflow-y:auto;">
    ${inner}
    <div class="modal-btns">
      <button class="modal-cancel" onclick="pbCloseModal()">İptal</button>
      <button class="modal-save" id="pbSaveBtn" onclick="pbSave(${isRetail})">Kaydet</button>
    </div>
  </div>`;
  document.body.appendChild(ov);
}

function pbCloseModal() {
  document.getElementById('pbModal')?.remove();
  pbEditId = null;
}

// Formdaki satırlarda: 2027 = 2026 × (1 + zam%)
function pbRecalcForm() {
  const apply = (row, c26, c27, cr) => {
    const p26 = pbNumOrNull(row.querySelector('.' + c26)?.value);
    const rate = pbNumOrNull(row.querySelector('.' + cr)?.value);
    if (p26 == null || rate == null) return;
    row.querySelector('.' + c27).value = Math.round(p26 * (1 + rate / 100) * 100) / 100;
  };
  document.querySelectorAll('#pbModal .pb-unit-row').forEach(r => apply(r, 'pb-u-26', 'pb-u-27', 'pb-u-rate'));
  document.querySelectorAll('#pbModal .pb-item-row').forEach(r => apply(r, 'pb-i-26', 'pb-i-27', 'pb-i-rate'));
  showToast('2027 fiyatları hesaplandı. Kaydetmeyi unutma.', 'success');
}

function pbSave(isRetail) {
  const name = document.getElementById('pbName').value.trim();
  if (!name) { showToast('Ad boş olamaz!', 'warning'); return; }
  let payload;

  if (isRetail) {
    payload = {
      group: 'bireysel', name,
      section: document.getElementById('pbSection').value.trim(),
      p2023: pbNumOrNull(document.getElementById('pbR2023').value),
      p2024: pbNumOrNull(document.getElementById('pbR2024').value),
      p2025: pbNumOrNull(document.getElementById('pbR2025').value),
      p2026: pbNumOrNull(document.getElementById('pbR2026').value),
      p2027: pbNumOrNull(document.getElementById('pbR2027').value)
    };
    if (!pbEditId) payload.order = allPriceBook.filter(x => x.group === 'bireysel').length;
  } else {
    const readUnit = (key) => {
      const row = document.querySelector(`#pbModal .pb-unit-row[data-key="${key}"]`);
      const u = {
        p2024: pbNumOrNull(row.querySelector('.pb-u-24').value), p2025: pbNumOrNull(row.querySelector('.pb-u-25').value),
        p2026: pbNumOrNull(row.querySelector('.pb-u-26').value), p2027: pbNumOrNull(row.querySelector('.pb-u-27').value),
        rate: pbNumOrNull(row.querySelector('.pb-u-rate').value)
      };
      if (u.rate != null) u.rate = u.rate / 100;
      return Object.values(u).every(v => v == null) ? null : u;
    };
    const old = pbEditId ? allPriceBook.find(x => x.id === pbEditId) : null;
    const items = [];
    document.querySelectorAll('#pbModal .pb-item-row').forEach((row, idx) => {
      const n = row.querySelector('.pb-i-name').value.trim();
      if (!n) return;
      const rate = pbNumOrNull(row.querySelector('.pb-i-rate').value);
      const prev = old && old.items && old.items[idx] && old.items[idx].name === n ? old.items[idx] : null;
      items.push({
        name: n,
        p2024: pbNumOrNull(row.querySelector('.pb-i-24').value), p2025: pbNumOrNull(row.querySelector('.pb-i-25').value),
        p2026: pbNumOrNull(row.querySelector('.pb-i-26').value), p2027: pbNumOrNull(row.querySelector('.pb-i-27').value),
        exempt: prev ? (prev.exempt ?? null) : null,
        rate: rate != null ? rate / 100 : null
      });
    });
    payload = {
      name, group: document.getElementById('pbGroupSel').value,
      status: document.getElementById('pbStatusSel').value,
      note: document.getElementById('pbNote').value.trim(),
      pro: readUnit('pro'), cep: readUnit('cep'), items
    };
    pbGroup = payload.group;
  }

  payload.updatedAt = new Date().toISOString();
  const btn = document.getElementById('pbSaveBtn');
  btn.disabled = true; btn.textContent = 'Kaydediliyor...';

  let op;
  if (pbEditId) op = db.collection('priceBook').doc(pbEditId).update(payload);
  else { payload.createdAt = payload.updatedAt; op = db.collection('priceBook').add(payload); }

  op.then(() => { showToast('Kaydedildi.', 'success'); pbCloseModal(); renderPriceBook(); })
    .catch(e => { showToast('Hata: ' + e.message, 'error'); btn.disabled = false; btn.textContent = 'Kaydet'; });
}

function pbDelete(id) {
  if (!pbIsAdmin()) return;
  const rec = allPriceBook.find(x => x.id === id);
  if (!confirm(`"${rec ? rec.name : ''}" kaydını silmek istediğine emin misin?`)) return;
  db.collection('priceBook').doc(id).delete()
    .then(() => showToast('Silindi.', 'success'))
    .catch(e => showToast('Hata: ' + e.message, 'error'));
}

/* ── TOPLU ZAM ORANI (görünen listedeki kurumlara) ── */
function pbBulkRate() {
  if (!pbIsAdmin() || pbGroup === 'bireysel') return;
  const list = pbGroupList();
  if (!list.length) { showToast('Listede kurum yok.', 'warning'); return; }
  const input = prompt(`Görünen ${list.length} kurumun TÜM kalemlerine uygulanacak zam oranı (%):\n2027 fiyatı = 2026 fiyatı × (1 + oran). Mevcut 2027 değerlerinin üzerine yazılır.`, '30');
  if (input === null) return;
  const r = parseFloat(String(input).replace(',', '.'));
  if (isNaN(r) || r < 0 || r > 500) { showToast('Geçersiz oran.', 'warning'); return; }
  if (!confirm(`${list.length} kurum için %${r} zam uygulanacak. Onaylıyor musun?`)) return;

  const rate = r / 100;
  const calc = (u) => {
    if (!u) return u;
    const o = { ...u, rate };
    if (u.p2026 != null) o.p2027 = Math.round(u.p2026 * (1 + rate) * 100) / 100;
    return o;
  };
  const now = new Date().toISOString();
  const batch = db.batch();
  list.forEach(k => {
    batch.update(db.collection('priceBook').doc(k.id), {
      pro: calc(k.pro), cep: calc(k.cep),
      items: (k.items || []).map(i => calc(i)),
      updatedAt: now
    });
  });
  batch.commit()
    .then(() => showToast(`%${r} zam ${list.length} kuruma uygulandı.`, 'success'))
    .catch(e => showToast('Hata: ' + e.message, 'error'));
}

/* ── ZAM MEKTUBU (PDF) ── */
function pbLetterPDF(id) {
  const k = allPriceBook.find(x => x.id === id);
  if (!k) return;
  const rows = [];
  if (k.pro && k.pro.p2027 != null) rows.push({ name: 'PRO (kullanıcı / ay)', a: k.pro.p2026, b: k.pro.p2027 });
  if (k.cep && k.cep.p2027 != null) rows.push({ name: 'CEP (kullanıcı / ay)', a: k.cep.p2026, b: k.cep.p2027 });
  (k.items || []).filter(i => i.p2027 != null).forEach(i => rows.push({ name: i.name, a: i.p2026, b: i.p2027 }));
  if (!rows.length) { showToast('Bu kurum için 2027 fiyatı yok.', 'warning'); return; }

  const months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
  const now = new Date();
  const dateStr = `${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
  const money = n => (n == null ? '—' : Number(n).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ₺');
  const logo = (typeof IDEAL_DATA_LOGO_B64 !== 'undefined')
    ? `<img src="${IDEAL_DATA_LOGO_B64}" style="height:48px; object-fit:contain; display:block">`
    : `<div style="font-size:22px; font-weight:900; color:#0d1f61">İdeal Data</div>`;

  const tr = rows.map((r, i) => `
    <tr style="background:${i % 2 ? '#f8fafc' : '#fff'}; border-bottom:1px solid #e2e8f0;">
      <td style="padding:9px 8px; font-weight:600;">${pbEsc(r.name)}</td>
      <td style="padding:9px 8px; text-align:right;">${money(r.a)}</td>
      <td style="padding:9px 8px; text-align:right; font-weight:800; color:#0d1f61;">${money(r.b)}</td>
    </tr>`).join('');

  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif; color:#0f172a; background:#fff; padding:40px; width:750px; font-size:13px; line-height:1.7; box-sizing:border-box;">
      <div style="display:flex; justify-content:space-between; align-items:flex-start; border-bottom:3px solid #f24f00; padding-bottom:20px; margin-bottom:28px;">
        <div>${logo}
          <div style="font-size:11px; color:#64748b; margin-top:8px; line-height:1.6">İdeal Data Finansal Teknolojiler A.Ş.<br>Barbaros Mah. Ihlamur Bulvarı No:3, Ağaoğlu My Newwork,<br>14. Kat, No:149, 34746 Ataşehir / İstanbul<br>www.idealdata.com.tr • bilgi@idealdata.com.tr • +90 212 385 35 35</div>
        </div>
        <div style="text-align:right; font-size:12px; color:#475569;">${dateStr}</div>
      </div>
      <div style="font-size:15px; font-weight:800; margin-bottom:6px;">${pbEsc(k.name)}</div>
      <div style="font-weight:700; color:#0d1f61; margin-bottom:18px;">Konu: 2027 Yılı Fiyat Güncellemesi</div>
      <p>Sayın Yetkili,</p>
      <p>Hizmetlerimizi kesintisiz ve kaliteli biçimde sürdürmeye devam etmekteyiz. Artış gösteren işletme maliyetleri nedeniyle, <strong>1 Ocak 2027</strong> tarihinden itibaren geçerli olmak üzere hizmet bedellerimizde aşağıdaki güncelleme yapılacaktır.</p>
      <table style="width:100%; border-collapse:collapse; margin:20px 0;">
        <thead><tr style="background:#0d1f61; color:#fff;">
          <th style="padding:10px 8px; text-align:left; font-size:12px;">Hizmet / Ürün</th>
          <th style="padding:10px 8px; text-align:right; font-size:12px; width:130px;">2026</th>
          <th style="padding:10px 8px; text-align:right; font-size:12px; width:130px;">2027</th>
        </tr></thead>
        <tbody>${tr}</tbody>
      </table>
      <p>Konuyla ilgili görüş ve sorularınız için bizimle iletişime geçebilirsiniz. Anlayışınız için teşekkür eder, iş birliğimizin devamını dileriz.</p>
      <p style="margin-top:28px;">Saygılarımızla,<br><strong>İdeal Data Finansal Teknolojiler A.Ş.</strong></p>
    </div>`;

  const wrap = document.createElement('div');
  wrap.style.cssText = 'position:absolute; left:-9999px; top:0; background:#fff';
  wrap.innerHTML = html;
  document.body.appendChild(wrap);
  const fname = `Zam_Mektubu_${k.name.replace(/[^a-zA-Z0-9ığüşöçİĞÜŞÖÇ\s]/g, '').replace(/\s+/g, '_')}_2027.pdf`;
  html2pdf().from(wrap.firstElementChild).set({
    margin: 8, filename: fname, image: { type: 'jpeg', quality: 0.95 },
    html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  }).save().then(() => wrap.remove()).catch(() => { wrap.remove(); showToast('PDF oluşturulamadı.', 'error'); });
}
window.pbLetterPDF = pbLetterPDF;

/* ── EXCEL'E AKTAR ── */
function pbExportExcel() {
  if (typeof XLSX === 'undefined') { showToast('Excel kütüphanesi yüklenmedi.', 'error'); return; }
  if (!allPriceBook.length) { showToast('Dışa aktarılacak kayıt yok.', 'warning'); return; }
  const wb = XLSX.utils.book_new();

  const corpRows = [['LİSTE', 'KURUM', 'KALEM', '2024', '2025', '2026', '2027', 'ZAM %', 'MUAFİYET', 'ZAM DURUMU', 'NOT']];
  allPriceBook.filter(k => k.group !== 'bireysel')
    .sort((a, b) => (a.group || '').localeCompare(b.group || '') || (a.name || '').localeCompare(b.name || '', 'tr'))
    .forEach(k => {
      const base = [PB_GROUP_LABELS[k.group] || k.group, k.name];
      const tail = [k.status || 'Bekliyor', k.note || ''];
      const unit = (label, u) => u && corpRows.push([...base, label, u.p2024 ?? '', u.p2025 ?? '', u.p2026 ?? '', u.p2027 ?? '', u.rate != null ? u.rate : '', '', ...tail]);
      unit('PRO (kullanıcı/ay)', k.pro);
      unit('CEP (kullanıcı/ay)', k.cep);
      (k.items || []).forEach(i => corpRows.push([...base, i.name, i.p2024 ?? '', i.p2025 ?? '', i.p2026 ?? '', i.p2027 ?? '', i.rate != null ? i.rate : '', i.exempt ?? '', ...tail]));
    });
  const ws1 = XLSX.utils.aoa_to_sheet(corpRows);
  ws1['!cols'] = [14, 34, 50, 12, 12, 14, 14, 8, 14, 18, 40].map(w => ({ wch: w }));
  XLSX.utils.book_append_sheet(wb, ws1, 'Kurumsal ve Cari');

  const retRows = [['ÜRÜN', 'BÖLÜM', '2023', '2024', '2025', '2026', '2027']];
  allPriceBook.filter(k => k.group === 'bireysel').sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .forEach(p => retRows.push([p.name, p.section || '', p.p2023 ?? '', p.p2024 ?? '', p.p2025 ?? '', p.p2026 ?? '', p.p2027 ?? '']));
  const ws2 = XLSX.utils.aoa_to_sheet(retRows);
  ws2['!cols'] = [44, 20, 10, 10, 10, 10, 10].map(w => ({ wch: w }));
  XLSX.utils.book_append_sheet(wb, ws2, 'Bireysel');

  XLSX.writeFile(wb, 'fiyat_ve_zam_listesi.xlsx');
  showToast('Excel indirildi!', 'success');
}

window.renderPriceBook = renderPriceBook;
window.pbSetGroup = pbSetGroup;
window.pbToggle = pbToggle;
window.pbOpenModal = pbOpenModal;
window.pbCloseModal = pbCloseModal;
window.pbSave = pbSave;
window.pbDelete = pbDelete;
window.pbBulkRate = pbBulkRate;
window.pbRecalcForm = pbRecalcForm;
window.pbItemRowHtml = pbItemRowHtml;
window.pbExportExcel = pbExportExcel;
window.importPriceSeed = importPriceSeed;
