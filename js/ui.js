/* Thành phần giao diện dùng chung: toast, modal, form, bảng */
const UI = {
  toast(msg, type = 'success') {
    const ic = { success: 'checkCircle', error: 'alert', warn: 'alert', info: 'info' }[type] || 'info';
    const el = document.createElement('div'); el.className = 'toast ' + type;
    el.innerHTML = icon(ic) + `<span>${esc(msg)}</span>`;
    $('#toast-root').appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; el.style.transition = '.3s'; }, 2600);
    setTimeout(() => el.remove(), 3000);
  },
  modal({ title, body, foot = '', size = '', onClose } = {}) {
    const root = $('#modal-root');
    const back = document.createElement('div'); back.className = 'modal-back';
    back.innerHTML = `<div class="modal ${size}"><div class="modal-head"><h2>${title}</h2><button class="icon-btn" data-x>${icon('x')}</button></div>
      <div class="modal-body">${body}</div>${foot ? `<div class="modal-foot">${foot}</div>` : ''}</div>`;
    const close = () => { back.remove(); onClose && onClose(); };
    back.addEventListener('click', e => { if (e.target === back || e.target.closest('[data-x]')) close(); });
    root.appendChild(back);
    return { el: back, close };
  },
  closeAll() { $('#modal-root').innerHTML = ''; },
  confirm(text, onYes, { okText = 'Đồng ý', danger = false } = {}) {
    const m = this.modal({ title: 'Xác nhận', size: 'sm', body: `<p>${text}</p>`,
      foot: `<button class="btn" data-x>Hủy</button><button class="btn ${danger ? 'danger' : 'primary'}" id="cf-ok">${okText}</button>` });
    $('#cf-ok', m.el).onclick = () => { m.close(); onYes(); };
  },

  /* ---------- Form tạo từ schema ----------
     field: { key, label, type: text|number|money|date|time|select|textarea|checkbox|color|tel|email|password, options:[{v,t}]|string[], req, full, hint, section } */
  field(f, val) {
    if (f.section) return `<div class="form-section">${esc(f.section)}</div>`;
    const id = 'f_' + f.key, v = val ?? f.default ?? '';
    const lbl = `<label for="${id}">${esc(f.label)}${f.req ? ' <span class="req">*</span>' : ''}</label>`;
    let inp;
    if (f.type === 'select') {
      const opts = (f.options || []).map(o => typeof o === 'object' ? o : { v: o, t: o });
      inp = `<select class="input" id="${id}" name="${f.key}">${f.empty !== false ? `<option value="">${f.placeholder || '— Chọn —'}</option>` : ''}${opts.map(o => `<option value="${esc(o.v)}" ${String(o.v) === String(v) ? 'selected' : ''}>${esc(o.t)}</option>`).join('')}</select>`;
    } else if (f.type === 'textarea') {
      inp = `<textarea class="input" id="${id}" name="${f.key}" rows="${f.rows || 3}" placeholder="${esc(f.placeholder || '')}">${esc(v)}</textarea>`;
    } else if (f.type === 'checkbox') {
      return `<div class="field ${f.full ? 'full' : ''}"><label class="row" style="cursor:pointer"><span class="switch"><input type="checkbox" id="${id}" name="${f.key}" ${v ? 'checked' : ''}><span></span></label><b style="font-weight:600">${esc(f.label)}</b></label>${f.hint ? `<div class="hint">${f.hint}</div>` : ''}</div>`;
    } else {
      const t = f.type === 'money' ? 'number' : (f.type || 'text');
      inp = `<input class="input" id="${id}" name="${f.key}" type="${t}" value="${esc(v)}" ${f.step ? `step="${f.step}"` : (f.type === 'money' ? 'step="1000"' : '')} placeholder="${esc(f.placeholder || '')}" ${f.readonly ? 'readonly' : ''}>`;
    }
    return `<div class="field ${f.full ? 'full' : ''}">${lbl}${inp}${f.hint ? `<div class="hint">${f.hint}</div>` : ''}</div>`;
  },
  form(fields, data = {}) { return `<form class="form" onsubmit="return false">${fields.map(f => this.field(f, f.key ? data[f.key] : undefined)).join('')}</form>`; },
  read(root, fields) {
    const out = {}; let ok = true;
    fields.filter(f => f.key).forEach(f => {
      const el = root.querySelector(`[name="${f.key}"]`); if (!el) return;
      let v = f.type === 'checkbox' ? el.checked : el.value.trim();
      if (['number', 'money'].includes(f.type)) v = v === '' ? 0 : Number(v);
      el.classList.toggle('err', !!(f.req && (v === '' || v == null)));
      if (f.req && (v === '' || v == null)) ok = false;
      out[f.key] = v;
    });
    if (!ok) UI.toast('Vui lòng điền các trường bắt buộc', 'warn');
    return ok ? out : null;
  },
  /* Mở form trong modal; onSave(values) trả về false để giữ modal */
  formModal({ title, fields, data = {}, onSave, size = '', saveText = 'Lưu', extra = '' }) {
    const m = this.modal({ title, size, body: this.form(fields, data) + extra,
      foot: `<button class="btn" data-x>Hủy</button><button class="btn primary" data-save>${icon('check', 'sm')} ${saveText}</button>` });
    $('[data-save]', m.el).onclick = () => { const v = this.read(m.el, fields); if (v && onSave(v, m) !== false) m.close(); };
    return m;
  },

  /* ---------- Bảng (thành thẻ trên điện thoại) ----------
     cols: [{ label, render(row), cls, primary }]; opts: { onRow, empty } */
  table(rows, cols, opts = {}) {
    if (!rows.length) return `<div class="empty">${icon('inbox')}<div>${opts.empty || 'Chưa có dữ liệu'}</div></div>`;
    return `<div class="table-wrap"><table class="tbl cards"><thead><tr>${cols.map(c => `<th class="${c.cls || ''}">${c.label}</th>`).join('')}</tr></thead><tbody>
      ${rows.map((r, i) => `<tr ${opts.onRow ? `class="click" onclick="${opts.onRow(r, i)}"` : ''}>${cols.map(c => `<td data-label="${esc(c.label)}" class="${c.primary ? 'primary ' : ''}${c.cls || ''}">${c.render(r, i)}</td>`).join('')}</tr>`).join('')}
    </tbody></table></div>`;
  },
  empCell(e, sub) {
    if (!e) return '—';
    return `<div class="row">${avatar(e, 'sm')}<div class="grow"><div style="font-weight:600" class="truncate">${esc(e.name)}</div><div class="faint truncate">${sub ?? esc(e.code + ' · ' + (Store.pos(e.positionId)?.name || ''))}</div></div></div>`;
  },
  statusBadge(key) { const s = Store.status(key); return badge(s.label, s.tone); },
  unitOptions(all = true) { return Store.scopeUnits().map(u => ({ v: u.id, t: u.name })); },
  unitSelect(id, val, onchange, allLabel = 'Tất cả đơn vị') {
    const us = Store.scopeUnits();
    return `<select class="input" id="${id}" onchange="${onchange}">${us.length > 1 ? `<option value="">${allLabel}</option>` : ''}${us.map(u => `<option value="${u.id}" ${u.id === val ? 'selected' : ''}>${esc(u.name)}</option>`).join('')}</select>`;
  },
  monthPicker(val, onchange) {
    return `<div class="row" style="gap:6px"><button class="icon-btn" onclick="${onchange}('${shiftMonth(val, -1)}')">${icon('chevronLeft')}</button>
      <input type="month" class="input" style="width:150px" value="${val}" onchange="${onchange}(this.value)">
      <button class="icon-btn" onclick="${onchange}('${shiftMonth(val, 1)}')">${icon('chevronRight')}</button></div>`;
  },
  stat(label, value, ic, tone = 'primary', sub = '') {
    return `<div class="card stat"><div class="ic tone-${tone}">${icon(ic)}</div><div><div class="val">${value}</div><div class="lbl">${label}</div>${sub ? `<div class="faint">${sub}</div>` : ''}</div></div>`;
  },
};
