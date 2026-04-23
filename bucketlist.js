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
        </div>
      `;
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
        randomPopup.style.display = 'none';
        // Scroll to the item (simple highlight effect)
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
  
  const closePopup = () => howToPopup.remove();
  if (closeBtn) closeBtn.addEventListener('click', closePopup);
  if (closeBtn2) closeBtn2.addEventListener('click', closePopup);
}

// Add event listeners for new buttons (add these after your existing event listeners)
const randomButton = document.getElementById('randomItem');
if (randomButton) {
  randomButton.addEventListener('click', showRandomSuggestion);
}

const howToButton = document.getElementById('howToUse');
if (howToButton) {
  howToButton.addEventListener('click', showHowToUse);
}

// Random popup close
const closeRandomPopup = document.getElementById('closeRandomPopup');
if (closeRandomPopup) {
  closeRandomPopup.addEventListener('click', () => {
    const randomPopup = document.getElementById('randomPopup');
    if (randomPopup) randomPopup.style.display = 'none';
  });
}

// Make random popup draggable
const randomPopup = document.getElementById('randomPopup');
if (randomPopup) dragElement(randomPopup, 'randomTitleBar');
