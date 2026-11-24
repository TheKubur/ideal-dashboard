let allProposals = [];
let editingProposalId = null;
let proposalPage = 1;
const proposalPageSize = 10;
let propMode = 'offer'; // 'offer' (Fiyat Teklifi) | 'contract' (Sözleşme)

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
    if (typeof renderBarChart === 'function') renderBarChart();
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
  if (btn) { btn.textContent = propSaveLabel(); btn.disabled = false; }
  const cancelBtn = document.getElementById('cancelEditBtn');
  if (cancelBtn) cancelBtn.style.display = 'none';
  const editBanner = document.getElementById('editModeBanner');
  if (editBanner) editBanner.style.display = 'none';

  propMode = 'offer';
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

  applyPropMode(propMode);
}

/* ── MODE: FİYAT TEKLİFİ / SÖZLEŞME ── */
function propSaveLabel() {
  return propMode === 'contract' ? 'Sözleşme Oluştur ve PDF İndir' : 'Teklif Oluştur ve PDF İndir';
}

function applyPropMode(mode) {
  const prev = propMode;
  propMode = mode === 'contract' ? 'contract' : 'offer';
  const isContract = propMode === 'contract';

  document.querySelectorAll('#tab-teklif .offer-only').forEach(el => { el.style.display = isContract ? 'none' : ''; });
  document.querySelectorAll('#tab-teklif .contract-only').forEach(el => { el.style.display = isContract ? '' : 'none'; });

  const typeSel = document.getElementById('propType');
  if (typeSel) {
    if (isContract) typeSel.value = 'itemized_no_total';
    else if (prev === 'contract') typeSel.value = 'standard';
  }
  handlePropTypeChange();
  if (isContract) { const card = document.getElementById('packageSettingsCard'); if (card) card.style.display = 'none'; }

  const setBtn = (id, active) => {
    const b = document.getElementById(id);
    if (!b) return;
    b.style.background = active ? 'linear-gradient(135deg,#e63946,#8b5cf6)' : 'var(--surface)';
    b.style.color = active ? '#fff' : 'var(--ink2)';
    b.style.borderColor = active ? 'transparent' : 'var(--border)';
  };
  setBtn('propModeBtnOffer', !isContract);
  setBtn('propModeBtnContract', isContract);

  const t = document.getElementById('propPageTitle');
  if (t) t.textContent = isContract ? 'Sözleşme Oluşturma' : 'Fiyat Teklifi Oluşturma';
  const h = document.getElementById('propHistoryTitle');
  if (h) h.textContent = isContract ? '📜 Sözleşme Geçmişi' : '📜 Teklif Geçmişi';
  const btn = document.getElementById('saveProposalBtn');
  if (btn && !editingProposalId) btn.textContent = propSaveLabel();
}

function switchPropMode(mode) {
  if (mode === propMode) return;
  if (editingProposalId) cancelEditMode();
  applyPropMode(mode);
  resetProposalForm();
  populatePreparedBy();
  proposalPage = 1;
  renderProposalsList();
}
window.switchPropMode = switchPropMode;

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

function propEscape(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// **kalın**  _italik_  ~~üstü çizili~~
function propRichText(s) {
  return propEscape(s)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/~~(.+?)~~/g, '<s>$1</s>')
    .replace(/(^|[\s(>])_(.+?)_(?=$|[\s.,;:!?)<])/g, '$1<em>$2</em>');
}

function formatPropDesc(desc) {
  if (!desc) return '';
  let str = desc.trim();
  // Tek yıldız madde işareti; ** (kalın) işaretiyle karışmasın
  if (/(^|[^*])\*(?!\*)/.test(str)) {
    const parts = str.split(/(?<!\*)\*(?!\*)/).map(s => s.trim()).filter(Boolean);
    return parts.map(p => `• ${propRichText(p).replace(/\n/g, '<br>')}`).join('<br>');
  }
  return propRichText(str).replace(/\n/g, '<br>');
}

/* ── B / I / S MINI TOOLBAR ── */
function propFormatBar(targetSelector) {
  const b = (m, label, style, title) =>
    `<button type="button" title="${title}" onmousedown="event.preventDefault()" onclick="propWrapSelection(this, '${targetSelector}', '${m}')" style="${style} width:26px; height:24px; border:1px solid var(--border); background:var(--surface); color:var(--ink2); border-radius:5px; cursor:pointer; font-size:0.78rem; padding:0;">${label}</button>`;
  return `<div style="display:flex; gap:4px; margin-bottom:4px;">
    ${b('**', 'B', 'font-weight:800;', 'Kalın (**metin**)')}
    ${b('_', 'I', 'font-style:italic; font-family:serif;', 'İtalik (_metin_)')}
    ${b('~~', 'S', 'text-decoration:line-through;', 'Üstü çizili (~~metin~~)')}
  </div>`;
}

function propWrapSelection(btn, targetSelector, marker) {
  const scope = btn.closest('.proposal-item-row') || document;
  const el = targetSelector.startsWith('#') ? document.querySelector(targetSelector) : scope.querySelector(targetSelector);
  if (!el) return;
  const start = el.selectionStart, end = el.selectionEnd;
  const sel = el.value.slice(start, end) || 'metin';
  el.value = el.value.slice(0, start) + marker + sel + marker + el.value.slice(end);
  el.focus();
  el.setSelectionRange(start + marker.length, start + marker.length + sel.length);
}
window.propWrapSelection = propWrapSelection;

/* ── ITEM ROWS ── */
function addProposalItemRow(itemData = null) {
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
      ${propFormatBar('.prop-item-desc')}
      <textarea class="modal-input prop-item-desc" rows="2" placeholder="Açıklama (Satır satır veya * ile yazabilirsiniz)" style="resize:vertical; min-height:38px; font-family:'Outfit',sans-serif; font-size:0.85rem; padding:0.45rem 0.6rem; border:1px solid var(--border); border-radius:8px; background:var(--bg); color:var(--ink); width:100%; box-sizing:border-box;">${desc}</textarea>
    </div>
    <div style="flex:0.5; min-width:60px;">
      <input type="number" class="modal-input prop-item-qty" value="${qty}" min="1" oninput="calculateRowTotal(this)" required>
    </div>
    <div style="flex:1; min-width:100px;">
      <input type="number" class="modal-input prop-item-price" placeholder="Birim Fiyat (₺)" value="${price}" min="0" step="0.01" oninput="calculateRowTotal(this)" required>
    </div>
    <div style="flex:1; min-width:110px; display:flex; align-items:center; justify-content:space-between; padding-left:0.5rem;">
      <span class="prop-item-total" style="font-weight:700; color:var(--ink2);">${itemData ? (itemData.total || 0).toLocaleString('tr-TR', {minimumFractionDigits:2}) + ' ₺' : '0.00 ₺'}</span>
      <button type="button" title="Yukarı taşı" class="modal-cancel" style="padding:0.3rem 0.5rem; border-radius:6px; cursor:pointer;" onclick="moveProposalItemRow(this,-1)">▲</button>
      <button type="button" title="Aşağı taşı" class="modal-cancel" style="padding:0.3rem 0.5rem; border-radius:6px; cursor:pointer;" onclick="moveProposalItemRow(this,1)">▼</button>
      <button type="button" class="modal-cancel" style="background:#e63946; color:white; border:none; padding:0.35rem 0.65rem; border-radius:6px; cursor:pointer;" onclick="removeProposalItemRow(this)">Sil</button>
    </div>
  `;
  container.appendChild(div);
  calculateProposalGrandTotal();
}

function moveProposalItemRow(btn, dir) {
  const row = btn.closest('.proposal-item-row');
  if (!row) return;
  const target = dir < 0 ? row.previousElementSibling : row.nextElementSibling;
  if (!target) return;
  if (dir < 0) row.parentNode.insertBefore(row, target);
  else row.parentNode.insertBefore(target, row);
}
window.moveProposalItemRow = moveProposalItemRow;

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
  if (grandTotalEl) {
    if (propType === 'itemized_no_total') {
      grandTotalEl.textContent = 'Toplamsız (Sadece Kalemler)';
      grandTotalEl.style.fontSize = '0.9rem';
    } else {
      grandTotalEl.textContent = grandTotal.toLocaleString('tr-TR', {minimumFractionDigits:2,maximumFractionDigits:2}) + ' ₺';
      grandTotalEl.style.fontSize = '';
    }
  }
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
  const customTitle   = propMode === 'contract' ? (document.getElementById('propCustomTitle')?.value || '').trim() : '';
  const cornerNote    = propMode === 'contract' ? (document.getElementById('propCornerNote')?.value || '').trim() : '';
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

  const propType = propMode === 'contract' ? 'itemized_no_total' : (document.getElementById('propType')?.value || 'standard');
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
    customTitle,
    cornerNote,
    footnoteType,
    proposalType: propType,
    docMode: propMode,
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
    .finally(() => { btn.textContent = propSaveLabel(); btn.disabled = false; });
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
    .finally(() => { btn.textContent = propSaveLabel(); btn.disabled = false; });
  }
}

/* ── EDIT MODE ── */
function enterEditMode(id) {
  if (typeof switchTab === 'function') switchTab('teklif');
  const prop = (allProposals || []).find(p => String(p.id) === String(id));
  if (!prop) { showToast('Teklif bulunamadı!', 'error'); return; }

  editingProposalId = id;
  applyPropMode(prop.docMode === 'contract' ? 'contract' : 'offer');
  proposalPage = 1;
  renderProposalsList();

  // Scroll to form
  document.getElementById('proposalForm').scrollIntoView({ behavior: 'smooth', block: 'start' });

  // Show edit banner
  const editBanner = document.getElementById('editModeBanner');
  if (editBanner) { editBanner.style.display = 'flex'; editBanner.querySelector('.edit-banner-company').textContent = prop.company; }

  // Show cancel button
  const cancelBtn = document.getElementById('cancelEditBtn');
  if (cancelBtn) cancelBtn.style.display = 'inline-flex';

  const btn = document.getElementById('saveProposalBtn');
  if (btn) btn.textContent = propMode === 'contract' ? '✏️ Sözleşmeyi Güncelle ve PDF İndir' : '✏️ Teklifi Güncelle ve PDF İndir';

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
  setVal('propCustomTitle',   prop.customTitle);
  setVal('propCornerNote',    prop.cornerNote);

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

/* ── YİNELE: eski teklifi başka kurum için yeni teklif olarak kopyala ── */
function duplicateProposal(id) {
  enterEditMode(id);
  // Düzenleme değil, yeni kayıt olacak
  editingProposalId = null;
  const banner = document.getElementById('editModeBanner');
  if (banner) banner.style.display = 'none';
  const cancelBtn = document.getElementById('cancelEditBtn');
  if (cancelBtn) cancelBtn.style.display = 'none';
  const btn = document.getElementById('saveProposalBtn');
  if (btn) { btn.textContent = propSaveLabel(); btn.disabled = false; }

  // Kuruma özel alanları temizle, tarihi güncelle
  const compSel = document.getElementById('propCompany');
  if (compSel) compSel.value = '';
  const custom = document.getElementById('propCompanyCustom');
  if (custom) { custom.classList.add('hidden'); custom.value = ''; }
  const contact = document.getElementById('propContactPerson');
  if (contact) contact.value = '';
  const dateInput = document.getElementById('propDate');
  if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];

  showToast('Teklif kopyalandı. Şimdi yeni kurumu seçip kaydet.', 'success');
  if (compSel) compSel.focus();
}
window.duplicateProposal = duplicateProposal;

/* ── TEKLİF DURUMU & TAKİP HATIRLATMASI ── */
const PROP_STATUSES = ['Gönderildi', 'Kabul Edildi', 'Reddedildi', 'Beklemede'];
const PROP_STATUS_COLORS = { 'Gönderildi': '#457b9d', 'Kabul Edildi': '#16a34a', 'Reddedildi': '#e63946', 'Beklemede': '#f59e0b' };

function propFollowUpInfo(p) {
  if ((p.docMode || 'offer') === 'contract') return null;
  if ((p.status || 'Gönderildi') !== 'Gönderildi') return null;
  const base = new Date(p.date || p.createdAt);
  if (isNaN(base)) return null;
  const days = Math.floor((Date.now() - base.getTime()) / 86400000);
  const validity = parseInt(p.validity, 10) || 30;
  if (days > validity) return { text: '⏰ Süresi doldu (' + days + ' gün)', color: '#e63946' };
  if (days >= 7) return { text: '🔔 Takip et (' + days + ' gün)', color: '#f59e0b' };
  return null;
}

function propStatusCell(p, editable) {
  if ((p.docMode || 'offer') === 'contract') return '<span style="color:var(--ink3)">—</span>';
  const st = p.status || 'Gönderildi';
  const color = PROP_STATUS_COLORS[st] || '#94a3b8';
  const fu = propFollowUpInfo(p);
  const ctl = editable
    ? `<select class="modal-select" onclick="event.stopPropagation()" onchange="setProposalStatus('${p.id}', this.value)" style="width:auto; margin:0; height:30px; font-size:0.75rem; padding:0 0.4rem; color:${color}; font-weight:700;">${PROP_STATUSES.map(s => `<option ${s === st ? 'selected' : ''}>${s}</option>`).join('')}</select>`
    : `<span style="font-size:0.75rem; font-weight:700; color:${color};">${st}</span>`;
  return ctl + (fu ? `<div style="font-size:0.68rem; font-weight:700; color:${fu.color}; margin-top:0.25rem; white-space:nowrap;">${fu.text}</div>` : '');
}

function setProposalStatus(id, status) {
  db.collection('proposals').doc(id).update({ status, statusUpdatedAt: new Date().toISOString() })
    .then(() => showToast('Durum güncellendi: ' + status, 'success'))
    .catch(e => showToast('Hata: ' + e.message, 'error'));
}
window.setProposalStatus = setProposalStatus;

function renderFollowUpBanner() {
  const el = document.getElementById('propFollowUpBanner');
  if (!el) return;
  const due = (allProposals || []).filter(p => propFollowUpInfo(p));
  if (propMode === 'contract' || !due.length) { el.style.display = 'none'; return; }
  const expired = due.filter(p => propFollowUpInfo(p).color === '#e63946').length;
  el.style.display = 'block';
  el.innerHTML = `🔔 <strong>${due.length}</strong> teklif cevap bekliyor${expired ? ` (<strong>${expired}</strong> tanesinin geçerlilik süresi doldu)` : ''}. Durumunu güncelle veya müşteriyi ara.`;
}

function cancelEditMode() {
  editingProposalId = null;
  const btn = document.getElementById('saveProposalBtn');
  if (btn) { btn.textContent = propSaveLabel(); btn.disabled = false; }
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

  // Check proposal type
  const isContract = data.docMode === 'contract';
  const isPackage = data.proposalType === 'package';
  const isItemizedNoTotal = data.proposalType === 'itemized_no_total';

  let tableHtml = '';

  if (isPackage) {
    // Flexbox package layout to fix html2canvas rowspan rendering bug
    const rowsHtml = data.items.map((item, idx) => `
      <div style="display:flex; border-bottom:${idx===data.items.length-1?'none':'1px solid #cbd5e1'}; background:${idx%2===0?'#ffffff':'#f8fafc'}; padding:12px 10px; align-items:center; min-height:45px; box-sizing:border-box;">
        <div style="flex:1; font-weight:600; text-align:left; font-size:13px; color:#0f172a; padding-right:10px;">
          <strong>${item.name}</strong>
          ${item.desc ? `<br><span style="color:#64748b; font-size:11px; font-weight:normal; display:block; margin-top:3px; line-height:1.5">${formatPropDesc(item.desc)}</span>` : ''}
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
        <td style="padding:10px 8px; color:#64748b; vertical-align:top; font-size:12px; line-height:1.5">${formatPropDesc(item.desc) || '—'}</td>
        <td style="padding:10px 8px; text-align:center; vertical-align:top">${item.qty}</td>
        <td style="padding:10px 8px; text-align:right; vertical-align:top">${Number(item.price).toLocaleString('tr-TR',{minimumFractionDigits:2,maximumFractionDigits:2})} ₺</td>
        <td style="padding:10px 8px; text-align:right; vertical-align:top; font-weight:700">${Number(item.total).toLocaleString('tr-TR',{minimumFractionDigits:2,maximumFractionDigits:2})} ₺</td>
      </tr>
    `).join('');

    const grandTotalRowHtml = isItemizedNoTotal ? '' : `
      <tr>
        <td colspan="3" style="border:none"></td>
        <td style="padding:12px 8px; text-align:right; font-weight:800; color:#ffffff; background:#0d1f61; font-size:14px; border-top:2px solid #cbd5e1">Genel Toplam:</td>
        <td style="padding:12px 8px; text-align:right; font-weight:800; color:#ffffff; background:#f24f00; font-size:14px; border-top:2px solid #cbd5e1">${Number(data.grandTotal).toLocaleString('tr-TR',{minimumFractionDigits:2,maximumFractionDigits:2})} ₺</td>
      </tr>
    `;

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
          ${grandTotalRowHtml}
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
          ${data.cornerNote ? `<div style="display:inline-block; margin-bottom:8px; padding:4px 12px; border:2px solid #e63946; color:#e63946; border-radius:6px; font-size:12px; font-weight:900; letter-spacing:1.5px; text-transform:uppercase;">${propEscape(data.cornerNote)}</div>` : ''}
          ${isContract ? '' : `<div style="font-size:28px; font-weight:900; color:#0d1f61; letter-spacing:-0.5px; text-transform:uppercase">Fiyat Teklifi</div>
          <div style="margin-top:10px; font-size:12px; color:#475569; line-height:1.8">
            <strong>Teklif Tarihi:</strong> ${formattedDate}<br>
            <strong>Geçerlilik:</strong> ${data.validity}<br>
            <strong>Teklif No:</strong> <span style="font-family:monospace; font-weight:700; color:#0d1f61">${teklif_no}</span>
          </div>`}
        </div>
      </div>

      ${data.customTitle ? `
        <div style="text-align:center; margin:-8px 0 26px; font-size:18px; font-weight:900; color:#0d1f61; text-transform:uppercase; letter-spacing:0.5px; line-height:1.4;">${propRichText(data.customTitle)}</div>
      ` : ''}

      <!-- CLIENT & PREPARER -->
      <div style="display:flex; gap:0; background:#f8fafc; border-radius:12px; border:1px solid #e2e8f0; overflow:hidden; margin-bottom:30px;">
        <div style="flex:1; padding:18px 20px;">
          <div style="font-size:10px; text-transform:uppercase; font-weight:700; color:#64748b; margin-bottom:8px; letter-spacing:0.8px">Sayın</div>
          <div style="font-size:16px; font-weight:800; color:#0f172a; margin-bottom:4px">${data.company}</div>
          ${data.contactPerson ? `<div style="font-size:13px; color:#475569">Yetkili: <strong>${data.contactPerson}</strong></div>` : ''}
        </div>
        ${isContract ? '' : `<div style="width:1px; background:#e2e8f0"></div>
        <div style="width:220px; padding:18px 20px; text-align:right">
          <div style="font-size:10px; text-transform:uppercase; font-weight:700; color:#64748b; margin-bottom:8px; letter-spacing:0.8px">Teklifi Hazırlayan</div>
          <div style="font-size:14px; font-weight:700; color:#0f172a">${data.memberName}</div>
          <div style="font-size:11px; color:#f24f00; font-weight:600; margin-top:2px">${data.memberTitle || 'Satış Temsilcisi'}</div>
          <div style="font-size:10px; color:#94a3b8; margin-top:1px">İdeal Data</div>
        </div>`}
      </div>

      <!-- ITEMS TABLE -->
      ${tableHtml}

      ${data.notes ? `
        <div style="border-top:1px solid #e2e8f0; padding-top:18px; margin-bottom:24px">
          <div style="font-size:10px; text-transform:uppercase; font-weight:700; color:#64748b; margin-bottom:8px; letter-spacing:0.8px">Özel Şartlar ve Ek Notlar</div>
          <div style="font-size:12px; color:#334155; background:#fafafa; border-radius:8px; padding:12px 16px; white-space:pre-wrap; line-height:1.6; border-left:3px solid #f24f00">${propRichText(data.notes)}</div>
        </div>
      ` : ''}

      ${isContract ? '' : `<!-- FOOTNOTES -->
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
      </div>`}
    </div>
  `;

  // Create wrapper
  const wrapper = document.createElement('div');
  wrapper.style.cssText = 'position:absolute; left:-9999px; top:0; background:#fff';
  wrapper.innerHTML = html;
  document.body.appendChild(wrapper);

  const target = wrapper.firstElementChild;
  const filename = `${isContract ? 'Sozlesme' : 'Teklif'}_${data.company.replace(/[^a-zA-Z0-9ığüşöçİĞÜŞÖÇ\s]/g,'').replace(/\s+/g,'_')}_${data.date}.pdf`;

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

/* ── POPULATE FILTERS ── */
function populateProposalFilters() {
  const compSel = document.getElementById('propFilterCompany');
  const memSel = document.getElementById('propFilterMember');

  if (compSel) {
    const currentVal = compSel.value || 'all';
    const companies = [...new Set((allProposals || []).map(p => p.company).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'tr'));
    compSel.innerHTML = '<option value="all">🏢 Tüm Kurumlar</option>' +
      companies.map(c => `<option value="${c}">${c}</option>`).join('');
    compSel.value = companies.includes(currentVal) ? currentVal : 'all';
  }

  if (memSel && memSel.options.length <= 1) {
    memSel.innerHTML = '<option value="all">👤 Tüm Temsilciler</option>' +
      '<option value="admin">Hüseyin Kubur</option>' +
      TEAM_DEF.filter(m => m.dept === 'Satış').map(m => `<option value="${m.id}">${m.name}</option>`).join('');
  }
}

function clearProposalFilters() {
  const searchInput = document.getElementById('propSearchInput');
  const compSel = document.getElementById('propFilterCompany');
  const memSel = document.getElementById('propFilterMember');
  const typeSel = document.getElementById('propFilterType');

  if (searchInput) searchInput.value = '';
  if (compSel) compSel.value = 'all';
  if (memSel) memSel.value = 'all';
  if (typeSel) typeSel.value = 'all';

  proposalPage = 1;
  renderProposalsList();
}
window.clearProposalFilters = clearProposalFilters;

/* ── RENDER LIST ── */
function renderProposalsList() {
  renderFollowUpBanner();
  populateProposalFilters();

  const container = document.getElementById('proposalsHistoryList');
  const paginationContainer = document.getElementById('proposalPagination');
  if (!container) return;

  if (!allProposals.length) {
    container.innerHTML = '<tr><td colspan="8" class="crm-empty">Henüz kayıt bulunmuyor. 📭</td></tr>';
    if (paginationContainer) paginationContainer.innerHTML = '';
    return;
  }

  const searchInput = document.getElementById('propSearchInput')?.value.trim().toLowerCase() || '';
  const filterCompany = document.getElementById('propFilterCompany')?.value || 'all';
  const filterMember = document.getElementById('propFilterMember')?.value || 'all';
  const filterType = document.getElementById('propFilterType')?.value || 'all';

  const filteredProposals = allProposals.filter(p => {
    if ((p.docMode || 'offer') !== propMode) return false;
    if (filterCompany !== 'all' && p.company !== filterCompany) return false;
    if (filterMember !== 'all' && p.memberId !== filterMember) return false;
    if (filterType !== 'all' && (p.proposalType || 'standard') !== filterType) return false;

    if (searchInput) {
      const teklif_no = `ID-${p.createdAt?.substring(2,4)}${p.createdAt?.substring(5,7)}${p.createdAt?.substring(8,10)}-${p.id ? p.id.substring(0,5).toUpperCase() : 'TEMP'}`.toLowerCase();
      const comp = (p.company || '').toLowerCase();
      const contact = (p.contactPerson || '').toLowerCase();
      const prep = (p.memberName || '').toLowerCase();
      const itemsText = (p.items || []).map(i => `${i.name || ''} ${i.desc || ''}`).join(' ').toLowerCase();

      const match = comp.includes(searchInput) ||
                    contact.includes(searchInput) ||
                    teklif_no.includes(searchInput) ||
                    prep.includes(searchInput) ||
                    itemsText.includes(searchInput);
      if (!match) return false;
    }

    return true;
  });

  if (!filteredProposals.length) {
    container.innerHTML = '<tr><td colspan="8" class="crm-empty" style="padding:2rem; text-align:center; color:var(--ink3)">🔍 Aradığınız kriterlere uygun kayıt bulunamadı.</td></tr>';
    if (paginationContainer) paginationContainer.innerHTML = '';
    return;
  }

  // Pagination bounds checking
  const maxPage = Math.ceil(filteredProposals.length / proposalPageSize);
  if (proposalPage > maxPage) {
    proposalPage = maxPage || 1;
  }
  if (proposalPage < 1) {
    proposalPage = 1;
  }

  const startIndex = (proposalPage - 1) * proposalPageSize;
  const endIndex = startIndex + proposalPageSize;
  const paginatedProposals = filteredProposals.slice(startIndex, endIndex);

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
    const copyBtn = canEdit(p)
      ? `<button class="crm-action-btn" data-prop-id="${p.id}" title="Bu teklifi yeni bir kurum için kopyala" style="background:var(--surface); border:1px solid var(--border); color:var(--ink2); padding:0.3rem 0.6rem; border-radius:6px; font-size:0.75rem; cursor:pointer; margin-right:4px" onclick="event.stopPropagation(); duplicateProposal(this.getAttribute('data-prop-id'))">📋 Yinele</button>`
      : '';
    const priceDisplay = p.proposalType === 'itemized_no_total'
      ? `${Number(p.grandTotal).toLocaleString('tr-TR',{minimumFractionDigits:2,maximumFractionDigits:2})} ₺ <span style="font-size:0.65rem; font-weight:600; color:var(--ink3); display:block;">(Kalem Bazlı / Toplamsız)</span>`
      : `${Number(p.grandTotal).toLocaleString('tr-TR',{minimumFractionDigits:2,maximumFractionDigits:2})} ₺`;
    return `
      <tr>
        <td style="font-weight:700; font-family:monospace; font-size:0.78rem">${teklif_no}</td>
        <td class="crm-company">${p.company}</td>
        <td>${p.contactPerson || '<span style="color:var(--ink3)">—</span>'}</td>
        <td>${fmtDate(p.date)}</td>
        <td style="font-weight:800; color:var(--green)">${priceDisplay}</td>
        <td>
          <div class="crm-person">
            <span class="crm-person-dot" style="background:${memberColor}"></span>
            ${p.memberName}
          </div>
        </td>
        <td>${propStatusCell(p, canEdit(p))}</td>
        <td style="text-align:right; white-space:nowrap">
          ${editBtn}${copyBtn}${delBtn}
          <button class="modal-save" style="padding:0.3rem 0.6rem; font-size:0.75rem" onclick="reDownloadProposal('${p.id}')">📥 PDF</button>
        </td>
      </tr>
    `;
  }).join('');

  // Render pagination controls
  if (paginationContainer) {
    const currentToShow = Math.min(endIndex, filteredProposals.length);
    paginationContainer.innerHTML = `
      <span>Toplam <strong>${filteredProposals.length}</strong> teklif arasından <strong>${startIndex + 1} - ${currentToShow}</strong> arası gösteriliyor.</span>
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
