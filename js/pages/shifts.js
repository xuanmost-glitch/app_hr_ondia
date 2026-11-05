/* Phân ca theo chi nhánh */
Pages.shifts = {
  title: 'Phân ca', tab: 'plan', unit: '', week: null,
  weekStart(d) { const w = wd(d); return addDays(d, w === 0 ? -6 : 1 - w); },
  render(root) {
    if (!this.week) this.week = this.weekStart(ymd());
    if (!this.unit) this.unit = Store.scopeUnits()[0]?.id;
    root.innerHTML = `<div class="tabs"><div class="tab ${this.tab === 'plan' ? 'active' : ''}" onclick="Pages.shifts.tab='plan';App.refresh()">Lịch phân ca</div>
      ${Store.isAdmin() ? `<div class="tab ${this.tab === 'def' ? 'active' : ''}" onclick="Pages.shifts.tab='def';App.refresh()">Danh mục ca</div>` : ''}</div><div id="sh-body"></div>`;
    this.tab === 'plan' ? this.plan($('#sh-body')) : this.defs($('#sh-body'));
  },
  unitShifts() { const u = Store.unit(this.unit); return Store.list('shifts').filter(s => !s.unitType || s.unitType === u?.type || s.unitType === 'all'); },
  plan(el) {
    const days = Array.from({ length: 7 }, (_, i) => addDays(this.week, i)), today = ymd();
    const emps = Store.scopeEmployees(false).filter(e => e.unitId === this.unit), shifts = this.unitShifts();
    el.innerHTML = `<div class="toolbar">${UI.unitSelect('sh-unit', this.unit, 'Pages.shifts.unit=this.value;App.refresh()', '')}
        <div class="row" style="gap:6px"><button class="icon-btn" onclick="Pages.shifts.move(-7)">${icon('chevronLeft')}</button>
          <button class="btn" onclick="Pages.shifts.week=null;App.refresh()">${fmtDate(days[0]).slice(0, 5)} – ${fmtDate(days[6])}</button>
          <button class="icon-btn" onclick="Pages.shifts.move(7)">${icon('chevronRight')}</button></div>
        <div class="grow"></div>
        <button class="btn" onclick="Pages.shifts.copyPrev()">${icon('layers', 'sm')} Chép tuần trước</button>
        <button class="btn soft" onclick="Pages.shifts.auto()">${icon('zap', 'sm')} Xếp ca tự động</button></div>
      <div class="row wrap faint" style="margin-bottom:10px">Bấm vào ô để đổi ca:${shifts.map(s => `<span class="badge plain" style="background:${s.color};color:#fff">${s.code} ${esc(s.name)} ${s.start}-${s.end}</span>`).join('')}<span class="badge plain tone-info">— Nghỉ</span></div>
      <div class="card flush"><div class="table-wrap"><table class="sched"><thead><tr><th class="name">Nhân viên</th>
        ${days.map(d => `<th class="${d === today ? 'today' : ''}">${WEEKDAY[wd(d)]}<br>${d.slice(8)}/${d.slice(5, 7)}</th>`).join('')}<th>Số ca</th></tr></thead><tbody>
        ${emps.map(e => `<tr><td class="name">${UI.empCell(e)}</td>${days.map(d => { const s = Store.shiftOf(e.id, d); return `<td><span class="shift-pill ${s ? '' : 'off'}" style="${s ? `background:${s.color}` : ''}" onclick="Pages.shifts.cycle('${e.id}','${d}')">${s ? s.code : '—'}</span></td>`; }).join('')}
          <td><b>${days.filter(d => Store.shiftOf(e.id, d)).length}</b></td></tr>`).join('')}
        <tr><td class="name faint">Tổng nhân sự/ngày</td>${days.map(d => `<td class="faint">${shifts.map(s => { const n = emps.filter(e => Store.shiftOf(e.id, d)?.id === s.id).length; return n ? `${s.code}:${n}` : ''; }).filter(Boolean).join(' ')}</td>`).join('')}<td></td></tr>
      </tbody></table></div></div>`;
  },
  move(n) { this.week = addDays(this.week, n); App.refresh(); },
  cycle(empId, d) {
    const opts = [null, ...this.unitShifts().map(s => s.id)], cur = Store.shiftOf(empId, d)?.id || null;
    Store.setShift(empId, d, opts[(opts.indexOf(cur) + 1) % opts.length]); Store.save();
    const s = Store.shiftOf(empId, d), el = event.target;
    el.className = 'shift-pill ' + (s ? '' : 'off'); el.style.background = s ? s.color : ''; el.textContent = s ? s.code : '—';
  },
  copyPrev() {
    const emps = Store.scopeEmployees(false).filter(e => e.unitId === this.unit);
    for (let i = 0; i < 7; i++) { const d = addDays(this.week, i), p = addDays(d, -7); emps.forEach(e => Store.setShift(e.id, d, Store.shiftOf(e.id, p)?.id || null)); }
    Store.save(); UI.toast('Đã chép lịch tuần trước'); App.refresh();
  },
  auto() {
    const emps = Store.scopeEmployees(false).filter(e => e.unitId === this.unit), shifts = this.unitShifts();
    if (!shifts.length) return UI.toast('Đơn vị chưa có ca phù hợp', 'warn');
    UI.confirm(`Xếp ca tự động cho ${emps.length} nhân viên trong tuần này? Mỗi người nghỉ 1 ngày, luân phiên ${shifts.slice(0, 2).map(s => s.name).join(' / ')}.`, () => {
      emps.forEach((e, i) => { for (let k = 0; k < 7; k++) {
        const d = addDays(this.week, k), off = (i % 7) === k && shifts.length > 1;
        Store.setShift(e.id, d, off ? null : shifts.length === 1 ? shifts[0].id : shifts[(i + k) % 2].id);
      } });
      Store.save(); UI.toast('Đã xếp ca'); App.refresh();
    });
  },
  defs(el) {
    el.innerHTML = `<div class="toolbar"><div class="grow muted">Định nghĩa ca làm việc dùng chung; có thể giới hạn theo loại đơn vị.</div><button class="btn primary" onclick="Pages.shifts.form()">${icon('plus', 'sm')} Thêm ca</button></div>
      <div class="card flush">${UI.table(Store.list('shifts'), [
        { label: 'Ca', primary: true, render: s => `<div class="row"><span class="shift-pill" style="background:${s.color};width:46px">${esc(s.code)}</span><b>${esc(s.name)}</b></div>` },
        { label: 'Giờ', render: s => `${s.start} – ${s.end}` }, { label: 'Nghỉ giữa ca', render: s => `${s.break || 0} phút` },
        { label: 'Số giờ công', render: s => num((toMin(s.end) - toMin(s.start) - (s.break || 0)) / 60) + ' giờ' },
        { label: 'Áp dụng', render: s => ({ store: 'Cửa hàng', dept: 'Phòng ban', all: 'Tất cả', '': 'Tất cả' })[s.unitType || ''] },
      ], { onRow: s => `Pages.shifts.form('${s.id}')` })}</div>`;
  },
  form(id) {
    const s = id ? Store.shift(id) : null;
    UI.formModal({ title: s ? 'Sửa ca' : 'Thêm ca', data: s || { color: '#1570EF', break: 60, unitType: 'all' }, fields: [
      { key: 'code', label: 'Ký hiệu', req: true }, { key: 'name', label: 'Tên ca', req: true },
      { key: 'start', label: 'Bắt đầu', type: 'time', req: true }, { key: 'end', label: 'Kết thúc', type: 'time', req: true },
      { key: 'break', label: 'Nghỉ giữa ca (phút)', type: 'number' }, { key: 'color', label: 'Màu', type: 'color' },
      { key: 'unitType', label: 'Áp dụng cho', type: 'select', empty: false, options: [{ v: 'all', t: 'Tất cả' }, { v: 'store', t: 'Cửa hàng' }, { v: 'dept', t: 'Phòng ban' }] },
    ], onSave: v => { Store.upsert('shifts', { ...(s || {}), ...v }); UI.toast('Đã lưu ca'); App.refresh(); } });
  },
};
