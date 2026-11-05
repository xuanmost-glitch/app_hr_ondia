/* Tổng quan */
Pages.dashboard = {
  title: 'Tổng quan',
  sub: () => { const d = new Date(); return `${['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'][d.getDay()]}, ${fmtDate(ymd(d))}`; },
  render(root) {
    const today = ymd(), emps = Store.scopeEmployees(false), ids = new Set(emps.map(e => e.id));
    const units = Store.scopeUnits();
    const scheduled = emps.filter(e => Store.shiftOf(e.id, today));
    const attToday = Store.list('attendance').filter(a => a.date === today && ids.has(a.employeeId));
    const late = attToday.filter(a => PayrollEngine.analyze(a, Store.shift(a.shiftId)).late);
    const pending = Store.list('requests').filter(q => q.status === 'pending' && ids.has(q.employeeId));
    const expiring = Store.list('contracts').filter(c => ids.has(c.employeeId) && c.status === 'active' && c.end && diffDays(today, c.end) <= 30 && diffDays(today, c.end) >= -3)
      .sort((a, b) => a.end.localeCompare(b.end));
    const m = today.slice(5, 7);
    const bdays = emps.filter(e => e.dob?.slice(5, 7) === m).sort((a, b) => a.dob.slice(8).localeCompare(b.dob.slice(8)));
    const me = Store.me();
    const hour = new Date().getHours();
    const hi = hour < 11 ? 'Chào buổi sáng' : hour < 14 ? 'Chào buổi trưa' : hour < 18 ? 'Chào buổi chiều' : 'Chào buổi tối';
    const maxHead = Math.max(1, ...units.map(u => emps.filter(e => e.unitId === u.id).length));

    root.innerHTML = `
      <div class="hero" style="margin-bottom:16px">
        <div class="row between wrap" style="position:relative;z-index:1">
          <div><div style="opacity:.9">${hi},</div><h1 style="font-size:24px">${esc(me.name)}</h1>
            <div style="opacity:.9;margin-top:4px">Hôm nay có ${scheduled.length} ca làm việc, đã chấm công ${attToday.length}.</div></div>
          <div class="row"><button class="btn" onclick="App.go('checkin')">${icon('scan')} Chấm công</button>
            <button class="btn desktop-only" onclick="App.go('payroll')">${icon('wallet')} Bảng lương</button></div>
        </div>
      </div>
      <div class="grid g4">
        ${UI.stat('Nhân sự đang làm', emps.length, 'users', 'primary', `${units.length} đơn vị`)}
        ${UI.stat('Đã chấm công hôm nay', `${attToday.length}/${scheduled.length}`, 'checkCircle', 'success')}
        ${UI.stat('Đi muộn hôm nay', late.length, 'clock', 'warning')}
        ${UI.stat('Đề xuất chờ duyệt', pending.length, 'inbox', 'danger')}
      </div>
      <div class="grid g-side mt">
        <div class="card">
          <div class="card-head"><h3>Chấm công hôm nay theo đơn vị</h3><a href="#/attendance" class="faint">Xem bảng công ›</a></div>
          ${units.map(u => {
            const ue = emps.filter(e => e.unitId === u.id), sch = ue.filter(e => Store.shiftOf(e.id, today)).length;
            const done = attToday.filter(a => ue.some(e => e.id === a.employeeId)).length;
            return `<div class="list-item"><span class="avatar sm" style="background:${u.color};border-radius:10px">${esc(u.short || '')}</span>
              <div class="grow"><div class="row between"><span class="t truncate">${esc(u.name)}</span><span class="faint nowrap">${done}/${sch} · ${ue.length} NV</span></div>
              <div class="bar mt" style="margin-top:6px"><i style="width:${sch ? done / sch * 100 : 0}%;background:${u.color}"></i></div></div></div>`;
          }).join('')}
        </div>
        <div class="card">
          <div class="card-head"><h3>Cơ cấu nhân sự</h3></div>
          ${units.map(u => { const n = emps.filter(e => e.unitId === u.id).length; return `<div style="margin-bottom:10px"><div class="row between"><span class="truncate" style="font-size:13px">${esc(u.name)}</span><b>${n}</b></div><div class="bar"><i style="width:${n / maxHead * 100}%;background:${u.color}"></i></div></div>`; }).join('')}
          <div class="row wrap mt">${Store.settings.statuses.map(s => { const n = Store.scopeEmployees().filter(e => e.status === s.key).length; return n ? badge(`${s.label}: ${n}`, s.tone) : ''; }).join('')}</div>
        </div>
      </div>
      <div class="grid g3 mt">
        <div class="card"><div class="card-head"><h3>Đề xuất chờ duyệt</h3><a href="#/requests" class="faint">Tất cả ›</a></div>
          ${pending.length ? pending.slice(0, 5).map(q => `<div class="list-item">${avatar(Store.emp(q.employeeId), 'sm')}<div class="grow"><div class="t truncate">${esc(Store.emp(q.employeeId)?.name)}</div><div class="faint truncate">${Pages.requests.summary(q)}</div></div>${badge(Pages.requests.TYPES[q.type].label, Pages.requests.TYPES[q.type].tone, true)}</div>`).join('') : `<div class="empty">${icon('checkCircle')}Không có đề xuất nào đang chờ</div>`}</div>
        <div class="card"><div class="card-head"><h3>Hợp đồng sắp hết hạn</h3><a href="#/contracts" class="faint">Tất cả ›</a></div>
          ${expiring.length ? expiring.slice(0, 5).map(c => { const d = diffDays(today, c.end); return `<div class="list-item">${avatar(Store.emp(c.employeeId), 'sm')}<div class="grow"><div class="t truncate">${esc(Store.emp(c.employeeId)?.name)}</div><div class="faint">${esc(c.type)} · hết hạn ${fmtDate(c.end)}</div></div>${badge(d < 0 ? 'Đã hết hạn' : `Còn ${d} ngày`, d <= 7 ? 'danger' : 'warning')}</div>`; }).join('') : `<div class="empty">${icon('file')}Không có hợp đồng sắp hết hạn</div>`}</div>
        <div class="card"><div class="card-head"><h3>Sinh nhật tháng này</h3>${icon('gift')}</div>
          ${bdays.length ? bdays.slice(0, 6).map(e => `<div class="list-item">${avatar(e, 'sm')}<div class="grow"><div class="t truncate">${esc(e.name)}</div><div class="faint truncate">${esc(Store.unit(e.unitId)?.name)}</div></div><b class="nowrap">${fmtDate(e.dob).slice(0, 5)}</b></div>`).join('') : `<div class="empty">${icon('gift')}Không có sinh nhật trong tháng</div>`}</div>
      </div>`;
  },
};
