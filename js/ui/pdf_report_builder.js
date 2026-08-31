/* ── EXECUTIVE PRESENTATION PDF REPORT BUILDER ── */

function generateExecutivePresentationPDF(reportType = 'executive') {
  if (typeof html2pdf === 'undefined') {
    if (typeof showToast === 'function') showToast('PDF kütüphanesi yüklenmedi!', 'error');
    return;
  }

  if (typeof showToast === 'function') showToast('Kurumsal Sunum Raporu oluşturuluyor... ⏳', 'info');

  const period = typeof currentPeriod !== 'undefined' ? currentPeriod : 'AĞUSTOS 2026';
  const logoDataUrl = (typeof IDEAL_DATA_LOGO_B64 !== 'undefined') ? IDEAL_DATA_LOGO_B64 : null;
  const today = new Date().toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const preparedByName = (typeof currentUser !== 'undefined' && currentUser.name) ? currentUser.name : 'Ideal Data Yönetim';

  // Calculate Metrics
  const projectsList = (typeof allProjects !== 'undefined') ? allProjects : [];
  const activitiesList = (typeof allActivities !== 'undefined') ? allActivities : [];
  const wlList = (typeof allWhiteLabel !== 'undefined') ? allWhiteLabel : [];

  const newProjects = projectsList.filter(p => p.type === 'new');
  const onetimeProjects = projectsList.filter(p => p.type === 'onetime');

  const newProjTotal = newProjects.reduce((sum, p) => sum + (parseFloat(p.value) || 0), 0);
  const onetimeProjTotal = onetimeProjects.reduce((sum, p) => sum + (parseFloat(p.value) || 0), 0);
  const wlTotal = wlList.reduce((sum, w) => sum + (parseFloat(w.totalPrice || (parseFloat(w.qty || 0) * parseFloat(w.unitPrice || 0))) || 0), 0);
  const grandTotalHacim = newProjTotal + onetimeProjTotal + wlTotal;

  const totalCRMCount = activitiesList.length;
  const teamMembers = (typeof TEAM_DEF !== 'undefined') ? TEAM_DEF : [];

  // Construct Offscreen HTML Presentation Template
  const wrapper = document.createElement('div');
  wrapper.id = 'pdfPresentationReportWrapper';
  wrapper.style.cssText = 'position:fixed; top:-9999px; left:-9999px; width:794px; background:#f8fafc; font-family:"Outfit", "Helvetica Neue", Arial, sans-serif; color:#0f172a; box-sizing:border-box;';

  wrapper.innerHTML = `
    <style>
      .pdf-page {
        width: 794px;
        min-height: 1123px;
        height: 1123px;
        padding: 45px 50px;
        box-sizing: border-box;
        position: relative;
        background: #ffffff;
        page-break-after: always;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
      }
      .pdf-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 2px solid #0d1f61;
        padding-bottom: 12px;
        margin-bottom: 25px;
      }
      .pdf-footer {
        border-top: 1px solid #cbd5e1;
        padding-top: 12px;
        margin-top: auto;
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 10px;
        color: #64748b;
        font-weight: 500;
      }
      .kpi-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
        margin-bottom: 24px;
      }
      .kpi-card-pdf {
        background: #f1f5f9;
        border-left: 5px solid #0d1f61;
        border-radius: 10px;
        padding: 16px 20px;
      }
      .kpi-card-pdf.accent {
        border-left-color: #f24f00;
        background: #fff7ed;
      }
      .kpi-card-pdf.green {
        border-left-color: #10b981;
        background: #ecfdf5;
      }
      .kpi-card-pdf.blue {
        border-left-color: #3b82f6;
        background: #eff6ff;
      }
      .kpi-val-pdf {
        font-size: 22px;
        font-weight: 800;
        color: #0f172a;
        margin-top: 4px;
      }
      .kpi-lbl-pdf {
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: #475569;
        font-weight: 700;
      }
      .pdf-table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 20px;
        font-size: 11px;
      }
      .pdf-table th {
        background: #0d1f61;
        color: #ffffff;
        padding: 8px 10px;
        text-align: left;
        font-weight: 700;
        font-size: 10px;
        text-transform: uppercase;
      }
      .pdf-table td {
        padding: 8px 10px;
        border-bottom: 1px solid #e2e8f0;
        color: #1e293b;
      }
      .pdf-table tr:nth-child(even) td {
        background: #f8fafc;
      }
      .pdf-section-title {
        font-size: 16px;
        font-weight: 800;
        color: #0d1f61;
        margin-bottom: 12px;
        display: flex;
        align-items: center;
        gap: 8px;
        border-bottom: 1px solid #e2e8f0;
        padding-bottom: 6px;
      }
    </style>

    <!-- SAYFA 1: KAPAK SAYFASI (COVER PAGE) -->
    <div class="pdf-page" style="background: linear-gradient(135deg, #0d1f61 0%, #1e3a8a 100%); color: #ffffff;">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <div>
          ${logoDataUrl ? `<img src="${logoDataUrl}" style="height:48px; filter:brightness(0) invert(1);" />` : '<h2 style="font-size:24px; font-weight:900; letter-spacing:1px; margin:0;">IDEAL DATA</h2>'}
        </div>
        <div style="background:rgba(255,255,255,0.15); padding:6px 16px; border-radius:20px; font-size:12px; font-weight:700; letter-spacing:0.05em; text-transform:uppercase;">
          ${period} PERFORMANS RAPORU
        </div>
      </div>

      <div style="margin-top:120px; margin-bottom:100px;">
        <div style="font-size:13px; text-transform:uppercase; letter-spacing:0.15em; color:#f24f00; font-weight:800; margin-bottom:12px;">
          KURUMSAL YÖNETİCİ SUNUMU
        </div>
        <h1 style="font-size:36px; font-weight:900; line-height:1.25; margin:0 0 20px 0; color:#ffffff;">
          Dönemsel Satış, Aktivite &<br/>Proje Performans Analizi
        </h1>
        <div style="width:80px; height:4px; background:#f24f00; border-radius:2px; margin-bottom:24px;"></div>
        <p style="font-size:14px; color:#cbd5e1; max-width:540px; line-height:1.6; margin:0;">
          Bu rapor Ideal Data CRM platformu üzerinden üretilmiş olup; ekibin müşteri görüşmelerini, yeni ve tek seferlik projeleri, White Label satış hacimlerini ve dönemsel OKR hedeflerini içermektedir.
        </p>
      </div>

      <div style="background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.15); border-radius:14px; padding:24px; display:grid; grid-template-columns:1fr 1fr 1fr; gap:16px;">
        <div>
          <div style="font-size:10px; text-transform:uppercase; color:#94a3b8; font-weight:700;">Hazırlayan</div>
          <div style="font-size:14px; font-weight:700; color:#ffffff; margin-top:4px;">${preparedByName}</div>
        </div>
        <div>
          <div style="font-size:10px; text-transform:uppercase; color:#94a3b8; font-weight:700;">Rapor Tarihi</div>
          <div style="font-size:14px; font-weight:700; color:#ffffff; margin-top:4px;">${today}</div>
        </div>
        <div>
          <div style="font-size:10px; text-transform:uppercase; color:#94a3b8; font-weight:700;">Toplam İş Hacmi</div>
          <div style="font-size:14px; font-weight:800; color:#10b981; margin-top:4px;">${grandTotalHacim.toLocaleString('tr-TR')} ₺</div>
        </div>
      </div>

      <div class="pdf-footer" style="border-top-color:rgba(255,255,255,0.15); color:#94a3b8;">
        <span>Gizli ve Özel · Ideal Data Finansal Teknolojiler A.Ş.</span>
        <span>Sayfa 1 / 3</span>
      </div>
    </div>

    <!-- SAYFA 2: YÖNETİCİ ÖZETİ & KPI ÖZETİ -->
    <div class="pdf-page">
      <div>
        <div class="pdf-header">
          <div style="display:flex; align-items:center; gap:12px;">
            ${logoDataUrl ? `<img src="${logoDataUrl}" style="height:32px;" />` : '<strong style="color:#0d1f61; font-size:18px;">IDEAL DATA</strong>'}
            <span style="color:#cbd5e1;">|</span>
            <span style="font-size:13px; font-weight:700; color:#475569;">Yönetici Özet Panosu</span>
          </div>
          <div style="font-size:11px; font-weight:700; color:#0d1f61;">${period}</div>
        </div>

        <div class="pdf-section-title">📊 Dönemsel Performans & KPI Göstergeleri</div>

        <div class="kpi-grid">
          <div class="kpi-card-pdf green">
            <div class="kpi-lbl-pdf">Toplam Proje & İş Hacmi</div>
            <div class="kpi-val-pdf">${grandTotalHacim.toLocaleString('tr-TR')} ₺</div>
            <div style="font-size:10px; color:#047857; margin-top:4px; font-weight:600;">Yeni + Tek Seferlik + White Label</div>
          </div>
          <div class="kpi-card-pdf accent">
            <div class="kpi-lbl-pdf">Yeni Eklenen Proje Hacmi</div>
            <div class="kpi-val-pdf">${newProjTotal.toLocaleString('tr-TR')} ₺</div>
            <div style="font-size:10px; color:#c2410c; margin-top:4px; font-weight:600;">${newProjects.length} adet yeni proje kaydı</div>
          </div>
          <div class="kpi-card-pdf blue">
            <div class="kpi-lbl-pdf">Toplam CRM Aktivitesi</div>
            <div class="kpi-val-pdf">${totalCRMCount} Kayıt</div>
            <div style="font-size:10px; color:#1d4ed8; margin-top:4px; font-weight:600;">Toplantı, randevu ve teklif süreçleri</div>
          </div>
          <div class="kpi-card-pdf">
            <div class="kpi-lbl-pdf">White Label Satış Hacmi</div>
            <div class="kpi-val-pdf">${wlTotal.toLocaleString('tr-TR')} ₺</div>
            <div style="font-size:10px; color:#475569; margin-top:4px; font-weight:600;">${wlList.length} kurum paketi</div>
          </div>
        </div>

        <div class="pdf-section-title">👥 Ekip Aktivite & Performans Özeti</div>
        <table class="pdf-table">
          <thead>
            <tr>
              <th>Ekip Üyesi</th>
              <th>Departman</th>
              <th style="text-align:center;">Aktivite Kaydı</th>
              <th style="text-align:center;">Dönem Katkısı</th>
              <th style="text-align:center;">Durum</th>
            </tr>
          </thead>
          <tbody>
            ${teamMembers.map(m => {
              const mActs = activitiesList.filter(a => a.memberId === m.id).length;
              return `
                <tr>
                  <td style="font-weight:700; color:#0f172a;">${m.name}</td>
                  <td><span style="display:inline-block; padding:2px 8px; border-radius:10px; background:#f1f5f9; font-size:10px; font-weight:600;">${m.dept}</span></td>
                  <td style="text-align:center; font-weight:700;">${mActs}</td>
                  <td style="text-align:center;">${totalCRMCount > 0 ? Math.round((mActs / totalCRMCount) * 100) : 0}%</td>
                  <td style="text-align:center;"><span style="color:#10b981; font-weight:700;">Aktif</span></td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>

      <div class="pdf-footer">
        <span>Ideal Data CRM · Kurumsal Raporlama Sistemi</span>
        <span>Sayfa 2 / 3</span>
      </div>
    </div>

    <!-- SAYFA 3: PROJE & FİNANSAL TABLOLAR -->
    <div class="pdf-page">
      <div>
        <div class="pdf-header">
          <div style="display:flex; align-items:center; gap:12px;">
            ${logoDataUrl ? `<img src="${logoDataUrl}" style="height:32px;" />` : '<strong style="color:#0d1f61; font-size:18px;">IDEAL DATA</strong>'}
            <span style="color:#cbd5e1;">|</span>
            <span style="font-size:13px; font-weight:700; color:#475569;">Finansal Proje Detay Raporu</span>
          </div>
          <div style="font-size:11px; font-weight:700; color:#0d1f61;">${period}</div>
        </div>

        <div class="pdf-section-title">💼 Yeni Eklenen Projeler (${newProjects.length} Kayıt)</div>
        <table class="pdf-table">
          <thead>
            <tr>
              <th>Dönem</th>
              <th>Kurum Adı</th>
              <th>Proje / İş Adı</th>
              <th style="text-align:center;">PRO</th>
              <th style="text-align:center;">CEP</th>
              <th style="text-align:right;">Tutar (TL)</th>
            </tr>
          </thead>
          <tbody>
            ${newProjects.length ? newProjects.slice(0, 10).map(p => `
              <tr>
                <td style="font-weight:700;">${p.month || '—'}</td>
                <td style="font-weight:600;">${p.company || '—'}</td>
                <td>${p.name || '—'}</td>
                <td style="text-align:center;">${p.pro || '—'}</td>
                <td style="text-align:center;">${p.cep || '—'}</td>
                <td style="text-align:right; font-weight:700; color:#059669;">${p.value ? Number(p.value).toLocaleString('tr-TR') + ' ₺' : '—'}</td>
              </tr>
            `).join('') : '<tr><td colspan="6" style="text-align:center; color:#94a3b8;">Bu dönemde kayıtlı yeni proje bulunmuyor.</td></tr>'}
          </tbody>
        </table>

        <div class="pdf-section-title" style="margin-top:20px;">⚡ Tek Seferlik Projeler (${onetimeProjects.length} Kayıt)</div>
        <table class="pdf-table">
          <thead>
            <tr>
              <th>Dönem</th>
              <th>Kurum Adı</th>
              <th>Proje / İş Adı</th>
              <th style="text-align:right;">Tutar (TL)</th>
            </tr>
          </thead>
          <tbody>
            ${onetimeProjects.length ? onetimeProjects.slice(0, 8).map(p => `
              <tr>
                <td style="font-weight:700;">${p.month || '—'}</td>
                <td style="font-weight:600;">${p.company || '—'}</td>
                <td>${p.name || '—'}</td>
                <td style="text-align:right; font-weight:700; color:#2563eb;">${p.value ? Number(p.value).toLocaleString('tr-TR') + ' ₺' : '—'}</td>
              </tr>
            `).join('') : '<tr><td colspan="4" style="text-align:center; color:#94a3b8;">Bu dönemde kayıtlı tek seferlik proje bulunmuyor.</td></tr>'}
          </tbody>
        </table>

        <div style="background:#0d1f61; color:#ffffff; padding:14px 20px; border-radius:10px; display:flex; justify-content:space-between; align-items:center; margin-top:24px;">
          <span style="font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:0.05em;">Dönem Sonu Toplam Portföy Hacmi</span>
          <span style="font-size:18px; font-weight:900; color:#10b981;">${grandTotalHacim.toLocaleString('tr-TR')} ₺</span>
        </div>
      </div>

      <div class="pdf-footer">
        <span>Ideal Data CRM · Otomatik Oluşturulan Yönetici Raporu</span>
        <span>Sayfa 3 / 3</span>
      </div>
    </div>
  `;

  document.body.appendChild(wrapper);

  const opt = {
    margin: 0,
    filename: `IdealData_Kurumsal_Sunum_${period.replace(/\s+/g, '_')}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      allowTaint: false,
      logging: false
    },
    jsPDF: { unit: 'px', format: [794, 1123], orientation: 'portrait' }
  };

  html2pdf().set(opt).from(wrapper).save()
    .then(() => {
      document.body.removeChild(wrapper);
      if (typeof showToast === 'function') showToast('Kurumsal Sunum Raporu PDF olarak indirildi! 🎉', 'success');
    })
    .catch(err => {
      if (document.body.contains(wrapper)) document.body.removeChild(wrapper);
      console.error('PDF sunum hatasi:', err);
      if (typeof showToast === 'function') showToast('PDF oluşturulurken hata oluştu: ' + err.message, 'error');
    });
}

window.generateExecutivePresentationPDF = generateExecutivePresentationPDF;
