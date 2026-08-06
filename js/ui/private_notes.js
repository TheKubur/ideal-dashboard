// ====== ÖZEL NOTLAR (GİZLİ KASA) ======
function listenToPrivateNotes() {
  if (!currentUser) return;
  const unsub = db.collection('private_notes').onSnapshot(snap => {
    let notes = snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    if (currentUser.role !== 'admin') {
      notes = notes.filter(n => n.memberId === currentUser.memberId);
    }
    allPrivateNotes = notes;
    renderPrivateNotes();
  });
  globalUnsubscribeFns.push(unsub);
}

function renderPrivateNotes() {
  const list = document.getElementById('privateNotesList');
  if (!list) return;

  let filtered = allPrivateNotes;
  if (currentUser.role === 'admin') {
    const pFilter = document.getElementById('notesFilterPerson');
    if (pFilter && pFilter.value !== 'all') {
      filtered = allPrivateNotes.filter(n => n.memberId === pFilter.value);
    }
  }

  if (!filtered.length) {
    list.innerHTML = '<div style="text-align:center;padding:3rem;color:var(--ink3);font-size:0.9rem">📂 Kasanda hiç not yok.</div>';
    return;
  }

  list.innerHTML = filtered.map(n => {
    const isOwner = (currentUser.role === 'admin' || n.memberId === currentUser.memberId);
    return `
    <div style="background:var(--surface);border-radius:16px;padding:1.25rem;box-shadow:var(--shadow);border:1px solid var(--border);border-left:4px solid var(--gold);backdrop-filter:blur(24px) saturate(1.8);animation:fadeUp 0.3s ease both;">
       <div style="display:flex; justify-content:space-between; margin-bottom:0.75rem; align-items:center;">
         <span style="font-size:0.75rem; color:var(--ink3); font-weight:600">📅 ${n.date}</span>
         <div style="display:flex;align-items:center;gap:0.5rem">
           ${currentUser.role === 'admin' ? `<span style="font-size:0.7rem;font-weight:700;background:rgba(120,120,150,0.1);color:var(--ink);padding:0.25rem 0.6rem;border-radius:99px;border:1px solid var(--border)">👤 ${n.memberName}</span>` : ''}
           ${isOwner ? `<button onclick="deletePrivateNote('${n.id}')" style="background:none;border:none;color:var(--accent);font-size:0.75rem;font-weight:600;cursor:pointer;">🗑 Sil</button>` : ''}
         </div>
       </div>
       <div style="font-size:0.9rem; color:var(--ink); white-space:pre-wrap; line-height:1.6;">${n.text}</div>
    </div>`;
  }).join('');
}

function savePrivateNote(event) {
  const input = document.getElementById('privateNoteInput');
  const text = input.value.trim();
  if (!text) { showToast('Not boş olamaz!', 'warning'); return; }

  const m = TEAM_DEF.find(x => x.id === currentUser.memberId);
  const memberName = m ? m.name : currentUser.name;

  const btn = event.target;
  const oldText = btn.textContent;
  btn.textContent = 'Kaydediliyor...'; btn.disabled = true;

  db.collection('private_notes').add({
    text,
    memberId: currentUser.memberId,
    memberName,
    date: new Date().toISOString().split('T')[0],
    period: currentPeriod,
    createdAt: new Date().toISOString()
  }).then(() => {
    input.value = '';
    showToast('Notun kasaya kilitlendi 🔒', 'success');
    if (typeof triggerConfetti !== 'undefined') triggerConfetti();
  }).catch(e => showToast('Hata: ' + e.message, 'error'))
    .finally(() => { btn.textContent = oldText; btn.disabled = false; });
}

function deletePrivateNote(id) {
  if (!confirm('Bu özel notu kalıcı olarak silmek istediğine emin misin?')) return;
  db.collection('private_notes').doc(id).delete().then(() => {
    showToast('Not imha edildi 🗑', 'warning');
  });
}

function populateNotesFilter() {
  const sel = document.getElementById('notesFilterPerson');
  if (!sel) return;
  sel.innerHTML = '<option value="all">Ekibin Tüm Notları</option>' +
    TEAM_DEF.map(m => `<option value="${m.id}">${m.name}</option>`).join('');
}

