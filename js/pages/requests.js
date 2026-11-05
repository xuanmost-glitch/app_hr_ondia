/* Đề xuất: tăng ca, khen thưởng, nghỉ phép, bổ sung công */
Pages.requests = {
  title: 'Đề xuất & phê duyệt', tab: null, type: '',
  TYPES: {
    ot: { label: 'Tăng ca', icon: 'clock', tone: 'primary' },
    reward: { label: 'Khen thưởng', icon: 'award', tone: 'success' },
    leave: { label: 'Nghỉ phép', icon: 'calendar', tone: 'info' },
    adjust: { label: 'Bổ sung công', icon: 'edit', tone: 'warning' },
  },
  ST: { pending: ['Chờ duyệt', 'warning'], approved: ['Đã duyệt', 'success'], rejected: ['Từ chối', 'danger'] },
  summary(q) {
    if (q.type === 'ot') return `${num(q.hours)} giờ × ${q.rate} · ${fmtDate(q.date)}`;
    if (q.type === 'reward') return `${esc(q.title || '')} · ${money(q.amount)}`;
    if (q.type === 'leave') return `${fmtDate(q.date)}${q.endDate && q.endDate !== q.date ? ' → ' + fmtDate(q.endDate) : ''} · ${q.days} ngày ${q.paid ? 'có lương' : 'không lương'}`;
    if (q.type === 'adjust') return `${fmtDate(q.date)} · +${q.days} công`;
    return '';
  },
  render(root) {
    const manage = Store.canManage();
    if (!this.tab) this.tab = manage ? 'pending' : 'mine';
    const me = Store.myEmp();
    let rows = Store.list('requests').filter(q => Store.inScope(q.employeeId));
    if (this.tab === 'mine') rows = rows.filter(q => q.employeeId === me?.id || q.createdBy === me?.id);
    if (this.tab === 'pending') rows = rows.filter(q => q.status === 'pending');
    if (this.type) rows = rows.filter(q => q.type === this.type);
    rows.sort((a, b) => b.createdAt - a.createdAt);
    root.innerHTML = `<div class="grid g4" style="margin-bottom:16px">${Object.entries(this.TYPES).filter(([k]) => manage || k !== 'reward').map(([k, t]) => `<div class="card stat" style="cursor:pointer" onclick="Pages.requests.form('${k}')"><div class="ic tone-${t.tone}">${icon(t.icon)}</div><div><b>${k === 'reward' ? 'Đề xuất khen thưởng' : 'Đăng ký ' + t.label.toLowerCase()}</b><div class="faint">Tạo mới ›</div></div></div>`).join('')}</div>
      <div class="toolbar"><div class="tabs" style="margin:0">${manage ? `<div class="tab ${this.tab === 'pending' ? 'active' : ''}" onclick="Pages.requests.tab='pending';App.refresh()">Chờ duyệt (${Store.pendingCount()})</div><div class="tab ${this.tab === 'all' ? 'active' : ''}" onclick="Pages.requests.tab='all';App.refresh()">Tất cả</div>` : ''}<div class="tab ${this.tab === 'mine' ? 'active' : ''}" onclick="Pages.requests.tab='mine';App.refresh()">Của tôi</div></div>
        <div class="grow"></div><select class="input" onchange="Pages.requests.type=this.value;App.refresh()"><option value="">Mọi loại</option>${Object.entries(this.TYPES).map(([k, t]) => `<option value="${k}" ${this.type === k ? 'selected' : ''}>${t.label}</option>`).join('')}</select></div>
      <div class="card flush">${this.table(rows)}</div>`;
  },
  table(rows) {
    const canApprove = (q) => Store.canManage() && q.status === 'pending' && (q.employeeId !== Store.myEmp()?.id || Store.isAdmin());
    return UI.table(rows, [
      { label: 'Nhân viên', primary: true, render: q => UI.empCell(Store.emp(q.employeeId), esc(Store.unit(q.unitId)?.name)) },
      { label: 'Loại', render: q => badge(this.TYPES[q.type].label, this.TYPES[q.type].tone, true) },
      { label: 'Nội dung', render: q => `<div>${this.summary(q)}</div><div class="faint">${esc(q.reason || '')}</div>` },
      { label: 'Gửi lúc', render: q => `<span class="nowrap">${fmtDT(q.createdAt)}</span>` },
      { label: 'Trạng thái', render: q => badge(...this.ST[q.status]) + (q.approvedBy ? `<div class="faint">${esc(q.approvedBy)}</div>` : '') },
      { label: '', cls: 'acts', render: q => canApprove(q) ? `<button class="btn sm danger" onclick="Pages.requests.decide('${q.id}','rejected')">${icon('x', 'sm')} Từ chối</button> <button class="btn sm success" onclick="Pages.requests.decide('${q.id}','approved')">${icon('check', 'sm')} Duyệt</button>`
        : (q.status === 'pending' && q.createdBy === Store.myEmp()?.id ? `<button class="btn sm" onclick="Pages.requests.cancel('${q.id}')">Hủy</button>` : '') },
    ], { empty: 'Không có đề xuất' });
  },
  form(type) {
    const me = Store.myEmp(), manage = Store.canManage();
    const empF = { key: 'employeeId', label: 'Nhân viên', type: 'select', req: true, full: true, empty: false, options: Store.scopeEmployees(false).map(e => ({ v: e.id, t: `${e.name} – ${Store.unit(e.unitId)?.short}` })) };
    const F = {
      ot: [{ key: 'date', label: 'Ngày tăng ca', type: 'date', req: true }, { key: 'hours', label: 'Số giờ', type: 'number', step: '0.5', req: true },
        { key: 'rate', label: 'Hệ số', type: 'select', empty: false, options: Store.settings.otRates.map(r => ({ v: r, t: `× ${r}` + (r == 1.5 ? ' (ngày thường)' : r == 2 ? ' (cuối tuần)' : r == 3 ? ' (ngày lễ)' : '') })) }],
      reward: [{ key: 'title', label: 'Danh hiệu / lý do khen', req: true, full: true }, { key: 'amount', label: 'Số tiền thưởng (đ)', type: 'money', req: true }, { key: 'date', label: 'Tính vào tháng có ngày', type: 'date', req: true }],
      leave: [{ key: 'date', label: 'Từ ngày', type: 'date', req: true }, { key: 'endDate', label: 'Đến ngày', type: 'date', req: true }, { key: 'paid', label: 'Nghỉ phép có lương', type: 'checkbox', full: true }],
      adjust: [{ key: 'date', label: 'Ngày cần bổ sung', type: 'date', req: true }, { key: 'days', label: 'Số công', type: 'select', empty: false, options: [{ v: 1, t: '1 công' }, { v: 0.5, t: '0.5 công' }] }],
    }[type];
    const fields = [...(manage ? [empF] : []), ...F, { key: 'reason', label: 'Lý do / mô tả', type: 'textarea', full: true, req: true }];
    UI.formModal({ title: (type === 'reward' ? 'Đề xuất ' : 'Đăng ký ') + this.TYPES[type].label.toLowerCase(), fields, saveText: 'Gửi đề xuất',
      data: { employeeId: me?.id, date: ymd(), endDate: ymd(), rate: 1.5, paid: true, days: 1, hours: 2 }, onSave: v => {
        const emp = Store.emp(v.employeeId || me.id);
        if (type === 'leave') { if (v.endDate < v.date) { UI.toast('Ngày kết thúc phải sau ngày bắt đầu', 'warn'); return false; } v.days = diffDays(v.date, v.endDate) + 1; }
        ['hours', 'rate', 'amount', 'days'].forEach(k => k in v && (v[k] = Number(v[k])));
        const q = Store.upsert('requests', { ...v, type, employeeId: emp.id, unitId: emp.unitId, status: 'pending', createdAt: Date.now(), createdBy: me?.id });
        Store.notify('*managers', `${emp.name}: đề xuất ${this.TYPES[type].label.toLowerCase()} – ${this.summary(q)}`, 'requests'); Store.save();
        UI.toast('Đã gửi đề xuất'); this.tab = manage ? 'pending' : 'mine'; App.go('requests');
      } });
  },
  decide(id, status) {
    const q = Store.get('requests', id);
    Store.upsert('requests', { id, status, approvedBy: Store.me().name, decidedAt: Date.now() });
    Store.notify(q.employeeId, `Đề xuất ${this.TYPES[q.type].label.toLowerCase()} (${this.summary(q)}) đã ${status === 'approved' ? 'được duyệt' : 'bị từ chối'}`, 'requests');
    Store.save(); UI.toast(status === 'approved' ? 'Đã duyệt' : 'Đã từ chối', status === 'approved' ? 'success' : 'warn'); App.refresh();
  },
  cancel(id) { UI.confirm('Hủy đề xuất này?', () => { Store.remove('requests', id); App.refresh(); }); },
};
