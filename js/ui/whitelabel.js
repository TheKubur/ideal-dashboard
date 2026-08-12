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
  if (typeof id !== 'string') id = null;
  editWlId = id;
  const modal = document.getElementById('wlModal');
  if (!modal) return;
  modal.classList.remove('hidden');
  modal.style.display = 'flex';
  modal.style.zIndex = '99999';

  try {
    const compSel = document.getElementById('wlCompany');
    const actCompanies = Array.from(new Set((allActivities || []).map(function (a) { return a.company; }).filter(function (c) { return c; })));
    const allComp = Array.from(new Set((COMPANIES || []).concat(actCompanies))).sort(function (a, b) { return a.localeCompare(b, 'tr'); });
    if (compSel) {
      compSel.innerHTML = '<option value="">-- Kurum Seç --</option>' +
        allComp.map(function (c) { return '<option value="' + c + '">' + c + '</option>'; }).join('') +
        '<option value="__yeni__">+ Yeni Kurum Ekle...</option>';
    }
    const ci = document.getElementById('wlCompanyCustom');
    if (ci) { ci.classList.add('hidden'); ci.value = ''; }

    const delBtn = document.getElementById('wlDeleteBtn');
    if (id) {
      const r = (allWlRecords || []).find(function (x) { return x.id === id; });
      if (r) {
        document.getElementById('wlModalTitle').textContent = 'Kaydı Düzenle';
        document.getElementById('wlMonth').value = r.month || 'OCAK';
        if (compSel && r.company) {
          const exists = Array.from(compSel.options).some(function (o) { return o.value === r.company; });
          if (!exists) {
            const opt = document.createElement('option');
            opt.value = r.company; opt.textContent = r.company;
            compSel.appendChild(opt);
          }
          compSel.value = r.company;
        }
        document.getElementById('wlPackage').value = r.package || '';
        document.getElementById('wlQty').value = r.qty || '';
        document.getElementById('wlUnitPrice').value = r.unitPrice || '';
        document.getElementById('wlNote').value = r.note || '';
        calcWlTotal();
      }
      if (delBtn) delBtn.style.display = (currentUser && currentUser.role === 'admin') ? 'inline-block' : 'none';
    } else {
      document.getElementById('wlModalTitle').textContent = 'White Label Kaydı Ekle';
      const normalize = function (s) { return (s || '').toUpperCase().replace(/\u0130/g, 'I').replace(/\u011e/g, 'G').replace(/\u00dc/g, 'U').replace(/\u015e/g, 'S').replace(/\u00d6/g, 'O').replace(/\u00c7/g, 'C'); };
      const pm = normalize((currentPeriod || '').split(' ')[0]);
      const matched = MONTHS_ORDER.find(function (m) { return normalize(m) === pm; });
      document.getElementById('wlMonth').value = matched || 'OCAK';
      if (compSel) compSel.value = '';
      document.getElementById('wlPackage').value = '';
      document.getElementById('wlQty').value = '';
      document.getElementById('wlUnitPrice').value = '';
      document.getElementById('wlNote').value = '';
      document.getElementById('wlTotalPreview').textContent = '0 TL';
      if (delBtn) delBtn.style.display = 'none';
    }
  } catch (err) {
    console.error('openWlModal hatasi:', err);
  }
}

window.openWlModal = openWlModal;

document.addEventListener('click', function(e) {
  const wlBtn = e.target.closest('[data-wl-id]');
  if (wlBtn) {
    e.stopPropagation();
    const wid = wlBtn.getAttribute('data-wl-id');
    openWlModal(wid);
    return;
  }
  const newWlBtn = e.target.closest('#btnNewWl');
  if (newWlBtn) {
    e.stopPropagation();
    openWlModal(null);
  }
});

function saveWlRecord() {
  const month = document.getElementById('wlMonth').value;
  const selVal = document.getElementById('wlCompany').value;
  const company = selVal === '__yeni__' ? document.getElementById('wlCompanyCustom').value.trim() : selVal;
  const pkg = document.getElementById('wlPackage').value.trim();
  const qty = parseFloat(document.getElementById('wlQty').value) || 0;
  const unitPrice = parseFloat(document.getElementById('wlUnitPrice').value) || 0;
  const note = document.getElementById('wlNote').value.trim();
  const total = qty * unitPrice;

  if (selVal === '__yeni__' && !company) { showToast('Yeni kurum adını yazman gerekiyor!', 'warning'); return; }
  if (!company) { showToast('Kurum seçmelisin!', 'warning'); return; }
  if (!pkg) { showToast('Paket adı gerekli!', 'warning'); return; }
  if (qty <= 0) { showToast('Adet 0dan büyük olmalı!', 'warning'); return; }
  if (unitPrice <= 0) { showToast('Birim fiyat 0dan büyük olmalı!', 'warning'); return; }

  const btn = document.getElementById('wlSaveBtn');
  btn.textContent = 'Kaydediliyor...'; btn.disabled = true;

  const data = { month: month, company: company, package: pkg, qty: qty, unitPrice: unitPrice, total: total, note: note, period: currentPeriod, updatedAt: new Date().toISOString() };
  const done = function () { showToast(editWlId ? 'Kayıt güncellendi.' : 'Kayıt eklendi!', 'success'); document.getElementById('wlModal').classList.add('hidden'); btn.textContent = 'Kaydet'; btn.disabled = false; };
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
  if (!confirm('Bu kaydı silmek istediğine emin misin?')) return;
  db.collection('whitelabel_records').doc(editWlId).delete()
    .then(function () { showToast('Kayıt silindi.', 'success'); document.getElementById('wlModal').classList.add('hidden'); })
    .catch(function (e) { showToast('Hata: ' + e.message, 'error'); });
}

function renderWhiteLabel() {
  const kpiEl = document.getElementById('wl-kpi-strip');
  const tableEl = document.getElementById('wl-table');
  if (!kpiEl || !tableEl) return;

  const isAdmin = currentUser && currentUser.role !== 'viewer';
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
    { icon: '💰', label: 'Toplam Lisans Geliri', value: totalRevenue.toLocaleString('tr-TR') + ' TL', color: '#10b981' },
    { icon: '🏢', label: 'Aktif Kurum Sayısı', value: activeCompanies, color: '#457b9d' },
    { icon: '👤', label: 'Toplam Kullanıcı', value: totalUsers, color: '#8b5cf6' },
    { icon: '📊', label: 'Ort. Kullanıcı Başı Gelir', value: avgPerUser.toLocaleString('tr-TR', { maximumFractionDigits: 0 }) + ' TL', color: '#f59e0b' }
  ].map(function (k) {
    return '<div style="flex:1;min-width:170px;background:var(--surface);border-radius:14px;padding:1rem 1.25rem;border:1px solid var(--border);box-shadow:var(--shadow);display:flex;flex-direction:column;gap:0.3rem"><div style="font-size:1.4rem">' + k.icon + '</div><div style="font-size:0.7rem;font-weight:600;color:var(--ink3);text-transform:uppercase;letter-spacing:0.06em">' + k.label + '</div><div style="font-size:1.25rem;font-weight:800;color:' + k.color + '">' + k.value + '</div></div>';
  }).join('');

  if (!list.length) { tableEl.innerHTML = '<div style="text-align:center;padding:3rem;color:var(--ink3)">Henüz kayıt yok. + Yeni Satır Ekle butonuna tıkla.</div>'; return; }

  const byMonth = {};
  list.forEach(function (r) { if (!byMonth[r.month]) byMonth[r.month] = []; byMonth[r.month].push(r); });

  const editColHead = isAdmin ? '<th style="padding:0.75rem;text-align:center;min-width:55px">İSLEM</th>' : '';
  let html = '<div style="overflow-x:auto;border-radius:12px;border:1px solid var(--border);box-shadow:0 4px 20px rgba(0,0,0,0.08)"><table style="width:100%;border-collapse:collapse;font-family:Outfit,sans-serif;font-size:0.85rem"><thead><tr style="background:rgba(69,123,157,0.18);font-weight:700;font-size:0.78rem;text-transform:uppercase;letter-spacing:0.05em"><th style="padding:0.75rem 1rem;text-align:left;min-width:70px">AY</th><th style="padding:0.75rem 1rem;text-align:left;min-width:160px">KURUM ADI</th><th style="padding:0.75rem 1rem;text-align:left;min-width:200px">PAKET ADI</th><th style="padding:0.75rem 1rem;text-align:center;min-width:80px">ADET</th><th style="padding:0.75rem 1rem;text-align:right;min-width:130px">BİRİM FİYAT</th><th style="padding:0.75rem 1rem;text-align:right;min-width:140px;color:#10b981">TOPLAM</th><th style="padding:0.75rem 1rem;text-align:left;min-width:140px">NOTLAR</th>' + editColHead + '</tr></thead><tbody>';

  let grandTotal = 0;
  let grandUsers = 0;

  MONTHS_ORDER.filter(function (m) { return byMonth[m]; }).forEach(function (month, mi) {
    const rows = byMonth[month];
    const monthTotal = rows.reduce(function (s, r) { return s + (r.total || 0); }, 0);
    const monthUsers = rows.reduce(function (s, r) { return s + (r.qty || 0); }, 0);
    grandTotal += monthTotal; grandUsers += monthUsers;
    rows.forEach(function (r, ri) {
      const bg = (mi + ri) % 2 === 0 ? 'var(--surface)' : 'var(--bg)';
      const wid = r.id || '';
      const dblClick = isAdmin ? ' data-wl-id="' + wid + '" ondblclick="openWlModal(this.getAttribute(\'data-wl-id\'))"' : '';
      const monthTd = ri === 0 ? '<td rowspan="' + rows.length + '" style="padding:0.65rem 1rem;font-weight:800;text-align:center;background:var(--bg);border-right:2px solid var(--border);color:var(--ink2)">' + month + '</td>' : '';
      const editTd = isAdmin ? '<td style="padding:0.5rem;text-align:center"><button data-wl-id="' + wid + '" onclick="event.stopPropagation(); openWlModal(this.getAttribute(\'data-wl-id\'))" style="background:none;border:1px solid var(--border);border-radius:6px;cursor:pointer;font-size:0.75rem;padding:0.2rem 0.5rem;color:var(--ink3)">✏️</button></td>' : '';
      html += '<tr style="background:' + bg + ';vertical-align:middle;cursor:' + (isAdmin ? 'pointer' : 'default') + '"' + dblClick + '>' + monthTd + '<td style="padding:0.65rem 1rem;font-weight:600;color:var(--ink)">' + (r.company || '—') + '</td><td style="padding:0.65rem 1rem;color:var(--ink2)">' + (r.package || '—') + '</td><td style="padding:0.65rem 1rem;text-align:center;font-weight:700;color:#457b9d">' + (r.qty || 0).toLocaleString('tr-TR') + '</td><td style="padding:0.65rem 1rem;text-align:right;color:var(--ink3)">' + (r.unitPrice || 0).toLocaleString('tr-TR') + ' TL</td><td style="padding:0.65rem 1rem;text-align:right;font-weight:800;color:#10b981">' + (r.total || 0).toLocaleString('tr-TR') + ' TL</td><td style="padding:0.65rem 1rem;color:var(--ink3);font-size:0.8rem">' + (r.note || '') + '</td>' + editTd + '</tr>';
    });
    const cs = isAdmin ? '2' : '1';
    html += '<tr style="background:rgba(69,123,157,0.08)"><td colspan="3" style="padding:0.5rem 1rem;text-align:right;font-size:0.78rem;color:var(--ink3);font-style:italic">' + month + ' Toplamı (' + monthUsers + ' kullanıcı):</td><td style="padding:0.5rem 1rem;text-align:center;font-weight:700;color:#457b9d">' + monthUsers + '</td><td></td><td style="padding:0.5rem 1rem;text-align:right;font-weight:800;color:#10b981">' + monthTotal.toLocaleString('tr-TR') + ' TL</td><td colspan="' + cs + '"></td></tr>';
  });

  const cs2 = isAdmin ? '2' : '1';
  html += '</tbody><tfoot><tr style="background:rgba(69,123,157,0.25);font-weight:800"><td colspan="3" style="padding:0.75rem 1rem;text-align:right;font-size:0.9rem">GENEL TOPLAM</td><td style="padding:0.75rem 1rem;text-align:center;font-size:1rem;color:#457b9d">' + grandUsers + '</td><td></td><td style="padding:0.75rem 1rem;text-align:right;font-size:1rem;color:#10b981">' + grandTotal.toLocaleString('tr-TR') + ' TL</td><td colspan="' + cs2 + '"></td></tr></tfoot></table></div>';
  tableEl.innerHTML = html;
}

function exportWlExcel() {
  if (typeof XLSX === 'undefined') { showToast('Excel kütüphanesi yüklenmedi.', 'error'); return; }
  if (!allWlRecords.length) { showToast('Tablo boş!', 'warning'); return; }
  const headers = ['AY', 'KURUM ADI', 'PAKET ADI', 'ADET', 'BİRİM FİYAT', 'TOPLAM', 'NOTLAR'];
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

function listenToWlRecords(year) {
  const unsub = db.collection('whitelabel_records')
    .onSnapshot(snap => {
      let data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      // Filter by selected year
      allWlRecords = data.filter(r => (r.period || '').includes(year));
      if (document.getElementById('report-view-whitelabel')?.style.display !== 'none') {
        renderWhiteLabel();
      }
    });
  globalUnsubscribeFns.push(unsub);
}

