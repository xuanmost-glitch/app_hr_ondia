/* Phòng ban, chi nhánh, vị trí */
Pages.org = {
  title: 'Phòng ban & vị trí', tab: 'units',
  TYPES: { store: 'Chi nhánh / cửa hàng', dept: 'Phòng ban', other: 'Khác' },
  render(root) {
    root.innerHTML = `<div class="tabs"><div class="tab ${this.tab === 'units' ? 'active' : ''}" onclick="Pages.org.tab='units';App.refresh()">Chi nhánh & phòng ban</div>
      <div class="tab ${this.tab === 'pos' ? 'active' : ''}" onclick="Pages.org.tab='pos';App.refresh()">Vị trí công việc</div></div><div id="org-body"></div>`;
    this.tab === 'units' ? this.units($('#org-body')) : this.positions($('#org-body'));
  },
  units(el) {
    const emps = Store.list('employees').filter(e => e.status !== 'resigned');
    el.innerHTML = `<div class="toolbar"><div class="grow muted">Mỗi đơn vị có tọa độ GPS và bán kính cho phép chấm công.</div><button class="btn primary" onclick="Pages.org.unitForm()">${icon('plus', 'sm')} Thêm đơn vị</button></div>
      <div class="grid g3">${Store.list('units').map(u => {
        const n = emps.filter(e => e.unitId === u.id);
        const mgr = n.find(e => /trưởng/i.test(Store.pos(e.positionId)?.name || ''));
        return `<div class="card"><div class="row" style="margin-bottom:12px"><span class="avatar" style="background:${u.color};border-radius:12px">${esc(u.short || initials(u.name))}</span>
          <div class="grow"><h3 class="truncate">${esc(u.name)}</h3><div class="faint">${this.TYPES[u.type] || ''}</div></div>
          <button class="icon-btn" onclick="Pages.org.unitForm('${u.id}')">${icon('edit', 'sm')}</button></div>
          <div class="stack" style="gap:6px;font-size:13.5px">
            <div class="row muted">${icon('pin', 'sm')}<span class="truncate">${esc(u.address || '—')}</span></div>
            <div class="row muted">${icon('scan', 'sm')}GPS ${u.lat?.toFixed(4)}, ${u.lng?.toFixed(4)} · bán kính ${u.radius}m</div>
            <div class="row muted">${icon('user', 'sm')}Phụ trách: ${esc(mgr?.name || '—')}</div></div>
          <div class="row between mt"><b>${n.length} nhân sự</b><div class="row" style="gap:-6px">${n.slice(0, 5).map(e => avatar(e, 'sm')).join('')}</div></div></div>`;
      }).join('')}</div>`;
  },
  unitForm(id) {
    const u = id ? Store.unit(id) : null;
    const fields = [
      { key: 'name', label: 'Tên đơn vị', req: true, full: true }, { key: 'short', label: 'Tên viết tắt' },
      { key: 'type', label: 'Loại', type: 'select', empty: false, options: Object.entries(this.TYPES).map(([v, t]) => ({ v, t })) },
      { key: 'address', label: 'Địa chỉ', full: true }, { key: 'phone', label: 'Điện thoại' }, { key: 'color', label: 'Màu nhận diện', type: 'color' },
      { section: 'Định vị chấm công' },
      { key: 'lat', label: 'Vĩ độ (lat)', type: 'number', step: 'any', req: true }, { key: 'lng', label: 'Kinh độ (lng)', type: 'number', step: 'any', req: true },
      { key: 'radius', label: 'Bán kính cho phép (m)', type: 'number', req: true },
    ];
    const m = UI.formModal({ title: u ? 'Sửa đơn vị' : 'Thêm đơn vị', fields, data: u || { type: 'store', radius: 150, color: '#FF6900', lat: 21.27, lng: 106.19 },
      extra: `<button class="btn soft block mt" id="gps-here">${icon('pin', 'sm')} Lấy vị trí hiện tại của tôi (đứng tại cửa hàng)</button>`,
      onSave: v => { Store.upsert('units', { ...(u || {}), ...v }); UI.toast('Đã lưu đơn vị'); App.refresh(); } });
    $('#gps-here', m.el).onclick = async () => {
      try { const p = await getPosition(); m.el.querySelector('[name=lat]').value = p.lat.toFixed(6); m.el.querySelector('[name=lng]').value = p.lng.toFixed(6); UI.toast(`Đã lấy vị trí (sai số ±${p.acc}m)`); }
      catch (e) { UI.toast(e.message, 'error'); }
    };
  },
  positions(el) {
    const emps = Store.list('employees');
    el.innerHTML = `<div class="toolbar"><div class="grow muted">Vị trí quy định mức lương mặc định và mẫu công thức lương.</div><button class="btn primary" onclick="Pages.org.posForm()">${icon('plus', 'sm')} Thêm vị trí</button></div>
      <div class="card flush">${UI.table(Store.list('positions'), [
        { label: 'Vị trí', primary: true, render: p => `<b>${esc(p.name)}</b>` },
        { label: 'Lương cơ bản', render: p => money(p.baseSalary) }, { label: 'Phụ cấp', render: p => money(p.allowance) },
        { label: 'Lương giờ', render: p => p.hourlyRate ? money(p.hourlyRate) : '—' },
        { label: 'Mẫu lương', render: p => esc(Store.get('payTemplates', p.payTemplateId)?.name || '—') },
        { label: 'Số NV', render: p => emps.filter(e => e.positionId === p.id && e.status !== 'resigned').length },
        { label: '', cls: 'acts', render: p => `<button class="btn sm icon" onclick="event.stopPropagation();Pages.org.removePos('${p.id}')">${icon('trash', 'sm')}</button>` },
      ], { onRow: p => `Pages.org.posForm('${p.id}')` })}</div>`;
  },
  posForm(id) {
    const p = id ? Store.pos(id) : null;
    UI.formModal({ title: p ? 'Sửa vị trí' : 'Thêm vị trí', fields: [
      { key: 'name', label: 'Tên vị trí', req: true, full: true },
      { key: 'baseSalary', label: 'Lương cơ bản (đ)', type: 'money' }, { key: 'allowance', label: 'Phụ cấp (đ)', type: 'money' },
      { key: 'hourlyRate', label: 'Lương giờ (đ)', type: 'money' },
      { key: 'payTemplateId', label: 'Mẫu tính lương', type: 'select', req: true, options: Store.list('payTemplates').map(t => ({ v: t.id, t: t.name })) },
      { key: 'desc', label: 'Mô tả công việc', type: 'textarea', full: true },
      { key: 'applyAll', label: 'Áp dụng mức lương mới cho nhân viên hiện có ở vị trí này', type: 'checkbox', full: true },
    ], data: p || {}, onSave: v => {
      const apply = v.applyAll; delete v.applyAll;
      const saved = Store.upsert('positions', { ...(p || {}), ...v });
      if (apply) { Store.list('employees').filter(e => e.positionId === saved.id).forEach(e => Object.assign(e, { baseSalary: v.baseSalary, allowance: v.allowance, hourlyRate: v.hourlyRate })); Store.save(); }
      UI.toast('Đã lưu vị trí'); App.refresh();
    } });
  },
  removePos(id) {
    if (Store.list('employees').some(e => e.positionId === id)) return UI.toast('Vị trí đang có nhân viên, không thể xóa', 'warn');
    UI.confirm('Xóa vị trí này?', () => { Store.remove('positions', id); App.refresh(); }, { danger: true, okText: 'Xóa' });
  },
};
