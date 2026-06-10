function toggleTheme() {
  const body = document.body;
  const currentTheme = body.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  body.setAttribute('data-theme', newTheme);
  localStorage.setItem('idealDataTheme', newTheme);
}

// Sayfa yüklendiğinde temayı uygula
document.addEventListener('DOMContentLoaded', () => {
  const savedTheme = localStorage.getItem('idealDataTheme') || 'light';
  document.body.setAttribute('data-theme', savedTheme);
});

function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span style="font-size:1.2rem">${type === 'success' ? '✅' : type === 'warning' ? '⚠️' : '❌'}</span>
    <div>${message}</div>
  `;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'slideInRight 0.3s ease reverse forwards';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

function pct(a, t) { return t === 0 ? 0 : Math.min(100, Math.round((a / t) * 100)); }
function pctColor(p) { return p >= 80 ? '#2a9d8f' : p >= 50 ? '#f4a261' : '#e63946'; }

function animateValue(obj, start, end, duration) {
  let startTimestamp = null;
  const step = (timestamp) => {
    if (!startTimestamp) startTimestamp = timestamp;
    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
    obj.textContent = Math.floor(progress * (end - start) + start);
    if (progress < 1) window.requestAnimationFrame(step);
    else obj.textContent = end;
  };
  window.requestAnimationFrame(step);
}

function triggerConfetti() {
  if (typeof confetti !== 'undefined') {
    confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 }, colors: ['#e63946', '#457b9d', '#f4a261', '#2a9d8f', '#f59e0b'] });
  }
}
function calcOverall(mid) {
  const m = TEAM_DEF.find(x => x.id === mid);
  const tf = m.fields.filter(f => f.hasTarget && liveData[mid][f.key].target > 0);
  if (!tf.length) return 0;
  return Math.round(tf.reduce((s, f) => s + pct(liveData[mid][f.key].actual, liveData[mid][f.key].target), 0) / tf.length);
}
function canEditTarget() { return currentUser && currentUser.role === 'admin'; }
function canAddActivity(mid) {
  if (!currentUser) return false;
  if (currentUser.role === 'viewer') return false;
  return currentUser.role === 'admin' || currentUser.memberId === mid;
}
function canDeleteActivity() { return currentUser && currentUser.role === 'admin'; }
function canEditActivity(mid) {
  if (!currentUser) return false;
  if (currentUser.role === 'viewer') return false;
  return currentUser.role === 'admin' || currentUser.memberId === mid;
}
function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 60000);
  if (diff < 1) return 'Az önce';
  if (diff < 60) return diff + ' dk önce';
  if (diff < 1440) return Math.floor(diff / 60) + ' saat önce';
  return Math.floor(diff / 1440) + ' gün önce';
}

