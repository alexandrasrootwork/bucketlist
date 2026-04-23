// --- Data storage (localStorage) ---
let bucketItems = [];

// Load from localStorage
function loadData() {
  const saved = localStorage.getItem('bucketList');
  if (saved) {
    bucketItems = JSON.parse(saved);
  } else {
    // Sample items with local image examples
    bucketItems = [
      { id: Date.now(), title: "Visit Japan", completed: false, notes: "Add image: images/japan.jpg", image: "", completedDate: null },
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

// Helper to fix image path
function getImagePath(path) {
  if (!path) return '';
  // If path doesn't start with images/ and isn't a full URL, add images/
  if (!path.startsWith('images/') && !path.startsWith('http://') && !path.startsWith('https://') && !path.startsWith('data:')) {
    return 'images/' + path;
  }
  return path;
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
    const imagePath = getImagePath(item.image);
    
    div.innerHTML = `
      <div class="item-header">
        <input type="checkbox" class="checkmark" data-id="${item.id}" ${item.completed ? 'checked' : ''}>
        <span class="item-title ${completedClass}">${escapeHtml(item.title)}</span>
        <button class="delete-btn" data-id="${item.id}">✗</button>
      </div>
      <div class="item-details">
        ${item.completedDate ? `<div class="completed-date">✅ Completed: ${escapeHtml(item.completedDate)}</div>` : ''}
        ${item.notes ? `<div class="item-notes">📝 ${escapeHtml(item.notes)}</div>` : ''}
        ${item.image ? `<img src="${escapeHtml(imagePath)}" class="item-image" onerror="this.style.display='none'; this.nextSibling ? this.nextSibling.style.display='inline' : null"><span style="display:none; font-size:10px; color:#999;">⚠️ Image not found. Put ${escapeHtml(item.image)} in your images/ folder</span>` : ''}
        <div>
          <button class="edit-btn" data-id="${item.id}" data-type="notes">✏️ Edit Notes</button>
          <button class="edit-btn" data-id="${item.id}" data-type="image">🖼️ Add/Change Image</button>
          <button class="edit-btn" data-id="${item.id}" data-type="date">📅 Set Completed Date</button>
        </div>
        ${item.image ? `<div style="font-size:9px; color:#888; margin-top:4px;">📁 ${escapeHtml(item.image)}</div>` : ''}
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

// --- Bulk Add Function ---
function openBulkAddPopup() {
  const bulkHtml = `
    <div class="bucket-popup" id="bulkPopup" style="display:flex;">
      <div class="title-bar" id="bulkTitleBar">
        Bulk Add Items
        <div class="buttons">
          <span id="closeBulkPopup">X</span>
        </div>
      </div>
      <div class="content">
        <p style="font-size:11px; margin-bottom:8px;">Enter one item per line:</p>
        <textarea id="bulkItems" placeholder="Visit Japan&#10;Learn French&#10;Run a marathon&#10;Write a book" rows="8" style="width:100%; box-sizing:border-box;"></textarea>
        <p style="font-size:10px; color:#555; margin-top:5px;">Tip: Add notes with a pipe | like "Visit Japan | Cherry blossoms in spring"</p>
        <button type="button" id="confirmBulkButton" class="retro-button">Add All Items</button>
      </div>
    </div>
  `;
  
  const existing = document.getElementById('bulkPopup');
  if (existing) existing.remove();
  
  document.body.insertAdjacentHTML('beforeend', bulkHtml);
  
  const bulkPopup = document.getElementById('bulkPopup');
  const closeBtn = document.getElementById('closeBulkPopup');
  const confirmBtn = document.getElementById('confirmBulkButton');
  const textarea = document.getElementById('bulkItems');
  
  dragElement(bulkPopup, 'bulkTitleBar');
  
  closeBtn.addEventListener('click', () => {
    bulkPopup.remove();
  });
  
  confirmBtn.addEventListener('click', () => {
    const rawText = textarea.value;
    const lines = rawText.split(/\r?\n/);
    let addedCount = 0;
    
    lines.forEach(line => {
      line = line.trim();
      if (line === '') return;
      
      let title = line;
      let notes = '';
      
      if (line.includes('|')) {
        const parts = line.split('|');
        title = parts[0].trim();
        notes = parts.slice(1).join('|').trim();
      }
      
      const newItem = {
        id: Date.now() + addedCount,
        title: title,
        completed: false,
        notes: notes,
        image: '',
        completedDate: null
      };
      
      bucketItems.push(newItem);
      addedCount++;
    });
    
    if (addedCount > 0) {
      saveData();
      alert(`Added ${addedCount} item(s)!`);
      bulkPopup.remove();
    } else {
      alert('No valid items found. Enter one item per line.');
    }
  });
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

// Bulk add button
const bulkAddButton = document.getElementById('bulkAddWindow');
if (bulkAddButton) {
  bulkAddButton.addEventListener('click', () => {
    openBulkAddPopup();
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
  
  // Add helpful placeholder text for images
  if (editImage) {
    editImage.placeholder = 'images/filename.jpg (or just filename.jpg)';
  }
  
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

// --- Drag popup function ---
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

// --- Mobile height adjustment ---
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
