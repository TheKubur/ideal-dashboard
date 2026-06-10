// ====== KANBAN DRAG & DROP LOGIC ======
function kbDragStart(e, id) {
  e.dataTransfer.setData('text/plain', id);
  setTimeout(() => e.target.classList.add('dragging'), 0);
}

function kbDragEnd(e) {
  e.target.classList.remove('dragging');
  document.querySelectorAll('.kanban-col').forEach(c => c.classList.remove('drag-over'));
}

function kbAllowDrop(e) {
  e.preventDefault();
  const col = e.target.closest('.kanban-col');
  if (col) {
    document.querySelectorAll('.kanban-col').forEach(c => c.classList.remove('drag-over'));
    col.classList.add('drag-over');
  }
}

function kbDrop(e, status) {
  e.preventDefault();
  document.querySelectorAll('.kanban-col').forEach(c => c.classList.remove('drag-over'));
  const id = e.dataTransfer.getData('text/plain');
  if (!id) return;
  const activity = allActivities.find(a => a.id === id);
  if (!activity) return;

  if (activity.status !== status) {
    db.collection('activities').doc(id).update({ status, editedAt: new Date().toISOString(), editedBy: currentUser.name })
      .then(() => showToast(`Durum güncellendi: ${status}`, 'success'))
      .catch(err => showToast('Hata: ' + err.message, 'error'));
  }
}

