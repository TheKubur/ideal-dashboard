import re

with open('js/ui/pipeline.js', 'r', encoding='utf-8') as f:
    code = f.read()

def repl(match):
    return """
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
"""

code = re.sub(r"  list\.forEach\(d => \{[\s\S]*?    colObj\.el\.appendChild\(card\);\n  \}\);", repl, code)

with open('js/ui/pipeline.js', 'w', encoding='utf-8') as f:
    f.write(code)
