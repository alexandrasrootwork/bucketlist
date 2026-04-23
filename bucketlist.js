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

// Escape HTML to prevent XSS
function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>]/g, function(m) {
    if (m === '&') return '&amp;';
    if (m === '<') return '&lt;';
    if (m === '>') return '&gt;';
    return m;
  });
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
        ${item.completedDate ? `<div class="completed-date">✅ Completed: ${escapeHtml(item.completedDate)}</div>` : ''}
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
  const progressPercent = document.getElementById('progressPercent');
  const progressFill = document.getElementById('progressFill');
  if (progressPercent) progressPercent.innerText = percent;
  if (progressFill) progressFill.style.width = percent + '%';
  
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

// Open add popup
const openAddButton = document.getElementById('openAddWindow');
if (openAddButton) {
  openAddButton.addEventListener('click', () => {
    const titleInput = document.getElementById('itemTitle');
    const notesInput = document.getElementById('itemNotes');
    const imageInput = document.getElementById('itemImage');
    if (titleInput) titleInput.value = '';
    if (notesInput) notesInput.value = '';
    if (imageInput) imageInput.value = '';
    if (popup) popup.style.display = 'flex';
  });
}

// Close add popup
const closePopup = document.getElementById('closePopup');
if (closePopup) {
  closePopup.addEventListener('click', () => {
    if (popup) popup.style.display = 'none';
  });
}

// Close edit popup
const closeEditPopup = document.getElementById('closeEditPopup');
if (closeEditPopup) {
  closeEditPopup.addEventListener('click', () => {
    if (editPopup) editPopup.style.display = 'none';
  });
}

// Submit new item
const submitButton = document.getElementById('submitButton');
if (submitButton) {
  submitButton.addEventListener('click', () => {
    const titleInput = document.getElementById('itemTitle');
    const title = titleInput ? titleInput.value.trim() : '';
    if (!title) {
      alert('Please enter a title!');
      return;
    }
    
    const notesInput = document.getElementById('itemNotes');
    const imageInput = document.getElementById('itemImage');
    
    const newItem = {
      id: Date.now(),
      title: title,
      completed: false,
      notes: notesInput ? notesInput.value.trim() : '',
      image: imageInput ? imageInput.value.trim() : '',
      completedDate: null
    };
    
    bucketItems.push(newItem);
    saveData();
    if (popup) popup.style.display = 'none';
  });
}

// Open edit popup
function openEditPopup(id, type) {
  currentEditId = id;
  const item = bucketItems.find(i => i.id === id);
  if (!item) return;
  
  const editNotes = document.getElementById('editNotes');
  const editImage = document.getElementById('editImage');
  const editDate = document.getElementById('editDate');
  
  if (editNotes) editNotes.value = item.notes || '';
  if (editImage) editImage.value = item.image || '';
  if (editDate) editDate.value = item.completedDate || '';
  
  if (editPopup) editPopup.style.display = 'flex';
}

// Save edit changes
const saveEditButton = document.getElementById('saveEditButton');
if (saveEditButton) {
  saveEditButton.addEventListener('click', () => {
    const item = bucketItems.find(i => i.id === currentEditId);
    if (item) {
      const editNotes = document.getElementById('editNotes');
      const editImage = document.getElementById('editImage');
      const editDate = document.getElementById('editDate');
      
      item.notes = editNotes ? editNotes.value.trim() : '';
      item.image = editImage ? editImage.value.trim() : '';
      const newDate = editDate ? editDate.value : '';
      
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
    if (editPopup) editPopup.style.display = 'none';
  });
}

// --- Drag popup function (from your original) ---
function dragElement(elmnt, titleId) {
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

// Make popups draggable
const bucketPopup = document.getElementById('bucketPopup');
const editPopupEl = document.getElementById('editPopup');
if (bucketPopup) dragElement(bucketPopup, 'popupTitleBar');
if (editPopupEl) dragElement(editPopupEl, 'editTitleBar');

// --- Mobile height adjustment (from your original) ---
function setMobileWindowHeight() {
  if (window.innerWidth <= 768) {
    const windowEl = document.querySelector('.window');
    if (windowEl) {
      windowEl.style.height = window.innerHeight + 'px';
    }
  }
}

// Initialize on load
window.addEventListener('DOMContentLoaded', () => {
  loadData();
  setMobileWindowHeight();
});

window.addEventListener('resize', setMobileWindowHeight);
