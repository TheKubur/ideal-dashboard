let allProposals = [];
let editingProposalId = null;
let proposalPage = 1;
const proposalPageSize = 10;

/* ── TITLE MAP ── */
function getMemberTitle(memberId) {
  if (memberId === 'admin') return 'Head of Marketing & Growth';
  if (memberId === 'esma')  return 'Kıdemli Satış Uzmanı';
  if (memberId === 'melek') return 'Satış ve Pazarlama Uzmanı';
  if (memberId === 'dilan') return 'Satış Uzman Yardımcısı';
  const m = TEAM_DEF.find(x => x.id === memberId);
  return m?.title || 'Satış Temsilcisi';
}

function getMemberName(memberId) {
  if (memberId === 'admin') return 'Hüseyin Kubur';
  const m = TEAM_DEF.find(x => x.id === memberId);
  return m?.name || 'Bilinmiyor';
}

function getMemberInitials(memberId) {
  if (memberId === 'admin') return 'HK';
  const m = TEAM_DEF.find(x => x.id === memberId);
  return m?.initials || '??';
}

/* ── FIRESTORE LISTENER ── */
function listenToProposals() {
  const unsub = db.collection('proposals').orderBy('createdAt', 'desc').onSnapshot(snap => {
    const rawList = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    allProposals = rawList;
    if (document.getElementById('tab-teklif') && document.getElementById('tab-teklif').classList.contains('active')) {
      renderProposalsList();
    }
  }, err => {
    console.error('Proposals listener error:', err);
  });
  unsubscribeFns.push(unsub);
}

/* ── INIT ── */
function initProposalsPage() {
  const dateInput = document.getElementById('propDate');
  if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];

  const compSel = document.getElementById('propCompany');
  if (compSel) {
    const actCompanies = [...new Set(allActivities.map(a => a.company).filter(c => c))];
    const allCompanies = [...new Set([...COMPANIES, ...actCompanies])].sort();
    compSel.innerHTML = '<option value="">-- Kurum Seç --</option>' +
      allCompanies.map(c => `<option value="${c}">${c}</option>`).join('') +
      '<option value="__yeni__" style="font-weight:bold;color:var(--accent)">+ Yeni Kurum Ekle...</option>';
  }

  // Cancel edit mode if re-entering page
  editingProposalId = null;
  const btn = document.getElementById('saveProposalBtn');
  if (btn) { btn.textContent = 'Teklif Oluştur ve PDF İndir'; btn.disabled = false; }
  const cancelBtn = document.getElementById('cancelEditBtn');
  if (cancelBtn) cancelBtn.style.display = 'none';
  const editBanner = document.getElementById('editModeBanner');
  if (editBanner) editBanner.style.display = 'none';

  resetProposalForm();
  populatePreparedBy();
  renderProposalsList();
}

/* ── PREPARED BY DROPDOWN ── */
function populatePreparedBy() {
  const select = document.getElementById('propPreparedBy');
  if (!select) return;

  select.innerHTML = '';

  if (currentUser.memberId === 'admin') {
    select.innerHTML += `<option value="admin">Hüseyin Kubur</option>`;
    TEAM_DEF.forEach(m => {
      if (m.dept === 'Satış') {
        select.innerHTML += `<option value="${m.id}">${m.name}</option>`;
      }
    });
  } else {
    select.innerHTML += `<option value="${currentUser.memberId}">${currentUser.name}</option>`;
    select.innerHTML += `<option value="admin">Hüseyin Kubur</option>`;
  }

  select.value = currentUser.memberId || 'admin';
}

/* ── FORM RESET ── */
function resetProposalForm() {
  const form = document.getElementById('proposalForm');
  if (form) form.reset();

  const dateInput = document.getElementById('propDate');
  if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];

  const itemsContainer = document.getElementById('propItemsContainer');
  if (itemsContainer) {
    itemsContainer.innerHTML = '';
    addProposalItemRow();
  }

  const customInput = document.getElementById('propCompanyCustom');
  if (customInput) { customInput.classList.add('hidden'); customInput.value = ''; }

  // Reset proposal type and package settings fields
  const typeSel = document.getElementById('propType');
  if (typeSel) typeSel.value = 'standard';
  const card = document.getElementById('packageSettingsCard');
  if (card) card.style.display = 'none';

  const pkgPrice = document.getElementById('propPackagePrice');
  if (pkgPrice) pkgPrice.value = '';
  const pkgTitle = document.getElementById('propPackageTitle');
  if (pkgTitle) pkgTitle.value = 'PAKET FİYATI';
  const pkgNote = document.getElementById('propPackageNote');
  if (pkgNote) pkgNote.value = '';

  calculateProposalGrandTotal();

  // Reset footnote selection to first option
  const firstFootnote = document.querySelector('input[name="propFootnote"][value="teknopark"]');
  if (firstFootnote) { firstFootnote.checked = true; selectProposalFootnote('teknopark'); }
}

/* ── FOOTNOTE SELECTOR ── */
function selectProposalFootnote(value) {
  const labelA = document.getElementById('propFootnoteA_label');
  const labelB = document.getElementById('propFootnoteB_label');
  if (!labelA || !labelB) return;
  if (value === 'teknopark') {
    labelA.style.borderColor = '#0d1f61';
    labelA.style.background  = 'rgba(13,31,97,0.05)';
    labelB.style.borderColor = 'var(--border)';
    labelB.style.background  = 'var(--bg)';
  } else {
    labelB.style.borderColor = '#0d1f61';
    labelB.style.background  = 'rgba(13,31,97,0.05)';
    labelA.style.borderColor = 'var(--border)';
    labelA.style.background  = 'var(--bg)';
  }
}

/* ── COMPANY CHANGE ── */
function handlePropCompanyChange() {
  const val = document.getElementById('propCompany').value;
  const customInput = document.getElementById('propCompanyCustom');
  if (!customInput) return;
  if (val === '__yeni__') { customInput.classList.remove('hidden'); customInput.focus(); }
  else { customInput.classList.add('hidden'); customInput.value = ''; }
}

/* ── ITEM ROWS ── */
function addProposalItemRow(itemData) {
  const container = document.getElementById('propItemsContainer');
  if (!container) return;

  const div = document.createElement('div');
  div.className = 'proposal-item-row';

  const name  = itemData?.name  || '';
  const desc  = itemData?.desc  || '';
  const qty   = itemData?.qty   ?? 1;
  const price = itemData?.price ?? '';

  div.innerHTML = `
    <div style="flex:2; min-width:140px;">
      <input type="text" class="modal-input prop-item-name" placeholder="Ürün / Hizmet Adı" value="${name}" required>
    </div>
    <div style="flex:2; min-width:140px;">
      <input type="text" class="modal-input prop-item-desc" placeholder="Açıklama (Opsiyonel)" value="${desc}">
    </div>
    <div style="flex:0.5; min-width:60px;">
      <input type="number" class="modal-input prop-item-qty" value="${qty}" min="1" oninput="calculateRowTotal(this)" required>
    </div>
    <div style="flex:1; min-width:100px;">
      <input type="number" class="modal-input prop-item-price" placeholder="Birim Fiyat (₺)" value="${price}" min="0" step="0.01" oninput="calculateRowTotal(this)" required>
    </div>
    <div style="flex:1; min-width:110px; display:flex; align-items:center; justify-content:space-between; padding-left:0.5rem;">
      <span class="prop-item-total" style="font-weight:700; color:var(--ink2);">${itemData ? (itemData.total || 0).toLocaleString('tr-TR', {minimumFractionDigits:2}) + ' ₺' : '0.00 ₺'}</span>
      <button type="button" class="modal-cancel" style="background:#e63946; color:white; border:none; padding:0.35rem 0.65rem; border-radius:6px; cursor:pointer;" onclick="removeProposalItemRow(this)">Sil</button>
    </div>
  `;
  container.appendChild(div);
  calculateProposalGrandTotal();
}

function removeProposalItemRow(btn) {
  const row = btn.closest('.proposal-item-row');
  const container = document.getElementById('propItemsContainer');
  if (container.children.length <= 1) { showToast('En az bir ürün veya hizmet satırı bulunmalıdır.', 'warning'); return; }
  row.remove();
  calculateProposalGrandTotal();
}

function calculateRowTotal(input) {
  const row = input.closest('.proposal-item-row');
  const qty   = parseFloat(row.querySelector('.prop-item-qty').value)   || 0;
  const price = parseFloat(row.querySelector('.prop-item-price').value) || 0;
  const totalSpan = row.querySelector('.prop-item-total');
  const total = qty * price;
  totalSpan.textContent = total.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ₺';
  calculateProposalGrandTotal();
}

function handlePropTypeChange() {
  const type = document.getElementById('propType')?.value || 'standard';
  const card = document.getElementById('packageSettingsCard');
  if (card) {
    card.style.display = type === 'package' ? 'block' : 'none';
  }
  calculateProposalGrandTotal();
}

function calculateProposalGrandTotal() {
  const propType = document.getElementById('propType')?.value || 'standard';

  const rows = document.querySelectorAll('.proposal-item-row');
  let itemsSubtotal = 0;
  rows.forEach(row => {
    const qty   = parseFloat(row.querySelector('.prop-item-qty')?.value)   || 0;
    const price = parseFloat(row.querySelector('.prop-item-price')?.value) || 0;
    itemsSubtotal += qty * price;
  });

  let subtotal = itemsSubtotal;
  if (propType === 'package') {
    const pkgPriceInput = document.getElementById('propPackagePrice');
    const packagePrice = parseFloat(pkgPriceInput ? pkgPriceInput.value : 0) || 0;
    subtotal = packagePrice;
  }

  let vat = 0;
  let grandTotal = subtotal;

  const subtotalEl   = document.getElementById('propSubtotalText');
  const vatEl        = document.getElementById('propVatText');
  const grandTotalEl = document.getElementById('propGrandTotalText');
  const vatLabelEl   = document.getElementById('propVatLabel');

  if (subtotalEl)   subtotalEl.textContent   = subtotal.toLocaleString('tr-TR', {minimumFractionDigits:2,maximumFractionDigits:2}) + ' ₺';
  if (vatEl)        vatEl.textContent         = '0.00 ₺';
  if (vatLabelEl)   vatLabelEl.textContent    = 'KDV:';
  if (grandTotalEl) grandTotalEl.textContent  = grandTotal.toLocaleString('tr-TR', {minimumFractionDigits:2,maximumFractionDigits:2}) + ' ₺';
}

/* ── COLLECT FORM DATA ── */
function collectProposalFormData() {
  let company = document.getElementById('propCompany').value;
  if (company === '__yeni__') {
    company = document.getElementById('propCompanyCustom').value.trim();
    if (!company) { showToast('Yeni kurum adını yazmalısınız!', 'warning'); return null; }
  }
  if (!company) { showToast('Lütfen bir kurum/firma seçin!', 'warning'); return null; }

  const contactPerson = document.getElementById('propContactPerson').value.trim();
  const propDate      = document.getElementById('propDate').value;
  const propValidity  = document.getElementById('propValidity').value.trim() || '30 Gün';
  const notes         = document.getElementById('propNotes').value.trim();
  const vatOption     = document.querySelector('input[name="propVatOption"]:checked').value;
  const footnoteType  = document.querySelector('input[name="propFootnote"]:checked')?.value || 'teknopark';

  const itemRows = document.querySelectorAll('.proposal-item-row');
  const items = [];
  let subtotal = 0;

  for (let row of itemRows) {
    const name  = row.querySelector('.prop-item-name').value.trim();
    const desc  = row.querySelector('.prop-item-desc').value.trim();
    const qty   = parseFloat(row.querySelector('.prop-item-qty').value) || 0;
    const price = parseFloat(row.querySelector('.prop-item-price').value) || 0;
    if (!name)    { showToast('Ürün / hizmet adı boş bırakılamaz!', 'warning'); return null; }
    if (qty <= 0) { showToast("Miktar 0'dan büyük olmalıdır!", 'warning'); return null; }
    if (price < 0){ showToast('Birim fiyat negatif olamaz!', 'warning'); return null; }
    const total = qty * price;
    subtotal += total;
    items.push({ name, desc, qty, price, total });
  }

  const propType = document.getElementById('propType')?.value || 'standard';
  const packagePrice = propType === 'package' ? (parseFloat(document.getElementById('propPackagePrice')?.value) || 0) : 0;
  const packageTitle = propType === 'package' ? (document.getElementById('propPackageTitle')?.value || 'PAKET FİYATI') : '';
  const packageNote = propType === 'package' ? (document.getElementById('propPackageNote')?.value || '') : '';

  let calculatedSubtotal = subtotal;
  let calculatedVat = 0;
  let calculatedGrandTotal = calculatedSubtotal;

  if (propType === 'package') {
    if (packagePrice <= 0) { showToast('Lütfen paket fiyatı girin!', 'warning'); return null; }
    calculatedSubtotal = packagePrice;
    calculatedVat = 0;
    calculatedGrandTotal = packagePrice;
  }

  const preparedById = document.getElementById('propPreparedBy').value;

  return {
    company, contactPerson,
    date: propDate,
    validity: propValidity,
    items, 
    vatOption, 
    subtotal: calculatedSubtotal, 
    vat: calculatedVat, 
    grandTotal: calculatedGrandTotal, 
    notes, 
    footnoteType,
    proposalType: propType,
    packagePrice,
    packageTitle,
    packageNote,
    memberId:      preparedById,
    memberName:    getMemberName(preparedById),
    memberInitials: getMemberInitials(preparedById),
    memberTitle:   getMemberTitle(preparedById),
    creatorId:     currentUser.memberId || 'admin',
    creatorName:   currentUser.name,
  };
}

/* ── SAVE OR UPDATE ── */
function saveAndDownloadProposal() {
  const formData = collectProposalFormData();
  if (!formData) return;

  const btn = document.getElementById('saveProposalBtn');
  btn.textContent = editingProposalId ? 'Güncelleniyor...' : 'Kaydediliyor...';
  btn.disabled = true;

  if (editingProposalId) {
    // UPDATE existing
    db.collection('proposals').doc(editingProposalId).update({
      ...formData,
      updatedAt: new Date().toISOString()
    })
    .then(() => {
      showToast('Teklif güncellendi ve PDF hazırlanıyor!', 'success');
      const updated = { ...formData, id: editingProposalId, createdAt: allProposals.find(p => p.id === editingProposalId)?.createdAt || new Date().toISOString() };
      generateProposalPDF(updated);
      cancelEditMode();
    })
    .catch(err => showToast('Güncelleme hatası: ' + err.message, 'error'))
    .finally(() => { btn.textContent = 'Teklif Oluştur ve PDF İndir'; btn.disabled = false; });
  } else {
    // CREATE new
    const proposalData = { ...formData, createdAt: new Date().toISOString() };
    db.collection('proposals').add(proposalData)
    .then(docRef => {
      showToast('Teklif kaydedildi ve PDF hazırlanıyor!', 'success');
      proposalData.id = docRef.id;
      generateProposalPDF(proposalData);
      resetProposalForm();
      populatePreparedBy();
    })
    .catch(err => showToast('Teklif kaydedilirken hata oluştu: ' + err.message, 'error'))
    .finally(() => { btn.textContent = 'Teklif Oluştur ve PDF İndir'; btn.disabled = false; });
  }
}

/* ── EDIT MODE ── */
function enterEditMode(id) {
  if (typeof switchTab === 'function') switchTab('teklif');
  const prop = (allProposals || []).find(p => String(p.id) === String(id));
  if (!prop) { showToast('Teklif bulunamadı!', 'error'); return; }

  editingProposalId = id;

  // Scroll to form
  document.getElementById('proposalForm').scrollIntoView({ behavior: 'smooth', block: 'start' });

  // Show edit banner
  const editBanner = document.getElementById('editModeBanner');
  if (editBanner) { editBanner.style.display = 'flex'; editBanner.querySelector('.edit-banner-company').textContent = prop.company; }

  // Show cancel button
  const cancelBtn = document.getElementById('cancelEditBtn');
  if (cancelBtn) cancelBtn.style.display = 'inline-flex';

  const btn = document.getElementById('saveProposalBtn');
  if (btn) btn.textContent = '✏️ Teklifi Güncelle ve PDF İndir';

  // Fill company
  const compSel = document.getElementById('propCompany');
  if (compSel) {
    const exists = [...compSel.options].some(o => o.value === prop.company);
    if (exists) { compSel.value = prop.company; }
    else {
      const opt = document.createElement('option');
      opt.value = prop.company; opt.textContent = prop.company;
      compSel.appendChild(opt);
      compSel.value = prop.company;
    }
  }

  // Fill other fields
  const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };
  setVal('propContactPerson', prop.contactPerson);
  setVal('propDate',          prop.date);
  setVal('propValidity',      prop.validity);
  setVal('propNotes',         prop.notes);

  // Set Proposal Type and Package values
  const typeSel = document.getElementById('propType');
  if (typeSel) {
    typeSel.value = prop.proposalType || 'standard';
    handlePropTypeChange();
  }
  setVal('propPackagePrice', prop.packagePrice || '');
  setVal('propPackageTitle', prop.packageTitle || 'PAKET FİYATI');
  setVal('propPackageNote', prop.packageNote || '');

  // VAT option
  const vatRadios = document.querySelectorAll('input[name="propVatOption"]');
  vatRadios.forEach(r => { r.checked = r.value === prop.vatOption; });

  // Footnote option
  const footnoteVal = prop.footnoteType || 'teknopark';
  const fnRadio = document.querySelector(`input[name="propFootnote"][value="${footnoteVal}"]`);
  if (fnRadio) { fnRadio.checked = true; selectProposalFootnote(footnoteVal); }

  // Prepared by
  const preparedSelect = document.getElementById('propPreparedBy');
  if (preparedSelect) {
    const exists = [...preparedSelect.options].some(o => o.value === prop.memberId);
    if (exists) preparedSelect.value = prop.memberId;
  }

  // Items
  const itemsContainer = document.getElementById('propItemsContainer');
  if (itemsContainer) {
    itemsContainer.innerHTML = '';
    (prop.items || []).forEach(item => addProposalItemRow(item));
  }

  calculateProposalGrandTotal();
}

function cancelEditMode() {
  editingProposalId = null;
  const btn = document.getElementById('saveProposalBtn');
  if (btn) { btn.textContent = 'Teklif Oluştur ve PDF İndir'; btn.disabled = false; }
  const cancelBtn = document.getElementById('cancelEditBtn');
  if (cancelBtn) cancelBtn.style.display = 'none';
  const editBanner = document.getElementById('editModeBanner');
  if (editBanner) editBanner.style.display = 'none';
  resetProposalForm();
  populatePreparedBy();
}

/* ── DELETE ── */
function deleteProposal(id) {
  if (currentUser.role !== 'admin') { showToast('Sadece yönetici silebilir!', 'error'); return; }
  if (!confirm('Bu teklifi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz!')) return;
  db.collection('proposals').doc(id).delete()
    .then(() => showToast('Teklif başarıyla silindi.', 'success'))
    .catch(err => showToast('Silme hatası: ' + err.message, 'error'));
}

/* ── PDF GENERATION ── */
function generateProposalPDF(data) {
  // Logoyu doğrudan gömülü base64 sabiti üzerinden al — CORS/network sorunu yok
  const logoDataUrl = (typeof IDEAL_DATA_LOGO_B64 !== 'undefined') ? IDEAL_DATA_LOGO_B64 : null;
  buildAndSavePDF(data, logoDataUrl);
}

function buildAndSavePDF(data, logoDataUrl) {
  const TurkishMonths = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
  const formatDate = (d) => {
    if (!d) return '';
    const p = d.split('-');
    if (p.length !== 3) return d;
    return `${parseInt(p[2])} ${TurkishMonths[parseInt(p[1])-1]} ${p[0]}`;
  };

  const formattedDate = formatDate(data.date);
  const teklif_no = `ID-${data.createdAt.substring(2,4)}${data.createdAt.substring(5,7)}${data.createdAt.substring(8,10)}-${data.id ? data.id.substring(0,5).toUpperCase() : 'TEMP'}`;

  // Check if it's package proposal
  const isPackage = data.proposalType === 'package';

  let tableHtml = '';

  if (isPackage) {
    // Flexbox package layout to fix html2canvas rowspan rendering bug
    const rowsHtml = data.items.map((item, idx) => `
      <div style="display:flex; border-bottom:${idx===data.items.length-1?'none':'1px solid #cbd5e1'}; background:${idx%2===0?'#ffffff':'#f8fafc'}; padding:12px 10px; align-items:center; min-height:45px; box-sizing:border-box;">
        <div style="flex:1; font-weight:600; text-align:left; font-size:13px; color:#0f172a; padding-right:10px;">
          <strong>${item.name}</strong>
          ${item.desc ? `<br><span style="color:#64748b; font-size:11px; font-weight:normal">${item.desc}</span>` : ''}
        </div>
        <div style="width:150px; text-align:right; font-weight:700; color:#0f172a; font-size:13px;">${Number(item.price).toLocaleString('tr-TR',{minimumFractionDigits:2,maximumFractionDigits:2})} ₺</div>
      </div>
    `).join('');

    tableHtml = `
      <div style="display:flex; border:2px solid #cbd5e1; border-radius:8px; overflow:hidden; margin-bottom:28px; width:100%; box-sizing:border-box; background:#ffffff;">
        <!-- Left Side: Items & Prices -->
        <div style="flex:1; display:flex; flex-direction:column;">
          <!-- Header -->
          <div style="display:flex; background:#0d1f61; color:#ffffff; font-weight:700; font-size:12px; padding:12px 10px; border-bottom:2px solid #cbd5e1; box-sizing:border-box;">
            <div style="flex:1; text-align:left;">Açıklama</div>
            <div style="width:150px; text-align:right;">Birim Fiyat/Aylık</div>
          </div>
          <!-- Rows -->
          <div style="display:flex; flex-direction:column; flex:1; justify-content:space-between;">
            ${rowsHtml}
          </div>
        </div>
        
        <!-- Right Side: Package Price Column -->
        <div style="width:180px; display:flex; flex-direction:column; border-left:2px solid #cbd5e1; background:#f8fafc; box-sizing:border-box;">
          <!-- Header -->
          <div style="background:#0d1f61; color:#ffffff; font-weight:700; font-size:12px; padding:12px 10px; text-align:center; border-bottom:2px solid #cbd5e1; box-sizing:border-box;">
            ${data.packageTitle || 'PAKET FİYATI'}
          </div>
          <!-- Price Body -->
          <div style="flex:1; display:flex; flex-direction:column; justify-content:center; align-items:center; padding:20px; text-align:center; box-sizing:border-box;">
            <div style="font-size:11px; text-transform:uppercase; color:#64748b; font-weight:700; margin-bottom:6px; width:100%;">${data.packageTitle || 'PAKET FİYATI'}</div>
            <div style="font-size:18px; color:#f24f00; font-weight:900; white-space:nowrap; width:100%;">${Number(data.packagePrice).toLocaleString('tr-TR', {minimumFractionDigits:2,maximumFractionDigits:2})} ₺</div>
          </div>
        </div>
      </div>
    `;
  } else {
    // Standard Table layout
    const itemsRowsHtml = data.items.map((item, idx) => `
      <tr style="border-bottom:1px solid #e2e8f0; background:${idx%2===0?'#ffffff':'#f8fafc'}">
        <td style="padding:10px 8px; font-weight:600; vertical-align:top">${idx+1}. ${item.name}</td>
        <td style="padding:10px 8px; color:#64748b; vertical-align:top; font-size:12px">${item.desc || '—'}</td>
        <td style="padding:10px 8px; text-align:center; vertical-align:top">${item.qty}</td>
        <td style="padding:10px 8px; text-align:right; vertical-align:top">${Number(item.price).toLocaleString('tr-TR',{minimumFractionDigits:2,maximumFractionDigits:2})} ₺</td>
        <td style="padding:10px 8px; text-align:right; vertical-align:top; font-weight:700">${Number(item.total).toLocaleString('tr-TR',{minimumFractionDigits:2,maximumFractionDigits:2})} ₺</td>
      </tr>
    `).join('');

    tableHtml = `
      <table style="width:100%; border-collapse:collapse; margin-bottom:28px">
        <thead>
          <tr style="background:#0d1f61; color:#ffffff">
            <th style="padding:12px 8px; text-align:left; font-weight:700; font-size:12px">Ürün / Hizmet</th>
            <th style="padding:12px 8px; text-align:left; font-weight:700; font-size:12px">Açıklama</th>
            <th style="padding:12px 8px; text-align:center; font-weight:700; font-size:12px; width:55px">Miktar</th>
            <th style="padding:12px 8px; text-align:right; font-weight:700; font-size:12px; width:110px">Birim Fiyat</th>
            <th style="padding:12px 8px; text-align:right; font-weight:700; font-size:12px; width:120px">Toplam</th>
          </tr>
        </thead>
        <tbody>
          ${itemsRowsHtml}
          <tr>
            <td colspan="3" style="border:none"></td>
            <td style="padding:12px 8px; text-align:right; font-weight:800; color:#ffffff; background:#0d1f61; font-size:14px; border-top:2px solid #cbd5e1">Genel Toplam:</td>
            <td style="padding:12px 8px; text-align:right; font-weight:800; color:#ffffff; background:#f24f00; font-size:14px; border-top:2px solid #cbd5e1">${Number(data.grandTotal).toLocaleString('tr-TR',{minimumFractionDigits:2,maximumFractionDigits:2})} ₺</td>
          </tr>
        </tbody>
      </table>
    `;
  }

  const logoHtml = logoDataUrl
    ? `<img src="${logoDataUrl}" alt="İdeal Data" style="height:48px; object-fit:contain; display:block">`
    : `<div style="font-size:22px; font-weight:900; color:#0d1f61">İdeal Data</div>`;

  // Package red note display
  const packageNoteHtml = (isPackage && data.packageNote)
    ? `<div style="font-size:11px; color:#e63946; font-weight:700; display:flex; align-items:baseline; gap:6px; margin-bottom:8px">
         <span style="color:#e63946; font-weight:700; flex-shrink:0">*</span>
         <span style="color:#e63946; font-weight:700">${data.packageNote.toUpperCase()}</span>
       </div>`
    : '';

  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif; color:#0f172a; background:#ffffff; padding:40px; width:750px; font-size:13px; line-height:1.6; box-sizing:border-box;">
      
      <!-- HEADER -->
      <div style="display:flex; justify-content:space-between; align-items:flex-start; border-bottom:3px solid #f24f00; padding-bottom:24px; margin-bottom:28px;">
        <div>
          <div style="margin-bottom:10px">${logoHtml}</div>
          <div style="font-size:11px; color:#64748b; font-weight:500; line-height:1.7">
            İdeal Data Finansal Teknolojiler A.Ş.<br>
            Barbaros Mah. Ihlamur Bulvarı No:3, Ağaoğlu My Newwork,<br>
            14. Kat, No:149, 34746 Ataşehir / İstanbul<br>
            www.idealdata.com.tr &bull; bilgi@idealdata.com.tr &bull; +90 212 385 35 35
          </div>
        </div>
        <div style="text-align:right">
          <div style="font-size:28px; font-weight:900; color:#0d1f61; letter-spacing:-0.5px; text-transform:uppercase">Fiyat Teklifi</div>
          <div style="margin-top:10px; font-size:12px; color:#475569; line-height:1.8">
            <strong>Teklif Tarihi:</strong> ${formattedDate}<br>
            <strong>Geçerlilik:</strong> ${data.validity}<br>
            <strong>Teklif No:</strong> <span style="font-family:monospace; font-weight:700; color:#0d1f61">${teklif_no}</span>
          </div>
        </div>
      </div>

      <!-- CLIENT & PREPARER -->
      <div style="display:flex; gap:0; background:#f8fafc; border-radius:12px; border:1px solid #e2e8f0; overflow:hidden; margin-bottom:30px;">
        <div style="flex:1; padding:18px 20px;">
          <div style="font-size:10px; text-transform:uppercase; font-weight:700; color:#64748b; margin-bottom:8px; letter-spacing:0.8px">Sayın</div>
          <div style="font-size:16px; font-weight:800; color:#0f172a; margin-bottom:4px">${data.company}</div>
          ${data.contactPerson ? `<div style="font-size:13px; color:#475569">Yetkili: <strong>${data.contactPerson}</strong></div>` : ''}
        </div>
        <div style="width:1px; background:#e2e8f0"></div>
        <div style="width:220px; padding:18px 20px; text-align:right">
          <div style="font-size:10px; text-transform:uppercase; font-weight:700; color:#64748b; margin-bottom:8px; letter-spacing:0.8px">Teklifi Hazırlayan</div>
          <div style="font-size:14px; font-weight:700; color:#0f172a">${data.memberName}</div>
          <div style="font-size:11px; color:#f24f00; font-weight:600; margin-top:2px">${data.memberTitle || 'Satış Temsilcisi'}</div>
          <div style="font-size:10px; color:#94a3b8; margin-top:1px">İdeal Data</div>
        </div>
      </div>

      <!-- ITEMS TABLE -->
      ${tableHtml}

      ${data.notes ? `
        <div style="border-top:1px solid #e2e8f0; padding-top:18px; margin-bottom:24px">
          <div style="font-size:10px; text-transform:uppercase; font-weight:700; color:#64748b; margin-bottom:8px; letter-spacing:0.8px">Özel Şartlar ve Ek Notlar</div>
          <div style="font-size:12px; color:#334155; background:#fafafa; border-radius:8px; padding:12px 16px; white-space:pre-wrap; line-height:1.6; border-left:3px solid #f24f00">${data.notes}</div>
        </div>
      ` : ''}

      <!-- FOOTNOTES -->
      <div style="margin-top:20px; border-top:2px solid #e2e8f0; padding-top:16px; margin-bottom:20px">
        <div style="font-size:10px; font-weight:700; color:#64748b; text-transform:uppercase; letter-spacing:0.8px; margin-bottom:10px">Koşullar ve Açıklamalar</div>
        <div style="display:flex; flex-direction:column; gap:6px">
          ${packageNoteHtml}
          <div style="font-size:11px; color:#334155; display:flex; align-items:baseline; gap:6px">
            <span style="color:#f24f00; font-weight:700; flex-shrink:0">*</span>
            <span>${data.footnoteType === 'kdvhariç'
              ? 'Burada yer alan fiyat bilgileri KDV hariç verilmiştir. Ürünlerimiz için kullanılan KDV oranı %20&apos;dir.'
              : 'Burada yer alan fiyatlar, Teknopark KDV muafiyeti kapsamında sunulmuştur.'}
            </span>
          </div>
          <div style="font-size:11px; color:#334155; display:flex; align-items:baseline; gap:6px">
            <span style="color:#f24f00; font-weight:700; flex-shrink:0">*</span>
            <span>Fiyatlarımız yıl sonuna kadar geçerli olup, her yıl TÜİK TÜFE oranında artış gösterecektir.</span>
          </div>
          <div style="font-size:11px; color:#334155; display:flex; align-items:baseline; gap:6px">
            <span style="color:#f24f00; font-weight:700; flex-shrink:0">*</span>
            <span>Fiyat teklifimiz 30 gün süreyle geçerlidir.</span>
          </div>
        </div>
      </div>

      <!-- FOOTER -->
      <div style="border-top:1px solid #e2e8f0; padding-top:16px; text-align:center; font-size:11px; color:#94a3b8">
        <div style="font-weight:700; color:#475569; margin-bottom:4px; font-size:12px">Bizi tercih ettiğiniz için teşekkür ederiz.</div>
        <div>Bu fiyat teklifi İdeal Data Finansal Teknolojiler A.Ş. tarafından hazırlanmıştır.</div>
      </div>
    </div>
  `;

  // Create wrapper
  const wrapper = document.createElement('div');
  wrapper.style.cssText = 'position:absolute; left:-9999px; top:0; background:#fff';
  wrapper.innerHTML = html;
  document.body.appendChild(wrapper);

  const target = wrapper.firstElementChild;
  const filename = `Teklif_${data.company.replace(/[^a-zA-Z0-9ığüşöçİĞÜŞÖÇ\s]/g,'').replace(/\s+/g,'_')}_${data.date}.pdf`;

  const opt = {
    margin:      8,
    filename,
    image:       { type: 'jpeg', quality: 0.95 },
    html2canvas: { scale: 2, useCORS: true, allowTaint: true, logging: false, backgroundColor: '#ffffff' },
    jsPDF:       { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  html2pdf().from(target).set(opt).save()
    .then(() => { wrapper.remove(); })
    .catch(err => { console.error('PDF hatası:', err); wrapper.remove(); showToast('PDF oluşturulurken hata oluştu.', 'error'); });
}

/* ── RENDER LIST ── */
function renderProposalsList() {
  const container = document.getElementById('proposalsHistoryList');
  const paginationContainer = document.getElementById('proposalPagination');
  if (!container) return;

  if (!allProposals.length) {
    container.innerHTML = '<tr><td colspan="8" class="crm-empty">Henüz teklif kaydı bulunmuyor. 📭</td></tr>';
    if (paginationContainer) paginationContainer.innerHTML = '';
    return;
  }

  // Pagination bounds checking
  const maxPage = Math.ceil(allProposals.length / proposalPageSize);
  if (proposalPage > maxPage) {
    proposalPage = maxPage || 1;
  }
  if (proposalPage < 1) {
    proposalPage = 1;
  }

  const startIndex = (proposalPage - 1) * proposalPageSize;
  const endIndex = startIndex + proposalPageSize;
  const paginatedProposals = allProposals.slice(startIndex, endIndex);

  const fmtDate = (s) => { if (!s) return ''; const p = s.split('-'); return `${p[2]}.${p[1]}.${p[0]}`; };
  const isAdmin  = !currentUser || currentUser.role === 'admin';
  const canEdit  = (p) => !currentUser || currentUser.role !== 'viewer';

  container.innerHTML = paginatedProposals.map(p => {
    const memberColor = p.memberId === 'admin' ? '#0d1f61' : (TEAM_DEF.find(x => x.id === p.memberId)?.deptColor || '#ccc');
    const teklif_no  = `ID-${p.createdAt.substring(2,4)}${p.createdAt.substring(5,7)}${p.createdAt.substring(8,10)}-${p.id ? p.id.substring(0,5).toUpperCase() : 'TEMP'}`;
    const editBtn = canEdit(p)
      ? `<button class="crm-action-btn" data-prop-id="${p.id}" style="background:var(--surface); border:1px solid var(--border); color:var(--ink2); padding:0.3rem 0.6rem; border-radius:6px; font-size:0.75rem; cursor:pointer; margin-right:4px" onclick="event.stopPropagation(); enterEditMode(this.getAttribute('data-prop-id'))">✏️ Düzenle</button>`
      : '';
    const delBtn = isAdmin
      ? `<button class="crm-action-btn" data-prop-id="${p.id}" style="background:#fee2e2; border:1px solid #fca5a5; color:#dc2626; padding:0.3rem 0.6rem; border-radius:6px; font-size:0.75rem; cursor:pointer; margin-right:4px" onclick="event.stopPropagation(); deleteProposal(this.getAttribute('data-prop-id'))">🗑️ Sil</button>`
      : '';
    return `
      <tr>
        <td style="font-weight:700; font-family:monospace; font-size:0.78rem">${teklif_no}</td>
        <td class="crm-company">${p.company}</td>
        <td>${p.contactPerson || '<span style="color:var(--ink3)">—</span>'}</td>
        <td>${fmtDate(p.date)}</td>
        <td style="font-weight:800; color:var(--green)">${Number(p.grandTotal).toLocaleString('tr-TR',{minimumFractionDigits:2,maximumFractionDigits:2})} ₺</td>
        <td>
          <div class="crm-person">
            <span class="crm-person-dot" style="background:${memberColor}"></span>
            ${p.memberName}
          </div>
        </td>
        <td style="text-align:right; white-space:nowrap">
          ${editBtn}${delBtn}
          <button class="modal-save" style="padding:0.3rem 0.6rem; font-size:0.75rem" onclick="reDownloadProposal('${p.id}')">📥 PDF</button>
        </td>
      </tr>
    `;
  }).join('');

  // Render pagination controls
  if (paginationContainer) {
    const currentToShow = Math.min(endIndex, allProposals.length);
    paginationContainer.innerHTML = `
      <span>Toplam <strong>${allProposals.length}</strong> teklif arasından <strong>${startIndex + 1} - ${currentToShow}</strong> arası gösteriliyor.</span>
      <div style="display:flex; align-items:center; gap:0.75rem">
        <button class="crm-action-btn" onclick="changeProposalPage('prev')" ${proposalPage === 1 ? 'disabled style="opacity:0.5; cursor:not-allowed;"' : 'style="cursor:pointer;"'}>&larr; Önceki</button>
        <span style="font-weight:600; padding:0 0.25rem;">Sayfa ${proposalPage} / ${maxPage}</span>
        <button class="crm-action-btn" onclick="changeProposalPage('next')" ${proposalPage === maxPage ? 'disabled style="opacity:0.5; cursor:not-allowed;"' : 'style="cursor:pointer;"'}>Sonraki &rarr;</button>
      </div>
    `;
  }
}

function changeProposalPage(direction) {
  const maxPage = Math.ceil(allProposals.length / proposalPageSize);
  if (direction === 'next' && proposalPage < maxPage) {
    proposalPage++;
    renderProposalsList();
  } else if (direction === 'prev' && proposalPage > 1) {
    proposalPage--;
    renderProposalsList();
  }
}

function reDownloadProposal(id) {
  const prop = allProposals.find(x => x.id === id);
  if (!prop) { showToast('Teklif verisi bulunamadı!', 'error'); return; }
  showToast("PDF yeniden oluşturuluyor...", 'success');
  generateProposalPDF(prop);
}
