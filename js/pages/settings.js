/* Cài đặt hệ thống & giao diện */
const THEMES = [
  ['xiaomi', 'Xiaomi Cam', '#FF6900', '#FF9A3C'], ['ocean', 'Đại dương', '#1570EF', '#36BFFA'], ['emerald', 'Ngọc lục bảo', '#079455', '#3CCB7F'],
  ['violet', 'Tím mộng mơ', '#7A5AF8', '#C084FC'], ['rose', 'Hồng sen', '#E31B54', '#FD6F8E'], ['teal', 'Xanh mint', '#0E9384', '#2ED3B7'],
  ['sunset', 'Hoàng hôn', '#EF4444', '#F59E0B'], ['graphite', 'Than chì', '#344054', '#667085'],
];
Pages.settings = {
  title: 'Cài đặt & giao diện', tab: 'look',
  render(root) {
    const T = { look: 'Giao diện', general: 'Chấm công & lương', data: 'Danh mục & trường', acc: 'Tài khoản', backup: 'Sao lưu dữ liệu' };
    root.innerHTML = `<div class="tabs">${Object.entries(T).map(([k, v]) => `<div class="tab ${this.tab === k ? 'active' : ''}" onclick="Pages.settings.tab='${k}';App.refresh()">${v}</div>`).join('')}</div><div id="st-body"></div>`;
    this[this.tab]($('#st-body'));
  },
  set(k, v) { Store.settings[k] = v; Store.save(); App.applyTheme(); App.renderShell(); App.render(); },
  look(el) {
    const s = Store.settings;
    el.innerHTML = `<div class="card"><h3>Template màu</h3><p class="faint" style="margin:4px 0 14px">Áp dụng cho toàn bộ ứng dụng và màn hình đăng nhập.</p>
      <div class="themes">${THEMES.map(([k, n, a, b]) => `<div class="theme-card ${s.theme === k ? 'active' : ''}" onclick="Pages.settings.set('theme','${k}')"><div class="sw" style="background:linear-gradient(135deg,${a},${b})"><i></i></div><b>${n}</b></div>`).join('')}</div></div>
      <div class="grid g2 mt">
        <div class="card"><h3 style="margin-bottom:12px">Chế độ hiển thị</h3><div class="row">
          ${[['light', 'sun', 'Sáng'], ['dark', 'moon', 'Tối']].map(([k, ic, n]) => `<button class="btn ${s.mode === k ? 'primary' : ''} grow" onclick="Pages.settings.set('mode','${k}')">${icon(ic, 'sm')} ${n}</button>`).join('')}</div></div>
        <div class="card"><h3 style="margin-bottom:12px">Mật độ</h3><div class="row">
          ${[['normal', 'Thoáng'], ['compact', 'Gọn']].map(([k, n]) => `<button class="btn ${s.density === k ? 'primary' : ''} grow" onclick="Pages.settings.set('density','${k}')">${n}</button>`).join('')}</div></div>
      </div>
      <div class="card mt"><div class="field"><label>Tên công ty hiển thị</label><input class="input" value="${esc(s.companyName)}" onchange="Pages.settings.set('companyName',this.value)"></div></div>`;
  },
  general(el) {
    const fields = [
      { section: 'Chấm công' },
      { key: 'graceMin', label: 'Cho phép muộn (phút)', type: 'number' }, { key: 'faceThreshold', label: 'Ngưỡng so khớp khuôn mặt', type: 'number', step: '0.01', hint: '0.4 = rất chặt · 0.5 = khuyên dùng · 0.6 = dễ' },
      { key: 'faceRequired', label: 'Chặn chấm công khi AI phát hiện sai người / nhiều người', type: 'checkbox', full: true },
      { key: 'gpsStrict', label: 'Chặn chấm công khi ở ngoài bán kính cửa hàng', type: 'checkbox', full: true, hint: 'Tắt: vẫn cho chấm nhưng báo quản lý' },
      { section: 'Lương' },
      { key: 'stdDays', label: 'Số công chuẩn / tháng', type: 'number' }, { key: 'payday', label: 'Ngày trả lương hằng tháng', type: 'number' },
      { key: 'otRates', label: 'Các hệ số tăng ca (cách nhau dấu phẩy)' },
      { key: 'autoPayroll', label: 'Tự động lập bảng lương nháp tháng trước khi đến ngày trả lương', type: 'checkbox', full: true },
    ];
    el.innerHTML = `<div class="card">${UI.form(fields, { ...Store.settings, otRates: Store.settings.otRates.join(', ') })}<div class="row mt" style="justify-content:flex-end"><button class="btn primary" id="st-save">${icon('check', 'sm')} Lưu cài đặt</button></div></div>`;
    $('#st-save').onclick = () => { const v = UI.read(el, fields); if (!v) return; v.otRates = String(v.otRates).split(',').map(Number).filter(Boolean); Object.assign(Store.settings, v); Store.save(); UI.toast('Đã lưu cài đặt'); };
  },
  data(el) {
    const s = Store.settings;
    const listCard = (title, desc, key, cols, addFn) => `<div class="card"><div class="card-head"><div><h3>${title}</h3><div class="faint">${desc}</div></div><button class="btn sm primary" onclick="Pages.settings.${addFn}()">${icon('plus', 'sm')} Thêm</button></div>
      ${UI.table(s[key], cols.concat([{ label: '', cls: 'acts', render: (x, i) => `<button class="btn sm icon" onclick="event.stopPropagation();Pages.settings.delItem('${key}',${i})">${icon('trash', 'sm')}</button>` }]), { onRow: (x, i) => `Pages.settings.${addFn}(${i})` })}</div>`;
    el.innerHTML = `<div class="stack gap-lg">
      ${listCard('Tình trạng nhân sự', 'Các trạng thái hồ sơ (đang làm, thử việc, nghỉ…)', 'statuses', [{ label: 'Tên', primary: true, render: x => badge(x.label, x.tone) }, { label: 'Mã', render: x => `<code>${esc(x.key)}</code>` }], 'statusForm')}
      ${listCard('Trường tùy chỉnh trong hồ sơ', 'Thêm bất kỳ thông tin nào bạn muốn lưu cho nhân viên', 'customFields', [{ label: 'Tên trường', primary: true, render: x => `<b>${esc(x.label)}</b>` }, { label: 'Kiểu', render: x => ({ text: 'Chữ', number: 'Số', date: 'Ngày', select: 'Danh sách: ' + esc(x.options) })[x.type] }], 'fieldForm')}
      ${listCard('Số liệu nhập hằng tháng cho bảng lương', 'Mỗi mục trở thành một biến dùng trong công thức lương', 'monthInputs', [{ label: 'Tên', primary: true, render: x => `<b>${esc(x.label)}</b>` }, { label: 'Biến', render: x => `<code class="formula">${esc(x.key)}</code>` }], 'inputForm')}
    </div>`;
  },
  delItem(key, i) {
    if (key === 'statuses' && Store.list('employees').some(e => e.status === Store.settings.statuses[i].key)) return UI.toast('Đang có nhân viên ở tình trạng này', 'warn');
    UI.confirm('Xóa mục này?', () => { Store.settings[key].splice(i, 1); Store.save(); App.refresh(); }, { danger: true, okText: 'Xóa' });
  },
  editItem(key, i, title, fields, fix) {
    const arr = Store.settings[key];
    UI.formModal({ title, size: 'sm', fields, data: i != null ? arr[i] : {}, onSave: v => { fix && fix(v); if (fix && v.__err) { UI.toast(v.__err, 'error'); return false; } i != null ? (arr[i] = v) : arr.push(v); Store.save(); App.refresh(); } });
  },
  statusForm(i) { this.editItem('statuses', i, 'Tình trạng nhân sự', [{ key: 'label', label: 'Tên hiển thị', req: true, full: true }, { key: 'key', label: 'Mã (không dấu)', req: true }, { key: 'tone', label: 'Màu', type: 'select', empty: false, options: [{ v: 'success', t: 'Xanh lá' }, { v: 'info', t: 'Xanh dương' }, { v: 'warning', t: 'Cam' }, { v: 'danger', t: 'Đỏ' }, { v: 'primary', t: 'Màu chủ đạo' }] }]); },
  fieldForm(i) { this.editItem('customFields', i, 'Trường tùy chỉnh', [{ key: 'label', label: 'Tên trường', req: true, full: true }, { key: 'key', label: 'Mã (không dấu)', req: true }, { key: 'type', label: 'Kiểu', type: 'select', empty: false, options: [{ v: 'text', t: 'Chữ' }, { v: 'number', t: 'Số' }, { v: 'date', t: 'Ngày' }, { v: 'select', t: 'Danh sách chọn' }] }, { key: 'options', label: 'Lựa chọn (nếu là danh sách, cách nhau dấu phẩy)', full: true }]); },
  inputForm(i) { this.editItem('monthInputs', i, 'Số liệu nhập hằng tháng', [{ key: 'label', label: 'Tên hiển thị', req: true, full: true }, { key: 'key', label: 'Tên biến (VIẾT_HOA, không dấu)', req: true, full: true }], v => { v.key = noAccent(v.key).toUpperCase().replace(/[^A-Z0-9_]/g, '_'); if (VAR_DOCS.some(d => d[0] === v.key)) v.__err = 'Trùng biến hệ thống'; }); },
  acc(el) {
    const R = { admin: ['Quản trị', 'danger'], manager: ['Quản lý', 'warning'], staff: ['Nhân viên', 'info'] };
    el.innerHTML = `<div class="card flush"><div class="card-head"><div><h3>Tài khoản đăng nhập</h3><div class="faint">Cấp tài khoản mới từ trang hồ sơ nhân viên.</div></div></div>${UI.table(Store.list('accounts'), [
      { label: 'Tài khoản', primary: true, render: a => UI.empCell(Store.emp(a.employeeId), esc(a.username)) },
      { label: 'Quyền', render: a => badge(...R[a.role]) }, { label: 'Đơn vị', render: a => esc(Store.unit(Store.emp(a.employeeId)?.unitId)?.name || '—') },
      { label: '', cls: 'acts', render: a => a.id === Store.me().id ? '' : `<button class="btn sm icon" onclick="event.stopPropagation();Pages.settings.delAcc('${a.id}')">${icon('trash', 'sm')}</button>` },
    ], { onRow: a => `Pages.employeeDetail.accountModal('${a.employeeId}')` })}</div>`;
  },
  delAcc(id) { UI.confirm('Xóa tài khoản này?', () => { Store.remove('accounts', id); App.refresh(); }, { danger: true, okText: 'Xóa' }); },
  backup(el) {
    const size = (localStorage.getItem(DB_KEY) || '').length;
    el.innerHTML = `<div class="grid g2"><div class="card"><h3>Sao lưu & khôi phục</h3><p class="muted" style="margin:6px 0 14px">Dữ liệu đang lưu trong trình duyệt của máy này (${num(size / 1024 / 1024, 2)} MB / khoảng 5 MB). Hãy sao lưu định kỳ.</p>
      <div class="row wrap"><button class="btn primary" onclick="download('xiaomi-hr-backup-${ymd()}.json', JSON.stringify(Store.db))">${icon('download', 'sm')} Tải file sao lưu</button>
      <label class="btn">${icon('upload', 'sm')} Khôi phục từ file<input type="file" accept=".json" hidden onchange="Pages.settings.restore(this.files[0])"></label></div></div>
      <div class="card"><h3>Dọn dẹp</h3><p class="muted" style="margin:6px 0 14px">Xóa ảnh chấm công cũ hơn 60 ngày để giải phóng bộ nhớ, hoặc khôi phục dữ liệu mẫu ban đầu.</p>
      <div class="row wrap"><button class="btn" onclick="Pages.settings.cleanPhotos()">${icon('trash', 'sm')} Xóa ảnh cũ</button><button class="btn danger" onclick="UI.confirm('Xóa toàn bộ dữ liệu và khôi phục dữ liệu mẫu?',()=>{Store.reset();Store.logout();App.boot()},{danger:true,okText:'Khôi phục'})">${icon('refresh', 'sm')} Dữ liệu mẫu</button></div></div></div>`;
  },
  async restore(f) { if (!f) return; try { Store.importJSON(await f.text()); UI.toast('Đã khôi phục dữ liệu'); App.boot(); } catch (e) { UI.toast(e.message, 'error'); } },
  cleanPhotos() {
    const lim = addDays(ymd(), -60); let n = 0;
    Store.list('attendance').forEach(a => { if (a.date < lim) ['checkIn', 'checkOut'].forEach(k => { if (a[k]?.photo) { a[k].photo = ''; n++; } }); });
    Store.save(); UI.toast(`Đã xóa ${n} ảnh`); App.refresh();
  },
};
