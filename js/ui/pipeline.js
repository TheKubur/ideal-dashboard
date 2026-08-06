// ====== PIPELINE (SATIŞ HUNİSİ) LOGIC ======
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
  
  compSel.innerHTML = '<option value="">-- Kurum Seç --</option>' + 
                      allCompanies.map(c => `<option value="${c}">${c}</option>`).join('') +
                      '<option value="__yeni__" style="font-weight:bold;color:var(--accent)">+ Yeni Kurum Ekle...</option>';
                      
  const customInput = document.getElementById('dealCompanyCustom');
  if (customInput) {
    customInput.classList.add('hidden');
    customInput.value = '';
  }

  if (dealId) {
    const d = allDeals.find(x => x.id === dealId);
    if (d) {
      document.getElementById('dealModalTitle').textContent = 'Fırsatı Düzenle';
      document.getElementById('dealValue').value = d.value || '';
      document.getElementById('dealDesc').value = d.desc || '';
      document.getElementById('dealStage').value = d.stage || 'Toplantı';
      document.getElementById('dealCompany').value = d.company || '';
    }
  } else {
    document.getElementById('dealModalTitle').textContent = 'Yeni Fırsat Ekle';
    document.getElementById('dealValue').value = '';
    document.getElementById('dealDesc').value = '';
    document.getElementById('dealStage').value = 'Toplantı';
    document.getElementById('dealCompany').value = '';
  }
  document.getElementById('dealDeleteBtn').style.display = dealId ? 'inline-block' : 'none';
  document.getElementById('dealModal').classList.remove('hidden');
}

function deleteDeal() {
  if (!editDealId) return;
  if (currentUser.role !== 'admin') return;
  if (!confirm('Bu fırsatı tamamen silmek istediğinize emin misiniz?')) return;

  db.collection('deals').doc(editDealId).delete()
    .then(() => {
      showToast('Fırsat silindi.', 'success');
      document.getElementById('dealModal').classList.add('hidden');
    })
    .catch(e => showToast('Hata: ' + e.message, 'error'));
}

function saveDeal() {
  let company = document.getElementById('dealCompany').value;
  if (company === '__yeni__') {
    company = document.getElementById('dealCompanyCustom').value.trim();
    if (!company) { showToast('Yeni kurum adını yazmalısın!', 'warning'); return; }
  }
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
        showToast('Fırsat Güncellendi!', 'success');
        document.getElementById('dealModal').classList.add('hidden');
      }).catch(e => showToast('Hata: ' + e.message, 'error'))
      .finally(() => { btn.textContent = 'Kaydet'; btn.disabled = false; });
  } else {
    db.collection('deals').add({
      company, stage, value, desc,
      memberId: m.id, memberName: m.name, memberInitials: m.initials, memberColor: m.deptColor,
      period: currentPeriod, createdAt: new Date().toISOString()
    }).then(() => {
      showToast('Fırsat Eklendi! 💰', 'success');
      document.getElementById('dealModal').classList.add('hidden');
    }).catch(e => showToast('Hata: ' + e.message, 'error'))
      .finally(() => { btn.textContent = 'Kaydet'; btn.disabled = false; });
  }
}

function renderPipeline() {
  const cols = {
    'Toplantı': { el: document.getElementById('pipe-cards-toplanti'), count: 0, val: 0 },
    'Teklif Gönderildi': { el: document.getElementById('pipe-cards-teklif'), count: 0, val: 0 },
    'Teklif Kabul Edildi': { el: document.getElementById('pipe-cards-kabul'), count: 0, val: 0 },
    'Sözleşme İmzalandı': { el: document.getElementById('pipe-cards-sozlesme'), count: 0, val: 0 },
    'Faturalandırıldı': { el: document.getElementById('pipe-cards-fatura'), count: 0, val: 0 }
  };
  Object.values(cols).forEach(c => { if (c.el) c.el.innerHTML = ''; });

  let list = allDeals;
  if (currentUser.role !== 'admin') {
    list = allDeals.filter(d => d.memberId === currentUser.memberId);
  }


    const grouped = {
      'Toplantı': [], 'Teklif Gönderildi': [], 'Teklif Kabul Edildi': [], 'Sözleşme İmzalandı': [], 'Faturalandırıldı': []
    };
    
    list.forEach(d => {
      const st = d.stage || 'Toplantı';
      if(grouped[st]) grouped[st].push(d);
      const colObj = cols[st] || cols['Toplantı'];
      colObj.count++;
      colObj.val += (d.value || 0);
    });

    ['Toplantı', 'Teklif Gönderildi', 'Teklif Kabul Edildi', 'Sözleşme İmzalandı', 'Faturalandırıldı'].forEach(st => {
      const colObj = cols[st];
      if (!colObj.el) return;
      
      const stKey = st === 'Toplantı' ? 'Toplantı' : st === 'Teklif Gönderildi' ? 'Teklif' : st === 'Teklif Kabul Edildi' ? 'Kabul' : st === 'Sözleşme İmzalandı' ? 'Sözleşme' : 'Fatura';
      const page = paginationState['pipe_' + stKey] || 1;
      const perPage = 5;
      const start = (page - 1) * perPage;
      const dList = grouped[st];
      const paged = dList.slice(start, start + perPage);

      paged.forEach(d => {
        const card = document.createElement('div');
        card.className = 'kanban-card kanban-glow-target';
        card.draggable = true;
        card.ondragstart = (e) => kbDragStart(e, 'deal_' + d.id);
        card.ondragend = kbDragEnd;
        card.onclick = () => openDealModal(d.id);
        card.style.cursor = 'pointer';

        let priceEl = d.stage === 'Toplantı' ? '—' : ((d.value || 0).toLocaleString('tr-TR') + ' ₺');

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
      
      if (dList.length > perPage) {
        renderPagination(colObj.el, 'pipe_' + stKey, dList.length, perPage);
      }
    });


  Object.entries(cols).forEach(([k, c]) => {
    let idKey = k === 'Toplantı' ? 'toplanti' : k === 'Teklif Gönderildi' ? 'teklif' : k === 'Teklif Kabul Edildi' ? 'kabul' : k === 'Sözleşme İmzalandı' ? 'sozlesme' : 'fatura';
    const cEl = document.getElementById('pipe-count-' + idKey);
    if (cEl) {
      cEl.innerHTML = `<span style="font-size:0.95rem;font-weight:800">${c.count}</span><br><span style="font-size:0.75rem;opacity:0.9">(${c.val.toLocaleString('tr-TR')} ₺)</span>`;
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
      .then(() => showToast(`Aşama atlandı: ${stage}`, 'success'))
      .catch(err => showToast('Hata: ' + err.message, 'error'));
  }
}

