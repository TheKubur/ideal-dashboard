// ====== MEVCUT İPTALLER (AY AY İPTAL TAKİBİ) ======
let allCancellations = [];
let editCancelId = null;
let cancelYearFilter = String(new Date().getFullYear());
let cancelUnsub = null;

const CANCEL_MONTHS = ['OCAK', 'ŞUBAT', 'MART', 'NİSAN', 'MAYIS', 'HAZİRAN', 'TEMMUZ', 'AĞUSTOS', 'EYLÜL', 'EKİM', 'KASIM', 'ARALIK'];
const CANCEL_REASONS = ['Fiyat / Bütçe', 'Rakibe Geçiş', 'Kullanım Azlığı', 'Memnuniyetsizlik', 'Şirket Kapanış / Birleşme', 'Teknik Sorunlar', 'Diğer'];

function cancelEsc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function cancelFmtMoney(n) {
  return Number(n || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ₺';
}

function listenToCancellations() {
  if (cancelUnsub || typeof db === 'undefined') return;
  cancelUnsub = db.collection('cancellations').onSnapshot(snap => {
    allCancellations = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    const view = document.getElementById('report-view-cancellations');
    if (view && view.style.display !== 'none') renderCancellations();
  }, err => console.error('Cancellations listener error:', err));
  if (typeof globalUnsubscribeFns !== 'undefined') globalUnsubscribeFns.push(cancelUnsub);
}

function getFilteredCancellations() {
  const search = (document.getElementById('cancelSearch')?.value || '').trim().toLowerCase();
  const reason = document.getElementById('cancelReasonFilter')?.value || 'all';
  const month = document.getElementById('cancelMonthFilter')?.value || 'all';
  return allCancellations.filter(c => {
    if (String(c.year) !== cancelYearFilter) return false;
    if (reason !== 'all' && c.reason !== reason) return false;
    if (month !== 'all' && c.month !== month) return false;
    if (search) {
      const hay = `${c.company || ''} ${c.product || ''} ${c.note || ''} ${c.memberName || ''}`.toLowerCase();
      if (!hay.includes(search)) return false;
    }
    return true;
  });
}

function renderCancellations() {
  listenToCancellations();

  const addBtn = document.getElementById('btnNewCancel');
  if (addBtn) addBtn.style.display = (currentUser && currentUser.role === 'viewer') ? 'none' : 'inline-block';

  // Yıl seçici
  const yearSel = document.getElementById('cancelYearFilter');
  if (yearSel) {
    const nowY = new Date().getFullYear();
    const years = [...new Set([nowY, nowY - 1, ...allCancellations.map(c => Number(c.year)).filter(Boolean)])].sort((a, b) => b - a);
    yearSel.innerHTML = years.map(y => `<option value="${y}">${y}</option>`).join('');
    yearSel.value = cancelYearFilter;
  }

  const list = getFilteredCancellations();
  const kpi = document.getElementById('cancel-kpi-strip');
  const table = document.getElementById('cancel-table');
  if (!kpi || !table) return;

  // KPI
  const totalCount = list.length;
  const totalLoss = list.reduce((s, c) => s + (Number(c.amount) || 0), 0);
  const curMonth = CANCEL_MONTHS[new Date().getMonth()];
  const thisMonthCount = list.filter(c => c.month === curMonth).length;
  const reasonCounts = {};
  list.forEach(c => { reasonCounts[c.reason || 'Diğer'] = (reasonCounts[c.reason || 'Diğer'] || 0) + 1; });
  const topReason = Object.entries(reasonCounts).sort((a, b) => b[1] - a[1])[0];

  const kpiCard = (label, value, color) => `
    <div style="flex:1; min-width:180px; background:var(--surface); border:1px solid var(--border); border-left:4px solid ${color}; border-radius:14px; padding:1rem 1.25rem; box-shadow:var(--shadow);">
      <div style="font-size:0.7rem; font-weight:700; letter-spacing:0.06em; text-transform:uppercase; color:var(--ink3);">${label}</div>
      <div style="font-size:1.35rem; font-weight:800; color:var(--ink); margin-top:0.3rem;">${value}</div>
    </div>`;

  kpi.innerHTML =
    kpiCard(`${cancelYearFilter} Toplam İptal`, totalCount, '#e63946') +
    kpiCard('Aylık Gelir Kaybı', cancelFmtMoney(totalLoss), '#f59e0b') +
    kpiCard(`Bu Ay (${curMonth})`, thisMonthCount, '#8b5cf6') +
    kpiCard('En Sık Neden', topReason ? `${cancelEsc(topReason[0])} (${topReason[1]})` : '—', '#457b9d');

  if (!list.length) {
    table.innerHTML = `<div style="background:var(--surface); border:1px solid var(--border); border-radius:16px; padding:2.5rem; text-align:center; color:var(--ink3);">Bu kriterlere uygun iptal kaydı yok.</div>`;
    return;
  }

  const canEdit = !currentUser || currentUser.role !== 'viewer';
  const isAdmin = currentUser && currentUser.role === 'admin';
  const fmtDate = s => { if (!s) return '—'; const p = s.split('-'); return p.length === 3 ? `${p[2]}.${p[1]}.${p[0]}` : s; };

  const months = CANCEL_MONTHS.filter(m => list.some(c => c.month === m));
  let html = `
    <div class="crm-table-wrap">
      <table class="crm-table">
        <thead>
          <tr>
            <th>Ay</th>
            <th>Kurum</th>
            <th>Ürün / Hizmet</th>
            <th style="text-align:right;">Aylık Tutar</th>
            <th>İptal Nedeni</th>
            <th>İptal Tarihi</th>
            <th>Giren</th>
            <th>Not</th>
            ${canEdit ? '<th style="text-align:right;">İşlem</th>' : ''}
          </tr>
        </thead>
        <tbody>`;

  months.forEach(m => {
    const rows = list.filter(c => c.month === m).sort((a, b) => (a.cancelDate || '').localeCompare(b.cancelDate || ''));
    const monthTotal = rows.reduce((s, c) => s + (Number(c.amount) || 0), 0);
    rows.forEach((c, i) => {
      html += `
        <tr>
          ${i === 0 ? `<td rowspan="${rows.length}" style="font-weight:800; color:#e63946; vertical-align:top; white-space:nowrap;">${m}</td>` : ''}
          <td class="crm-company">${cancelEsc(c.company)}</td>
          <td>${cancelEsc(c.product) || '<span style="color:var(--ink3)">—</span>'}</td>
          <td style="text-align:right; font-weight:700; color:#e63946; white-space:nowrap;">${cancelFmtMoney(c.amount)}</td>
          <td><span style="font-size:0.72rem; font-weight:600; padding:0.2rem 0.55rem; border-radius:99px; background:rgba(230,57,70,0.1); color:#e63946; border:1px solid rgba(230,57,70,0.25); white-space:nowrap;">${cancelEsc(c.reason || 'Diğer')}</span></td>
          <td style="white-space:nowrap;">${fmtDate(c.cancelDate)}</td>
          <td style="white-space:nowrap;">${cancelEsc(c.memberName || '—')}</td>
          <td style="font-size:0.78rem; color:var(--ink2); max-width:240px;">${cancelEsc(c.note || '')}</td>
          ${canEdit ? `<td style="text-align:right; white-space:nowrap;">
            <button class="crm-action-btn" onclick="openCancelModal('${c.id}')" style="padding:0.25rem 0.55rem; font-size:0.72rem; cursor:pointer;">Düzenle</button>
            ${isAdmin ? `<button class="crm-action-btn" onclick="deleteCancellation('${c.id}')" style="padding:0.25rem 0.55rem; font-size:0.72rem; cursor:pointer; background:#fee2e2; color:#dc2626; border:1px solid #fca5a5;">Sil</button>` : ''}
          </td>` : ''}
        </tr>`;
    });
    html += `
        <tr style="background:rgba(230,57,70,0.05);">
          <td colspan="3" style="text-align:right; font-weight:700; font-size:0.78rem; color:var(--ink2);">${m} Toplamı (${rows.length} iptal)</td>
          <td style="text-align:right; font-weight:800; color:#e63946;">${cancelFmtMoney(monthTotal)}</td>
          <td colspan="${canEdit ? 5 : 4}"></td>
        </tr>`;
  });

  html += `
        <tr style="background:#0d1f61;">
          <td colspan="3" style="text-align:right; font-weight:800; color:#fff;">${cancelYearFilter} GENEL TOPLAM (${totalCount} iptal)</td>
          <td style="text-align:right; font-weight:900; color:#fff; background:#e63946;">${cancelFmtMoney(totalLoss)}</td>
          <td colspan="${canEdit ? 5 : 4}"></td>
        </tr>
        </tbody>
      </table>
    </div>`;

  table.innerHTML = html;
}

function changeCancelYear(y) {
  cancelYearFilter = String(y);
  renderCancellations();
}

/* ── MODAL ── */
function openCancelModal(id = null) {
  if (currentUser && currentUser.role === 'viewer') return;
  editCancelId = typeof id === 'string' ? id : null;
  const modal = document.getElementById('cancelModal');
  if (!modal) return;

  // Kurum listesi
  const compSel = document.getElementById('cancelCompany');
  const actCompanies = [...new Set((allActivities || []).map(a => a.company).filter(Boolean))];
  const companies = [...new Set([...(typeof COMPANIES !== 'undefined' ? COMPANIES : []), ...actCompanies])].sort((a, b) => a.localeCompare(b, 'tr'));
  compSel.innerHTML = '<option value="">-- Kurum Seç --</option>' +
    companies.map(c => `<option value="${cancelEsc(c)}">${cancelEsc(c)}</option>`).join('') +
    '<option value="__yeni__">+ Listede Yok, Elle Yaz...</option>';

  document.getElementById('cancelReason').innerHTML = CANCEL_REASONS.map(r => `<option value="${r}">${r}</option>`).join('');
  document.getElementById('cancelCompanyCustom').classList.add('hidden');
  document.getElementById('cancelCompanyCustom').value = '';

  const c = editCancelId ? allCancellations.find(x => x.id === editCancelId) : null;
  document.getElementById('cancelModalTitle').textContent = c ? 'İptal Kaydını Düzenle' : 'Yeni İptal Kaydı';

  if (c) {
    if (![...compSel.options].some(o => o.value === c.company)) {
      const opt = document.createElement('option'); opt.value = c.company; opt.textContent = c.company;
      compSel.insertBefore(opt, compSel.lastElementChild);
    }
    compSel.value = c.company || '';
    document.getElementById('cancelProduct').value = c.product || '';
    document.getElementById('cancelAmount').value = c.amount || '';
    document.getElementById('cancelReason').value = c.reason || 'Diğer';
    document.getElementById('cancelDate').value = c.cancelDate || '';
    document.getElementById('cancelNote').value = c.note || '';
  } else {
    compSel.value = '';
    document.getElementById('cancelProduct').value = '';
    document.getElementById('cancelAmount').value = '';
    document.getElementById('cancelReason').value = CANCEL_REASONS[0];
    document.getElementById('cancelDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('cancelNote').value = '';
  }

  modal.classList.remove('hidden');
}

function closeCancelModal() {
  document.getElementById('cancelModal')?.classList.add('hidden');
  editCancelId = null;
}

function handleCancelCompanyChange() {
  const v = document.getElementById('cancelCompany').value;
  const custom = document.getElementById('cancelCompanyCustom');
  if (v === '__yeni__') { custom.classList.remove('hidden'); custom.focus(); }
  else custom.classList.add('hidden');
}

function saveCancellation() {
  let company = document.getElementById('cancelCompany').value;
  if (company === '__yeni__') company = document.getElementById('cancelCompanyCustom').value.trim();
  const product = document.getElementById('cancelProduct').value.trim();
  const amount = parseFloat(document.getElementById('cancelAmount').value) || 0;
  const reason = document.getElementById('cancelReason').value;
  const cancelDate = document.getElementById('cancelDate').value;
  const note = document.getElementById('cancelNote').value.trim();

  if (!company) { showToast('Kurum seçmelisin!', 'warning'); return; }
  if (!cancelDate) { showToast('İptal tarihi gerekli!', 'warning'); return; }

  const [y, mo] = cancelDate.split('-');
  const payload = {
    company, product, amount, reason, cancelDate, note,
    year: Number(y),
    month: CANCEL_MONTHS[parseInt(mo, 10) - 1],
    updatedAt: new Date().toISOString()
  };

  const btn = document.getElementById('cancelSaveBtn');
  btn.disabled = true; btn.textContent = 'Kaydediliyor...';

  const done = () => { btn.disabled = false; btn.textContent = 'Kaydet'; };

  let op;
  if (editCancelId) {
    op = db.collection('cancellations').doc(editCancelId).update(payload);
  } else {
    payload.memberId = currentUser?.memberId || 'admin';
    payload.memberName = currentUser?.name || '';
    payload.createdAt = new Date().toISOString();
    op = db.collection('cancellations').add(payload);
  }

  op.then(() => {
    showToast(editCancelId ? 'İptal kaydı güncellendi.' : 'İptal kaydı eklendi.', 'success');
    cancelYearFilter = String(y);
    closeCancelModal();
    renderCancellations();
  }).catch(e => showToast('Hata: ' + e.message, 'error')).finally(done);
}

function deleteCancellation(id) {
  if (!currentUser || currentUser.role !== 'admin') return;
  if (!confirm('Bu iptal kaydını silmek istediğine emin misin?')) return;
  db.collection('cancellations').doc(id).delete()
    .then(() => showToast('İptal kaydı silindi.', 'success'))
    .catch(e => showToast('Hata: ' + e.message, 'error'));
}

function exportCancellationsExcel() {
  if (typeof XLSX === 'undefined') { showToast('Excel kütüphanesi yüklenmedi.', 'error'); return; }
  const list = getFilteredCancellations();
  if (!list.length) { showToast('Dışa aktarılacak kayıt yok.', 'warning'); return; }
  const headers = ['AY', 'KURUM', 'ÜRÜN / HİZMET', 'AYLIK TUTAR (₺)', 'İPTAL NEDENİ', 'İPTAL TARİHİ', 'GİREN', 'NOT'];
  const rows = [];
  CANCEL_MONTHS.forEach(m => {
    list.filter(c => c.month === m).forEach(c => {
      rows.push([m, c.company || '', c.product || '', Number(c.amount) || 0, c.reason || '', c.cancelDate || '', c.memberName || '', c.note || '']);
    });
  });
  rows.push([]);
  rows.push(['', '', 'GENEL TOPLAM', list.reduce((s, c) => s + (Number(c.amount) || 0), 0)]);
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  ws['!cols'] = [10, 34, 26, 16, 22, 14, 18, 40].map(w => ({ wch: w }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Mevcut İptaller');
  XLSX.writeFile(wb, `mevcut_iptaller_${cancelYearFilter}.xlsx`);
  showToast('Excel indirildi!', 'success');
}

window.renderCancellations = renderCancellations;
window.openCancelModal = openCancelModal;
window.closeCancelModal = closeCancelModal;
window.saveCancellation = saveCancellation;
window.deleteCancellation = deleteCancellation;
window.changeCancelYear = changeCancelYear;
window.handleCancelCompanyChange = handleCancelCompanyChange;
window.exportCancellationsExcel = exportCancellationsExcel;
