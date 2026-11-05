/* Trang cá nhân của nhân viên */
Pages.me = {
  title: 'Của tôi', month: ym(),
  sub: () => fmtDate(ymd()),
  render(root) {
    const e = Store.myEmp();
    if (!e) { root.innerHTML = `<div class="empty">${icon('user')}Tài khoản chưa gắn với hồ sơ nhân viên</div>`; return; }
    const today = ymd(), sh = Store.shiftOf(e.id, today), att = Store.attOf(e.id, today), st = PayrollEngine.monthStats(e, ym());
    const next = Array.from({ length: 7 }, (_, i) => addDays(today, i));
    root.innerHTML = `
      <div class="hero" style="margin-bottom:16px"><div class="row" style="position:relative;z-index:1">${avatar(e, 'lg')}
        <div class="grow"><div style="opacity:.9">Xin chào,</div><h1 style="font-size:22px">${esc(e.name)}</h1><div style="opacity:.9">${esc(Store.pos(e.positionId)?.name)} · ${esc(Store.unit(e.unitId)?.name)}</div></div></div>
        <div class="card mt" style="position:relative;z-index:1;color:var(--text)"><div class="row between wrap">
          <div><div class="faint">Hôm nay</div><b>${sh ? `${esc(sh.name)} · ${sh.start}–${sh.end}` : 'Không có ca'}</b>
            <div class="faint">Vào ${att?.checkIn ? hm(att.checkIn.ts) : '--:--'} · Ra ${att?.checkOut ? hm(att.checkOut.ts) : '--:--'}</div></div>
          <button class="btn primary" onclick="App.go('checkin')">${icon('scan', 'sm')} ${!att ? 'Chấm công vào' : !att.checkOut ? 'Chấm công ra' : 'Đã chấm đủ'}</button></div></div>
      </div>
      <div class="grid g4">${UI.stat('Ngày công tháng này', num(st.NGAY_CONG), 'checkCircle', 'success')}${UI.stat('Số lần đi muộn', st.DI_MUON, 'clock', 'warning')}${UI.stat('Giờ tăng ca', num(st.GIO_OT), 'zap', 'primary')}${UI.stat('Nghỉ phép', st.NGHI_PHEP, 'calendar', 'info')}</div>
      <div class="grid g2 mt">
        <div class="card"><div class="card-head"><h3>Lịch ca 7 ngày tới</h3></div>
          ${next.map(d => { const s = Store.shiftOf(e.id, d); return `<div class="list-item"><div style="width:44px;text-align:center"><div class="faint">${WEEKDAY[wd(d)]}</div><b>${d.slice(8)}</b></div>
            <div class="grow">${s ? `<b>${esc(s.name)}</b><div class="faint">${s.start} – ${s.end}</div>` : '<span class="faint">Nghỉ</span>'}</div>${s ? `<span class="shift-pill" style="background:${s.color};width:46px;text-align:center">${s.code}</span>` : ''}</div>`; }).join('')}</div>
        <div class="card"><div class="card-head"><h3>Phiếu lương</h3></div><div id="me-pay"></div>
          <div class="row wrap mt"><button class="btn soft" onclick="Pages.requests.form('leave')">${icon('calendar', 'sm')} Xin nghỉ phép</button><button class="btn soft" onclick="Pages.requests.form('ot')">${icon('clock', 'sm')} Đăng ký tăng ca</button><button class="btn" onclick="Pages.me.password()">${icon('lock', 'sm')} Đổi mật khẩu</button></div></div>
      </div>
      <div class="mt" id="me-cal"></div>`;
    this.payslips($('#me-pay'), e, true);
    this.attCalendar($('#me-cal'), e, this.month);
  },
  payslips(el, e, compact) {
    const list = Store.list('payrolls').filter(p => p.status === 'locked' && p.rows.some(r => r.employeeId === e.id)).sort((a, b) => b.month.localeCompare(a.month));
    const html = list.length ? list.map(p => { const r = p.rows.find(x => x.employeeId === e.id); return `<div class="list-item" style="cursor:pointer" onclick="Pages.payroll.slip('${e.id}','${p.month}')">
      <div class="stat"><div class="ic tone-success" style="width:40px;height:40px">${icon('wallet', 'sm')}</div></div><div class="grow"><b>${monthLabel(p.month)}</b><div class="faint">${num(r.vars.NGAY_CONG)} công · chốt ${fmtDate(ymd(p.lockedAt))}</div></div><b class="mono">${money(r.net)}</b>${icon('chevronRight', 'sm')}</div>`; }).join('')
      : `<div class="empty">${icon('wallet')}Chưa có phiếu lương đã chốt</div>`;
    el.innerHTML = compact ? html : `<div class="card">${html}</div>`;
  },
  attCalendar(el, e, month) {
    const days = monthDays(month), first = (wd(days[0]) + 6) % 7, st = PayrollEngine.monthStats(e, month);
    el.innerHTML = `<div class="card"><div class="card-head"><h3>Bảng công ${monthLabel(month)}</h3>
      <div class="row" style="gap:6px"><button class="icon-btn" onclick="Pages.me.cal('${e.id}','${shiftMonth(month, -1)}')">${icon('chevronLeft')}</button><button class="icon-btn" onclick="Pages.me.cal('${e.id}','${shiftMonth(month, 1)}')">${icon('chevronRight')}</button></div></div>
      <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:6px;text-align:center">
        ${['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(d => `<div class="faint" style="font-weight:700">${d}</div>`).join('')}
        ${'<div></div>'.repeat(first)}
        ${days.map(d => { const c = Pages.attendance.cell(e, d), a = c.a;
          return `<div style="border:1px solid var(--border);border-radius:12px;padding:6px 2px;min-height:62px;${d === ymd() ? 'border-color:var(--primary)' : ''};${a ? 'cursor:pointer' : ''}" ${a ? `onclick="Pages.attendance.detail('${a.id}')"` : ''}>
          <div style="font-weight:700;font-size:13px">${Number(d.slice(8))}</div>${c.txt ? `<span class="att-cell ${c.tone ? 'tone-' + c.tone : ''}" style="width:26px;height:22px;${c.plan ? 'color:var(--text-3)' : ''}">${c.txt}</span>` : ''}
          ${a ? `<div style="font-size:10.5px" class="faint">${hm(a.checkIn.ts)}${a.checkOut ? '-' + hm(a.checkOut.ts) : ''}</div>` : ''}</div>`; }).join('')}
      </div>
      <div class="row wrap mt">${badge(`${num(st.NGAY_CONG)} công`, 'success')}${badge(`${num(st.GIO_LAM)} giờ`, 'info')}${badge(`Muộn ${st.DI_MUON} lần`, 'warning')}${badge(`Vắng ${st.NGHI_KP}`, 'danger')}</div></div>`;
  },
  cal(empId, month) { this.attCalendar(document.getElementById('me-cal') || document.getElementById('ed-body'), Store.emp(empId), month); },
  password() {
    const acc = Store.me();
    UI.formModal({ title: 'Đổi mật khẩu', size: 'sm', fields: [{ key: 'old', label: 'Mật khẩu hiện tại', type: 'password', req: true, full: true }, { key: 'n1', label: 'Mật khẩu mới', type: 'password', req: true, full: true }, { key: 'n2', label: 'Nhập lại', type: 'password', req: true, full: true }],
      onSave: v => {
        if (v.old !== acc.password) { UI.toast('Mật khẩu hiện tại không đúng', 'error'); return false; }
        if (v.n1.length < 6 || v.n1 !== v.n2) { UI.toast('Mật khẩu mới tối thiểu 6 ký tự và phải trùng nhau', 'warn'); return false; }
        Store.upsert('accounts', { id: acc.id, password: v.n1 }); UI.toast('Đã đổi mật khẩu');
      } });
  },
};
