/* Hợp đồng lao động */
Pages.contracts = {
  title: 'Hợp đồng lao động', filter: 'all', q: '',
  state(c) {
    const today = ymd();
    if (c.status === 'ended') return { k: 'ended', t: 'Đã thanh lý', tone: 'info' };
    if (c.end && c.end < today) return { k: 'expired', t: 'Hết hạn', tone: 'danger' };
    if (c.end && diffDays(today, c.end) <= 30) return { k: 'soon', t: `Còn ${diffDays(today, c.end)} ngày`, tone: 'warning' };
    return { k: 'active', t: 'Hiệu lực', tone: 'success' };
  },
  render(root) {
    const ids = new Set(Store.scopeEmployees().map(e => e.id));
    const all = Store.list('contracts').filter(c => ids.has(c.employeeId));
    const F = { all: 'Tất cả', active: 'Hiệu lực', soon: 'Sắp hết hạn', expired: 'Hết hạn', ended: 'Đã thanh lý' };
    const rows = all.filter(c => (this.filter === 'all' || this.state(c).k === this.filter) && match(this.q, Store.emp(c.employeeId)?.name, c.no, c.type))
      .sort((a, b) => (a.end || '9').localeCompare(b.end || '9'));
    root.innerHTML = `<div class="toolbar">
        <div class="search">${icon('search', 'sm')}<input class="input" placeholder="Tìm nhân viên, số hợp đồng…" value="${esc(this.q)}" onchange="Pages.contracts.q=this.value;App.refresh()"></div>
        <button class="btn" onclick="Pages.contracts.templateForm()">${icon('file', 'sm')} <span class="desktop-only">Mẫu hợp đồng</span></button>
        <button class="btn primary" onclick="Pages.contracts.openForm()">${icon('plus', 'sm')} Thêm</button></div>
      <div class="chips" style="margin-bottom:14px">${Object.entries(F).map(([k, v]) => `<span class="chip ${this.filter === k ? 'active' : ''}" onclick="Pages.contracts.filter='${k}';App.refresh()">${v} (${k === 'all' ? all.length : all.filter(c => this.state(c).k === k).length})</span>`).join('')}</div>
      <div class="card flush">${this.table(rows)}</div>`;
  },
  table(rows) {
    return UI.table(rows, [
      { label: 'Nhân viên', primary: true, render: c => UI.empCell(Store.emp(c.employeeId), esc(c.no)) },
      { label: 'Loại hợp đồng', render: c => esc(c.type) },
      { label: 'Thời hạn', render: c => `<span class="nowrap">${fmtDate(c.start)} → ${c.end ? fmtDate(c.end) : 'Không thời hạn'}</span>` },
      { label: 'Mức lương', render: c => money(c.salary) },
      { label: 'Trạng thái', render: c => { const s = this.state(c); return badge(s.t, s.tone); } },
      { label: '', cls: 'acts', render: c => `<button class="btn sm" onclick="event.stopPropagation();Pages.contracts.print('${c.id}')">${icon('printer', 'sm')} In</button>
        <button class="btn sm" onclick="event.stopPropagation();Pages.contracts.renew('${c.id}')">${icon('refresh', 'sm')} Gia hạn</button>` },
    ], { onRow: c => `Pages.contracts.openForm('${c.id}')`, empty: 'Chưa có hợp đồng' });
  },
  openForm(id, empId) {
    const c = id ? Store.get('contracts', id) : null;
    const emps = Store.scopeEmployees().map(e => ({ v: e.id, t: `${e.code} – ${e.name}` }));
    const data = c || { employeeId: empId, no: `${String(Store.list('contracts').length + 1).padStart(3, '0')}/HĐLĐ-XMBG`, start: ymd(), type: Store.settings.contractTypes[1], status: 'active', salary: Store.emp(empId)?.baseSalary };
    UI.formModal({ title: c ? 'Sửa hợp đồng' : 'Thêm hợp đồng', data, fields: [
      { key: 'employeeId', label: 'Nhân viên', type: 'select', req: true, full: true, options: emps },
      { key: 'no', label: 'Số hợp đồng', req: true }, { key: 'type', label: 'Loại hợp đồng', type: 'select', req: true, options: Store.settings.contractTypes },
      { key: 'start', label: 'Ngày bắt đầu', type: 'date', req: true }, { key: 'end', label: 'Ngày kết thúc', type: 'date', hint: 'Để trống nếu không xác định thời hạn' },
      { key: 'salary', label: 'Mức lương trên HĐ (đ)', type: 'money' },
      { key: 'status', label: 'Trạng thái', type: 'select', empty: false, options: [{ v: 'active', t: 'Đang hiệu lực' }, { v: 'ended', t: 'Đã thanh lý' }] },
      { key: 'note', label: 'Ghi chú', type: 'textarea', full: true },
    ], onSave: v => { Store.upsert('contracts', { ...(c || {}), ...v }); UI.toast('Đã lưu hợp đồng'); App.refresh(); } });
  },
  renew(id) {
    const c = Store.get('contracts', id);
    const start = c.end ? addDays(c.end, 1) : ymd();
    Store.upsert('contracts', { ...c, status: 'ended' });
    const n = Store.upsert('contracts', { employeeId: c.employeeId, no: c.no.replace(/^(\d+)/, m => m + '-GH'), type: Store.settings.contractTypes[2] || c.type, start, end: addDays(start, 365 * 3 - 1), salary: c.salary, status: 'active', note: 'Gia hạn từ HĐ ' + c.no });
    UI.toast('Đã tạo hợp đồng gia hạn'); this.openForm(n.id);
  },
  fill(c) {
    const e = Store.emp(c.employeeId), s = Store.settings;
    const map = { so_hd: c.no, cong_ty: s.companyName, ho_ten: e.name, ngay_sinh: fmtDate(e.dob), cccd: e.idNo, dia_chi: e.address, don_vi: Store.unit(e.unitId)?.name,
      vi_tri: Store.pos(e.positionId)?.name, loai_hd: c.type, tu_ngay: fmtDate(c.start), den_ngay: c.end ? fmtDate(c.end) : 'không xác định', muc_luong: money(c.salary),
      ngay_tra_luong: s.payday, tai_khoan: `${e.bank || ''} ${e.bankNo || ''}` };
    return s.contractTemplate.replace(/\{\{(\w+)\}\}/g, (_, k) => map[k] ?? '');
  },
  print(id) {
    const html = esc(this.fill(Store.get('contracts', id))).replace(/\n/g, '<br>');
    const w = window.open('', '_blank');
    w.document.write(`<html><head><title>Hợp đồng</title><style>body{font-family:'Times New Roman',serif;font-size:16px;line-height:1.7;padding:48px;max-width:780px;margin:auto}</style></head><body>${html}<script>print()<\/script></body></html>`);
    w.document.close();
  },
  templateForm() {
    const keys = ['so_hd', 'cong_ty', 'ho_ten', 'ngay_sinh', 'cccd', 'dia_chi', 'don_vi', 'vi_tri', 'loai_hd', 'tu_ngay', 'den_ngay', 'muc_luong', 'ngay_tra_luong', 'tai_khoan'];
    UI.formModal({ title: 'Mẫu hợp đồng', size: 'lg', data: { tpl: Store.settings.contractTemplate, types: Store.settings.contractTypes.join('\n') }, fields: [
      { key: 'tpl', label: 'Nội dung mẫu', type: 'textarea', rows: 14, full: true, hint: 'Biến tự điền: ' + keys.map(k => `{{${k}}}`).join(' ') },
      { key: 'types', label: 'Các loại hợp đồng (mỗi dòng một loại)', type: 'textarea', rows: 4, full: true },
    ], onSave: v => { Store.settings.contractTemplate = v.tpl; Store.settings.contractTypes = v.types.split('\n').map(x => x.trim()).filter(Boolean); Store.save(); UI.toast('Đã lưu mẫu hợp đồng'); } });
  },
};
