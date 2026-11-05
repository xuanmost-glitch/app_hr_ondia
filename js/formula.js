/* Bộ tính công thức an toàn (không dùng eval).
   Hỗ trợ: + - * / ( ), so sánh > < >= <= == !=, hàm IF, MIN, MAX, ROUND, FLOOR, CEIL, ABS, AND, OR */
const Formula = (() => {
  const FN = {
    IF: (c, a, b) => (c ? a : (b ?? 0)),
    MIN: (...a) => Math.min(...a), MAX: (...a) => Math.max(...a),
    ROUND: (x, d = 0) => { const p = 10 ** d; return Math.round(x * p) / p; },
    FLOOR: (x) => Math.floor(x), CEIL: (x) => Math.ceil(x), ABS: (x) => Math.abs(x),
    AND: (...a) => (a.every(Boolean) ? 1 : 0), OR: (...a) => (a.some(Boolean) ? 1 : 0),
  };
  function tokenize(src) {
    const t = []; let i = 0;
    while (i < src.length) {
      const c = src[i];
      if (/\s/.test(c)) { i++; continue; }
      if (/[0-9.]/.test(c)) { let j = i; while (j < src.length && /[0-9.]/.test(src[j])) j++; t.push({ k: 'n', v: parseFloat(src.slice(i, j)) }); i = j; continue; }
      if (/[A-Za-z_]/.test(c)) { let j = i; while (j < src.length && /[A-Za-z0-9_]/.test(src[j])) j++; t.push({ k: 'id', v: src.slice(i, j) }); i = j; continue; }
      const two = src.slice(i, i + 2);
      if (['>=', '<=', '==', '!='].includes(two)) { t.push({ k: 'op', v: two }); i += 2; continue; }
      if ('+-*/()<>,'.includes(c)) { t.push({ k: 'op', v: c }); i++; continue; }
      throw new Error(`Ký tự không hợp lệ: "${c}"`);
    }
    return t;
  }
  function compile(src) {
    const t = tokenize(String(src || '0')); let p = 0;
    const peek = () => t[p], take = () => t[p++];
    const isOp = (v) => peek() && peek().k === 'op' && peek().v === v;
    function expect(v) { if (!isOp(v)) throw new Error(`Thiếu "${v}"`); p++; }
    function cmp() {
      let l = add();
      while (peek() && ['>', '<', '>=', '<=', '==', '!='].includes(peek().v)) {
        const op = take().v, r = add(), L = l;
        l = (v) => { const a = L(v), b = r(v); return +(op === '>' ? a > b : op === '<' ? a < b : op === '>=' ? a >= b : op === '<=' ? a <= b : op === '==' ? a === b : a !== b); };
      }
      return l;
    }
    function add() {
      let l = mul();
      while (isOp('+') || isOp('-')) { const op = take().v, r = mul(), L = l; l = op === '+' ? (v) => L(v) + r(v) : (v) => L(v) - r(v); }
      return l;
    }
    function mul() {
      let l = unary();
      while (isOp('*') || isOp('/')) { const op = take().v, r = unary(), L = l; l = op === '*' ? (v) => L(v) * r(v) : (v) => { const d = r(v); return d === 0 ? 0 : L(v) / d; }; }
      return l;
    }
    function unary() { if (isOp('-')) { take(); const e = unary(); return (v) => -e(v); } if (isOp('+')) { take(); return unary(); } return prim(); }
    function prim() {
      const tk = take();
      if (!tk) throw new Error('Công thức chưa hoàn chỉnh');
      if (tk.k === 'n') return () => tk.v;
      if (tk.k === 'op' && tk.v === '(') { const e = cmp(); expect(')'); return e; }
      if (tk.k === 'id') {
        const name = tk.v.toUpperCase();
        if (isOp('(')) {
          take(); const args = [];
          if (!isOp(')')) { do { args.push(cmp()); } while (isOp(',') && take()); }
          expect(')');
          const f = FN[name]; if (!f) throw new Error(`Hàm không tồn tại: ${tk.v}`);
          return (v) => f(...args.map(a => a(v)));
        }
        const key = tk.v;
        return (v) => { if (!(key in v)) throw new Error(`Biến chưa định nghĩa: ${key}`); return Number(v[key]) || 0; };
      }
      throw new Error(`Không hiểu "${tk.v}"`);
    }
    const fn = cmp();
    if (p < t.length) throw new Error(`Thừa ký tự "${t[p].v}"`);
    return fn;
  }
  const cache = new Map();
  function evaluate(src, vars) {
    if (!cache.has(src)) cache.set(src, compile(src));
    const r = cache.get(src)(vars);
    return Number.isFinite(r) ? r : 0;
  }
  function check(src, varNames) {
    try { const v = {}; varNames.forEach(n => (v[n] = 1)); compile(src)(v); return null; }
    catch (e) { return e.message; }
  }
  return { evaluate, check, FUNCS: Object.keys(FN) };
})();
