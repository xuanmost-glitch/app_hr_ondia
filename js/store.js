/* Kho dữ liệu: lưu localStorage, truy vấn & phân quyền */
const DB_KEY = 'xiaomi_hr_db_v1', SESSION_KEY = 'xiaomi_hr_session';
const Store = {
  db: null,
  load() {
    try { this.db = JSON.parse(localStorage.getItem(DB_KEY)); } catch { this.db = null; }
    if (!this.db || !this.db.version) { this.db = buildSeed(); this.save(); }
    return this.db;
  },
  save() {
    try { localStorage.setItem(DB_KEY, JSON.stringify(this.db)); }
    catch (e) { UI.toast('Bộ nhớ trình duyệt đã đầy. Hãy sao lưu và xóa bớt ảnh chấm công cũ.', 'error'); }
  },
  reset() { localStorage.removeItem(DB_KEY); this.load(); },
  importJSON(text) { const d = JSON.parse(text); if (!d.employees || !d.units) throw new Error('File không đúng định dạng'); this.db = d; this.save(); },

  // CRUD chung
  list(col) { return this.db[col] || []; },
  get(col, id) { return this.list(col).find(x => x.id === id); },
  upsert(col, obj) {
    const arr = this.db[col] || (this.db[col] = []);
    if (!obj.id) obj.id = uid(col.slice(0, 3));
    const i = arr.findIndex(x => x.id === obj.id);
    if (i >= 0) arr[i] = { ...arr[i], ...obj }; else arr.push(obj);
    this.save(); return obj;
  },
  remove(col, id) { this.db[col] = this.list(col).filter(x => x.id !== id); this.save(); },

  // Tra cứu nhanh
  emp(id) { return this.get('employees', id); },
  unit(id) { return this.get('units', id); },
  pos(id) { return this.get('positions', id); },
  shift(id) { return this.get('shifts', id); },
  status(key) { return this.db.settings.statuses.find(s => s.key === key) || { label: key, tone: 'info' }; },
  get settings() { return this.db.settings; },
  payTemplateOf(e) { return this.get('payTemplates', e.payTemplateId || this.pos(e.positionId)?.payTemplateId) || this.list('payTemplates')[0]; },

  // Phiên đăng nhập
  session: null,
  login(username, password) {
    const a = this.list('accounts').find(x => x.username.toLowerCase() === username.trim().toLowerCase() && x.password === password);
    if (!a) return null;
    this.session = { accountId: a.id, at: Date.now() };
    localStorage.setItem(SESSION_KEY, JSON.stringify(this.session));
    return a;
  },
  logout() { this.session = null; localStorage.removeItem(SESSION_KEY); },
  restore() { try { this.session = JSON.parse(localStorage.getItem(SESSION_KEY)); } catch { this.session = null; } return this.me(); },
  me() { return this.session && this.get('accounts', this.session.accountId); },
  myEmp() { const a = this.me(); return a && this.emp(a.employeeId); },
  role() { return this.me()?.role || 'staff'; },
  isAdmin() { return this.role() === 'admin'; },
  canManage() { return ['admin', 'manager'].includes(this.role()); },

  // Phạm vi dữ liệu theo quyền: admin xem tất cả, quản lý xem đơn vị mình, nhân viên xem bản thân
  scopeUnits() {
    if (this.isAdmin()) return this.list('units');
    const e = this.myEmp(); return this.list('units').filter(u => u.id === e?.unitId);
  },
  scopeEmployees(includeResigned = true) {
    const r = this.role(), me = this.myEmp();
    let arr = this.list('employees');
    if (r === 'manager') arr = arr.filter(e => e.unitId === me?.unitId);
    if (r === 'staff') arr = arr.filter(e => e.id === me?.id);
    return includeResigned ? arr : arr.filter(e => e.status !== 'resigned');
  },
  inScope(empId) { return this.scopeEmployees().some(e => e.id === empId); },

  // Chấm công
  shiftOf(empId, date) { const id = this.db.schedules[date]?.[empId]; return id ? this.shift(id) : null; },
  setShift(empId, date, shiftId) {
    const s = this.db.schedules[date] || (this.db.schedules[date] = {});
    if (shiftId) s[empId] = shiftId; else delete s[empId];
  },
  attOf(empId, date) { return this.list('attendance').find(a => a.employeeId === empId && a.date === date); },

  // Thông báo
  notify(toEmpId, text, link = '') {
    this.db.notifications.unshift({ id: uid('n'), to: toEmpId, text, link, at: Date.now(), read: false });
    this.db.notifications = this.db.notifications.slice(0, 200);
  },
  myNotifications() {
    const me = this.myEmp(); const r = this.role();
    return this.list('notifications').filter(n => n.to === me?.id || (n.to === '*managers' && r !== 'staff') || (n.to === '*admin' && r === 'admin'));
  },
  pendingCount() { return this.list('requests').filter(q => q.status === 'pending' && this.inScope(q.employeeId) && this.canManage()).length; },
};
