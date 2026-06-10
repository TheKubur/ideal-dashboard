import re

# Update dashboard.js
with open('js/ui/dashboard.js', 'r', encoding='utf-8') as f:
    dash = f.read()

# 1. Update card data logic in renderTeam() or related
def repl_cards(match):
    return """
  // Bu Haftanın Toplantıları (Card 1)
  const now = new Date();
  const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + 1));
  const endOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + 7));
  const weeklyMeetings = allActivities.filter(a => a.fieldKey === 'randevu' && new Date(a.createdAt) >= startOfWeek && new Date(a.createdAt) <= endOfWeek).length;
  document.getElementById('totalCustomers').textContent = weeklyMeetings;
  
  // Toplam Teklif (Card 2)
  const offers = allActivities.filter(a => a.fieldKey === 'teklif').length;
  document.getElementById('totalOffers').textContent = offers;
  
  // Günlük Ort CRM (Card 3)
  document.getElementById('totalCRMCount').textContent = allActivities.length;
  document.getElementById('dailyAvgCRM').textContent = (allActivities.length / Math.max(1, new Date().getDate())).toFixed(1);
  
  // OKR Özeti (Card 4)
  const okrTotal = allActivities.length; // Simplified
  const okrTarget = 100;
  document.getElementById('conversionRate').textContent = `${okrTotal}/${okrTarget}`;

  const container = document.getElementById('teamGrid');
"""
dash = re.sub(r"  let totalCust = 0;\n[\s\S]*?const container = document\.getElementById\('teamGrid'\);", repl_cards, dash)

# 2. Swap Team Performance style to OKR style
def repl_team(match):
    return """
    const card = document.createElement('div');
    card.className = 'okr-card';
    card.innerHTML = `
      <div class="okr-header">
        <div class="okr-avatar" style="background:${m.avatarBg};color:${m.deptColor}">${m.initials}</div>
        <div class="okr-info">
          <div class="okr-name">${m.name}</div>
          <div class="okr-dept">${m.dept}</div>
        </div>
      </div>
      <div class="okr-metrics">
        ${m.fields.filter(f => f.hasTarget).map(f => {
          const actual = data[f.key]?.actual || 0;
          return `
            <div class="okr-metric">
              <span class="okr-metric-label">${f.emoji} ${f.label}</span>
              <span class="okr-metric-val">${actual}</span>
            </div>
          `;
        }).join('')}
      </div>
    `;
    container.appendChild(card);
"""
dash = re.sub(r"    const card = document\.createElement\('div'\);[\s\S]*?container\.appendChild\(card\);", repl_team, dash, count=1)

with open('js/ui/dashboard.js', 'w', encoding='utf-8') as f:
    f.write(dash)

# Update okr.js
with open('js/ui/okr.js', 'r', encoding='utf-8') as f:
    okr = f.read()

def repl_okr(match):
    return """
    const card = document.createElement('div');
    card.className = 'member-card';
    card.innerHTML = `
      <div class="member-header">
        <div class="member-avatar" style="background:${m.avatarBg};color:${m.deptColor}">${m.initials}</div>
        <div class="member-info">
          <div class="member-name">${m.name}</div>
          <div class="member-title">${m.title}</div>
        </div>
      </div>
      <div class="member-stats">
        ${m.fields.map(f => `
          <div class="stat-row">
            <span class="stat-label">${f.emoji} ${f.label}</span>
            <div class="stat-value">
              <span class="actual" style="color:${m.deptColor}">${liveData[m.id]?.[f.key]?.actual || 0}</span>
            </div>
          </div>
        `).join('')}
      </div>
    `;
    container.appendChild(card);
"""
okr = re.sub(r"    const card = document\.createElement\('div'\);\n    card\.className = 'okr-card';[\s\S]*?container\.appendChild\(card\);", repl_okr, okr, count=1)

with open('js/ui/okr.js', 'w', encoding='utf-8') as f:
    f.write(okr)

