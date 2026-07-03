let calYear = new Date().getFullYear();
let calMonth = new Date().getMonth(); // 0-indexed
let calNoteTargetId = null;
let calNotes = {}; // { activityId: noteText }

const MEMBER_COLORS = {
  admin: { bg: 'rgba(15,23,42,0.15)', text: '#0f172a', border: '#0f172a' },
  esma: { bg: 'rgba(230,57,70,0.15)', text: '#e63946', border: '#e63946' },
  dilan: { bg: 'rgba(139,92,246,0.15)', text: '#8b5cf6', border: '#8b5cf6' },
  melek: { bg: 'rgba(245,158,11,0.15)', text: '#f59e0b', border: '#f59e0b' },
  elif: { bg: 'rgba(69,123,157,0.15)', text: '#457b9d', border: '#457b9d' },
};

function switchTab(tab) {
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  const tabEl = document.getElementById('tab-' + tab);
  if (tabEl) tabEl.classList.add('active');
  if (event && event.target) event.target.classList.add('active');
  if (tab === 'calendar') renderCalendar();
  if (tab === 'companies') renderCompanies();
  if (tab === 'pipeline') renderPipeline();
  if (tab === 'personaltasks') renderPersonalTasks();
  if (tab === 'teklif') {
    if (typeof initProposalsPage === 'function') initProposalsPage();
  }
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

  if (!list.length) { grid.innerHTML = '<div style="text-align:center;padding:3rem;color:var(--ink3);width:100%">Sonuç bulunamadı 📭</div>'; return; }

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
           <div style="font-size:0.75rem;color:var(--ink3);margin-top:0.3rem">${actCount} toplam etkileşim</div>
        </div>
        <div class="company-dir-reps">${reps || '<span style="font-size:0.7rem;color:var(--ink3)">Henüz temsilci atanmamış</span>'}</div>
        ${currentUser && currentUser.role === 'admin' ? `<button onclick="openAssignModal('${cEsc}')" style="margin-top:auto;width:100%;padding:0.65rem;border:1px solid var(--border);border-radius:8px;background:none;color:var(--ink);font-family:'Outfit',sans-serif;font-size:0.75rem;font-weight:600;cursor:pointer;transition:background 0.2s">👤 Temsilci Ata</button>` : ''}
        <button onclick="showCompanyDetail('${cEsc}')" style="${currentUser && currentUser.role !== 'admin' ? 'margin-top:auto;' : ''}width:100%;padding:0.65rem;border:1px solid var(--border);border-radius:8px;background:var(--bg);color:var(--ink);font-family:'Outfit',sans-serif;font-size:0.82rem;font-weight:600;cursor:pointer;transition:background 0.2s">📄 Detay / Özel Not Defterim</button>
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
  // Tüm aktivitelerden randevu olanları al (tüm dönemler)
  return allActivities.filter(a => a.fieldKey === 'randevu' && a.date);
}

function renderCalendar() {
  const TR_MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
  const TR_DAYS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

  document.getElementById('calMonthTitle').textContent = TR_MONTHS[calMonth] + ' ' + calYear;

  const legend = document.getElementById('calLegend');
  legend.innerHTML = TEAM_DEF.map(m => {
    const c = MEMBER_COLORS[m.id];
    return `<div class="cal-legend-item"><div class="cal-legend-dot" style="background:${c?.border || '#ccc'}"></div>${m.name}</div>`;
  }).join('');

  const grid = document.getElementById('calGrid');
  grid.innerHTML = '';

  // Gün başlıkları (Pazartesi başlangıç)
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

  // Boş hücreler
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
  const TR_MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
  document.getElementById('calDayTitle').textContent = `📅 ${parseInt(d)} ${TR_MONTHS[parseInt(m) - 1]} ${y}`;
  document.getElementById('calDaySub').textContent = acts.length ? `${acts.length} randevu` : 'Bu gün randevu yok';

  const addBtn = document.getElementById('calDayAddBtn');
  if (addBtn) {
    if (currentUser && currentUser.role === 'admin') {
      addBtn.style.display = 'inline-block';
      addBtn.textContent = '+ Randevu Ekle';
      addBtn.onclick = () => {
        document.getElementById('calDayModal').classList.add('hidden');
        openModal('admin', dateStr, 'randevu');
      };
    } else {
      addBtn.style.display = 'none';
    }
  }

  const body = document.getElementById('calDayBody');
  if (!acts.length) {
    body.innerHTML = '<div style="text-align:center;padding:1.5rem;color:var(--ink3);font-size:0.88rem">Bu gün için randevu yok 📭</div>';
  } else {
    body.innerHTML = acts.map(a => {
      const c = MEMBER_COLORS[a.memberId] || { border: '#ccc' };
      const note = calNotes[a.id] || '';
      return `<div class="cal-randevu-item" style="border-left-color:${c.border}">
        <div style="display:flex;align-items:center;gap:0.5rem;flex-wrap:wrap;margin-bottom:0.3rem">
          <span style="font-weight:700;font-size:0.85rem;color:var(--ink)">${a.memberName}</span>
          <span style="font-size:0.72rem;background:${c.border}22;color:${c.border};padding:0.15rem 0.5rem;border-radius:99px;font-weight:600">${a.status || '—'}</span>
          ${a.vip ? '<span style="font-size:0.72rem">⭐ VIP</span>' : ''}
        </div>
        ${(a.timeStart) ? `<div style="font-size:0.75rem;color:var(--accent2);margin-bottom:0.2rem">🕐 ${a.timeStart} – ${a.timeEnd || ''}</div>` : ''}
        ${a.company ? `<div style="font-size:0.82rem;font-weight:600;color:var(--ink2)">🏢 ${a.company}</div>` : ''}
        <div style="font-size:0.82rem;color:var(--ink2);margin-top:0.2rem">${a.desc}</div>
        ${a.nextStep ? `<div style="font-size:0.75rem;color:var(--accent2);margin-top:0.2rem">→ ${a.nextStep}</div>` : ''}
        ${note ? `<div class="cal-note-text">📝 ${note}</div>` : ''}
        <div style="display:flex;gap:0.5rem;flex-wrap:wrap;margin-top:0.4rem">
          <button class="cal-note-btn" onclick="openCalNote('${a.id}', '${(a.company || a.desc).replace(/'/g, "\\'")}', '${note.replace(/'/g, "\\'")}')">
            ${note ? '✏️ Notu Düzenle' : '📝 Not Ekle'}
          </button>
          ${outlookAccount ? `<button id='outlook-btn-${a.id}' onclick='addToOutlook("${a.id}")' style='background:rgba(0,120,212,0.1);color:#0078d4;border:1px solid rgba(0,120,212,0.3);border-radius:6px;padding:0.2rem 0.6rem;font-size:0.72rem;cursor:pointer'>${a.outlookEventId ? '✅ Eklendi' : '📅 Outlook Ekle'}</button>` : ''}
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
      // Gün modalını yenile
      const act = allActivities.find(a => a.id === calNoteTargetId);
      if (act) {
        const dateActs = allActivities.filter(a => a.fieldKey === 'randevu' && a.date === act.date);
        openCalDay(act.date, dateActs);
      }
    })
    .catch(e => showToast('Hata: ' + e.message, 'error'));
}

