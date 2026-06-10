let personalTasks = JSON.parse(localStorage.getItem('adminPersonalTasks')) || {
  'Acik': [],
  'Bekleyen': [],
  'Tamamlanan': []
};

function savePersonalTasks() {
  localStorage.setItem('adminPersonalTasks', JSON.stringify(personalTasks));
}

function renderPersonalTasks() {
  const container = document.getElementById('tab-personaltasks');
  if (!container) return;

  container.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem;">
      <h2 style="font-size:1.8rem; font-weight:800; color:var(--ink);">📌 Kişisel Görevler</h2>
      <button onclick="addPersonalTask()" style="background:var(--accent); color:white; border:none; padding:0.6rem 1.2rem; border-radius:8px; font-weight:700; cursor:pointer;">+ Yeni Görev</button>
    </div>
    <div style="display:flex; gap:1.5rem; overflow-x:auto; padding-bottom:1rem; height:calc(100vh - 180px);">
      ${['Acik', 'Bekleyen', 'Tamamlanan'].map(col => `
        <div style="flex:1; min-width:300px; background:var(--surface); border:1px solid var(--border); border-radius:12px; display:flex; flex-direction:column; box-shadow:var(--shadow);">
          <div style="padding:1rem; border-bottom:2px solid var(--border); font-weight:800; font-size:1.1rem; color:var(--ink); display:flex; justify-content:space-between;">
            ${col === 'Acik' ? 'Açık İşler' : col === 'Bekleyen' ? 'Bekleyen İşler' : 'Tamamlanan İşler'}
            <span style="background:var(--bg); padding:0.1rem 0.5rem; border-radius:99px; font-size:0.8rem;">${personalTasks[col].length}</span>
          </div>
          <div class="ptask-list" id="ptask-list-${col}" style="padding:1rem; flex:1; overflow-y:auto; display:flex; flex-direction:column; gap:0.8rem;" ondragover="ptaskDragOver(event)" ondrop="ptaskDrop(event, '${col}')">
            ${personalTasks[col].map((t, idx) => `
              <div class="ptask-card" draggable="true" ondragstart="ptaskDragStart(event, '${col}', ${idx})" style="background:var(--bg); border:1px solid var(--border); border-radius:8px; padding:1rem; cursor:grab; position:relative;">
                <div style="font-weight:700; color:var(--ink); margin-bottom:0.4rem; padding-right:40px;">${t.title}</div>
                ${t.desc ? `<div style="font-size:0.8rem; color:var(--ink2); line-height:1.4;">${t.desc}</div>` : ''}
                <div style="position:absolute; top:0.8rem; right:0.8rem; display:flex; gap:0.4rem;">
                  <button onclick="editPersonalTask('${col}', ${idx})" style="background:none; border:none; cursor:pointer; font-size:0.9rem;" title="Düzenle">✏️</button>
                  <button onclick="deletePersonalTask('${col}', ${idx})" style="background:none; border:none; cursor:pointer; font-size:0.9rem;" title="Sil">🗑</button>
                </div>
              </div>
            `).join('')}
            ${personalTasks[col].length === 0 ? `<div style="text-align:center; color:var(--ink3); font-size:0.85rem; padding:2rem 0;">Sürükleyip Bırakın</div>` : ''}
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

let draggedTask = null;

function ptaskDragStart(e, col, idx) {
  draggedTask = { col, idx };
  e.dataTransfer.effectAllowed = 'move';
}

function ptaskDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
}

function ptaskDrop(e, targetCol) {
  e.preventDefault();
  if (!draggedTask) return;
  const { col, idx } = draggedTask;
  if (col === targetCol) return;
  
  const task = personalTasks[col][idx];
  personalTasks[col].splice(idx, 1);
  personalTasks[targetCol].push(task);
  
  savePersonalTasks();
  renderPersonalTasks();
  draggedTask = null;
}

function addPersonalTask() {
  const title = prompt('Görev Başlığı:');
  if (!title) return;
  const desc = prompt('Açıklama (İsteğe bağlı):') || '';
  
  personalTasks['Acik'].push({ title, desc });
  savePersonalTasks();
  renderPersonalTasks();
}

function editPersonalTask(col, idx) {
  const task = personalTasks[col][idx];
  const title = prompt('Yeni Başlık:', task.title);
  if (!title) return;
  const desc = prompt('Yeni Açıklama:', task.desc);
  
  personalTasks[col][idx] = { title, desc: desc || '' };
  savePersonalTasks();
  renderPersonalTasks();
}

function deletePersonalTask(col, idx) {
  if (confirm('Bu görevi silmek istediğinize emin misiniz?')) {
    personalTasks[col].splice(idx, 1);
    savePersonalTasks();
    renderPersonalTasks();
  }
}
