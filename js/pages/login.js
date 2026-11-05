/* Đăng nhập */
const Pages = {};
Pages.login = {
  render(root) {
    const s = Store.settings;
    const accs = Store.list('accounts').slice(0, 3);
    const roleName = { admin: 'Quản trị', manager: 'Quản lý cửa hàng', staff: 'Nhân viên' };
    root.innerHTML = `<div class="login">
      <div class="login-art">
        <div class="row" style="position:relative"><div class="brand-logo" style="background:#fff;color:var(--primary)">mi</div><b style="font-size:17px">${esc(s.companyName)} · HR</b></div>
        <div style="position:relative">
          <h1>Quản lý nhân sự chuỗi cửa hàng, gọn trong một ứng dụng.</h1>
          <div class="feats">
            <div class="feat">${icon('scan')} Chấm công bằng ảnh, AI kiểm tra khuôn mặt</div>
            <div class="feat">${icon('pin')} Định vị đúng cửa hàng làm việc</div>
            <div class="feat">${icon('calendar')} Phân ca theo từng chi nhánh</div>
            <div class="feat">${icon('wallet')} Tự động tính và xuất bảng lương</div>
          </div>
        </div>
        <div class="faint desktop-only" style="color:rgba(255,255,255,.8);position:relative">${Store.list('units').length} đơn vị · ${Store.list('employees').length} nhân sự</div>
      </div>
      <div class="login-form"><div class="login-box">
        <h2 style="font-size:24px">Đăng nhập</h2>
        <p class="muted" style="margin:6px 0 20px">Chào mừng trở lại, chúc một ngày làm việc hiệu quả.</p>
        <form id="lf" class="stack" onsubmit="Pages.login.submit(event)">
          <div class="field"><label>Tài khoản</label><div class="search">${icon('user', 'sm')}<input class="input" name="u" autocomplete="username" placeholder="Tên đăng nhập" required></div></div>
          <div class="field"><label>Mật khẩu</label><div class="search">${icon('lock', 'sm')}<input class="input" name="p" type="password" autocomplete="current-password" placeholder="••••••" required></div></div>
          <label class="row faint"><input type="checkbox" checked> Ghi nhớ đăng nhập trên thiết bị này</label>
          <button class="btn primary lg block">Đăng nhập ${icon('chevronRight')}</button>
        </form>
        <div class="faint" style="margin-top:22px">Tài khoản dùng thử (bấm để điền):</div>
        <div class="demo-acc">${accs.map(a => `<button type="button" onclick="Pages.login.fill('${esc(a.username)}','${esc(a.password)}')">
          ${avatar(Store.emp(a.employeeId), 'sm')}<div class="grow"><b>${esc(a.username)}</b> / ${esc(a.password)}<div class="faint">${roleName[a.role]}</div></div>${icon('chevronRight', 'sm')}</button>`).join('')}</div>
      </div></div></div>`;
  },
  fill(u, p) { const f = $('#lf'); f.u.value = u; f.p.value = p; },
  submit(e) {
    e.preventDefault(); const f = e.target;
    const a = Store.login(f.u.value, f.p.value);
    if (!a) return UI.toast('Sai tài khoản hoặc mật khẩu', 'error');
    UI.toast('Xin chào ' + a.name);
    App.boot();
  },
};
