// --- Data storage (localStorage) ---
let bucketItems = [];
let currentFilter = 'all'; // 'all' (pending only) or 'completed'

// Load from localStorage
function loadData() {
  const saved = localStorage.getItem('bucketList');
  if (saved) {
    bucketItems = JSON.parse(saved);
  } else {
    bucketItems = [
      { id: Date.now(), title: "Visit Japan", completed: false, notes: "", image: "", completedDate: null },
      { id: Date.now() + 1, title: "Learn to code", completed: true, notes: "Built this website!", image: "", completedDate: "2025-03-15" }
    ];
  }
  render();
  updateFilterActiveState();
}

// Save to localStorage
function saveData() {
  localStorage.setItem('bucketList', JSON.stringify(bucketItems));
  render();
}

// Update which filter menu item looks active
function updateFilterActiveState() {
  document.querySelectorAll('.filter-option').forEach(el => {
    if (el.dataset.filter === currentFilter) {
      el.classList.add('filter-active');
    } else {
      el.classList.remove('filter-active');
    }
  });
}

// Escape HTML
function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>]/g, function(m) {
    if (m === '&') return '&amp;';
    if (m === '<') return '&lt;';
    if (m === '>') return '&gt;';
    return m;
  });
}

// Get image path
function getImagePath(path) {
  if (!path) return '';
  if (!path.startsWith('images/') && !path.startsWith('http://') && !path.startsWith('https://') && !path.startsWith('data:')) {
    return 'images/' + path;
  }
  return path;
}

// Render items based on current filter
function render() {
  const container = document.getElementById('bucketContainer');
  if (!container) return;
  
  // Keep the info box
  const infoBox = container.querySelector('.info-box');
  container.innerHTML = '';
  if (infoBox) container.appendChild(infoBox);
  
  let filteredItems = [];
  
  if (currentFilter === 'completed') {
    filteredItems = bucketItems.filter(item => item.completed === true);
  } else {
    filteredItems = bucketItems.filter(item => item.completed === false);
  }
  
  if (filteredItems.length === 0) {
    const emptyMsg = document.createElement('div');
    emptyMsg.style.padding = '20px';
    emptyMsg.style.textAlign = 'center';
    emptyMsg.style.color = '#999';
    emptyMsg.innerHTML = currentFilter === 'completed' ? '✅ No completed items yet!' : '📝 No pending items — add something to your bucket list!';
    container.appendChild(emptyMsg);
  }
  
  filteredItems.forEach(item => {
    const div = document.createElement('div');
    div.className = `bucket-item ${item.completed ? 'completed' : ''}`;
    
    const completedClass = item.completed ? 'completed-text' : '';
    const imagePath = getImagePath(item.image);
    
    div.innerHTML = `
      <div class="item-header">
        <input type="checkbox" class="checkmark" data-id="${item.id}" ${item.completed ? 'checked' : ''}>
        <span class="item-title ${completedClass}" data-id="${item.id}" data-title="${escapeHtml(item.title)}">${escapeHtml(item.title)}</span>
        <button class="delete-btn" data-id="${item.id}">✗</button>
      </div>
      <div class="item-details">
        ${item.completedDate ? `<div class="completed-date">✅ Completed: ${escapeHtml(item.completedDate)}</div>` : ''}
        ${item.notes ? `<div class="item-notes">📝 ${escapeHtml(item.notes)}</div>` : ''}
        ${item.image ? `<img src="${escapeHtml(imagePath)}" class="item-image" data-fullsrc="${escapeHtml(imagePath)}" onerror="this.style.display='none'; this.nextSibling ? this.nextSibling.style.display='inline' : null"><span style="display:none; font-size:10px; color:#999;">⚠️ Image not found. Put ${escapeHtml(item.image)} in your images/ folder</span>` : ''}
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
  
  // Title click to edit
  document.querySelectorAll('.item-title').forEach(titleSpan => {
    titleSpan.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = parseInt(titleSpan.dataset.id);
      startEditTitle(id, titleSpan);
    });
  });
  
  // Image click to enlarge
  document.querySelectorAll('.item-image').forEach(img => {
    img.addEventListener('click', (e) => {
      e.stopPropagation();
      const fullSrc = img.dataset.fullsrc || img.src;
      openLightbox(fullSrc);
    });
  });
}

// Lightbox functions
function openLightbox(src) {
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightboxImg');
  if (lightbox && lightboxImg) {
    lightboxImg.src = src;
    lightbox.style.display = 'flex';
  }
}

function closeLightbox() {
  const lightbox = document.getElementById('lightbox');
  if (lightbox) {
    lightbox.style.display = 'none';
  }
}

// Inline title editing
function startEditTitle(id, titleSpan) {
  const currentTitle = titleSpan.dataset.title;
  
  const input = document.createElement('input');
  input.type = 'text';
  input.value = currentTitle;
  input.className = 'title-input';
  
  titleSpan.style.display = 'none';
  titleSpan.parentNode.insertBefore(input, titleSpan);
  input.focus();
  
  function saveEdit() {
    const newTitle = input.value.trim();
    if (newTitle) {
      const item = bucketItems.find(i => i.id === id);
      if (item) {
        item.title = newTitle;
        saveData();
      }
    }
    input.remove();
    titleSpan.style.display = '';
    render();
  }
  
  input.addEventListener('blur', saveEdit);
  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      saveEdit();
    }
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

// Set filter and re-render
function setFilter(filter) {
  currentFilter = filter;
  updateFilterActiveState();
  render();
}

// --- RANDOM SUGGESTION FUNCTION ---
function showRandomSuggestion() {
  // Get only pending (not completed) items
  const pendingItems = bucketItems.filter(item => item.completed === false);
  
  if (pendingItems.length === 0) {
    const randomPopup = document.getElementById('randomPopup');
    const randomContent = document.getElementById('randomContent');
    if (randomContent) {
      randomContent.innerHTML = `
        <div style="text-align: center; padding: 20px;">
          <p>🎉 You've completed everything! 🎉</p>
          <p style="font-size: 11px; margin-top: 10px;">Add more items to get random suggestions.</p>
          <button id="closeRandomEmptyBtn" class="retro-button" style="margin-top: 10px;">Close</button>
        </div>
      `;
      const closeBtn = document.getElementById('closeRandomEmptyBtn');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => {
          if (randomPopup) randomPopup.style.display = 'none';
        });
      }
    }
    if (randomPopup) randomPopup.style.display = 'flex';
    return;
  }
  
  const randomIndex = Math.floor(Math.random() * pendingItems.length);
  const randomItem = pendingItems[randomIndex];
  
  const randomPopup = document.getElementById('randomPopup');
  const randomContent = document.getElementById('randomContent');
  
  if (randomContent) {
    randomContent.innerHTML = `
      <div style="text-align: center;">
        <div style="font-size: 16px; font-weight: bold; margin-bottom: 10px;">🎲 Try this:</div>
        <div style="font-size: 14px; margin-bottom: 10px;">${escapeHtml(randomItem.title)}</div>
        ${randomItem.notes ? `<div style="font-size: 11px; color: #555; margin-top: 5px;">📝 ${escapeHtml(randomItem.notes)}</div>` : ''}
        <div style="margin-top: 15px;">
          <button id="goToRandomItem" class="retro-button" style="margin-right: 5px;">👉 Go to Item</button>
          <button id="anotherRandomItem" class="retro-button">🎲 Another</button>
        </div>
      </div>
    `;
    
    const goToBtn = document.getElementById('goToRandomItem');
    const anotherBtn = document.getElementById('anotherRandomItem');
    
    if (goToBtn) {
      goToBtn.addEventListener('click', () => {
        // Switch to "All" filter to show pending items
        setFilter('all');
        if (randomPopup) randomPopup.style.display = 'none';
        // Scroll to the item and highlight it
        setTimeout(() => {
          const titles = document.querySelectorAll('.item-title');
          for (let title of titles) {
            if (title.dataset.title === randomItem.title) {
              title.scrollIntoView({ behavior: 'smooth', block: 'center' });
              title.style.backgroundColor = '#ffff99';
              setTimeout(() => {
                title.style.backgroundColor = '';
              }, 2000);
              break;
            }
          }
        }, 100);
      });
    }
    
    if (anotherBtn) {
      anotherBtn.addEventListener('click', () => {
        showRandomSuggestion();
      });
    }
  }
  
  if (randomPopup) randomPopup.style.display = 'flex';
}

// --- HOW TO USE FUNCTION ---
function showHowToUse() {
  const howToHtml = `
    <div class="bucket-popup" id="howToPopup" style="display:flex; width: 400px;">
      <div class="title-bar" id="howToTitleBar">
        📖 How to Use
        <div class="buttons">
          <span id="closeHowToPopup">X</span>
        </div>
      </div>
      <div class="content">
        <p><strong>📝 Adding Items:</strong><br>Click "Add Item" or use "Bulk Add" to add multiple at once.</p>
        <p><strong>✅ Completing Items:</strong><br>Check the box to mark as complete. Date is added automatically.</p>
        <p><strong>✏️ Editing:</strong><br>Click any title to edit it. Use the buttons below each item for notes, images, or dates.</p>
        <p><strong>🖼️ Images:</strong><br>Put photos in an "images/" folder. Type "images/photo.jpg" when adding.</p>
        <p><strong>🎲 Random:</strong><br>Get a random suggestion from your pending items.</p>
        <p><strong>💾 Backup:</strong><br>Use Export/Import in the Help menu to save or transfer your data.</p>
        <button id="closeHowToBtn" class="retro-button" style="margin-top: 10px;">Got it!</button>
      </div>
    </div>
  `;
  
  const existing = document.getElementById('howToPopup');
  if (existing) existing.remove();
  
  document.body.insertAdjacentHTML('beforeend', howToHtml);
  
  const howToPopup = document.getElementById('howToPopup');
  const closeBtn = document.getElementById('closeHowToPopup');
  const closeBtn2 = document.getElementById('closeHowToBtn');
  
  dragElement(howToPopup, 'howToTitleBar');
  
  const closePopupFunc = () => howToPopup.remove();
  if (closeBtn) closeBtn.addEventListener('click', closePopupFunc);
  if (closeBtn2) closeBtn2.addEventListener('click', closePopupFunc);
}

// --- MOBILE-FRIENDLY EXPORT FUNCTION ---
function exportData() {
  const dataStr = JSON.stringify(bucketItems, null, 2);
  
  try {
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bucketlist-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    alert('✅ Bucket list exported! Check your downloads folder.');
  } catch (err) {
    // Fallback: copy to clipboard
    const textarea = document.createElement('textarea');
    textarea.value = dataStr;
    textarea.style.position = 'fixed';
    textarea.style.top = '-1000px';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      alert('✅ Data copied to clipboard! Paste into a text editor and save as .json');
    } catch (e) {
      alert('❌ Could not export. Your browser may not support this feature.');
    }
    document.body.removeChild(textarea);
  }
}

// --- IMPORT FUNCTION ---
function importData() {
  const importHtml = `
    <div class="bucket-popup" id="importPopup" style="display:flex; width: 450px; max-width: 90%;">
      <div class="title-bar" id="importTitleBar">
        Import Bucket List
        <div class="buttons">
          <span id="closeImportPopup">X</span>
        </div>
      </div>
      <div class="content">
        <p style="font-size:11px; margin-bottom:8px;">Paste your exported JSON data below:</p>
        <textarea id="importJsonData" placeholder='[{"id":123,"title":"Visit Japan","completed":false,...}]' rows="10" style="width:100%; box-sizing:border-box; font-family: monospace; font-size: 11px;"></textarea>
        <p style="font-size:10px; color:#555; margin-top:5px;">Or <button type="button" id="uploadFileBtn" class="retro-button" style="margin-top:0; padding:2px 6px;">📁 Upload JSON file</button></p>
        <button type="button" id="confirmImportButton" class="retro-button">Import Data</button>
      </div>
    </div>
  `;
  
  const existing = document.getElementById('importPopup');
  if (existing) existing.remove();
  
  document.body.insertAdjacentHTML('beforeend', importHtml);
  
  const importPopup = document.getElementById('importPopup');
  const closeBtn = document.getElementById('closeImportPopup');
  const confirmBtn = document.getElementById('confirmImportButton');
  const textarea = document.getElementById('importJsonData');
  const uploadBtn = document.getElementById('uploadFileBtn');
  
  dragElement(importPopup, 'importTitleBar');
  
  closeBtn.addEventListener('click', () => {
    importPopup.remove();
  });
  
  uploadBtn.addEventListener('click', () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json,application/json';
    
    fileInput.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const content = event.target.result;
          JSON.parse(content);
          textarea.value = content;
          alert('✅ File loaded! Click "Import Data" to confirm.');
        } catch (err) {
          alert('❌ Invalid JSON file.');
        }
      };
      reader.readAsText(file);
    };
    
    fileInput.click();
  });
  
  confirmBtn.addEventListener('click', () => {
    const jsonText = textarea.value.trim();
    if (!jsonText) {
      alert('Please paste JSON data or upload a file.');
      return;
    }
    
    try {
      const importedItems = JSON.parse(jsonText);
      
      if (Array.isArray(importedItems)) {
        const valid = importedItems.every(item => 
          item.hasOwnProperty('id') && 
          item.hasOwnProperty('title') && 
          item.hasOwnProperty('completed') !== undefined
        );
        
        if (valid) {
          if (confirm(`Import ${importedItems.length} items? This will replace your current bucket list.`)) {
            bucketItems = importedItems;
            saveData();
            alert(`✅ Imported ${importedItems.length} items successfully!`);
            importPopup.remove();
          }
        } else {
          alert('❌ Invalid file format. Missing required fields.');
        }
      } else {
        alert('❌ Invalid format. Expected an array of items.');
      }
    } catch (err) {
      alert('❌ Invalid JSON. Make sure you copied the entire export data correctly.');
    }
  });
}

// Bulk Add Function
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

// --- Drag function ---
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

// --- Initialize everything when page loads ---
window.addEventListener('DOMContentLoaded', () => {
  loadData();
  setMobileWindowHeight();
  
  // Menu button listeners
  const openAddButton = document.getElementById('openAddWindow');
  if (openAddButton) {
    openAddButton.addEventListener('click', () => {
      const titleInput = document.getElementById('itemTitle');
      const notesInput = document.getElementById('itemNotes');
      const imageInput = document.getElementById('itemImage');
      if (titleInput) titleInput.value = '';
      if (notesInput) notesInput.value = '';
      if (imageInput) imageInput.value = '';
      const popup = document.getElementById('bucketPopup');
      if (popup) popup.style.display = 'flex';
    });
  }
  
  const bulkAddButton = document.getElementById('bulkAddWindow');
  if (bulkAddButton) {
    bulkAddButton.addEventListener('click', openBulkAddPopup);
  }
  
  const filterAll = document.getElementById('filterAll');
  const filterCompleted = document.getElementById('filterCompleted');
  if (filterAll) filterAll.addEventListener('click', () => setFilter('all'));
  if (filterCompleted) filterCompleted.addEventListener('click', () => setFilter('completed'));
  
  const randomButton = document.getElementById('randomItem');
  if (randomButton) {
    randomButton.addEventListener('click', showRandomSuggestion);
  }
  
  const exportButton = document.getElementById('exportData');
  if (exportButton) {
    exportButton.addEventListener('click', exportData);
  }
  
  const importButton = document.getElementById('importData');
  if (importButton) {
    importButton.addEventListener('click', importData);
  }
  
  const howToButton = document.getElementById('howToUse');
  if (howToButton) {
    howToButton.addEventListener('click', showHowToUse);
  }
  
  // Popup close buttons
  const closePopup = document.getElementById('closePopup');
  if (closePopup) {
    closePopup.addEventListener('click', () => {
      const popup = document.getElementById('bucketPopup');
      if (popup) popup.style.display = 'none';
    });
  }
  
  const closeEditPopup = document.getElementById('closeEditPopup');
  if (closeEditPopup) {
    closeEditPopup.addEventListener('click', () => {
      const editPopup = document.getElementById('editPopup');
      if (editPopup) editPopup.style.display = 'none';
    });
  }
  
  const closeRandomPopup = document.getElementById('closeRandomPopup');
  if (closeRandomPopup) {
    closeRandomPopup.addEventListener('click', () => {
      const randomPopup = document.getElementById('randomPopup');
      if (randomPopup) randomPopup.style.display = 'none';
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
      const popup = document.getElementById('bucketPopup');
      if (popup) popup.style.display = 'none';
    });
  }
  
  // Save edit changes
  const saveEditButton = document.getElementById('saveEditButton');
  if (saveEditButton) {
    saveEditButton.addEventListener('click', () => {
      const item = bucketItems.find(i => i.id === window.currentEditId);
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
      const editPopup = document.getElementById('editPopup');
      if (editPopup) editPopup.style.display = 'none';
    });
  }
  
  // Make popups draggable
  const bucketPopup = document.getElementById('bucketPopup');
  const editPopupEl = document.getElementById('editPopup');
  const randomPopupEl = document.getElementById('randomPopup');
  if (bucketPopup) dragElement(bucketPopup, 'popupTitleBar');
  if (editPopupEl) dragElement(editPopupEl, 'editTitleBar');
  if (randomPopupEl) dragElement(randomPopupEl, 'randomTitleBar');
  
  // Lightbox close
  const lightbox = document.getElementById('lightbox');
  const closeLightboxBtn = document.querySelector('.close-lightbox');
  if (lightbox) {
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) closeLightbox();
    });
  }
  if (closeLightboxBtn) {
    closeLightboxBtn.addEventListener('click', closeLightbox);
  }
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && lightbox && lightbox.style.display === 'flex') {
      closeLightbox();
    }
  });
});

// Store currentEditId globally
window.currentEditId = null;

function openEditPopup(id, type) {
  window.currentEditId = id;
  const item = bucketItems.find(i => i.id === id);
  if (!item) return;
  
  const editNotes = document.getElementById('editNotes');
  const editImage = document.getElementById('editImage');
  const editDate = document.getElementById('editDate');
  
  if (editNotes) editNotes.value = item.notes || '';
  if (editImage) editImage.value = item.image || '';
  if (editDate) editDate.value = item.completedDate || '';
  
  if (editImage) {
    editImage.placeholder = 'images/filename.jpg (or just filename.jpg)';
  }
  
  const editPopup = document.getElementById('editPopup');
  if (editPopup) editPopup.style.display = 'flex';
}

// Mobile height
function setMobileWindowHeight() {
  if (window.innerWidth <= 768) {
    const windowEl = document.querySelector('.window');
    if (windowEl) {
      windowEl.style.height = window.innerHeight + 'px';
    }
  }
}

window.addEventListener('resize', setMobileWindowHeight);
