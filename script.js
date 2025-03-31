let totalSeconds = 120;
let remainingSeconds = totalSeconds;
let interval = null;
let segmentPlan = [];
const container = document.querySelector('.timer-container');
const overlay = document.getElementById('circle-overlay');
const timeDisplay = document.getElementById('time-display');
const segmentRows = document.getElementById('segment-rows');

function getDarkerColor(hex, factor = 0.5) {
  const r = parseInt(hex.substr(1, 2), 16);
  const g = parseInt(hex.substr(3, 2), 16);
  const b = parseInt(hex.substr(5, 2), 16);
  const toHex = x => x.toString(16).padStart(2, '0');
  return `#${toHex(Math.floor(r * factor))}${toHex(Math.floor(g * factor))}${toHex(Math.floor(b * factor))}`;
}

function updateDisplay() {
  const minutes = String(Math.floor(remainingSeconds / 60)).padStart(2, '0');
  const seconds = String(remainingSeconds % 60).padStart(2, '0');
  timeDisplay.textContent = `00:${minutes}:${seconds}`;
  updateSegmentCircle();
}

function updateSegmentCircle() {
  let gradient = '';
  let acc = 0;
  const elapsed = totalSeconds - remainingSeconds;
  container.querySelectorAll('.label').forEach(el => el.remove());

  segmentPlan.forEach(seg => {
    const segStart = acc;
    const segEnd = acc + seg.duration;
    const segStartPct = (segStart / totalSeconds) * 100;
    const segEndPct = (segEnd / totalSeconds) * 100;

    let midPct = segStartPct;
    if (elapsed >= segEnd) midPct = segEndPct;
    else if (elapsed > segStart) midPct = segStartPct + (segEndPct - segStartPct) * ((elapsed - segStart) / seg.duration);

    const dark = getDarkerColor(seg.color);
    gradient += `${dark} ${segStartPct}%, ${dark} ${midPct}%, `;
    gradient += `${seg.color} ${midPct}%, ${seg.color} ${segEndPct}%, `;

    const angle = ((segStartPct + segEndPct) / 2) * 3.6;
    const radians = (angle - 90) * (Math.PI / 180);
    const labelX = 150 + Math.cos(radians) * 130;
    const labelY = 150 + Math.sin(radians) * 130;
    const label = document.createElement('div');
    label.className = 'label';
    label.textContent = seg.name;
    label.style.left = `${labelX}px`;
    label.style.top = `${labelY}px`;
    container.appendChild(label);
    acc += seg.duration;
  });
  overlay.style.background = `conic-gradient(${gradient}#333333 100%)`;
}

function startTimer() {
  if (interval) return;
  interval = setInterval(() => {
    if (remainingSeconds > 0) {
      remainingSeconds--;
      updateDisplay();
    } else {
      clearInterval(interval);
      interval = null;
      alert('時間到！');
    }
  }, 1000);
}

function pauseTimer() {
  clearInterval(interval);
  interval = null;
}

function continueTimer() {
  if (!interval && remainingSeconds > 0) {
    startTimer();
  }
}

function restartTimer() {
  remainingSeconds = totalSeconds;
  updateDisplay();
  startTimer();
}

function stopTimer() {
  pauseTimer();
  remainingSeconds = totalSeconds;
  updateDisplay();
}

function addSegmentRow(name = '任務', percent = 50, color) {
  if (!color) {
    const predefinedColors = ["#66ccff", "#ff6666", "#66ff99", "#ffcc66", "#cc99ff", "#ff99cc"];
    const usedColors = [...document.querySelectorAll('.segColor')].map(input => input.value);
    color = predefinedColors.find(c => !usedColors.includes(c)) || '#66ccff';
  }
  if (segmentRows.children.length >= 6) return alert("最多6項任務");
  const row = document.createElement('div');
  row.className = 'segment-row';
  row.setAttribute('draggable', true);
  row.addEventListener('dragstart', onDragStart);
  row.addEventListener('dragend', onDragEnd);
  row.innerHTML = `
    <input type="text" value="${name}" class="segName">
    <input type="number" value="${percent}" class="segPct" min="1" max="100">%
    <input type="color" value="${color}" class="segColor">
    <button onclick="this.parentElement.remove()">刪除</button>
  `;
  segmentRows.appendChild(row);
}

window.addSegmentRow = addSegmentRow;
window.pauseTimer = pauseTimer;
window.restartTimer = restartTimer;
window.stopTimer = stopTimer;
window.continueTimer = continueTimer;

window.setCustomTime = function() {
  const mins = parseInt(document.getElementById('input-minutes').value);
  if (!mins || mins <= 0) {
    document.getElementById('error-message').textContent = "請輸入有效的時間。";
    return;
  }

  const rows = [...segmentRows.children];
  const totalPct = rows.reduce((sum, row) => sum + parseFloat(row.querySelector('.segPct').value), 0);
  if (totalPct !== 100) {
    document.getElementById('error-message').textContent = "各任務百分比總和不等於100%，請重新調整";
    return;
  } else {
    document.getElementById('error-message').textContent = "";
  }

  segmentPlan = rows.map(row => {
    const name = row.querySelector('.segName').value;
    const percent = parseFloat(row.querySelector('.segPct').value);
    const color = row.querySelector('.segColor').value;
    return {
      name,
      duration: Math.round(mins * 60 * (percent / 100)),
      color
    };
  });

  totalSeconds = mins * 60;
  remainingSeconds = totalSeconds;
  pauseTimer();
  updateDisplay();
  startTimer();
};

function onDragStart(event) {
  event.dataTransfer.setData("text/plain", event.target.dataset.index = [...segmentRows.children].indexOf(event.target));
}

function onDrop(event) {
  const draggedIndex = +event.dataTransfer.getData("text/plain");
  const target = [...segmentRows.children].find(child => child.contains(event.target));
  const targetIndex = [...segmentRows.children].indexOf(target);
  if (draggedIndex >= 0 && targetIndex >= 0 && draggedIndex !== targetIndex) {
    const dragged = segmentRows.children[draggedIndex];
    segmentRows.removeChild(dragged);
    segmentRows.insertBefore(dragged, segmentRows.children[targetIndex]);
  }
  [...segmentRows.children].forEach(el => el.classList.remove('dragging'));
}

function onDragEnd(event) {
  event.target.classList.remove('dragging');
}

// 預設初始化
addSegmentRow("任務 A", 50, "#ff6666");
addSegmentRow("任務 B", 50, "#66ccff");
updateDisplay();
