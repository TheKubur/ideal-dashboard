/* ── YATIRIMCI İLİŞKİLERİ MODÜLÜ SATIŞ KAMPANYASI (MIN 10 KURUM) ── */

let allIRDeals = [];
let irDealsUnsub = null;

const IR_STAGES = [
  { id: '1_temas', name: '📞 1. İlk Temas', color: '#64748b', bg: '#f1f5f9' },
  { id: '2_demo', name: '🖥️ 2. Ürün Demosu', color: '#0284c7', bg: '#e0f2fe' },
  { id: '3_teklif', name: '📄 3. Teklif Verildi', color: '#d97706', bg: '#fef3c7' },
  { id: '4_sozlesme', name: '📝 4. Sözleşme & Pazarlık', color: '#7c3aed', bg: '#f3e8ff' },
  { id: '5_kazanildi', name: '✅ 5. Satış Kapandı (Kazanıldı)', color: '#059669', bg: '#dcfce7' }
];

function listenToIRCampaign() {
  if (typeof db === 'undefined') return;
  
  if (irDealsUnsub) irDealsUnsub();

  irDealsUnsub = db.collection('ir_campaign_deals').onSnapshot(snap => {
    allIRDeals = [];
    snap.forEach(doc => {
      allIRDeals.push({ id: doc.id, ...doc.data() });
    });
    renderIRCampaign();
  }, err => {
    console.error('IR Campaign listener hatası:', err);
  });
  
  if (typeof unsubscribeFns !== 'undefined') unsubscribeFns.push(irDealsUnsub);
}

function renderIRCampaign() {
  const container = document.getElementById('team-okr-area');
  if (!container) return;

  const salesTeam = TEAM_DEF.filter(m => m.dept === 'Satış');
  const targetPerMember = 10;
  const totalTeamTarget = salesTeam.length * targetPerMember;

  const wonDeals = allIRDeals.filter(d => d.stage === '5_kazanildi');
  const wonCount = wonDeals.length;
  const targetPct = Math.min(100, Math.round((wonCount / (totalTeamTarget || 10)) * 100));

  const totalWonRevenue = wonDeals.reduce((sum, d) => sum + (parseFloat(d.agreedPrice || d.listPrice) || 0), 0);
  const avgWonPrice = wonCount > 0 ? Math.round(totalWonRevenue / wonCount) : 0;
  
  const pipelineDeals = allIRDeals.filter(d => d.stage !== '5_kazanildi' && d.stage !== 'kaybedildi');
  const pipelineVolume = pipelineDeals.reduce((sum, d) => sum + (parseFloat(d.agreedPrice || d.listPrice) || 0), 0);

  const isAdmin = (typeof currentUser !== 'undefined' && currentUser && currentUser.role === 'admin');

  container.innerHTML = `
    <!-- KAMPANYA ÜST BANNER -->
    <div style="background:linear-gradient(135deg, #0d1f61 0%, #1e3a8a 100%); border-radius:16px; padding:1.75rem; color:#ffffff; margin-bottom:2rem; box-shadow:0 10px 25px rgba(13,31,97,0.25);">
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem; margin-bottom:1.25rem;">
        <div>
          <h2 style="font-size:1.6rem; font-weight:900; margin:0; color:#ffffff; letter-spacing:-0.02em;">Yatırımcı İlişkileri Modül Satışı</h2>
        </div>
        <button onclick="openIRDealModal()" style="background:#f24f00; color:#ffffff; border:none; padding:0.75rem 1.4rem; border-radius:12px; font-weight:800; font-size:0.9rem; cursor:pointer; display:inline-flex; align-items:center; gap:8px; box-shadow:0 4px 15px rgba(242,79,0,0.4); transition:all 0.2s;">
          <span>➕ Yeni Kurum / Fırsat Ekle</span>
        </button>
      </div>

      <!-- PROGRESS BAR -->
      <div style="background:rgba(255,255,255,0.12); border-radius:12px; padding:1.25rem; border:1px solid rgba(255,255,255,0.15); margin-bottom:1.25rem;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.6rem;">
          <span style="font-size:0.85rem; font-weight:700; color:#e2e8f0;">EKİP SATIŞ KAZANIM İLERLEMESİ</span>
          <span style="font-size:1.1rem; font-weight:900; color:#10b981;">${wonCount} / ${totalTeamTarget} KURUM KAZANILDI (%${targetPct})</span>
        </div>
        <div style="width:100%; height:14px; background:rgba(255,255,255,0.15); border-radius:10px; overflow:hidden; position:relative;">
          <div style="width:${targetPct}%; height:100%; background:linear-gradient(90deg, #10b981 0%, #34d399 100%); border-radius:10px; transition:width 0.6s ease-in-out;"></div>
        </div>
      </div>

      <!-- METRİK KARTLARI (BANNER İÇİ) -->
      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:1rem;">
        <div style="background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.15); border-radius:12px; padding:1rem;">
          <div style="font-size:0.7rem; text-transform:uppercase; color:#94a3b8; font-weight:700; letter-spacing:0.05em;">Toplam Kazanılan Ciro</div>
          <div style="font-size:1.35rem; font-weight:900; color:#10b981; margin-top:4px;">${totalWonRevenue.toLocaleString('tr-TR')} ₺</div>
        </div>
        <div style="background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.15); border-radius:12px; padding:1rem;">
          <div style="font-size:0.7rem; text-transform:uppercase; color:#94a3b8; font-weight:700; letter-spacing:0.05em;">Ortalama Kurum Satış Fiyatı</div>
          <div style="font-size:1.35rem; font-weight:900; color:#38bdf8; margin-top:4px;">${avgWonPrice.toLocaleString('tr-TR')} ₺</div>
        </div>
        <div style="background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.15); border-radius:12px; padding:1rem;">
          <div style="font-size:0.7rem; text-transform:uppercase; color:#94a3b8; font-weight:700; letter-spacing:0.05em;">Aktif Pipeline Hacmi</div>
          <div style="font-size:1.35rem; font-weight:900; color:#c084fc; margin-top:4px;">${pipelineVolume.toLocaleString('tr-TR')} ₺</div>
        </div>
        <div style="background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.15); border-radius:12px; padding:1rem;">
          <div style="font-size:0.7rem; text-transform:uppercase; color:#94a3b8; font-weight:700; letter-spacing:0.05em;">Görüşülen Aday Kurumlar</div>
          <div style="font-size:1.35rem; font-weight:900; color:#ffedd5; margin-top:4px;">${allIRDeals.length} Kurum</div>
        </div>
      </div>
    </div>

    <!-- SÜREÇ ETAPLARI (STAGES PIPELINE GRID) -->
    <div style="margin-bottom:2rem;">
      <div style="font-family:'Bebas Neue',sans-serif; font-size:1.3rem; letter-spacing:0.08em; color:var(--ink); margin-bottom:1rem; display:flex; align-items:center; gap:8px;">
        <span>📊 Satış Hunisi (Pipeline Stages)</span>
      </div>
      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(210px, 1fr)); gap:1rem;">
        ${IR_STAGES.map(stage => {
          const stageDeals = allIRDeals.filter(d => d.stage === stage.id);
          const stageVol = stageDeals.reduce((sum, d) => sum + (parseFloat(d.agreedPrice || d.listPrice) || 0), 0);
          return `
            <div style="background:var(--surface); border:1px solid var(--border); border-top:4px solid ${stage.color}; border-radius:12px; padding:1rem; box-shadow:0 2px 8px rgba(0,0,0,0.04);">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                <span style="font-size:0.85rem; font-weight:800; color:${stage.color};">${stage.name}</span>
                <span style="background:${stage.bg}; color:${stage.color}; font-size:0.75rem; font-weight:800; padding:2px 8px; border-radius:10px;">${stageDeals.length}</span>
              </div>
              <div style="font-size:1.1rem; font-weight:900; color:var(--ink);">${stageVol.toLocaleString('tr-TR')} ₺</div>
            </div>
          `;
        }).join('')}
      </div>
    </div>

    <!-- KURUM BAZLI DETAYLI SATIŞ VE FİYATLANDIRMA LİSTESİ -->
    <div style="background:var(--surface); border-radius:16px; border:1px solid var(--border); padding:1.5rem; box-shadow:var(--shadow); margin-bottom:2rem;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.25rem; flex-wrap:wrap; gap:1rem;">
        <div>
          <div style="font-family:'Bebas Neue',sans-serif; font-size:1.3rem; letter-spacing:0.08em; color:var(--ink);">💼 Kurum Bazlı Satış & Fiyatlandırma Kontrol Tablosu</div>
          <div style="font-size:0.8rem; color:var(--ink2);">Yatırımcı İlişkileri Modülü teklif verilen ve satışı tamamlanan tüm kurumların listesi</div>
        </div>
      </div>

      <div class="crm-table-wrap">
        <table class="crm-table">
          <thead>
            <tr>
              <th>Kurum Adı</th>
              <th>Temsilci</th>
              <th>Liste Fiyatı</th>
              <th>Anlaşılan / Teklif Fiyatı</th>
              <th>İskonto</th>
              <th>Ödeme Tipi</th>
              <th>Mevcut Etap</th>
              <th style="text-align:right;">İşlem</th>
            </tr>
          </thead>
          <tbody>
            ${allIRDeals.length ? allIRDeals.map(d => {
              const listP = parseFloat(d.listPrice) || 0;
              const agreedP = parseFloat(d.agreedPrice) || listP;
              const discountPct = listP > 0 && agreedP < listP ? Math.round(((listP - agreedP) / listP) * 100) : 0;
              const stg = IR_STAGES.find(s => s.id === d.stage) || IR_STAGES[0];
              const m = TEAM_DEF.find(x => x.id === d.memberId) || { name: d.memberName || '—' };

              return `
                <tr>
                  <td style="font-weight:800; color:var(--ink);">
                    <div>${d.companyName}</div>
                    <div style="font-size:0.75rem; color:var(--ink2); font-weight:500;">${d.notes || 'Not yok'}</div>
                  </td>
                  <td style="font-weight:700;">${m.name}</td>
                  <td style="color:var(--ink2); font-size:0.85rem;">${listP ? listP.toLocaleString('tr-TR') + ' ₺' : '—'}</td>
                  <td style="font-weight:800; color:#059669; font-size:0.95rem;">${agreedP ? agreedP.toLocaleString('tr-TR') + ' ₺' : '—'}</td>
                  <td>
                    ${discountPct > 0 ? `<span style="background:#fee2e2; color:#dc2626; padding:2px 8px; border-radius:10px; font-size:0.75rem; font-weight:800;">%${discountPct} İskonto</span>` : '<span style="color:#64748b; font-size:0.75rem;">Standart</span>'}
                  </td>
                  <td style="font-size:0.8rem; font-weight:600;">${d.paymentType || 'Yıllık Abonelik'}</td>
                  <td>
                    <select onchange="updateIRDealStage('${d.id}', this.value)" style="padding:4px 10px; border-radius:8px; border:1px solid var(--border); background:${stg.bg}; color:${stg.color}; font-weight:800; font-size:0.8rem; cursor:pointer;">
                      ${IR_STAGES.map(s => `<option value="${s.id}" ${s.id === d.stage ? 'selected' : ''}>${s.name}</option>`).join('')}
                    </select>
                  </td>
                  <td style="text-align:right;">
                    <button onclick="openIRDealModal('${d.id}')" style="background:var(--bg); border:1px solid var(--border); padding:4px 8px; border-radius:6px; font-size:0.75rem; cursor:pointer; margin-right:4px;">✏️ Düzenle</button>
                    ${isAdmin ? `<button onclick="deleteIRDeal('${d.id}')" style="background:#fee2e2; color:#dc2626; border:none; padding:4px 8px; border-radius:6px; font-size:0.75rem; cursor:pointer;">🗑️ Sil</button>` : ''}
                  </td>
                </tr>
              `;
            }).join('') : `
              <tr>
                <td colspan="8" style="text-align:center; padding:2rem; color:var(--ink2);">
                  Henüz kaydedilmiş yatırımcı ilişkileri modülü satış fırsatı bulunmuyor.<br/>
                  <button onclick="openIRDealModal()" style="margin-top:0.75rem; background:#f24f00; color:#fff; border:none; padding:0.5rem 1rem; border-radius:8px; font-weight:700; cursor:pointer;">➕ İlk Kurumu Ekle</button>
                </td>
              </tr>
            `}
          </tbody>
        </table>
      </div>
    </div>

    <!-- EKİP KOTASI VE PERFORMANS KARNESİ -->
    <div style="background:var(--surface); border-radius:16px; border:1px solid var(--border); padding:1.5rem; box-shadow:var(--shadow);">
      <div style="font-family:'Bebas Neue',sans-serif; font-size:1.3rem; letter-spacing:0.08em; color:var(--ink); margin-bottom:1rem;">👥 Temsilci Başı 10 Kurum Satış Kota Karnesi</div>
      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(240px, 1fr)); gap:1rem;">
        ${TEAM_DEF.filter(m => m.dept === 'Satış').map(m => {
          const mDeals = allIRDeals.filter(d => d.memberId === m.id);
          const mWon = mDeals.filter(d => d.stage === '5_kazanildi');
          const mWonCount = mWon.length;
          const mPct = Math.min(100, Math.round((mWonCount / 10) * 100));
          const mWonVol = mWon.reduce((sum, d) => sum + (parseFloat(d.agreedPrice || d.listPrice) || 0), 0);

          return `
            <div style="background:var(--bg); border:1px solid var(--border); border-radius:12px; padding:1.1rem;">
              <div style="display:flex; align-items:center; gap:10px; margin-bottom:10px;">
                <div style="width:40px; height:40px; border-radius:50%; background:${m.avatarBg}; color:${m.deptColor}; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:0.9rem;">${m.initials}</div>
                <div style="flex:1;">
                  <div style="font-weight:800; color:var(--ink); font-size:0.95rem;">${m.name}</div>
                  <div style="font-size:0.75rem; color:var(--ink2);">${m.dept}</div>
                </div>
                <div style="text-align:right;">
                  <span style="font-size:0.85rem; font-weight:900; color:${mWonCount >= 10 ? '#059669' : 'var(--accent)'};">%${mPct}</span>
                </div>
              </div>

              <!-- BİREYSEL PROGRESS BAR -->
              <div style="margin-bottom:10px;">
                <div style="display:flex; justify-content:space-between; font-size:0.75rem; font-weight:700; color:var(--ink2); margin-bottom:4px;">
                  <span>Kişisel Kota: 10 Kurum</span>
                  <span style="color:#059669; font-weight:800;">${mWonCount} / 10 Kurum</span>
                </div>
                <div style="width:100%; height:8px; background:var(--border); border-radius:6px; overflow:hidden;">
                  <div style="width:${mPct}%; height:100%; background:${mWonCount >= 10 ? '#10b981' : 'var(--accent)'}; border-radius:6px; transition:width 0.5s;"></div>
                </div>
              </div>

              <div style="display:flex; justify-content:space-between; font-size:0.8rem; padding-top:8px; border-top:1px dashed var(--border);">
                <span style="color:var(--ink2);">Kazanılan Toplam Ciro:</span>
                <strong style="color:var(--ink); font-weight:800;">${mWonVol.toLocaleString('tr-TR')} ₺</strong>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

/* ── MODAL AKSİYONLARI ── */

function openIRDealModal(dealId = null) {
  const existing = dealId ? allIRDeals.find(d => d.id === dealId) : null;

  const modalHtml = `
    <div id="irDealModal" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); display:flex; align-items:center; justify-content:center; z-index:9999; backdrop-filter:blur(4px);">
      <div style="background:var(--surface); border:1px solid var(--border); border-radius:16px; padding:2rem; width:100%; max-width:540px; box-shadow:var(--shadow);">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem; border-bottom:1px solid var(--border); padding-bottom:0.75rem;">
          <h3 style="margin:0; font-size:1.2rem; color:var(--ink); font-weight:800;">${existing ? '✏️ Kurum / Satış Fırsatını Düzenle' : '➕ Yeni IR Modülü Satış Fırsatı Ekle'}</h3>
          <button onclick="closeIRDealModal()" style="background:none; border:none; font-size:1.5rem; cursor:pointer; color:var(--ink2);">&times;</button>
        </div>

        <form id="irDealForm" onsubmit="saveIRDeal(event, '${dealId || ''}')">
          <div style="margin-bottom:1rem;">
            <label style="display:block; font-size:0.8rem; font-weight:700; color:var(--ink); margin-bottom:0.3rem;">Kurum / Şirket Adı *</label>
            <input type="text" id="irCompanyName" required value="${existing ? (existing.companyName || '') : ''}" placeholder="Örn: ABC Holding A.Ş." style="width:100%; padding:0.6rem; border-radius:8px; border:1px solid var(--border); background:var(--bg); color:var(--ink); box-sizing:border-box;" />
          </div>

          <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem; margin-bottom:1rem;">
            <div>
              <label style="display:block; font-size:0.8rem; font-weight:700; color:var(--ink); margin-bottom:0.3rem;">Sorumlu Temsilci</label>
              <select id="irMemberId" style="width:100%; padding:0.6rem; border-radius:8px; border:1px solid var(--border); background:var(--bg); color:var(--ink); box-sizing:border-box;">
                ${TEAM_DEF.filter(m => m.dept === 'Satış').map(m => `<option value="${m.id}" ${existing && existing.memberId === m.id ? 'selected' : ''}>${m.name} (${m.dept})</option>`).join('')}
              </select>
            </div>
            <div>
              <label style="display:block; font-size:0.8rem; font-weight:700; color:var(--ink); margin-bottom:0.3rem;">Mevcut Satış Etabı</label>
              <select id="irStage" style="width:100%; padding:0.6rem; border-radius:8px; border:1px solid var(--border); background:var(--bg); color:var(--ink); box-sizing:border-box;">
                ${IR_STAGES.map(s => `<option value="${s.id}" ${existing && existing.stage === s.id ? 'selected' : ''}>${s.name}</option>`).join('')}
              </select>
            </div>
          </div>

          <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem; margin-bottom:1rem;">
            <div>
              <label style="display:block; font-size:0.8rem; font-weight:700; color:var(--ink); margin-bottom:0.3rem;">Liste / Paket Fiyatı (₺)</label>
              <input type="number" id="irListPrice" value="${existing ? (existing.listPrice || '') : '250000'}" placeholder="Örn: 250000" style="width:100%; padding:0.6rem; border-radius:8px; border:1px solid var(--border); background:var(--bg); color:var(--ink); box-sizing:border-box;" />
            </div>
            <div>
              <label style="display:block; font-size:0.8rem; font-weight:700; color:var(--ink); margin-bottom:0.3rem;">Anlaşılan / Teklif Fiyatı (₺)</label>
              <input type="number" id="irAgreedPrice" value="${existing ? (existing.agreedPrice || '') : '250000'}" placeholder="Örn: 250000" style="width:100%; padding:0.6rem; border-radius:8px; border:1px solid var(--border); background:var(--bg); color:var(--ink); box-sizing:border-box;" />
            </div>
          </div>

          <div style="margin-bottom:1rem;">
            <label style="display:block; font-size:0.8rem; font-weight:700; color:var(--ink); margin-bottom:0.3rem;">Ödeme Modeli</label>
            <select id="irPaymentType" style="width:100%; padding:0.6rem; border-radius:8px; border:1px solid var(--border); background:var(--bg); color:var(--ink); box-sizing:border-box;">
              <option value="Yıllık Abonelik" ${existing && existing.paymentType === 'Yıllık Abonelik' ? 'selected' : ''}>Yıllık Abonelik</option>
              <option value="Tek Seferlik Lisans" ${existing && existing.paymentType === 'Tek Seferlik Lisans' ? 'selected' : ''}>Tek Seferlik Lisans</option>
              <option value="Aylık Düzenli" ${existing && existing.paymentType === 'Aylık Düzenli' ? 'selected' : ''}>Aylık Düzenli</option>
            </select>
          </div>

          <div style="margin-bottom:1.5rem;">
            <label style="display:block; font-size:0.8rem; font-weight:700; color:var(--ink); margin-bottom:0.3rem;">Görüşme Notları / Detaylar</label>
            <textarea id="irNotes" rows="3" placeholder="Örn: Kurum IT yöneticisi ile görüşüldü, fiyat teklifi onay bekliyor..." style="width:100%; padding:0.6rem; border-radius:8px; border:1px solid var(--border); background:var(--bg); color:var(--ink); box-sizing:border-box;">${existing ? (existing.notes || '') : ''}</textarea>
          </div>

          <div style="display:flex; justify-content:flex-end; gap:0.75rem;">
            <button type="button" onclick="closeIRDealModal()" style="padding:0.6rem 1.2rem; border-radius:8px; border:1px solid var(--border); background:var(--bg); color:var(--ink); font-weight:700; cursor:pointer;">İptal</button>
            <button type="submit" style="padding:0.6rem 1.4rem; border-radius:8px; border:none; background:#f24f00; color:#fff; font-weight:800; cursor:pointer;">💾 Kaydet</button>
          </div>
        </form>
      </div>
    </div>
  `;

  const modalContainer = document.createElement('div');
  modalContainer.id = 'irModalWrapper';
  modalContainer.innerHTML = modalHtml;
  document.body.appendChild(modalContainer);
}

function closeIRDealModal() {
  const wrap = document.getElementById('irModalWrapper');
  if (wrap) wrap.remove();
}

function saveIRDeal(e, dealId) {
  e.preventDefault();
  
  const companyName = document.getElementById('irCompanyName').value.trim();
  const memberId = document.getElementById('irMemberId').value;
  const stage = document.getElementById('irStage').value;
  const listPrice = parseFloat(document.getElementById('irListPrice').value) || 0;
  const agreedPrice = parseFloat(document.getElementById('irAgreedPrice').value) || listPrice;
  const paymentType = document.getElementById('irPaymentType').value;
  const notes = document.getElementById('irNotes').value.trim();

  const m = TEAM_DEF.find(x => x.id === memberId);
  const memberName = m ? m.name : '';

  const payload = {
    companyName,
    memberId,
    memberName,
    stage,
    listPrice,
    agreedPrice,
    paymentType,
    notes,
    updatedAt: new Date().toISOString()
  };

  if (!dealId) {
    payload.createdAt = new Date().toISOString();
    db.collection('ir_campaign_deals').add(payload)
      .then(() => {
        closeIRDealModal();
        if (typeof showToast === 'function') showToast('Yeni kurum başarıyla eklendi! 🎉', 'success');
      })
      .catch(err => {
        console.error('IR Deal ekleme hatası:', err);
        if (typeof showToast === 'function') showToast('Hata: ' + err.message, 'error');
      });
  } else {
    db.collection('ir_campaign_deals').doc(dealId).update(payload)
      .then(() => {
        closeIRDealModal();
        if (typeof showToast === 'function') showToast('Kurum bilgileri güncellendi! ✅', 'success');
      })
      .catch(err => {
        console.error('IR Deal güncelleme hatası:', err);
        if (typeof showToast === 'function') showToast('Hata: ' + err.message, 'error');
      });
  }
}

function updateIRDealStage(dealId, newStage) {
  db.collection('ir_campaign_deals').doc(dealId).update({
    stage: newStage,
    updatedAt: new Date().toISOString()
  }).then(() => {
    if (typeof showToast === 'function') showToast('Satış etabı güncellendi! 🚀', 'success');
  }).catch(err => {
    console.error('Etap güncelleme hatası:', err);
  });
}

function deleteIRDeal(dealId) {
  if (!confirm('Bu kurum satış kaydını silmek istediğinize emin misiniz?')) return;

  db.collection('ir_campaign_deals').doc(dealId).delete()
    .then(() => {
      if (typeof showToast === 'function') showToast('Kurum kaydı silindi.', 'info');
    })
    .catch(err => {
      console.error('Silme hatası:', err);
    });
}

window.listenToIRCampaign = listenToIRCampaign;
window.renderIRCampaign = renderIRCampaign;
window.openIRDealModal = openIRDealModal;
window.closeIRDealModal = closeIRDealModal;
window.saveIRDeal = saveIRDeal;
window.updateIRDealStage = updateIRDealStage;
window.deleteIRDeal = deleteIRDeal;
