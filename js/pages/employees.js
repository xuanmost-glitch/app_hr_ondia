/* Danh sách & form hồ sơ nhân sự */
Pages.employees = {
  title: 'Hồ sơ nhân sự',
  sub: () => `${Store.scopeEmployees().length} hồ sơ`,
  q: '', unit: '', status: '',
  fields(e = {}) {
    const s = Store.settings;
    const custom = s.customFields.map(f => ({ key: 'cf_' + f.key, label: f.label, type: f.type, options: f.type === 'select' ? f.options.split(',').map(x => x.trim()) : undefined }));
    return [
      { section: 'Thông tin cá nhân' },
      { key: 'code', label: 'Mã nhân viên', req: true }, { key: 'name', label: 'Họ và tên', req: true },
      { key: 'gender', label: 'Giới tính', type: 'select', options: ['Nam', 'Nữ', 'Khác'] }, { key: 'dob', label: 'Ngày sinh', type: 'date' },
      { key: 'phone', label: 'Số điện thoại', type: 'tel' }, { key: 'email', label: 'Email', type: 'email' },
      { key: 'idNo', label: 'Số CCCD' }, { key: 'address', label: 'Địa chỉ' },
      { section: 'Công việc' },
      { key: 'unitId', label: 'Đơn vị / Chi nhánh', type: 'select', req: true, options: UI.unitOptions() },
      { key: 'positionId', label: 'Vị trí', type: 'select', req: true, options: Store.list('positions').map(p => ({ v: p.id, t: p.name })) },
      { key: 'status', label: 'Tình trạng', type: 'select', req: true, empty: false, options: s.statuses.map(x => ({ v: x.key, t: x.label })) },
      { key: 'empType', label: 'Hình thức', type: 'select', options: ['Toàn thời gian', 'Bán thời gian', 'Cộng tác viên', 'Thực tập'] },
      { key: 'joinDate', label: 'Ngày vào làm', type: 'date', req: true }, { key: 'leaveDate', label: 'Ngày nghỉ việc', type: 'date' },
      { section: 'Lương & ngân hàng' },
      { key: 'baseSalary', label: 'Lương cơ bản (đ)', type: 'money', hint: 'Để trống sẽ lấy theo vị trí' }, { key: 'allowance', label: 'Phụ cấp (đ)', type: 'money' },
      { key: 'hourlyRate', label: 'Lương giờ (đ)', type: 'money' }, { key: 'dependents', label: 'Người phụ thuộc', type: 'number' },
      { key: 'payTemplateId', label: 'Mẫu tính lương riêng', type: 'select', placeholder: '— Theo vị trí —', options: Store.list('payTemplates').map(t => ({ v: t.id, t: t.name })) },
      { key: 'bank', label: 'Ngân hàng' }, { key: 'bankNo', label: 'Số tài khoản' },
      ...(custom.length ? [{ section: 'Thông tin bổ sung (tùy chỉnh)' }, ...custom] : []),
    ];
  },
  openForm(id) {
    const old = id ? Store.emp(id) : null;
    const n = Store.list('employees').length + 1;
    const data = old ? { ...old } : { code: 'NV' + String(n).padStart(3, '0'), status: 'probation', joinDate: ymd(), empType: 'Toàn thời gian', unitId: Store.scopeUnits()[0]?.id };
    Object.entries(old?.custom || {}).forEach(([k, v]) => (data['cf_' + k] = v));
    UI.formModal({ title: old ? 'Sửa hồ sơ' : 'Thêm nhân sự', size: 'lg', fields: this.fields(), data,
      onSave: (v) => {
        if (Store.list('employees').some(e => e.code === v.code && e.id !== id)) { UI.toast('Mã nhân viên đã tồn tại', 'error'); return false; }
        const custom = {}; Object.keys(v).filter(k => k.startsWith('cf_')).forEach(k => { custom[k.slice(3)] = v[k]; delete v[k]; });
        const pos = Store.pos(v.positionId);
        if (!old && !v.baseSalary) { v.baseSalary = pos.baseSalary; v.allowance = v.allowance || pos.allowance; v.hourlyRate = v.hourlyRate || pos.hourlyRate; }
        const e = Store.upsert('employees', { ...(old || { avatar: '', faceSample: '', faceDesc: null }), ...v, custom, id: id || undefined });
        UI.toast(old ? 'Đã cập nhật hồ sơ' : 'Đã thêm nhân sự ' + e.name);
        old ? App.refresh() : App.go('employee/' + e.id);
      } });
  },
  render(root) {
    const all = Store.scopeEmployees();
    const rows = all.filter(e => (!this.unit || e.unitId === this.unit) && (!this.status || e.status === this.status) && match(this.q, e.name, e.code, e.phone, Store.pos(e.positionId)?.name));
    root.innerHTML = `
      <div class="toolbar">
        <div class="search">${icon('search', 'sm')}<input class="input" placeholder="Tìm tên, mã, SĐT, vị trí…" value="${esc(this.q)}" oninput="Pages.employees.q=this.value;Pages.employees.list()"></div>
        ${UI.unitSelect('emp-unit', this.unit, 'Pages.employees.unit=this.value;Pages.employees.list()')}
        <button class="btn" onclick="Pages.employees.export()">${icon('download', 'sm')} <span class="desktop-only">Xuất Excel</span></button>
        <button class="btn primary" onclick="Pages.employees.openForm()">${icon('plus', 'sm')} Thêm</button>
      </div>
      <div class="chips" style="margin-bottom:14px">
        <span class="chip ${!this.status ? 'active' : ''}" onclick="Pages.employees.status='';App.refresh()">Tất cả (${all.length})</span>
        ${Store.settings.statuses.map(s => `<span class="chip ${this.status === s.key ? 'active' : ''}" onclick="Pages.employees.status='${s.key}';App.refresh()">${esc(s.label)} (${all.filter(e => e.status === s.key).length})</span>`).join('')}
      </div>
      <div class="card flush" id="emp-list"></div>`;
    this.list(rows);
  },
  list(rows) {
    rows = rows || Store.scopeEmployees().filter(e => (!this.unit || e.unitId === this.unit) && (!this.status || e.status === this.status) && match(this.q, e.name, e.code, e.phone, Store.pos(e.positionId)?.name));
    $('#emp-list').innerHTML = UI.table(rows, [
      { label: 'Nhân viên', primary: true, render: e => UI.empCell(e) },
      { label: 'Đơn vị', render: e => `<span class="nowrap">${esc(Store.unit(e.unitId)?.name)}</span>` },
      { label: 'Điện thoại', render: e => esc(e.phone) },
      { label: 'Ngày vào', render: e => fmtDate(e.joinDate) },
      { label: 'Ảnh mẫu', render: e => e.faceDesc ? badge('Đã đăng ký', 'success') : badge('Chưa có', 'warning') },
      { label: 'Tình trạng', render: e => UI.statusBadge(e.status) },
    ], { onRow: e => `App.go('employee/${e.id}')`, empty: 'Không tìm thấy nhân sự phù hợp' });
  },
  export() {
    const cf = Store.settings.customFields;
    exportExcel('Danh-sach-nhan-su', { 'Nhân sự': Store.scopeEmployees().map(e => ({
      'Mã NV': e.code, 'Họ tên': e.name, 'Giới tính': e.gender, 'Ngày sinh': fmtDate(e.dob), 'SĐT': e.phone, 'Email': e.email, 'CCCD': e.idNo,
      'Đơn vị': Store.unit(e.unitId)?.name, 'Vị trí': Store.pos(e.positionId)?.name, 'Tình trạng': Store.status(e.status).label,
      'Ngày vào': fmtDate(e.joinDate), 'Lương CB': e.baseSalary, 'Phụ cấp': e.allowance, 'Ngân hàng': e.bank, 'STK': e.bankNo,
      ...Object.fromEntries(cf.map(f => [f.label, e.custom?.[f.key] ?? ''])),
    })) });
  },
};
