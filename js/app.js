/* Khung ứng dụng: điều hướng, menu, giao diện */
const ROUTES = [
  { key: 'dashboard', label: 'Tổng quan', icon: 'home', roles: ['admin', 'manager'], group: 'Chung' },
  { key: 'me', label: 'Của tôi', icon: 'user', roles: ['admin', 'manager', 'staff'], group: 'Chung' },
  { key: 'checkin', label: 'Chấm công', icon: 'scan', roles: ['admin', 'manager', 'staff'], group: 'Chung' },
  { key: 'requests', label: 'Đề xuất & duyệt', icon: 'inbox', roles: ['admin', 'manager', 'staff'], group: 'Chung', count: () => Store.pendingCount() },
  { key: 'employees', label: 'Hồ sơ nhân sự', icon: 'users', roles: ['admin', 'manager'], group: 'Nhân sự' },
  { key: 'contracts', label: 'Hợp đồng', icon: 'file', roles: ['admin', 'manager'], group: 'Nhân sự' },
  { key: 'org', label: 'Phòng ban & vị trí', icon: 'building', roles: ['admin'], group: 'Nhân sự' },
  { key: 'shifts', label: 'Phân ca', icon: 'calendar', roles: ['admin', 'manager'], group: 'Chấm công' },
  { key: 'attendance', label: 'Bảng công', icon: 'clock', roles: ['admin', 'manager', 'staff'], group: 'Chấm công' },
  { key: 'payroll', label: 'Bảng lương', icon: 'wallet', roles: ['admin', 'manager'], group: 'Lương' },
  { key: 'settings-pay', label: 'Công thức lương', icon: 'sliders', roles: ['admin'], group: 'Lương' },
  { key: 'settings', label: 'Cài đặt & giao diện', icon: 'settings', roles: ['admin'], group: 'Hệ thống' },
];
const App = {
  route: 'dashboard', param: null,
  boot() {
    Store.load(); this.applyTheme();
    if (!Store.restore()) { this.route = 'login'; $('#app').innerHTML = ''; return Pages.login.render($('#app')); }
    if (Store.isAdmin()) PayrollEngine.autoRun();
    this.renderShell(); this.go(location.hash.slice(2) || this.home(), true);
  },
  home() { return Store.canManage() ? 'dashboard' : 'me'; },
  allowed() { const r = Store.role(); return ROUTES.filter(x => x.roles.includes(r)); },
  applyTheme() {
    const s = Store.settings, h = document.documentElement;
    h.dataset.theme = s.theme; h.dataset.mode = s.mode; h.dataset.density = s.density;
    const c = getComputedStyle(h).getPropertyValue('--primary').trim();
    $('meta[name=theme-color]').content = c || '#FF6900';
  },
  renderShell() {
    const me = Store.me(), emp = Store.myEmp(), s = Store.settings;
    const groups = {};
    this.allowed().forEach(r => (groups[r.group] = groups[r.group] || []).push(r));
    $('#app').innerHTML = `<div class="shell">
      <aside class="sidebar">
        <div class="brand"><div class="brand-logo">mi</div><div><b>${esc(s.companyName)}</b><small>Quản lý nhân sự</small></div></div>
        <nav id="side-nav">${Object.entries(groups).map(([g, rs]) => `<div class="nav-group">${g}</div>` + rs.map(r => `<a class="nav-item" data-r="${r.key}" href="#/${r.key}">${icon(r.icon)}<span>${r.label}</span>${r.count ? `<span class="count" data-count="${r.key}"></span>` : ''}</a>`).join('')).join('')}</nav>
        <div class="sidebar-foot"><div class="card" style="padding:12px"><div class="row">${avatar(emp, 'sm')}<div class="grow"><div class="truncate" style="font-weight:700">${esc(me.name)}</div><div class="faint truncate">${esc(Store.unit(emp?.unitId)?.name || '')}</div></div>
          <button class="icon-btn" title="Đăng xuất" onclick="App.logout()">${icon('logout', 'sm')}</button></div></div></div>
      </aside>
      <div class="main">
        <header class="topbar">
          <div class="mobile-only">${avatar(emp, 'sm')}</div>
          <div class="title"><h1 id="page-title"></h1><span class="faint" id="page-sub"></span></div>
          <button class="icon-btn" title="Đổi sáng/tối" onclick="App.toggleMode()">${icon(s.mode === 'dark' ? 'sun' : 'moon')}</button>
          <button class="icon-btn" title="Thông báo" onclick="App.showNotifications()">${icon('bell')}<span class="dot hidden" id="noti-dot"></span></button>
        </header>
        <main class="content" id="view"></main>
      </div>
      <nav class="bottom-nav">
        <div class="bn-item" data-r="${this.home()}" onclick="App.go('${this.home()}')">${icon('home')}<span>Trang chủ</span></div>
        <div class="bn-item" data-r="attendance" onclick="App.go('attendance')">${icon('clock')}<span>Bảng công</span></div>
        <div class="bn-fab" onclick="App.go('checkin')"><div>${icon('scan', 'lg')}</div></div>
        <div class="bn-item" data-r="requests" onclick="App.go('requests')">${icon('inbox')}<span>Đề xuất</span><span class="count hidden" data-count="requests"></span></div>
        <div class="bn-item" onclick="App.drawer()">${icon('grid')}<span>Menu</span></div>
      </nav></div>`;
  },
  go(path, replace) {
    const [route, param] = path.split('/');
    const def = ROUTES.find(r => r.key === route);
    const okDetail = route === 'employee' && Store.canManage();
    if (!okDetail && (!def || !def.roles.includes(Store.role()))) return this.go(this.home(), true);
    this.route = route; this.param = param || null;
    const h = '#/' + path; if (location.hash !== h) (replace ? history.replaceState(null, '', h) : (location.hash = h));
    this.render();
  },
  render() {
    const key = this.route === 'employee' ? 'employeeDetail' : this.route.replace(/-(\w)/g, (_, c) => c.toUpperCase());
    const page = Pages[key];
    $$('[data-r]').forEach(el => el.classList.toggle('active', el.dataset.r === this.route || (this.route === 'employee' && el.dataset.r === 'employees')));
    const view = $('#view'); if (!view || !page) return;
    $('#page-title').textContent = page.title || ''; $('#page-sub').textContent = page.sub ? page.sub() : '';
    if (this._cleanup) { this._cleanup(); this._cleanup = null; }
    view.innerHTML = ''; page.render(view, this.param);
    this.refreshBadges(); window.scrollTo(0, 0);
  },
  refresh() { this.render(); },
  onLeave(fn) { this._cleanup = fn; },
  refreshBadges() {
    const n = Store.pendingCount();
    $$('[data-count="requests"]').forEach(el => { el.textContent = n; el.classList.toggle('hidden', !n); });
    $('#noti-dot')?.classList.toggle('hidden', !Store.myNotifications().some(x => !x.read));
  },
  drawer() {
    const back = document.createElement('div'); back.className = 'drawer-back';
    const me = Store.me();
    back.innerHTML = `<div class="drawer" onclick="event.stopPropagation()"><div class="handle"></div>
      <div class="row" style="margin-bottom:14px">${avatar(Store.myEmp())}<div class="grow"><b>${esc(me.name)}</b><div class="faint">${esc(Store.unit(Store.myEmp()?.unitId)?.name || '')}</div></div>
      <button class="btn sm danger" onclick="App.logout()">${icon('logout', 'sm')} Thoát</button></div>
      <div class="drawer-grid">${this.allowed().map(r => `<div class="tile ${r.key === this.route ? 'active' : ''}" onclick="this.closest('.drawer-back').remove();App.go('${r.key}')"><span>${icon(r.icon)}</span>${r.label}</div>`).join('')}</div></div>`;
    back.onclick = () => back.remove();
    document.body.appendChild(back);
  },
  toggleMode() { const s = Store.settings; s.mode = s.mode === 'dark' ? 'light' : 'dark'; Store.save(); this.applyTheme(); this.renderShell(); this.render(); },
  showNotifications() {
    const list = Store.myNotifications();
    const m = UI.modal({ title: 'Thông báo', size: 'sm', body: list.length ? list.slice(0, 40).map(n => `<div class="list-item" style="cursor:pointer" data-link="${esc(n.link)}">
      <div class="stat"><div class="ic tone-${n.read ? 'info' : 'primary'}" style="width:38px;height:38px">${icon('bell', 'sm')}</div></div>
      <div class="grow"><div style="font-weight:${n.read ? 500 : 700}">${esc(n.text)}</div><div class="faint">${fmtDT(n.at)}</div></div></div>`).join('') : `<div class="empty">${icon('bell')}Chưa có thông báo</div>` });
    $$('[data-link]', m.el).forEach(el => el.onclick = () => { if (el.dataset.link) { m.close(); this.go(el.dataset.link); } });
    list.forEach(n => (n.read = true)); Store.save(); this.refreshBadges();
  },
  logout() { Store.logout(); $$('.drawer-back').forEach(e => e.remove()); location.hash = ''; this.boot(); },
};
window.addEventListener('hashchange', () => { if (Store.me()) { const p = location.hash.slice(2); if (p && p !== [App.route, App.param].filter(Boolean).join('/')) App.go(p, true); } });
document.addEventListener('DOMContentLoaded', () => App.boot());
