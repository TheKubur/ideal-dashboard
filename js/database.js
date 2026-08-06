function listenToData(period) {
  TEAM_DEF.forEach(m => {
    const unsub = db.collection('dashboard').doc(`${period}_${m.id}`).onSnapshot(snap => {
      if (snap.exists) {
        const data = snap.data();
        m.fields.forEach(f => { if (data[f.key]) liveData[m.id][f.key] = data[f.key]; });
        updateCard(m.id);
        updateCompanyKPIs();
        renderLeaderboard();
        renderDonut();
      }
      document.getElementById('loadingOverlay').classList.add('hidden');
    });
    unsubscribeFns.push(unsub);
  });
  setTimeout(() => document.getElementById('loadingOverlay').classList.add('hidden'), 4000);
}

function listenToActivities(period) {
  const unsub = db.collection('activities').where('period', '==', period).onSnapshot(snap => {

    snap.docChanges().forEach(change => {
      if (change.type === 'added' && currentUser) {
        const d = change.doc.data();
        // Eğer bu aktiviteyi currentUser eklemediyse ona bildirim göster
        if (d.memberName !== currentUser.name) {
          // Sayfa ilk yüklendiğinde geçmiş verileri toast yapmamak için ufak bir kontrol:
          const actTime = new Date(d.createdAt).getTime();
          const nowTime = Date.now();
          if ((nowTime - actTime) < 10000) {
            showToast(`${d.memberName}, ${d.company || 'yeni'} için ${d.fieldLabel} ekledi.`, 'success');
          }
        }
      }
    });

    allActivities = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    calNotes = {};
    allActivities.forEach(a => { if (a.calNote) calNotes[a.id] = a.calNote; });
    renderActivities();
    renderCRM();
    renderWeekly();
    renderWeeklySummary();
    loadMeetingNotes();
    updateCompanyKPIs();
    renderLeaderboard();
    renderAnalytics();
    const el = document.getElementById('totalActivities');
    if (el) el.textContent = allActivities.length;
  });
  unsubscribeFns.push(unsub);
}


function listenToNotifications() {
  const unsub = db.collection('notifications').orderBy('createdAt', 'desc').limit(1).onSnapshot(snap => {
    if (!snap.empty) {
      const notif = snap.docs[0].data();
      const banner = document.getElementById('adminNotificationBanner');
      if (banner) {
        document.getElementById('adminNotificationText').textContent = notif.text;
        banner.style.display = 'block';
      }
    }
  });
  globalUnsubscribeFns.push(unsub);
}

function publishAdminNotification() {
  const input = document.getElementById('adminNotificationInput');
  const text = input.value.trim();
  if (!text) {
    showToast('Lütfen bir mesaj yazın!', 'warning');
    return;
  }
  db.collection('notifications').add({
    text: text,
    createdAt: new Date().toISOString(),
    createdBy: currentUser.name
  }).then(() => {
    showToast('Bildirim yayınlandı!', 'success');
    document.getElementById('adminNotificationModal').classList.add('hidden');
    input.value = '';
  }).catch(err => {
    showToast('Hata: ' + err.message, 'error');
  });
}
