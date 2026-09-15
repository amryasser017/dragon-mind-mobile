// Icon paths point at the real brand assets (assets/icons/*.svg)
const ICON = {
  folder: 'assets/icons/folder.svg',
  markDone: 'assets/icons/completed.svg',
  undo: 'assets/icons/restore.svg',
  trash: 'assets/icons/trash-small.svg',
  restore: 'assets/icons/restore.svg',
};

function iconImg(src, alt = '') {
  return `<img class="icon" src="${src}" alt="${alt}" />`;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}

function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.remove('hidden');
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => toast.classList.add('hidden'), 2200);
}

function initials(email) {
  return (email || '?').trim()[0].toUpperCase();
}

// ============ SIDEBAR ============

function renderSidebar() {
  renderRegularFolders();
  renderSpecialTaskList('done', document.getElementById('tasks-done'));
  renderSpecialTaskList('deleted', document.getElementById('tasks-deleted'));

  document.getElementById('done-count').textContent = State.tasksByStatus('done').length;
  document.getElementById('deleted-count').textContent = State.tasksByStatus('deleted').length;

  const doneFolderEl = document.getElementById('folder-done');
  const deletedFolderEl = document.getElementById('folder-deleted');
  doneFolderEl.classList.toggle('expanded', State.expandedSpecial.has('done'));
  doneFolderEl.classList.toggle('active', State.activeSpecial === 'done');
  deletedFolderEl.classList.toggle('expanded', State.expandedSpecial.has('deleted'));
  deletedFolderEl.classList.toggle('active', State.activeSpecial === 'deleted');

  document.getElementById('user-email-label').textContent = State.user?.email || '';
  document.getElementById('user-avatar').textContent = initials(State.user?.email);
}

function renderRegularFolders() {
  const container = document.getElementById('folder-list');
  container.innerHTML = '';

  for (const folder of State.folders) {
    const expanded = State.expandedFolderIds.has(folder.id);
    const active = State.activeFolderId === folder.id;
    const tasks = State.tasksInFolder(folder.id);

    const item = document.createElement('div');
    item.className = `folder-item${expanded ? ' expanded' : ''}${active ? ' active' : ''}`;
    item.dataset.folderId = folder.id;

    item.innerHTML = `
      <div class="folder-row" role="button" tabindex="0" data-action="select-folder">
        <svg class="icon folder-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M9 5 L16 12 L9 19" stroke-linecap="round" stroke-linejoin="round"/></svg>
        <img class="icon folder-icon" src="${ICON.folder}" alt="" />
        <span class="folder-name label-text" data-action="rename-target">${escapeHtml(folder.name)}</span>
        <span class="folder-count label-text">${tasks.length}</span>
        <span class="folder-actions">
          <button class="icon-btn" type="button" data-action="delete-folder" title="Delete folder" aria-label="Delete folder">
            ${iconImg(ICON.trash)}
          </button>
        </span>
      </div>
      <div class="task-list">
        ${tasks.length ? tasks.map(t => taskRowHtml(t, 'active')).join('') : `<div class="task-empty-hint">No flames yet</div>`}
      </div>
    `;
    container.appendChild(item);
  }
}

function renderSpecialTaskList(status, containerEl) {
  const tasks = State.tasksByStatus(status);
  containerEl.innerHTML = tasks.length
    ? tasks.map(t => taskRowHtml(t, status)).join('')
    : `<div class="task-empty-hint">Empty</div>`;
}

function taskRowHtml(task, context) {
  const isDone = task.status === 'done';
  let actions = '';
  if (context === 'active') {
    actions = `
      <button class="icon-btn" type="button" data-action="mark-done" data-task-id="${task.id}" title="Mark as done" aria-label="Mark as done">${iconImg(ICON.markDone)}</button>
      <button class="icon-btn" type="button" data-action="delete-task" data-task-id="${task.id}" title="Delete" aria-label="Delete">${iconImg(ICON.trash)}</button>
    `;
  } else if (context === 'done') {
    actions = `
      <button class="icon-btn" type="button" data-action="unmark-done" data-task-id="${task.id}" title="Mark as not completed" aria-label="Mark as not completed">${iconImg(ICON.undo)}</button>
      <button class="icon-btn" type="button" data-action="delete-task" data-task-id="${task.id}" title="Delete" aria-label="Delete">${iconImg(ICON.trash)}</button>
    `;
  } else if (context === 'deleted') {
    actions = `
      <button class="icon-btn" type="button" data-action="restore-task" data-task-id="${task.id}" title="Restore" aria-label="Restore">${iconImg(ICON.restore)}</button>
      <button class="icon-btn" type="button" data-action="delete-forever" data-task-id="${task.id}" title="Delete forever" aria-label="Delete forever">${iconImg(ICON.trash)}</button>
    `;
  }

  return `
    <div class="task-row${isDone ? ' is-done' : ''}" data-task-id="${task.id}">
      <button class="task-row-title" type="button" data-action="open-task" data-task-id="${task.id}">${escapeHtml(task.title)}</button>
      <span class="task-row-actions">${actions}</span>
    </div>
  `;
}

// ============ MAIN CONTENT ============

function renderMainContent() {
  const emptyState = document.getElementById('empty-state');
  const folderView = document.getElementById('folder-view');
  const newTaskBtn = document.getElementById('new-task-btn');

  if (!State.activeFolderId && !State.activeSpecial) {
    emptyState.classList.remove('hidden');
    folderView.classList.add('hidden');
    newTaskBtn.classList.add('hidden');
    return;
  }

  emptyState.classList.add('hidden');
  folderView.classList.remove('hidden');

  const title = document.getElementById('active-folder-title');
  const tasksContainer = document.getElementById('folder-view-tasks');

  let tasks, context;
  if (State.activeSpecial === 'done') {
    title.textContent = 'Completed Flames';
    tasks = State.tasksByStatus('done');
    context = 'done';
    newTaskBtn.classList.add('hidden');
  } else if (State.activeSpecial === 'deleted') {
    title.textContent = 'Trash';
    tasks = State.tasksByStatus('deleted');
    context = 'deleted';
    newTaskBtn.classList.add('hidden');
  } else {
    const folder = State.folderById(State.activeFolderId);
    title.textContent = folder ? folder.name : '';
    tasks = State.tasksInFolder(State.activeFolderId);
    context = 'active';
    newTaskBtn.classList.remove('hidden');
  }

  const query = (document.getElementById('search-input').value || '').trim().toLowerCase();
  const visibleTasks = query ? tasks.filter(t => t.title.toLowerCase().includes(query)) : tasks;

  tasksContainer.innerHTML = visibleTasks.length
    ? visibleTasks.map(t => taskCardHtml(t, context)).join('')
    : `<p class="folder-view-empty">${query ? 'No flames match your search.' : 'Nothing here yet.'}</p>`;
}

function taskCardHtml(task, context) {
  const isDone = task.status === 'done';
  let actions = '';
  if (context === 'active') {
    actions = `
      <button class="icon-btn" type="button" data-action="mark-done" data-task-id="${task.id}" title="Mark as done" aria-label="Mark as done">${iconImg(ICON.markDone)}</button>
      <button class="icon-btn" type="button" data-action="delete-task" data-task-id="${task.id}" title="Delete" aria-label="Delete">${iconImg(ICON.trash)}</button>
    `;
  } else if (context === 'done') {
    actions = `
      <button class="icon-btn" type="button" data-action="unmark-done" data-task-id="${task.id}" title="Mark as not completed" aria-label="Mark as not completed">${iconImg(ICON.undo)}</button>
      <button class="icon-btn" type="button" data-action="delete-task" data-task-id="${task.id}" title="Delete" aria-label="Delete">${iconImg(ICON.trash)}</button>
    `;
  } else if (context === 'deleted') {
    actions = `
      <button class="icon-btn" type="button" data-action="restore-task" data-task-id="${task.id}" title="Restore" aria-label="Restore">${iconImg(ICON.restore)}</button>
      <button class="icon-btn" type="button" data-action="delete-forever" data-task-id="${task.id}" title="Delete forever" aria-label="Delete forever">${iconImg(ICON.trash)}</button>
    `;
  }

  return `
    <div class="task-card${isDone ? ' is-done' : ''}" data-task-id="${task.id}" data-action="open-task">
      <div class="task-card-body">
        <p class="task-card-title">${escapeHtml(task.title)}</p>
        ${task.description ? `<p class="task-card-desc">${escapeHtml(task.description)}</p>` : ''}
      </div>
      <div class="task-card-actions">${actions}</div>
    </div>
  `;
}

// ============ MODAL ============

function openTaskModal({ mode, task = null, folderId = null }) {
  State.modal = { open: true, mode, task, folderId };
  const overlay = document.getElementById('task-modal-overlay');
  const titleInput = document.getElementById('task-title-input');
  const descInput = document.getElementById('task-desc-input');
  document.getElementById('task-modal-error').textContent = '';

  titleInput.value = task ? task.title : '';
  descInput.value = task ? (task.description || '') : '';

  overlay.classList.remove('hidden');
  setTimeout(() => titleInput.focus(), 0);
}

function closeTaskModal() {
  State.modal = { open: false, mode: null, task: null, folderId: null };
  document.getElementById('task-modal-overlay').classList.add('hidden');
}

function renderAll() {
  renderSidebar();
  renderMainContent();
}
