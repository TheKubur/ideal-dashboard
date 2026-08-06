// ====== TEMSİLCİ ATAMA LOGIC ======
function listenToCompanyAssignments() {
  const unsub = db.collection('company_assignments').onSnapshot(snap => {
    companyAssignments = {};
    snap.forEach(doc => { companyAssignments[doc.id] = doc.data().assignedMembers || []; });
    if (document.getElementById('tab-companies').classList.contains('active')) renderCompanies();
  });
  unsubscribeFns.push(unsub);
}

let assignTargetCompany = '';
function openAssignModal(company) {
  assignTargetCompany = company;
  const assigned = companyAssignments[company] || [];
  const html = TEAM_DEF.map(m => `
      <label style="display:flex;align-items:center;gap:0.5rem;padding:0.6rem;border:1px solid var(--border);border-radius:8px;cursor:pointer;background:var(--bg)">
         <input type="checkbox" class="assign-cb" value="${m.id}" ${assigned.includes(m.id) ? 'checked' : ''} style="width:16px;height:16px">
         <span class="avatar" style="width:28px;height:28px;font-size:0.75rem;background:${m.deptColor}22;color:${m.deptColor};border-radius:6px">${m.initials}</span>
         <span style="font-size:0.88rem;font-weight:500;color:var(--ink)">${m.name}</span>
      </label>
   `).join('');
  document.getElementById('assignModalBody').innerHTML = html;
  document.getElementById('assignModalTitle').textContent = company;
  document.getElementById('assignModal').classList.remove('hidden');
}

function saveAssignments() {
  const cbs = document.querySelectorAll('.assign-cb:checked');
  const members = Array.from(cbs).map(cb => cb.value);
  const btn = document.getElementById('assignSaveBtn');
  btn.textContent = 'Kaydediliyor...'; btn.disabled = true;
  db.collection('company_assignments').doc(assignTargetCompany).set({ assignedMembers: members })
    .then(() => {
      showToast('Temsilciler atandı!', 'success');
      document.getElementById('assignModal').classList.add('hidden');
    })
    .catch(e => showToast('Hata: ' + e.message, 'error'))
    .finally(() => { btn.textContent = 'Kaydet'; btn.disabled = false; });
}

