/* Dữ liệu mẫu ban đầu – có thể sửa toàn bộ trong app */
function buildSeed() {
  let r = 42; const rnd = () => ((r = (r * 16807) % 2147483647) / 2147483647);
  const units = [
    { id: 'u_hvt', name: 'Xiaomi Hoàng Văn Thụ', short: 'HVT', type: 'store', address: 'Đường Hoàng Văn Thụ, TP Bắc Giang', phone: '0204 3xxx 001', lat: 21.2731, lng: 106.1946, radius: 150, color: '#FF6900' },
    { id: 'u_yd', name: 'Xiaomi Yên Dũng', short: 'YD', type: 'store', address: 'TT Nham Biền, Yên Dũng, Bắc Giang', phone: '0204 3xxx 002', lat: 21.2097, lng: 106.2436, radius: 150, color: '#1570EF' },
    { id: 'u_hh', name: 'Xiaomi Hiệp Hòa', short: 'HH', type: 'store', address: 'TT Thắng, Hiệp Hòa, Bắc Giang', phone: '0204 3xxx 003', lat: 21.3540, lng: 105.9750, radius: 150, color: '#079455' },
    { id: 'u_ln', name: 'Xiaomi Lục Ngạn', short: 'LN', type: 'store', address: 'TT Chũ, Lục Ngạn, Bắc Giang', phone: '0204 3xxx 004', lat: 21.3708, lng: 106.5530, radius: 150, color: '#7A5AF8' },
    { id: 'u_kd', name: 'P.Kinh Doanh 102', short: 'KD', type: 'dept', address: 'Văn phòng 102, TP Bắc Giang', phone: '', lat: 21.2810, lng: 106.1970, radius: 120, color: '#E31B54' },
    { id: 'u_mkt', name: 'Phòng Marketing', short: 'MKT', type: 'dept', address: 'Văn phòng 102, TP Bắc Giang', phone: '', lat: 21.2810, lng: 106.1970, radius: 120, color: '#0E9384' },
    { id: 'u_bh', name: 'Phòng Bảo Hành - CSKH - Giao hàng', short: 'BH', type: 'dept', address: 'Trung tâm bảo hành, TP Bắc Giang', phone: '', lat: 21.2760, lng: 106.1990, radius: 150, color: '#F79009' },
  ];
  const payTemplates = [
    { id: 'tpl_store', name: 'Bán hàng: lương + hoa hồng', items: [
      { code: 'LCB', name: 'Lương theo ngày công', kind: 'earn', formula: 'LUONG_CB / CONG_CHUAN * (NGAY_CONG + NGHI_PHEP)' },
      { code: 'PC', name: 'Phụ cấp', kind: 'earn', formula: 'PHU_CAP * MIN(1, NGAY_CONG / CONG_CHUAN)' },
      { code: 'OT', name: 'Lương tăng ca', kind: 'earn', formula: 'LUONG_CB / CONG_CHUAN / 8 * GIO_OT_QD' },
      { code: 'HH', name: 'Hoa hồng doanh số 1.5%', kind: 'earn', formula: 'DOANH_SO * 1.5 / 100' },
      { code: 'KT', name: 'Khen thưởng', kind: 'earn', formula: 'THUONG' },
      { code: 'CC', name: 'Thưởng chuyên cần', kind: 'earn', formula: 'IF(AND(DI_MUON == 0, NGAY_CONG >= CONG_CHUAN - 1), 300000, 0)' },
      { code: 'BH', name: 'BHXH, BHYT, BHTN (10.5%)', kind: 'deduct', formula: 'LUONG_CB * 10.5 / 100' },
      { code: 'PM', name: 'Phạt đi muộn', kind: 'deduct', formula: 'MAX(0, DI_MUON - 2) * 50000' },
      { code: 'TNCN', name: 'Thuế TNCN tạm tính', kind: 'deduct', formula: 'MAX(0, LCB + PC + OT + HH + KT + CC - BH - 11000000 - NGUOI_PT * 4400000) * 5 / 100' },
      { code: 'KTK', name: 'Khấu trừ khác', kind: 'deduct', formula: 'KHAU_TRU_KHAC' },
    ] },
    { id: 'tpl_office', name: 'Văn phòng: lương cứng + KPI', items: [
      { code: 'LCB', name: 'Lương theo ngày công', kind: 'earn', formula: 'LUONG_CB / CONG_CHUAN * (NGAY_CONG + NGHI_PHEP)' },
      { code: 'PC', name: 'Phụ cấp', kind: 'earn', formula: 'PHU_CAP * MIN(1, NGAY_CONG / CONG_CHUAN)' },
      { code: 'OT', name: 'Lương tăng ca', kind: 'earn', formula: 'LUONG_CB / CONG_CHUAN / 8 * GIO_OT_QD' },
      { code: 'KPI', name: 'Thưởng KPI', kind: 'earn', formula: 'LUONG_CB * KPI / 100 * 0.2' },
      { code: 'KT', name: 'Khen thưởng', kind: 'earn', formula: 'THUONG' },
      { code: 'BH', name: 'BHXH, BHYT, BHTN (10.5%)', kind: 'deduct', formula: 'LUONG_CB * 10.5 / 100' },
      { code: 'PM', name: 'Phạt đi muộn', kind: 'deduct', formula: 'MAX(0, DI_MUON - 2) * 50000' },
      { code: 'TNCN', name: 'Thuế TNCN tạm tính', kind: 'deduct', formula: 'MAX(0, LCB + PC + OT + KPI + KT - BH - 11000000 - NGUOI_PT * 4400000) * 5 / 100' },
      { code: 'KTK', name: 'Khấu trừ khác', kind: 'deduct', formula: 'KHAU_TRU_KHAC' },
    ] },
    { id: 'tpl_part', name: 'Part-time: lương theo giờ', items: [
      { code: 'LG', name: 'Lương theo giờ', kind: 'earn', formula: 'GIO_LAM * LUONG_GIO' },
      { code: 'OT', name: 'Lương tăng ca', kind: 'earn', formula: 'GIO_OT_QD * LUONG_GIO' },
      { code: 'HH', name: 'Hoa hồng 1%', kind: 'earn', formula: 'DOANH_SO / 100' },
      { code: 'KT', name: 'Khen thưởng', kind: 'earn', formula: 'THUONG' },
      { code: 'PM', name: 'Phạt đi muộn', kind: 'deduct', formula: 'DI_MUON * 20000' },
      { code: 'KTK', name: 'Khấu trừ khác', kind: 'deduct', formula: 'KHAU_TRU_KHAC' },
    ] },
  ];
  const positions = [
    { id: 'p_cht', name: 'Cửa hàng trưởng', baseSalary: 12000000, allowance: 2000000, hourlyRate: 0, payTemplateId: 'tpl_store' },
    { id: 'p_nvbh', name: 'Nhân viên bán hàng', baseSalary: 6500000, allowance: 800000, hourlyRate: 0, payTemplateId: 'tpl_store' },
    { id: 'p_tn', name: 'Thu ngân', baseSalary: 6000000, allowance: 600000, hourlyRate: 0, payTemplateId: 'tpl_store' },
    { id: 'p_pt', name: 'Nhân viên part-time', baseSalary: 0, allowance: 0, hourlyRate: 25000, payTemplateId: 'tpl_part' },
    { id: 'p_tp', name: 'Trưởng phòng', baseSalary: 14000000, allowance: 2500000, hourlyRate: 0, payTemplateId: 'tpl_office' },
    { id: 'p_nvkd', name: 'Nhân viên kinh doanh', baseSalary: 7500000, allowance: 1000000, hourlyRate: 0, payTemplateId: 'tpl_store' },
    { id: 'p_mkt', name: 'Chuyên viên Marketing', baseSalary: 8000000, allowance: 800000, hourlyRate: 0, payTemplateId: 'tpl_office' },
    { id: 'p_ktv', name: 'Kỹ thuật viên bảo hành', baseSalary: 8000000, allowance: 1000000, hourlyRate: 0, payTemplateId: 'tpl_office' },
    { id: 'p_cskh', name: 'Nhân viên CSKH', baseSalary: 6500000, allowance: 700000, hourlyRate: 0, payTemplateId: 'tpl_office' },
    { id: 'p_gh', name: 'Nhân viên giao hàng', baseSalary: 6000000, allowance: 1200000, hourlyRate: 0, payTemplateId: 'tpl_office' },
  ];
  const shifts = [
    { id: 's_s', code: 'S', name: 'Ca sáng', start: '08:00', end: '15:00', break: 60, color: '#F79009', unitType: 'store' },
    { id: 's_c', code: 'C', name: 'Ca chiều', start: '15:00', end: '22:00', break: 30, color: '#7A5AF8', unitType: 'store' },
    { id: 's_g', code: 'G', name: 'Ca gãy', start: '10:00', end: '19:00', break: 120, color: '#0E9384', unitType: 'store' },
    { id: 's_hc', code: 'HC', name: 'Hành chính', start: '08:00', end: '17:30', break: 90, color: '#1570EF', unitType: 'dept' },
  ];
  const plan = [
    ['u_hvt', 'p_cht', 'Nguyễn Văn Hùng', 'M'], ['u_hvt', 'p_nvbh', 'Trần Thị Mai', 'F'], ['u_hvt', 'p_nvbh', 'Lê Minh Tuấn', 'M'], ['u_hvt', 'p_tn', 'Phạm Thu Hà', 'F'],
    ['u_yd', 'p_cht', 'Hoàng Đức Anh', 'M'], ['u_yd', 'p_nvbh', 'Ngô Thị Lan', 'F'], ['u_yd', 'p_nvbh', 'Đỗ Quang Huy', 'M'], ['u_yd', 'p_pt', 'Vũ Ngọc Ánh', 'F'],
    ['u_hh', 'p_cht', 'Bùi Văn Long', 'M'], ['u_hh', 'p_nvbh', 'Đặng Thị Hương', 'F'], ['u_hh', 'p_nvbh', 'Phan Thanh Sơn', 'M'], ['u_hh', 'p_tn', 'Lý Thị Ngọc', 'F'],
    ['u_ln', 'p_cht', 'Trịnh Văn Nam', 'M'], ['u_ln', 'p_nvbh', 'Đinh Thị Thảo', 'F'], ['u_ln', 'p_nvbh', 'Mai Xuân Bách', 'M'], ['u_ln', 'p_pt', 'Hà Phương Linh', 'F'],
    ['u_kd', 'p_tp', 'Nguyễn Thành Công', 'M'], ['u_kd', 'p_nvkd', 'Lưu Thị Yến', 'F'], ['u_kd', 'p_nvkd', 'Tạ Minh Khôi', 'M'],
    ['u_mkt', 'p_tp', 'Cao Thị Diệu Linh', 'F'], ['u_mkt', 'p_mkt', 'Kiều Văn Đạt', 'M'],
    ['u_bh', 'p_ktv', 'Dương Văn Thắng', 'M'], ['u_bh', 'p_cskh', 'Châu Thị Nhung', 'F'], ['u_bh', 'p_gh', 'La Văn Tài', 'M'],
  ];
  const today = ymd();
  const employees = plan.map(([unitId, positionId, name, g], i) => {
    const pos = positions.find(p => p.id === positionId);
    const joinY = 2021 + Math.floor(rnd() * 5);
    return {
      id: 'e' + (i + 1), code: 'NV' + String(i + 1).padStart(3, '0'), name, gender: g === 'M' ? 'Nam' : 'Nữ',
      dob: `${1988 + Math.floor(rnd() * 14)}-${pad2(1 + Math.floor(rnd() * 12))}-${pad2(1 + Math.floor(rnd() * 27))}`,
      phone: '09' + String(Math.floor(rnd() * 1e8)).padStart(8, '0'), email: noAccent(name).replace(/\s+/g, '.') + '@xiaomi-bg.vn',
      idNo: '0240' + String(Math.floor(rnd() * 1e8)).padStart(8, '0'), address: 'Bắc Giang',
      unitId, positionId, joinDate: `${joinY}-${pad2(1 + Math.floor(rnd() * 12))}-01`,
      status: i === 7 ? 'probation' : 'active', empType: positionId === 'p_pt' ? 'Bán thời gian' : 'Toàn thời gian',
      baseSalary: pos.baseSalary, allowance: pos.allowance, hourlyRate: pos.hourlyRate, payTemplateId: '',
      bank: 'Vietcombank', bankNo: '10' + String(Math.floor(rnd() * 1e10)).padStart(10, '0'),
      dependents: Math.floor(rnd() * 3), avatar: '', faceSample: '', faceDesc: null, custom: {},
    };
  });
  const contracts = employees.map((e, i) => {
    const probation = e.status === 'probation';
    const start = probation ? addDays(today, -40) : e.joinDate;
    const end = probation ? addDays(today, 20) : (i % 5 === 0 ? addDays(today, 12 + i) : addDays(start, 365 * 3));
    return { id: 'c' + (i + 1), no: `${String(i + 1).padStart(3, '0')}/HĐLĐ-XMBG`, employeeId: e.id, type: probation ? 'Thử việc' : (i % 3 ? 'Xác định thời hạn 36 tháng' : 'Xác định thời hạn 12 tháng'), start, end, salary: e.baseSalary || e.hourlyRate, status: 'active', note: '' };
  });
  const accounts = [
    { id: 'a_admin', username: 'admin', password: 'admin123', role: 'admin', employeeId: 'e17', name: 'Quản trị hệ thống' },
    { id: 'a_mgr', username: 'hung', password: '123456', role: 'manager', employeeId: 'e1', name: 'Nguyễn Văn Hùng' },
    { id: 'a_nv', username: 'mai', password: '123456', role: 'staff', employeeId: 'e2', name: 'Trần Thị Mai' },
  ];
  // Phân ca tháng trước + tháng này
  const schedules = {}; const attendance = [];
  const cur = ym(), prev = shiftMonth(cur, -1);
  const unitType = (id) => units.find(u => u.id === id).type;
  [prev, cur].forEach(m => monthDays(m).forEach(d => {
    schedules[d] = {};
    const w = wd(d), week = Math.floor(new Date(d + 'T00:00:00').getDate() / 7);
    employees.forEach((e, i) => {
      let s = null;
      if (unitType(e.unitId) === 'dept') s = w === 0 ? null : 's_hc';
      else if ((i + 2) % 7 !== w) s = e.positionId === 'p_cht' ? 's_g' : ((i + week) % 2 ? 's_s' : 's_c');
      if (s) schedules[d][e.id] = s;
      if (!s || d >= today) return;
      if (rnd() < 0.05) return; // vắng
      const sh = shifts.find(x => x.id === s);
      const late = rnd() < 0.12;
      const inMin = toMin(sh.start) + (late ? 7 + Math.floor(rnd() * 28) : -Math.floor(rnd() * 12));
      const outMin = toMin(sh.end) + Math.floor(rnd() * 25) - 3;
      const unit = units.find(u => u.id === e.unitId);
      const mk = (min) => new Date(`${d}T${pad2(Math.floor(min / 60))}:${pad2(min % 60)}:00`).getTime();
      attendance.push({ id: uid('at'), employeeId: e.id, date: d, shiftId: s, unitId: e.unitId,
        checkIn: { ts: mk(inMin), photo: '', lat: unit.lat, lng: unit.lng, dist: Math.floor(rnd() * 40), face: 'ok', faceScore: 0.3 + rnd() * 0.15, warnings: [] },
        checkOut: rnd() < 0.03 ? null : { ts: mk(outMin), photo: '', lat: unit.lat, lng: unit.lng, dist: Math.floor(rnd() * 40), face: 'ok', warnings: [] },
        note: '' });
    });
  }));
  const requests = [
    { id: 'r1', type: 'ot', employeeId: 'e3', unitId: 'u_hvt', date: addDays(today, -2), hours: 2, rate: 1.5, reason: 'Kiểm kê hàng cuối tháng', status: 'pending', createdAt: Date.now() - 864e5, createdBy: 'e3' },
    { id: 'r2', type: 'reward', employeeId: 'e2', unitId: 'u_hvt', date: addDays(today, -3), amount: 500000, title: 'Top doanh số tuần', reason: 'Bán 12 máy Redmi Note trong 1 tuần', status: 'pending', createdAt: Date.now() - 2 * 864e5, createdBy: 'e1' },
    { id: 'r3', type: 'leave', employeeId: 'e6', unitId: 'u_yd', date: addDays(today, 3), endDate: addDays(today, 4), days: 2, paid: true, reason: 'Việc gia đình', status: 'pending', createdAt: Date.now() - 3600e3, createdBy: 'e6' },
    { id: 'r4', type: 'ot', employeeId: 'e22', unitId: 'u_bh', date: addDays(today, -5), hours: 3, rate: 1.5, reason: 'Xử lý tồn bảo hành', status: 'approved', createdAt: Date.now() - 6 * 864e5, createdBy: 'e22', approvedBy: 'admin' },
    { id: 'r5', type: 'reward', employeeId: 'e20', unitId: 'u_mkt', date: addDays(today, -8), amount: 1000000, title: 'Chiến dịch ra mắt Xiaomi 15', reason: 'Vượt 140% chỉ tiêu lead', status: 'approved', createdAt: Date.now() - 8 * 864e5, createdBy: 'e17', approvedBy: 'admin' },
  ];
  const settings = {
    companyName: 'Xiaomi Bắc Giang', theme: 'xiaomi', mode: 'light', density: 'normal',
    graceMin: 5, stdDays: 26, payday: 5, autoPayroll: true,
    faceRequired: true, faceThreshold: 0.5, gpsStrict: false, otRates: [1.5, 2, 3],
    statuses: [
      { key: 'active', label: 'Đang làm việc', tone: 'success' }, { key: 'probation', label: 'Thử việc', tone: 'info' },
      { key: 'leave', label: 'Nghỉ thai sản / dài hạn', tone: 'warning' }, { key: 'resigned', label: 'Đã nghỉ việc', tone: 'danger' },
    ],
    contractTypes: ['Thử việc', 'Xác định thời hạn 12 tháng', 'Xác định thời hạn 36 tháng', 'Không xác định thời hạn', 'Cộng tác viên'],
    customFields: [
      { key: 'uniform', label: 'Size đồng phục', type: 'select', options: 'S,M,L,XL,XXL' },
      { key: 'bhxh', label: 'Số sổ BHXH', type: 'text', options: '' },
    ],
    monthInputs: [
      { key: 'DOANH_SO', label: 'Doanh số (đ)' }, { key: 'KPI', label: 'KPI đạt (%)' }, { key: 'KHAU_TRU_KHAC', label: 'Khấu trừ khác (đ)' },
    ],
    contractTemplate: 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM\nĐộc lập - Tự do - Hạnh phúc\n\nHỢP ĐỒNG LAO ĐỘNG\nSố: {{so_hd}}\n\nBên A (Người sử dụng lao động): {{cong_ty}}\nBên B (Người lao động): {{ho_ten}}, sinh ngày {{ngay_sinh}}, CCCD số {{cccd}}\nĐịa chỉ: {{dia_chi}}\n\nĐiều 1. Bên B làm việc tại {{don_vi}} với chức danh {{vi_tri}}.\nĐiều 2. Loại hợp đồng: {{loai_hd}}, từ ngày {{tu_ngay}} đến ngày {{den_ngay}}.\nĐiều 3. Mức lương: {{muc_luong}}, trả vào ngày {{ngay_tra_luong}} hằng tháng qua tài khoản {{tai_khoan}}.\nĐiều 4. Bên B tuân thủ nội quy, chấm công bằng ứng dụng tại đúng cửa hàng được phân công.\n\nĐẠI DIỆN BÊN A                                    BÊN B',
  };
  const monthInputs = {};
  monthInputs[prev] = {};
  employees.forEach(e => { if (unitType(e.unitId) === 'store' || e.positionId === 'p_nvkd') monthInputs[prev][e.id] = { DOANH_SO: Math.round(80 + rnd() * 220) * 1e6 }; else monthInputs[prev][e.id] = { KPI: Math.round(70 + rnd() * 50) }; });
  return { version: 1, units, positions, payTemplates, employees, contracts, accounts, shifts, schedules, attendance, requests, settings, monthInputs, payrolls: [], notifications: [] };
}
