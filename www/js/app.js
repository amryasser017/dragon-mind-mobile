// ============ AUTH SCREEN WIRING ============

function switchAuthTab(tab) {
  document.querySelectorAll('.auth-tab').forEach(btn => btn.classList.toggle('active', btn.dataset.tab === tab));
  document.getElementById('login-form').classList.toggle('hidden', tab !== 'login');
  document.getElementById('signup-form').classList.toggle('hidden', tab !== 'signup');
}

document.querySelectorAll('.auth-tab').forEach(btn => {
  btn.addEventListener('click', () => switchAuthTab(btn.dataset.tab));
});

document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const errorEl = document.getElementById('login-error');
  errorEl.textContent = '';
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  try {
    const { token, user } = await Api.login(email, password);
    State.saveSession(token, user);
    await enterApp();
  } catch (err) {
    errorEl.textContent = err.message;
  }
});

document.getElementById('signup-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const errorEl = document.getElementById('signup-error');
  errorEl.textContent = '';
  const email = document.getElementById('signup-email').value;
  const password = document.getElementById('signup-password').value;
  try {
    const { token, user } = await Api.signup(email, password);
    State.saveSession(token, user);
    await enterApp();
  } catch (err) {
    errorEl.textContent = err.message;
  }
});

function doLogout() {
  State.clearSession();
  document.getElementById('app-screen').classList.add('hidden');
  document.getElementById('auth-screen').classList.remove('hidden');
  document.getElementById('login-form').reset();
  document.getElementById('signup-form').reset();
}
document.getElementById('logout-btn').addEventListener('click', doLogout);
document.getElementById('logout-btn-top').addEventListener('click', doLogout);

document.getElementById('settings-btn').addEventListener('click', () => {
  showToast('Settings coming soon.');
});

async function enterApp() {
  try {
    await State.loadAll();
  } catch (err) {
    showToast(err.message);
    return;
  }
  document.getElementById('auth-screen').classList.add('hidden');
  document.getElementById('app-screen').classList.remove('hidden');
  renderAll();
}

// ============ SIDEBAR COLLAPSE / EXPAND ============

const sidebar = document.getElementById('sidebar');
const expandCatcher = document.getElementById('sidebar-expand-catcher');

document.getElementById('sidebar-toggle').addEventListener('click', () => {
  sidebar.classList.add('collapsed');
  expandCatcher.classList.remove('hidden');
});

function expandSidebar() {
  sidebar.classList.remove('collapsed');
  expandCatcher.classList.add('hidden');
}
expandCatcher.addEventListener('click', expandSidebar);

// Pressing on any part of a collapsed sidebar expands it
sidebar.addEventListener('click', (e) => {
  if (sidebar.classList.contains('collapsed')) {
    expandSidebar();
    e.stopPropagation();
    e.preventDefault();
  }
}, true);

// ============ NEW FOLDER ============

document.getElementById('new-folder-btn').addEventListener('click', async () => {
  try {
    const folder = await Api.createFolder('New Folder');
    State.folders.push(folder);
    renderSidebar();
    beginRenameFolder(folder.id);
  } catch (err) {
    showToast(err.message);
  }
});

document.getElementById('new-folder-btn-2').addEventListener('click', () => {
  document.getElementById('new-folder-btn').click();
});

document.getElementById('search-input').addEventListener('input', () => {
  renderMainContent();
});

function beginRenameFolder(folderId) {
  const nameEl = document.querySelector(`.folder-item[data-folder-id="${folderId}"] .folder-name`);
  if (nameEl) startRenameEditing(nameEl, folderId);
}

function startRenameEditing(nameEl, folderId) {
  nameEl.contentEditable = 'true';
  nameEl.focus();
  document.execCommand('selectAll', false, null);

  const finish = async (commit) => {
    nameEl.contentEditable = 'false';
    nameEl.removeEventListener('blur', onBlur);
    nameEl.removeEventListener('keydown', onKeydown);
    const newName = nameEl.textContent.trim();
    const folder = State.folderById(folderId);
    if (commit && newName && newName !== folder.name) {
      try {
        const updated = await Api.renameFolder(folderId, newName);
        Object.assign(folder, updated);
      } catch (err) {
        showToast(err.message);
      }
    }
    renderSidebar();
  };

  const onBlur = () => finish(true);
  const onKeydown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); nameEl.blur(); }
    if (e.key === 'Escape') { e.preventDefault(); finish(false); }
  };

  nameEl.addEventListener('blur', onBlur);
  nameEl.addEventListener('keydown', onKeydown);
}

// ============ SIDEBAR CLICK DELEGATION ============

document.getElementById('folder-list').addEventListener('click', handleFolderListClick);
document.querySelector('.special-folders').addEventListener('click', handleSpecialFoldersClick);

function handleFolderListClick(e) {
  const item = e.target.closest('.folder-item');
  if (!item) return;
  const folderId = Number(item.dataset.folderId);

  const deleteBtn = e.target.closest('[data-action="delete-folder"]');
  if (deleteBtn) {
    e.stopPropagation();
    confirmDeleteFolder(folderId);
    return;
  }

  const taskAction = e.target.closest('[data-action]');
  if (taskAction && taskAction.dataset.taskId) {
    handleTaskAction(taskAction.dataset.action, Number(taskAction.dataset.taskId));
    return;
  }

  const nameEl = e.target.closest('[data-action="rename-target"]');
  if (nameEl) {
    if (nameEl.contentEditable === 'true') return; // already editing

    const now = Date.now();
    const last = renameClickTimestamps[folderId] || 0;
    if (now - last < 400) {
      // second tap/click within the window -> enter rename mode, skip the toggle
      renameClickTimestamps[folderId] = 0;
      startRenameEditing(nameEl, folderId);
      return;
    }
    renameClickTimestamps[folderId] = now;
  }

  const row = e.target.closest('[data-action="select-folder"]');
  if (row) {
    selectFolder(folderId);
  }
}

const renameClickTimestamps = {};

function handleSpecialFoldersClick(e) {
  const taskAction = e.target.closest('[data-action]');
  if (taskAction && taskAction.dataset.taskId) {
    handleTaskAction(taskAction.dataset.action, Number(taskAction.dataset.taskId));
    return;
  }

  const item = e.target.closest('.folder-item.special');
  if (!item) return;
  const special = item.dataset.special;
  selectSpecial(special);
}

function selectFolder(folderId) {
  const alreadyExpanded = State.expandedFolderIds.has(folderId);
  if (alreadyExpanded) {
    State.expandedFolderIds.delete(folderId);
  } else {
    State.expandedFolderIds.add(folderId);
  }
  State.activeFolderId = folderId;
  State.activeSpecial = null;
  renderAll();
}

function selectSpecial(special) {
  const alreadyExpanded = State.expandedSpecial.has(special);
  if (alreadyExpanded) {
    State.expandedSpecial.delete(special);
  } else {
    State.expandedSpecial.add(special);
  }
  State.activeSpecial = special;
  State.activeFolderId = null;
  renderAll();
}

async function confirmDeleteFolder(folderId) {
  const folder = State.folderById(folderId);
  if (!folder) return;
  const ok = confirm(`Delete "${folder.name}" and all its tasks? This can't be undone.`);
  if (!ok) return;
  try {
    await Api.deleteFolder(folderId);
    State.removeFolderAndItsTasks(folderId);
    if (State.activeFolderId === folderId) State.activeFolderId = null;
    State.expandedFolderIds.delete(folderId);
    renderAll();
    showToast('Folder deleted.');
  } catch (err) {
    showToast(err.message);
  }
}

// ============ MAIN CONTENT ============

document.getElementById('new-task-btn').addEventListener('click', () => {
  if (!State.activeFolderId) return;
  openTaskModal({ mode: 'create', folderId: State.activeFolderId });
});

document.getElementById('folder-view-tasks').addEventListener('click', (e) => {
  const actionEl = e.target.closest('[data-action]');
  if (!actionEl || !actionEl.dataset.taskId) return;
  const action = actionEl.dataset.action;
  const taskId = Number(actionEl.dataset.taskId);

  if (action === 'open-task') {
    openTaskModal({ mode: 'edit', task: State.taskById(taskId) });
    return;
  }
  handleTaskAction(action, taskId);
});

// ============ TASK ACTIONS (shared by sidebar + main content) ============

async function handleTaskAction(action, taskId) {
  const task = State.taskById(taskId);
  if (!task) return;

  try {
    if (action === 'open-task') {
      openTaskModal({ mode: 'edit', task });
    } else if (action === 'mark-done') {
      const updated = await Api.setTaskStatus(taskId, 'done');
      State.upsertTask(updated);
      renderAll();
    } else if (action === 'unmark-done') {
      const updated = await Api.setTaskStatus(taskId, 'active');
      State.upsertTask(updated);
      renderAll();
    } else if (action === 'delete-task') {
      const updated = await Api.setTaskStatus(taskId, 'deleted');
      State.upsertTask(updated);
      renderAll();
    } else if (action === 'restore-task') {
      const updated = await Api.setTaskStatus(taskId, 'active');
      State.upsertTask(updated);
      renderAll();
    } else if (action === 'delete-forever') {
      const ok = confirm(`Permanently delete "${task.title}"? This can't be undone.`);
      if (!ok) return;
      await Api.deleteTaskForever(taskId);
      State.removeTask(taskId);
      renderAll();
    }
  } catch (err) {
    showToast(err.message);
  }
}

// ============ TASK MODAL ============

async function saveModalTask() {
  const title = document.getElementById('task-title-input').value.trim();
  const description = document.getElementById('task-desc-input').value.trim();
  const errorEl = document.getElementById('task-modal-error');

  if (!title) {
    errorEl.textContent = 'Please enter a title.';
    return false;
  }

  try {
    if (State.modal.mode === 'create') {
      const task = await Api.createTask(State.modal.folderId, title, description);
      State.upsertTask(task);
    } else {
      const task = await Api.updateTask(State.modal.task.id, { title, description });
      State.upsertTask(task);
    }
    renderAll();
    return true;
  } catch (err) {
    errorEl.textContent = err.message;
    return false;
  }
}

document.getElementById('task-save-btn').addEventListener('click', async () => {
  const ok = await saveModalTask();
  if (ok) closeTaskModal();
});

document.getElementById('task-discard-btn').addEventListener('click', () => {
  closeTaskModal();
});

document.getElementById('task-modal-overlay').addEventListener('mousedown', async (e) => {
  if (e.target.id !== 'task-modal-overlay') return; // only the backdrop, not the card
  const title = document.getElementById('task-title-input').value.trim();
  if (!title) {
    closeTaskModal(); // nothing worth saving - discard quietly
    return;
  }
  const ok = await saveModalTask();
  if (ok) closeTaskModal();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && State.modal.open) closeTaskModal();
});

// ============ INIT ============

(async function init() {
  if (State.restoreSession()) {
    await enterApp();
  }
})();
