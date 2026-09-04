function doLogin() {
  try {
  const email = document.getElementById('loginUser').value.trim().toLowerCase();
  const pass = document.getElementById('loginPass').value;
  const errEl = document.getElementById('loginError');
  errEl.textContent = '';

  const btn = document.querySelector('.login-btn');
  btn.textContent = 'Giriş yapılıyor...';
  btn.disabled = true;

  auth.signInWithEmailAndPassword(email, pass)
    .then(cred => {
      const info = USER_MAP[email];
      if (!info) {
        auth.signOut();
        errEl.textContent = 'Bu hesabın yetkisi tanımlı değil.';
        btn.textContent = 'Giriş Yap'; btn.disabled = false;
        return;
      }
      currentUser = { ...info, email };
      document.getElementById('loginScreen').classList.add('hidden');
      document.getElementById('appLayout').style.display = 'flex';
      document.getElementById('loadingOverlay').classList.remove('hidden');
      document.getElementById('headerAvatar').textContent = currentUser.initials;
      document.getElementById('headerAvatar').style.background = currentUser.color;
      document.getElementById('headerName').textContent = currentUser.name;

      const exportBtn = document.getElementById('exportDropBtn');
      if (exportBtn) exportBtn.style.display = (currentUser.role === 'admin') ? 'inline-flex' : 'none';

      const adminNotifBtn = document.getElementById('btnAdminNotification');
      if (adminNotifBtn) adminNotifBtn.style.display = (currentUser.role === 'admin') ? 'inline-flex' : 'none';

      const notesFlt = document.getElementById('notesFilterWrap');
      if (notesFlt) notesFlt.style.display = (currentUser.role === 'admin') ? 'block' : 'none';

      if (currentUser.role === 'admin' && typeof populateNotesFilter === 'function') {
        populateNotesFilter();
      }

      const tabNotesBtn = document.getElementById('tabBtnNotes');
      if (tabNotesBtn) {
        tabNotesBtn.style.display = 'flex';
      }
      
      const tabAnalyticsBtn = document.getElementById('tabBtnAnalytics');
      if (tabAnalyticsBtn) {
        tabAnalyticsBtn.style.display = (currentUser.role === 'admin') ? 'inline-block' : 'none';
      }

      const tabPersonalTasksBtn = document.getElementById('tabBtnPersonalTasks');
      if (tabPersonalTasksBtn) {
        tabPersonalTasksBtn.style.display = (currentUser.role === 'admin') ? 'inline-block' : 'none';
      }

      const matrixTabBtn = document.getElementById('btnTeamTab-matrix');
      if (matrixTabBtn) {
        matrixTabBtn.style.display = (currentUser.role === 'admin') ? 'inline-block' : 'none';
      }

      if (typeof checkMemberNudges === 'function') {
        setTimeout(checkMemberNudges, 2000);
      }

      const filterSel = document.getElementById('companyDirectoryFilter');
      if (filterSel && filterSel.options.length <= 2) {
        TEAM_DEF.forEach(m => {
          filterSel.innerHTML += `<option value="${m.id}">${m.name}</option>`;
        });
      }

      renderTeam();
      renderBarChart();
      listenToData(currentPeriod);
      listenToActivities(currentPeriod);
      listenToDeals(currentPeriod);
      listenToProjects(currentYear);
      listenToCompanyAssignments();
      listenToWlRecords(currentYear);
      listenToOKR(currentPeriod);
      if (typeof listenToIRCampaign === 'function') listenToIRCampaign();
      listenToLostSaleNotes(currentPeriod);
      listenToNotifications();
      if (typeof listenToPrivateNotes === 'function') listenToPrivateNotes();
      if (typeof listenToProposals === 'function') listenToProposals();
      setTimeout(() => showTakipPopup(), 1500);
      showToast(`Hoş geldin, ${currentUser.name}!`, 'success');

      tryAutoOutlookLogin();
    })
    .catch(err => {
      if (!err.code) { alert("Beklenmeyen Hata: " + err.message + "\n" + err.stack); console.error(err); }
      const msgs = {
        'auth/user-not-found': 'E-posta bulunamadı.',
        'auth/wrong-password': 'Şifre hatalı.',
        'auth/invalid-email': 'Geçersiz e-posta.',
        'auth/too-many-requests': 'Çok fazla deneme. Lütfen bekle.',
        'auth/invalid-credential': 'E-posta veya şifre hatalı.',
      };
      errEl.textContent = msgs[err.code] || 'Giriş başarısız.';
      btn.textContent = 'Giriş Yap'; btn.disabled = false;
    });
  } catch (e) {
    alert("Kritik Hata: " + e.message + "\n" + e.stack);
    console.error(e);
  }
}

function doLogout() {
  auth.signOut().then(() => {
    currentUser = null;
    unsubscribeFns.forEach(fn => fn());
    unsubscribeFns = [];
    globalUnsubscribeFns.forEach(fn => fn());
    globalUnsubscribeFns = [];
    document.getElementById('loginScreen').classList.remove('hidden');
    document.getElementById('appLayout').style.display = 'none';
    document.getElementById('loginUser').value = '';
    document.getElementById('loginPass').value = '';
    document.getElementById('loginError').textContent = '';
    const btn = document.querySelector('.login-btn');
    if (btn) { btn.textContent = 'Giriş Yap'; btn.disabled = false; }
  });
}

