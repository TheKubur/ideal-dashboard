const MSAL_CONFIG = {
  auth: {
    clientId: 'c8474e50-165d-4845-8676-3666d00cb202',
    authority: 'https://login.microsoftonline.com/9b1b6343-b512-40b4-ab0e-e61f1ba75639',
    redirectUri: 'https://idealdashboardmarketing.netlify.app',
  },
  cache: { cacheLocation: 'localStorage', storeAuthStateInCookie: true }
};

let msalInstance = null;
let outlookAccount = null;

try {
  msalInstance = new msal.PublicClientApplication(MSAL_CONFIG);
  msalInstance.handleRedirectPromise().then(resp => {
    if (resp && resp.account) {
      outlookAccount = resp.account;
      const lb = document.getElementById('outlookLoginBtn');
      const lo = document.getElementById('outlookLogoutBtn');
      if (lb) lb.style.display = 'none';
      if (lo) lo.style.display = 'flex';
    }
  }).catch(() => { });
} catch (e) { console.warn('MSAL init failed:', e); }

async function tryAutoOutlookLogin() {
  if (!msalInstance) return;
  try {
    const accounts = msalInstance.getAllAccounts();
    if (accounts.length > 0) {
      outlookAccount = accounts[0];
      const lb = document.getElementById('outlookLoginBtn');
      const lo = document.getElementById('outlookLogoutBtn');
      if (lb) lb.style.display = 'none';
      if (lo) { lo.style.display = 'flex'; lo.textContent = `✅ ${outlookAccount.username} · Çıkış`; }
    }
  } catch (e) { }
}

async function outlookLogin() {
  if (!msalInstance) { showToast('Microsoft bağlantısı hazır değil, lütfen bekle.', 'warning'); return; }
  try {
    const resp = await msalInstance.loginPopup({
      scopes: ['Calendars.ReadWrite'],
      prompt: 'select_account'
    });
    outlookAccount = resp.account;
    document.getElementById('outlookLoginBtn').style.display = 'none';
    document.getElementById('outlookLogoutBtn').style.display = 'flex';
    document.getElementById('outlookLogoutBtn').textContent = `✅ ${outlookAccount.username} · Çıkış`;
    showToast('Outlook takvime bağlandı! ✅', 'success');
    renderCalendar();
  } catch (e) {
    console.error("MSAL Login Error:", e);
    showToast('Outlook bağlantısı başarısız: ' + (e.message || e), 'error');
  }
}

function outlookLogout() {
  msalInstance.logoutPopup({ account: outlookAccount });
  outlookAccount = null;
  document.getElementById('outlookLoginBtn').style.display = 'flex';
  document.getElementById('outlookLogoutBtn').style.display = 'none';
  showToast('Outlook bağlantısı kesildi.', 'warning');
  renderCalendar();
}

async function getOutlookToken() {
  if (!outlookAccount) return null;
  try {
    const resp = await msalInstance.acquireTokenSilent({
      scopes: ['Calendars.ReadWrite'],
      account: outlookAccount
    });
    return resp.accessToken;
  } catch (e) {
    console.warn("MSAL Silently acquire failed, trying popup", e);
    try {
      const resp = await msalInstance.acquireTokenPopup({
        scopes: ['Calendars.ReadWrite'],
        account: outlookAccount
      });
      return resp.accessToken;
    } catch (popupErr) {
      console.error("MSAL Popup acquire failed:", popupErr);
      showToast('Token alınamadı: ' + popupErr.message, 'error');
      return null;
    }
  }
}

async function addToOutlook(actId) {
  const a = allActivities.find(x => x.id === actId);
  if (!a) return;

  const token = await getOutlookToken();
  if (!token) {
    showToast('Önce Outlook\'a bağlan!', 'warning');
    return;
  }

  // Tarih formatı: yyyy-mm-dd → ISO
  const dateStr = a.date || new Date().toISOString().split('T')[0];
  const startDT = `${dateStr}T${a.timeStart || '09:00'}:00`;
  const endDT = `${dateStr}T${a.timeEnd || '09:30'}:00`;

  const event = {
    subject: `📅 Randevu: ${a.company || a.desc}`,
    body: {
      contentType: 'text',
      content: `${a.desc}${a.nextStep ? '\n\nSonraki Adım: ' + a.nextStep : ''}\n\nKişi: ${a.memberName}\nDurum: ${a.status}`
    },
    start: { dateTime: startDT, timeZone: 'Europe/Istanbul' },
    end: { dateTime: endDT, timeZone: 'Europe/Istanbul' },
    location: { displayName: a.company || '' },
    categories: ['IdealData']
  };

  try {
    const btn = document.getElementById('outlook-btn-' + actId);
    if (btn) { btn.textContent = 'Ekleniyor...'; btn.disabled = true; }

    const res = await fetch('https://graph.microsoft.com/v1.0/me/events', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(event)
    });

    if (res.ok) {
      showToast(`"${a.company || a.desc}" Outlook takvimine eklendi! 📅`, 'success');
      if (btn) { btn.textContent = '✅ Eklendi'; btn.style.background = 'rgba(42,157,143,0.15)'; btn.style.color = '#2a9d8f'; }

      const data = await res.json();
      db.collection('activities').doc(actId).update({ outlookEventId: data.id });
    } else {
      const err = await res.json();
      showToast('Hata: ' + (err.error?.message || 'Bilinmeyen hata'), 'error');
      if (btn) { btn.textContent = '📅 Outlook\'a Ekle'; btn.disabled = false; }
    }
  } catch (e) {
    showToast('Bağlantı hatası: ' + e.message, 'error');
  }
}

