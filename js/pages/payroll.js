/* Bảng lương */
Pages.payroll = {
  title: 'Bảng lương', month: shiftMonth(ym(), -1), unit: '',
  setMonth(m) { Pages.payroll.month = m; App.refresh(); },
  data() {
    const p = PayrollEngine.payrollOf(this.month), locked = p?.status === 'locked';
    const ids = new Set(Store.scopeEmployees().map(e => e.id));
    let rows = locked ? p.rows : PayrollEngine.generate(this.month);
    rows = rows.filter(r => ids.has(r.employeeId) && (!this.unit || r.unitId === this.unit));
    return { p, locked, rows };
  },
  render(root) {
    const { p, locked, rows } = this.data(), inputs = Store.settings.monthInputs;
    const sum = (k) => rows.reduce((s, r) => s + r[k], 0);
    const errs = rows.filter(r => r.error);
    root.innerHTML = `<div class="toolbar">${UI.monthPicker(this.month, 'Pages.payroll.setMonth')}${UI.unitSelect('pr-unit', this.unit, 'Pages.payroll.unit=this.value;App.refresh()')}<div class="grow"></div>
        <button class="btn" onclick="Pages.payroll.export()">${icon('download', 'sm')} Xuất Excel</button>
        ${Store.isAdmin() ? (locked ? `<button class="btn" onclick="Pages.payroll.unlock()">${icon('lock', 'sm')} Mở khóa</button>` : `<button class="btn primary" onclick="Pages.payroll.lock()">${icon('send', 'sm')} Chốt & gửi phiếu lương</button>`) : ''}</div>
      <div class="ai-box tone-${locked ? 'success' : 'info'}" style="margin-bottom:14px">${icon(locked ? 'lock' : 'info')}<div>${locked ? `<b>Đã chốt ${fmtDT(p.lockedAt)}</b> bởi ${esc(p.lockedBy)}. Nhân viên đã xem được phiếu lương.` : `<b>Bảng lương ${p?.auto ? 'nháp tự động' : 'tạm tính'}</b>, tính trực tiếp từ bảng công, đề xuất đã duyệt và công thức lương. Nhập ${inputs.map(i => i.label.toLowerCase()).join(', ')} ở cột tương ứng rồi chốt.`}</div></div>
      ${errs.length ? `<div class="ai-box tone-danger" style="margin-bottom:14px">${icon('alert')}<div>Lỗi công thức: ${errs.slice(0, 3).map(r => esc(Store.emp(r.employeeId)?.name + ' – ' + r.error)).join('; ')}</div></div>` : ''}
      <div class="grid g4" style="margin-bottom:14px">${UI.stat('Số nhân viên', rows.length, 'users')}${UI.stat('Tổng thu nhập', short(sum('gross')), 'trend', 'info')}${UI.stat('Tổng khấu trừ', short(sum('deduct')), 'money', 'warning')}${UI.stat('Thực lĩnh', short(sum('net')), 'wallet', 'success')}</div>
      <div class="card flush">${UI.table(rows, [
        { label: 'Nhân viên', primary: true, render: r => UI.empCell(Store.emp(r.employeeId), esc(r.template || '')) },
        { label: 'Công', render: r => `${num(r.vars.NGAY_CONG)}/${r.vars.CONG_CHUAN}` },
        { label: 'OT · Muộn', render: r => `${num(r.vars.GIO_OT)}h · ${r.vars.DI_MUON}` },
        ...inputs.map(f => ({ label: f.label, render: r => locked ? num(r.vars[f.key], 0) : `<input class="input" style="height:34px;width:130px;text-align:right" type="number" value="${r.vars[f.key] || ''}" onclick="event.stopPropagation()" onchange="Pages.payroll.setInput('${r.employeeId}','${f.key}',this.value)">` })),
        { label: 'Thu nhập', render: r => `<span class="mono">${money(r.gross)}</span>` },
        { label: 'Khấu trừ', render: r => `<span class="mono" style="color:var(--danger)">${money(r.deduct)}</span>` },
        { label: 'Thực lĩnh', render: r => `<b class="mono" style="color:var(--primary-ink)">${money(r.net)}</b>` },
      ], { onRow: r => `Pages.payroll.slip('${r.employeeId}')`, empty: 'Không có nhân viên trong kỳ lương' })}</div>`;
  },
  setInput(empId, key, val) {
    const m = Store.db.monthInputs[this.month] || (Store.db.monthInputs[this.month] = {});
    (m[empId] = m[empId] || {})[key] = Number(val) || 0; Store.save(); App.refresh();
  },
  rowOf(empId, month) {
    const p = PayrollEngine.payrollOf(month);
    if (p?.status === 'locked') return p.rows.find(r => r.employeeId === empId);
    const e = Store.emp(empId); return e ? PayrollEngine.compute(e, month) : null;
  },
  slipHTML(r, month) {
    const e = Store.emp(r.employeeId), v = r.vars;
    const line = (a, b, cls = '') => `<div class="line ${cls}"><span>${a}</span><b class="mono">${b}</b></div>`;
    return `<div class="payslip"><div class="row" style="margin-bottom:14px">${avatar(e)}<div class="grow"><b>${esc(e.name)}</b><div class="faint">${esc(e.code)} · ${esc(Store.pos(e.positionId)?.name)} · ${esc(Store.unit(e.unitId)?.name)}</div></div>${badge(monthLabel(month), 'primary', true)}</div>
      <div class="grid g3" style="margin-bottom:12px">${[['Ngày công', `${num(v.NGAY_CONG)}/${v.CONG_CHUAN}`], ['Giờ làm', num(v.GIO_LAM)], ['Tăng ca', num(v.GIO_OT) + 'h']].map(([a, b]) => `<div class="card" style="padding:10px;text-align:center"><div class="faint">${a}</div><b>${b}</b></div>`).join('')}</div>
      <h3 style="margin:10px 0 4px;color:var(--success)">Thu nhập</h3>${r.items.filter(i => i.kind === 'earn').map(i => line(esc(i.name), money(i.value))).join('')}${line('Tổng thu nhập', money(r.gross))}
      <h3 style="margin:14px 0 4px;color:var(--danger)">Khấu trừ</h3>${r.items.filter(i => i.kind === 'deduct').map(i => line(esc(i.name), money(i.value))).join('')}${line('Tổng khấu trừ', money(r.deduct))}
      <div class="row between" style="margin-top:16px;padding:14px;border-radius:14px;background:var(--primary-soft)"><b>THỰC LĨNH</b><span class="total mono">${money(r.net)}</span></div>
      <div class="faint mt">Chuyển khoản: ${esc(e.bank || '')} ${esc(e.bankNo || '')} · Đi muộn ${v.DI_MUON} lần · Nghỉ phép ${v.NGHI_PHEP} ngày · Vắng ${v.NGHI_KP} ngày</div></div>`;
  },
  slip(empId, month = this.month) {
    const r = this.rowOf(empId, month); if (!r) return;
    UI.modal({ title: 'Phiếu lương', body: `<div id="slip-print">${this.slipHTML(r, month)}</div>`, foot: `<button class="btn" onclick="Pages.payroll.printSlip()">${icon('printer', 'sm')} In / Lưu PDF</button>` });
  },
  printSlip() {
    const w = window.open('', '_blank');
    w.document.write(`<html><head><title>Phiếu lương</title>${$$('link[rel=stylesheet]').map(l => `<link rel="stylesheet" href="${l.href}">`).join('')}</head><body style="padding:24px;background:#fff">${$('#slip-print').innerHTML}<script>setTimeout(()=>print(),600)<\/script></body></html>`);
    w.document.close();
  },
  lock() {
    const rows = PayrollEngine.generate(this.month);
    UI.confirm(`Chốt bảng lương ${monthLabel(this.month)} cho ${rows.length} nhân viên? Sau khi chốt, số liệu được cố định và nhân viên xem được phiếu lương.`, () => {
      const p = PayrollEngine.payrollOf(this.month);
      Store.upsert('payrolls', { ...(p || {}), month: this.month, status: 'locked', rows, lockedAt: Date.now(), lockedBy: Store.me().name });
      rows.forEach(r => Store.notify(r.employeeId, `Phiếu lương ${monthLabel(this.month)} đã có: thực lĩnh ${money(r.net)}`, 'me'));
      Store.save(); UI.toast('Đã chốt và gửi phiếu lương'); App.refresh();
    }, { okText: 'Chốt bảng lương' });
  },
  unlock() { UI.confirm('Mở khóa để tính lại bảng lương tháng này?', () => { const p = PayrollEngine.payrollOf(this.month); Store.upsert('payrolls', { ...p, status: 'draft' }); App.refresh(); }); },
  export() {
    const { rows } = this.data();
    exportExcel('Bang-luong-' + this.month, { ['Lương ' + this.month]: rows.map(r => {
      const e = Store.emp(r.employeeId);
      return { 'Mã NV': e.code, 'Họ tên': e.name, 'Đơn vị': Store.unit(r.unitId)?.name, 'Vị trí': Store.pos(e.positionId)?.name, 'Ngày công': r.vars.NGAY_CONG, 'Giờ OT': r.vars.GIO_OT, 'Đi muộn': r.vars.DI_MUON,
        ...Object.fromEntries(r.items.map(i => [i.name, i.value])), 'Tổng thu nhập': r.gross, 'Tổng khấu trừ': r.deduct, 'Thực lĩnh': r.net, 'Ngân hàng': e.bank, 'Số TK': e.bankNo };
    }) });
  },
};
