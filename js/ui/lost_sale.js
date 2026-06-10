let activeLostSaleMemberId = null;

function listenToLostSaleNotes(period) {
  const unsub = db.collection('lost_sale_notes').where('period', '==', period).onSnapshot(snap => {
    allLostSaleNotes = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderOKRSection();
  });
  unsubscribeFns.push(unsub);
}

function openLostSaleNoteModal(memberId) {
  activeLostSaleMemberId = memberId;
  const m = TEAM_DEF.find(x => x.id === memberId);
  const acts = allActivities.filter(a => a.memberId === memberId && a.fieldKey === 'kaybedildi');
  const companies = Array.from(new Set(acts.map(a => a.company).filter(Boolean)));

  const sel = document.getElementById('lostSaleCompany');
  sel.innerHTML = '<option value="">-- Kurum Seç --</option>' + companies.map(c => `<option value="${c}">${c}</option>`).join('');

  document.getElementById('lostSaleNoteText').value = '';
  document.getElementById('lostSaleNoteModal').classList.remove('hidden');
}

function saveLostSaleNote() {
  const company = document.getElementById('lostSaleCompany').value;
  const note = document.getElementById('lostSaleNoteText').value.trim();
  if (!company) { showToast('Kurum seçmelisin!', 'warning'); return; }
  if (!note) { showToast('Not boş olamaz!', 'warning'); return; }

  const btn = document.getElementById('lostSaleSaveBtn');
  btn.textContent = 'Kaydediliyor...'; btn.disabled = true;

  db.collection('lost_sale_notes').add({
    memberId: activeLostSaleMemberId,
    company: company,
    note: note,
    date: new Date().toISOString().split('T')[0],
    period: currentPeriod,
    createdAt: new Date().toISOString()
  }).then(() => {
    document.getElementById('lostSaleNoteModal').classList.add('hidden');
    showToast('Kayıp satış notu eklendi!', 'success');
  }).catch(e => showToast('Hata: ' + e.message, 'error'))
    .finally(() => { btn.textContent = 'Kaydet'; btn.disabled = false; });
}

