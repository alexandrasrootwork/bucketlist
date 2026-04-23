// --- Data storage (localStorage) ---
let bucketItems = [];

// Load from localStorage
function loadData() {
  const saved = localStorage.getItem('bucketList');
  if (saved) {
    bucketItems = JSON.parse(saved);
  } else {
    // Sample items
    bucketItems = [
      { id: Date.now(), title: "Visit Japan", completed: false, notes: "", image: "", completedDate: null },
      { id: Date.now() + 1, title: "Learn to code", completed: true, notes: "Built this website!", image: "", completedDate: "2025-03-15" }
    ];
  }
  render();
}

// Save to localStorage
function saveData() {
  localStorage.setItem('bucketList', JSON.stringify(bucketItems));
  render();
}

// Render all items
function render() {
  const container = document.getElementById('bucketContainer');
  if (!container) return;

  container.innerHTML = '';

  const incomplete = bucketItems.filter(item => !item.completed);
  const complete = bucketItems.filter(item => item.completed);
  const sorted = [...incomplete, ...complete];

  sorted.forEach(item => {
    const div = document.createElement('div');
    div.className = `bucket-item ${item.completed ? 'completed' : ''}`;

    const completedClass = item.completed ? 'completed-text' : '';

    div.innerHTML = `
      <div class="item-header">
        <input type="checkbox" class="checkmark" data-id="${item.id}" ${item.completed ? 'checked' : ''}>
        <span class="item-title ${completedClass}">${escapeHtml(item.title)}</span>
        <button class="delete-btn" data-id="${item.id}">✗</button>
      </div>
      <div class="item-details">
        ${item.completedDate ? `<div class="completed-date">✅ Completed: ${item.completedDate}</div>` : ''}
        ${item.notes ? `<div class="item-notes">📝 ${escapeHtml(item.notes)}</div>` : ''}
        ${item.image ? `<img src="${escapeHtml(item.image)}" class="item-image" onerror="this.style.display='none'">` : ''}
        <div>
          <button class="edit-btn" data-id="${item.id}" data-type="notes">✏️ Edit Notes</button>
          <button class="edit-btn" data-id="${item.id}" data-type="image">🖼️ Add/Change Image</button>
          <button class="edit-btn" data-id="${item.id}" data-type="date">📅 Set Completed Date</button>
        </div>
      </div>
    `;
    container.appendChild(div);
  });

  // Update progress
  const total = bucketItems.length;
  const completedCount = bucketItems.filter(i => i.completed).length;
  const percent = total === 0 ? 0 : Math.round((completedCount / total) * 100);
  document.getElementById('progressPercent').innerText = percent;
  document.getElementById('progressFill').style.width = percent + '%';

  // Attach event listeners
  document.querySelectorAll('.checkmark').forEach(cb => {
    cb.addEventListener('change', (e) => {
      const id = parseInt(e.target.dataset.id);
      toggleComplete(id);
    });
  });

  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = parseInt(e.target.dataset.id);
      deleteItem(id);
    });
  });

  document.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = parseInt(e.target.dataset.id);
      const type = e.target.dataset.type;
      openEditPopup(id, type);
    });
  });
}

// Helper to escape HTML
function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>]/g, function(m) {
    if (m === '&') return '&amp;';
    if (m === '<') return '&lt;';
    if (m === '>') return '&gt;';
    return m;
  });
}

// Toggle complete status
function toggleComplete(id) {
  const item = bucketItems.find(i => i.id === id);
  if (item) {
    item.completed = !item.completed;
    if (item.completed) {
      item.completedDate = new Date().toISOString().split('T')[0];
    } else {
      item.completedDate = null;
    }
    saveData();
  }
}

// Delete item
function deleteItem(id) {
  if (confirm('Delete this item?')) {
    bucketItems = bucketItems.filter(i => i.id !== id);
    saveData();
  }
}

// --- Popup management ---
const popup = document.getElementById('bucketPopup');
const editPopup = document.getElementById('editPopup');
let currentEditId = null;
let currentEditType = null;

document.getElementById('openAddWindow').addEventListener('click', () => {
  document.getElementById('itemTitle').value = '';
  document.getElementById('itemNotes').value = '';
  document.getElementById('itemImage').value = '';
  popup.style.display = 'flex';
});

document.getElementById('closePopup').addEventListener('click', () => {
  popup.style.display = 'none';
});

document.getElementById('closeEditPopup').addEventListener('click', () => {
  editPopup.style.display = 'none';
});

// Submit new item
document.getElementById('submitButton').addEventListener('click', () => {
  const title = document.getElementById('itemTitle').value.trim();
  if (!title) {
    alert('Please enter a title!');
    return;
  }

  const newItem = {
    id: Date.now(),
    title: title,
    completed: false,
    notes: document.getElementById('itemNotes').value.trim(),
    image: document.getElementById('itemImage').value.trim(),
    completedDate: null
  };

  bucketItems.push(newItem);
  saveData();
  popup.style.display = 'none';
});

// Open edit popup
function openEditPopup(id, type) {
  currentEditId = id;
  currentEditType = type;
  const item = bucketItems.find(i => i.id === id);
  if (!item) return;

  document.getElementById('editNotes').value = item.notes || '';
  document.getElementById('editImage').value = item.image || '';
  document.getElementById('editDate').value = item.completedDate || '';
  editPopup.style.display = 'flex';
}

// Save edit changes
document.getElementById('saveEditButton').addEventListener('click', () => {
  const item = bucketItems.find(i => i.id === currentEditId);
  if (item) {
    item.notes = document.getElementById('editNotes').value.trim();
    item.image = document.getElementById('editImage').value.trim();
    const newDate = document.getElementById('editDate').value;
    if (newDate && item.completed) {
      item.completedDate = newDate;
    } else if (newDate && !item.completed) {
      if (confirm('Setting a completed date will mark this as completed. Continue?')) {
        item.completed = true;
        item.completedDate = newDate;
      }
    }
    saveData();
  }
  editPopup.style.display = 'none';
});

// --- Drag popup ---
function makeDraggable(elmnt, titleId) {
  let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  const header = document.getElementById(titleId);
  if (header) {
    header.onmousedown = dragMouseDown;
  }

  function dragMouseDown(e) {
    e = e || window.event;
    e.preventDefault();
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = closeDragElement;
    document.onmousemove = elementDrag;
  }

  function elementDrag(e) {
    e = e || window.event;
    e.preventDefault();
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
    elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
  }

  function closeDragElement() {
    document.onmouseup = null;
    document.onmousemove = null;
  }
}

makeDraggable(document.getElementById('bucketPopup'), 'popupTitleBar');
makeDraggable(document.getElementById('editPopup'), 'editTitleBar');

// Mobile height adjustment
function setMobileWindowHeight() {
  if (window.innerWidth <= 768) {
    const windowEl = document.querySelector('.window');
    if (windowEl) windowEl.style.height = window.innerHeight + 'px';
  }
}

// Initialize on load
window.addEventListener('DOMContentLoaded', () => {
  loadData();
  setMobileWindowHeight();
});

window.addEventListener('resize', setMobileWindowHeight);
