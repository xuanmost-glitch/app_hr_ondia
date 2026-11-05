/* AI khuôn mặt chạy trong trình duyệt (face-api.js, tải khi cần) */
const Face = {
  LIB: 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.13/dist/face-api.js',
  MODELS: 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.13/model',
  ready: null,
  load() {
    if (!this.ready) this.ready = (async () => {
      if (!window.faceapi) await loadScript(this.LIB);
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(this.MODELS),
        faceapi.nets.faceLandmark68Net.loadFromUri(this.MODELS),
        faceapi.nets.faceRecognitionNet.loadFromUri(this.MODELS),
      ]);
      return true;
    })().catch(e => { this.ready = null; throw e; });
    return this.ready;
  },
  async detectAll(src) {
    await this.load();
    return faceapi.detectAllFaces(src, new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.45 })).withFaceLandmarks().withFaceDescriptors();
  },
  dist(a, b) { let s = 0; for (let i = 0; i < a.length; i++) s += (a[i] - b[i]) ** 2; return Math.sqrt(s); },
  toArr(desc) { return Array.from(desc, x => Math.round(x * 1e4) / 1e4); },

  /* Kiểm tra ảnh chấm công, trả về { ok, level, score, issues[], tips[] } */
  async inspect(src, emp) {
    const issues = [], tips = [];
    const w = src.videoWidth || src.naturalWidth || src.width, h = src.videoHeight || src.naturalHeight || src.height;
    const lum = brightness(src);
    if (lum < 55) { issues.push('Ảnh quá tối'); tips.push('Bật đèn hoặc đứng gần nguồn sáng'); }
    if (lum > 225) { issues.push('Ảnh bị lóa sáng'); tips.push('Tránh đứng ngược sáng / cửa kính'); }
    let faces;
    try { faces = await this.detectAll(src); }
    catch { return { ok: !Store.settings.faceRequired, level: 'warn', score: null, issues: ['Không tải được mô hình AI (kiểm tra mạng)'], tips: ['Ảnh vẫn được lưu để quản lý kiểm tra thủ công'], offline: true }; }
    if (!faces.length) { issues.push('Không phát hiện khuôn mặt'); tips.push('Đưa mặt vào giữa khung oval, nhìn thẳng camera'); return { ok: false, level: 'bad', score: null, issues, tips }; }
    if (faces.length > 1) { issues.push(`Phát hiện ${faces.length} khuôn mặt`); tips.push('Chỉ một người trong khung hình khi chấm công'); }
    const f = faces.sort((a, b) => b.detection.box.area - a.detection.box.area)[0];
    const box = f.detection.box, ratio = box.width / w;
    if (ratio < 0.18) { issues.push('Khuôn mặt quá nhỏ / đứng quá xa'); tips.push('Đưa điện thoại lại gần hơn'); }
    const cx = (box.x + box.width / 2) / w, cy = (box.y + box.height / 2) / h;
    if (cx < 0.25 || cx > 0.75 || cy < 0.2 || cy > 0.75) { issues.push('Khuôn mặt lệch khỏi khung'); tips.push('Căn mặt vào giữa khung oval'); }
    // Nghiêng đầu: so độ cao 2 mắt
    const lm = f.landmarks.positions, le = lm[36], re = lm[45], nose = lm[30];
    const tilt = Math.abs(Math.atan2(re.y - le.y, re.x - le.x) * 180 / Math.PI);
    const yaw = Math.abs((nose.x - le.x) - (re.x - nose.x)) / Math.max(1, re.x - le.x);
    if (tilt > 18 || yaw > 0.55) { issues.push('Đầu nghiêng hoặc quay ngang'); tips.push('Nhìn thẳng vào camera'); }
    let score = null;
    if (emp?.faceDesc) {
      score = this.dist(f.descriptor, emp.faceDesc);
      if (score > (Store.settings.faceThreshold || 0.5)) { issues.unshift('Khuôn mặt KHÔNG khớp ảnh mẫu đã đăng ký'); tips.unshift('Đúng người chưa? Nếu đúng, hãy chụp lại rõ mặt, bỏ khẩu trang/kính râm'); }
    } else { issues.push('Nhân viên chưa có ảnh mẫu khuôn mặt'); tips.push('Liên hệ quản lý để đăng ký ảnh mẫu trong hồ sơ'); }
    const mismatch = score != null && score > (Store.settings.faceThreshold || 0.5);
    const hard = mismatch || faces.length > 1;
    return { ok: !hard || !Store.settings.faceRequired, level: hard ? 'bad' : issues.length ? 'warn' : 'good', score, issues, tips, descriptor: f.descriptor };
  },
  /* Đăng ký ảnh mẫu từ dataURL */
  async enroll(dataUrl) {
    const img = await loadImage(dataUrl);
    const faces = await this.detectAll(img);
    if (!faces.length) throw new Error('Không tìm thấy khuôn mặt trong ảnh mẫu');
    if (faces.length > 1) throw new Error('Ảnh mẫu chỉ được có một người');
    return this.toArr(faces[0].descriptor);
  },
  aiBox(r) {
    if (!r) return '';
    const tone = r.level === 'good' ? 'success' : r.level === 'warn' ? 'warning' : 'danger';
    const head = r.level === 'good' ? 'AI xác nhận: ảnh hợp lệ, khuôn mặt khớp ảnh mẫu' : r.level === 'warn' ? 'AI nhắc nhở' : 'AI cảnh báo: ảnh chưa đạt';
    const match = r.score != null ? ` · độ khớp ${Math.max(0, Math.round((1 - r.score) * 100))}%` : '';
    return `<div class="ai-box tone-${tone}">${icon(r.level === 'good' ? 'checkCircle' : 'alert')}<div><b>${head}${match}</b>
      ${r.issues.length ? `<ul>${r.issues.map(i => `<li>${esc(i)}</li>`).join('')}</ul>` : ''}
      ${r.tips.length ? `<div style="margin-top:4px;opacity:.85">Gợi ý: ${r.tips.map(esc).join('; ')}</div>` : ''}</div></div>`;
  },
};
