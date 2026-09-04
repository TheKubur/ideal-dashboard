// ====== VERİMLİLİK ANALİZİ ======

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
  if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'viewer')) return;

  const kpiStrip = document.getElementById('analyticsKpiStrip');
  const table = document.getElementById('analyticsTable');
  if (!kpiStrip || !table) return;

  const salesTeam = TEAM_DEF.filter(m => m.dept === 'Satış');

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
    { label: 'Toplam Nitelikli Fırsat', value: totalFirsat, icon: '🤝', color: '#3b82f6' },
    { label: 'Toplam Teklif', value: totalTeklif, icon: '📄', color: '#f59e0b' },
    { label: 'Ortalama Kapatma Oranı', value: '%' + avgKapatma, icon: '✅', color: '#10b981' },
    { label: 'Kayıp Satış Analizi Oranı', value: '%' + avgKayipAnaliz, icon: '❌', color: '#e63946' },
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
          <th style="padding:0.85rem 1rem;font-size:0.72rem;color:var(--ink3);font-weight:700;text-transform:uppercase;">🤝 NİT. FIRSAT</th>
          <th style="padding:0.85rem 1rem;font-size:0.72rem;color:var(--ink3);font-weight:700;text-transform:uppercase;">📄 TEKLİF</th>
          <th style="padding:0.85rem 1rem;font-size:0.72rem;color:var(--ink3);font-weight:700;text-transform:uppercase;">✅ KAPATMA ORANI</th>
          <th style="padding:0.85rem 1rem;font-size:0.72rem;color:var(--ink3);font-weight:700;text-transform:uppercase;">❌ KAYIP ANALİZİ</th>
          <th style="padding:0.85rem 1rem;font-size:0.72rem;color:var(--ink3);font-weight:700;text-transform:uppercase;">🎯 OKR HEDEF %</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}

function exportAnalyticsExcel() {
  if (typeof XLSX === 'undefined') { showToast('Excel kütüphanesi yüklenmedi.', 'error'); return; }
  const headers = ['Personel', 'Departman', 'Toplam Aktivite', 'Nitelikli Fırsat', 'Teklif', 'Kapatma Oranı %', 'Kayıp Analiz Oranı %'];
  const rows = TEAM_DEF.filter(m => m.dept === 'Satış').map(m => {
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
    showToast('OKR raporu indirildi! 📥', 'success');
  } catch (e) { showToast('İndirme hatası: ' + e.message, 'error'); }
}

