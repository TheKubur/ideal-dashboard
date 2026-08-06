let currentUser = null;
const trMonthsList = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
const nowForPeriod = new Date();
let currentYear = nowForPeriod.getFullYear();
let currentMonth = trMonthsList[nowForPeriod.getMonth()];
let currentPeriod = `${currentMonth} ${currentYear}`;
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
let globalUnsubscribeFns = [];

TEAM_DEF.forEach(m => {
  liveData[m.id] = {};
  m.fields.forEach(f => { liveData[m.id][f.key] = { actual: 0, target: 0 }; });
});


let paginationState = {
  activityList: 1,
  kb_Beklemede: 1,
  kb_Takip: 1,
  kb_Tamamlandı: 1,
  pipe_Toplantı: 1,
  pipe_Teklif: 1,
  pipe_Kabul: 1,
  pipe_Sözleşme: 1,
  pipe_Fatura: 1
};

function changePage(stateKey, delta) {
  paginationState[stateKey] = (paginationState[stateKey] || 1) + delta;
  if (stateKey === 'activityList') {
    if (typeof renderActivities === 'function') renderActivities();
  } else if (stateKey.startsWith('kb_')) {
    if (typeof renderCRM === 'function') renderCRM();
  } else if (stateKey.startsWith('pipe_')) {
    if (typeof renderPipeline === 'function') renderPipeline();
  }
}

function renderPagination(container, stateKey, totalItems, itemsPerPage = 5) {
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const currentPage = paginationState[stateKey] || 1;
  
  if (totalItems === 0) return;

  const div = document.createElement('div');
  div.style.display = 'flex';
  div.style.justifyContent = 'space-between';
  div.style.alignItems = 'center';
  div.style.marginTop = '10px';
  div.style.padding = '0.5rem';
  div.style.background = 'var(--bg)';
  div.style.borderRadius = '8px';
  div.innerHTML = `
    <button onclick="changePage('${stateKey}', -1)" ${currentPage === 1 ? 'disabled' : ''} style="padding:4px 8px; font-size:12px; cursor:pointer; background:var(--surface); border:1px solid var(--border); border-radius:4px;">Önceki</button>
    <span style="font-size:12px; color:var(--ink2)">Sayfa ${currentPage} / ${totalPages}</span>
    <button onclick="changePage('${stateKey}', 1)" ${currentPage === totalPages ? 'disabled' : ''} style="padding:4px 8px; font-size:12px; cursor:pointer; background:var(--surface); border:1px solid var(--border); border-radius:4px;">Sonraki</button>
  `;
  container.appendChild(div);
}
