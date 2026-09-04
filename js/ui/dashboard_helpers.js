function changePeriod() {
  currentMonth = document.getElementById('monthSel').value;
  currentYear = document.getElementById('yearSel').value;
  currentPeriod = `${currentMonth} ${currentYear}`;
  document.getElementById('currentPeriod').textContent = currentPeriod;
  document.getElementById('loadingOverlay').classList.remove('hidden');
  unsubscribeFns.forEach(fn => fn()); unsubscribeFns = [];
  TEAM_DEF.forEach(m => { m.fields.forEach(f => { liveData[m.id][f.key] = { actual: 0, target: 0 }; }); });
  allActivities = [];
  allDeals = [];
  listenToData(currentPeriod);
  listenToActivities(currentPeriod);
  listenToDeals(currentPeriod);
  listenToProjects(currentYear);
  listenToWlRecords(currentYear);
  listenToOKR(currentPeriod);
  if (typeof listenToIRCampaign === 'function') listenToIRCampaign();
  listenToLostSaleNotes(currentPeriod);
  if (typeof listenToProposals === 'function') listenToProposals();
  renderTeam();
}

