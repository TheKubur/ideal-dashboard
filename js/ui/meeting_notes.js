function saveMeetingNote() {
  const date = document.getElementById('meetingDate').value;
  const note = document.getElementById('meetingNote').value.trim();
  if (!note) { showToast('Not boş olamaz.', 'warning'); return; }
  db.collection('meetings').add({
    date, note, createdBy: currentUser.name,
    createdAt: new Date().toISOString(), period: currentPeriod
  }).then(() => {
    document.getElementById('meetingModal').classList.add('hidden');
    document.getElementById('meetingNote').value = '';
    loadMeetingNotes();
    showToast('Toplantı notu kaydedildi.', 'success');
  }).catch(e => showToast('Hata: ' + e.message, 'error'));
}

function loadMeetingNotes() {
  db.collection('meetings').where('period', '==', currentPeriod)
    .get().then(snap => {
      const notes = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => new Date(b.date) - new Date(a.date));
      const el = document.getElementById('meetingNotesList');
      if (!el) return;
      if (!notes.length) { el.innerHTML = ''; return; }
      el.innerHTML = `
        <div style="font-family:'Bebas Neue',sans-serif;font-size:1rem;letter-spacing:0.1em;color:var(--ink3);margin-bottom:1rem">TOPLANTI NOTLARI</div>
        ${notes.map(n => `
          <div style="background:var(--surface);border-radius:12px;padding:1.25rem;margin-bottom:0.75rem;border:1px solid var(--border);border-left:3px solid var(--accent2)">
            <div style="display:flex;justify-content:space-between;margin-bottom:0.5rem">
              <span style="font-weight:700;font-size:0.85rem;color:var(--ink)">📅 ${n.date}</span>
              <span style="font-size:0.72rem;color:var(--ink3)">${n.createdBy}</span>
            </div>
            <div style="font-size:0.85rem;color:var(--ink2);white-space:pre-wrap">${n.note}</div>
          </div>
        `).join('')}
      `;
    });
}

