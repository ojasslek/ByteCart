const $ = s => document.querySelector(s);
const f = n => '₹' + Number(n).toLocaleString('en-IN');
const CATS = ['Produce', 'Dairy', 'Bakery', 'Staples', 'Snacks', 'Beverages'];
const AIS = { Produce: 1, Dairy: 2, Bakery: 3, Staples: 4, Snacks: 5, Beverages: 6 };
const raw = [
  ['Fresh Bananas 12pc', 'Farm', 'Produce', 60, 70, 16, 2, '#e9d48a'],
  ['Tomatoes 1kg', 'Farm', 'Produce', 40, 48, 22, 3, '#e0a38f'],
  ['Taaza Milk 1L', 'Amul', 'Dairy', 56, 58, 24, 2, '#A9C7E8'],
  ['Toned Milk 1L', 'Gokul', 'Dairy', 52, 54, 15, 4, '#c9dcf2'],
  ['Greek Yogurt 100g', 'Epigamia', 'Dairy', 40, 45, 12, 5, '#F2E9D8'],
  ['Curd 400g', 'Mother Dairy', 'Dairy', 35, 35, 0, 6, '#d9e4f2'],
  ['Whole Wheat Bread', 'Britannia', 'Bakery', 45, 50, 3, 1, '#d9b98a'],
  ['Sandwich Bread', 'Modern', 'Bakery', 40, 45, 11, 4, '#e8cfa4'],
  ['Atta 5kg', 'Aashirvaad', 'Staples', 265, 295, 18, 120, '#d9b98a'],
  ['Sunflower Oil 1L', 'Fortune', 'Staples', 145, 165, 9, 240, '#e9d48a'],
  ['Basmati Rice 5kg', 'India Gate', 'Staples', 520, 610, 14, 300, '#F2E9D8'],
  ['Iodised Salt 1kg', 'Tata', 'Staples', 28, 28, 40, 500, '#A9C7E8'],
  ['Magic Masala Chips', 'Lays', 'Snacks', 20, 20, 4, 45, '#e0a38f'],
  ['2-Minute Noodles', 'Maggi', 'Snacks', 56, 60, 30, 150, '#e9d48a'],
  ['Glucose Biscuits', 'Parle', 'Snacks', 10, 10, 60, 90, '#F2E9D8'],
  ['Red Label Tea 500g', 'Brooke Bond', 'Beverages', 255, 280, 20, 200, '#c4452d55'],
  ['Classic Coffee 100g', 'Nescafé', 'Beverages', 340, 380, 8, 330, '#d9b98a'],
  ['Instant Coffee 100g', 'Bru', 'Beverages', 290, 320, 13, 320, '#e8cfa4'],
  ['Local Tomatoes 1kg', 'Farm', 'Produce', 35, 40, 20, 2, '#e0a38f'],
  ['Premium Curd 400g', 'Amul', 'Dairy', 45, 50, 10, 6, '#d9e4f2'],
  ['Salted Chips 50g', 'Balaji', 'Snacks', 15, 20, 15, 30, '#e0a38f']
];
const mk = () => raw.map((r, i) => ({ id: i + 1, name: r[0], brand: r[1], cat: r[2], price: r[3], mrp: r[4], stock: r[5], exp: r[6], col: r[7], bc: '8901000' + String(i + 1).padStart(6, '0') }));
const fresh = () => ({ P: mk(), cart: {}, budget: 1500, notify: [], audit: [], flags: [], txns: [], xa: {}, al: { w: 0, x: 0 }, last: null, pay: 'UPI', n: 1 });
let S; try { S = JSON.parse(localStorage.getItem('sm1')) } catch (e) { }
S = S || fresh();
let Q = '', CAT = 'All', MQ = '', TAB = 'inv', AQ = '', AC = 'All', AS = 'name', stream, iv, staffAuthed = '';
const save = () => { try { localStorage.setItem('sm1', JSON.stringify(S)) } catch (e) { } };
const gp = id => S.P.find(p => p.id == id);
const now = () => new Date().toLocaleString('en-IN');
const log = (t, m) => { S.audit.unshift({ t: now(), k: t, m }); S.audit.length = Math.min(S.audit.length, 80); save() };
const T = () => { let sub = 0, sav = 0, n = 0; for (const id in S.cart) { const c = S.cart[id], p = gp(id); sub += p.price * c.q; sav += (p.mrp - p.price) * c.q; n += c.q; } const tax = Math.round(sub * 0.05); return { sub, sav, n, tax, total: sub + tax } };
const el = e => e <= 0 ? 'Expired' : e <= 3 ? `Expires in ${e}d` : e <= 30 ? `${e} days left` : `${Math.round(e / 30)} mo left`;
const ec = e => e <= 3 ? 'no' : e <= 7 ? 'lo' : 'ok';
const sc = p => p.stock <= 0 ? ['Out of Stock', 'no'] : p.stock <= 5 ? ['Low Stock · ' + p.stock, 'lo'] : ['In Stock', 'ok'];
const pack = p => `<svg class="pk" width="54" height="70" viewBox="0 0 56 73" aria-hidden="true"><path d="M6 10h44l3 60H3z" fill="${p.col}" stroke="#101D36" stroke-width="1.3"/><path d="M6 10l4-8h36l4 8" fill="#101D36"/><rect x="9" y="30" width="38" height="22" fill="#FAF7F0"/><text x="28" y="47" text-anchor="middle" font-family="Space Grotesk" font-weight="700" font-size="16" fill="#101D36">${p.brand.slice(0, 2).toUpperCase()}</text></svg>`;
function toast(t, m, k = '', a = '') { const c = $('#toasts'); while (c.children.length >= 3) c.firstChild.remove(); const d = document.createElement('div'); d.className = 'toast ' + k; d.innerHTML = `<b>${t}</b><span>${m}</span>${a}`; c.append(d); setTimeout(() => d.remove(), 5500); }
function modal(h) { const m = $('#modal'); m.innerHTML = `<div class="mb">${h}</div>`; m.classList.add('show'); const x = m.querySelector('input,button'); x && x.focus(); }
function closeM() { clearInterval(iv); stream && stream.getTracks().forEach(t => t.stop()); stream = 0; $('#modal').classList.remove('show'); }
const getPType = n => {
  const l = n.toLowerCase();
  return ['milk','bread','coffee','tomato','banana','yogurt','curd','atta','oil','rice','salt','chips','noodle','biscuit','tea'].find(x => l.includes(x)) || 'other';
};
const alts = (p, mode) => S.P.filter(x => getPType(x.name) == getPType(p.name) && x.id != p.id && x.stock > 0 && (mode == 'fresh' ? x.exp > p.exp + 3 : x.price < p.price)).sort((a, b) => a.price - b.price);
function add(id, how) { const p = gp(id); if (p.stock <= 0) { outM(p); return false; } p.stock--; const c = S.cart[id] || (S.cart[id] = { q: 0, s: 0 }); c.q++; if (how == 'scan') c.s++; log(how == 'scan' ? 'SCAN' : 'MANUAL', `${p.name} ${how == 'scan' ? 'scanned' : 'added by hand (no scan)'} · qty ${c.q}`); if (how != 'scan') toast('Added to cart', `${p.name} — needs a scan before checkout.`, 'w'); if (p.exp <= 3 && !S.xa[id]) { S.xa[id] = 1; const a = alts(p, 'fresh')[0]; toast('Nearing expiry', `${p.name}: ${el(p.exp)}.` + (a ? ` Fresher: ${a.name} (${el(a.exp)}).` : ''), 'w', a ? `<button class="btn s" data-a="rep:${id}:${a.id}">Swap for fresher</button>` : ''); } else if (p.stock > 0 && p.stock <= 5 && how == 'scan') toast('Low stock', `Only ${p.stock} left of ${p.name}`, 'w'); bchk(); save(); rr(); return true; }
function qty(id, d) { const c = S.cart[id], p = gp(id); if (d > 0) { add(id, 'manual'); return; } c.q--; p.stock++; if (c.s > c.q) c.s = c.q; log('QTY', `${p.name} quantity reduced to ${c.q}`); if (!c.q) delete S.cart[id]; bchk(); save(); rr(); }
function rm(id) { const c = S.cart[id], p = gp(id); p.stock += c.q; delete S.cart[id]; log('REMOVE', `${p.name} removed from cart`); bchk(); save(); rr(); }
function rep(a, b) { const c = S.cart[a]; if (!c) return; const q = c.q, pa = gp(a), pb = gp(b); const k = Math.min(q, pb.stock); pa.stock += q; delete S.cart[a]; pb.stock -= k; S.cart[b] = { q: k, s: 0 }; log('REPLACE', `${pa.name} replaced by ${pb.name} ×${k} (needs scan)`); toast('Item replaced', `${pb.name} added — scan it at checkout to verify.`, 'g'); bchk(); save(); rr(); }
function bchk() { const r = T().total / S.budget; if (r > 1) { if (!S.al.x) { S.al.x = 1; setTimeout(overM, 250); } } else { S.al.x = 0; if (r >= 0.8 && !S.al.w) { S.al.w = 1; toast('Budget near', `You've used ${Math.round(r * 100)}% of ${f(S.budget)}.`, 'w'); } if (r < 0.8) S.al.w = 0; } }
function overM() { const t = T(), r = recs().slice(0, 3); modal(`<h3>Over budget by ${f(t.total - S.budget)}</h3><p>Your cart is ${f(t.total)} against a ${f(S.budget)} budget. Nothing removed.</p>` + (r.length ? `<div class="sm">LOWER-COST ALTERNATIVES</div>` + r.map(x => `<div class="rec"><b>${x.a.name}</b> instead of ${x.p.name}<div class="sm">Save ${f(x.save)} · ${f(x.a.price)} vs ${f(x.p.price)}</div><button class="btn s" data-a="rep:${x.p.id}:${x.a.id}">Replace</button></div>`).join('') : `<p class="sm">No cheaper alternatives.</p>`) + `<div class="cta"><button class="btn" data-a="bud">Raise budget +₹500</button><button class="btn o" data-a="x">Keep shopping</button></div>`); }
function recs() { return Object.keys(S.cart).map(id => { const p = gp(id), a = alts(p, 'cost')[0]; return a && { p, a, save: (p.price - a.price) * S.cart[id].q, u: p.price - a.price }; }).filter(Boolean).sort((x, y) => y.save - x.save); }
function outM(p) { const on = S.notify.includes(p.id), a = alts(p, 'cost')[0]; toast('Out of stock', p.name, 'e'); modal(`<h3>${p.name} is out of stock</h3><p>Demo stock count: 0.${a ? ` ${a.name} is in stock at ${f(a.price)}.` : ''}</p><div class="cta"><button class="btn" data-a="nt:${p.id}">${on ? 'Notification on ✓' : 'Notify me on restock'}</button>` + (a ? `<button class="btn o" data-a="addx:${a.id}">Add ${a.name}</button>` : '') + `<button class="btn o" data-a="x">Close</button></div>`); }
function scanner() {
  modal(`<div class="mb-hd"><h3>Scan product</h3><button class="mb-x" data-a="x" aria-label="Close scanner">&#x2715;</button></div><div class="cam"><video id="v" autoplay playsinline muted></video><i class="scanln"></i></div><p class="sm" id="cm">Starting camera…</p><form data-f="bc" style="display:flex;gap:6px"><input type="text" id="bi" placeholder="Barcode or product name" aria-label="Barcode or product name"><button class="btn">Add</button></form><p class="sm" id="er" role="alert" style="color:var(--r)"></p><p class="sm">Demo barcodes start 8901000… <button class="lnk" data-a="sim">Simulate a scan</button></p>`);
  const cm = $('#cm');
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    cm.textContent = "Camera not supported on this browser. Use manual entry or simulate.";
    return;
  }
  const getCam = (constraints) => navigator.mediaDevices.getUserMedia(constraints);
  getCam({ video: { facingMode: { ideal: 'environment' } } })
    .catch(() => getCam({ video: true }))
    .then(s => {
      stream = s;
      const v = $('#v');
      if (v) {
        v.srcObject = s;
        v.onloadedmetadata = () => v.play().catch(() => {});
        v.play().catch(() => {});
      }
      if ('BarcodeDetector' in window) {
        cm.textContent = 'Point camera at barcode.';
        try {
          const d = new BarcodeDetector({ formats: ['ean_13', 'ean_8', 'upc_a', 'code_128'] });
          iv = setInterval(() => {
            if (v && v.readyState >= 2) {
              d.detect(v).then(r => r[0] && found(r[0].rawValue)).catch(() => 0);
            }
          }, 450);
        } catch(e) {
          cm.textContent = 'Camera active. Point at barcode or enter code below:';
        }
      } else {
        cm.textContent = 'Camera active. Point at barcode or enter code below:';
      }
    })
    .catch(err => {
      console.warn('Camera error:', err);
      cm.textContent = 'Camera permission denied or camera in use.';
    });
}
function found(code) { const q = code.trim().toLowerCase(); const p = S.P.find(x => x.bc == q) || S.P.find(x => x.name.toLowerCase().includes(q) || x.brand.toLowerCase() == q); if (!q || !p) { const e = $('#er'); e && (e.textContent = q ? `No product matches "${code}"` : 'Enter a barcode or product name.'); return; } clearInterval(iv); if (!add(p.id, 'scan')) return; resM(p); }
function resM(p) { const c = S.cart[p.id], [s, k] = sc(p); modal(`<svg class="ck" viewBox="0 0 80 80"><circle cx="40" cy="40" r="36" fill="#A9C7E8" stroke="#101D36" stroke-width="2"/><path d="M24 41l11 11 21-24" fill="none" stroke="#101D36" stroke-width="5"/></svg><h3>Product scanned</h3><div class="pr" style="grid-template-columns:62px 1fr auto">${pack(p)}<div><b>${p.name}</b><div class="sm">${p.brand} · barcode ${p.bc}</div><span class="st ${k}">${s}</span><span class="st ${ec(p.exp)}">${el(p.exp)}</span></div><div class="price">${f(p.price)}</div></div><p>In cart: <b>${c.q}</b> · <span class="sm">Added to your smart cart!</span></p><div class="cta"><button class="btn" data-a="more:${p.id}">Scan +1 more</button><button class="btn o" data-a="scan">Scan another</button><button class="btn o" data-a="x">Done</button></div>`); toast('Added to your smart cart!', p.name, 'g'); }
const ring = () => { const t = T().total, r = t / S.budget, col = r > 1 ? '#b8402a' : r >= 0.8 ? '#b9801a' : '#2c7a58', C = 2 * Math.PI * 34; return `<div class="ring"><svg width="86" height="86" viewBox="0 0 80 80" role="img" aria-label="Budget used ${Math.round(r * 100)}%"><circle cx="40" cy="40" r="34" fill="none" stroke="#e6dfce" stroke-width="8"/><circle cx="40" cy="40" r="34" fill="none" stroke="${col}" stroke-width="8" stroke-dasharray="${Math.min(r, 1) * C} ${C}" transform="rotate(-90 40 40)"/><text x="40" y="45" text-anchor="middle" font-family="Space Grotesk" font-weight="700" font-size="15">${Math.round(r * 100)}%</text></svg><div><div class="sm">BUDGET</div><b style="font-size:24px">${t > S.budget ? '-' + f(t - S.budget) : f(S.budget - t)}</b><div class="sm">${t > S.budget ? 'over' : 'left'} of ${f(S.budget)} <button class="lnk" data-a="bud2">change</button></div></div></div>`; };
const prow = p => { const [s, k] = sc(p); return `<div class="pr">${pack(p)}<div><b>${p.name}</b><div class="sm">${p.brand} · Aisle A${AIS[p.cat]} · ${p.bc}</div><span class="st ${k}">${s}</span><span class="st ${ec(p.exp)}">${el(p.exp)}</span></div><div><div class="price">${f(p.price)}${p.mrp > p.price ? `<s>${f(p.mrp)}</s>` : ''}</div>${p.stock ? `<button class="btn s" data-a="add:${p.id}">Add</button>` : `<button class="btn s o" data-a="nt:${p.id}">${S.notify.includes(p.id) ? 'Notify on ✓' : 'Notify me'}</button>`}</div></div>`; };
const list = () => { const l = S.P.filter(p => (CAT == 'All' || p.cat == CAT) && (p.name + p.brand + p.bc).toLowerCase().includes(Q.toLowerCase())); return l.length ? l.map(prow).join('') : '<div class="empty">No products match.</div>'; };
const cartH = () => {
  const t = T();
  const ids = Object.keys(S.cart);
  const R = recs();

  return `<div class="rcpt">
    <div class="d" style="font-size:28px;margin-bottom:8px">Smart cart · ${t.n}</div>
    ${ring()}
    ${ids.length ? ids.map(id => {
      const p = gp(id);
      const c = S.cart[id];
      return `<div class="ci">
        ${pack(p, 32)}
        <div>
          <b>${p.name}</b>
          <div class="qt">
            <button data-a="q:${id}:-1" aria-label="Decrease">−</button>
            <span>${c.q}</span>
            <button data-a="q:${id}:1" aria-label="Increase">+</button>
          </div>
          <button class="lnk sm" data-a="rm:${id}">remove</button>
          <div class="sm" style="color:${c.s < c.q ? 'var(--a)' : 'var(--g)'}">
            ${c.s < c.q ? (c.q - c.s) + ' unscanned' : 'scan verified'}
          </div>
        </div>
        <b>${f(p.price * c.q)}</b>
      </div>`;
    }).join('') : '<div class="empty">Your cart is empty. Scan or add a product.</div>'}
    <div class="tl"><span>Subtotal</span><span>${f(t.sub)}</span></div>
    <div class="tl" style="color:var(--g)"><span>You save vs MRP</span><span>${f(t.sav)}</span></div>
    <div class="tl"><span>GST (demo 5%)</span><span>${f(t.tax)}</span></div>
    <div class="tl big"><span>Total</span><span>${f(t.total)}</span></div>
    <a class="btn" style="display:block;text-align:center;margin-top:12px" href="#checkout">Scan &amp; Go checkout</a>
  </div>
  ${R.length ? `<div class="sm">RECOMMENDATIONS · rule-based demo engine, not an AI model</div>` + R.slice(0, 3).map(x => `<div class="rec">
    <b>Save ${f(x.save)} with ${x.a.name}</b>
    <div class="sm">Same category (${x.p.cat}), ${f(x.u)} cheaper per unit, ${Math.round((1 - x.a.price / x.a.mrp) * 100)}% off MRP. Was ${f(x.p.price)}, now ${f(x.a.price)}.</div>
    <button class="btn s" data-a="rep:${x.p.id}:${x.a.id}">Replace item</button>
    <button class="btn s o" data-a="cmp:${x.p.id}:${x.a.id}">Compare products</button>
  </div>`).join('') : ''}`;
};

const V = {};

V.home = () => `<section class="hero" style="min-height: 50vh; padding-bottom: 2rem;">
  <div class="hl">
    <div class="eyebrow">Mobile Scan &amp; Go · Loss prevention built in</div>
    <h1>Your Cart.<br><em>Your Rules.</em><br><u>Zero Queues.</u></h1>
    <div class="cta">
      <a class="btn" href="#shop">Start Shopping</a>
      <button class="btn o" data-a="tutorial:1">Explore How It Works</button>
    </div>
  </div>
  <div class="stage" aria-hidden="true">
    <svg class="badge" viewBox="0 0 130 130">
      <defs><path id="cp" d="M65 65m-52 0a52 52 0 1 1 104 0a52 52 0 1 1-104 0"/></defs>
      <text font-family="Space Grotesk" font-size="12" font-weight="700" letter-spacing="3" fill="#A9C7E8">
        <textPath href="#cp">SCAN · TRACK · PAY · GO · SCAN · TRACK · PAY · GO ·</textPath>
      </text>
    </svg>
    <div class="fp" style="--rt:-12deg;left:14%;top:8%">${pack(S.P[2], 70)}</div>
    <div class="fp" style="--rt:9deg;left:34%;top:20%;animation-delay:-2s">${pack(S.P[8], 64)}</div>
    <div class="fp" style="--rt:-5deg;left:4%;top:38%;animation-delay:-3s">${pack(S.P[13], 50)}</div>
    <svg class="bag" viewBox="0 0 300 360">
      <path d="M95 92c0-62 110-62 110 0" fill="none" stroke="#F2E9D8" stroke-width="8"/>
      <path d="M40 90h220l26 252H14z" fill="#F2E9D8"/>
      <path d="M40 90h220l7 64H33z" fill="#e2d3b4"/>
      <text x="150" y="215" text-anchor="middle" font-family="Space Grotesk" font-weight="700" font-size="40" fill="#101D36" letter-spacing="-2">Byte</text>
      <text x="150" y="250" text-anchor="middle" font-family="Space Grotesk" font-size="22" fill="#172B4D" letter-spacing="8">CART</text>
      <path d="M60 290h180" stroke="#101D36" stroke-dasharray="3 5"/>
    </svg>
    <div class="phone">
      <div class="ph">LIVE CART · 3</div>
      ${[2, 8, 13].map((i, k) => `<div class="row">${pack(S.P[i], 24)}<span style="flex:1">${S.P[i].name}</span><b>${f(S.P[i].price)}</b></div>`).join('')}
      <div class="row"><span style="flex:1">Budget used</span><b>62%</b></div>
      <div style="background:var(--n);color:var(--c);padding:8px;margin-top:10px;text-align:center;font:700 12px 'Space Grotesk'">PAY ${f(375)}</div>
      <i class="scanln"></i>
    </div>
    <div class="tag" style="right:6%;bottom:12%">SAVE ₹45</div>
  </div>
</section>
<footer>
  <div>
    <div class="d">ByteCart</div>
    <p style="margin-top:12px;max-width:420px">Hackathon prototype for “Mobile Scan &amp; Go Checkout Anywhere + Loss Prevention”. Frontend only: stock, expiry, payments and verification are simulated demo data. No computer vision or payment gateway is connected.</p>
  </div>
  <ul>
    <li class="eyebrow">Explore</li>
    <li><a href="#shop">Shop</a></li>
    <li><a href="#map">Store map</a></li>
    <li><a href="#staff">Staff</a></li>
    <li><button class="lnk" data-a="tutorial:1">Open Tutorial</button></li>
    <li><button class="lnk" data-a="reset_tut">Reset Tutorial Opt-out</button></li>
  </ul>
  <ul>
    <li class="eyebrow">Integration points</li>
    <li>Barcode: BarcodeDetector API</li>
    <li>Payments: demo UI</li>
    <li>Backend: localStorage</li>
  </ul>
</footer>`;

V.shop = () => `<div class="wrap">
  <div class="eyebrow">Aisle by aisle</div>
  <h1 class="ttl">The shelf, in your pocket.</h1>
  <div class="shop">
    <div>
      <input type="text" id="q" placeholder="Search products, brands or barcodes" value="${Q}" aria-label="Search products">
      <div class="chips">
        ${['All', ...CATS].map(c => `<button class="chip ${c == CAT ? 'on' : ''}" data-a="cat:${c}">${c}</button>`).join('')}
      </div>
      <p class="sm">Stock and expiry are simulated demo data. “Add” enters an item without scanning, which loss prevention will flag.</p>
      <div id="cl">${list()}</div>
    </div>
    <div class="panel" id="cp2">${cartH()}</div>
  </div>
</div>
<button class="btn fab" data-a="scan">Scan product</button>`;

V.map = () => {
  const m = S.P.find(p => MQ && (p.name + p.brand).toLowerCase().includes(MQ.toLowerCase()));
  const a = m ? AIS[m.cat] : 0;
  return `<div class="wrap">
    <div class="eyebrow">Find it fast</div>
    <h1 class="ttl">Store map</h1>
    <input type="text" id="mq" placeholder="Search a product to highlight its aisle" value="${MQ}" aria-label="Search product on map">
    <p id="dir" style="margin:10px 0">
      ${m ? `<b>${m.name}</b>: Aisle A${a} (${m.cat}), shelf ${m.id % 4 + 1}. From the entrance, walk along the main aisle to A${a}, then turn up. Checkout is at the bottom right.` : MQ ? 'No product found. Try “milk”, “atta” or “chips”.' : 'Type a product to get directions.'}
    </p>
    <div id="mp">${mapSvg(a)}</div>
  </div>`;
};

V.checkout = () => {
  const t = T();
  const is = issues();
  const fl = S.flags.find(x => x.status == 'open');
  const rj = S.flags.find(x => x.status == 'rejected' && is.length);
  const ok = t.n > 0 && !is.length;

  return `<div class="wrap">
    <div class="eyebrow">Scan &amp; Go</div>
    <h1 class="ttl">Checkout</h1>
    ${!t.n ? `<div class="empty">Your cart is empty. <a href="#shop">Go shopping</a></div>` : `
    <div class="shop">
      <div>
        <div class="card2">
          <h3 style="font-size:26px;margin-bottom:8px">1 · Cart verification</h3>
          ${ok ? `<p style="color:var(--g)"><b>All ${t.n} items reconciled.</b> Scan log matches the cart.</p>` : `
          <p style="color:var(--a)"><b>Verification required.</b> ${is.length} item(s) were added without a scan.</p>
          ${is.map(i => `<div class="tl"><span>${i.name} ×${i.miss} unscanned</span><button class="btn s" data-a="rescan:${i.id}">Simulate re-scan</button></div>`).join('')}
          ${fl ? `<p class="sm">Staff review ${fl.id} requested. Waiting in the Staff queue.</p>` : rj ? `<p class="sm" style="color:var(--r)">Staff rejected the last review. Please re-scan the items.</p>` : `<button class="btn o s" data-a="flag">Request staff review</button>`}
          `}
          <p class="sm" style="margin-top:10px">Simulated verification. No camera or weight sensor is connected. <button class="lnk" data-a="scn">Run demo scenario: unlisted item in bag</button></p>
        </div>
        <div class="card2">
          <h3 style="font-size:26px;margin-bottom:8px">2 · Payment (demo UI)</h3>
          <div class="chips">
            ${['UPI', 'Card', 'Net banking', 'Wallet'].map(m => `<button class="chip ${S.pay == m ? 'on' : ''}" data-a="pay:${m}">${m}</button>`).join('')}
          </div>
          <p class="sm">No payment details are collected. Confirming only simulates a successful payment.</p>
        </div>
      </div>
      <div class="panel">
        <div class="rcpt">
          <div class="d" style="font-size:26px;margin-bottom:8px">Order summary</div>
          ${Object.keys(S.cart).map(id => `<div class="tl"><span>${gp(id).name} ×${S.cart[id].q}</span><span>${f(gp(id).price * S.cart[id].q)}</span></div>`).join('')}
          <div class="tl"><span>Items</span><span>${t.n}</span></div>
          <div class="tl" style="color:var(--g)"><span>Savings</span><span>${f(t.sav)}</span></div>
          <div class="tl"><span>GST</span><span>${f(t.tax)}</span></div>
          <div class="tl"><span>Method</span><span>${S.pay}</span></div>
          <div class="tl big"><span>Pay</span><span>${f(t.total)}</span></div>
          <button class="btn" style="width:100%;margin-top:12px" data-a="payn" ${ok ? '' : 'disabled'}>
            ${ok ? 'Confirm payment (simulated)' : 'Resolve verification first'}
          </button>
        </div>
      </div>
    </div>`}
  </div>`;
};

V.receipt = () => {
  const r = S.last;
  return r ? `<div class="wrap">
    <div style="text-align:center">
      <svg class="ck" viewBox="0 0 80 80">
        <circle cx="40" cy="40" r="36" fill="#A9C7E8" stroke="#101D36" stroke-width="2"/>
        <path d="M24 41l11 11 21-24" fill="none" stroke="#101D36" stroke-width="5"/>
      </svg>
      <h1 class="ttl">You're good to go.</h1>
    </div>
    <div class="rc">
      <div class="d" style="font-size:24px">ByteCart</div>
      <p class="sm">DEMO RECEIPT · ${r.id} · ${r.time}<br>Simulated payment via ${r.method}. No real transaction.</p>
      ${r.items.map(i => `<div class="tl"><span>${i.name} ×${i.q}</span><span>${f(i.price * i.q)}</span></div>`).join('')}
      <div class="tl"><span>Subtotal</span><span>${f(r.sub)}</span></div>
      <div class="tl"><span>GST</span><span>${f(r.tax)}</span></div>
      <div class="tl" style="color:var(--g)"><span>Savings</span><span>${f(r.sav)}</span></div>
      <div class="tl big"><span>Total</span><span>${f(r.total)}</span></div>
      <p class="sm">Cart verification: passed</p>
    </div>
    <p style="text-align:center"><a class="btn" href="#shop">New basket</a></p>
  </div>` : `<div class="wrap"><div class="empty">No receipt yet.</div></div>`;
};

V.staff = () => {
  if (!staffAuthed) {
    return `<div class="wrap" style="max-width:500px;margin:50px auto;padding:0 16px">
      <div class="card2" style="padding:32px 28px;background:var(--c);border:1px solid var(--n);box-shadow:6px 6px 0 var(--s)">
        <div class="eyebrow" style="color:var(--a);margin-bottom:8px">STAFF ACCESS</div>
        <h1 class="ttl" style="font-size:30px;margin:0 0 10px">Authenticate yourself as staff</h1>
        <p class="sm" style="margin-bottom:20px;line-height:1.5">Please enter your Staff ID and password to access the staff console.</p>
        
        <form data-f="stauth" style="display:flex;flex-direction:column;gap:14px">
          <div>
            <label style="display:block;font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin-bottom:6px" for="st-id">Staff ID</label>
            <input type="text" id="st-id" name="sid" placeholder="e.g. STF-101 or admin" required style="width:100%" autocomplete="username">
          </div>
          <div>
            <label style="display:block;font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin-bottom:6px" for="st-pw">Password</label>
            <input type="password" id="st-pw" name="spw" placeholder="Enter password" required style="width:100%" autocomplete="current-password">
          </div>
          <p id="st-err" class="sm" role="alert" style="color:var(--r);margin:0;min-height:18px"></p>
          <button class="btn" style="width:100%;margin-top:4px">Authenticate</button>
          <div class="sm" style="background:var(--s);padding:10px 12px;border:1px solid var(--n);margin-top:6px;font-size:12px">
            <b>Demo Login:</b> Staff ID: <code>admin</code> or <code>staff101</code> &nbsp;&middot;&nbsp; Password: <code>admin</code> or <code>staff123</code>
          </div>
        </form>
      </div>
    </div>`;
  }

  const L = low().length;
  const E = open().length;
  return `<div class="adm">
    <aside class="side">
      <div class="d">STAFF<br>CONSOLE</div>
      <p style="margin-top:8px">Logged in as <b>${staffAuthed}</b></p>
      <button class="btn s o" data-a="stlogout" style="width:100%;margin:10px 0 14px">Lock / Log out</button>
      <button class="btn sky s" data-a="reset">Reset demo data</button>
    </aside>
    <div class="main">
      <div class="kp">
        <div><b class="${L ? 'no' : ''}">${L}</b>Low / out of stock</div>
        <div><b class="${exs().length ? 'lo' : ''}">${exs().length}</b>Expiring ≤ 7d</div>
        <div><b class="${E ? 'no' : ''}">${E}</b>Open flags</div>
        <div><b>${S.P.reduce((a, p) => a + p.stock, 0)}</b>Units in stock</div>
      </div>
      <div class="tabs" role="tablist">
        ${[['inv', 'Products'], ['al', 'Alerts'], ['ver', 'Verification'], ['aud', 'Audit'], ['sal', 'Sales']].map(t =>
          `<button role="tab" class="${TAB == t[0] ? 'on' : ''}" data-a="tab:${t[0]}">${t[1]}${t[0] == 'ver' && E ? `<span class="dot">${E}</span>` : ''}${t[0] == 'al' && L ? `<span class="dot">${L}</span>` : ''}</button>`
        ).join('')}
      </div>
      <div id="tb">${stTab()}</div>
    </div>
  </div>`;
};

const low = () => S.P.filter(p => p.stock <= 5);
const exs = () => S.P.filter(p => p.exp <= 7).sort((a, b) => a.exp - b.exp);
const open = () => S.flags.filter(x => x.status == 'open');

const inv = () => {
  let l = S.P.filter(p => (AC == 'All' || p.cat == AC) && (p.name + p.bc).toLowerCase().includes(AQ.toLowerCase()));
  l.sort((a, b) => AS == 'name' ? a.name.localeCompare(b.name) : a[AS] - b[AS]);
  return l.length ? `<table>
    <thead>
      <tr>
        ${[['name', 'Product'], ['cat', 'Category'], ['bc', 'Barcode'], ['price', 'Price'], ['stock', 'Stock'], ['exp', 'Expiry d']].map(h => `<th data-a="sort:${h[0]}">${h[1]}</th>`).join('')}
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      ${l.map(p => `<tr>
        <td>${p.name}</td>
        <td>${p.cat}</td>
        <td>${p.bc}</td>
        <td><input type="number" min="1" value="${p.price}" data-e="price:${p.id}" aria-label="Price"></td>
        <td><input type="number" min="0" value="${p.stock}" data-e="stock:${p.id}" aria-label="Stock"></td>
        <td><input type="number" min="0" value="${p.exp}" data-e="exp:${p.id}" aria-label="Expiry days"></td>
        <td class="${sc(p)[1]}">${sc(p)[0]}</td>
      </tr>`).join('')}
    </tbody>
  </table>` : '<div class="empty">No products match these filters.</div>';
};

const stTab = () => {
  if (TAB == 'inv') {
    return `<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px">
      <input type="text" id="aq" placeholder="Search name or barcode" value="${AQ}" style="max-width:260px" aria-label="Search inventory">
      <select id="ac" style="max-width:160px" aria-label="Category">
        ${['All', ...CATS].map(c => `<option ${c == AC ? 'selected' : ''}>${c}</option>`).join('')}
      </select>
    </div>
    <div style="overflow:auto" id="it">${inv()}</div>
    <form data-f="np" style="display:flex;gap:6px;flex-wrap:wrap;margin-top:16px">
      <input type="text" name="n" placeholder="New product name" style="max-width:220px" required>
      <input type="number" name="p" placeholder="Price" min="1" required style="max-width:90px">
      <input type="number" name="s" placeholder="Stock" min="0" required style="max-width:90px">
      <select name="c" style="max-width:140px">${CATS.map(c => `<option>${c}</option>`).join('')}</select>
      <button class="btn s">Add product</button>
    </form>`;
  }

  if (TAB == 'al') {
    const l = low(), e = exs();
    return `<h3 style="font-size:26px;margin-bottom:8px">Restock alerts</h3>
    ${l.length ? l.map(p => `<div class="tl"><span class="${p.stock ? 'lo' : 'no'}"><b>${p.name}</b> · ${p.stock} left${S.notify.includes(p.id) ? ' · shopper waiting' : ''}</span><button class="btn s" data-a="rs:${p.id}">Restock +20</button></div>`).join('') : '<div class="empty">Nothing is running low.</div>'}
    <h3 style="font-size:26px;margin:22px 0 8px">Expiry monitor (≤ 7 days)</h3>
    ${e.length ? e.map(p => `<div class="tl"><span class="${ec(p.exp)}"><b>${p.name}</b> · ${el(p.exp)} · ${p.stock} units</span></div>`).join('') : '<div class="empty">No items near expiry.</div>'}`;
  }

  if (TAB == 'ver') {
    return `<h3 style="font-size:26px;margin-bottom:8px">Flagged checkouts</h3>
    ${S.flags.length ? S.flags.map(x => `<div class="card2">
      <b>${x.id}</b> · ${x.time} · ${f(x.total)} <span class="st ${x.status == 'open' ? 'lo' : x.status == 'cleared' ? 'ok' : 'no'}">${x.status}</span>${x.sim ? ' <span class="sm">(simulated scenario)</span>' : ''}
      <div class="sm">${x.items.map(i => i.name + ' ×' + i.miss + ' unscanned').join(', ')}</div>
      ${x.status == 'open' ? `<div class="cta" style="margin:8px 0 0"><button class="btn s" data-a="fa:${x.id}">Approve</button><button class="btn s o" data-a="fr:${x.id}">Reject</button></div>` : ''}
    </div>`).join('') : '<div class="empty">No flagged checkouts. Add an item by hand, then request staff review at checkout.</div>'}`;
  }

  if (TAB == 'aud') {
    return `<h3 style="font-size:26px;margin-bottom:8px">Audit trail</h3>
    ${S.audit.length ? `<table><tbody>${S.audit.map(a => `<tr><td>${a.t}</td><td><b>${a.k}</b></td><td>${a.m}</td></tr>`).join('')}</tbody></table>` : '<div class="empty">No events yet.</div>'}`;
  }

  const rev = S.txns.reduce((a, t) => a + t.total, 0);
  const cs = [['Staples', 31200], ['Dairy', 18400], ['Beverages', 14900], ['Snacks', 11200], ['Produce', 9800], ['Bakery', 6100]];
  const mx = 31200;
  return `<div class="kp">
    <div><b>${S.txns.length}</b>Session checkouts</div>
    <div><b>${f(rev)}</b>Session revenue</div>
    <div><b>${f(91600)}</b>Sample weekly baseline</div>
  </div>
  <h3 style="font-size:26px;margin-bottom:26px">Sales by category · sample baseline</h3>
  <div class="bar">
    ${cs.map(c => `<i style="height:${c[1] / mx * 100}%" title="${f(c[1])}"><span>${c[0]}</span></i>`).join('')}
  </div>
  <h3 style="font-size:26px;margin:44px 0 8px">Recent transactions</h3>
  ${S.txns.length ? S.txns.map(t => `<div class="tl"><span>${t.id} · ${t.time} · ${t.method}</span><b>${f(t.total)}</b></div>`).join('') : '<div class="empty">Complete a demo checkout to see it here.</div>'}`;
};

const mapSvg = a => `<svg class="map" viewBox="0 0 640 400" role="img" aria-label="Supermarket floor plan">
  <rect x="8" y="8" width="624" height="384" fill="none" stroke="#101D36" stroke-width="2"/>
  ${CATS.map((c, i) => `<rect class="ai ${a == i + 1 ? 'hl2' : ''}" x="${88 + i * 84}" y="50" width="40" height="230"/>
    <text x="${108 + i * 84}" y="40" text-anchor="middle" font-size="12" font-weight="700" font-family="Space Grotesk">A${i + 1}</text>
    <text transform="translate(${112 + i * 84} 270) rotate(-90)" font-size="11">${c}</text>`).join('')}
  <rect x="8" y="310" width="60" height="82" fill="#A9C7E8" stroke="#101D36"/>
  <text x="38" y="355" text-anchor="middle" font-size="11" font-weight="700">ENTRY</text>
  ${[0, 1, 2].map(i => `<rect x="${440 + i * 62}" y="330" width="50" height="40" fill="#101D36"/>
    <text x="${465 + i * 62}" y="355" text-anchor="middle" font-size="10" fill="#FAF7F0">CO ${i + 1}</text>`).join('')}
  <text x="440" y="320" font-size="11">Checkout / Scan &amp; Go exit</text>
  <rect x="590" y="50" width="34" height="230" fill="#F2E9D8" stroke="#101D36"/>
  <text transform="translate(612 220) rotate(-90)" font-size="11">Chilled wall</text>
  ${a ? `<path d="M40 340H${108 + (a - 1) * 84}V290" fill="none" stroke="#b8402a" stroke-width="3" stroke-dasharray="7 6"/>` : ''}
  <g font-size="11">
    <rect x="20" y="20" width="10" height="10" class="ai"/>
    <text x="36" y="29">Aisle</text>
    <rect x="20" y="36" width="10" height="10" fill="#A9C7E8" stroke="#101D36"/>
    <text x="36" y="45">Entrance</text>
  </g>
</svg>`;

function issues() {
  return Object.keys(S.cart).filter(id => S.cart[id].s < S.cart[id].q).map(id => ({ id, name: gp(id).name, miss: S.cart[id].q - S.cart[id].s }));
}

function rr() {
  const r = location.hash.slice(1) || 'home';
  if (r == 'shop') {
    const c = $('#cp2');
    if (c) {
      c.innerHTML = cartH();
      $('#cl').innerHTML = list();
      return;
    }
  }
  render();
}

function render() {
  const r = (location.hash.slice(1) || 'home').split('?')[0];
  if (r !== 'staff' && staffAuthed) {
    staffAuthed = '';
    sessionStorage.removeItem('bytecart_staff_auth');
  }
  const v = V[r] || V.home;
  $('#app').innerHTML = v();
  document.querySelectorAll('[data-r]').forEach(a => a.classList.toggle('on', a.dataset.r == r));
  const n = open().length + low().length;
  $('#nb').innerHTML = n ? `<span class="dot">${n}</span>` : '';
  scrollTo(0, 0);
}

function showTutorial(step) {
  const steps = [
    {
      title: "Scan products instantly",
      desc: "Point your phone at a product barcode to identify the item and view its price, stock information, and expiry details when available.",
      icon: `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7V4h3M17 4h3v3M4 17v3h3M17 20h3v-3M8 12h8"/></svg>`
    },
    {
      title: "Track your cart and budget",
      desc: "Every scanned or added item updates your cart. Keep track of your running total, available budget, and product information while shopping.",
      icon: `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>`
    },
    {
      title: "Review and pay",
      desc: "Review your cart, verify your items, and proceed through the available checkout workflow. (Payment is simulated in this prototype).",
      icon: `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>`
    },
    {
      title: "You're ready to go",
      desc: "Complete the available checkout process, access your digital receipt when supported, and follow any applicable store verification instructions.",
      icon: `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/></svg>`
    }
  ];
  step = parseInt(step) || 1;
  const s = steps[step - 1];
  const isLast = step === steps.length;
  modal(`<div class="mb-hd"><h3>Tutorial</h3><button class="mb-x" data-a="x" aria-label="Close tutorial">&#x2715;</button></div>
    <div style="text-align: center; margin-bottom: 16px; color: var(--s);">
      ${s.icon}
    </div>
    <div>
      <div class="eyebrow" style="margin-bottom: 8px;">Step ${step} of 4</div>
      <h4 style="font-size: 22px; margin-bottom: 12px;">${s.title}</h4>
      <p style="font-size: 15px; color: var(--n);">${s.desc}</p>
      ${isLast ? `<label style="display:flex;align-items:center;gap:8px;margin-top:20px;font-weight:600;cursor:pointer;"><input type="checkbox" id="tut-optout" style="width:20px;height:20px;"> Do not show this tutorial again</label>` : ''}
    </div>
    <div class="cta" style="display:flex;justify-content:space-between;margin-top:28px">
      ${step > 1 ? `<button class="btn o" data-a="tutorial:${step - 1}">Back</button>` : `<button class="btn o" data-a="x">Skip</button>`}
      ${isLast ? `<button class="btn" data-a="tut_finish">Get Started</button>` : `<button class="btn" data-a="tutorial:${step + 1}">Next</button>`}
    </div>`);
}

const A = {
  x: closeM,
  scan: scanner,
  tutorial: step => showTutorial(step || 1),
  tut_finish: () => {
    const c = document.getElementById('tut-optout');
    if (c && c.checked) {
      localStorage.setItem('bytecart_tutorial_disabled', 'true');
    }
    closeM();
  },
  reset_tut: () => {
    localStorage.removeItem('bytecart_tutorial_disabled');
    toast('Tutorial Reset', 'It will automatically appear next launch.', 'g');
  },
  sim: () => {
    const l = S.P.filter(p => p.stock > 0);
    found(l[Math.floor(Math.random() * l.length)].bc);
  },
  more: id => {
    add(id, 'scan');
    resM(gp(id));
  },
  add: id => add(id, 'manual'),
  addx: id => {
    closeM();
    add(id, 'manual');
  },
  q: (id, d) => qty(id, +d),
  rm,
  rep: (a, b) => {
    closeM();
    rep(a, b);
  },
  cat: c => {
    CAT = c;
    render();
  },
  nt: id => {
    id = +id;
    if (!S.notify.includes(id)) {
      S.notify.push(id);
      log('NOTIFY', gp(id).name + ' restock alert enabled');
      toast('Restock notification enabled', gp(id).name + ' (demo, stored on this device).', 'g');
    }
    save();
    closeM();
    rr();
  },
  bud: () => {
    S.budget += 500;
    S.al = { w: 0, x: 0 };
    save();
    closeM();
    rr();
  },
  bud2: () => modal(`<h3>Set budget</h3><form data-f="bu"><input type="number" id="bv" min="100" value="${S.budget}" aria-label="Budget in rupees"><p class="sm" id="er" role="alert" style="color:var(--r)"></p><div class="cta"><button class="btn">Save budget</button><button type="button" class="btn o" data-a="x">Cancel</button></div></form>`),
  cmp: (a, b) => {
    const x = gp(a), y = gp(b);
    modal(`<h3>Compare</h3><table style="min-width:0"><tr><th></th><th>${x.name}</th><th>${y.name}</th></tr>${[['Price', p => f(p.price)], ['MRP', p => f(p.mrp)], ['Expiry', p => el(p.exp)], ['Stock', p => sc(p)[0]], ['Aisle', p => 'A' + AIS[p.cat]]].map(r => `<tr><td>${r[0]}</td><td>${r[1](x)}</td><td>${r[1](y)}</td></tr>`).join('')}</table><div class="cta"><button class="btn" data-a="rep:${a}:${b}">Replace item</button><button class="btn o" data-a="x">Close</button></div>`);
  },
  rescan: id => {
    S.cart[id].s = S.cart[id].q;
    log('VERIFY', gp(id).name + ' re-scanned (simulated)');
    save();
    render();
  },
  flag: () => {
    const is = issues(), t = T();
    S.flags.unshift({ id: 'F' + S.n++, time: now(), total: t.total, items: is, status: 'open' });
    log('FLAG', 'Checkout flagged for staff review');
    toast('Cart verification required', 'Staff review requested. Check the Staff tab to approve (demo).', 'w');
    save();
    render();
  },
  scn: () => {
    const l = S.P.filter(p => p.stock > 0 && !S.cart[p.id]);
    const p = l[0];
    if (!p) return;
    p.stock--;
    S.cart[p.id] = { q: 1, s: 0 };
    log('SIM', 'SIMULATED: bag sensor reports an item not in the scan log (' + p.name + ')');
    toast('Cart verification required', 'Simulated scenario: ' + p.name + ' is unscanned.', 'w');
    save();
    bchk();
    render();
  },
  pay: m => {
    S.pay = m;
    save();
    render();
  },
  payn: () => {
    const b = $('[data-a=payn]');
    b.disabled = 1;
    b.textContent = 'Simulating payment…';
    setTimeout(() => {
      const t = T();
      const id = 'SM-' + Date.now().toString(36).toUpperCase();
      const items = Object.keys(S.cart).map(i => ({ name: gp(i).name, q: S.cart[i].q, price: gp(i).price }));
      S.last = { id, time: now(), items, sub: t.sub, tax: t.tax, total: t.total, sav: t.sav, method: S.pay };
      S.txns.unshift(S.last);
      log('CHECKOUT', id + ' paid (simulated) ' + f(t.total));
      S.cart = {};
      S.xa = {};
      S.al = { w: 0, x: 0 };
      save();
      toast('Payment simulation successful', id, 'g');
      location.hash = '#receipt';
    }, 1400);
  },
  tab: t => {
    TAB = t;
    render();
  },
  sort: k => {
    AS = k;
    $('#tb').innerHTML = stTab();
  },
  rs: id => {
    const p = gp(id);
    p.stock += 20;
    log('RESTOCK', p.name + ' +20');
    if (S.notify.includes(+id)) {
      S.notify = S.notify.filter(x => x != id);
      toast('Back in stock', p.name + ' — shoppers notified (demo).', 'g');
    }
    save();
    render();
    TAB = 'al';
  },
  fa: id => {
    const x = S.flags.find(y => y.id == id);
    x.status = 'cleared';
    x.items.forEach(i => {
      if (S.cart[i.id]) S.cart[i.id].s = S.cart[i.id].q;
    });
    log('STAFF', id + ' approved');
    save();
    render();
  },
  fr: id => {
    S.flags.find(y => y.id == id).status = 'rejected';
    log('STAFF', id + ' rejected');
    save();
    render();
  },
  reset: () => {
    S = fresh();
    save();
    toast('Demo data reset', 'Fresh catalog and empty cart.', 'g');
    render();
  },
  stlogout: () => {
    staffAuthed = '';
    sessionStorage.removeItem('bytecart_staff_auth');
    toast('Logged out', 'Staff session locked.', 'w');
    render();
  }
};

document.addEventListener('click', e => {
  const b = e.target.closest('[data-a]');
  if (!b) return;
  const [a, x, y] = b.dataset.a.split(':');
  A[a] && A[a](x, y);
});

document.addEventListener('input', e => {
  const i = e.target;
  if (i.id == 'q') {
    Q = i.value;
    $('#cl').innerHTML = list();
  }
  if (i.id == 'mq') {
    MQ = i.value;
    $('#app').innerHTML = V.map();
    const n = $('#mq');
    n.focus();
    n.setSelectionRange(99, 99);
  }
  if (i.id == 'aq') {
    AQ = i.value;
    $('#it').innerHTML = inv();
  }
});

document.addEventListener('change', e => {
  const i = e.target;
  if (i.id == 'ac') {
    AC = i.value;
    $('#it').innerHTML = inv();
  }
  if (i.dataset.e) {
    const [k, id] = i.dataset.e.split(':');
    const v = Math.max(k == 'stock' || k == 'exp' ? 0 : 1, +i.value || 0);
    gp(id)[k] = v;
    log('ADMIN', gp(id).name + ' ' + k + ' set to ' + v);
    save();
    render();
  }
});

document.addEventListener('submit', e => {
  const fm = e.target;
  const k = fm.dataset.f;
  if (!k) return;
  e.preventDefault();

  if (k == 'bc') found($('#bi').value);

  if (k == 'bu') {
    const v = +$('#bv').value;
    if (!(v >= 100)) {
      $('#er').textContent = 'Enter at least ₹100.';
      return;
    }
    S.budget = v;
    S.al = { w: 0, x: 0 };
    save();
    closeM();
    bchk();
    rr();
  }

  if (k == 'np') {
    const d = new FormData(fm);
    S.P.push({
      id: Math.max(...S.P.map(p => p.id)) + 1,
      name: d.get('n'),
      brand: 'Store',
      cat: d.get('c'),
      price: +d.get('p'),
      mrp: +d.get('p'),
      stock: +d.get('s'),
      exp: 30,
      col: '#F2E9D8',
      bc: '8901000' + String(S.P.length + 1).padStart(6, '0')
    });
    log('ADMIN', 'Product added: ' + d.get('n'));
    save();
    render();
  }

  if (k == 'stauth') {
    const sid = ($('#st-id').value || '').trim();
    const spw = ($('#st-pw').value || '').trim();
    const validPasswords = ['admin', 'staff', 'staff123', '1234', 'password', 'bytecart'];
    if (sid.length >= 2 && (validPasswords.includes(spw.toLowerCase()) || spw === sid)) {
      staffAuthed = sid;
      sessionStorage.setItem('bytecart_staff_auth', sid);
      log('STAFF', 'Staff logged in: ' + sid);
      toast('Authenticated', 'Welcome to Staff Console, ' + sid + '!', 'g');
      render();
    } else {
      const err = $('#st-err');
      if (err) err.textContent = 'Invalid credentials. Use demo ID: admin & password: admin';
    }
  }
});

document.addEventListener('keydown', e => {
  if (e.key == 'Escape') closeM();
});

addEventListener('hashchange', render);

render();

if (localStorage.getItem('bytecart_tutorial_disabled') !== 'true') {
  showTutorial(1);
}
