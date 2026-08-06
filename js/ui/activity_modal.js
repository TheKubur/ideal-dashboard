function populateCompanyDropdown(selectedVal) {
  const actCompanies = [...new Set(allActivities.map(a => a.company).filter(c => c && !COMPANIES.includes(c)))].sort();
  const allCompanies = [...new Set([...COMPANIES, ...actCompanies])].sort();

  let visibleCompanies = allCompanies;
  if (currentUser && currentUser.role !== 'admin') {
    visibleCompanies = allCompanies.filter(c => {
      if (companyAssignments[c] && companyAssignments[c].includes(currentUser.memberId)) return true;
      return false;
    });
  }

  const sel = document.getElementById('modalCompany');
  sel.innerHTML = '<option value="">-- Kurum Seç --</option>' +
    visibleCompanies.map(c => `<option value="${c}" ${c === selectedVal ? 'selected' : ''}>${c}</option>`).join('') +
    '<option value="__yeni__">+ Yeni Kurum Ekle</option>';
}

function handleCompanyChange() {
  const val = document.getElementById('modalCompany').value;
  const customEl = document.getElementById('modalCompanyCustom');
  if (val === '__yeni__') { customEl.classList.remove('hidden'); customEl.focus(); }
  else customEl.classList.add('hidden');
}

function openModal(mid, dateStr, defaultField) {
  modalMemberId = mid;
  editActivityId = null;
  const m = TEAM_DEF.find(x => x.id === mid) || {
    id: 'admin',
    name: currentUser.name,
    initials: currentUser.initials,
    deptColor: '#0f172a',
    avatarBg: '#e2e8f0',
    dept: 'Yönetim',
    fields: [
      { key: 'randevu', label: 'Randevu', emoji: '📅', hasTarget: true },
      { key: 'diger', label: 'Diğer', emoji: '📌', hasTarget: false }
    ]
  };
  document.getElementById('modalTitle').textContent = m.name + ' — Aktivite Ekle';
  document.getElementById('modalSub').textContent = 'Yaptığın işi kaydet, sayaç otomatik artar';
  document.getElementById('modalField').innerHTML = m.fields.map(f => `<option value="${f.key}">${f.emoji} ${f.label}</option>`).join('');
  if (defaultField) {
    document.getElementById('modalField').value = defaultField;
  }
  populateCompanyDropdown('');
  document.getElementById('modalCompanyCustom').classList.add('hidden');
  document.getElementById('modalCompanyCustom').value = '';
  document.getElementById('modalStatus').value = 'Tamamlandı';
  document.getElementById('modalDesc').value = '';
  document.getElementById('modalDate').value = dateStr || new Date().toISOString().split('T')[0];
  document.getElementById('modalTimeStart').value = '09:00';
  document.getElementById('modalTimeEnd').value = '09:30';
  document.getElementById('modalNextStep').value = '';
  document.getElementById('modalSaveBtn').textContent = 'Kaydet';
  const cb = document.getElementById('modalIsOkr');
  if (cb) cb.checked = false;
  const delBtn = document.getElementById('activityDeleteBtn');
  if (delBtn) delBtn.style.display = 'none';
  document.getElementById('activityModal').classList.remove('hidden');
  handleFieldChange();
}

let editDealId = null;

function handleFieldChange() {
  const f = document.getElementById('modalField').value;
  const wrap = document.getElementById('modalPriceWrap');
  if (f === 'teklif') {
    wrap.classList.remove('hidden');
  } else {
    wrap.classList.add('hidden');
    document.getElementById('modalPrice').value = '';
  }

  const okrWrap = document.getElementById('modalOkrWrap');
  if (okrWrap) {
    const m = TEAM_DEF.find(x => x.id === modalMemberId);
    if (m && m.dept === 'Satış' && f === 'teklif') {
      okrWrap.classList.remove('hidden');
    } else {
      okrWrap.classList.add('hidden');
      const cb = document.getElementById('modalIsOkr');
      if (cb) cb.checked = false;
    }
  }
}

function openEditModal(actId) {
  const a = allActivities.find(x => x.id === actId);
  if (!a) return;
  editActivityId = actId;
  modalMemberId = a.memberId;
  const m = TEAM_DEF.find(x => x.id === a.memberId) || {
    id: 'admin',
    name: currentUser.name,
    initials: currentUser.initials,
    deptColor: '#0f172a',
    avatarBg: '#e2e8f0',
    dept: 'Yönetim',
    fields: [
      { key: 'randevu', label: 'Randevu', emoji: '📅', hasTarget: true },
      { key: 'diger', label: 'Diğer', emoji: '📌', hasTarget: false }
    ]
  };
  document.getElementById('modalTitle').textContent = 'Aktiviteyi Düzenle';
  document.getElementById('modalSub').textContent = m.name + ' · ' + a.fieldLabel;
  document.getElementById('modalField').innerHTML = m.fields.map(f => `<option value="${f.key}" ${f.key === a.fieldKey ? 'selected' : ''}>${f.emoji} ${f.label}</option>`).join('');
  populateCompanyDropdown(a.company || '');
  document.getElementById('modalCompanyCustom').classList.add('hidden');
  document.getElementById('modalStatus').value = a.status || 'Tamamlandı';
  document.getElementById('modalDesc').value = a.desc || '';
  document.getElementById('modalNextStep').value = a.nextStep || '';
  const cb = document.getElementById('modalIsOkr');
  if (cb) cb.checked = a.isOkr || false;
  document.getElementById('modalVIP').checked = a.vip || false;
  document.getElementById('modalDate').value = a.date || '';
  document.getElementById('modalTimeStart').value = a.timeStart || '09:00';
  document.getElementById('modalTimeEnd').value = a.timeEnd || '09:30';
  document.getElementById('modalSaveBtn').textContent = 'Güncelle';

  const delBtn = document.getElementById('activityDeleteBtn');
  if (currentUser.role === 'admin') delBtn.style.display = 'block';
  else delBtn.style.display = 'none';

  document.getElementById('activityModal').classList.remove('hidden');
  handleFieldChange();
}

function closeModal() {
  document.getElementById('activityModal').classList.add('hidden');
  modalMemberId = null;
  editActivityId = null;
}

function saveModalAction() {
  if (editActivityId) saveEdit();
  else saveActivity();
}

function deleteActivity() {
  if (!editActivityId) return;
  if (currentUser.role !== 'admin') return;
  if (!confirm('Bu aktiviteyi ve ilişkili istatistiğini tamamen silmek istediğinize emin misiniz?')) return;

  const actId = editActivityId;
  const a = allActivities.find(x => x.id === actId);
  if (!a) return;

  db.collection('activities').doc(actId).delete()
    .then(() => {
      showToast('Aktivite silindi.', 'success');
      const m = TEAM_DEF.find(x => x.id === a.memberId) || {
        id: 'admin',
        name: currentUser.name,
        initials: currentUser.initials,
        deptColor: '#0f172a',
        avatarBg: '#e2e8f0',
        dept: 'Yönetim',
        fields: [
          { key: 'randevu', label: 'Randevu', emoji: '📅', hasTarget: true },
          { key: 'diger', label: 'Diğer', emoji: '📌', hasTarget: false }
        ]
      };
      const f = m.fields.find(f => f.key === a.fieldKey);
      if (!f.noCount && liveData[a.memberId]) {
        liveData[a.memberId][a.fieldKey].actual = Math.max(0, (liveData[a.memberId][a.fieldKey].actual || 0) - 1);
        const dashData = { memberId: a.memberId, period: currentPeriod, updatedAt: new Date().toISOString() };
        m.fields.forEach(fld => { dashData[fld.key] = liveData[a.memberId][fld.key]; });
        db.collection('dashboard').doc(`${currentPeriod}_${a.memberId}`).set(dashData);
      }
      closeModal();
    }).catch(e => showToast('Hata: ' + e.message, 'error'));
}

function getCompanyValue() {
  const sel = document.getElementById('modalCompany').value;
  if (sel === '__yeni__') return document.getElementById('modalCompanyCustom').value.trim();
  return sel;
}

function saveActivity() {
  const fieldKey = document.getElementById('modalField').value;
  const company = getCompanyValue();
  const status = document.getElementById('modalStatus').value;
  const desc = document.getElementById('modalDesc').value.trim();
  const nextStep = document.getElementById('modalNextStep').value.trim();
  const vip = document.getElementById('modalVIP').checked;
  const date = document.getElementById('modalDate').value;
  const timeStart = document.getElementById('modalTimeStart').value || '09:00';
  const timeEnd = document.getElementById('modalTimeEnd').value || '09:30';
  if (!desc) { showToast('Lütfen bir açıklama gir.', 'error'); return; }
  const m = TEAM_DEF.find(x => x.id === modalMemberId) || {
    id: 'admin',
    name: currentUser.name,
    initials: currentUser.initials,
    deptColor: '#0f172a',
    avatarBg: '#e2e8f0',
    dept: 'Yönetim',
    fields: [
      { key: 'randevu', label: 'Randevu', emoji: '📅', hasTarget: true },
      { key: 'diger', label: 'Diğer', emoji: '📌', hasTarget: false }
    ]
  };
  const field = m.fields.find(f => f.key === fieldKey);
  const isOkr = document.getElementById('modalIsOkr') ? document.getElementById('modalIsOkr').checked : false;
  const price = parseInt(document.getElementById('modalPrice').value) || 0;

  db.collection('activities').add({
    memberId: modalMemberId, memberName: m.name, memberInitials: m.initials,
    memberColor: m.deptColor, memberBg: m.avatarBg, dept: m.dept,
    fieldKey, fieldLabel: field.label, fieldEmoji: field.emoji,
    company, status, desc, nextStep, vip, date, timeStart, timeEnd, period: currentPeriod, createdAt: new Date().toISOString(),
    isOkr,
    value: price
  }).then(() => {
    // Yeni kurulan şirketi bu temsilciye otomatik kilitle
    if (company && (!companyAssignments[company] || !companyAssignments[company].includes(modalMemberId))) {
      db.collection('company_assignments').doc(company).set({
        assignedMembers: firebase.firestore.FieldValue.arrayUnion(modalMemberId)
      }, { merge: true });
    }
  }).then(() => {
    // OTOMATİK PIPELINE CREATE / UPDATE (Müşteri Ziyareti / Teklif)
    if (fieldKey === 'teklif') {
      const existingDeal = allDeals.find(d => d.company === company && d.stage === 'Toplantı');
      if (existingDeal) {
        db.collection('deals').doc(existingDeal.id).update({
          stage: 'Teklif Gönderildi', value: price, desc, updatedAt: new Date().toISOString()
        });
      } else {
        db.collection('deals').add({
          company, stage: 'Teklif Gönderildi', value: price, desc,
          memberId: modalMemberId, memberName: m.name, memberInitials: m.initials, memberColor: m.deptColor,
          period: currentPeriod, createdAt: new Date().toISOString()
        });
      }
    } else if (fieldKey === 'randevu') {
      const existingDeal = allDeals.find(d => d.company === company && d.stage !== 'Faturalandırıldı');
      if (!existingDeal) {
        db.collection('deals').add({
          company, stage: 'Toplantı', value: 0, desc,
          memberId: modalMemberId, memberName: m.name, memberInitials: m.initials, memberColor: m.deptColor,
          period: currentPeriod, createdAt: new Date().toISOString()
        });
      }
    }

    if (!field.noCount && liveData[modalMemberId]) {
      const newActual = (liveData[modalMemberId][fieldKey]?.actual || 0) + 1;
      liveData[modalMemberId][fieldKey].actual = newActual;
      const dashData = { memberId: modalMemberId, period: currentPeriod, updatedAt: new Date().toISOString() };
      m.fields.forEach(f => { dashData[f.key] = liveData[modalMemberId][f.key]; });
      return db.collection('dashboard').doc(`${currentPeriod}_${modalMemberId}`).set(dashData);
    }
  }).then(() => {
    closeModal();
    showToast('Aktivite başarıyla eklendi!', 'success');
    if (vip) setTimeout(() => triggerConfetti(), 400);
  }).catch(e => showToast('Hata: ' + e.message, 'error'));
}

function saveEdit() {
  const a = allActivities.find(x => x.id === editActivityId);
  if (!a) return;
  const desc = document.getElementById('modalDesc').value.trim();
  if (!desc) { showToast('Açıklama boş olamaz.', 'error'); return; }
  const newFieldKey = document.getElementById('modalField').value;
  const oldFieldKey = a.fieldKey;
  const m = TEAM_DEF.find(x => x.id === a.memberId) || {
    id: 'admin',
    name: currentUser.name,
    initials: currentUser.initials,
    deptColor: '#0f172a',
    avatarBg: '#e2e8f0',
    dept: 'Yönetim',
    fields: [
      { key: 'randevu', label: 'Randevu', emoji: '📅', hasTarget: true },
      { key: 'diger', label: 'Diğer', emoji: '📌', hasTarget: false }
    ]
  };
  const newField = m.fields.find(f => f.key === newFieldKey);
  const oldField = m.fields.find(f => f.key === oldFieldKey);
  const now = new Date().toISOString();

  const categoryChanged = newFieldKey !== oldFieldKey;
  const isOkr = document.getElementById('modalIsOkr') ? document.getElementById('modalIsOkr').checked : false;
  const price = parseInt(document.getElementById('modalPrice').value) || 0;

  db.collection('activities').doc(editActivityId)
    .collection('history').add({ ...a, savedAt: now, savedBy: currentUser.name })
    .then(() => {
      return db.collection('activities').doc(editActivityId).set({
        ...a, fieldKey: newFieldKey, fieldLabel: newField.label, fieldEmoji: newField.emoji,
        company: getCompanyValue(),
        status: document.getElementById('modalStatus').value,
        nextStep: document.getElementById('modalNextStep').value.trim(),
        vip: document.getElementById('modalVIP').checked,
        desc, date: document.getElementById('modalDate').value,
        timeStart: document.getElementById('modalTimeStart').value || '09:00',
        timeEnd: document.getElementById('modalTimeEnd').value || '09:30',
        editedAt: now, editedBy: currentUser.name,
        isOkr,
        value: price
      });
    }).then(() => {
      if (categoryChanged) {
        if (oldField && !oldField.noCount && liveData[a.memberId]) {
          liveData[a.memberId][oldFieldKey].actual = Math.max(0, (liveData[a.memberId][oldFieldKey]?.actual || 1) - 1);
        }
        if (newField && !newField.noCount && liveData[a.memberId]) {
          liveData[a.memberId][newFieldKey].actual = (liveData[a.memberId][newFieldKey]?.actual || 0) + 1;
        }
        if (liveData[a.memberId]) {
          const dashData = { memberId: a.memberId, period: currentPeriod, updatedAt: now };
          m.fields.forEach(f => { dashData[f.key] = liveData[a.memberId][f.key]; });
          return db.collection('dashboard').doc(`${currentPeriod}_${a.memberId}`).set(dashData);
        }
      }
    }).then(() => {
      closeModal();
      showToast('Aktivite güncellendi.', 'success');
    }).catch(e => showToast('Düzenlenemedi: ' + e.message, 'error'));
}

function deleteActivity(actId, mid, fieldKey) {
  if (!confirm('Bu aktiviteyi silmek istediğine emin misin?')) return;
  const m = TEAM_DEF.find(x => x.id === mid) || {
    id: 'admin',
    name: currentUser.name,
    initials: currentUser.initials,
    deptColor: '#0f172a',
    avatarBg: '#e2e8f0',
    dept: 'Yönetim',
    fields: [
      { key: 'randevu', label: 'Randevu', emoji: '📅', hasTarget: true },
      { key: 'diger', label: 'Diğer', emoji: '📌', hasTarget: false }
    ]
  };
  const field = m?.fields.find(f => f.key === fieldKey);
  db.collection('activities').doc(actId).delete().then(() => {
    if (!field?.noCount && liveData[mid]) {
      const newActual = Math.max(0, (liveData[mid][fieldKey]?.actual || 1) - 1);
      liveData[mid][fieldKey].actual = newActual;
      const dashData = { memberId: mid, period: currentPeriod, updatedAt: new Date().toISOString() };
      m.fields.forEach(f => { dashData[f.key] = liveData[mid][f.key]; });
      return db.collection('dashboard').doc(`${currentPeriod}_${mid}`).set(dashData);
    }
  }).then(() => showToast('Aktivite silindi.', 'warning'))
    .catch(e => showToast('Silinemedi: ' + e.message, 'error'));
}

function filterActivity(filter, btn) {
  currentFilter = filter;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderActivities();
}

