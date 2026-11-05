/* Tiện ích chung */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const uid = (p = 'id') => p + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const clone = (o) => JSON.parse(JSON.stringify(o));

const pad2 = (n) => String(n).padStart(2, '0');
function ymd(d = new Date()) { d = new Date(d); return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`; }
function ym(d = new Date()) { return ymd(d).slice(0, 7); }
function hm(d = new Date()) { d = new Date(d); return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`; }
function fmtDate(s) { if (!s) return '—'; const [y, m, d] = String(s).slice(0, 10).split('-'); return `${d}/${m}/${y}`; }
function fmtDT(ts) { if (!ts) return '—'; const d = new Date(ts); return `${hm(d)} ${fmtDate(ymd(d))}`; }
function toMin(t) { if (!t) return 0; const [h, m] = t.split(':').map(Number); return h * 60 + (m || 0); }
function addDays(s, n) { const d = new Date(s + 'T00:00:00'); d.setDate(d.getDate() + n); return ymd(d); }
function daysInMonth(m) { const [y, mo] = m.split('-').map(Number); return new Date(y, mo, 0).getDate(); }
function monthDays(m) { const n = daysInMonth(m); return Array.from({ length: n }, (_, i) => `${m}-${pad2(i + 1)}`); }
function diffDays(a, b) { return Math.round((new Date(b + 'T00:00:00') - new Date(a + 'T00:00:00')) / 864e5); }
const WEEKDAY = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
function wd(s) { return new Date(s + 'T00:00:00').getDay(); }
function monthLabel(m) { const [y, mo] = m.split('-'); return `Tháng ${Number(mo)}/${y}`; }
function shiftMonth(m, n) { const [y, mo] = m.split('-').map(Number); return ym(new Date(y, mo - 1 + n, 1)); }

function money(n) { return (Math.round(Number(n) || 0)).toLocaleString('vi-VN') + ' đ'; }
function num(n, d = 1) { const v = Number(n) || 0; return v.toLocaleString('vi-VN', { maximumFractionDigits: d }); }
function short(n) { n = Number(n) || 0; if (Math.abs(n) >= 1e9) return num(n / 1e9) + ' tỷ'; if (Math.abs(n) >= 1e6) return num(n / 1e6) + ' tr'; return num(n, 0); }

function initials(name = '') { const p = name.trim().split(/\s+/); return ((p.length > 1 ? p[p.length - 2][0] : '') + (p[p.length - 1]?.[0] || '')).toUpperCase(); }
function colorOf(s = '') { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) % 360; return `hsl(${h} 62% 52%)`; }
function avatar(emp, cls = '') {
  if (!emp) return `<div class="avatar ${cls}" style="background:#ccc">?</div>`;
  if (emp.avatar) return `<img class="avatar ${cls}" src="${emp.avatar}" alt="">`;
  return `<div class="avatar ${cls}" style="background:${colorOf(emp.name)}">${esc(initials(emp.name))}</div>`;
}
function badge(text, tone = 'primary', plain) { return `<span class="badge ${plain ? 'plain' : ''} tone-${tone}">${esc(text)}</span>`; }
function noAccent(s = '') { return s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase(); }
function match(q, ...fields) { if (!q) return true; q = noAccent(q); return fields.some(f => noAccent(String(f ?? '')).includes(q)); }

/* Khoảng cách GPS (mét) */
function distanceM(a, b) {
  const R = 6371e3, r = Math.PI / 180;
  const dLat = (b.lat - a.lat) * r, dLng = (b.lng - a.lng) * r;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}
function getPosition() {
  return new Promise((res, rej) => {
    if (!navigator.geolocation) return rej(new Error('Thiết bị không hỗ trợ định vị'));
    navigator.geolocation.getCurrentPosition(
      p => res({ lat: p.coords.latitude, lng: p.coords.longitude, acc: Math.round(p.coords.accuracy) }),
      e => rej(new Error(e.code === 1 ? 'Bạn chưa cho phép truy cập vị trí' : 'Không lấy được vị trí (cần HTTPS hoặc localhost)')),
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 });
  });
}

/* Ảnh: nén về dataURL nhỏ để lưu */
function fileToDataURL(file) { return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(file); }); }
function loadImage(src) { return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; }); }
function shrink(source, max = 320, q = 0.72) {
  const w = source.videoWidth || source.naturalWidth || source.width, h = source.videoHeight || source.naturalHeight || source.height;
  const s = Math.min(1, max / Math.max(w, h));
  const c = document.createElement('canvas'); c.width = Math.round(w * s); c.height = Math.round(h * s);
  c.getContext('2d').drawImage(source, 0, 0, c.width, c.height);
  return c.toDataURL('image/jpeg', q);
}
function brightness(source) {
  const c = document.createElement('canvas'); c.width = 48; c.height = 48;
  const g = c.getContext('2d'); g.drawImage(source, 0, 0, 48, 48);
  const d = g.getImageData(0, 0, 48, 48).data; let s = 0;
  for (let i = 0; i < d.length; i += 4) s += d[i] * .299 + d[i + 1] * .587 + d[i + 2] * .114;
  return s / (d.length / 4);
}

function download(name, content, type = 'application/json') {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([content], { type })); a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
function exportExcel(name, sheets) {
  // sheets: { 'Tên sheet': [ {cột: giá trị}, ... ] }
  if (window.XLSX) {
    const wb = XLSX.utils.book_new();
    for (const [n, rows] of Object.entries(sheets)) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), n.slice(0, 31));
    XLSX.writeFile(wb, name + '.xlsx');
  } else {
    const rows = Object.values(sheets)[0] || [];
    const head = Object.keys(rows[0] || {});
    const csv = [head, ...rows.map(r => head.map(h => r[h]))].map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    download(name + '.csv', '﻿' + csv, 'text/csv');
  }
}
function loadScript(src) {
  return new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = () => rej(new Error('Không tải được ' + src)); document.head.appendChild(s); });
}
