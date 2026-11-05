/* Chi tiết hồ sơ nhân sự */
Pages.employeeDetail = {
  title: 'Hồ sơ nhân sự', tab: 'info',
  render(root, id) {
    const e = Store.emp(id);
    if (!e || !Store.inScope(id)) { root.innerHTML = `<div class="empty">${icon('user')}Không tìm thấy hồ sơ</div>`; return; }
    const pos = Store.pos(e.positionId), unit = Store.unit(e.unitId), acc = Store.list('accounts').find(a => a.employeeId === e.id);
    const tabs = { info: 'Thông tin', contracts: 'Hợp đồng', att: 'Chấm công', req: 'Đề xuất', pay: 'Lương' };
    root.innerHTML = `
      <button class="btn ghost sm" onclick="App.go('employees')" style="margin-bottom:10px">${icon('chevronLeft', 'sm')} Danh sách</button>
      <div class="card" style="margin-bottom:16px"><div class="row wrap" style="gap:16px">
        <label style="cursor:pointer;position:relative" title="Đổi ảnh đại diện">${avatar(e, 'lg')}<input type="file" accept="image/*" hidden onchange="Pages.employeeDetail.setAvatar('${e.id}',this.files[0])"></label>
        <div class="grow"><h2>${esc(e.name)}</h2><div class="muted">${esc(pos?.name)} · ${esc(unit?.name)}</div>
          <div class="row wrap" style="margin-top:8px">${UI.statusBadge(e.status)}${badge(e.code, 'info', true)}${badge(e.empType || '', 'primary', true)}</div></div>
        <div class="row wrap"><button class="btn" onclick="Pages.employeeDetail.faceModal('${e.id}')">${icon('scan', 'sm')} Ảnh mẫu</button>
          <button class="btn" onclick="Pages.employeeDetail.accountModal('${e.id}')">${icon('lock', 'sm')} ${acc ? 'Tài khoản' : 'Cấp tài khoản'}</button>
          <button class="btn primary" onclick="Pages.employees.openForm('${e.id}')">${icon('edit', 'sm')} Sửa</button></div>
      </div></div>
      <div class="tabs">${Object.entries(tabs).map(([k, v]) => `<div class="tab ${this.tab === k ? 'active' : ''}" onclick="Pages.employeeDetail.tab='${k}';App.refresh()">${v}</div>`).join('')}</div>
      <div id="ed-body"></div>`;
    const body = $('#ed-body');
    if (this.tab === 'info') this.info(body, e, acc);
    if (this.tab === 'contracts') body.innerHTML = `<div class="card flush"><div class="card-head"><h3>Hợp đồng lao động</h3><button class="btn sm primary" onclick="Pages.contracts.openForm(null,'${e.id}')">${icon('plus', 'sm')} Thêm</button></div>${Pages.contracts.table(Store.list('contracts').filter(c => c.employeeId === e.id))}</div>`;
    if (this.tab === 'att') Pages.me.attCalendar(body, e, ym());
    if (this.tab === 'req') body.innerHTML = `<div class="card flush">${Pages.requests.table(Store.list('requests').filter(q => q.employeeId === e.id).sort((a, b) => b.createdAt - a.createdAt))}</div>`;
    if (this.tab === 'pay') Pages.me.payslips(body, e);
  },
  info(body, e, acc) {
    const cf = Store.settings.customFields;
    const kv = (rows) => `<dl class="kv">${rows.map(([k, v]) => `<dt>${k}</dt><dd>${v || '—'}</dd>`).join('')}</dl>`;
    const tenure = diffDays(e.joinDate, ymd());
    body.innerHTML = `<div class="grid g2">
      <div class="card"><h3 style="margin-bottom:12px">Cá nhân</h3>${kv([['Giới tính', esc(e.gender)], ['Ngày sinh', fmtDate(e.dob)], ['Điện thoại', `<a href="tel:${esc(e.phone)}">${esc(e.phone)}</a>`], ['Email', esc(e.email)], ['CCCD', esc(e.idNo)], ['Địa chỉ', esc(e.address)], ...cf.map(f => [esc(f.label), esc(e.custom?.[f.key])])])}</div>
      <div class="card"><h3 style="margin-bottom:12px">Công việc & lương</h3>${kv([['Ngày vào làm', fmtDate(e.joinDate)], ['Thâm niên', `${Math.floor(tenure / 365)} năm ${Math.floor((tenure % 365) / 30)} tháng`], ['Lương cơ bản', money(e.baseSalary)], ['Phụ cấp', money(e.allowance)], ['Lương giờ', e.hourlyRate ? money(e.hourlyRate) : ''], ['Mẫu tính lương', esc(Store.payTemplateOf(e)?.name)], ['Người phụ thuộc', e.dependents], ['Ngân hàng', esc(`${e.bank || ''} ${e.bankNo || ''}`)], ['Tài khoản app', acc ? `${esc(acc.username)} (${{ admin: 'Quản trị', manager: 'Quản lý', staff: 'Nhân viên' }[acc.role]})` : 'Chưa cấp']])}</div>
    </div>
    ${Store.isAdmin() ? `<div class="row mt" style="justify-content:flex-end"><button class="btn danger sm" onclick="Pages.employeeDetail.remove('${e.id}')">${icon('trash', 'sm')} Xóa hồ sơ</button></div>` : ''}`;
  },
  async setAvatar(id, file) {
    if (!file) return;
    const img = await loadImage(await fileToDataURL(file));
    Store.upsert('employees', { id, avatar: shrink(img, 200, 0.8) }); App.refresh();
  },
  faceModal(id) {
    const e = Store.emp(id);
    const m = UI.modal({ title: 'Ảnh mẫu khuôn mặt', size: 'sm', body: `
      <p class="muted" style="margin-bottom:12px">Ảnh mẫu dùng để AI so khớp mỗi lần ${esc(e.name)} chấm công. Chụp chính diện, đủ sáng, không đeo khẩu trang.</p>
      <div class="cam" style="aspect-ratio:1;max-height:300px">${e.faceSample ? `<img src="${e.faceSample}">` : `<div class="empty" style="color:#aaa">${icon('scan')}Chưa có ảnh mẫu</div>`}</div>
      <div id="face-msg" class="mt"></div>`,
      foot: `<label class="btn primary">${icon('camera', 'sm')} Chụp / chọn ảnh<input type="file" accept="image/*" capture="user" hidden id="face-file"></label>` });
    $('#face-file', m.el).onchange = async (ev) => {
      const f = ev.target.files[0]; if (!f) return;
      $('#face-msg', m.el).innerHTML = `<div class="ai-box tone-info">${icon('refresh')} Đang phân tích khuôn mặt…</div>`;
      try {
        const img = await loadImage(await fileToDataURL(f)), small = shrink(img, 360, 0.8);
        const desc = await Face.enroll(small);
        Store.upsert('employees', { id, faceSample: small, faceDesc: desc, avatar: e.avatar || shrink(img, 200, 0.8) });
        m.close(); UI.toast('Đã đăng ký ảnh mẫu khuôn mặt'); App.refresh();
      } catch (err) { $('#face-msg', m.el).innerHTML = `<div class="ai-box tone-danger">${icon('alert')} ${esc(err.message)}</div>`; }
    };
  },
  accountModal(id) {
    const e = Store.emp(id), acc = Store.list('accounts').find(a => a.employeeId === id);
    const roles = [{ v: 'staff', t: 'Nhân viên' }, { v: 'manager', t: 'Quản lý đơn vị' }, ...(Store.isAdmin() ? [{ v: 'admin', t: 'Quản trị hệ thống' }] : [])];
    UI.formModal({ title: acc ? 'Tài khoản đăng nhập' : 'Cấp tài khoản', size: 'sm',
      fields: [{ key: 'username', label: 'Tên đăng nhập', req: true, full: true }, { key: 'password', label: 'Mật khẩu', req: true, full: true }, { key: 'role', label: 'Quyền', type: 'select', empty: false, full: true, options: roles }],
      data: acc || { username: noAccent(e.name.split(' ').pop()) + e.code.slice(-3), password: '123456', role: 'staff' },
      onSave: v => {
        if (Store.list('accounts').some(a => a.username === v.username && a.id !== acc?.id)) { UI.toast('Tên đăng nhập đã tồn tại', 'error'); return false; }
        Store.upsert('accounts', { ...(acc || {}), ...v, employeeId: id, name: e.name }); UI.toast('Đã lưu tài khoản'); App.refresh();
      } });
  },
  remove(id) {
    UI.confirm('Xóa vĩnh viễn hồ sơ này cùng hợp đồng, tài khoản? Nên chuyển tình trạng sang "Đã nghỉ việc" thay vì xóa.', () => {
      Store.remove('employees', id);
      ['contracts', 'accounts'].forEach(c => (Store.db[c] = Store.list(c).filter(x => x.employeeId !== id)));
      Store.save(); UI.toast('Đã xóa hồ sơ'); App.go('employees');
    }, { danger: true, okText: 'Xóa' });
  },
};
