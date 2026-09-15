const State = {
  user: null,
  token: null,

  folders: [],       // [{id, name, created_at}]
  tasks: [],          // [{id, folder_id, title, description, status, ...}] status: active|done|deleted

  expandedFolderIds: new Set(),   // regular folder ids currently expanded in sidebar
  expandedSpecial: new Set(),      // 'done' | 'deleted'

  activeFolderId: null,   // regular folder id shown in the main content area
  activeSpecial: null,     // 'done' | 'deleted' shown in main content area (mutually exclusive w/ activeFolderId)

  modal: {
    open: false,
    mode: null,       // 'create' | 'edit'
    task: null,        // existing task object when editing
    folderId: null,   // target folder when creating
  },

  // ---- persistence ----
  restoreSession() {
    const token = localStorage.getItem('dm_token');
    const userJson = localStorage.getItem('dm_user');
    if (token && userJson) {
      this.token = token;
      this.user = JSON.parse(userJson);
      Api.setToken(token);
      return true;
    }
    return false;
  },

  saveSession(token, user) {
    this.token = token;
    this.user = user;
    Api.setToken(token);
    localStorage.setItem('dm_token', token);
    localStorage.setItem('dm_user', JSON.stringify(user));
  },

  clearSession() {
    this.token = null;
    this.user = null;
    this.folders = [];
    this.tasks = [];
    this.expandedFolderIds.clear();
    this.expandedSpecial.clear();
    this.activeFolderId = null;
    this.activeSpecial = null;
    Api.setToken(null);
    localStorage.removeItem('dm_token');
    localStorage.removeItem('dm_user');
  },

  // ---- derived getters ----
  tasksInFolder(folderId) {
    return this.tasks.filter(t => t.folder_id === folderId && t.status === 'active');
  },
  tasksByStatus(status) {
    return this.tasks.filter(t => t.status === status);
  },
  folderById(id) {
    return this.folders.find(f => f.id === id);
  },
  taskById(id) {
    return this.tasks.find(t => t.id === id);
  },

  // ---- data loading ----
  async loadAll() {
    const [folders, active, done, deleted] = await Promise.all([
      Api.getFolders(),
      Api.getTasks({ status: 'active' }),
      Api.getTasks({ status: 'done' }),
      Api.getTasks({ status: 'deleted' }),
    ]);
    this.folders = folders;
    this.tasks = [...active, ...done, ...deleted];
  },

  upsertTask(task) {
    const idx = this.tasks.findIndex(t => t.id === task.id);
    if (idx === -1) this.tasks.push(task);
    else this.tasks[idx] = task;
  },

  removeTask(taskId) {
    this.tasks = this.tasks.filter(t => t.id !== taskId);
  },

  removeFolderAndItsTasks(folderId) {
    this.folders = this.folders.filter(f => f.id !== folderId);
    this.tasks = this.tasks.filter(t => t.folder_id !== folderId);
  },
};
