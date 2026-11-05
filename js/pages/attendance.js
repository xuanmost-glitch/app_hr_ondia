/* Bảng công */
Pages.attendance = {
  title: 'Bảng công', month: ym(), unit: '', view: 'today',
  cell(e, d) {
    const a = Store.attOf(e.id, d), sh = Store.shiftOf(e.id, d), today = ymd();
    const leave = Store.list('requests').some(q => q.type === 'leave' && q.status === 'approved' && q.employeeId === e.id && d >= q.date && d <= (q.endDate || q.date));
    if (a) {
      const r = PayrollEngine.analyze(a, Store.shift(a.shiftId) || sh);
      const warn = (a.checkIn?.warnings?.length || a.checkOut?.warnings?.length);
      const t = r.cong === 1 ? (r.late ? ['M', 'warning'] : ['✓', 'success']) : r.cong === 0.5 ? ['½', 'info'] : ['0', 'danger'];
      return { txt: t[0], tone: warn ? 'danger' : t[1], r, a };
    }
    if (leave) return { txt: 'P', tone: 'info' };
    if (sh && d < today) return { txt: 'V', tone: 'danger' };
    if (sh) return { txt: sh.code, tone: '', plan: true };
    return { txt: '', tone: '' };
  },
  render(root) {
    const manage = Store.canManage();
    if (!manage) this.view = 'month';
    root.innerHTML = `<div class="toolbar">
      ${manage ? `<div class="tabs" style="margin:0"><div class="tab ${this.view === 'today' ? 'active' : ''}" onclick="Pages.attendance.view='today';App.refresh()">Hôm nay</div><div class="tab ${this.view === 'month' ? 'active' : ''}" onclick="Pages.attendance.view='month';App.refresh()">Bảng công tháng</div></div>` : ''}
      <div class="grow"></div>
      ${manage ? UI.unitSelect('att-unit', this.unit, 'Pages.attendance.unit=this.value;App.refresh()') : ''}
      ${this.view === 'month' ? UI.monthPicker(this.month, 'Pages.attendance.setMonth') : ''}
      ${manage && this.view === 'month' ? `<button class="btn" onclick="Pages.attendance.export()">${icon('download', 'sm')}<span class="desktop-only">Xuất Excel</span></button>` : ''}
    </div><div id="att-body"></div>`;
    this.view === 'today' ? this.today($('#att-body')) : this.monthGrid($('#att-body'));
  },
  setMonth(m) { Pages.attendance.month = m; App.refresh(); },
  emps() { return Store.scopeEmployees(false).filter(e => !this.unit || e.unitId === this.unit); },
  today(el) {
    const d = ymd(), emps = this.emps().filter(e => Store.shiftOf(e.id, d) || Store.attOf(e.id, d));
    const rows = emps.map(e => ({ e, sh: Store.shiftOf(e.id, d), a: Store.attOf(e.id, d) }));
    const done = rows.filter(r => r.a).length, warn = rows.filter(r => r.a && (r.a.checkIn?.warnings?.length || r.a.checkOut?.warnings?.length)).length;
    el.innerHTML = `<div class="grid g4" style="margin-bottom:14px">${UI.stat('Có ca hôm nay', rows.length, 'calendar')}${UI.stat('Đã vào ca', done, 'checkCircle', 'success')}${UI.stat('Chưa chấm', rows.length - done, 'clock', 'warning')}${UI.stat('Có cảnh báo AI/GPS', warn, 'alert', 'danger')}</div>
      <div class="card flush">${UI.table(rows, [
        { label: 'Nhân viên', primary: true, render: r => UI.empCell(r.e, esc(Store.unit(r.e.unitId)?.name)) },
        { label: 'Ca', render: r => r.sh ? `${esc(r.sh.name)} <span class="faint">${r.sh.start}-${r.sh.end}</span>` : '—' },
        { label: 'Ảnh', render: r => r.a?.checkIn?.photo ? `<img src="${r.a.checkIn.photo}" class="avatar sm" style="border-radius:8px">` : '—' },
        { label: 'Vào', render: r => r.a ? `<b>${hm(r.a.checkIn.ts)}</b>` : '—' },
        { label: 'Ra', render: r => r.a?.checkOut ? `<b>${hm(r.a.checkOut.ts)}</b>` : '—' },
        { label: 'Trạng thái', render: r => this.stateBadge(r) },
      ], { onRow: r => r.a ? `Pages.attendance.detail('${r.a.id}')` : '', empty: 'Không có ca làm việc hôm nay' })}</div>`;
  },
  stateBadge({ a, sh }) {
    if (!a) return badge('Chưa chấm công', 'warning');
    const r = PayrollEngine.analyze(a, Store.shift(a.shiftId) || sh), w = [...(a.checkIn?.warnings || []), ...(a.checkOut?.warnings || [])];
    return (r.late ? badge(`Muộn ${r.lateMin}p`, 'warning') : badge('Đúng giờ', 'success')) + (w.length ? ' ' + badge('Cảnh báo', 'danger') : '');
  },
  monthGrid(el) {
    const days = monthDays(this.month), emps = this.emps(), today = ymd();
    el.innerHTML = `<div class="row wrap faint" style="margin-bottom:10px;gap:12px">
        <span><span class="att-cell tone-success">✓</span> Đủ công</span><span><span class="att-cell tone-warning">M</span> Đi muộn</span><span><span class="att-cell tone-info">½</span> Nửa công</span>
        <span><span class="att-cell tone-info">P</span> Nghỉ phép</span><span><span class="att-cell tone-danger">V</span> Vắng / cảnh báo</span></div>
      <div class="card flush"><div class="table-wrap" style="max-height:70vh"><table class="sched"><thead><tr><th class="name">Nhân viên</th>
        ${days.map(d => `<th class="${d === today ? 'today' : ''}">${WEEKDAY[wd(d)]}<br>${d.slice(8)}</th>`).join('')}<th>Công</th><th>Muộn</th><th>OT</th></tr></thead><tbody>
        ${emps.map(e => { const st = PayrollEngine.monthStats(e, this.month); return `<tr><td class="name">${UI.empCell(e, esc(Store.unit(e.unitId)?.short))}</td>
          ${days.map(d => { const c = this.cell(e, d); return `<td>${c.txt ? `<span class="att-cell ${c.tone ? 'tone-' + c.tone : ''}" style="${c.plan ? 'color:var(--text-3)' : 'cursor:pointer'}" ${c.a ? `onclick="Pages.attendance.detail('${c.a.id}')"` : (Store.canManage() && !c.plan && d <= today ? `onclick="Pages.attendance.manual('${e.id}','${d}')"` : '')}>${c.txt}</span>` : (Store.canManage() && d <= today && Store.shiftOf(e.id, d) == null ? '' : '')}</td>`; }).join('')}
          <td><b>${num(st.NGAY_CONG)}</b></td><td>${st.DI_MUON}</td><td>${num(st.GIO_OT)}</td></tr>`; }).join('')}
      </tbody></table></div></div>`;
  },
  detail(id) {
    const a = Store.get('attendance', id), e = Store.emp(a.employeeId), sh = Store.shift(a.shiftId), unit = Store.unit(a.unitId);
    const r = PayrollEngine.analyze(a, sh);
    const part = (lbl, x) => !x ? `<div class="card"><h3>${lbl}</h3><div class="empty">Chưa chấm</div></div>` : `<div class="card"><div class="row between"><h3>${lbl}</h3><b class="mono">${hm(x.ts)}</b></div>
      ${x.photo ? `<img src="${x.photo}" style="width:100%;border-radius:12px;margin:10px 0;aspect-ratio:3/4;object-fit:cover">` : '<div class="faint" style="margin:10px 0">Không lưu ảnh (dữ liệu mẫu)</div>'}
      <div class="stack" style="gap:6px;font-size:13px"><div>${icon('pin', 'sm')} ${x.dist != null ? `Cách cửa hàng ${x.dist}m` : 'Không có GPS'} ${x.lat ? `<a target="_blank" href="https://www.google.com/maps?q=${x.lat},${x.lng}">Xem bản đồ</a>` : ''}</div>
      <div>${icon('scan', 'sm')} AI: ${x.face === 'good' || x.face === 'ok' ? badge('Hợp lệ', 'success') : x.face === 'warn' ? badge('Nhắc nhở', 'warning') : badge('Cảnh báo', 'danger')} ${x.faceScore != null ? `<span class="faint">khớp ${Math.max(0, Math.round((1 - x.faceScore) * 100))}%</span>` : ''}</div>
      ${x.warnings?.length ? `<div class="ai-box tone-danger">${icon('alert', 'sm')}<div>${x.warnings.map(esc).join('<br>')}</div></div>` : ''}</div></div>`;
    UI.modal({ title: `${esc(e.name)} · ${fmtDate(a.date)}`, size: 'lg', body: `<div class="row wrap" style="margin-bottom:14px">${badge(sh ? `${sh.name} ${sh.start}-${sh.end}` : 'Ngoài ca', 'info', true)}${badge(unit?.name || '', 'primary', true)}${badge(`${num(r.cong)} công · ${num(r.workMin / 60)} giờ`, 'success', true)}${r.late ? badge(`Muộn ${r.lateMin} phút`, 'warning') : ''}</div>
      <div class="grid g2">${part('Vào ca', a.checkIn)}${part('Ra ca', a.checkOut)}</div>`,
      foot: Store.canManage() ? `<button class="btn danger" onclick="Pages.attendance.remove('${id}')">${icon('trash', 'sm')} Xóa</button><button class="btn" onclick="UI.closeAll();Pages.attendance.manual('${e.id}','${a.date}')">${icon('edit', 'sm')} Sửa giờ</button>` : '' });
  },
  manual(empId, d) {
    const a = Store.attOf(empId, d), sh = Store.shiftOf(empId, d);
    UI.formModal({ title: 'Chấm công thủ công · ' + fmtDate(d), size: 'sm', data: { in: a ? hm(a.checkIn.ts) : sh?.start, out: a?.checkOut ? hm(a.checkOut.ts) : sh?.end, note: a?.note },
      fields: [{ key: 'in', label: 'Giờ vào', type: 'time', req: true }, { key: 'out', label: 'Giờ ra', type: 'time' }, { key: 'note', label: 'Lý do điều chỉnh', type: 'textarea', full: true, req: true }],
      onSave: v => {
        const mk = t => ({ ts: new Date(`${d}T${t}:00`).getTime(), photo: '', face: 'warn', warnings: ['Quản lý chấm thủ công'] });
        Store.upsert('attendance', { ...(a || { employeeId: empId, date: d, shiftId: sh?.id || null, unitId: Store.emp(empId).unitId }), checkIn: { ...(a?.checkIn || {}), ...mk(v.in), photo: a?.checkIn?.photo || '' }, checkOut: v.out ? mk(v.out) : null, note: v.note + ` (${Store.me().name})` });
        UI.toast('Đã lưu chấm công'); App.refresh();
      } });
  },
  remove(id) { UI.confirm('Xóa bản ghi chấm công này?', () => { Store.remove('attendance', id); UI.closeAll(); App.refresh(); }, { danger: true, okText: 'Xóa' }); },
  export() {
    const days = monthDays(this.month);
    exportExcel('Bang-cong-' + this.month, { ['Công ' + this.month]: this.emps().map(e => {
      const st = PayrollEngine.monthStats(e, this.month);
      return { 'Mã NV': e.code, 'Họ tên': e.name, 'Đơn vị': Store.unit(e.unitId)?.name, ...Object.fromEntries(days.map(d => [d.slice(8), this.cell(e, d).txt])), 'Ngày công': st.NGAY_CONG, 'Giờ làm': st.GIO_LAM, 'Đi muộn': st.DI_MUON, 'Phút muộn': st.PHUT_MUON, 'Nghỉ phép': st.NGHI_PHEP, 'Vắng KP': st.NGHI_KP, 'Giờ OT': st.GIO_OT };
    }) });
  },
};
