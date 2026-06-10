let companyDetailPage = 0;
const COMPANY_PAGE_SIZE = 8;
let companyDetailActs = [];
let currentCompanyView = '';

function showCompanyDetail(company) {
  if (!company) return;
  currentCompanyView = company;
  companyDetailActs = allActivities.filter(a => a.company === company);
  companyDetailPage = 0;
  const modal = document.getElementById('companyModal');
  document.getElementById('companyModalTitle').textContent = company;
  const done = companyDetailActs.filter(a => a.status === 'Tamamlandı').length;
  const takip = companyDetailActs.filter(a => a.status === 'Takip').length;
  const bekle = companyDetailActs.filter(a => a.status === 'Beklemede').length;
  const isVip = companyDetailActs.some(a => a.vip);
  document.getElementById('companyModalSub').textContent = `${companyDetailActs.length} kayıt · ${done} tamamlandı · ${takip} takip · ${bekle} beklemede ${isVip ? '· ⭐ VIP' : ''}`;

  const noteText = document.getElementById('companyModalNoteText');
  const noteBtn = document.getElementById('companyModalNoteBtn');
  if (noteText && noteBtn && currentUser) {
    const uid = currentUser.memberId || 'admin';
    noteText.value = 'Yükleniyor...';
    noteText.disabled = true;
    noteBtn.disabled = true;
    db.collection('company_notes').doc(uid + '_' + company).get().then(doc => {
      if (doc.exists) noteText.value = doc.data().text || '';
      else noteText.value = '';
    }).catch(() => { noteText.value = ''; }).finally(() => {
      noteText.disabled = false;
      noteBtn.disabled = false;
    });
  }

  renderCompanyPage();
  modal.classList.remove('hidden');
}

function saveCompanyNote() {
  if (!currentCompanyView || !currentUser) return;
  const uid = currentUser.memberId || 'admin';
  const text = document.getElementById('companyModalNoteText').value.trim();
  const btn = document.getElementById('companyModalNoteBtn');
  btn.textContent = 'Kaydediliyor...';
  btn.disabled = true;

  db.collection('company_notes').doc(uid + '_' + currentCompanyView).set({
    memberId: uid,
    company: currentCompanyView,
    text: text,
    updatedAt: new Date().toISOString()
  }).then(() => {
    showToast('Kurum notu kaydedildi.', 'success');
    btn.textContent = '✓ Kaydedildi';
    btn.style.background = 'var(--green)';
  }).catch(e => {
    showToast('Hata: ' + e.message, 'error');
    btn.textContent = 'Hata!';
  }).finally(() => {
    setTimeout(() => {
      btn.textContent = '💾 Kaydet';
      btn.style.background = 'var(--btn-bg)';
      btn.disabled = false;
    }, 2000);
  });
}

function renderCompanyPage() {
  const body = document.getElementById('companyModalBody');
  if (!companyDetailActs.length) { body.innerHTML = '<div style="text-align:center;color:var(--ink3);padding:1rem">Kayıt bulunamadı</div>'; return; }
  const start = companyDetailPage * COMPANY_PAGE_SIZE;
  const page = companyDetailActs.slice(start, start + COMPANY_PAGE_SIZE);
  const totalPages = Math.ceil(companyDetailActs.length / COMPANY_PAGE_SIZE);
  body.innerHTML = page.map(a => {
    const statusClass = a.status === 'Tamamlandı' ? 'status-done' : a.status === 'Takip' ? 'status-takip' : 'status-beklemede';
    const statusIcon = a.status === 'Tamamlandı' ? '✅' : a.status === 'Takip' ? '🔄' : '⏳';
    return `<div style="background:var(--bg);border-radius:10px;padding:0.85rem;margin-bottom:0.6rem;border-left:3px solid var(--border)">
      <div style="display:flex;align-items:center;gap:0.5rem;flex-wrap:wrap;margin-bottom:0.3rem">
        <span style="font-weight:600;font-size:0.82rem">${a.memberName}</span>
        <span class="status-badge ${statusClass}" style="font-size:0.68rem">${statusIcon} ${a.status}</span>
        <span style="font-size:0.7rem;color:var(--ink3);margin-left:auto">📅 ${a.date}</span>
      </div>
      <div style="font-size:0.82rem;color:var(--ink2)">${a.desc}</div>
      ${a.nextStep ? `<div style="font-size:0.75rem;color:var(--accent2);margin-top:0.3rem">→ ${a.nextStep}</div>` : ''}
      ${a.editedAt ? `<div style="font-size:0.68rem;color:var(--ink3);margin-top:0.3rem">✏️ ${a.editedBy || '?'} düzenledi</div>` : ''}
      <div style="display:flex;gap:0.5rem;margin-top:0.5rem;flex-wrap:wrap">
        ${canEditActivity(a.memberId) ? `<button onclick="document.getElementById('companyModal').classList.add('hidden');openEditModal('${a.id}')" style="background:none;border:1px solid var(--border);border-radius:6px;padding:0.2rem 0.6rem;font-size:0.7rem;color:var(--ink3);cursor:pointer">✏️ Düzenle</button>` : ''}
        <button onclick="toggleHistory('${a.id}')" style="background:none;border:1px dashed var(--border);border-radius:6px;padding:0.2rem 0.6rem;font-size:0.7rem;color:var(--ink3);cursor:pointer">🕐 Geçmiş</button>
      </div>
      <div id="hist-${a.id}" style="display:none;margin-top:0.5rem"></div>
    </div>`;
  }).join('');
  if (totalPages > 1) {
    body.innerHTML += `<div style="display:flex;align-items:center;justify-content:center;gap:0.75rem;margin-top:0.75rem">
      <button onclick="companyDetailPage--;renderCompanyPage()" ${companyDetailPage === 0 ? 'disabled style="opacity:0.4"' : ''} style="background:var(--bg);border:1px solid var(--border);border-radius:8px;padding:0.35rem 0.8rem;cursor:pointer;font-size:0.82rem">← Önceki</button>
      <span style="font-size:0.78rem;color:var(--ink3)">${companyDetailPage + 1} / ${totalPages}</span>
      <button onclick="companyDetailPage++;renderCompanyPage()" ${companyDetailPage >= totalPages - 1 ? 'disabled style="opacity:0.4"' : ''} style="background:var(--bg);border:1px solid var(--border);border-radius:8px;padding:0.35rem 0.8rem;cursor:pointer;font-size:0.82rem">Sonraki →</button>
    </div>`;
  }
}

function toggleHistory(actId) {
  const el = document.getElementById('hist-' + actId);
  if (el.style.display !== 'none') { el.style.display = 'none'; return; }
  el.innerHTML = '<div style="font-size:0.75rem;color:var(--ink3);padding:0.3rem">Yükleniyor...</div>';
  el.style.display = 'block';
  db.collection('activities').doc(actId).collection('history')
    .orderBy('savedAt', 'desc').get()
    .then(snap => {
      if (snap.empty) { el.innerHTML = '<div style="font-size:0.75rem;color:var(--ink3);padding:0.3rem">Geçmiş yok</div>'; return; }
      el.innerHTML = snap.docs.map(d => {
        const h = d.data();
        const statusIcon = h.status === 'Tamamlandı' ? '✅' : h.status === 'Takip' ? '🔄' : '⏳';
        return `<div style="background:var(--surface);border-radius:8px;padding:0.6rem;margin-bottom:0.4rem;border:1px solid var(--border);font-size:0.75rem">
          <div style="display:flex;gap:0.5rem;align-items:center;margin-bottom:0.2rem;flex-wrap:wrap">
            <span style="color:var(--ink3)">${h.savedAt ? h.savedAt.slice(0, 10) : '?'}</span>
            <span>${statusIcon} ${h.status || '—'}</span>
            <span style="color:var(--ink3);margin-left:auto">by ${h.savedBy || '?'}</span>
          </div>
          <div style="color:var(--ink2)">${h.desc || '—'}</div>
          ${h.nextStep ? `<div style="color:var(--accent2);margin-top:0.2rem">→ ${h.nextStep}</div>` : ''}
        </div>`;
      }).join('');
    }).catch(() => { el.innerHTML = '<div style="font-size:0.75rem;color:#e63946">Yüklenemedi</div>'; });
}

