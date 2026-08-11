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
  ['kanban', 'new', 'onetime', 'whitelabel', 'analytics', 'newcompanies'].forEach(t => {
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
  else if (tab === 'newcompanies') switchNewCompSubtab(currentNewCompSubtab);
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
      if (compSel && p.company) {
        const exists = [...compSel.options].some(o => o.value === p.company);
        if (!exists) {
          const opt = document.createElement('option');
          opt.value = p.company; opt.textContent = p.company;
          compSel.insertBefore(opt, compSel.lastElementChild);
        }
        compSel.value = p.company;
      }
      document.getElementById('projName').value = p.name || '';
      document.getElementById('projValue').value = p.value || '';
      document.getElementById('projPro').value = p.pro || '';
      document.getElementById('projCep').value = p.cep || '';
      document.getElementById('projNote').value = p.note || '';
    }
    if (delBtn) delBtn.style.display = (currentUser && (currentUser.role === 'admin' || currentUser.role !== 'viewer')) ? 'block' : 'none';
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

/* ── YENİ EKLENEN MÜŞTERİLER RAPORU ── */
let newCompaniesFilter = 'month';
let allCachedActivitiesForReport = [];

function renderNewCompaniesReport() {
  const container = document.getElementById('newCompaniesReportList');
  if (!container) return;

  container.innerHTML = '<tr><td colspan="5" style="text-align:center; color:var(--ink3); padding:2rem;">Veriler sorgulanıyor... ⏳</td></tr>';

  db.collection('activities').get()
    .then(snap => {
      const activities = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      allCachedActivitiesForReport = activities;
      displayNewCompanies();
    })
    .catch(err => {
      console.error('Yeni müşteriler rapor hatası:', err);
      container.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#e63946; padding:2rem;">Veriler yüklenirken hata oluştu!</td></tr>';
    });
}

function filterNewCompanies(period) {
  newCompaniesFilter = period;
  
  ['month', 'year', 'all'].forEach(p => {
    const btn = document.getElementById('btnCompPeriod-' + p);
    if (btn) {
      if (p === period) {
        btn.style.background = 'var(--accent)';
        btn.style.color = 'white';
        btn.style.border = 'none';
      } else {
        btn.style.background = 'var(--bg)';
        btn.style.color = 'var(--ink2)';
        btn.style.border = '1px solid var(--border)';
      }
    }
  });
  
  displayNewCompanies();
}

function displayNewCompanies() {
  const container = document.getElementById('newCompaniesReportList');
  if (!container) return;

  if (!allCachedActivitiesForReport.length) {
    container.innerHTML = '<tr><td colspan="5" style="text-align:center; color:var(--ink3); padding:2rem;">Kayıtlı aktivite bulunamadı.</td></tr>';
    return;
  }

  const companyFirstContact = {};
  allCachedActivitiesForReport.forEach(act => {
    const comp = act.company;
    if (!comp) return;
    
    const actDate = new Date(act.date);
    if (isNaN(actDate.getTime())) return;

    if (!companyFirstContact[comp] || actDate < new Date(companyFirstContact[comp].date)) {
      companyFirstContact[comp] = {
        company: comp,
        date: act.date,
        memberName: act.memberName,
        memberId: act.memberId,
        desc: act.desc || '—',
        createdAt: act.createdAt
      };
    }
  });

  let result = Object.values(companyFirstContact);
  const now = new Date();
  const currentYearNum = now.getFullYear();
  const currentMonthNum = now.getMonth();

  if (newCompaniesFilter === 'month') {
    result = result.filter(c => {
      const d = new Date(c.date);
      return d.getFullYear() === currentYearNum && d.getMonth() === currentMonthNum;
    });
  } else if (newCompaniesFilter === 'year') {
    result = result.filter(c => {
      const d = new Date(c.date);
      return d.getFullYear() === currentYearNum;
    });
  }

  result.sort((a, b) => new Date(b.date) - new Date(a.date));

  if (!result.length) {
    container.innerHTML = '<tr><td colspan="5" style="text-align:center; color:var(--ink3); padding:2rem;">Belirtilen dönemde yeni eklenen müşteri bulunamadı. 📭</td></tr>';
    return;
  }

  const fmtDate = (s) => { if (!s) return ''; const p = s.split('-'); return `${p[2]}.${p[1]}.${p[0]}`; };

  container.innerHTML = result.map(c => {
    const memberColor = c.memberId === 'admin' ? '#0d1f61' : (TEAM_DEF.find(x => x.id === c.memberId)?.deptColor || '#ccc');
    return `
      <tr>
        <td style="font-weight:700; color:var(--ink); font-size:0.88rem;">${c.company}</td>
        <td style="font-weight:600;">📅 ${fmtDate(c.date)}</td>
        <td>
          <div class="crm-person">
            <span class="crm-person-dot" style="background:${memberColor}"></span>
            ${c.memberName}
          </div>
        </td>
        <td style="color:var(--ink2); max-width:300px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${c.desc}">${c.desc}</td>
        <td style="text-align:right;">
          <button class="crm-action-btn" onclick="showCompanyDetail('${c.company.replace(/'/g, "\\'")}')" style="background:var(--bg); border:1px solid var(--border); color:var(--ink2); padding:0.35rem 0.75rem; border-radius:6px; font-size:0.78rem; cursor:pointer;">🔍 Detaylar</button>
        </td>
      </tr>
    `;
  }).join('');
}

/* ── SUBTAB SWITCH MANTIGI ── */
let currentNewCompSubtab = 'auto';

function switchNewCompSubtab(subtab) {
  currentNewCompSubtab = subtab;
  
  const btnAuto = document.getElementById('btnCompSubtab-auto');
  const btnManual = document.getElementById('btnCompSubtab-manual');
  
  if (btnAuto && btnManual) {
    if (subtab === 'auto') {
      btnAuto.classList.add('active');
      btnAuto.style.background = 'var(--accent)';
      btnAuto.style.color = 'white';
      btnManual.classList.remove('active');
      btnManual.style.background = 'transparent';
      btnManual.style.color = 'var(--ink2)';
    } else {
      btnManual.classList.add('active');
      btnManual.style.background = 'var(--accent)';
      btnManual.style.color = 'white';
      btnAuto.classList.remove('active');
      btnAuto.style.background = 'transparent';
      btnAuto.style.color = 'var(--ink2)';
    }
  }

  const viewAuto = document.getElementById('newcomp-auto-view');
  const viewManual = document.getElementById('newcomp-manual-view');
  if (viewAuto) viewAuto.style.display = subtab === 'auto' ? 'block' : 'none';
  if (viewManual) viewManual.style.display = subtab === 'manual' ? 'block' : 'none';

  if (subtab === 'manual') {
    listenToManualCustomers();
  } else {
    renderNewCompaniesReport();
  }
}

/* ── MANUEL MUSTERI EKLEME MODAL VE KAYDETME ── */
function openManualCustomerModal() {
  const modal = document.getElementById('manualCustomerModal');
  if (!modal) return;

  const dateInput = document.getElementById('manCustDate');
  if (dateInput) {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    dateInput.value = `${yyyy}-${mm}-${dd}`;
  }

  const select = document.getElementById('manCustMemberSelect');
  if (select) {
    select.innerHTML = '<option value="admin">Hüseyin Kubur</option>';
    TEAM_DEF.forEach(m => {
      select.innerHTML += `<option value="${m.id}">${m.name}</option>`;
    });
    if (currentUser) {
      select.value = currentUser.memberId || 'admin';
    }
  }

  const compInput = document.getElementById('manCustCompany');
  const noteInput = document.getElementById('manCustNote');
  if (compInput) compInput.value = '';
  if (noteInput) noteInput.value = '';

  modal.classList.remove('hidden');
}

function closeManualCustomerModal() {
  const modal = document.getElementById('manualCustomerModal');
  if (modal) modal.classList.add('hidden');
}

function saveManualCustomer() {
  const companyInput = document.getElementById('manCustCompany');
  const dateInput = document.getElementById('manCustDate');
  const memberSelect = document.getElementById('manCustMemberSelect');
  const noteInput = document.getElementById('manCustNote');
  const saveBtn = document.getElementById('manCustSaveBtn');

  if (!companyInput || !dateInput || !memberSelect || !noteInput || !saveBtn) return;

  const company = companyInput.value.trim().toUpperCase();
  const date = dateInput.value;
  const memberId = memberSelect.value;
  const desc = noteInput.value.trim();

  if (!company) {
    showToast('Lütfen müşteri adını girin!', 'warning');
    return;
  }
  if (!date) {
    showToast('Lütfen tarihi seçin!', 'warning');
    return;
  }

  saveBtn.disabled = true;
  saveBtn.textContent = 'Kaydediliyor...';

  const m = TEAM_DEF.find(x => x.id === memberId);
  const memberName = memberId === 'admin' ? 'Hüseyin Kubur' : (m ? m.name : 'Bilinmiyor');

  db.collection('manual_new_customers').add({
    company,
    date,
    memberId,
    memberName,
    desc,
    createdAt: new Date().toISOString(),
    addedBy: currentUser ? currentUser.name : 'Sistem'
  })
  .then(() => {
    showToast('Yeni müşteri başarıyla eklendi! 🎉', 'success');
    closeManualCustomerModal();
  })
  .catch(err => {
    console.error('Manuel müşteri ekleme hatası:', err);
    showToast('Hata: ' + err.message, 'error');
  })
  .finally(() => {
    saveBtn.disabled = false;
    saveBtn.textContent = 'Kaydet';
  });
}

/* ── MANUEL FIRESTORE LISTENER ── */
let manualCustomers = [];
let isManualListenerActive = false;

function listenToManualCustomers() {
  if (isManualListenerActive) {
    renderManualCompaniesList();
    return;
  }

  const container = document.getElementById('manualCompaniesReportList');
  if (container) {
    container.innerHTML = '<tr><td colspan="5" style="text-align:center; color:var(--ink3); padding:2rem;">Yükleniyor... ⏳</td></tr>';
  }

  const unsub = db.collection('manual_new_customers')
    .onSnapshot(snap => {
      manualCustomers = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).sort((a, b) => new Date(b.date) - new Date(a.date));
      
      isManualListenerActive = true;
      renderManualCompaniesList();
    }, err => {
      console.error('Manuel müşteri dinleme hatası:', err);
    });

  globalUnsubscribeFns.push(unsub);
}

function renderManualCompaniesList() {
  const container = document.getElementById('manualCompaniesReportList');
  if (!container) return;

  if (!manualCustomers.length) {
    container.innerHTML = '<tr><td colspan="5" style="text-align:center; color:var(--ink3); padding:2rem;">Manuel olarak eklenmiş müşteri kaydı bulunmuyor. 📭</td></tr>';
    return;
  }

  const fmtDate = (s) => { if (!s) return ''; const p = s.split('-'); return `${p[2]}.${p[1]}.${p[0]}`; };
  const isAdmin = currentUser && currentUser.role === 'admin';

  container.innerHTML = manualCustomers.map(c => {
    const memberColor = c.memberId === 'admin' ? '#0d1f61' : (TEAM_DEF.find(x => x.id === c.memberId)?.deptColor || '#ccc');
    const deleteBtn = isAdmin 
      ? `<button class="crm-action-btn" onclick="deleteManualCustomer('${c.id}')" style="background:#fee2e2; border:1px solid #fca5a5; color:#dc2626; padding:0.35rem 0.75rem; border-radius:6px; font-size:0.78rem; cursor:pointer; margin-right:4px;">🗑️ Sil</button>`
      : '';
      
    return `
      <tr>
        <td style="font-weight:700; color:var(--ink); font-size:0.88rem;">${c.company}</td>
        <td style="font-weight:600;">📅 ${fmtDate(c.date)}</td>
        <td>
          <div class="crm-person">
            <span class="crm-person-dot" style="background:${memberColor}"></span>
            ${c.memberName}
          </div>
        </td>
        <td style="color:var(--ink2); max-width:300px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${c.desc || '—'}">${c.desc || '—'}</td>
        <td style="text-align:right; white-space:nowrap;">
          ${deleteBtn}
          <button class="crm-action-btn" onclick="showCompanyDetail('${c.company.replace(/'/g, "\\'")}')" style="background:var(--bg); border:1px solid var(--border); color:var(--ink2); padding:0.35rem 0.75rem; border-radius:6px; font-size:0.78rem; cursor:pointer;">🔍 Detaylar</button>
        </td>
      </tr>
    `;
  }).join('');
}

function deleteManualCustomer(id) {
  if (!confirm('Bu manuel müşteri kaydını silmek istediğinizden emin misiniz?')) return;
  
  db.collection('manual_new_customers').doc(id).delete()
    .then(() => {
      showToast('Kayıt başarıyla silindi.', 'success');
    })
    .catch(err => {
      console.error('Silme hatası:', err);
      showToast('Hata: ' + err.message, 'error');
    });
}

