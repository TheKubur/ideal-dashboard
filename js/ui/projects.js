// ====== PROJE RAPOR SİSTEMİ ======
let allProjects = [];
let editProjectId = null;
let currentReportType = 'kanban';

const MONTHS_ORDER = ['OCAK', 'ŞUBAT', 'MART', 'NİSAN', 'MAYIS', 'HAZİRAN', 'TEMMUZ', 'AĞUSTOS', 'EYLÜL', 'EKİM', 'KASIM', 'ARALIK'];

function listenToProjects(year) {
  const unsub = db.collection('projects').onSnapshot(snap => {
    let data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    allProjects = data.filter(p => (p.period || '').includes(year));
    const pipelineTab = document.getElementById('tabBtnPipeline');
    if (pipelineTab && pipelineTab.classList.contains('active')) {
      if (currentReportType === 'new') renderProjects('new');
      else if (currentReportType === 'onetime') renderProjects('onetime');
    }
  });
  globalUnsubscribeFns.push(unsub);
}

function switchReportTab(tab) {
  currentReportType = tab;
  ['kanban', 'new', 'onetime', 'whitelabel', 'analytics'].forEach(t => {
    const view = document.getElementById('report-view-' + t);
    const btn = document.getElementById('repTab-' + t);
    if (view) view.style.display = t === tab ? 'block' : 'none';
    if (btn) {
      if (t === tab) { btn.classList.add('active'); btn.style.background = 'var(--accent)'; btn.style.color = '#fff'; btn.style.borderColor = 'var(--accent)'; }
      else { btn.classList.remove('active'); btn.style.background = 'var(--bg)'; btn.style.color = 'var(--ink)'; btn.style.borderColor = 'var(--border)'; }
    }
  });

  const dealBtn = document.getElementById('btnNewDeal');
  const projBtn = document.getElementById('btnNewProject');
  const excelBtn = document.getElementById('btnExcelReport');
  const wlBtn = document.getElementById('btnNewWl');
  
  const isProjectTab = tab === 'new' || tab === 'onetime';
  const isWlTab = tab === 'whitelabel';
  const canAdd = currentUser && currentUser.role !== 'izleyici';
  
  if (dealBtn) dealBtn.style.display = tab === 'kanban' ? 'inline-block' : 'none';
  if (projBtn) projBtn.style.display = (isProjectTab && canAdd) ? 'inline-block' : 'none';
  if (wlBtn) wlBtn.style.display = (isWlTab && canAdd) ? 'inline-block' : 'none';
  if (excelBtn) excelBtn.style.display = (isProjectTab || isWlTab) ? 'inline-block' : 'none';
  if (tab === 'new') renderProjects('new');
  else if (tab === 'onetime') renderProjects('onetime');
  else if (tab === 'whitelabel') renderWhiteLabel();
}

function exportProjectsExcel() {
  if (typeof XLSX === 'undefined') { showToast('Excel kütüphanesi yüklenmedi.', 'error'); return; }
  const type = currentReportType;
  if (type === 'whitelabel') {
    exportWlExcel();
    return;
  }
  if (type === 'kanban' || type === 'analytics') return;
  const list = allProjects.filter(p => p.type === type);
  if (!list.length) { showToast('Tablo boş, dışa aktarılacak kayıt yok.', 'warning'); return; }

  const sheetName = type === 'new' ? 'Yeni Eklenen Projeler' : 'Tek Seferlik Projeler';
  const fileName = (type === 'new' ? 'yeni_eklenen_projeler' : 'tek_seferlik_projeler') + `_${currentPeriod}.xlsx`;

  const headers = ['AY', 'KURUM ADI', 'PROJE ADI', 'PROJE TUTARI (₺)', 'PRO', 'CEP', 'AÇIKLAMA'];
  const orderedMonths = MONTHS_ORDER.filter(m => list.some(p => p.month === m));
  const extra = [...new Set(list.map(p => p.month))].filter(m => !MONTHS_ORDER.includes(m));
  const rows = [];
  let grandTotal = 0;
  [...orderedMonths, ...extra].forEach(month => {
    const mRows = list.filter(p => p.month === month);
    const monthTotal = mRows.reduce((s, p) => s + (p.value || 0), 0);
    grandTotal += monthTotal;
    mRows.forEach(p => {
      rows.push([month, p.company || '', p.name || '', p.value || 0, p.pro || '', p.cep || '', p.note || '']);
    });
    rows.push([month + ' Toplamı', '', '', monthTotal, '', '', '']);
  });
  rows.push(['GENEL TOPLAM', '', '', grandTotal, '', '', '']);

  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  ws['!cols'] = [12, 28, 45, 16, 10, 10, 25].map(w => ({ wch: w }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  try {
    const b64 = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });
    const url = 'data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,' + b64;
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast('Excel dosyası indirildi! 📥', 'success');
  } catch (e) {
    showToast('İndirme hatası: ' + e.message, 'error');
  }
}

function renderProjects(type) {
  const containerId = type === 'new' ? 'proj-table-new' : 'proj-table-onetime';
  const container = document.getElementById(containerId);
  if (!container) return;
  const list = allProjects.filter(p => p.type === type);
  if (!list.length) {
    container.innerHTML = '<div style="text-align:center;padding:3rem;color:var(--ink3);font-size:0.9rem;">Henüz kayıt yok. + Yeni Satır Ekle butonuna tıkla.</div>';
    return;
  }
  const byMonth = {};
  list.forEach(p => { if (!byMonth[p.month]) byMonth[p.month] = []; byMonth[p.month].push(p); });
  const isAdmin = currentUser && currentUser.role !== 'izleyici';
  let html = `<div style="overflow-x:auto;border-radius:12px;border:1px solid var(--border);box-shadow:0 4px 20px rgba(0,0,0,0.08);margin-top:1rem;">
    <table style="width:100%;border-collapse:collapse;font-family:'Outfit',sans-serif;font-size:0.85rem;">
      <thead><tr style="background:#c8d8c4;color:#1a3a1a;font-weight:700;font-size:0.78rem;text-transform:uppercase;letter-spacing:0.05em;">
        <th style="padding:0.75rem 1rem;text-align:left;min-width:70px;">AY</th>
        <th style="padding:0.75rem 1rem;text-align:left;min-width:150px;">KURUM ADI</th>
        <th style="padding:0.75rem 1rem;text-align:left;min-width:280px;">PROJE ADI</th>
        <th style="padding:0.75rem 1rem;text-align:right;min-width:120px;">PROJE TUTARI</th>
        <th style="padding:0.75rem;text-align:center;min-width:55px;">PRO</th>
        <th style="padding:0.75rem;text-align:center;min-width:55px;">CEP</th>
        <th style="padding:0.75rem 1rem;text-align:left;min-width:140px;">AÇIKLAMA</th>
        ${isAdmin ? '<th style="padding:0.75rem;text-align:center;min-width:55px;">İŞLEM</th>' : ''}
      </tr></thead><tbody>`;
  let grandTotal = 0;
  const orderedMonths = MONTHS_ORDER.filter(m => byMonth[m]);
  const extra = Object.keys(byMonth).filter(m => !MONTHS_ORDER.includes(m));
  [...orderedMonths, ...extra].forEach((month, mi) => {
    const rows = byMonth[month];
    const monthTotal = rows.reduce((s, p) => s + (p.value || 0), 0);
    grandTotal += monthTotal;
    rows.forEach((p, ri) => {
      const bg = (mi + ri) % 2 === 0 ? 'var(--surface)' : 'var(--bg)';
      const eid = (p.id || '').replace(/'/g, "\\'");
      html += `<tr style="background:${bg};vertical-align:middle;cursor:${isAdmin ? 'pointer' : 'default'};" ${isAdmin ? `ondblclick="openProjectModal('${eid}')"` : ''}>
        ${ri === 0 ? `<td rowspan="${rows.length}" style="padding:0.65rem 1rem;font-weight:800;font-size:0.92rem;color:var(--ink);border-right:2px solid var(--border);text-align:center;vertical-align:middle;background:var(--bg);">${month}</td>` : ''}
        <td style="padding:0.65rem 1rem;font-weight:600;color:var(--ink);">${p.company || '—'}</td>
        <td style="padding:0.65rem 1rem;color:var(--ink2);line-height:1.5;">${p.name || '—'}</td>
        <td style="padding:0.65rem 1rem;text-align:right;font-weight:700;color:#1a472a;white-space:nowrap;">${p.value ? Number(p.value).toLocaleString('tr-TR') + ' ₺' : '—'}</td>
        <td style="padding:0.65rem;text-align:center;color:var(--ink3);">${p.pro || ''}</td>
        <td style="padding:0.65rem;text-align:center;color:var(--ink3);">${p.cep || ''}</td>
        <td style="padding:0.65rem 1rem;color:var(--ink3);font-size:0.8rem;">${p.note || ''}</td>
        ${isAdmin ? `<td style="padding:0.5rem;text-align:center;"><button onclick="openProjectModal('${eid}')" style="background:none;border:1px solid var(--border);border-radius:6px;cursor:pointer;font-size:0.75rem;padding:0.2rem 0.5rem;color:var(--ink3);">✏️</button></td>` : ''}
      </tr>`;
    });
    html += `<tr style="background:#e8ede6;">
      <td colspan="3" style="padding:0.5rem 1rem;text-align:right;font-size:0.78rem;color:var(--ink3);font-style:italic;">${month} Toplamı:</td>
      <td style="padding:0.5rem 1rem;text-align:right;font-weight:800;color:#1a472a;">${monthTotal.toLocaleString('tr-TR')} ₺</td>
      <td colspan="${isAdmin ? '4' : '3'}"></td>
    </tr>`;
  });
  html += `</tbody><tfoot><tr style="background:#a0c09a;font-weight:800;">
    <td colspan="3" style="padding:0.75rem 1rem;font-size:0.9rem;color:#0a2a0a;text-align:right;">GENEL TOPLAM</td>
    <td style="padding:0.75rem 1rem;font-size:1rem;color:#0a2a0a;text-align:right;">${grandTotal.toLocaleString('tr-TR')} ₺</td>
    <td colspan="${isAdmin ? '4' : '3'}"></td>
  </tr></tfoot></table></div>`;
  container.innerHTML = html;
}

function handleProjCompanyChange() {
  const sel = document.getElementById('projCompany');
  const ci = document.getElementById('projCompanyCustom');
  if (!ci) return;
  if (sel.value === '__yeni__') { ci.classList.remove('hidden'); ci.focus(); }
  else { ci.classList.add('hidden'); ci.value = ''; }
}

function openProjectModal(projId = null) {
  editProjectId = projId;
  const compSel = document.getElementById('projCompany');
  const actCompanies = Array.from(new Set(allActivities.map(a => a.company).filter(c => c)));
  const allComp = Array.from(new Set(COMPANIES.concat(actCompanies))).sort((a, b) => a.localeCompare(b, 'tr'));
  compSel.innerHTML = '<option value="">-- Kurum Seç --</option>' +
    allComp.map(c => `<option value="${c}">${c}</option>`).join('') +
    '<option value="__yeni__">+ Yeni Kurum Ekle...</option>';
  const ci = document.getElementById('projCompanyCustom');
  if (ci) { ci.classList.add('hidden'); ci.value = ''; }
  const delBtn = document.getElementById('projDeleteBtn');
  if (projId) {
    const p = allProjects.find(x => x.id === projId);
    if (p) {
      document.getElementById('projectModalTitle').textContent = 'Projeyi Düzenle';
      document.getElementById('projType').value = p.type || 'new';
      document.getElementById('projMonth').value = p.month || 'OCAK';
      document.getElementById('projCompany').value = p.company || '';
      document.getElementById('projName').value = p.name || '';
      document.getElementById('projValue').value = p.value || '';
      document.getElementById('projPro').value = p.pro || '';
      document.getElementById('projCep').value = p.cep || '';
      document.getElementById('projNote').value = p.note || '';
    }
    if (delBtn) delBtn.style.display = currentUser.role === 'admin' ? 'block' : 'none';
  } else {
    document.getElementById('projectModalTitle').textContent = 'Proje Ekle';
    document.getElementById('projType').value = currentReportType !== 'kanban' ? currentReportType : 'new';
    document.getElementById('projCompany').value = '';
    document.getElementById('projName').value = '';
    document.getElementById('projValue').value = '';
    document.getElementById('projPro').value = '';
    document.getElementById('projCep').value = '';
    document.getElementById('projNote').value = '';
    if (delBtn) delBtn.style.display = 'none';
    const normalize = s => s.toUpperCase().replace(/İ/g, 'I').replace(/Ğ/g, 'G').replace(/Ü/g, 'U').replace(/Ş/g, 'S').replace(/Ö/g, 'O').replace(/Ç/g, 'C');
    const pm = normalize((currentPeriod || '').split(' ')[0]);
    const matched = MONTHS_ORDER.find(m => normalize(m) === pm);
    document.getElementById('projMonth').value = matched || 'OCAK';
  }
  document.getElementById('projectModal').classList.remove('hidden');
}

function saveProject() {
  const type = document.getElementById('projType').value;
  const month = document.getElementById('projMonth').value;
  const selVal = document.getElementById('projCompany').value;
  const company = selVal === '__yeni__' ? (document.getElementById('projCompanyCustom')?.value.trim() || '') : selVal;
  if (selVal === '__yeni__' && !company) { showToast('Yeni kurum adını yazman gerekiyor!', 'warning'); return; }
  const name = document.getElementById('projName').value.trim();
  const value = parseFloat(document.getElementById('projValue').value) || 0;
  const pro = document.getElementById('projPro').value.trim();
  const cep = document.getElementById('projCep').value.trim();
  const note = document.getElementById('projNote').value.trim();
  if (!company) { showToast('Kurum seçmelisin!', 'warning'); return; }
  if (!name) { showToast('Proje adı gerekli!', 'warning'); return; }
  const btn = document.getElementById('projSaveBtn');
  btn.textContent = 'Kaydediliyor...'; btn.disabled = true;
  const data = { type, month, company, name, value, pro, cep, note, period: currentPeriod, updatedAt: new Date().toISOString() };
  const done = () => { showToast(editProjectId ? 'Proje güncellendi.' : 'Proje eklendi! ✅', 'success'); document.getElementById('projectModal').classList.add('hidden'); btn.textContent = 'Kaydet'; btn.disabled = false; };
  const fail = e => { showToast('Hata: ' + e.message, 'error'); btn.textContent = 'Kaydet'; btn.disabled = false; };
  if (editProjectId) {
    db.collection('projects').doc(editProjectId).update(data).then(done).catch(fail);
  } else {
    data.createdAt = new Date().toISOString();
    data.addedBy = currentUser.name;
    db.collection('projects').add(data).then(done).catch(fail);
  }
}

function deleteProject() {
  if (!editProjectId || currentUser.role !== 'admin') return;
  if (!confirm('Bu projeyi silmek istediğine emin misin?')) return;
  db.collection('projects').doc(editProjectId).delete()
    .then(() => { showToast('Proje silindi.', 'success'); document.getElementById('projectModal').classList.add('hidden'); })
    .catch(e => showToast('Hata: ' + e.message, 'error'));
}

