/* Cấu hình công thức lương */
Pages.settingsPay = {
  title: 'Công thức lương', sel: null, testEmp: '',
  KIND: { earn: ['Thu nhập', 'success'], deduct: ['Khấu trừ', 'danger'], info: ['Chỉ hiển thị', 'info'] },
  render(root) {
    const tpls = Store.list('payTemplates');
    if (!tpls.find(t => t.id === this.sel)) this.sel = tpls[0]?.id;
    const t = Store.get('payTemplates', this.sel);
    const vars = [...VAR_DOCS, ...Store.settings.monthInputs.map(f => [f.key, f.label + ' (nhập tháng)'])];
    root.innerHTML = `<div class="grid g-side" style="align-items:start">
      <div class="stack">
        <div class="toolbar" style="margin:0"><div class="chips grow">${tpls.map(x => `<span class="chip ${x.id === this.sel ? 'active' : ''}" onclick="Pages.settingsPay.sel='${x.id}';App.refresh()">${esc(x.name)}</span>`).join('')}</div>
          <button class="btn sm" onclick="Pages.settingsPay.newTpl()">${icon('plus', 'sm')} Mẫu mới</button></div>
        ${t ? `<div class="card flush"><div class="card-head"><div><h3>${esc(t.name)}</h3><div class="faint">Áp dụng cho: ${Store.list('positions').filter(p => p.payTemplateId === t.id).map(p => esc(p.name)).join(', ') || 'chưa gán vị trí nào'}</div></div>
          <div class="row"><button class="btn sm" onclick="Pages.settingsPay.renameTpl()">${icon('edit', 'sm')}</button><button class="btn sm" onclick="Pages.settingsPay.dupTpl()">${icon('layers', 'sm')} Nhân bản</button><button class="btn sm danger" onclick="Pages.settingsPay.delTpl()">${icon('trash', 'sm')}</button><button class="btn sm primary" onclick="Pages.settingsPay.item()">${icon('plus', 'sm')} Khoản mục</button></div></div>
          ${UI.table(t.items, [
            { label: '#', render: (x, i) => `<div class="row" style="gap:2px"><button class="btn sm icon ghost" onclick="event.stopPropagation();Pages.settingsPay.moveItem(${i},-1)">▲</button><button class="btn sm icon ghost" onclick="event.stopPropagation();Pages.settingsPay.moveItem(${i},1)">▼</button></div>` },
            { label: 'Khoản mục', primary: true, render: x => `<b>${esc(x.name)}</b> <code class="faint">${esc(x.code)}</code>` },
            { label: 'Loại', render: x => badge(...this.KIND[x.kind]) },
            { label: 'Công thức', render: x => { const err = this.check(t, x); return `<span class="formula">${esc(x.formula)}</span>${err ? `<div style="color:var(--danger);font-size:12px">${esc(err)}</div>` : ''}`; } },
            { label: 'Thử', render: x => this.preview?.[x.code] != null ? `<b class="mono">${money(this.preview[x.code])}</b>` : '' },
          ], { onRow: (x, i) => `Pages.settingsPay.item(${i})` })}</div>` : ''}
        <div class="card"><div class="card-head"><h3>Chạy thử công thức</h3></div><div class="row wrap">
          <select class="input grow" onchange="Pages.settingsPay.testEmp=this.value;Pages.settingsPay.test()"><option value="">— Chọn nhân viên —</option>${Store.list('employees').map(e => `<option value="${e.id}" ${e.id === this.testEmp ? 'selected' : ''}>${esc(e.name)} – ${esc(Store.pos(e.positionId)?.name)}</option>`).join('')}</select>
          <button class="btn primary" onclick="Pages.settingsPay.test()">${icon('zap', 'sm')} Tính thử tháng trước</button></div><div id="sp-test" class="mt"></div></div>
      </div>
      <div class="card"><h3>Biến có thể dùng</h3><p class="faint" style="margin:4px 0 10px">Bấm để chép. Có thể dùng mã của khoản mục phía trên (vd: LCB + PC).</p>
        <div class="stack" style="gap:6px">${vars.map(([k, d]) => `<div class="row" style="align-items:flex-start"><code class="formula" style="cursor:pointer;flex:none" onclick="navigator.clipboard?.writeText('${k}');UI.toast('Đã chép ${k}','info')">${k}</code><span class="faint">${esc(d)}</span></div>`).join('')}</div>
        <h3 class="mt-lg">Hàm</h3><div class="faint" style="margin-top:6px;line-height:1.9"><code class="formula">IF(điều kiện, đúng, sai)</code> <code class="formula">MIN(a,b)</code> <code class="formula">MAX(a,b)</code> <code class="formula">ROUND(x, số lẻ)</code> <code class="formula">FLOOR(x)</code> <code class="formula">CEIL(x)</code> <code class="formula">AND(a,b)</code> <code class="formula">OR(a,b)</code><br>Phép so sánh: &gt; &lt; &gt;= &lt;= == !=</div>
        <h3 class="mt-lg">Ví dụ</h3><div class="stack faint" style="gap:6px;margin-top:6px">
          <div><span class="formula">IF(DOANH_SO &gt; 200000000, DOANH_SO * 2 / 100, DOANH_SO * 1 / 100)</span> hoa hồng bậc thang</div>
          <div><span class="formula">THAM_NIEN * 200000</span> phụ cấp thâm niên</div>
          <div><span class="formula">IF(NGHI_KP &gt; 0, 0, 500000)</span> thưởng không nghỉ</div></div></div>
    </div>`;
    if (this.testEmp && !this.preview) this.test();
  },
  check(t, x) {
    const idx = t.items.indexOf(x);
    const names = [...VAR_DOCS.map(v => v[0]), ...Store.settings.monthInputs.map(f => f.key), ...t.items.slice(0, idx).map(i => i.code)];
    return Formula.check(x.formula, names);
  },
  tpl() { return Store.get('payTemplates', this.sel); },
  save() { this.preview = null; Store.save(); App.refresh(); },
  item(i) {
    const t = this.tpl(), x = i != null ? t.items[i] : null;
    UI.formModal({ title: x ? 'Sửa khoản mục' : 'Thêm khoản mục', data: x || { kind: 'earn' }, fields: [
      { key: 'name', label: 'Tên khoản mục', req: true, full: true }, { key: 'code', label: 'Mã (VIẾT_HOA)', req: true },
      { key: 'kind', label: 'Loại', type: 'select', empty: false, options: Object.entries(this.KIND).map(([v, [t]]) => ({ v, t })) },
      { key: 'formula', label: 'Công thức', type: 'textarea', req: true, full: true, hint: 'Ví dụ: LUONG_CB / CONG_CHUAN * NGAY_CONG' },
    ], extra: x ? `<button class="btn danger sm mt" id="sp-del">${icon('trash', 'sm')} Xóa khoản mục</button>` : '', onSave: v => {
      v.code = noAccent(v.code).toUpperCase().replace(/[^A-Z0-9_]/g, '_');
      if (t.items.some((y, j) => y.code === v.code && j !== i)) { UI.toast('Mã đã tồn tại', 'error'); return false; }
      const names = [...VAR_DOCS.map(d => d[0]), ...Store.settings.monthInputs.map(f => f.key), ...t.items.slice(0, i ?? t.items.length).map(y => y.code)];
      const err = Formula.check(v.formula, names); if (err) { UI.toast('Công thức lỗi: ' + err, 'error'); return false; }
      i != null ? (t.items[i] = v) : t.items.push(v); this.save();
    } });
    const del = $('#sp-del'); if (del) del.onclick = () => { t.items.splice(i, 1); UI.closeAll(); this.save(); };
  },
  moveItem(i, d) { const a = this.tpl().items, j = i + d; if (j < 0 || j >= a.length) return; [a[i], a[j]] = [a[j], a[i]]; this.save(); },
  newTpl() { UI.formModal({ title: 'Mẫu lương mới', size: 'sm', fields: [{ key: 'name', label: 'Tên mẫu', req: true, full: true }], onSave: v => { const t = Store.upsert('payTemplates', { name: v.name, items: [{ code: 'LCB', name: 'Lương theo ngày công', kind: 'earn', formula: 'LUONG_CB / CONG_CHUAN * NGAY_CONG' }] }); this.sel = t.id; App.refresh(); } }); },
  renameTpl() { const t = this.tpl(); UI.formModal({ title: 'Đổi tên mẫu', size: 'sm', data: t, fields: [{ key: 'name', label: 'Tên mẫu', req: true, full: true }], onSave: v => { t.name = v.name; this.save(); } }); },
  dupTpl() { const t = this.tpl(); const n = Store.upsert('payTemplates', { name: t.name + ' (bản sao)', items: clone(t.items) }); this.sel = n.id; App.refresh(); },
  delTpl() {
    const t = this.tpl();
    if (Store.list('positions').some(p => p.payTemplateId === t.id) || Store.list('employees').some(e => e.payTemplateId === t.id)) return UI.toast('Mẫu đang được dùng, hãy đổi vị trí/nhân viên sang mẫu khác trước', 'warn');
    UI.confirm('Xóa mẫu lương ' + esc(t.name) + '?', () => { Store.remove('payTemplates', t.id); this.sel = null; App.refresh(); }, { danger: true, okText: 'Xóa' });
  },
  test() {
    const e = Store.emp(this.testEmp); if (!e) return UI.toast('Chọn nhân viên để thử', 'warn');
    const backup = e.payTemplateId; e.payTemplateId = this.sel;
    const r = PayrollEngine.compute(e, shiftMonth(ym(), -1)); e.payTemplateId = backup;
    this.preview = Object.fromEntries(r.items.map(i => [i.code, i.value]));
    const box = $('#sp-test'); if (!box) return;
    box.innerHTML = `${r.error ? `<div class="ai-box tone-danger">${icon('alert')} ${esc(r.error)}</div>` : ''}
      <div class="vars" style="margin-bottom:10px">${Object.entries(r.vars).filter(([k]) => !r.items.some(i => i.code === k)).map(([k, v]) => `<code>${k} = ${num(v, 2)}</code>`).join('')}</div>
      <div class="row between"><span>Thu nhập <b>${money(r.gross)}</b> · Khấu trừ <b>${money(r.deduct)}</b></span><b style="color:var(--primary-ink);font-size:18px">${money(r.net)}</b></div>`;
    $$('#view .tbl tbody tr').forEach((tr, i) => { const it = this.tpl().items[i]; const td = tr.lastElementChild; if (it && td) td.innerHTML = `<b class="mono">${money(this.preview[it.code])}</b>`; });
  },
};
