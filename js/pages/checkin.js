/* Chấm công bằng ảnh + AI + GPS */
Pages.checkin = {
  title: 'Chấm công', stream: null, timer: null, loop: null, pos: null, shot: null, ai: null,
  render(root) {
    const e = Store.myEmp();
    if (!e) { root.innerHTML = `<div class="empty">${icon('user')}Tài khoản chưa gắn với hồ sơ nhân viên</div>`; return; }
    const today = ymd(), sh = Store.shiftOf(e.id, today), att = Store.attOf(e.id, today), unit = Store.unit(e.unitId);
    const mode = !att ? 'in' : !att.checkOut ? 'out' : 'done';
    this.mode = mode; this.shot = null; this.ai = null;
    root.innerHTML = `<div class="grid g2 ck-grid" style="align-items:start">
      <div class="stack">
        <div class="hero">
          <div style="position:relative;z-index:1">
            <div class="row between"><span style="opacity:.9">${WEEKDAY[wd(today)]}, ${fmtDate(today)}</span><span class="badge plain" style="background:rgba(255,255,255,.2);color:#fff">${esc(unit?.name || '')}</span></div>
            <div class="clock" id="ck-clock">${hm()}</div>
            <div>${sh ? `<b>${esc(sh.name)}</b> ${sh.start} – ${sh.end}` : 'Hôm nay bạn không có ca được phân'}</div>
            <div class="row wrap" style="margin-top:12px;gap:8px">
              <span class="badge plain" style="background:rgba(255,255,255,.2);color:#fff">Vào: ${att?.checkIn ? hm(att.checkIn.ts) : '--:--'}</span>
              <span class="badge plain" style="background:rgba(255,255,255,.2);color:#fff">Ra: ${att?.checkOut ? hm(att.checkOut.ts) : '--:--'}</span>
            </div>
          </div>
        </div>
        <div class="card"><div class="card-head"><h3>${icon('pin', 'sm')} Vị trí làm việc</h3><button class="btn sm soft" onclick="Pages.checkin.locate()">${icon('refresh', 'sm')} Định vị lại</button></div>
          <div class="muted" style="margin-bottom:10px">${esc(unit?.name)} · ${esc(unit?.address)} · cho phép trong bán kính <b>${unit?.radius}m</b></div>
          <div id="ck-gps"><div class="ai-box tone-info">${icon('refresh')} Đang lấy vị trí GPS…</div></div>
          <iframe class="map mt" id="ck-map" loading="lazy" src="https://www.openstreetmap.org/export/embed.html?bbox=${unit.lng - 0.006},${unit.lat - 0.004},${unit.lng + 0.006},${unit.lat + 0.004}&layer=mapnik&marker=${unit.lat},${unit.lng}"></iframe>
        </div>
      </div>
      <div class="card">
        ${mode === 'done' ? `<div class="empty">${icon('checkCircle')}<h3 style="color:var(--text)">Bạn đã hoàn thành chấm công hôm nay</h3><p class="mt">Vào ${hm(att.checkIn.ts)} · Ra ${hm(att.checkOut.ts)}</p>
          <button class="btn soft mt" onclick="App.go('requests')">${icon('inbox', 'sm')} Đăng ký tăng ca</button></div>` : `
        <div class="card-head"><h3>${icon('camera', 'sm')} Chụp ảnh chấm công ${mode === 'in' ? 'VÀO' : 'RA'}</h3>${e.faceDesc ? badge('Có ảnh mẫu', 'success') : badge('Chưa có ảnh mẫu', 'warning')}</div>
        <div class="cam" id="ck-cam"><video id="ck-video" class="mirror" playsinline muted autoplay></video><div class="oval" id="ck-oval"></div>
          <div id="ck-hint" style="position:absolute;left:0;right:0;bottom:12px;text-align:center;color:#fff;font-weight:600;text-shadow:0 1px 4px #000">Đang mở camera…</div></div>
        <div id="ck-ai" class="mt"></div>
        <div class="row mt" id="ck-acts">
          <label class="btn" title="Chọn ảnh từ máy">${icon('upload', 'sm')}<input type="file" accept="image/*" capture="user" hidden onchange="Pages.checkin.fromFile(this.files[0])"></label>
          <button class="btn primary lg grow" id="ck-snap" onclick="Pages.checkin.snap()">${icon('camera')} Chụp ảnh</button>
        </div>`}
      </div></div>`;
    this.timer = setInterval(() => { const c = $('#ck-clock'); if (c) c.textContent = hm(); }, 5000);
    App.onLeave(() => this.stop());
    this.locate();
    if (mode !== 'done') this.startCam();
  },
  async locate() {
    const unit = Store.unit(Store.myEmp().unitId), box = $('#ck-gps'); if (!box) return;
    try {
      const p = await getPosition(); const d = Math.round(distanceM(p, unit));
      this.pos = { ...p, dist: d };
      const ok = d <= unit.radius;
      box.innerHTML = `<div class="ai-box tone-${ok ? 'success' : 'danger'}">${icon(ok ? 'checkCircle' : 'alert')}<div><b>${ok ? 'Bạn đang ở đúng cửa hàng' : 'Bạn đang ở NGOÀI khu vực cửa hàng'}</b><div>Cách cửa hàng ${d >= 1000 ? num(d / 1000) + ' km' : d + ' m'} · sai số GPS ±${p.acc}m</div>
        ${!ok ? `<div>${Store.settings.gpsStrict ? 'Không thể chấm công ngoài khu vực.' : 'Vẫn chấm được nhưng sẽ báo quản lý.'}</div>` : ''}</div></div>`;
      const map = $('#ck-map'); if (map) map.src = `https://www.openstreetmap.org/export/embed.html?bbox=${Math.min(p.lng, unit.lng) - 0.004},${Math.min(p.lat, unit.lat) - 0.003},${Math.max(p.lng, unit.lng) + 0.004},${Math.max(p.lat, unit.lat) + 0.003}&layer=mapnik&marker=${p.lat},${p.lng}`;
    } catch (err) { this.pos = null; box.innerHTML = `<div class="ai-box tone-warning">${icon('alert')}<div><b>Chưa xác định được vị trí</b><div>${esc(err.message)}</div></div></div>`; }
  },
  async startCam() {
    const hint = $('#ck-hint');
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('no');
      this.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 720 }, height: { ideal: 960 } }, audio: false });
      const v = $('#ck-video'); if (!v) return this.stop();
      v.srcObject = this.stream; hint.textContent = 'Đưa khuôn mặt vào khung oval';
      this.liveCheck();
    } catch { if (hint) hint.innerHTML = 'Không mở được camera trực tiếp.<br>Bấm nút tải ảnh bên dưới để chụp.'; }
  },
  async liveCheck() {
    try { await Face.load(); } catch { return; }
    const opts = new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 });
    this.loop = setInterval(async () => {
      const v = $('#ck-video'), o = $('#ck-oval'); if (!v || !o || this.shot || !v.videoWidth) return;
      const r = await faceapi.detectAllFaces(v, opts);
      o.className = 'oval ' + (r.length === 1 ? 'ok' : r.length ? 'bad' : '');
      $('#ck-hint').textContent = r.length === 1 ? 'Tốt, giữ yên và bấm Chụp' : r.length > 1 ? 'Chỉ một người trong khung hình' : 'Đưa khuôn mặt vào khung oval';
    }, 800);
  },
  stop() {
    clearInterval(this.timer); clearInterval(this.loop);
    this.stream?.getTracks().forEach(t => t.stop()); this.stream = null;
  },
  async snap() {
    const v = $('#ck-video');
    if (!v?.videoWidth) return UI.toast('Camera chưa sẵn sàng, hãy dùng nút tải ảnh', 'warn');
    const c = document.createElement('canvas'); c.width = v.videoWidth; c.height = v.videoHeight;
    const g = c.getContext('2d'); g.translate(c.width, 0); g.scale(-1, 1); g.drawImage(v, 0, 0);
    this.analyse(c);
  },
  async fromFile(f) { if (f) this.analyse(await loadImage(await fileToDataURL(f))); },
  async analyse(src) {
    this.shot = shrink(src, 260, 0.62);
    const cam = $('#ck-cam'); cam.innerHTML = `<img src="${this.shot}"><div class="oval"></div>`;
    $('#ck-ai').innerHTML = `<div class="ai-box tone-info">${icon('refresh')} AI đang kiểm tra ảnh…</div>`;
    $('#ck-acts').innerHTML = '';
    this.ai = await Face.inspect(src, Store.myEmp());
    $('#ck-ai').innerHTML = Face.aiBox(this.ai);
    $('.oval', cam).className = 'oval ' + (this.ai.level === 'good' ? 'ok' : 'bad');
    const blocked = !this.ai.ok;
    $('#ck-acts').innerHTML = `<button class="btn" onclick="App.refresh()">${icon('refresh', 'sm')} Chụp lại</button>
      <button class="btn ${blocked ? '' : 'primary'} lg grow" ${blocked ? 'disabled' : ''} onclick="Pages.checkin.confirm()">${icon('check')} ${blocked ? 'Ảnh chưa hợp lệ' : `Xác nhận chấm công ${this.mode === 'in' ? 'vào' : 'ra'}`}</button>`;
  },
  confirm() {
    const e = Store.myEmp(), unit = Store.unit(e.unitId), today = ymd();
    const outside = this.pos && this.pos.dist > unit.radius;
    if (outside && Store.settings.gpsStrict) return UI.toast('Bạn đang ngoài khu vực cửa hàng, không thể chấm công', 'error');
    const warnings = [...(this.ai?.issues || [])];
    if (!this.pos) warnings.push('Không có vị trí GPS'); else if (outside) warnings.push(`Ngoài khu vực ${this.pos.dist}m`);
    const rec = { ts: Date.now(), photo: this.shot, lat: this.pos?.lat, lng: this.pos?.lng, dist: this.pos?.dist, face: this.ai?.level, faceScore: this.ai?.score, warnings };
    let att = Store.attOf(e.id, today);
    if (!att) att = Store.upsert('attendance', { employeeId: e.id, date: today, shiftId: Store.shiftOf(e.id, today)?.id || null, unitId: e.unitId, checkIn: rec, checkOut: null, note: '' });
    else { att.checkOut = rec; Store.save(); }
    if (warnings.length) Store.notify('*managers', `${e.name} chấm công ${this.mode === 'in' ? 'vào' : 'ra'} có cảnh báo: ${warnings.join(', ')}`, 'attendance');
    const r = this.mode === 'in' ? PayrollEngine.analyze(att, Store.shift(att.shiftId)) : null;
    Store.save();
    UI.toast(this.mode === 'in' ? (r?.late ? `Đã chấm công vào lúc ${hm()} (muộn ${r.lateMin} phút)` : `Chấm công vào thành công lúc ${hm()}`) : `Chấm công ra thành công lúc ${hm()}`, r?.late ? 'warn' : 'success');
    this.stop(); App.refresh();
  },
};
