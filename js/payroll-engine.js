/* Tính công & lương */
const VAR_DOCS = [
  ['LUONG_CB', 'Lương cơ bản (hồ sơ / vị trí)'], ['PHU_CAP', 'Phụ cấp tháng'], ['LUONG_GIO', 'Lương theo giờ'],
  ['CONG_CHUAN', 'Số công chuẩn tháng'], ['NGAY_CONG', 'Ngày công thực tế'], ['GIO_LAM', 'Tổng giờ làm'],
  ['SO_CA', 'Số ca được phân'], ['GIO_OT', 'Giờ tăng ca đã duyệt'], ['GIO_OT_QD', 'Giờ OT quy đổi (giờ × hệ số)'],
  ['THUONG', 'Tiền khen thưởng đã duyệt'], ['DI_MUON', 'Số lần đi muộn'], ['PHUT_MUON', 'Tổng phút đi muộn'],
  ['VE_SOM', 'Số lần về sớm'], ['NGHI_PHEP', 'Ngày nghỉ phép có lương đã duyệt'], ['NGHI_KP', 'Ngày vắng không phép'],
  ['THAM_NIEN', 'Số năm thâm niên'], ['NGUOI_PT', 'Số người phụ thuộc'],
];
const PayrollEngine = {
  /* Phân tích 1 bản ghi chấm công theo ca */
  analyze(att, shift) {
    const r = { workMin: 0, late: false, lateMin: 0, early: false, cong: 0, missingOut: false };
    if (!att?.checkIn) return r;
    const grace = Store.settings.graceMin || 0;
    const inM = toMin(hm(att.checkIn.ts));
    if (!shift) { r.cong = 1; return r; }
    const sM = toMin(shift.start), eM = toMin(shift.end), planned = eM - sM - (shift.break || 0);
    if (inM > sM + grace) { r.late = true; r.lateMin = inM - sM; }
    if (!att.checkOut) { r.missingOut = true; r.workMin = planned / 2; r.cong = 0.5; return r; }
    const outM = toMin(hm(att.checkOut.ts));
    if (outM < eM - grace) r.early = true;
    r.workMin = Math.max(0, Math.min(outM, eM) - Math.max(inM, sM) - (shift.break || 0));
    const ratio = planned > 0 ? r.workMin / planned : 1;
    r.cong = ratio >= 0.85 ? 1 : ratio >= 0.4 ? 0.5 : 0;
    return r;
  },
  monthStats(emp, month) {
    const days = monthDays(month), today = ymd();
    const atts = Store.list('attendance').filter(a => a.employeeId === emp.id && a.date.startsWith(month));
    const reqs = Store.list('requests').filter(q => q.employeeId === emp.id && q.status === 'approved' && (q.date || '').startsWith(month));
    const st = { NGAY_CONG: 0, GIO_LAM: 0, SO_CA: 0, DI_MUON: 0, PHUT_MUON: 0, VE_SOM: 0, NGHI_KP: 0, GIO_OT: 0, GIO_OT_QD: 0, THUONG: 0, NGHI_PHEP: 0 };
    const leaveDays = new Set();
    reqs.filter(q => q.type === 'leave' && q.paid).forEach(q => { let d = q.date; while (d <= (q.endDate || q.date)) { if (d.startsWith(month)) leaveDays.add(d); d = addDays(d, 1); } });
    days.forEach(d => {
      const sh = Store.shiftOf(emp.id, d); if (sh) st.SO_CA++;
      const a = atts.find(x => x.date === d);
      if (a) {
        const r = this.analyze(a, Store.shift(a.shiftId) || sh);
        st.NGAY_CONG += r.cong; st.GIO_LAM += r.workMin / 60;
        if (r.late) { st.DI_MUON++; st.PHUT_MUON += r.lateMin; } if (r.early) st.VE_SOM++;
      } else if (sh && d < today && !leaveDays.has(d)) st.NGHI_KP++;
    });
    reqs.forEach(q => {
      if (q.type === 'ot') { st.GIO_OT += +q.hours || 0; st.GIO_OT_QD += (+q.hours || 0) * (+q.rate || 1); }
      if (q.type === 'reward') st.THUONG += +q.amount || 0;
      if (q.type === 'adjust') st.NGAY_CONG += +q.days || 0;
    });
    st.NGHI_PHEP = leaveDays.size;
    st.GIO_LAM = Math.round(st.GIO_LAM * 10) / 10;
    return st;
  },
  vars(emp, month) {
    const st = this.monthStats(emp, month), s = Store.settings;
    const inputs = Store.db.monthInputs[month]?.[emp.id] || {};
    const v = { LUONG_CB: +emp.baseSalary || 0, PHU_CAP: +emp.allowance || 0, LUONG_GIO: +emp.hourlyRate || 0,
      CONG_CHUAN: +s.stdDays || 26, NGUOI_PT: +emp.dependents || 0,
      THAM_NIEN: Math.max(0, Math.floor(diffDays(emp.joinDate || ymd(), month + '-28') / 365)), ...st };
    s.monthInputs.forEach(f => (v[f.key] = +inputs[f.key] || 0));
    return v;
  },
  compute(emp, month) {
    const tpl = Store.payTemplateOf(emp), v = this.vars(emp, month);
    const items = []; let gross = 0, deduct = 0, error = null;
    (tpl?.items || []).forEach(it => {
      let val = 0;
      try { val = Math.round(Formula.evaluate(it.formula, v)); } catch (e) { error = `${it.code}: ${e.message}`; }
      v[it.code] = val; items.push({ code: it.code, name: it.name, kind: it.kind, value: val });
      if (it.kind === 'earn') gross += val; else if (it.kind === 'deduct') deduct += val;
    });
    return { employeeId: emp.id, unitId: emp.unitId, template: tpl?.name, vars: v, items, gross, deduct, net: Math.max(0, gross - deduct), error };
  },
  generate(month, unitId) {
    return Store.list('employees')
      .filter(e => (!unitId || e.unitId === unitId) && (e.status !== 'resigned' || Store.list('attendance').some(a => a.employeeId === e.id && a.date.startsWith(month))))
      .map(e => this.compute(e, month));
  },
  payrollOf(month) { return Store.list('payrolls').find(p => p.month === month); },
  /* Tự động lập bảng lương nháp tháng trước khi đến ngày trả lương */
  autoRun() {
    const s = Store.settings; if (!s.autoPayroll) return;
    const today = new Date(); if (today.getDate() < (s.payday || 5)) return;
    const prev = shiftMonth(ym(), -1);
    if (this.payrollOf(prev)) return;
    Store.upsert('payrolls', { month: prev, status: 'draft', auto: true, createdAt: Date.now(), rows: this.generate(prev) });
    Store.notify('*admin', `Đã tự động lập bảng lương nháp ${monthLabel(prev)}. Vui lòng kiểm tra và chốt.`, 'payroll');
    Store.save();
  },
};
