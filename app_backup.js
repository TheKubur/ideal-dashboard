
document.addEventListener('DOMContentLoaded', function () {
  const loginBtn = document.getElementById('loginBtn');
  if (loginBtn) loginBtn.addEventListener('click', doLogin);
  const loginPass = document.getElementById('loginPassInput');
  if (loginPass) loginPass.addEventListener('keydown', function (e) { if (e.key === 'Enter') doLogin(); });

  // ====== MAGIC HOVER GLOW EFFECT ======
  const addGlow = () => {
    document.querySelectorAll('.kpi-card, .member-card, .activity-item, .chart-card, .weekly-card, .private-note-card').forEach(card => {
      if (!card.querySelector('.magic-glow')) {
        const glow = document.createElement('div');
        glow.className = 'magic-glow';
        card.appendChild(glow);
      }
    });
  };
  const observer = new MutationObserver(() => addGlow());
  observer.observe(document.body, { childList: true, subtree: true });
  addGlow();

  document.addEventListener('mousemove', e => {
    for (const card of document.querySelectorAll('.kpi-card, .member-card, .activity-item, .chart-card, .weekly-card, .private-note-card')) {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      card.style.setProperty('--mouse-x', `${x}px`);
      card.style.setProperty('--mouse-y', `${y}px`);
    }
  });
});
firebase.initializeApp({
  apiKey: "AIzaSyBJVQrRD1LmaGtaTTet00l1ZXTj3VSKZl0",
  authDomain: "idealdata-dashboard.firebaseapp.com",
  projectId: "idealdata-dashboard",
  storageBucket: "idealdata-dashboard.firebasestorage.app",
  messagingSenderId: "914044556611",
  appId: "1:914044556611:web:cfe8f7b433c964cdb74bf6"
});
const db = firebase.firestore();
const auth = firebase.auth();

const COMPANIES = [
  'ACAR MENKUL DEÐERLER A.Þ.',
  'AHLATCI YATIRIM MENKUL DEÐERLER A.Þ.',
  'AK YATIRIM MENKUL DEÐERLER A.Þ.',
  'ALTERNATÝF MENKUL DEÐERLER A.Þ.',
  'ALLBATROS PORTFÖY YÖNETÝMÝ A.Þ.',
  'ALLBATROSS YATIRIM',
  'ALNUS YATIRIM MENKUL DEÐERLER A.Þ.',
  'ANADOLU AJANSI T.A.Þ.',
  'ANADOLU YATIRIM MENKUL KIYMETLERÝ A.Þ.',
  'ATA YATIRIM MENKUL DEÐERLER A.Þ.',
  'Atlas Portföy Yönetimi A.Þ.',
  'AVOD KURUTULMUÞ GIDA VE TARIM ÜRÜNLERÝ SAN TÝC A.Þ.',
  'A1 CAPÝTAL MENKUL DEÐERLER A.Þ.',
  'BAÞKENT MENKUL DEÐERLER VE YATIRIM A.Þ.',
  'BÝTUSTA BÝLÝÞÝM TEKNOLOJÝLERÝ A.Þ.',
  'BÝZÝM MENKUL DEÐERLER A.Þ.',
  'BULLS YATIRIM',
  'BURGAN YATIRIM MENKUL DEÐERLER A.Þ.',
  'Colendi Menkul Deðerler A.Þ.',
  'DENÝZ YATIRIM MENKUL KIYMETLER A.Þ.',
  'DESTEK YATIRIM',
  'DÝNAMÝK YATIRIM MENKUL DEÐERLER A.Þ.',
  'F-TECH LABS - MAHMUT GÜNEÞ',
  'Finar Kurumsal Ýletiþim Çözümleri Ltd Þti',
  'GARNATÝ YATIRIM MENKUL KIYMETLERÝ A.Þ.',
  'GCM YATIRIM MENKUL DEÐERLER A.Þ.',
  'Geneks Yazýlým A.Þ.',
  'GLOBAL MARKET ACESS HOLDÝNG LTD.',
  'GLOBAL MENKUL DEÐERLER A.Þ.',
  'HANGÝSÝ ÝNTERNET VE BÝLGÝ HÝZMETLERÝ A.Þ.',
  'HALK YATIRIM MENKUL DEÐERLER A.Þ.',
  'HEDEF GÝRÝÞÝM SERMAYESÝ YAT.ORT.',
  'HEDEF PORTFÖY YÖNETÝMÝ A.Þ.',
  'HEDEF YATIRIM BANKASI',
  'HSBC BANK A.Þ.',
  'HSBC YATIRIM MENKUL DEGERLER A.Þ.',
  'ICBC TURKEY YATIRIM MENKUL DEÐERLER A.Þ.',
  'IKON MENKUL DEÐERLER A.Þ.',
  'ÝNFO YATIRIM MENKUL DEÐERLER A.Þ.',
  'ÝNTEGRAL YATIRIM MENKUL DEÐERLER A.Þ.',
  'ÝÞ YATIRIM MENKUL DEÐERLER A.Þ.',
  'INVESTAz YATIRIM MENKUL DEÐERLER A.Þ.',
  'Kuveyt Türk Yatýrým Menkul Deðerler Anonim Þirketi',
  'MARBAJ MENKUL DEÐERLER A.Þ.',
  'MARMARA CAPÝTAL PORTFÖY YÖNETÝMÝ A.Þ.',
  'MEKSA YATIRIM MENKUL DEÐERLER A.Þ.',
  'MÝDAS MENKUL DEÐERLER A.Þ.',
  'NCM Investment Menkul Deðerler A.Þ.',
  'OSMANLII MENKUL DEÐERLER A.Þ.',
  'OYAK YATIRIM MENKUL DEÐERLER A.Þ.',
  'PENTA TEKNOLOJÝ ÜRÜNLERÝ DAÐITIM TÝCARET A.Þ.',
  'PHILLIP CAPÝTAL MENKUL DEÐERLER A.Þ.',
  'PORTFÖY FÝNANSAL TEKNOLOJÝLER VE YAZILIM A.Þ.',
  'PUSULA MENKUL DEÐERLER A.Þ.',
  'QNB INVEST',
  'SEYÝTLER KÝMYA SANAYÝ A.Þ.',
  'STRATEJÝ MENKUL DEÐERLER A.Þ.',
  'TACÝRLER YATIRIM MENKUL DEÐERLER A.Þ.',
  'T.GARANTÝ BANKASI A.Þ.',
  'TEB YATIRIM MENKUL DEÐERLER A.Þ.',
  'TERA MENKUL DEÐERLER A.Þ.',
  'TRÝVE YATIRIM MENKUL DEÐERLER A.Þ.',
  'TURKISH YATIRIM MENKUL DEÐERLER A.Þ.',
  'VAKIF YATIRIM MENKUL DEÐERLER A.Þ.',
  'YAPI KREDÝ YATIRIM VE MENKUL DEÐERLER A.Þ.',
  'YATIRIM FÝNANSMAN MENKUL DEÐERLER A.Þ.',
  'ÜNLÜ MENKUL DEÐERLER A.Þ.',
  'ZEPHLEX BÝLGÝ VE TEKNOLOJÝLERÝ EÐÝTÝM VE DANIÞMANLIK A.Þ.',
].sort();

// Kullanýcý bilgileri — þifre YOK, Firebase Auth yönetiyor
const USER_MAP = {
  'huseyin.kubur@idealdata.com.tr': { role: 'admin', memberId: null, name: 'Hüseyin Kubur', initials: 'HK', color: '#0f172a' },
  'esmao@idealdata.com.tr': { role: 'member', memberId: 'esma', name: 'Esma Özkan', initials: 'EÖ', color: '#e63946' },
  'dilan.kaya@idealdata.com.tr': { role: 'member', memberId: 'dilan', name: 'Dilan Kaya', initials: 'DK', color: '#8b5cf6' },
  'meleks@idealdata.com.tr': { role: 'member', memberId: 'melek', name: 'Melek Þiran', initials: 'MÞ', color: '#f59e0b' },
  'elifc@idealdata.com.tr': { role: 'member', memberId: 'elif', name: 'Elif Çankaya', initials: 'EÇ', color: '#457b9d' },
  'izleyici@idealdata.com.tr': { role: 'viewer', memberId: null, name: 'Ýzleyici', initials: 'ÝZ', color: '#9090b0' },
};

const TEAM_DEF = [
  {
    id: 'elif', name: 'Elif Çankaya', dept: 'Dijital Pazarlama', title: 'Kýdemli Dijital Pazarlama Uzmaný', deptColor: '#457b9d', avatarBg: '#ddeaf5', initials: 'EÇ', photo: 'https://i.imgur.com/BuFXTwR.jpg',
    fields: [
      { key: 'youtube', label: 'YouTube', emoji: '??', hasTarget: true },
      { key: 'twitter', label: 'Twitter/X', emoji: '??', hasTarget: true },
      { key: 'linkedin', label: 'LinkedIn', emoji: '??', hasTarget: true },
      { key: 'instagram', label: 'Instagram', emoji: '??', hasTarget: true },
      { key: 'haber', label: 'Haber', emoji: '??', hasTarget: true },
      { key: 'diger', label: 'Diðer', emoji: '??', hasTarget: false }
    ]
  },
  {
    id: 'esma', name: 'Esma Özkan', dept: 'Satýþ', title: 'Kýdemli Satýþ Uzmaný', deptColor: '#e63946', avatarBg: '#fce8ea', initials: 'EÖ', photo: 'https://i.imgur.com/ORTr93i.jpg',
    fields: [
      { key: 'musteri', label: 'Yeni Müþteri', emoji: '??', hasTarget: true },
      { key: 'temas', label: 'Toplam Temas', emoji: '??', hasTarget: true },
      { key: 'teklif', label: 'Gönderilen Teklif', emoji: '??', hasTarget: false },
      { key: 'randevu', label: 'Randevu', emoji: '??', hasTarget: true },
      { key: 'diger', label: 'Diðer', emoji: '??', hasTarget: false }
    ]
  },
  {
    id: 'dilan', name: 'Dilan Kaya', dept: 'Satýþ', title: 'Satýþ Uzmaný Yardýmcýsý', deptColor: '#8b5cf6', avatarBg: '#ede9fe', initials: 'DK', photo: 'https://i.imgur.com/IOiHkp6.jpg',
    fields: [
      { key: 'musteri', label: 'Yeni Müþteri', emoji: '??', hasTarget: true },
      { key: 'temas', label: 'Toplam Temas', emoji: '??', hasTarget: true },
      { key: 'teklif', label: 'Gönderilen Teklif', emoji: '??', hasTarget: false },
      { key: 'randevu', label: 'Randevu', emoji: '??', hasTarget: true },
      { key: 'diger', label: 'Diðer', emoji: '??', hasTarget: false }
    ]
  },
  {
    id: 'melek', name: 'Melek Þiran', dept: 'Satýþ', title: 'Satýþ Uzmaný Yardýmcýsý', deptColor: '#f59e0b', avatarBg: '#fef3c7', initials: 'MÞ', photo: 'https://i.imgur.com/bPLoW39.jpg',
    fields: [
      { key: 'musteri', label: 'Yeni Müþteri', emoji: '??', hasTarget: true },
      { key: 'temas', label: 'Toplam Temas', emoji: '??', hasTarget: true },
      { key: 'teklif', label: 'Gönderilen Teklif', emoji: '??', hasTarget: false },
      { key: 'randevu', label: 'Randevu', emoji: '??', hasTarget: true },
      { key: 'diger', label: 'Diðer', emoji: '??', hasTarget: false }
    ]
  },
];

let currentUser = null;
let currentPeriod = 'Mart 2026';
let liveData = {};
let allActivities = [];
let allDeals = [];
let allPrivateNotes = [];
let allLostSaleNotes = [];
let allRandevular = [];
let companyAssignments = {};
let currentFilter = 'all';
let modalMemberId = null;
let editActivityId = null;
let unsubscribeFns = [];

TEAM_DEF.forEach(m => {
  liveData[m.id] = {};
  m.fields.forEach(f => { liveData[m.id][f.key] = { actual: 0, target: 0 }; });
});

// ====== WHITE LABEL RAPORLARI ======
let allWlRecords = [];
let editWlId = null;

function calcWlTotal() {
  const qty = parseFloat(document.getElementById('wlQty').value) || 0;
  const unit = parseFloat(document.getElementById('wlUnitPrice').value) || 0;
  document.getElementById('wlTotalPreview').textContent = (qty * unit).toLocaleString('tr-TR') + ' TL';
}

function handleWlCompanyChange() {
  const sel = document.getElementById('wlCompany');
  const ci = document.getElementById('wlCompanyCustom');
  if (sel.value === '__yeni__') { ci.classList.remove('hidden'); ci.focus(); }
  else { ci.classList.add('hidden'); ci.value = ''; }
}

function openWlModal(id) {
  id = id || null;
  editWlId = id;
  const compSel = document.getElementById('wlCompany');
  const actCompanies = Array.from(new Set(allActivities.map(function (a) { return a.company; }).filter(function (c) { return c; })));
  const allComp = Array.from(new Set(COMPANIES.concat(actCompanies))).sort(function (a, b) { return a.localeCompare(b, 'tr'); });
  compSel.innerHTML = '<option value="">-- Kurum Seç --</option>' +
    allComp.map(function (c) { return '<option value="' + c + '">' + c + '</option>'; }).join('') +
    '<option value="__yeni__">+ Yeni Kurum Ekle...</option>';
  document.getElementById('wlCompanyCustom').classList.add('hidden');
  document.getElementById('wlCompanyCustom').value = '';

  const delBtn = document.getElementById('wlDeleteBtn');
  if (id) {
    const r = allWlRecords.find(function (x) { return x.id === id; });
    if (r) {
      document.getElementById('wlModalTitle').textContent = 'Kaydý Düzenle';
      document.getElementById('wlMonth').value = r.month || 'OCAK';
      compSel.value = r.company || '';
      document.getElementById('wlPackage').value = r.package || '';
      document.getElementById('wlQty').value = r.qty || '';
      document.getElementById('wlUnitPrice').value = r.unitPrice || '';
      document.getElementById('wlNote').value = r.note || '';
      calcWlTotal();
    }
    if (delBtn) delBtn.style.display = (currentUser.role === 'admin') ? 'inline-block' : 'none';
  } else {
    document.getElementById('wlModalTitle').textContent = 'White Label Kaydý Ekle';
    const normalize = function (s) { return s.toUpperCase().replace(/\u0130/g, 'I').replace(/\u011e/g, 'G').replace(/\u00dc/g, 'U').replace(/\u015e/g, 'S').replace(/\u00d6/g, 'O').replace(/\u00c7/g, 'C'); };
    const pm = normalize((currentPeriod || '').split(' ')[0]);
    const matched = MONTHS_ORDER.find(function (m) { return normalize(m) === pm; });
    document.getElementById('wlMonth').value = matched || 'OCAK';
    compSel.value = '';
    ['wlPackage', 'wlQty', 'wlUnitPrice', 'wlNote'].forEach(function (eid) { document.getElementById(eid).value = ''; });
    document.getElementById('wlTotalPreview').textContent = '0 TL';
    if (delBtn) delBtn.style.display = 'none';
  }
  document.getElementById('wlModal').classList.remove('hidden');
}

function saveWlRecord() {
  const month = document.getElementById('wlMonth').value;
  const selVal = document.getElementById('wlCompany').value;
  const company = selVal === '__yeni__' ? document.getElementById('wlCompanyCustom').value.trim() : selVal;
  const pkg = document.getElementById('wlPackage').value.trim();
  const qty = parseFloat(document.getElementById('wlQty').value) || 0;
  const unitPrice = parseFloat(document.getElementById('wlUnitPrice').value) || 0;
  const note = document.getElementById('wlNote').value.trim();
  const total = qty * unitPrice;

  if (selVal === '__yeni__' && !company) { showToast('Yeni kurum adýný yazman gerekiyor!', 'warning'); return; }
  if (!company) { showToast('Kurum seçmelisin!', 'warning'); return; }
  if (!pkg) { showToast('Paket adý gerekli!', 'warning'); return; }
  if (qty <= 0) { showToast('Adet 0dan büyük olmalý!', 'warning'); return; }
  if (unitPrice <= 0) { showToast('Birim fiyat 0dan büyük olmalý!', 'warning'); return; }

  const btn = document.getElementById('wlSaveBtn');
  btn.textContent = 'Kaydediliyor...'; btn.disabled = true;

  const data = { month: month, company: company, package: pkg, qty: qty, unitPrice: unitPrice, total: total, note: note, period: currentPeriod, updatedAt: new Date().toISOString() };
  const done = function () { showToast(editWlId ? 'Kayýt güncellendi.' : 'Kayýt eklendi!', 'success'); document.getElementById('wlModal').classList.add('hidden'); btn.textContent = 'Kaydet'; btn.disabled = false; };
  const fail = function (e) { showToast('Hata: ' + e.message, 'error'); btn.textContent = 'Kaydet'; btn.disabled = false; };

  if (editWlId) {
    db.collection('whitelabel_records').doc(editWlId).update(data).then(done).catch(fail);
  } else {
    data.createdAt = new Date().toISOString();
    data.addedBy = currentUser.name;
    db.collection('whitelabel_records').add(data).then(done).catch(fail);
  }
}

function deleteWlRecord() {
  if (!editWlId || currentUser.role !== 'admin') return;
  if (!confirm('Bu kaydý silmek istediðine emin misin?')) return;
  db.collection('whitelabel_records').doc(editWlId).delete()
    .then(function () { showToast('Kayýt silindi.', 'success'); document.getElementById('wlModal').classList.add('hidden'); })
    .catch(function (e) { showToast('Hata: ' + e.message, 'error'); });
}

function renderWhiteLabel() {
  const kpiEl = document.getElementById('wl-kpi-strip');
  const tableEl = document.getElementById('wl-table');
  if (!kpiEl || !tableEl) return;

  const isAdmin = currentUser && currentUser.role === 'admin';
  const list = allWlRecords.slice().sort(function (a, b) {
    const mi = MONTHS_ORDER.indexOf(a.month) - MONTHS_ORDER.indexOf(b.month);
    if (mi !== 0) return mi;
    return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
  });

  const totalRevenue = list.reduce(function (s, r) { return s + (r.total || 0); }, 0);
  const activeCompanies = new Set(list.map(function (r) { return r.company; })).size;
  const totalUsers = list.reduce(function (s, r) { return s + (r.qty || 0); }, 0);
  const avgPerUser = totalUsers > 0 ? totalRevenue / totalUsers : 0;

  kpiEl.innerHTML = [
    { icon: '??', label: 'Toplam Lisans Geliri', value: totalRevenue.toLocaleString('tr-TR') + ' TL', color: '#10b981' },
    { icon: '??', label: 'Aktif Kurum Sayýsý', value: activeCompanies, color: '#457b9d' },
    { icon: '??', label: 'Toplam Kullanýcý', value: totalUsers, color: '#8b5cf6' },
    { icon: '??', label: 'Ort. Kullanýcý Baþý Gelir', value: avgPerUser.toLocaleString('tr-TR', { maximumFractionDigits: 0 }) + ' TL', color: '#f59e0b' }
  ].map(function (k) {
    return '<div style="flex:1;min-width:170px;background:var(--surface);border-radius:14px;padding:1rem 1.25rem;border:1px solid var(--border);box-shadow:var(--shadow);display:flex;flex-direction:column;gap:0.3rem"><div style="font-size:1.4rem">' + k.icon + '</div><div style="font-size:0.7rem;font-weight:600;color:var(--ink3);text-transform:uppercase;letter-spacing:0.06em">' + k.label + '</div><div style="font-size:1.25rem;font-weight:800;color:' + k.color + '">' + k.value + '</div></div>';
  }).join('');

  if (!list.length) { tableEl.innerHTML = '<div style="text-align:center;padding:3rem;color:var(--ink3)">Henüz kayýt yok. + Yeni Satýr Ekle butonuna týkla.</div>'; return; }

  const byMonth = {};
  list.forEach(function (r) { if (!byMonth[r.month]) byMonth[r.month] = []; byMonth[r.month].push(r); });

  const editColHead = isAdmin ? '<th style="padding:0.75rem;text-align:center;min-width:55px">ÝSLEM</th>' : '';
  let html = '<div style="overflow-x:auto;border-radius:12px;border:1px solid var(--border);box-shadow:0 4px 20px rgba(0,0,0,0.08)"><table style="width:100%;border-collapse:collapse;font-family:Outfit,sans-serif;font-size:0.85rem"><thead><tr style="background:rgba(69,123,157,0.18);font-weight:700;font-size:0.78rem;text-transform:uppercase;letter-spacing:0.05em"><th style="padding:0.75rem 1rem;text-align:left;min-width:70px">AY</th><th style="padding:0.75rem 1rem;text-align:left;min-width:160px">KURUM ADI</th><th style="padding:0.75rem 1rem;text-align:left;min-width:200px">PAKET ADI</th><th style="padding:0.75rem 1rem;text-align:center;min-width:80px">ADET</th><th style="padding:0.75rem 1rem;text-align:right;min-width:130px">BÝRÝM FÝYAT</th><th style="padding:0.75rem 1rem;text-align:right;min-width:140px;color:#10b981">TOPLAM</th><th style="padding:0.75rem 1rem;text-align:left;min-width:140px">NOTLAR</th>' + editColHead + '</tr></thead><tbody>';

  let grandTotal = 0;
  let grandUsers = 0;

  MONTHS_ORDER.filter(function (m) { return byMonth[m]; }).forEach(function (month, mi) {
    const rows = byMonth[month];
    const monthTotal = rows.reduce(function (s, r) { return s + (r.total || 0); }, 0);
    const monthUsers = rows.reduce(function (s, r) { return s + (r.qty || 0); }, 0);
    grandTotal += monthTotal; grandUsers += monthUsers;
    rows.forEach(function (r, ri) {
      const bg = (mi + ri) % 2 === 0 ? 'var(--surface)' : 'var(--bg)';
      const eid = (r.id || '').replace(/'/g, "\\'");
      const dblClick = isAdmin ? ' ondblclick="openWlModal(\'' + eid + '\')"' : '';
      const monthTd = ri === 0 ? '<td rowspan="' + rows.length + '" style="padding:0.65rem 1rem;font-weight:800;text-align:center;background:var(--bg);border-right:2px solid var(--border);color:var(--ink2)">' + month + '</td>' : '';
      const editTd = isAdmin ? '<td style="padding:0.5rem;text-align:center"><button onclick="openWlModal(\'' + eid + '\')" style="background:none;border:1px solid var(--border);border-radius:6px;cursor:pointer;font-size:0.75rem;padding:0.2rem 0.5rem;color:var(--ink3)">??</button></td>' : '';
      html += '<tr style="background:' + bg + ';vertical-align:middle"' + dblClick + '>' + monthTd + '<td style="padding:0.65rem 1rem;font-weight:600;color:var(--ink)">' + (r.company || '—') + '</td><td style="padding:0.65rem 1rem;color:var(--ink2)">' + (r.package || '—') + '</td><td style="padding:0.65rem 1rem;text-align:center;font-weight:700;color:#457b9d">' + (r.qty || 0).toLocaleString('tr-TR') + '</td><td style="padding:0.65rem 1rem;text-align:right;color:var(--ink3)">' + (r.unitPrice || 0).toLocaleString('tr-TR') + ' TL</td><td style="padding:0.65rem 1rem;text-align:right;font-weight:800;color:#10b981">' + (r.total || 0).toLocaleString('tr-TR') + ' TL</td><td style="padding:0.65rem 1rem;color:var(--ink3);font-size:0.8rem">' + (r.note || '') + '</td>' + editTd + '</tr>';
    });
    const cs = isAdmin ? '2' : '1';
    html += '<tr style="background:rgba(69,123,157,0.08)"><td colspan="3" style="padding:0.5rem 1rem;text-align:right;font-size:0.78rem;color:var(--ink3);font-style:italic">' + month + ' Toplamý (' + monthUsers + ' kullanýcý):</td><td style="padding:0.5rem 1rem;text-align:center;font-weight:700;color:#457b9d">' + monthUsers + '</td><td></td><td style="padding:0.5rem 1rem;text-align:right;font-weight:800;color:#10b981">' + monthTotal.toLocaleString('tr-TR') + ' TL</td><td colspan="' + cs + '"></td></tr>';
  });

  const cs2 = isAdmin ? '2' : '1';
  html += '</tbody><tfoot><tr style="background:rgba(69,123,157,0.25);font-weight:800"><td colspan="3" style="padding:0.75rem 1rem;text-align:right;font-size:0.9rem">GENEL TOPLAM</td><td style="padding:0.75rem 1rem;text-align:center;font-size:1rem;color:#457b9d">' + grandUsers + '</td><td></td><td style="padding:0.75rem 1rem;text-align:right;font-size:1rem;color:#10b981">' + grandTotal.toLocaleString('tr-TR') + ' TL</td><td colspan="' + cs2 + '"></td></tr></tfoot></table></div>';
  tableEl.innerHTML = html;
}

function exportWlExcel() {
  if (typeof XLSX === 'undefined') { showToast('Excel kütüphanesi yüklenmedi.', 'error'); return; }
  if (!allWlRecords.length) { showToast('Tablo boþ!', 'warning'); return; }
  const headers = ['AY', 'KURUM ADI', 'PAKET ADI', 'ADET', 'BÝRÝM FÝYAT', 'TOPLAM', 'NOTLAR'];
  const rows = allWlRecords.map(function (r) { return [r.month, r.company, r.package, r.qty, r.unitPrice, r.total, r.note || '']; });
  rows.push(['GENEL TOPLAM', '', '', allWlRecords.reduce(function (s, r) { return s + (r.qty || 0); }, 0), '', allWlRecords.reduce(function (s, r) { return s + (r.total || 0); }, 0), '']);
  const ws = XLSX.utils.aoa_to_sheet([headers].concat(rows));
  ws['!cols'] = [12, 28, 30, 10, 18, 18, 25].map(function (w) { return { wch: w }; });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'White Label Kullanici Basi');
  const b64 = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });
  const a = document.createElement('a');
  a.href = 'data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,' + b64;
  a.download = 'white_label_' + currentPeriod + '.xlsx';
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  showToast('White Label raporu indirildi!', 'success');
}

function listenToWlRecords(period) {
  const unsub = db.collection('whitelabel_records').where('period', '==', period).onSnapshot(snap => {
    allWlRecords = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    if (document.getElementById('report-view-whitelabel')?.style.display !== 'none') {
      renderWhiteLabel();
    }
  });
  unsubscribeFns.push(unsub);
}

function toggleTheme() {
  const body = document.body;
  const currentTheme = body.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  body.setAttribute('data-theme', newTheme);
  localStorage.setItem('idealDataTheme', newTheme);
}

// Sayfa yüklendiðinde temayý uygula
document.addEventListener('DOMContentLoaded', () => {
  const savedTheme = localStorage.getItem('idealDataTheme') || 'light';
  document.body.setAttribute('data-theme', savedTheme);
});

function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span style="font-size:1.2rem">${type === 'success' ? '?' : type === 'warning' ? '??' : '?'}</span>
    <div>${message}</div>
  `;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'slideInRight 0.3s ease reverse forwards';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

function pct(a, t) { return t === 0 ? 0 : Math.min(100, Math.round((a / t) * 100)); }
function pctColor(p) { return p >= 80 ? '#2a9d8f' : p >= 50 ? '#f4a261' : '#e63946'; }

function animateValue(obj, start, end, duration) {
  let startTimestamp = null;
  const step = (timestamp) => {
    if (!startTimestamp) startTimestamp = timestamp;
    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
    obj.textContent = Math.floor(progress * (end - start) + start);
    if (progress < 1) window.requestAnimationFrame(step);
    else obj.textContent = end;
  };
  window.requestAnimationFrame(step);
}

function triggerConfetti() {
  if (typeof confetti !== 'undefined') {
    confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 }, colors: ['#e63946', '#457b9d', '#f4a261', '#2a9d8f', '#f59e0b'] });
  }
}
function calcOverall(mid) {
  const m = TEAM_DEF.find(x => x.id === mid);
  const tf = m.fields.filter(f => f.hasTarget && liveData[mid][f.key].target > 0);
  if (!tf.length) return 0;
  return Math.round(tf.reduce((s, f) => s + pct(liveData[mid][f.key].actual, liveData[mid][f.key].target), 0) / tf.length);
}
function canEditTarget() { return currentUser && currentUser.role === 'admin'; }
function canAddActivity(mid) {
  if (!currentUser) return false;
  if (currentUser.role === 'viewer') return false;
  return currentUser.role === 'admin' || currentUser.memberId === mid;
}
function canDeleteActivity() { return currentUser && currentUser.role === 'admin'; }
function canEditActivity(mid) {
  if (!currentUser) return false;
  if (currentUser.role === 'viewer') return false;
  return currentUser.role === 'admin' || currentUser.memberId === mid;
}
function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 60000);
  if (diff < 1) return 'Az önce';
  if (diff < 60) return diff + ' dk önce';
  if (diff < 1440) return Math.floor(diff / 60) + ' saat önce';
  return Math.floor(diff / 1440) + ' gün önce';
}

function doLogin() {
  const email = document.getElementById('loginUser').value.trim().toLowerCase();
  const pass = document.getElementById('loginPass').value;
  const errEl = document.getElementById('loginError');
  errEl.textContent = '';

  const btn = document.querySelector('.login-btn');
  btn.textContent = 'Giriþ yapýlýyor...';
  btn.disabled = true;

  auth.signInWithEmailAndPassword(email, pass)
    .then(cred => {
      const info = USER_MAP[email];
      if (!info) {
        auth.signOut();
        errEl.textContent = 'Bu hesabýn yetkisi tanýmlý deðil.';
        btn.textContent = 'Giriþ Yap'; btn.disabled = false;
        return;
      }
      currentUser = { ...info, email };
      document.getElementById('loginScreen').classList.add('hidden');
      document.getElementById('loadingOverlay').classList.remove('hidden');
      document.getElementById('headerAvatar').textContent = currentUser.initials;
      document.getElementById('headerAvatar').style.background = currentUser.color;
      document.getElementById('headerName').textContent = currentUser.name;

      const exportBtn = document.getElementById('exportDropBtn');
      if (exportBtn) exportBtn.style.display = (currentUser.role === 'admin') ? 'inline-flex' : 'none';

      const notesFlt = document.getElementById('notesFilterWrap');
      if (notesFlt) notesFlt.style.display = (currentUser.role === 'admin') ? 'block' : 'none';

      if (currentUser.role === 'admin' && typeof populateNotesFilter === 'function') {
        populateNotesFilter();
      }

      const tabNotesBtn = document.getElementById('tabBtnNotes');
      if (tabNotesBtn) {
        tabNotesBtn.style.display = (currentUser.role === 'admin') ? 'flex' : 'none';
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
      listenToProjects(currentPeriod);
      listenToCompanyAssignments();
      listenToWlRecords(currentPeriod);
      listenToOKR(currentPeriod);
      listenToLostSaleNotes(currentPeriod);
      if (typeof listenToPrivateNotes === 'function') listenToPrivateNotes(currentPeriod);
      setTimeout(() => showTakipPopup(), 1500);
      showToast(`Hoþ geldin, ${currentUser.name}!`, 'success');

      tryAutoOutlookLogin();
    })
    .catch(err => {
      const msgs = {
        'auth/user-not-found': 'E-posta bulunamadý.',
        'auth/wrong-password': 'Þifre hatalý.',
        'auth/invalid-email': 'Geçersiz e-posta.',
        'auth/too-many-requests': 'Çok fazla deneme. Lütfen bekle.',
        'auth/invalid-credential': 'E-posta veya þifre hatalý.',
      };
      errEl.textContent = msgs[err.code] || 'Giriþ baþarýsýz.';
      btn.textContent = 'Giriþ Yap'; btn.disabled = false;
    });
}

function doLogout() {
  auth.signOut().then(() => {
    currentUser = null;
    unsubscribeFns.forEach(fn => fn());
    unsubscribeFns = [];
    document.getElementById('loginScreen').classList.remove('hidden');
    document.getElementById('loginUser').value = '';
    document.getElementById('loginPass').value = '';
    document.getElementById('loginError').textContent = '';
    const btn = document.querySelector('.login-btn');
    if (btn) { btn.textContent = 'Giriþ Yap'; btn.disabled = false; }
  });
}

function toggleExportMenu(e) {
  e.stopPropagation();
  const menu = document.getElementById('exportMenu');
  const isOpen = menu.style.display !== 'none';
  menu.style.display = isOpen ? 'none' : 'block';
  if (!isOpen) {
    setTimeout(() => document.addEventListener('click', closeExportMenu, { once: true }), 0);
  }
}
function closeExportMenu() {
  const menu = document.getElementById('exportMenu');
  if (menu) menu.style.display = 'none';
}


function exportToPDF() {
  if (currentUser.role !== 'admin') return;
  showToast('PDF hazýrlanýyor...', 'success');

  const el = document.getElementById('tab-dashboard');

  const opt = {
    margin: [0.5, 0.5, 0.5, 0.5],
    filename: `IdealData_Ozet_${currentPeriod}.pdf`,
    image: { type: 'jpeg', quality: 0.95 },
    html2canvas: {
      scale: 1.5,
      useCORS: true,
      allowTaint: false,
      scrollX: 0,
      scrollY: -window.scrollY,
      windowWidth: document.documentElement.offsetWidth,
      logging: false,
      imageTimeout: 0,
    },
    jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
  };

  const clone = el.cloneNode(true);
  clone.style.cssText = 'display:block!important;position:static!important;animation:none!important;transform:none!important;';
  clone.querySelectorAll('*').forEach(n => {
    n.style.animation = 'none';
    n.style.transition = 'none';
    n.style.transform = 'none';
  });
  document.body.appendChild(clone);

  html2pdf().set(opt).from(clone).save().then(() => {
    document.body.removeChild(clone);
    showToast('PDF indirildi!', 'success');
  }).catch(e => {
    document.body.removeChild(clone);
    showToast('PDF hatasý: ' + e.message, 'error');
  });
}

function exportToExcel() {
  if (currentUser.role !== 'admin') return;
  if (typeof XLSX === 'undefined') { showToast('Excel kütüphanesi yüklenmedi, lütfen internet baðlantýsýný kontrol edin.', 'error'); return; }
  const headers = ['Kiþi', 'Departman', 'Kategori', 'Kurum', 'Durum', 'Açýklama', 'Sonraki Adým', 'Tarih', 'Dönem'];
  const rows = allActivities.map(a => [
    a.memberName || '', a.dept || '', a.fieldLabel || '',
    a.company || '', a.status || '', a.desc || '',
    a.nextStep || '', a.date || '', a.period || ''
  ]);
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  ws['!cols'] = [18, 18, 18, 28, 14, 40, 30, 12, 12].map(w => ({ wch: w }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Aktiviteler');
  XLSX.writeFile(wb, `idealdata_aktiviteler_${currentPeriod}.xlsx`);
  showToast('Excel dosyasý indirildi!', 'success');
}

function renderTeam() {
  const grid = document.getElementById('teamGrid');
  grid.innerHTML = '';
  TEAM_DEF.forEach((m, i) => {
    const canAdd = canAddActivity(m.id);
    const isAdmin = canEditTarget();
    const card = document.createElement('div');
    card.className = 'member-card';
    card.style.animationDelay = (0.07 * i) + 's';
    let fieldsHtml = '';
    m.fields.forEach(f => {
      const val = liveData[m.id][f.key];
      const p = f.hasTarget ? pct(val.actual, val.target) : null;
      fieldsHtml += `<div class="field-row">
        <span class="field-label">${f.emoji} ${f.label}</span>
        <span class="field-count" id="cnt_${m.id}_${f.key}">${val.actual}</span>
        ${f.hasTarget ? `
          <div class="target-edit">
            <span style="font-size:0.7rem;color:var(--ink3)">/ </span>
            <input class="target-input" type="number" min="0" value="${val.target}" id="tgt_${m.id}_${f.key}" ${!isAdmin ? 'disabled' : ''}>
            ${!isAdmin ? '<span class="lock-icon">??</span>' : ''}
          </div>
          <span class="field-pct" id="pct_${m.id}_${f.key}" style="color:${pctColor(p ?? 0)}">%${p ?? 0}</span>
        ` : '<span class="field-pct" style="color:var(--ink3)">—</span>'}
      </div>`;
    });
    const overall = calcOverall(m.id);
    const avatarHtml = m.photo
      ? `<img src="${m.photo}" alt="${m.name}" style="width:52px;height:52px;border-radius:14px;object-fit:cover;border:2px solid ${m.deptColor}33;box-shadow:0 2px 10px rgba(0,0,0,0.12);">`
      : `<div class="avatar" style="background:${m.avatarBg};color:${m.deptColor}">${m.initials}</div>`;
    card.innerHTML = `
      <div class="member-header">
        ${avatarHtml}
        <div class="member-info"><h3>${m.name}</h3><span style="font-size:0.68rem">${m.title || m.dept}</span></div>
        <div class="dept-tag" style="color:${m.deptColor};border-color:${m.deptColor}33;background:${m.deptColor}11">${m.dept}</div>
      </div>
      <div class="member-card-right">
        <div class="member-fields-grid">${fieldsHtml}</div>
        <div class="member-bar"><div class="bar-track"><div class="bar-fill" id="bar_${m.id}" style="width:${overall}%;background:${pctColor(overall)}"></div></div></div>
        <div style="display:flex;gap:0.5rem;margin-top:0.25rem">
          ${isAdmin ? `<button class="save-target-btn" style="flex:1" id="savetgt_${m.id}" onclick="saveTargets('${m.id}')">Hedefleri Kaydet</button>` : ''}
          ${canAdd ? `<button class="add-activity-btn" style="flex:1" onclick="openModal('${m.id}')">+ Aktivite Ekle</button>` : '<div style="flex:1;text-align:center;font-size:0.72rem;color:var(--ink3)">?? Sadece görüntüleme</div>'}
        </div>
      </div>
    `;
    grid.appendChild(card);
  });
}

function updateCard(mid) {
  const m = TEAM_DEF.find(x => x.id === mid);
  m.fields.forEach(f => {
    const val = liveData[mid][f.key];
    const el = document.getElementById(`cnt_${mid}_${f.key}`);
    if (el) {
      const currentVal = parseInt(el.textContent) || 0;
      if (currentVal !== val.actual) animateValue(el, currentVal, val.actual, 800);
    }
    if (f.hasTarget) {
      const tEl = document.getElementById(`tgt_${mid}_${f.key}`);
      if (tEl && document.activeElement !== tEl) tEl.value = val.target;
      const p = pct(val.actual, val.target);
      const pEl = document.getElementById(`pct_${mid}_${f.key}`);
      if (pEl) { pEl.textContent = '%' + p; pEl.style.color = pctColor(p); }

      // %100 ulaþýldýðýnda konfeti patlat (Tek seferlik)
      if (val.target > 0 && val.actual >= val.target) {
        if (el && (!el.dataset.confettiTarget || parseInt(el.dataset.confettiTarget) < val.target)) {
          setTimeout(() => triggerConfetti(), 300);
          el.dataset.confettiTarget = val.target;
        }
      }
    }
  });
  const bar = document.getElementById('bar_' + mid);
  if (bar) { const ov = calcOverall(mid); bar.style.width = ov + '%'; bar.style.background = pctColor(ov); }
}

function saveTargets(mid) {
  const m = TEAM_DEF.find(x => x.id === mid);
  const btn = document.getElementById('savetgt_' + mid);
  if (btn) { btn.disabled = true; btn.textContent = 'Kaydediliyor...'; }
  const data = { memberId: mid, period: currentPeriod, updatedAt: new Date().toISOString() };
  m.fields.forEach(f => {
    const tEl = document.getElementById(`tgt_${mid}_${f.key}`);
    data[f.key] = { actual: liveData[mid][f.key].actual, target: tEl ? (parseInt(tEl.value) || 0) : 0 };
  });
  db.collection('dashboard').doc(`${currentPeriod}_${mid}`).set(data)
    .then(() => { if (btn) { btn.textContent = '? Kaydedildi'; btn.classList.add('saved'); } showToast('Hedefler kaydedildi.', 'success'); })
    .catch(e => { if (btn) btn.textContent = 'Hata!'; })
    .finally(() => setTimeout(() => { if (btn) { btn.textContent = 'Hedefleri Kaydet'; btn.classList.remove('saved'); btn.disabled = false; } }, 2000));
}

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

function openModal(mid) {
  modalMemberId = mid;
  editActivityId = null;
  const m = TEAM_DEF.find(x => x.id === mid);
  document.getElementById('modalTitle').textContent = m.name + ' — Aktivite Ekle';
  document.getElementById('modalSub').textContent = 'Yaptýðýn iþi kaydet, sayaç otomatik artar';
  document.getElementById('modalField').innerHTML = m.fields.map(f => `<option value="${f.key}">${f.emoji} ${f.label}</option>`).join('');
  populateCompanyDropdown('');
  document.getElementById('modalCompanyCustom').classList.add('hidden');
  document.getElementById('modalCompanyCustom').value = '';
  document.getElementById('modalStatus').value = 'Tamamlandý';
  document.getElementById('modalDesc').value = '';
  document.getElementById('modalDate').value = new Date().toISOString().split('T')[0];
  document.getElementById('modalTimeStart').value = '09:00';
  document.getElementById('modalTimeEnd').value = '09:30';
  document.getElementById('modalNextStep').value = '';
  document.getElementById('modalSaveBtn').textContent = 'Kaydet';
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
}

function openEditModal(actId) {
  const a = allActivities.find(x => x.id === actId);
  if (!a) return;
  editActivityId = actId;
  modalMemberId = a.memberId;
  const m = TEAM_DEF.find(x => x.id === a.memberId);
  document.getElementById('modalTitle').textContent = 'Aktiviteyi Düzenle';
  document.getElementById('modalSub').textContent = m.name + ' · ' + a.fieldLabel;
  document.getElementById('modalField').innerHTML = m.fields.map(f => `<option value="${f.key}" ${f.key === a.fieldKey ? 'selected' : ''}>${f.emoji} ${f.label}</option>`).join('');
  populateCompanyDropdown(a.company || '');
  document.getElementById('modalCompanyCustom').classList.add('hidden');
  document.getElementById('modalStatus').value = a.status || 'Tamamlandý';
  document.getElementById('modalDesc').value = a.desc || '';
  document.getElementById('modalNextStep').value = a.nextStep || '';
  document.getElementById('modalVIP').checked = a.vip || false;
  document.getElementById('modalDate').value = a.date || '';
  document.getElementById('modalTimeStart').value = a.timeStart || '09:00';
  document.getElementById('modalTimeEnd').value = a.timeEnd || '09:30';
  document.getElementById('modalSaveBtn').textContent = 'Güncelle';

  const delBtn = document.getElementById('activityDeleteBtn');
  if (currentUser.role === 'admin') delBtn.style.display = 'block';
  else delBtn.style.display = 'none';

  document.getElementById('activityModal').classList.remove('hidden');
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
  if (!confirm('Bu aktiviteyi ve iliþkili istatistiðini tamamen silmek istediðinize emin misiniz?')) return;

  const actId = editActivityId;
  const a = allActivities.find(x => x.id === actId);
  if (!a) return;

  db.collection('activities').doc(actId).delete()
    .then(() => {
      showToast('Aktivite silindi.', 'success');
      const m = TEAM_DEF.find(x => x.id === a.memberId);
      const f = m.fields.find(f => f.key === a.fieldKey);
      if (!f.noCount) {
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
  if (!desc) { showToast('Lütfen bir açýklama gir.', 'error'); return; }
  const m = TEAM_DEF.find(x => x.id === modalMemberId);
  const field = m.fields.find(f => f.key === fieldKey);

  db.collection('activities').add({
    memberId: modalMemberId, memberName: m.name, memberInitials: m.initials,
    memberColor: m.deptColor, memberBg: m.avatarBg, dept: m.dept,
    fieldKey, fieldLabel: field.label, fieldEmoji: field.emoji,
    company, status, desc, nextStep, vip, date, timeStart, timeEnd, period: currentPeriod, createdAt: new Date().toISOString()
  }).then(() => {
    // Yeni kurulan þirketi bu temsilciye otomatik kilitle
    if (company && (!companyAssignments[company] || !companyAssignments[company].includes(modalMemberId))) {
      db.collection('company_assignments').doc(company).set({
        assignedMembers: firebase.firestore.FieldValue.arrayUnion(modalMemberId)
      }, { merge: true });
    }
  }).then(() => {
    // OTOMATÝK PIPELINE CREATE / UPDATE (Müþteri Ziyareti / Teklif)
    const price = parseInt(document.getElementById('modalPrice').value) || 0;
    if (fieldKey === 'teklif') {
      const existingDeal = allDeals.find(d => d.company === company && d.stage === 'Toplantý');
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
      const existingDeal = allDeals.find(d => d.company === company && d.stage !== 'Faturalandýrýldý');
      if (!existingDeal) {
        db.collection('deals').add({
          company, stage: 'Toplantý', value: 0, desc,
          memberId: modalMemberId, memberName: m.name, memberInitials: m.initials, memberColor: m.deptColor,
          period: currentPeriod, createdAt: new Date().toISOString()
        });
      }
    }

    if (!field.noCount) {
      const newActual = (liveData[modalMemberId][fieldKey]?.actual || 0) + 1;
      liveData[modalMemberId][fieldKey].actual = newActual;
      const dashData = { memberId: modalMemberId, period: currentPeriod, updatedAt: new Date().toISOString() };
      m.fields.forEach(f => { dashData[f.key] = liveData[modalMemberId][f.key]; });
      return db.collection('dashboard').doc(`${currentPeriod}_${modalMemberId}`).set(dashData);
    }
  }).then(() => {
    closeModal();
    showToast('Aktivite baþarýyla eklendi!', 'success');
    if (vip) setTimeout(() => triggerConfetti(), 400);
  }).catch(e => showToast('Hata: ' + e.message, 'error'));
}

function saveEdit() {
  const a = allActivities.find(x => x.id === editActivityId);
  if (!a) return;
  const desc = document.getElementById('modalDesc').value.trim();
  if (!desc) { showToast('Açýklama boþ olamaz.', 'error'); return; }
  const newFieldKey = document.getElementById('modalField').value;
  const oldFieldKey = a.fieldKey;
  const m = TEAM_DEF.find(x => x.id === a.memberId);
  const newField = m.fields.find(f => f.key === newFieldKey);
  const oldField = m.fields.find(f => f.key === oldFieldKey);
  const now = new Date().toISOString();

  const categoryChanged = newFieldKey !== oldFieldKey;

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
        editedAt: now, editedBy: currentUser.name
      });
    }).then(() => {
      if (categoryChanged) {
        if (oldField && !oldField.noCount) {
          liveData[a.memberId][oldFieldKey].actual = Math.max(0, (liveData[a.memberId][oldFieldKey]?.actual || 1) - 1);
        }
        if (newField && !newField.noCount) {
          liveData[a.memberId][newFieldKey].actual = (liveData[a.memberId][newFieldKey]?.actual || 0) + 1;
        }
        const dashData = { memberId: a.memberId, period: currentPeriod, updatedAt: now };
        m.fields.forEach(f => { dashData[f.key] = liveData[a.memberId][f.key]; });
        return db.collection('dashboard').doc(`${currentPeriod}_${a.memberId}`).set(dashData);
      }
    }).then(() => {
      closeModal();
      showToast('Aktivite güncellendi.', 'success');
    }).catch(e => showToast('Düzenlenemedi: ' + e.message, 'error'));
}

function deleteActivity(actId, mid, fieldKey) {
  if (!confirm('Bu aktiviteyi silmek istediðine emin misin?')) return;
  const m = TEAM_DEF.find(x => x.id === mid);
  const field = m?.fields.find(f => f.key === fieldKey);
  db.collection('activities').doc(actId).delete().then(() => {
    if (!field?.noCount) {
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
        // Eðer bu aktiviteyi currentUser eklemediyse ona bildirim göster
        if (d.memberName !== currentUser.name) {
          // Sayfa ilk yüklendiðinde geçmiþ verileri toast yapmamak için ufak bir kontrol:
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
    const el = document.getElementById('totalActivities');
    if (el) el.textContent = allActivities.length;
  });
  unsubscribeFns.push(unsub);
}

function renderActivities() {
  const list = document.getElementById('activityList');
  const filtered = currentFilter === 'all' ? allActivities : allActivities.filter(a => a.memberId === currentFilter);
  if (!filtered.length) { list.innerHTML = '<div class="no-activity">Henüz aktivite yok ??</div>'; return; }
  list.innerHTML = '';
  filtered.forEach(a => {
    const canDel = canDeleteActivity();
    const canEdit = canEditActivity(a.memberId);
    const item = document.createElement('div');
    item.className = 'activity-item';
    item.innerHTML = `
      <div class="activity-avatar" style="background:${a.memberBg || '#f0f0f0'};color:${a.memberColor || '#333'}">${a.memberInitials || '?'}</div>
      <div class="activity-body">
        <div class="activity-header">
          <span class="activity-name">${a.memberName}</span>
          <span class="activity-field" style="color:${a.memberColor};border-color:${a.memberColor}33;background:${a.memberColor}11">${a.fieldEmoji} ${a.fieldLabel}</span>
          <span class="activity-time">${timeAgo(a.createdAt)}</span>
          <div style="margin-left:auto;display:flex;gap:0.3rem">
            ${canEdit ? `<button onclick="openEditModal('${a.id}')" style="background:none;border:1px solid var(--border);cursor:pointer;color:var(--ink3);font-size:0.75rem;padding:0.2rem 0.5rem;border-radius:6px">?? Düzenle</button>` : ''}
            ${canDel ? `<button onclick="deleteActivity('${a.id}','${a.memberId}','${a.fieldKey}')" style="background:none;border:1px solid var(--border);cursor:pointer;color:var(--ink3);font-size:0.75rem;padding:0.2rem 0.5rem;border-radius:6px">?? Sil</button>` : ''}
          </div>
        </div>
        <div class="activity-desc">${a.desc}</div>
        ${a.company ? `<div class="activity-customer">?? <span>${a.company}</span></div>` : ''}
        <div style="display:flex;align-items:center;gap:0.5rem;margin-top:0.3rem">
          ${a.status ? `<span class="status-badge ${a.status === 'Tamamlandý' ? 'status-done' : a.status === 'Takip' ? 'status-takip' : 'status-beklemede'}">${a.status === 'Tamamlandý' ? '?' : a.status === 'Takip' ? '??' : '?'} ${a.status}</span>` : ''}
          <span style="font-size:0.7rem;color:var(--ink3)">?? ${a.date}</span>
        </div>
      </div>`;
    list.appendChild(item);
  });
}

function renderCRM() {
  const personFilter = document.getElementById('crmFilterPerson').value;
  const statusFilter = document.getElementById('crmFilterStatus').value;
  const vipFilter = document.getElementById('crmFilterVIP') ? document.getElementById('crmFilterVIP').value : 'all';
  const categoryFilter = document.getElementById('crmFilterCategory') ? document.getElementById('crmFilterCategory').value : 'all';
  const search = document.getElementById('crmSearch').value.trim().toLowerCase();

  const startDateStr = document.getElementById('crmFilterStartDate') ? document.getElementById('crmFilterStartDate').value : '';
  const endDateStr = document.getElementById('crmFilterEndDate') ? document.getElementById('crmFilterEndDate').value : '';

  let filtered = allActivities.filter(a => {
    if (personFilter !== 'all' && a.memberId !== personFilter) return false;
    if (statusFilter !== 'all' && a.status !== statusFilter) return false;
    if (vipFilter === 'vip' && !a.vip) return false;
    if (categoryFilter !== 'all' && a.fieldKey !== categoryFilter) return false;
    if (search && !((a.company || '').toLowerCase().includes(search)) && !((a.desc || '').toLowerCase().includes(search))) return false;
    if (startDateStr && a.date && a.date < startDateStr) return false;
    if (endDateStr && a.date && a.date > endDateStr) return false;
    return true;
  });

  const cols = {
    'Beklemede': { el: document.getElementById('kb-cards-beklemede'), count: 0 },
    'Takip': { el: document.getElementById('kb-cards-takip'), count: 0 },
    'Tamamlandý': { el: document.getElementById('kb-cards-tamamlandi'), count: 0 }
  };

  if (cols['Beklemede'].el) cols['Beklemede'].el.innerHTML = '';
  if (cols['Takip'].el) cols['Takip'].el.innerHTML = '';
  if (cols['Tamamlandý'].el) cols['Tamamlandý'].el.innerHTML = '';

  if (!filtered.length) {
    if (cols['Beklemede'].el) cols['Beklemede'].el.innerHTML = '<div style="text-align:center;padding:1rem;color:var(--ink3);font-size:0.8rem">Kayýt bulunamadý ??</div>';
  } else {
    const memberColors = { esma: '#e63946', dilan: '#8b5cf6', melek: '#f59e0b', elif: '#457b9d' };

    filtered.forEach(a => {
      const st = a.status || 'Beklemede';
      const colObj = cols[st] || cols['Beklemede'];
      if (!colObj.el) return;

      colObj.count++;
      const companyEsc = (a.company || '').replace(/'/g, "\\'");

      const card = document.createElement('div');
      card.className = 'kanban-card kanban-glow-target';

      const canEdit = canEditActivity(a.memberId);
      if (canEdit) {
        card.draggable = true;
        card.ondragstart = (e) => kbDragStart(e, a.id);
        card.ondragend = (e) => kbDragEnd(e);
      }

      card.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:0.4rem;">
          <div class="kanban-card-title" style="cursor:pointer;color:var(--accent2)" onclick="showCompanyDetail('${companyEsc}')">${a.vip ? '? ' : ''}${a.company || 'Genel'}</div>
          <div style="display:flex;gap:0.4rem;align-items:center;">
            <span style="font-size:0.7rem;color:var(--ink3)">?? ${a.date || ''}</span>
            ${canEdit ? `<span onclick="openEditModal('${a.id}')" style="cursor:pointer;font-size:0.7rem;background:var(--bg);border:1px solid var(--border);border-radius:4px;padding:0.1rem 0.3rem;" title="Düzenle">??</span>` : ''}
          </div>
        </div>
        <div class="kanban-card-desc">${a.desc || '—'}</div>
        ${a.nextStep ? `<div style="font-size:0.75rem;color:var(--accent2);margin-bottom:0.5rem">› ${a.nextStep}</div>` : ''}
        <div class="kanban-card-footer">
          <div style="display:flex;align-items:center;gap:0.4rem">
             <div class="avatar" style="width:20px;height:20px;font-size:0.6rem;background:${memberColors[a.memberId] || '#ccc'}22;color:${memberColors[a.memberId] || '#ccc'};border-radius:50%;display:flex;align-items:center;justify-content:center;">${a.memberInitials || '?'}</div>
             <span style="font-size:0.75rem;font-weight:600;color:var(--ink2)">${a.memberName}</span>
          </div>
          <span style="font-size:0.7rem;background:var(--bg);border:1px solid var(--border);padding:0.15rem 0.4rem;border-radius:6px;font-weight:500;">${a.fieldEmoji || ''} ${a.fieldLabel || ''}</span>
        </div>
      `;
      colObj.el.appendChild(card);
    });
  }

  const cB = document.getElementById('kb-count-beklemede'); if (cB) cB.textContent = cols['Beklemede'].count;
  const cT = document.getElementById('kb-count-takip'); if (cT) cT.textContent = cols['Takip'].count;
  const cD = document.getElementById('kb-count-tamamlandi'); if (cD) cD.textContent = cols['Tamamlandý'].count;

  const done = cols['Tamamlandý'].count;
  const takip = cols['Takip'].count;
  const bekle = cols['Beklemede'].count;
  const vips = filtered.filter(a => a.vip).length;
  document.getElementById('crmStats').innerHTML = `
    <div class="crm-stat" style="color:#2a9d8f">? ${done} Tamamlandý</div>
    <div class="crm-stat" style="color:#457b9d">?? ${takip} Takip</div>
    <div class="crm-stat" style="color:#f4a261">? ${bekle} Beklemede</div>
    ${vips ? `<div class="crm-stat" style="color:var(--gold)">? ${vips} VIP</div>` : ''}
  `;
}

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
  const done = companyDetailActs.filter(a => a.status === 'Tamamlandý').length;
  const takip = companyDetailActs.filter(a => a.status === 'Takip').length;
  const bekle = companyDetailActs.filter(a => a.status === 'Beklemede').length;
  const isVip = companyDetailActs.some(a => a.vip);
  document.getElementById('companyModalSub').textContent = `${companyDetailActs.length} kayýt · ${done} tamamlandý · ${takip} takip · ${bekle} beklemede ${isVip ? '· ? VIP' : ''}`;

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
    btn.textContent = '? Kaydedildi';
    btn.style.background = 'var(--green)';
  }).catch(e => {
    showToast('Hata: ' + e.message, 'error');
    btn.textContent = 'Hata!';
  }).finally(() => {
    setTimeout(() => {
      btn.textContent = '?? Kaydet';
      btn.style.background = 'var(--btn-bg)';
      btn.disabled = false;
    }, 2000);
  });
}

function renderCompanyPage() {
  const body = document.getElementById('companyModalBody');
  if (!companyDetailActs.length) { body.innerHTML = '<div style="text-align:center;color:var(--ink3);padding:1rem">Kayýt bulunamadý</div>'; return; }
  const start = companyDetailPage * COMPANY_PAGE_SIZE;
  const page = companyDetailActs.slice(start, start + COMPANY_PAGE_SIZE);
  const totalPages = Math.ceil(companyDetailActs.length / COMPANY_PAGE_SIZE);
  body.innerHTML = page.map(a => {
    const statusClass = a.status === 'Tamamlandý' ? 'status-done' : a.status === 'Takip' ? 'status-takip' : 'status-beklemede';
    const statusIcon = a.status === 'Tamamlandý' ? '?' : a.status === 'Takip' ? '??' : '?';
    return `<div style="background:var(--bg);border-radius:10px;padding:0.85rem;margin-bottom:0.6rem;border-left:3px solid var(--border)">
      <div style="display:flex;align-items:center;gap:0.5rem;flex-wrap:wrap;margin-bottom:0.3rem">
        <span style="font-weight:600;font-size:0.82rem">${a.memberName}</span>
        <span class="status-badge ${statusClass}" style="font-size:0.68rem">${statusIcon} ${a.status}</span>
        <span style="font-size:0.7rem;color:var(--ink3);margin-left:auto">?? ${a.date}</span>
      </div>
      <div style="font-size:0.82rem;color:var(--ink2)">${a.desc}</div>
      ${a.nextStep ? `<div style="font-size:0.75rem;color:var(--accent2);margin-top:0.3rem">› ${a.nextStep}</div>' : ''}
      ${a.editedAt ? `<div style="font-size:0.68rem;color:var(--ink3);margin-top:0.3rem">?? ${a.editedBy || '?'} düzenledi</div>' : ''}
      <div style="display:flex;gap:0.5rem;margin-top:0.5rem;flex-wrap:wrap">
        ${canEditActivity(a.memberId) ? `<button onclick="document.getElementById('companyModal').classList.add('hidden');openEditModal('${a.id}')" style="background:none;border:1px solid var(--border);border-radius:6px;padding:0.2rem 0.6rem;font-size:0.7rem;color:var(--ink3);cursor:pointer">?? Düzenle</button>` : ''}
        <button onclick="toggleHistory('${a.id}')" style="background:none;border:1px dashed var(--border);border-radius:6px;padding:0.2rem 0.6rem;font-size:0.7rem;color:var(--ink3);cursor:pointer">?? Geçmiþ</button>
      </div>
      <div id="hist-${a.id}" style="display:none;margin-top:0.5rem"></div>
    </div>`;
  }).join('');
  if (totalPages > 1) {
    body.innerHTML += `<div style="display:flex;align-items:center;justify-content:center;gap:0.75rem;margin-top:0.75rem">
      <button onclick="companyDetailPage--;renderCompanyPage()" ${companyDetailPage === 0 ? 'disabled style="opacity:0.4"' : ''} style="background:var(--bg);border:1px solid var(--border);border-radius:8px;padding:0.35rem 0.8rem;cursor:pointer;font-size:0.82rem">‹ Önceki</button>
      <span style="font-size:0.78rem;color:var(--ink3)">${companyDetailPage + 1} / ${totalPages}</span>
      <button onclick="companyDetailPage++;renderCompanyPage()" ${companyDetailPage >= totalPages - 1 ? 'disabled style="opacity:0.4"' : ''} style="background:var(--bg);border:1px solid var(--border);border-radius:8px;padding:0.35rem 0.8rem;cursor:pointer;font-size:0.82rem">Sonraki ›</button>
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
      if (snap.empty) { el.innerHTML = '<div style="font-size:0.75rem;color:var(--ink3);padding:0.3rem">Geçmiþ yok</div>'; return; }
      el.innerHTML = snap.docs.map(d => {
        const h = d.data();
        const statusIcon = h.status === 'Tamamlandý' ? '?' : h.status === 'Takip' ? '??' : '?';
        return `<div style="background:var(--surface);border-radius:8px;padding:0.6rem;margin-bottom:0.4rem;border:1px solid var(--border);font-size:0.75rem">
          <div style="display:flex;gap:0.5rem;align-items:center;margin-bottom:0.2rem;flex-wrap:wrap">
            <span style="color:var(--ink3)">${h.savedAt ? h.savedAt.slice(0, 10) : '?'}</span>
            <span>${statusIcon} ${h.status || '—'}</span>
            <span style="color:var(--ink3);margin-left:auto">by ${h.savedBy || '?'}</span>
          </div>
          <div style="color:var(--ink2)">${h.desc || '—'}</div>
          ${h.nextStep ? `<div style="color:var(--accent2);margin-top:0.2rem">› ${h.nextStep}</div>` : ''}
        </div>`;
      }).join('');
    }).catch(() => { el.innerHTML = '<div style="font-size:0.75rem;color:#e63946">Yüklenemedi</div>'; });
}

function renderWeekly() {
  const now = new Date();
  const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
  const grid = document.getElementById('weeklyGrid');
  grid.innerHTML = '';

  TEAM_DEF.forEach((m, i) => {
    const weekActs = allActivities.filter(a => a.memberId === m.id && new Date(a.createdAt) >= weekAgo);
    const totalActs = weekActs.length;
    const musteriActs = weekActs.filter(a => a.fieldKey === 'musteri').length;
    const temasActs = weekActs.filter(a => a.fieldKey === 'temas').length;
    const teklifActs = weekActs.filter(a => a.fieldKey === 'teklif').length;

    const card = document.createElement('div');
    card.className = 'weekly-card';
    card.style.animationDelay = (0.07 * i) + 's';

    const isSales = m.dept === 'Satýþ';
    const statsHtml = isSales ? `
      <div class="weekly-stat"><span>?? Yeni Müþteri</span><span class="weekly-stat-val" style="color:${m.deptColor}">${musteriActs}</span></div>
      <div class="weekly-stat"><span>?? Temas</span><span class="weekly-stat-val" style="color:${m.deptColor}">${temasActs}</span></div>
      <div class="weekly-stat"><span>?? Teklif</span><span class="weekly-stat-val" style="color:${m.deptColor}">${teklifActs}</span></div>
    ` : Object.entries(weekActs.reduce((acc, a) => { acc[a.fieldLabel] = (acc[a.fieldLabel] || 0) + 1; return acc; }, {}))
      .map(([lbl, cnt]) => `<div class="weekly-stat"><span>${lbl}</span><span class="weekly-stat-val" style="color:${m.deptColor}">${cnt}</span></div>`).join('');

    card.innerHTML = `
      <div class="weekly-card-header">
        <div class="avatar" style="background:${m.avatarBg};color:${m.deptColor};width:38px;height:38px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-family:'Bebas Neue',sans-serif;font-size:0.9rem;flex-shrink:0">${m.initials}</div>
        <div><div class="weekly-member-name">${m.name}</div><div class="weekly-member-dept">${m.dept} · Bu hafta ${totalActs} aktivite</div></div>
      </div>
      ${statsHtml || '<div style="font-size:0.82rem;color:var(--ink3);text-align:center;padding:0.5rem">Bu hafta aktivite yok</div>'}
    `;
    grid.appendChild(card);
  });
}

function showTakipPopup() {
  const myId = currentUser.memberId;
  let takipList = currentUser.role === 'admin'
    ? allActivities.filter(a => a.status === 'Takip')
    : allActivities.filter(a => a.status === 'Takip' && a.memberId === myId);

  if (!takipList.length) return;

  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:2000;display:flex;align-items:center;justify-content:center;padding:1rem;animation:fadeIn 0.3s ease';
  overlay.innerHTML = `
    <div style="background:var(--surface);border-radius:20px;padding:2rem;max-width:500px;width:100%;max-height:80vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,0.3)">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1.25rem">
        <div>
          <div style="font-family:'Bebas Neue',sans-serif;font-size:1.4rem;letter-spacing:0.08em;color:var(--ink)">?? Takip Listesi</div>
          <div style="font-size:0.78rem;color:var(--ink3)">${takipList.length} bekleyen takip kaydýn var</div>
        </div>
        <button onclick="this.closest('div[style*=fixed]').remove()" style="background:var(--bg);border:1px solid var(--border);border-radius:8px;padding:0.4rem 0.75rem;cursor:pointer;font-size:0.82rem;color:var(--ink)">Kapat</button>
      </div>
      ${takipList.map(a => `
        <div style="background:var(--bg);border-radius:12px;padding:1rem;margin-bottom:0.75rem;border-left:3px solid #457b9d">
          <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.4rem;flex-wrap:wrap">
            <span style="font-weight:700;font-size:0.85rem;color:var(--ink)">${a.memberName}</span>
            <span style="font-size:0.72rem;color:var(--ink3)">·</span>
            <span style="font-size:0.72rem;font-weight:600;color:#457b9d">${a.fieldEmoji} ${a.fieldLabel}</span>
            <span style="font-size:0.7rem;color:var(--ink3);margin-left:auto">?? ${a.date}</span>
          </div>
          <div style="font-size:0.82rem;color:var(--ink2);margin-bottom:0.3rem">${a.desc}</div>
          ${a.company ? `<div style="font-size:0.75rem;color:var(--ink3)">?? ${a.company}</div>' : ''}
        </div>
      `).join('')}
    </div>`;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
}

const BADGES = [
  { id: 'ilk_musteri', icon: '??', label: 'Ýlk Müþteri', check: (c, a) => c >= 1 },
  { id: 'musteri_5', icon: '??', label: '5 Müþteri', check: (c, a) => c >= 5 },
  { id: 'musteri_10', icon: '??', label: '10 Müþteri', check: (c, a) => c >= 10 },
  { id: 'aktivite_10', icon: '?', label: '10 Aktivite', check: (c, a) => a >= 10 },
  { id: 'aktivite_50', icon: '??', label: '50 Aktivite', check: (c, a) => a >= 50 },
  { id: 'crm_star', icon: '??', label: 'CRM Ustasý', check: (c, a, crm) => crm >= 20 },
];

function renderBadges(totalMusteri, totalCRM) {
  const totalActs = allActivities.length;
  const badgeEl = document.getElementById('badgeStrip');
  if (!badgeEl) return;
  badgeEl.innerHTML = BADGES.map(b => {
    const earned = b.check(totalMusteri, totalActs, totalCRM);
    return `<div style="display:inline-flex;align-items:center;gap:0.35rem;padding:0.3rem 0.75rem;border-radius:99px;border:1px solid ${earned ? 'var(--gold)' : 'var(--border)'};background:${earned ? 'rgba(244,162,97,0.12)' : 'transparent'};font-size:0.75rem;font-weight:600;color:${earned ? 'var(--gold)' : 'var(--ink3)'}">
      ${b.icon} ${b.label}
    </div>`;
  }).join('');
}

function saveMeetingNote() {
  const date = document.getElementById('meetingDate').value;
  const note = document.getElementById('meetingNote').value.trim();
  if (!note) { showToast('Not boþ olamaz.', 'warning'); return; }
  db.collection('meetings').add({
    date, note, createdBy: currentUser.name,
    createdAt: new Date().toISOString(), period: currentPeriod
  }).then(() => {
    document.getElementById('meetingModal').classList.add('hidden');
    document.getElementById('meetingNote').value = '';
    loadMeetingNotes();
    showToast('Toplantý notu kaydedildi.', 'success');
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
              <span style="font-weight:700;font-size:0.85rem;color:var(--ink)">?? ${n.date}</span>
              <span style="font-size:0.72rem;color:var(--ink3)">${n.createdBy}</span>
            </div>
            <div style="font-size:0.85rem;color:var(--ink2);white-space:pre-wrap">${n.note}</div>
          </div>
        `).join('')}
      `;
    });
}

function renderWeeklySummary() {
  const now = new Date();
  const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
  const weekActs = allActivities.filter(a => new Date(a.createdAt) >= weekAgo);
  const el = document.getElementById('weeklySummaryBox');
  if (!el) return;
  if (!weekActs.length) { el.style.display = 'none'; return; }
  el.style.display = 'block';
  const totalThisWeek = weekActs.length;
  const musteri = weekActs.filter(a => a.fieldKey === 'musteri').length;
  const temas = weekActs.filter(a => a.fieldKey === 'temas').length;
  const teklif = weekActs.filter(a => a.fieldKey === 'teklif').length;
  el.innerHTML = `
    <div style="display:flex;align-items:center;gap:0.75rem;flex-wrap:wrap">
      <span style="font-size:0.82rem;font-weight:700;color:var(--ink2)">?? Bu Hafta:</span>
      <span style="font-size:0.78rem;color:var(--ink3)">${totalThisWeek} aktivite</span>
      ${musteri ? `<span style="font-size:0.78rem;color:#e63946">?? ${musteri} müþteri</span>` : ''}
      ${temas ? `<span style="font-size:0.78rem;color:#457b9d">?? ${temas} temas</span>` : ''}
      ${teklif ? `<span style="font-size:0.78rem;color:#f4a261">?? ${teklif} teklif</span>` : ''}
    </div>
  `;
}

function renderLeaderboard() {
  const sorted = [...TEAM_DEF].map(m => ({ ...m, overall: calcOverall(m.id) })).sort((a, b) => b.overall - a.overall);
  const lb = document.getElementById('leaderboard'); lb.innerHTML = '';
  const rankStyles = ['gold', 'silver', 'bronze'];
  sorted.forEach((m, i) => {
    const rank = rankStyles[i] || 'default';
    const mf = liveData[m.id]['musteri'];
    const tf = liveData[m.id]['teklif'];
    const actCount = allActivities.filter(a => a.memberId === m.id).length;
    const sub = mf ? `${mf.actual} müþteri${tf ? ' · ' + tf.actual + ' teklif' : ''}` : Object.values(liveData[m.id]).reduce((s, v) => s + v.actual, 0) + ' içerik';
    const row = document.createElement('div'); row.className = 'lb-row';
    const rankBadge = rank === 'default'
      ? `<div class="lb-rank" style="background:var(--bg);color:var(--ink3);border:1px solid var(--border)">${i + 1}</div>`
      : `<div class="lb-rank ${rank}">${i + 1}</div>`;
    row.innerHTML = `
      ${rankBadge}
      <div class="avatar" style="background:${m.avatarBg};color:${m.deptColor};width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-family:'Bebas Neue',sans-serif;font-size:0.82rem;flex-shrink:0">${m.initials}</div>
      <div style="flex:1"><div class="lb-name" style="color:var(--ink)">${m.name}</div><div class="lb-dept">${m.dept} · ${sub} · ${actCount} aktivite</div></div>
      <div class="lb-bar-wrap"><div class="lb-bar-track"><div class="lb-bar-fill" style="width:${m.overall}%;background:${pctColor(m.overall)}"></div></div></div>
      <div class="lb-score" style="color:${pctColor(m.overall)}">${m.overall > 0 ? '%' + m.overall : '—'}</div>`;
    lb.appendChild(row);
  });
}

function renderDonut() {
  const canvas = document.getElementById('donutChart'); const ctx = canvas.getContext('2d');
  const depts = {};
  TEAM_DEF.forEach(m => {
    const mf = liveData[m.id]['musteri'];
    const total = mf ? mf.actual : Object.values(liveData[m.id]).reduce((s, v) => s + v.actual, 0);
    depts[m.dept] = (depts[m.dept] || 0) + total;
  });
  const total = Object.values(depts).reduce((a, b) => a + b, 0) || 1;
  const colors = { 'Satýþ': '#e63946', 'Dijital Pazarlama': '#457b9d' };
  ctx.clearRect(0, 0, 120, 120);
  let start = -Math.PI / 2;
  Object.entries(depts).forEach(([dept, val]) => {
    const slice = (val / total) * Math.PI * 2;
    ctx.beginPath(); ctx.moveTo(60, 60); ctx.arc(60, 60, 50, start, start + slice); ctx.closePath();
    ctx.fillStyle = colors[dept] || '#ccc'; ctx.fill(); start += slice;
  });
  const isDark = document.body.getAttribute('data-theme') === 'dark';
  ctx.beginPath(); ctx.arc(60, 60, 27, 0, Math.PI * 2); ctx.fillStyle = isDark ? '#1e1e2f' : 'white'; ctx.fill();
  const legend = document.getElementById('donutLegend'); legend.innerHTML = '';
  Object.entries(depts).forEach(([dept, val]) => {
    legend.innerHTML += `<div class="legend-item"><div class="legend-dot" style="background:${colors[dept] || '#ccc'}"></div><div><div style="font-weight:600;font-size:0.76rem;color:var(--ink)">${dept}</div><div style="font-size:0.68rem;color:var(--ink3)">${val} kayýt</div></div></div>`;
  });
}

function renderBarChart() {
  const TREND = [2, 4, 3, 5, 0, 0], LABELS = ['Oca', 'Þub', 'Mar', 'Nis', 'May', 'Haz'];
  const chart = document.getElementById('barChart'); chart.innerHTML = '';
  const max = Math.max(...TREND, 1);
  TREND.forEach((v, i) => {
    const col = document.createElement('div'); col.className = 'bar-col';
    const h = v > 0 ? Math.max(8, Math.round((v / max) * 100)) : 4;
    col.innerHTML = `<div style="flex:1;display:flex;align-items:flex-end;width:100%"><div class="bar-col-fill" style="height:${h}%;background:${v > 0 ? '#457b9d' : 'var(--border)'}"></div></div><div class="bar-col-label">${LABELS[i]}</div>`;
    chart.appendChild(col);
  });
}

function updateCompanyKPIs() {
  const periodActs = allActivities.filter(a => a.period === currentPeriod);

  // Toplam Yeni Müþteri
  const totalMusteri = periodActs.filter(a => a.fieldKey === 'musteri').length;
  const totalMusteriTarget = TEAM_DEF
    .filter(m => m.fields.find(f => f.key === 'musteri'))
    .reduce((s, m) => s + (liveData[m.id]['musteri']?.target || 0), 0);
  const custPct = totalMusteriTarget > 0 ? Math.min(100, Math.round((totalMusteri / totalMusteriTarget) * 100)) : 0;

  const tcEl = document.getElementById('totalCustomers');
  if (tcEl) tcEl.textContent = totalMusteri;
  const tctEl = document.getElementById('totalCustTarget');
  if (tctEl) tctEl.textContent = totalMusteriTarget;
  const cfEl = document.getElementById('custFill');
  if (cfEl) cfEl.style.width = custPct + '%';
  const cpEl = document.getElementById('custPct');
  if (cpEl) cpEl.textContent = '%' + custPct;

  const totalTeklif = periodActs.filter(a => a.fieldKey === 'teklif').length;
  const toEl = document.getElementById('totalOffers');
  if (toEl) toEl.textContent = totalTeklif;

  // Günlük Ortalama CRM
  const totalCRM = periodActs.length;
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const daysPassed = Math.max(1, Math.ceil((now - monthStart) / (1000 * 60 * 60 * 24)));
  const dailyAvg = (totalCRM / daysPassed).toFixed(1);
  const daEl = document.getElementById('dailyAvgCRM');
  if (daEl) daEl.textContent = dailyAvg;
  const tcrmEl = document.getElementById('totalCRMCount');
  if (tcrmEl) tcrmEl.textContent = totalCRM;

  // Dönüþüm Oraný
  const totalTemas = periodActs.filter(a => a.fieldKey === 'temas').length;
  const convRate = totalTemas > 0 ? Math.round((totalMusteri / totalTemas) * 100) : 0;
  const crEl = document.getElementById('conversionRate');
  if (crEl) crEl.textContent = '%' + convRate;
  const cpillEl = document.getElementById('conversionPill');
  if (cpillEl) cpillEl.textContent = convRate >= 20 ? '?? Güçlü' : convRate >= 10 ? '?? Ýyi' : '?? Geliþiyor';

  renderBadges(totalMusteri, totalCRM);
}

function changePeriod() {
  currentPeriod = document.getElementById('monthSel').value;
  document.getElementById('currentPeriod').textContent = currentPeriod;
  document.getElementById('loadingOverlay').classList.remove('hidden');
  unsubscribeFns.forEach(fn => fn()); unsubscribeFns = [];
  TEAM_DEF.forEach(m => { m.fields.forEach(f => { liveData[m.id][f.key] = { actual: 0, target: 0 }; }); });
  allActivities = [];
  allDeals = [];
  listenToData(currentPeriod);
  listenToActivities(currentPeriod);
  listenToDeals(currentPeriod);
  listenToProjects(currentPeriod);
  listenToWlRecords(currentPeriod);
  listenToOKR(currentPeriod);
  listenToLostSaleNotes(currentPeriod);
  renderTeam();
}

let calYear = new Date().getFullYear();
let calMonth = new Date().getMonth(); // 0-indexed
let calNoteTargetId = null;
let calNotes = {}; // { activityId: noteText }

const MEMBER_COLORS = {
  esma: { bg: 'rgba(230,57,70,0.15)', text: '#e63946', border: '#e63946' },
  dilan: { bg: 'rgba(139,92,246,0.15)', text: '#8b5cf6', border: '#8b5cf6' },
  melek: { bg: 'rgba(245,158,11,0.15)', text: '#f59e0b', border: '#f59e0b' },
  elif: { bg: 'rgba(69,123,157,0.15)', text: '#457b9d', border: '#457b9d' },
};

function switchTab(tab) {
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('tab-' + tab).classList.add('active');
  event.target.classList.add('active');
  if (tab === 'calendar') renderCalendar();
  if (tab === 'companies') renderCompanies();
  if (tab === 'pipeline') renderPipeline();
}

function renderCompanies() {
  const grid = document.getElementById('companyDirectoryGrid');
  if (!grid) return;
  const search = document.getElementById('companySearch').value.trim().toLowerCase();
  const filterVal = document.getElementById('companyDirectoryFilter') ? document.getElementById('companyDirectoryFilter').value : 'all';

  const actCompanies = [...new Set(allActivities.map(a => a.company).filter(c => c))];
  const allCompanies = [...new Set([...COMPANIES, ...actCompanies])].sort((a, b) => a.localeCompare(b, 'tr'));

  let list = allCompanies;

  if (filterVal === 'unassigned') {
    list = list.filter(c => !companyAssignments[c] || companyAssignments[c].length === 0);
  } else if (filterVal !== 'all') {
    list = list.filter(c => companyAssignments[c] && companyAssignments[c].includes(filterVal));
  }

  if (search) {
    list = list.filter(c => {
      if (c.toLowerCase().includes(search)) return true;
      const assignedArr = companyAssignments[c] || [];
      const reps = assignedArr.map(mid => TEAM_DEF.find(x => x.id === mid)?.name?.toLowerCase() || '');
      if (reps.some(name => name.includes(search))) return true;
      return false;
    });
  }

  if (!list.length) { grid.innerHTML = '<div style="text-align:center;padding:3rem;color:var(--ink3);width:100%">Sonuç bulunamadý ??</div>'; return; }

  const memberColors = { esma: '#e63946', dilan: '#8b5cf6', melek: '#f59e0b', elif: '#457b9d' };

  grid.innerHTML = list.map((c, i) => {
    const assignedArr = companyAssignments[c] || [];
    const reps = assignedArr.map(mid => {
      const m = TEAM_DEF.find(x => x.id === mid);
      const cCode = memberColors[mid] || '#ccc';
      if (!m) return '';
      return `<span class="rep-tag" style="color:${cCode};border-color:${cCode}44;background:${cCode}11"><span style="width:6px;height:6px;border-radius:50%;background:${cCode}"></span>${m.name}</span>`;
    }).join('');

    const actCount = allActivities.filter(a => a.company === c).length;
    const cEsc = c.replace(/'/g, "\\'");

    return `<div class="company-dir-card" style="animation-delay:${(i % 15) * 0.04}s">
        <div>
           <div class="company-dir-title">${c}</div>
           <div style="font-size:0.75rem;color:var(--ink3);margin-top:0.3rem">${actCount} toplam etkileþim</div>
        </div>
        <div class="company-dir-reps">${reps || '<span style="font-size:0.7rem;color:var(--ink3)">Henüz temsilci atanmamýþ</span>'}</div>
        ${currentUser && currentUser.role === 'admin' ? `<button onclick="openAssignModal('${cEsc}')" style="margin-top:auto;width:100%;padding:0.65rem;border:1px solid var(--border);border-radius:8px;background:none;color:var(--ink);font-family:'Outfit',sans-serif;font-size:0.75rem;font-weight:600;cursor:pointer;transition:background 0.2s">?? Temsilci Ata</button>` : ''}
        <button onclick="showCompanyDetail('${cEsc}')" style="${currentUser && currentUser.role !== 'admin' ? 'margin-top:auto;' : ''}width:100%;padding:0.65rem;border:1px solid var(--border);border-radius:8px;background:var(--bg);color:var(--ink);font-family:'Outfit',sans-serif;font-size:0.82rem;font-weight:600;cursor:pointer;transition:background 0.2s">?? Detay / Özel Not Defterim</button>
     </div>`;
  }).join('');
}

function calPrevMonth() {
  calMonth--;
  if (calMonth < 0) { calMonth = 11; calYear--; }
  renderCalendar();
}

function calNextMonth() {
  calMonth++;
  if (calMonth > 11) { calMonth = 0; calYear++; }
  renderCalendar();
}

function getCalRandevular() {
  // Tüm aktivitelerden randevu olanlarý al (tüm dönemler)
  return allActivities.filter(a => a.fieldKey === 'randevu' && a.date);
}

function renderCalendar() {
  const TR_MONTHS = ['Ocak', 'Þubat', 'Mart', 'Nisan', 'Mayýs', 'Haziran', 'Temmuz', 'Aðustos', 'Eylül', 'Ekim', 'Kasým', 'Aralýk'];
  const TR_DAYS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

  document.getElementById('calMonthTitle').textContent = TR_MONTHS[calMonth] + ' ' + calYear;

  const legend = document.getElementById('calLegend');
  legend.innerHTML = TEAM_DEF.map(m => {
    const c = MEMBER_COLORS[m.id];
    return `<div class="cal-legend-item"><div class="cal-legend-dot" style="background:${c?.border || '#ccc'}"></div>${m.name}</div>`;
  }).join('');

  const grid = document.getElementById('calGrid');
  grid.innerHTML = '';

  // Gün baþlýklarý (Pazartesi baþlangýç)
  TR_DAYS.forEach(d => {
    const el = document.createElement('div');
    el.className = 'cal-day-name';
    el.textContent = d;
    grid.appendChild(el);
  });

  const firstDay = new Date(calYear, calMonth, 1);
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();

  let startOffset = firstDay.getDay() - 1;
  if (startOffset < 0) startOffset = 6;

  const randevular = getCalRandevular();
  const today = new Date().toISOString().split('T')[0];

  // Boþ hücreler
  for (let i = 0; i < startOffset; i++) {
    const el = document.createElement('div');
    el.className = 'cal-cell empty';
    grid.appendChild(el);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayActs = randevular.filter(a => a.date === dateStr);

    const cell = document.createElement('div');
    cell.className = 'cal-cell' + (dateStr === today ? ' today' : '') + (dayActs.length ? ' has-events' : '');
    cell.onclick = () => openCalDay(dateStr, dayActs);

    const numEl = document.createElement('div');
    numEl.className = 'cal-day-num';
    numEl.textContent = day;
    cell.appendChild(numEl);

    if (dayActs.length) {
      const dotList = document.createElement('div');
      dotList.className = 'cal-dot-list';
      dayActs.slice(0, 3).forEach(a => {
        const c = MEMBER_COLORS[a.memberId] || { bg: 'rgba(100,100,100,0.15)', text: '#888' };
        const dot = document.createElement('div');
        dot.className = 'cal-dot';
        dot.style.cssText = `background:${c.bg};color:${c.text}`;
        dot.textContent = `${a.memberInitials} ${a.company || a.desc.substring(0, 12)}`;
        dotList.appendChild(dot);
      });
      if (dayActs.length > 3) {
        const more = document.createElement('div');
        more.className = 'cal-more';
        more.textContent = `+${dayActs.length - 3} daha`;
        dotList.appendChild(more);
      }
      cell.appendChild(dotList);
    }

    grid.appendChild(cell);
  }
}

function openCalDay(dateStr, acts) {
  const [y, m, d] = dateStr.split('-');
  const TR_MONTHS = ['Ocak', 'Þubat', 'Mart', 'Nisan', 'Mayýs', 'Haziran', 'Temmuz', 'Aðustos', 'Eylül', 'Ekim', 'Kasým', 'Aralýk'];
  document.getElementById('calDayTitle').textContent = `?? ${parseInt(d)} ${TR_MONTHS[parseInt(m) - 1]} ${y}`;
  document.getElementById('calDaySub').textContent = acts.length ? `${acts.length} randevu` : 'Bu gün randevu yok';

  const body = document.getElementById('calDayBody');
  if (!acts.length) {
    body.innerHTML = '<div style="text-align:center;padding:1.5rem;color:var(--ink3);font-size:0.88rem">Bu gün için randevu yok ??</div>';
  } else {
    body.innerHTML = acts.map(a => {
      const c = MEMBER_COLORS[a.memberId] || { border: '#ccc' };
      const note = calNotes[a.id] || '';
      return `<div class="cal-randevu-item" style="border-left-color:${c.border}">
        <div style="display:flex;align-items:center;gap:0.5rem;flex-wrap:wrap;margin-bottom:0.3rem">
          <span style="font-weight:700;font-size:0.85rem;color:var(--ink)">${a.memberName}</span>
          <span style="font-size:0.72rem;background:${c.border}22;color:${c.border};padding:0.15rem 0.5rem;border-radius:99px;font-weight:600">${a.status || '—'}</span>
          ${a.vip ? '<span style="font-size:0.72rem">? VIP</span>' : ''}
        </div>
        ${(a.timeStart) ? `<div style="font-size:0.75rem;color:var(--accent2);margin-bottom:0.2rem">?? ${a.timeStart} – ${a.timeEnd || ''}</div>` : ''}
        ${a.company ? `<div style="font-size:0.82rem;font-weight:600;color:var(--ink2)">?? ${a.company}</div>` : ''}
        <div style="font-size:0.82rem;color:var(--ink2);margin-top:0.2rem">${a.desc}</div>
        ${a.nextStep ? `<div style="font-size:0.75rem;color:var(--accent2);margin-top:0.2rem">› ${a.nextStep}</div>` : ''}
        ${note ? `<div class="cal-note-text">?? ${note}</div>` : ''}
        <div style="display:flex;gap:0.5rem;flex-wrap:wrap;margin-top:0.4rem">
          <button class="cal-note-btn" onclick="openCalNote('${a.id}', '${(a.company || a.desc).replace(/'/g, "\\'")}', '${note.replace(/'/g, "\\'")}')">
            ${note ? '?? Notu Düzenle' : '?? Not Ekle'}
          </button>
          ${outlookAccount ? `<button id='outlook-btn-${a.id}' onclick='addToOutlook("${a.id}")' style='background:rgba(0,120,212,0.1);color:#0078d4;border:1px solid rgba(0,120,212,0.3);border-radius:6px;padding:0.2rem 0.6rem;font-size:0.72rem;cursor:pointer'>${a.outlookEventId ? '? Eklendi' : '?? Outlook Ekle'}</button>' : ''}
        </div>
      </div>`;
    }).join('');
  }

  document.getElementById('calDayModal').classList.remove('hidden');
}

function openCalNote(actId, label, existingNote) {
  calNoteTargetId = actId;
  document.getElementById('calNoteSubTitle').textContent = label;
  document.getElementById('calNoteText').value = existingNote || '';
  document.getElementById('calNoteModal').classList.remove('hidden');
}

function saveCalNote() {
  if (!calNoteTargetId) return;
  const note = document.getElementById('calNoteText').value.trim();
  db.collection('activities').doc(calNoteTargetId).update({ calNote: note })
    .then(() => {
      calNotes[calNoteTargetId] = note;

      const idx = allActivities.findIndex(a => a.id === calNoteTargetId);
      if (idx !== -1) allActivities[idx].calNote = note;
      document.getElementById('calNoteModal').classList.add('hidden');
      showToast('Not kaydedildi!', 'success');
      // Gün modalýný yenile
      const act = allActivities.find(a => a.id === calNoteTargetId);
      if (act) {
        const dateActs = allActivities.filter(a => a.fieldKey === 'randevu' && a.date === act.date);
        openCalDay(act.date, dateActs);
      }
    })
    .catch(e => showToast('Hata: ' + e.message, 'error'));
}

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
      if (lo) { lo.style.display = 'flex'; lo.textContent = `? ${outlookAccount.username} · Çýkýþ`; }
    }
  } catch (e) { }
}

async function outlookLogin() {
  if (!msalInstance) { showToast('Microsoft baðlantýsý hazýr deðil, lütfen bekle.', 'warning'); return; }
  try {
    const resp = await msalInstance.loginPopup({
      scopes: ['Calendars.ReadWrite'],
      prompt: 'select_account'
    });
    outlookAccount = resp.account;
    document.getElementById('outlookLoginBtn').style.display = 'none';
    document.getElementById('outlookLogoutBtn').style.display = 'flex';
    document.getElementById('outlookLogoutBtn').textContent = `? ${outlookAccount.username} · Çýkýþ`;
    showToast('Outlook takvime baðlandý! ?', 'success');
    renderCalendar();
  } catch (e) {
    console.error("MSAL Login Error:", e);
    showToast('Outlook baðlantýsý baþarýsýz: ' + (e.message || e), 'error');
  }
}

function outlookLogout() {
  msalInstance.logoutPopup({ account: outlookAccount });
  outlookAccount = null;
  document.getElementById('outlookLoginBtn').style.display = 'flex';
  document.getElementById('outlookLogoutBtn').style.display = 'none';
  showToast('Outlook baðlantýsý kesildi.', 'warning');
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
      showToast('Token alýnamadý: ' + popupErr.message, 'error');
      return null;
    }
  }
}

async function addToOutlook(actId) {
  const a = allActivities.find(x => x.id === actId);
  if (!a) return;

  const token = await getOutlookToken();
  if (!token) {
    showToast('Önce Outlook\'a baðlan!', 'warning');
    return;
  }

  // Tarih formatý: yyyy-mm-dd › ISO
  const dateStr = a.date || new Date().toISOString().split('T')[0];
  const startDT = `${dateStr}T${a.timeStart || '09:00'}:00`;
  const endDT = `${dateStr}T${a.timeEnd || '09:30'}:00`;

  const event = {
    subject: `?? Randevu: ${a.company || a.desc}`,
    body: {
      contentType: 'text',
      content: `${a.desc}${a.nextStep ? '\n\nSonraki Adým: ' + a.nextStep : ''}\n\nKiþi: ${a.memberName}\nDurum: ${a.status}`
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
      showToast(`"${a.company || a.desc}" Outlook takvimine eklendi! ??`, 'success');
      if (btn) { btn.textContent = '? Eklendi'; btn.style.background = 'rgba(42,157,143,0.15)'; btn.style.color = '#2a9d8f'; }

      const data = await res.json();
      db.collection('activities').doc(actId).update({ outlookEventId: data.id });
    } else {
      const err = await res.json();
      showToast('Hata: ' + (err.error?.message || 'Bilinmeyen hata'), 'error');
      if (btn) { btn.textContent = '?? Outlook\'a Ekle'; btn.disabled = false; }
    }
  } catch (e) {
    showToast('Baðlantý hatasý: ' + e.message, 'error');
  }
}

// ====== ÖZEL NOTLAR (GÝZLÝ KASA) ======
function listenToPrivateNotes(period) {
  if (!currentUser || currentUser.role !== 'admin') return;
  const unsub = db.collection('private_notes').where('period', '==', period).onSnapshot(snap => {
    let notes = snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    if (currentUser.role !== 'admin') {
      notes = notes.filter(n => n.memberId === currentUser.memberId);
    }
    allPrivateNotes = notes;
    renderPrivateNotes();
  });
  unsubscribeFns.push(unsub);
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
    list.innerHTML = '<div style="text-align:center;padding:3rem;color:var(--ink3);font-size:0.9rem">?? Kasanda hiç not yok.</div>';
    return;
  }

  list.innerHTML = filtered.map(n => {
    const isOwner = (currentUser.role === 'admin' || n.memberId === currentUser.memberId);
    return `
    <div style="background:var(--surface);border-radius:16px;padding:1.25rem;box-shadow:var(--shadow);border:1px solid var(--border);border-left:4px solid var(--gold);backdrop-filter:blur(24px) saturate(1.8);animation:fadeUp 0.3s ease both;">
       <div style="display:flex; justify-content:space-between; margin-bottom:0.75rem; align-items:center;">
         <span style="font-size:0.75rem; color:var(--ink3); font-weight:600">?? ${n.date}</span>
         <div style="display:flex;align-items:center;gap:0.5rem">
           ${currentUser.role === 'admin' ? `<span style="font-size:0.7rem;font-weight:700;background:rgba(120,120,150,0.1);color:var(--ink);padding:0.25rem 0.6rem;border-radius:99px;border:1px solid var(--border)">?? ${n.memberName}</span>` : ''}
           ${isOwner ? `<button onclick="deletePrivateNote('${n.id}')" style="background:none;border:none;color:var(--accent);font-size:0.75rem;font-weight:600;cursor:pointer;">?? Sil</button>` : ''}
         </div>
       </div>
       <div style="font-size:0.9rem; color:var(--ink); white-space:pre-wrap; line-height:1.6;">${n.text}</div>
    </div>`;
  }).join('');
}

function savePrivateNote(event) {
  const input = document.getElementById('privateNoteInput');
  const text = input.value.trim();
  if (!text) { showToast('Not boþ olamaz!', 'warning'); return; }

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
    showToast('Notun kasaya kilitlendi ??', 'success');
    if (typeof triggerConfetti !== 'undefined') triggerConfetti();
  }).catch(e => showToast('Hata: ' + e.message, 'error'))
    .finally(() => { btn.textContent = oldText; btn.disabled = false; });
}

function deletePrivateNote(id) {
  if (!confirm('Bu özel notu kalýcý olarak silmek istediðine emin misin?')) return;
  db.collection('private_notes').doc(id).delete().then(() => {
    showToast('Not imha edildi ??', 'warning');
  });
}

function populateNotesFilter() {
  const sel = document.getElementById('notesFilterPerson');
  if (!sel) return;
  sel.innerHTML = '<option value="all">Ekibin Tüm Notlarý</option>' +
    TEAM_DEF.map(m => `<option value="${m.id}">${m.name}</option>`).join('');
}

// ====== MAGIC HOVER GLOW EFFECT ======
document.addEventListener('DOMContentLoaded', () => {
  const addGlow = () => {
    document.querySelectorAll('.kpi-card, .member-card, .activity-item, .chart-card, .weekly-card, .private-note-card, .kanban-glow-target').forEach(card => {
      if (!card.querySelector('.magic-glow')) {
        const glow = document.createElement('div');
        glow.className = 'magic-glow';
        card.appendChild(glow);
      }
    });
  };
  const observer = new MutationObserver(() => addGlow());
  observer.observe(document.body, { childList: true, subtree: true });
  addGlow();

  document.addEventListener('mousemove', e => {
    for (const card of document.querySelectorAll('.kpi-card, .member-card, .activity-item, .chart-card, .weekly-card, .private-note-card, .kanban-glow-target')) {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      card.style.setProperty('--mouse-x', `${x}px`);
      card.style.setProperty('--mouse-y', `${y}px`);
    }
  });
});

// ====== KANBAN DRAG & DROP LOGIC ======
function kbDragStart(e, id) {
  e.dataTransfer.setData('text/plain', id);
  setTimeout(() => e.target.classList.add('dragging'), 0);
}

function kbDragEnd(e) {
  e.target.classList.remove('dragging');
  document.querySelectorAll('.kanban-col').forEach(c => c.classList.remove('drag-over'));
}

function kbAllowDrop(e) {
  e.preventDefault();
  const col = e.target.closest('.kanban-col');
  if (col) {
    document.querySelectorAll('.kanban-col').forEach(c => c.classList.remove('drag-over'));
    col.classList.add('drag-over');
  }
}

function kbDrop(e, status) {
  e.preventDefault();
  document.querySelectorAll('.kanban-col').forEach(c => c.classList.remove('drag-over'));
  const id = e.dataTransfer.getData('text/plain');
  if (!id) return;
  const activity = allActivities.find(a => a.id === id);
  if (!activity) return;

  if (activity.status !== status) {
    db.collection('activities').doc(id).update({ status, editedAt: new Date().toISOString(), editedBy: currentUser.name })
      .then(() => showToast(`Durum güncellendi: ${status}`, 'success'))
      .catch(err => showToast('Hata: ' + err.message, 'error'));
  }
}

// ====== PIPELINE (SATIÞ HUNÝSÝ) LOGIC ======
function listenToDeals(period) {
  const unsub = db.collection('deals').where('period', '==', period).onSnapshot(snap => {
    allDeals = snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    if (document.getElementById('tab-pipeline').classList.contains('active')) renderPipeline();
  });
  unsubscribeFns.push(unsub);
}

function openDealModal(dealId = null) {
  editDealId = dealId;
  const compSel = document.getElementById('dealCompany');
  const actCompanies = [...new Set(allActivities.map(a => a.company).filter(c => c))];
  const allCompanies = [...new Set([...COMPANIES, ...actCompanies])].sort();
  compSel.innerHTML = '<option value="">-- Kurum Seç --</option>' + allCompanies.map(c => `<option value="${c}">${c}</option>`).join('');

  if (dealId) {
    const d = allDeals.find(x => x.id === dealId);
    if (d) {
      document.getElementById('dealModalTitle').textContent = 'Fýrsatý Düzenle';
      document.getElementById('dealValue').value = d.value || '';
      document.getElementById('dealDesc').value = d.desc || '';
      document.getElementById('dealStage').value = d.stage || 'Toplantý';
      document.getElementById('dealCompany').value = d.company || '';
    }
  } else {
    document.getElementById('dealModalTitle').textContent = 'Yeni Fýrsat Ekle';
    document.getElementById('dealValue').value = '';
    document.getElementById('dealDesc').value = '';
    document.getElementById('dealStage').value = 'Toplantý';
    document.getElementById('dealCompany').value = '';
  }

  const delBtn = document.getElementById('dealDeleteBtn');
  if (dealId && currentUser.role === 'admin') delBtn.style.display = 'block';
  else if (delBtn) delBtn.style.display = 'none';

  document.getElementById('dealModal').classList.remove('hidden');
}

function deleteDeal() {
  if (!editDealId) return;
  if (currentUser.role !== 'admin') return;
  if (!confirm('Bu fýrsatý tamamen silmek istediðinize emin misiniz?')) return;

  db.collection('deals').doc(editDealId).delete()
    .then(() => {
      showToast('Fýrsat silindi.', 'success');
      document.getElementById('dealModal').classList.add('hidden');
    })
    .catch(e => showToast('Hata: ' + e.message, 'error'));
}

function saveDeal() {
  const company = document.getElementById('dealCompany').value;
  const stage = document.getElementById('dealStage').value;
  const value = parseInt(document.getElementById('dealValue').value) || 0;
  const desc = document.getElementById('dealDesc').value.trim();

  if (!company) { showToast('Kurum seçmelisin!', 'warning'); return; }

  const btn = document.getElementById('dealSaveBtn');
  btn.textContent = 'Kaydediliyor...'; btn.disabled = true;

  const m = TEAM_DEF.find(x => x.id === currentUser.memberId) || { id: 'admin', name: currentUser.name, deptColor: '#ccc', initials: currentUser.initials };

  if (editDealId) {
    db.collection('deals').doc(editDealId).update({ company, stage, value, desc, updatedAt: new Date().toISOString() })
      .then(() => {
        showToast('Fýrsat Güncellendi!', 'success');
        document.getElementById('dealModal').classList.add('hidden');
      }).catch(e => showToast('Hata: ' + e.message, 'error'))
      .finally(() => { btn.textContent = 'Kaydet'; btn.disabled = false; });
  } else {
    db.collection('deals').add({
      company, stage, value, desc,
      memberId: m.id, memberName: m.name, memberInitials: m.initials, memberColor: m.deptColor,
      period: currentPeriod, createdAt: new Date().toISOString()
    }).then(() => {
      showToast('Fýrsat Eklendi! ??', 'success');
      document.getElementById('dealModal').classList.add('hidden');
    }).catch(e => showToast('Hata: ' + e.message, 'error'))
      .finally(() => { btn.textContent = 'Kaydet'; btn.disabled = false; });
  }
}

function renderPipeline() {
  const cols = {
    'Toplantý': { el: document.getElementById('pipe-cards-toplanti'), count: 0, val: 0 },
    'Teklif Gönderildi': { el: document.getElementById('pipe-cards-teklif'), count: 0, val: 0 },
    'Teklif Kabul Edildi': { el: document.getElementById('pipe-cards-kabul'), count: 0, val: 0 },
    'Sözleþme Ýmzalandý': { el: document.getElementById('pipe-cards-sozlesme'), count: 0, val: 0 },
    'Faturalandýrýldý': { el: document.getElementById('pipe-cards-fatura'), count: 0, val: 0 }
  };
  Object.values(cols).forEach(c => { if (c.el) c.el.innerHTML = ''; });

  let list = allDeals;
  if (currentUser.role !== 'admin') {
    list = allDeals.filter(d => d.memberId === currentUser.memberId);
  }

  list.forEach(d => {
    const colObj = cols[d.stage] || cols['Toplantý'];
    colObj.count++;
    colObj.val += (d.value || 0);
    if (!colObj.el) return;

    const card = document.createElement('div');
    card.className = 'kanban-card kanban-glow-target';
    card.draggable = true;
    card.ondragstart = (e) => kbDragStart(e, 'deal_' + d.id);
    card.ondragend = kbDragEnd;
    card.onclick = () => openDealModal(d.id);
    card.style.cursor = 'pointer';

    let priceEl = d.stage === 'Toplantý' ? '—' : ((d.value || 0).toLocaleString('tr-TR') + ' ?');

    card.innerHTML = `
      <div style="font-weight:700;font-size:0.9rem;color:var(--ink);margin-bottom:0.3rem">${d.company}</div>
      <div style="font-size:0.8rem;color:var(--ink2);margin-bottom:0.5rem;line-height:1.4">${d.desc || '—'}</div>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-top:0.5rem">
         <div style="font-weight:800;font-size:0.95rem;color:var(--green);background:rgba(16,185,129,0.15);padding:0.2rem 0.5rem;border-radius:6px;border:1px solid rgba(16,185,129,0.3)">${priceEl}</div>
         <div class="avatar" style="width:24px;height:24px;font-size:0.65rem;background:${d.memberColor}22;color:${d.memberColor};border-radius:6px;font-family:'Bebas Neue',sans-serif" title="${d.memberName}">${d.memberInitials || '?'}</div>
      </div>
    `;
    colObj.el.appendChild(card);
  });

  Object.entries(cols).forEach(([k, c]) => {
    let idKey = k === 'Toplantý' ? 'toplanti' : k === 'Teklif Gönderildi' ? 'teklif' : k === 'Teklif Kabul Edildi' ? 'kabul' : k === 'Sözleþme Ýmzalandý' ? 'sozlesme' : 'fatura';
    const cEl = document.getElementById('pipe-count-' + idKey);
    if (cEl) {
      cEl.innerHTML = `<span style="font-size:0.95rem;font-weight:800">${c.count}</span><br><span style="font-size:0.75rem;opacity:0.9">(${c.val.toLocaleString('tr-TR')} ?)</span>`;
      cEl.style.lineHeight = '1.1';
      cEl.style.padding = '0.3rem 0.6rem';
    }
  });
}

function pipeAllowDrop(e) {
  e.preventDefault();
  const col = e.target.closest('.kanban-col');
  if (col) {
    document.querySelectorAll('#tab-pipeline .kanban-col').forEach(c => c.classList.remove('drag-over'));
    col.classList.add('drag-over');
  }
}

function pipeDrop(e, stage) {
  e.preventDefault();
  document.querySelectorAll('#tab-pipeline .kanban-col').forEach(c => c.classList.remove('drag-over'));
  const rawId = e.dataTransfer.getData('text/plain');
  if (!rawId || !rawId.startsWith('deal_')) return;

  const id = rawId.split('_')[1];
  const deal = allDeals.find(d => d.id === id);
  if (!deal) return;

  if (deal.stage !== stage) {
    db.collection('deals').doc(id).update({ stage, updatedAt: new Date().toISOString() })
      .then(() => showToast(`Aþama atlandý: ${stage}`, 'success'))
      .catch(err => showToast('Hata: ' + err.message, 'error'));
  }
}

// ====== TEMSÝLCÝ ATAMA LOGIC ======
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
      showToast('Temsilciler atandý!', 'success');
      document.getElementById('assignModal').classList.add('hidden');
    })
    .catch(e => showToast('Hata: ' + e.message, 'error'))
    .finally(() => { btn.textContent = 'Kaydet'; btn.disabled = false; });
}

// ====== PROJE RAPOR SÝSTEMÝ ======
let allProjects = [];
let editProjectId = null;
let currentReportType = 'kanban';

const MONTHS_ORDER = ['OCAK', 'ÞUBAT', 'MART', 'NÝSAN', 'MAYIS', 'HAZÝRAN', 'TEMMUZ', 'AÐUSTOS', 'EYLÜL', 'EKÝM', 'KASIM', 'ARALIK'];

function listenToProjects(period) {
  const unsub = db.collection('projects').where('period', '==', period).onSnapshot(snap => {
    allProjects = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    if (document.getElementById('tab-pipeline').classList.contains('active')) {
      if (currentReportType === 'new') renderProjects('new');
      else if (currentReportType === 'onetime') renderProjects('onetime');
    }
  });
  unsubscribeFns.push(unsub);
}

function switchReportTab(tab) {
  currentReportType = tab;
  ['kanban', 'new', 'onetime', 'whitelabel', 'analytics'].forEach(t => {
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
  const isProjectTab = tab === 'new' || tab === 'onetime';
  if (dealBtn) dealBtn.style.display = tab === 'kanban' ? 'inline-block' : 'none';
  if (projBtn) projBtn.style.display = (isProjectTab && currentUser && currentUser.role === 'admin') ? 'inline-block' : 'none';
  if (excelBtn) excelBtn.style.display = isProjectTab ? 'inline-block' : 'none';
  if (tab === 'new') renderProjects('new');
  else if (tab === 'onetime') renderProjects('onetime');
}

function exportProjectsExcel() {
  if (typeof XLSX === 'undefined') { showToast('Excel kütüphanesi yüklenmedi.', 'error'); return; }
  const type = currentReportType;
  if (type === 'kanban') return;
  const list = allProjects.filter(p => p.type === type);
  if (!list.length) { showToast('Tablo boþ, dýþa aktarýlacak kayýt yok.', 'warning'); return; }

  const sheetName = type === 'new' ? 'Yeni Eklenen Projeler' : 'Tek Seferlik Projeler';
  const fileName = (type === 'new' ? 'yeni_eklenen_projeler' : 'tek_seferlik_projeler') + `_${currentPeriod}.xlsx`;

  const headers = ['AY', 'KURUM ADI', 'PROJE ADI', 'PROJE TUTARI (?)', 'PRO', 'CEP', 'AÇIKLAMA'];
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
    rows.push([month + ' Toplamý', '', '', monthTotal, '', '', '']);
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
    showToast('Excel dosyasý indirildi! ??', 'success');
  } catch (e) {
    showToast('Ýndirme hatasý: ' + e.message, 'error');
  }
}

function renderProjects(type) {
  const containerId = type === 'new' ? 'proj-table-new' : 'proj-table-onetime';
  const container = document.getElementById(containerId);
  if (!container) return;
  const list = allProjects.filter(p => p.type === type);
  if (!list.length) {
    container.innerHTML = '<div style="text-align:center;padding:3rem;color:var(--ink3);font-size:0.9rem;">Henüz kayýt yok. + Yeni Satýr Ekle butonuna týkla.</div>';
    return;
  }
  const byMonth = {};
  list.forEach(p => { if (!byMonth[p.month]) byMonth[p.month] = []; byMonth[p.month].push(p); });
  const isAdmin = currentUser && currentUser.role === 'admin';
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
        ${isAdmin ? '<th style="padding:0.75rem;text-align:center;min-width:55px;">ÝÞLEM</th>' : ''}
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
        <td style="padding:0.65rem 1rem;text-align:right;font-weight:700;color:#1a472a;white-space:nowrap;">${p.value ? Number(p.value).toLocaleString('tr-TR') + ' ?' : '—'}</td>
        <td style="padding:0.65rem;text-align:center;color:var(--ink3);">${p.pro || ''}</td>
        <td style="padding:0.65rem;text-align:center;color:var(--ink3);">${p.cep || ''}</td>
        <td style="padding:0.65rem 1rem;color:var(--ink3);font-size:0.8rem;">${p.note || ''}</td>
        ${isAdmin ? `<td style="padding:0.5rem;text-align:center;"><button onclick="openProjectModal('${eid}')" style="background:none;border:1px solid var(--border);border-radius:6px;cursor:pointer;font-size:0.75rem;padding:0.2rem 0.5rem;color:var(--ink3);">??</button></td>` : ''}
      </tr>`;
    });
    html += `<tr style="background:#e8ede6;">
      <td colspan="3" style="padding:0.5rem 1rem;text-align:right;font-size:0.78rem;color:var(--ink3);font-style:italic;">${month} Toplamý:</td>
      <td style="padding:0.5rem 1rem;text-align:right;font-weight:800;color:#1a472a;">${monthTotal.toLocaleString('tr-TR')} ?</td>
      <td colspan="${isAdmin ? '4' : '3'}"></td>
    </tr>`;
  });
  html += `</tbody><tfoot><tr style="background:#a0c09a;font-weight:800;">
    <td colspan="3" style="padding:0.75rem 1rem;font-size:0.9rem;color:#0a2a0a;text-align:right;">GENEL TOPLAM</td>
    <td style="padding:0.75rem 1rem;font-size:1rem;color:#0a2a0a;text-align:right;">${grandTotal.toLocaleString('tr-TR')} ?</td>
    <td colspan="${isAdmin ? '4' : '3'}"></td>
  </tr></tfoot></table></div>`;
  container.innerHTML = html;
}

function openProjectModal(projId = null) {
  editProjectId = projId;
  const compSel = document.getElementById('projCompany');
  compSel.innerHTML = '<option value="">-- Kurum Seç --</option>' +
    COMPANIES.map(c => `<option value="${c}">${c}</option>`).join('');
  const delBtn = document.getElementById('projDeleteBtn');
  if (projId) {
    const p = allProjects.find(x => x.id === projId);
    if (p) {
      document.getElementById('projectModalTitle').textContent = 'Projeyi Düzenle';
      document.getElementById('projType').value = p.type || 'new';
      document.getElementById('projMonth').value = p.month || 'OCAK';
      document.getElementById('projCompany').value = p.company || '';
      document.getElementById('projName').value = p.name || '';
      document.getElementById('projValue').value = p.value || '';
      document.getElementById('projPro').value = p.pro || '';
      document.getElementById('projCep').value = p.cep || '';
      document.getElementById('projNote').value = p.note || '';
    }
    if (delBtn) delBtn.style.display = currentUser.role === 'admin' ? 'block' : 'none';
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
    const normalize = s => s.toUpperCase().replace(/Ý/g, 'I').replace(/Ð/g, 'G').replace(/Ü/g, 'U').replace(/Þ/g, 'S').replace(/Ö/g, 'O').replace(/Ç/g, 'C');
    const pm = normalize((currentPeriod || '').split(' ')[0]);
    const matched = MONTHS_ORDER.find(m => normalize(m) === pm);
    document.getElementById('projMonth').value = matched || 'OCAK';
  }
  document.getElementById('projectModal').classList.remove('hidden');
}

function saveProject() {
  const type = document.getElementById('projType').value;
  const month = document.getElementById('projMonth').value;
  const company = document.getElementById('projCompany').value;
  const name = document.getElementById('projName').value.trim();
  const value = parseFloat(document.getElementById('projValue').value) || 0;
  const pro = document.getElementById('projPro').value.trim();
  const cep = document.getElementById('projCep').value.trim();
  const note = document.getElementById('projNote').value.trim();
  if (!company) { showToast('Kurum seçmelisin!', 'warning'); return; }
  if (!name) { showToast('Proje adý gerekli!', 'warning'); return; }
  const btn = document.getElementById('projSaveBtn');
  btn.textContent = 'Kaydediliyor...'; btn.disabled = true;
  const data = { type, month, company, name, value, pro, cep, note, period: currentPeriod, updatedAt: new Date().toISOString() };
  const done = () => { showToast(editProjectId ? 'Proje güncellendi.' : 'Proje eklendi! ?', 'success'); document.getElementById('projectModal').classList.add('hidden'); btn.textContent = 'Kaydet'; btn.disabled = false; };
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
  if (!confirm('Bu projeyi silmek istediðine emin misin?')) return;
  db.collection('projects').doc(editProjectId).delete()
    .then(() => { showToast('Proje silindi.', 'success'); document.getElementById('projectModal').classList.add('hidden'); })
    .catch(e => showToast('Hata: ' + e.message, 'error'));
}

// ====== VERÝMLÝLÝK ANALÝZÝ ======

const EFFORT_WEIGHTS = {
  randevu: 3,
  musteri: 3,
  teklif: 2,
  temas: 1,
  youtube: 2,
  linkedin: 2,
  twitter: 1,
  instagram: 1,
  haber: 1,
  diger: 0.5
};

function calcEffortScore(memberId) {
  const acts = allActivities.filter(a => a.memberId === memberId);
  return acts.reduce((sum, a) => sum + (EFFORT_WEIGHTS[a.fieldKey] || 0.5), 0);
}

function renderAnalytics() {
  if (!currentUser || currentUser.role !== 'admin') return;

  const kpiStrip = document.getElementById('analyticsKpiStrip');
  const table = document.getElementById('analyticsTable');
  if (!kpiStrip || !table) return;

  const salesTeam = TEAM_DEF.filter(m => m.dept === 'Satýþ');

  let totalFirsat = 0; let totalTeklif = 0;
  let sumT = 0; let sumK = 0;
  let totalKayiplar = 0; let totalNotluKayiplar = 0;

  salesTeam.forEach(m => {
    const acts = allActivities.filter(a => a.memberId === m.id);
    totalFirsat += acts.filter(a => a.fieldKey === 'firsat').length;
    totalTeklif += acts.filter(a => a.fieldKey === 'teklif').length;
    sumT += acts.filter(a => a.fieldKey === 'teklif').reduce((s, a) => s + (a.value || 0), 0);
    sumK += acts.filter(a => a.fieldKey === 'kazanildi').reduce((s, a) => s + (a.value || 0), 0);
    const mkayiplar = acts.filter(a => a.fieldKey === 'kaybedildi');
    totalKayiplar += mkayiplar.length;
    totalNotluKayiplar += mkayiplar.filter(a => a.desc && a.desc.trim().length > 0).length;
  });

  const avgKapatma = sumT > 0 ? Math.round((sumK / sumT) * 100) : 0;
  const avgKayipAnaliz = totalKayiplar > 0 ? Math.round((totalNotluKayiplar / totalKayiplar) * 100) : 0;

  const kpiItems = [
    { label: 'Toplam Nitelikli Fýrsat', value: totalFirsat, icon: '??', color: '#3b82f6' },
    { label: 'Toplam Teklif', value: totalTeklif, icon: '??', color: '#f59e0b' },
    { label: 'Ortalama Kapatma Oraný', value: '%' + avgKapatma, icon: '?', color: '#10b981' },
    { label: 'Kayýp Satýþ Analizi Oraný', value: '%' + avgKayipAnaliz, icon: '?', color: '#e63946' },
  ];

  kpiStrip.innerHTML = kpiItems.map(k => `
    <div style="flex:1;min-width:160px;background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:1.25rem 1.5rem;box-shadow:var(--shadow);">
      <div style="font-size:1.5rem;margin-bottom:0.35rem;">${k.icon}</div>
      <div style="font-size:1.5rem;font-weight:800;color:${k.color};">${k.value}</div>
      <div style="font-size:0.72rem;color:var(--ink3);font-weight:600;margin-top:0.2rem;">${k.label}</div>
    </div>`).join('');

  const rows = salesTeam.map(m => {
    const acts = allActivities.filter(a => a.memberId === m.id);
    const firsat = acts.filter(a => a.fieldKey === 'firsat').length;
    const teklif = acts.filter(a => a.fieldKey === 'teklif').length;
    const mSumT = acts.filter(a => a.fieldKey === 'teklif').reduce((s, a) => s + (a.value || 0), 0);
    const mSumK = acts.filter(a => a.fieldKey === 'kazanildi').reduce((s, a) => s + (a.value || 0), 0);
    const kapatmaPct = mSumT > 0 ? Math.round((mSumK / mSumT) * 100) : 0;

    const kayiplar = acts.filter(a => a.fieldKey === 'kaybedildi');
    const notluKayiplar = kayiplar.filter(a => a.desc && a.desc.trim().length > 0).length;
    const kayipPct = kayiplar.length > 0 ? Math.round((notluKayiplar / kayiplar.length) * 100) : 0;

    // Overall OKR Target Completion
    let totalOkr = 0;
    const okrData = allOKR[m.id];
    let okrPct = 0;
    if (okrData && okrData.objectives) {
      const oTgtFirsat = okrData.objectives.find(o => o.key === 'firsat_hedef')?.target || 0;
      const oTgtTeklif = okrData.objectives.find(o => o.key === 'teklif_hedef')?.target || 0;
      const p1 = oTgtFirsat > 0 ? Math.min(100, (firsat / oTgtFirsat) * 100) : 0;
      const p2 = oTgtTeklif > 0 ? Math.min(100, (teklif / oTgtTeklif) * 100) : 0;
      const p3 = Math.min(100, (kapatmaPct / 20) * 100); // Target 20%
      const p4 = kayipPct; // Target 100%
      okrPct = Math.round((p1 + p2 + p3 + p4) / 4);
    }

    const avatarHtml = m.photo
      ? `<img src="${m.photo}" style="width:34px;height:34px;border-radius:10px;object-fit:cover;border:2px solid ${m.deptColor}44;">`
      : `<div style="width:34px;height:34px;border-radius:10px;background:${m.avatarBg};color:${m.deptColor};display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.75rem;">${m.initials}</div>`;
    return `
      <tr style="border-bottom:1px solid var(--border);">
        <td style="padding:1rem 1.25rem;">
          <div style="display:flex;align-items:center;gap:0.75rem;">
            ${avatarHtml}
            <div>
              <div style="font-weight:700;font-size:0.88rem;">${m.name}</div>
              <div style="font-size:0.7rem;color:var(--ink3);">${m.dept}</div>
            </div>
          </div>
        </td>
        <td style="padding:1rem;text-align:center;font-weight:700;">${acts.length}</td>
        <td style="padding:1rem;text-align:center;">${firsat}</td>
        <td style="padding:1rem;text-align:center;">${teklif}</td>
        <td style="padding:1rem;text-align:center;">
          <span style="font-weight:700;color:${pctColor(kapatmaPct)};">%${kapatmaPct}</span>
        </td>
        <td style="padding:1rem;text-align:center;">
          <span style="font-weight:700;color:${pctColor(kayipPct)};">%${kayipPct}</span>
        </td>
        <td style="padding:1rem;text-align:center;">
          <span style="font-weight:800;color:${pctColor(okrPct)};">%${okrPct}</span>
        </td>
      </tr>`;
  }).join('');

  table.innerHTML = `
    <table style="width:100%;border-collapse:collapse;">
      <thead>
        <tr style="background:var(--bg);border-bottom:2px solid var(--border);">
          <th style="padding:0.85rem 1.25rem;text-align:left;font-size:0.72rem;color:var(--ink3);font-weight:700;text-transform:uppercase;letter-spacing:0.06em;">Personel</th>
          <th style="padding:0.85rem 1rem;font-size:0.72rem;color:var(--ink3);font-weight:700;text-transform:uppercase;">Toplam AKT.</th>
          <th style="padding:0.85rem 1rem;font-size:0.72rem;color:var(--ink3);font-weight:700;text-transform:uppercase;">?? NÝT. FIRSAT</th>
          <th style="padding:0.85rem 1rem;font-size:0.72rem;color:var(--ink3);font-weight:700;text-transform:uppercase;">?? TEKLÝF</th>
          <th style="padding:0.85rem 1rem;font-size:0.72rem;color:var(--ink3);font-weight:700;text-transform:uppercase;">? KAPATMA ORANI</th>
          <th style="padding:0.85rem 1rem;font-size:0.72rem;color:var(--ink3);font-weight:700;text-transform:uppercase;">? KAYIP ANALÝZÝ</th>
          <th style="padding:0.85rem 1rem;font-size:0.72rem;color:var(--ink3);font-weight:700;text-transform:uppercase;">?? OKR HEDEF %</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}

function exportAnalyticsExcel() {
  if (typeof XLSX === 'undefined') { showToast('Excel kütüphanesi yüklenmedi.', 'error'); return; }
  const headers = ['Personel', 'Departman', 'Toplam Aktivite', 'Nitelikli Fýrsat', 'Teklif', 'Kapatma Oraný %', 'Kayýp Analiz Oraný %'];
  const rows = TEAM_DEF.filter(m => m.dept === 'Satýþ').map(m => {
    const acts = allActivities.filter(a => a.memberId === m.id);
    const mSumT = acts.filter(a => a.fieldKey === 'teklif').reduce((s, a) => s + (a.value || 0), 0);
    const mSumK = acts.filter(a => a.fieldKey === 'kazanildi').reduce((s, a) => s + (a.value || 0), 0);
    const kapatmaPct = mSumT > 0 ? Math.round((mSumK / mSumT) * 100) : 0;

    const kayiplar = acts.filter(a => a.fieldKey === 'kaybedildi');
    const notluKayiplar = kayiplar.filter(a => a.desc && a.desc.trim().length > 0).length;
    const kayipPct = kayiplar.length > 0 ? Math.round((notluKayiplar / kayiplar.length) * 100) : 0;

    return [
      m.name, m.dept, acts.length,
      acts.filter(a => a.fieldKey === 'firsat').length,
      acts.filter(a => a.fieldKey === 'teklif').length,
      kapatmaPct,
      kayipPct
    ];
  });
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  ws['!cols'] = [20, 18, 14, 14, 12, 16, 16].map(w => ({ wch: w }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'OKR Analizi');
  try {
    const b64 = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });
    const url = 'data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,' + b64;
    const a = document.createElement('a');
    a.href = url;
    a.download = `idealdata_okr_analiz_${currentPeriod}.xlsx`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    showToast('OKR raporu indirildi! ??', 'success');
  } catch (e) { showToast('Ýndirme hatasý: ' + e.message, 'error'); }
}

// ====== OKR SÝSTEMÝ ======

let allOKR = {};

const OKR_DEFAULTS = {
  satis: [
    { key: 'firsat_hedef', label: '?? Nitelikli Fýrsat Yaratma', target: 0, actual: 0 },
    { key: 'teklif_hedef', label: '?? Aylýk Minimum Teklif Adedi', target: 0, actual: 0 },
    { key: 'kazanma_hedef', label: '? Mevduat/Tutar Kapama %20 (Toplam)', target: 20, actual: 0 },
    { key: 'kayip_analiz', label: '? Kayýp Satýþ Analizi %', target: 100, actual: 0 }
  ],
  dijital: [
    { key: 'icerik_hedef', label: '?? Dijital Ýçerik', target: 0, actual: 0 },
    { key: 'sosyal_hedef', label: '?? Sosyal Medya', target: 0, actual: 0 },
    { key: 'haber_hedef', label: '?? Haber Yayýný', target: 0, actual: 0 },
    { key: 'linkedin_hedef', label: '?? LinkedIn', target: 0, actual: 0 },
  ]
};

function getOKRDefaults(memberId) {
  const m = TEAM_DEF.find(x => x.id === memberId);
  if (!m) return [];
  return m.dept === 'Dijital Pazarlama' ? OKR_DEFAULTS.dijital : OKR_DEFAULTS.satis;
}

function listenToOKR(period) {
  const unsub = db.collection('okr_targets').where('period', '==', period).onSnapshot(snap => {
    allOKR = {};
    snap.forEach(doc => { allOKR[doc.data().memberId] = doc.data(); });
    renderOKRSection();
  });
  unsubscribeFns.push(unsub);
}

function renderOKRSection() {
  const container = document.getElementById('okrSection');
  if (!container) return;

  const isAdmin = currentUser && currentUser.role === 'admin';
  const myId = currentUser && currentUser.memberId;

  const membersToShow = isAdmin ? TEAM_DEF : TEAM_DEF.filter(m => m.id === myId);

  container.innerHTML = membersToShow.map(m => {
    const okrData = allOKR[m.id];
    const objectives = okrData ? okrData.objectives : getOKRDefaults(m.id);
    const acts = allActivities.filter(a => a.memberId === m.id);

    const objHtml = objectives.map((obj, idx) => {
      let autoActual = 0;
      let displayTarget = obj.target;

      if (m.dept === 'Satýþ') {
        if (obj.key === 'firsat_hedef') {
          autoActual = acts.filter(a => a.fieldKey === 'firsat').length;
        } else if (obj.key === 'teklif_hedef') {
          autoActual = acts.filter(a => a.fieldKey === 'teklif' && a.isOkr === true).length;
        } else if (obj.key === 'kazanma_hedef') {
          const sumTeklif = acts.filter(a => a.fieldKey === 'teklif' && a.isOkr === true).reduce((s, a) => s + (a.value || 0), 0);
          const sumKazanildi = acts.filter(a => a.fieldKey === 'kazanildi').reduce((s, a) => s + (a.value || 0), 0);
          autoActual = sumTeklif > 0 ? Math.round((sumKazanildi / sumTeklif) * 100) : 0;
          displayTarget = obj.target + '%';
        } else if (obj.key === 'kayip_analiz') {
          const memberNotes = allLostSaleNotes.filter(n => n.memberId === m.id);
          const listHtml = memberNotes.map(n => `
             <div style="background:var(--surface);border-radius:6px;padding:0.6rem;border:1px solid var(--border);border-left:3px solid #e63946;margin-bottom:0.4rem">
               <div style="font-size:0.8rem;font-weight:700;color:var(--ink);margin-bottom:0.2rem">?? ${n.company} <span style="font-size:0.65rem;color:var(--ink3);font-weight:400;float:right">?? ${n.date}</span></div>
               <div style="font-size:0.75rem;color:var(--ink2);line-height:1.4">${n.note}</div>
             </div>
           `).join('');

          return `
             <div style="margin-top:1.5rem;margin-bottom:1rem;padding:1rem;background:var(--bg);border:1px dashed var(--border);border-left:4px solid #e63946;border-radius:10px;">
               <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.8rem">
                 <span style="font-size:0.85rem;font-weight:700;color:var(--ink)">? Kayýp Satýþ Analizi / Notlar</span>
                 <button onclick="openLostSaleNoteModal('${m.id}')" style="background:#e63946;color:white;border:none;border-radius:6px;font-size:0.7rem;padding:0.35rem 0.6rem;cursor:pointer;font-weight:600">+ Yeni Not Ekle</button>
               </div>
               <div style="max-height:180px;overflow-y:auto;padding-right:0.2rem" class="thin-scroll">
                 ${memberNotes.length ? listHtml : '<div style="font-size:0.75rem;color:var(--ink3);text-align:center;padding:1rem;border:1px dashed var(--border);border-radius:6px;">Henüz hiç kayýp satýþ notu eklenmedi.</div>'}
               </div>
             </div>
           `;
        }
      } else {
        const keyMap = { icerik_hedef: 'diger', sosyal_hedef: 'twitter', haber_hedef: 'haber', linkedin_hedef: 'linkedin' };
        const fk = keyMap[obj.key];
        autoActual = fk ? acts.filter(a => a.fieldKey === fk).length : (obj.actual || 0);
      }

      let p = obj.target > 0 ? Math.min(100, Math.round((autoActual / obj.target) * 100)) : 0;
      if (obj.key === 'kazanma_hedef' || obj.key === 'kayip_analiz') {
        p = obj.target > 0 ? Math.min(100, Math.round((autoActual / obj.target) * 100)) : (autoActual > 0 ? 100 : 0);
      }

      const isPctDisplay = obj.key === 'kazanma_hedef' || obj.key === 'kayip_analiz';
      const color = pctColor(p);
      return `
        <div style="margin-bottom:1rem;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.35rem;">
            <span style="font-size:0.82rem;font-weight:600;">${obj.label}</span>
            <div style="display:flex;align-items:center;gap:0.5rem;">
              <span style="font-size:0.82rem;font-weight:700;color:${color};">${isPctDisplay ? '%' + autoActual : autoActual} / ${displayTarget || '—'}</span>
              ${isAdmin ? `<input type="number" min="0" value="${obj.target || 0}" data-mid="${m.id}" data-idx="${idx}"
                onchange="updateOKRTarget(this)"
                style="width:58px;padding:0.25rem 0.4rem;border:1px solid var(--border);border-radius:6px;font-size:0.78rem;background:var(--bg);color:var(--ink);text-align:center;">` : ''}
            </div>
          </div>
          <div style="height:7px;background:var(--border);border-radius:99px;overflow:hidden;">
            <div style="height:100%;width:${p}%;background:${color};border-radius:99px;transition:width 0.5s;"></div>
          </div>
        </div>`;
    }).join('');

    const totalPct = objectives.length ? Math.round(objectives.reduce((s, obj) => {
      let actualVal = 0;
      if (m.dept === 'Satýþ') {
        if (obj.key === 'firsat_hedef') actualVal = acts.filter(a => a.fieldKey === 'firsat').length;
        if (obj.key === 'teklif_hedef') actualVal = acts.filter(a => a.fieldKey === 'teklif').length;
        if (obj.key === 'kazanma_hedef') {
          const sumT = acts.filter(a => a.fieldKey === 'teklif').reduce((sm, a) => sm + (a.value || 0), 0);
          const sumK = acts.filter(a => a.fieldKey === 'kazanildi').reduce((sm, a) => sm + (a.value || 0), 0);
          actualVal = sumT > 0 ? (sumK / sumT) * 100 : 0;
        }
        if (obj.key === 'kayip_analiz') {
          const kayiplar = acts.filter(a => a.fieldKey === 'kaybedildi');
          actualVal = kayiplar.length > 0 ? (kayiplar.filter(a => a.desc && a.desc.trim().length > 0).length / kayiplar.length) * 100 : 0;
        }
      } else {
        const keyMap = { icerik_hedef: 'diger', sosyal_hedef: 'twitter', haber_hedef: 'haber', linkedin_hedef: 'linkedin' };
        const fk = keyMap[obj.key];
        actualVal = fk ? acts.filter(a => a.fieldKey === fk).length : (obj.actual || 0);
      }
      return s + (obj.target > 0 ? Math.min(100, (actualVal / obj.target) * 100) : 0);
    }, 0) / objectives.length) : 0;

    return `
      <div style="background:var(--surface);border:1px solid var(--border);border-radius:20px;padding:1.5rem;box-shadow:var(--shadow);">
        <div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:1.25rem;">
          ${m.photo ? `<img src="${m.photo}" style="width:40px;height:40px;border-radius:12px;object-fit:cover;border:2px solid ${m.deptColor}44;">` : `<div style="width:40px;height:40px;border-radius:12px;background:${m.avatarBg};color:${m.deptColor};display:flex;align-items:center;justify-content:center;font-weight:700;">${m.initials}</div>`}
          <div style="flex:1;">
            <div style="font-weight:700;font-size:0.92rem;">${m.name}</div>
            <div style="font-size:0.7rem;color:var(--ink3);">OKR · ${currentPeriod}</div>
          </div>
          <div style="font-size:1.1rem;font-weight:800;color:${pctColor(totalPct)};">%${totalPct}</div>
        </div>
        ${objHtml}
        ${isAdmin ? `<button onclick="saveOKR('${m.id}')" style="width:100%;margin-top:0.5rem;padding:0.55rem;border:none;border-radius:10px;background:var(--btn-bg);color:var(--btn-text);font-family:'Outfit',sans-serif;font-size:0.78rem;font-weight:700;cursor:pointer;">?? Hedefleri Kaydet</button>` : ''}
      </div>`;
  }).join('');
}

function updateOKRTarget(input) {
  const mid = input.dataset.mid;
  const idx = parseInt(input.dataset.idx);
  if (!allOKR[mid]) allOKR[mid] = { memberId: mid, period: currentPeriod, objectives: getOKRDefaults(mid) };
  if (allOKR[mid].objectives[idx]) allOKR[mid].objectives[idx].target = parseInt(input.value) || 0;
}

function saveOKR(memberId) {
  if (!currentUser || currentUser.role !== 'admin') return;
  const okrData = allOKR[memberId] || { memberId, period: currentPeriod, objectives: getOKRDefaults(memberId) };
  okrData.period = currentPeriod;
  okrData.memberId = memberId;
  db.collection('okr_targets').doc(`${currentPeriod}_${memberId}`).set(okrData)
    .then(() => showToast(`${TEAM_DEF.find(m => m.id === memberId)?.name} OKR hedefleri kaydedildi! ?`, 'success'))
    .catch(e => showToast('Hata: ' + e.message, 'error'));
}

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
  if (!note) { showToast('Not boþ olamaz!', 'warning'); return; }

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
    showToast('Kayýp satýþ notu eklendi!', 'success');
  }).catch(e => showToast('Hata: ' + e.message, 'error'))
    .finally(() => { btn.textContent = 'Kaydet'; btn.disabled = false; });
}

