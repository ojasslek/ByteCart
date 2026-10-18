import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import './bytecart_v2.css';

const CATS = ['Produce', 'Dairy', 'Bakery', 'Staples', 'Snacks', 'Beverages'];
const AIS = { Produce: 1, Dairy: 2, Bakery: 3, Staples: 4, Snacks: 5, Beverages: 6 };

const RAW_PRODUCTS = [
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

const getProductType = (name) => {
  const l = name.toLowerCase();
  return ['milk','bread','coffee','tomato','banana','yogurt','curd','atta','oil','rice','salt','chips','noodle','biscuit','tea'].find(x => l.includes(x)) || 'other';
};

const createProducts = () =>
  RAW_PRODUCTS.map((r, i) => ({
    id: i + 1,
    name: r[0],
    brand: r[1],
    cat: r[2],
    price: r[3],
    mrp: r[4],
    stock: r[5],
    exp: r[6],
    col: r[7],
    bc: '8901000' + String(i + 1).padStart(6, '0')
  }));

const freshState = () => ({
  P: createProducts(),
  cart: {},
  budget: 1500,
  notify: [],
  audit: [],
  flags: [],
  txns: [],
  xa: {},
  al: { w: 0, x: 0 },
  last: null,
  pay: 'UPI',
  n: 1
});

const f = n => '₹' + Number(n).toLocaleString('en-IN');
const now = () => new Date().toLocaleString('en-IN');

const el = e =>
  e <= 0 ? 'Expired' : e <= 3 ? `Expires in ${e}d` : e <= 30 ? `${e} days left` : `${Math.round(e / 30)} mo left`;
const ec = e => (e <= 3 ? 'no' : e <= 7 ? 'lo' : 'ok');
const sc = p =>
  p.stock <= 0 ? ['Out of Stock', 'no'] : p.stock <= 5 ? ['Low Stock · ' + p.stock, 'lo'] : ['In Stock', 'ok'];

const Pack = ({ p, width = 54, height = 70 }) => (
  <svg className="pk" width={width} height={height} viewBox="0 0 56 73" aria-hidden="true">
    <path d="M6 10h44l3 60H3z" fill={p.col} stroke="#101D36" strokeWidth="1.3" />
    <path d="M6 10l4-8h36l4 8" fill="#101D36" />
    <rect x="9" y="30" width="38" height="22" fill="#FAF7F0" />
    <text
      x="28"
      y="47"
      textAnchor="middle"
      fontFamily="Space Grotesk"
      fontWeight="700"
      fontSize="16"
      fill="#101D36"
    >
      {p.brand.slice(0, 2).toUpperCase()}
    </text>
  </svg>
);

export default function Bytecart() {
  const [store, setStore] = useState(() => {
    try {
      const saved = localStorage.getItem('sm1');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return freshState();
  });

  const [route, setRoute] = useState(() => {
    const hash = window.location.hash.slice(1).split('?')[0];
    return ['home', 'shop', 'map', 'checkout', 'receipt', 'staff'].includes(hash) ? hash : 'home';
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCat, setSelectedCat] = useState('All');
  const [mapQuery, setMapQuery] = useState('');
  const [staffTab, setStaffTab] = useState('inv');
  const [adminQuery, setAdminQuery] = useState('');
  const [adminCat, setAdminCat] = useState('All');
  const [adminSort, setAdminSort] = useState('name');
  const [activeModal, setActiveModal] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [staffAuthed, setStaffAuthed] = useState('');
  const [staffIdInput, setStaffIdInput] = useState('');
  const [staffPwInput, setStaffPwInput] = useState('');
  const [staffAuthError, setStaffAuthError] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
     if(localStorage.getItem('bytecart_onboarding_optout') !== 'true') {
         setActiveModal({type: 'onboarding', step: 1});
     }
  }, []);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const scanIntervalRef = useRef(null);
  const mapInputRef = useRef(null);

  const saveStore = useCallback(newStore => {
    setStore(newStore);
    try {
      localStorage.setItem('sm1', JSON.stringify(newStore));
    } catch (e) {}
  }, []);

  const addToast = useCallback((title, msg, kind = '', action = null) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev.slice(-2), { id, title, msg, kind, action }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5500);
  }, []);

  const logAudit = useCallback((k, m) => {
    setStore(prev => {
      const audit = [{ t: now(), k, m }, ...prev.audit].slice(0, 80);
      const updated = { ...prev, audit };
      try {
        localStorage.setItem('sm1', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  }, []);

  useEffect(() => {
    const onHashChange = () => {
      const r = (window.location.hash.slice(1) || 'home').split('?')[0];
      if (r !== 'staff') {
        setStaffAuthed('');
        sessionStorage.removeItem('bytecart_staff_auth');
      }
      if (['home', 'shop', 'map', 'checkout', 'receipt', 'staff'].includes(r)) {
        setRoute(r);
        window.scrollTo(0, 0);
      }
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const navigate = useCallback(r => {
    if (r !== 'staff') {
      setStaffAuthed('');
      sessionStorage.removeItem('bytecart_staff_auth');
    }
    window.location.hash = '#' + r;
    setRoute(r);
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const onKeyDown = e => {
      if (e.key === 'Escape') closeModal();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const closeModal = useCallback(() => {
    if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setActiveModal(null);
  }, []);

  const getProduct = useCallback(id => store.P.find(p => p.id === Number(id)), [store.P]);

  const totals = useMemo(() => {
    let sub = 0;
    let sav = 0;
    let n = 0;
    for (const id in store.cart) {
      const item = store.cart[id];
      const prod = getProduct(id);
      if (prod) {
        sub += prod.price * item.q;
        sav += (prod.mrp - prod.price) * item.q;
        n += item.q;
      }
    }
    const tax = Math.round(sub * 0.05);
    return { sub, sav, n, tax, total: sub + tax };
  }, [store.cart, getProduct]);

  const alternatives = useCallback(
    (p, mode = 'cost') =>
      store.P.filter(
        x =>
          getProductType(x.name) === getProductType(p.name) &&
          x.id !== p.id &&
          x.stock > 0 &&
          (mode === 'fresh' ? x.exp > p.exp + 3 : x.price < p.price)
      ).sort((a, b) => a.price - b.price),
    [store.P]
  );

  const recommendations = useMemo(() => {
    return Object.keys(store.cart)
      .map(id => {
        const p = getProduct(id);
        if (!p) return null;
        const a = alternatives(p, 'cost')[0];
        if (!a) return null;
        return {
          p,
          a,
          save: (p.price - a.price) * store.cart[id].q,
          u: p.price - a.price
        };
      })
      .filter(Boolean)
      .sort((x, y) => y.save - x.save);
  }, [store.cart, getProduct, alternatives]);

  const checkBudget = useCallback(
    newStore => {
      let sub = 0;
      for (const id in newStore.cart) {
        const p = newStore.P.find(x => x.id === Number(id));
        if (p) sub += p.price * newStore.cart[id].q;
      }
      const total = sub + Math.round(sub * 0.05);
      const ratio = total / newStore.budget;

      if (ratio > 1) {
        if (!newStore.al.x) {
          newStore.al.x = 1;
          setTimeout(() => setActiveModal({ type: 'overBudget' }), 250);
        }
      } else {
        newStore.al.x = 0;
        if (ratio >= 0.8 && !newStore.al.w) {
          newStore.al.w = 1;
          addToast('Budget near', `You've used ${Math.round(ratio * 100)}% of ${f(newStore.budget)}.`, 'w');
        }
        if (ratio < 0.8) newStore.al.w = 0;
      }
    },
    [addToast]
  );

  const addToCart = useCallback(
    (id, how) => {
      const p = getProduct(id);
      if (!p || p.stock <= 0) {
        if (p) {
          addToast('Out of stock', p.name, 'e');
          setActiveModal({ type: 'outOfStock', product: p });
        }
        return false;
      }

      setStore(prev => {
        const newProducts = prev.P.map(item => (item.id === p.id ? { ...item, stock: item.stock - 1 } : item));
        const currentItem = prev.cart[p.id] || { q: 0, s: 0 };
        const newCart = {
          ...prev.cart,
          [p.id]: {
            q: currentItem.q + 1,
            s: how === 'scan' ? currentItem.s + 1 : currentItem.s
          }
        };

        const newStore = { ...prev, P: newProducts, cart: newCart };
        logAudit(
          how === 'scan' ? 'SCAN' : 'MANUAL',
          `${p.name} ${how === 'scan' ? 'scanned' : 'added by hand (no scan)'} · qty ${newCart[p.id].q}`
        );

        if (how !== 'scan') {
          addToast('Added to cart', `${p.name} — needs a scan before checkout.`, 'w');
        }

        if (p.exp <= 3 && !prev.xa[p.id]) {
          newStore.xa = { ...prev.xa, [p.id]: 1 };
          const a = alternatives(p, 'fresh')[0];
          addToast(
            'Nearing expiry',
            `${p.name}: ${el(p.exp)}.` + (a ? ` Fresher: ${a.name} (${el(a.exp)}).` : ''),
            'w',
            a ? { label: 'Swap for fresher', action: () => replaceItem(p.id, a.id) } : null
          );
        } else if (p.stock - 1 > 0 && p.stock - 1 <= 5 && how === 'scan') {
          addToast('Low stock', `Only ${p.stock - 1} left of ${p.name}`, 'w');
        }

        checkBudget(newStore);
        try {
          localStorage.setItem('sm1', JSON.stringify(newStore));
        } catch (e) {}
        return newStore;
      });

      return true;
    },
    [getProduct, alternatives, addToast, checkBudget, logAudit]
  );

  const updateQuantity = useCallback(
    (id, delta) => {
      const p = getProduct(id);
      const c = store.cart[id];
      if (!p || !c) return;

      if (delta > 0) {
        addToCart(id, 'manual');
        return;
      }

      setStore(prev => {
        const current = prev.cart[id];
        if (!current) return prev;
        const newProducts = prev.P.map(x => (x.id === p.id ? { ...x, stock: x.stock + 1 } : x));
        const newCart = { ...prev.cart };

        if (current.q <= 1) {
          delete newCart[id];
          logAudit('QTY', `${p.name} removed from cart`);
        } else {
          newCart[id] = {
            q: current.q - 1,
            s: Math.min(current.s, current.q - 1)
          };
          logAudit('QTY', `${p.name} quantity reduced to ${newCart[id].q}`);
        }

        const newStore = { ...prev, P: newProducts, cart: newCart };
        checkBudget(newStore);
        try {
          localStorage.setItem('sm1', JSON.stringify(newStore));
        } catch (e) {}
        return newStore;
      });
    },
    [getProduct, store.cart, addToCart, checkBudget, logAudit]
  );

  const removeFromCart = useCallback(
    id => {
      const p = getProduct(id);
      const c = store.cart[id];
      if (!p || !c) return;

      setStore(prev => {
        const newProducts = prev.P.map(x => (x.id === p.id ? { ...x, stock: x.stock + c.q } : x));
        const newCart = { ...prev.cart };
        delete newCart[id];

        logAudit('REMOVE', `${p.name} removed from cart`);
        const newStore = { ...prev, P: newProducts, cart: newCart };
        checkBudget(newStore);
        try {
          localStorage.setItem('sm1', JSON.stringify(newStore));
        } catch (e) {}
        return newStore;
      });
    },
    [getProduct, store.cart, checkBudget, logAudit]
  );

  const replaceItem = useCallback(
    (oldId, newId) => {
      const c = store.cart[oldId];
      const pa = getProduct(oldId);
      const pb = getProduct(newId);
      if (!c || !pa || !pb) return;

      const q = c.q;
      const k = Math.min(q, pb.stock);

      setStore(prev => {
        const newProducts = prev.P.map(x => {
          if (x.id === pa.id) return { ...x, stock: x.stock + q };
          if (x.id === pb.id) return { ...x, stock: x.stock - k };
          return x;
        });

        const newCart = { ...prev.cart };
        delete newCart[oldId];
        newCart[newId] = { q: k, s: 0 };

        logAudit('REPLACE', `${pa.name} replaced by ${pb.name} ×${k} (needs scan)`);
        addToast('Item replaced', `${pb.name} added — scan it at checkout to verify.`, 'g');

        const newStore = { ...prev, P: newProducts, cart: newCart };
        checkBudget(newStore);
        try {
          localStorage.setItem('sm1', JSON.stringify(newStore));
        } catch (e) {}
        return newStore;
      });
      closeModal();
    },
    [store.cart, getProduct, addToast, checkBudget, closeModal, logAudit]
  );

  const onBarcodeFound = useCallback(
    code => {
      const q = code.trim().toLowerCase();
      const p =
        store.P.find(x => x.bc === q) ||
        store.P.find(x => x.name.toLowerCase().includes(q) || x.brand.toLowerCase() === q);

      if (!q || !p) {
        return q ? `No product matches "${code}"` : 'Enter a barcode or product name.';
      }

      if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
      if (addToCart(p.id, 'scan')) {
        addToast('Added to your smart cart!', p.name, 'g');
        setActiveModal({ type: 'scanned', product: p });
      }
      return null;
    },
    [store.P, addToCart, addToast]
  );

  const openScanner = useCallback(() => {
    setActiveModal({ type: 'scanner' });
    setTimeout(() => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return;
      const getCam = constraints => navigator.mediaDevices.getUserMedia(constraints);
      getCam({ video: { facingMode: { ideal: 'environment' } } })
        .catch(() => getCam({ video: true }))
        .then(stream => {
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.onloadedmetadata = () => videoRef.current?.play().catch(() => {});
            videoRef.current.play().catch(() => {});
          }
          if ('BarcodeDetector' in window) {
            try {
              const detector = new window.BarcodeDetector({ formats: ['ean_13', 'ean_8', 'upc_a', 'code_128'] });
              scanIntervalRef.current = setInterval(() => {
                if (videoRef.current && videoRef.current.readyState >= 2) {
                  detector
                    .detect(videoRef.current)
                    .then(barcodes => {
                      if (barcodes[0]) onBarcodeFound(barcodes[0].rawValue);
                    })
                    .catch(() => {});
                }
              }, 450);
            } catch (e) {}
          }
        })
        .catch(() => {});
    }, 100);
  }, [onBarcodeFound]);

  const issues = useMemo(
    () =>
      Object.keys(store.cart)
        .filter(id => store.cart[id].s < store.cart[id].q)
        .map(id => ({
          id: Number(id),
          name: getProduct(id)?.name || 'Product',
          miss: store.cart[id].q - store.cart[id].s
        })),
    [store.cart, getProduct]
  );

  const openFlags = useMemo(() => store.flags.filter(x => x.status === 'open'), [store.flags]);
  const lowStock = useMemo(() => store.P.filter(p => p.stock <= 5), [store.P]);
  const expiringSoon = useMemo(() => store.P.filter(p => p.exp <= 7).sort((a, b) => a.exp - b.exp), [store.P]);

  const sortedStaffProducts = useMemo(() => {
    let list = store.P.filter(
      p =>
        (adminCat === 'All' || p.cat === adminCat) &&
        (p.name + p.bc).toLowerCase().includes(adminQuery.toLowerCase())
    );
    list.sort((a, b) => (adminSort === 'name' ? a.name.localeCompare(b.name) : a[adminSort] - b[adminSort]));
    return list;
  }, [store.P, adminCat, adminQuery, adminSort]);

  const handleSimulateScenario = useCallback(() => {
    const available = store.P.filter(p => p.stock > 0 && !store.cart[p.id]);
    const p = available[0];
    if (!p) return;

    setStore(prev => {
      const newProducts = prev.P.map(x => (x.id === p.id ? { ...x, stock: x.stock - 1 } : x));
      const newCart = { ...prev.cart, [p.id]: { q: 1, s: 0 } };
      logAudit('SIM', 'SIMULATED: bag sensor reports an item not in the scan log (' + p.name + ')');
      addToast('Cart verification required', 'Simulated scenario: ' + p.name + ' is unscanned.', 'w');
      const newStore = { ...prev, P: newProducts, cart: newCart };
      checkBudget(newStore);
      try {
        localStorage.setItem('sm1', JSON.stringify(newStore));
      } catch (e) {}
      return newStore;
    });
  }, [store.P, store.cart, addToast, checkBudget, logAudit]);

  const handleConfirmPayment = useCallback(() => {
    setIsProcessingPayment(true);
    setTimeout(() => {
      const id = 'SM-' + Date.now().toString(36).toUpperCase();
      const items = Object.keys(store.cart).map(i => ({
        name: getProduct(i)?.name || '',
        q: store.cart[i].q,
        price: getProduct(i)?.price || 0
      }));
      const receipt = {
        id,
        time: now(),
        items,
        sub: totals.sub,
        tax: totals.tax,
        total: totals.total,
        sav: totals.sav,
        method: store.pay
      };

      setStore(prev => {
        const txns = [receipt, ...prev.txns];
        logAudit('CHECKOUT', `${id} paid (simulated) ${f(totals.total)}`);
        const updated = {
          ...prev,
          last: receipt,
          txns,
          cart: {},
          xa: {},
          al: { w: 0, x: 0 }
        };
        try {
          localStorage.setItem('sm1', JSON.stringify(updated));
        } catch (e) {}
        return updated;
      });

      setIsProcessingPayment(false);
      addToast('Payment simulation successful', id, 'g');
      navigate('receipt');
    }, 1400);
  }, [store.cart, store.pay, getProduct, totals, logAudit, addToast, navigate]);

  const matchedMapProduct = useMemo(
    () => store.P.find(p => mapQuery && (p.name + p.brand).toLowerCase().includes(mapQuery.toLowerCase())),
    [store.P, mapQuery]
  );
  const matchedAisle = matchedMapProduct ? AIS[matchedMapProduct.cat] : 0;

  const budgetRatio = totals.total / store.budget;
  const budgetColor = budgetRatio > 1 ? '#b8402a' : budgetRatio >= 0.8 ? '#b9801a' : '#2c7a58';
  const circleCircumference = 2 * Math.PI * 34;

  const filteredShopProducts = useMemo(() => {
    return store.P.filter(
      p =>
        (selectedCat === 'All' || p.cat === selectedCat) &&
        (p.name + p.brand + p.bc).toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [store.P, selectedCat, searchQuery]);

  const totalBadges = openFlags.length + lowStock.length;

  return (
    <>
      <nav className={`nav ${isMenuOpen ? 'open' : ''}`} aria-label="Main">
        <a className="br" href="#home" onClick={() => navigate('home')}>
          <img src="logo.svg" alt="Logo" style={{height: '24px', width: '24px', marginRight: '6px'}} />
          Byte<i>Cart</i>
        </a>
        <button className="menu-btn" onClick={() => setIsMenuOpen(!isMenuOpen)} aria-label="Toggle menu" aria-expanded={isMenuOpen}>
          ☰
        </button>
        <div className="links">
          <a className={`l ${route === 'home' ? 'on' : ''}`} href="#home" onClick={() => { setIsMenuOpen(false); navigate('home'); }}>
            Home
          </a>
          <a className={`l ${route === 'shop' ? 'on' : ''}`} href="#shop" onClick={() => { setIsMenuOpen(false); navigate('shop'); }}>
            Shop
          </a>
          <a className={`l ${route === 'map' ? 'on' : ''}`} href="#map" onClick={() => { setIsMenuOpen(false); navigate('map'); }}>
            Store map
          </a>
          <a className={`l ${route === 'checkout' ? 'on' : ''}`} href="#checkout" onClick={() => { setIsMenuOpen(false); navigate('checkout'); }}>
            Checkout
          </a>
          <a className={`l ${route === 'staff' ? 'on' : ''}`} href="#staff" onClick={() => { setIsMenuOpen(false); navigate('staff'); }}>
            Staff {totalBadges ? <span id="nb" className="dot">{totalBadges}</span> : null}
          </a>
        </div>
        <button className="btn s" onClick={() => { setIsMenuOpen(false); openScanner(); }}>
          Scan product
        </button>
      </nav>

      <main id="app">
        {route === 'home' && (
          <>
            <section className="hero">
              <div className="hl">
                <div className="eyebrow">Mobile Scan &amp; Go · Loss prevention built in</div>
                <h1>
                  Your Cart.
                  <br />
                  <em>Your Rules.</em>
                  <br />
                  <u>Zero Queues.</u>
                </h1>
                <p>
                  Scan items as you shop, watch your total and budget live, verify your bag, and pay from your
                  phone. No lines, no surprises.
                </p>
                <div className="cta">
                  <a className="btn" href="#shop" onClick={() => navigate('shop')}>
                    Start Shopping
                  </a>
                  <button className="btn o" onClick={() => {
                     localStorage.removeItem('bytecart_onboarding_optout');
                     setActiveModal({type: 'onboarding', step: 1});
                  }}>
                    Explore How It Works
                  </button>
                </div>
              </div>

              <div className="stage" aria-hidden="true">
                <svg className="badge" viewBox="0 0 130 130">
                  <defs>
                    <path id="cp" d="M65 65m-52 0a52 52 0 1 1 104 0a52 52 0 1 1-104 0" />
                  </defs>
                  <text
                    fontFamily="Space Grotesk"
                    fontSize="12"
                    fontWeight="700"
                    letterSpacing="3"
                    fill="#A9C7E8"
                  >
                    <textPath href="#cp">SCAN · TRACK · PAY · GO · SCAN · TRACK · PAY · GO ·</textPath>
                  </text>
                </svg>

                {store.P[2] && (
                  <div className="fp" style={{ '--rt': '-12deg', left: '14%', top: '8%' }}>
                    <Pack p={store.P[2]} width={70} height={90} />
                  </div>
                )}
                {store.P[8] && (
                  <div className="fp" style={{ '--rt': '9deg', left: '34%', top: '20%', animationDelay: '-2s' }}>
                    <Pack p={store.P[8]} width={64} height={82} />
                  </div>
                )}
                {store.P[13] && (
                  <div className="fp" style={{ '--rt': '-5deg', left: '4%', top: '38%', animationDelay: '-3s' }}>
                    <Pack p={store.P[13]} width={50} height={64} />
                  </div>
                )}

                <svg className="bag" viewBox="0 0 300 360">
                  <path d="M95 92c0-62 110-62 110 0" fill="none" stroke="#F2E9D8" strokeWidth="8" />
                  <path d="M40 90h220l26 252H14z" fill="#F2E9D8" />
                  <path d="M40 90h220l7 64H33z" fill="#e2d3b4" />
                  <text
                    x="150"
                    y="215"
                    textAnchor="middle"
                    fontFamily="Space Grotesk"
                    fontWeight="700"
                    fontSize="40"
                    fill="#101D36"
                    letterSpacing="-2"
                  >
                    Byte
                  </text>
                  <text
                    x="150"
                    y="250"
                    textAnchor="middle"
                    fontFamily="Space Grotesk"
                    fontSize="22"
                    fill="#172B4D"
                    letterSpacing="8"
                  >
                    CART
                  </text>
                  <path d="M60 290h180" stroke="#101D36" strokeDasharray="3 5" />
                </svg>

                <div className="phone">
                  <div className="ph">LIVE CART · 3</div>
                  {[2, 8, 13].map(i => {
                    const p = store.P[i];
                    return p ? (
                      <div className="row" key={p.id}>
                        <Pack p={p} width={24} height={32} />
                        <span style={{ flex: 1 }}>{p.name}</span>
                        <b>{f(p.price)}</b>
                      </div>
                    ) : null;
                  })}
                  <div className="row">
                    <span style={{ flex: 1 }}>Budget used</span>
                    <b>62%</b>
                  </div>
                  <div
                    style={{
                      background: 'var(--n)',
                      color: 'var(--c)',
                      padding: '8px',
                      marginTop: '10px',
                      textAlign: 'center',
                      font: "700 12px 'Space Grotesk'"
                    }}
                  >
                    PAY {f(375)}
                  </div>
                  <i className="scanln"></i>
                </div>
                <div className="tag" style={{ right: '6%', bottom: '12%' }}>
                  SAVE ₹45
                </div>
              </div>
            </section>

            {/* Quick Actions (Compact) */}
            <section className="sec quick-actions" style={{ padding: '2vh 24px', background: 'var(--b)' }}>
               <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                 <button className="btn" onClick={openScanner}>Scan Product</button>
                 <button className="btn o" onClick={() => navigate('shop')} style={{borderColor: 'var(--n)'}}>Browse Products</button>
                 <button className="btn o" onClick={() => navigate('map')} style={{borderColor: 'var(--n)'}}>View Store Map</button>
                 <button className="btn o" onClick={() => navigate('checkout')} style={{borderColor: 'var(--n)'}}>Open Cart</button>
               </div>
               {totals.n > 0 && (
                   <div style={{ marginTop: '16px', textAlign: 'center', fontWeight: 'bold' }}>
                       Cart Summary: {totals.n} items | Total: {f(totals.total)}
                   </div>
               )}
            </section>

            <section className="sec" id="how">
              <div className="eyebrow">How it works</div>
              <h2>Four moves. No queue.</h2>
              <div className="steps" style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '20px', borderTop: 'none' }}>
                  <div style={{ padding: '12px', border: '1px solid var(--ln)', borderRadius: '4px' }}>
                    <b style={{ fontSize: '1.5rem', display: 'inline', marginRight: '8px' }}>01</b>
                    <h3 style={{ display: 'inline', fontSize: '1.2rem' }}>Scan</h3>
                    <p style={{ margin: '8px 0 0 0', fontSize: '14px' }}>Point your phone at a barcode. Product, price, stock and expiry appear instantly.</p>
                  </div>
                  <div style={{ padding: '12px', border: '1px solid var(--ln)', borderRadius: '4px' }}>
                    <b style={{ fontSize: '1.5rem', display: 'inline', marginRight: '8px' }}>02</b>
                    <h3 style={{ display: 'inline', fontSize: '1.2rem' }}>Track</h3>
                    <p style={{ margin: '8px 0 0 0', fontSize: '14px' }}>A live receipt and budget ring update with every item you add or swap.</p>
                  </div>
                  <div style={{ padding: '12px', border: '1px solid var(--ln)', borderRadius: '4px' }}>
                    <b style={{ fontSize: '1.5rem', display: 'inline', marginRight: '8px' }}>03</b>
                    <h3 style={{ display: 'inline', fontSize: '1.2rem' }}>Pay</h3>
                    <p style={{ margin: '8px 0 0 0', fontSize: '14px' }}>Verify your bag, then confirm with UPI or card (simulated in this prototype).</p>
                  </div>
                  <div style={{ padding: '12px', border: '1px solid var(--ln)', borderRadius: '4px' }}>
                    <b style={{ fontSize: '1.5rem', display: 'inline', marginRight: '8px' }}>04</b>
                    <h3 style={{ display: 'inline', fontSize: '1.2rem' }}>Go</h3>
                    <p style={{ margin: '8px 0 0 0', fontSize: '14px' }}>Take your digital receipt and walk out. Staff only review flagged baskets.</p>
                  </div>
              </div>
            </section>

            <section className="sec feat">
              <div className="eyebrow">Inside the app</div>
              <h2>Built for shoppers and for store loss prevention.</h2>
              <div className="fl" style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '20px' }}>
                {[
                  ['Smart recommendations', 'Cheaper like-for-like swaps with transparent savings math.'],
                  ['Budget tracking', 'A live ring, early warnings, and a clear over-budget prompt.'],
                  ['Expiry awareness', 'Short shelf-life items get flagged with fresher options.'],
                  ['Inventory availability', 'In, low and out of stock, plus restock alerts.'],
                  ['Secure checkout', 'Reconciliation of scans vs cart before pay. No card data is collected.'],
                  ['Staff verification', 'Flag queue and audit trail for every scan and quantity change.']
                ].map((x, i) => (
                  <div key={i} style={{ border: '1px solid var(--ln)', padding: '12px', borderRadius: '4px', display: 'block', transform: 'none' }}>
                    <i style={{ marginRight: '8px', display: 'inline' }}>0{i + 1}</i>
                    <h3 style={{ display: 'inline', fontSize: '1.1rem' }}>{x[0]}</h3>
                    <p className="sm" style={{ margin: '4px 0 0 0', fontSize: '14px' }}>{x[1]}</p>
                  </div>
                ))}
              </div>
            </section>

            <footer>
              <div>
                <div className="d">ByteCart</div>
                <p style={{ marginTop: '12px', maxWidth: '420px' }}>
                  Hackathon prototype for “Mobile Scan &amp; Go Checkout Anywhere + Loss Prevention”. Frontend only:
                  stock, expiry, payments and verification are simulated demo data. No computer vision or payment
                  gateway is connected.
                </p>
              </div>
              <ul>
                <li className="eyebrow">Explore</li>
                <li>
                  <a href="#shop" onClick={() => navigate('shop')}>
                    Shop
                  </a>
                </li>
                <li>
                  <a href="#map" onClick={() => navigate('map')}>
                    Store map
                  </a>
                </li>
                <li>
                  <a href="#staff" onClick={() => navigate('staff')}>
                    Staff
                  </a>
                </li>
              </ul>
              <ul>
                <li className="eyebrow">Integration points</li>
                <li>Barcode: BarcodeDetector API</li>
                <li>Payments: demo UI</li>
                <li>Backend: localStorage</li>
              </ul>
            </footer>
          </>
        )}

        {route === 'shop' && (
          <div className="wrap">
            <div className="eyebrow">Aisle by aisle</div>
            <h1 className="ttl">The shelf, in your pocket.</h1>
            <div className="shop">
              <div>
                <input
                  type="text"
                  placeholder="Search products, brands or barcodes"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  aria-label="Search products"
                />
                <div className="chips">
                  {['All', ...CATS].map(c => (
                    <button
                      key={c}
                      className={`chip ${c === selectedCat ? 'on' : ''}`}
                      onClick={() => setSelectedCat(c)}
                    >
                      {c}
                    </button>
                  ))}
                </div>
                <p className="sm">
                  Stock and expiry are simulated demo data. “Add” enters an item without scanning, which loss
                  prevention will flag.
                </p>

                <div id="cl">
                  {filteredShopProducts.length ? (
                    filteredShopProducts.map(p => {
                      const [s, k] = sc(p);
                      return (
                        <div className="pr" key={p.id}>
                          <Pack p={p} />
                          <div>
                            <b>{p.name}</b>
                            <div className="sm">
                              {p.brand} · Aisle A{AIS[p.cat]} · {p.bc}
                            </div>
                            <span className={`st ${k}`}>{s}</span>
                            <span className={`st ${ec(p.exp)}`}>{el(p.exp)}</span>
                          </div>
                          <div>
                            <div className="price">
                              {f(p.price)}
                              {p.mrp > p.price && <s>{f(p.mrp)}</s>}
                            </div>
                            {p.stock > 0 ? (
                              <button className="btn s" onClick={() => addToCart(p.id, 'manual')}>
                                Add
                              </button>
                            ) : (
                              <button
                                className="btn s o"
                                onClick={() => {
                                  if (!store.notify.includes(p.id)) {
                                    saveStore({
                                      ...store,
                                      notify: [...store.notify, p.id]
                                    });
                                    logAudit('NOTIFY', p.name + ' restock alert enabled');
                                    addToast('Restock notification enabled', p.name, 'g');
                                  }
                                }}
                              >
                                {store.notify.includes(p.id) ? 'Notify on ✓' : 'Notify me'}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="empty">No products match.</div>
                  )}
                </div>
              </div>

              <div className="panel">
                <div className="rcpt">
                  <div className="d" style={{ fontSize: '28px', marginBottom: '8px' }}>
                    Smart cart · {totals.n}
                  </div>

                  <div className="ring">
                    <svg
                      width="86"
                      height="86"
                      viewBox="0 0 80 80"
                      role="img"
                      aria-label={`Budget used ${Math.round(budgetRatio * 100)}%`}
                    >
                      <circle cx="40" cy="40" r="34" fill="none" stroke="#e6dfce" strokeWidth="8" />
                      <circle
                        cx="40"
                        cy="40"
                        r="34"
                        fill="none"
                        stroke={budgetColor}
                        strokeWidth="8"
                        strokeDasharray={`${Math.min(budgetRatio, 1) * circleCircumference} ${circleCircumference}`}
                        transform="rotate(-90 40 40)"
                      />
                      <text
                        x="40"
                        y="45"
                        textAnchor="middle"
                        fontFamily="Space Grotesk"
                        fontWeight="700"
                        fontSize="15"
                      >
                        {Math.round(budgetRatio * 100)}%
                      </text>
                    </svg>
                    <div>
                      <div className="sm">BUDGET</div>
                      <b style={{ fontSize: '24px' }}>
                        {totals.total > store.budget
                          ? '-' + f(totals.total - store.budget)
                          : f(store.budget - totals.total)}
                      </b>
                      <div className="sm">
                        {totals.total > store.budget ? 'over' : 'left'} of {f(store.budget)}{' '}
                        <button className="lnk" onClick={() => setActiveModal({ type: 'budget' })}>
                          change
                        </button>
                      </div>
                    </div>
                  </div>

                  {Object.keys(store.cart).length ? (
                    Object.keys(store.cart).map(id => {
                      const p = getProduct(id);
                      const c = store.cart[id];
                      if (!p) return null;
                      return (
                        <div className="ci" key={id}>
                          <Pack p={p} width={32} height={42} />
                          <div>
                            <b>{p.name}</b>
                            <div className="qt">
                              <button onClick={() => updateQuantity(id, -1)} aria-label="Decrease">
                                −
                              </button>
                              <span>{c.q}</span>
                              <button onClick={() => updateQuantity(id, 1)} aria-label="Increase">
                                +
                              </button>
                            </div>
                            <button className="lnk sm" onClick={() => removeFromCart(id)}>
                              remove
                            </button>
                            <div className="sm" style={{ color: c.s < c.q ? 'var(--a)' : 'var(--g)' }}>
                              {c.s < c.q ? `${c.q - c.s} unscanned` : 'scan verified'}
                            </div>
                          </div>
                          <b>{f(p.price * c.q)}</b>
                        </div>
                      );
                    })
                  ) : (
                    <div className="empty">Your cart is empty. Scan or add a product.</div>
                  )}

                  <div className="tl">
                    <span>Subtotal</span>
                    <span>{f(totals.sub)}</span>
                  </div>
                  <div className="tl" style={{ color: 'var(--g)' }}>
                    <span>You save vs MRP</span>
                    <span>{f(totals.sav)}</span>
                  </div>
                  <div className="tl">
                    <span>GST (demo 5%)</span>
                    <span>{f(totals.tax)}</span>
                  </div>
                  <div className="tl big">
                    <span>Total</span>
                    <span>{f(totals.total)}</span>
                  </div>

                  <a
                    className="btn"
                    style={{ display: 'block', textAlign: 'center', marginTop: '12px' }}
                    href="#checkout"
                    onClick={() => navigate('checkout')}
                  >
                    Scan &amp; Go checkout
                  </a>
                </div>

                {recommendations.length > 0 && (
                  <>
                    <div className="sm">RECOMMENDATIONS · rule-based demo engine, not an AI model</div>
                    {recommendations.slice(0, 3).map(x => (
                      <div className="rec" key={`${x.p.id}-${x.a.id}`}>
                        <b>
                          Save {f(x.save)} with {x.a.name}
                        </b>
                        <div className="sm">
                          Same category ({x.p.cat}), {f(x.u)} cheaper per unit,{' '}
                          {Math.round((1 - x.a.price / x.a.mrp) * 100)}% off MRP. Was {f(x.p.price)}, now {f(x.a.price)}.
                        </div>
                        <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                          <button className="btn s" onClick={() => replaceItem(x.p.id, x.a.id)}>
                            Replace item
                          </button>
                          <button
                            className="btn s o"
                            onClick={() => setActiveModal({ type: 'compare', p1: x.p, p2: x.a })}
                          >
                            Compare products
                          </button>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
            <button className="btn fab" onClick={openScanner}>
              Scan product
            </button>
          </div>
        )}

        {route === 'map' && (
          <div className="wrap">
            <div className="eyebrow">Find it fast</div>
            <h1 className="ttl">Store map</h1>
            <input
              ref={mapInputRef}
              type="text"
              placeholder="Search a product to highlight its aisle"
              value={mapQuery}
              onChange={e => setMapQuery(e.target.value)}
              aria-label="Search product on map"
            />
            <p id="dir" style={{ margin: '10px 0' }}>
              {matchedMapProduct
                ? `${matchedMapProduct.name}: Aisle A${matchedAisle} (${matchedMapProduct.cat}), shelf ${
                    (matchedMapProduct.id % 4) + 1
                  }. From the entrance, walk along the main aisle to A${matchedAisle}, then turn up. Checkout is at the bottom right.`
                : mapQuery
                ? 'No product found. Try “milk”, “atta” or “chips”.'
                : 'Type a product to get directions.'}
            </p>

            <svg className="map" viewBox="0 0 640 400" role="img" aria-label="Supermarket floor plan">
              <rect x="8" y="8" width="624" height="384" fill="none" stroke="#101D36" strokeWidth="2" />
              {CATS.map((c, i) => (
                <g key={c}>
                  <rect
                    className={`ai ${matchedAisle === i + 1 ? 'hl2' : ''}`}
                    x={88 + i * 84}
                    y={50}
                    width={40}
                    height={230}
                  />
                  <text
                    x={108 + i * 84}
                    y={40}
                    textAnchor="middle"
                    fontSize="12"
                    fontWeight="700"
                    fontFamily="Space Grotesk"
                  >
                    A{i + 1}
                  </text>
                  <text transform={`translate(${112 + i * 84} 270) rotate(-90)`} fontSize="11">
                    {c}
                  </text>
                </g>
              ))}

              <rect x="8" y="310" width="60" height="82" fill="#A9C7E8" stroke="#101D36" />
              <text x="38" y="355" textAnchor="middle" fontSize="11" fontWeight="700">
                ENTRY
              </text>
              {[0, 1, 2].map(i => (
                <g key={i}>
                  <rect x={440 + i * 62} y={330} width={50} height={40} fill="#101D36" />
                  <text x={465 + i * 62} y={355} textAnchor="middle" fontSize="10" fill="#FAF7F0">
                    CO {i + 1}
                  </text>
                </g>
              ))}
              <text x="440" y="320" fontSize="11">
                Checkout / Scan &amp; Go exit
              </text>
              <rect x="590" y="50" width="34" height="230" fill="#F2E9D8" stroke="#101D36" />
              <text transform="translate(612 220) rotate(-90)" fontSize="11">
                Chilled wall
              </text>
              {matchedAisle > 0 && (
                <path
                  d={`M40 340H${108 + (matchedAisle - 1) * 84}V290`}
                  fill="none"
                  stroke="#b8402a"
                  strokeWidth="3"
                  strokeDasharray="7 6"
                />
              )}
              <g fontSize="11">
                <rect x="20" y="20" width="10" height="10" className="ai" />
                <text x="36" y="29">
                  Aisle
                </text>
                <rect x="20" y="36" width="10" height="10" fill="#A9C7E8" stroke="#101D36" />
                <text x="36" y="45">
                  Entrance
                </text>
              </g>
            </svg>
          </div>
        )}

        {route === 'checkout' && (
          <div className="wrap">
            <div className="eyebrow">Scan &amp; Go</div>
            <h1 className="ttl">Checkout</h1>
            {!totals.n ? (
              <div className="empty">
                Your cart is empty.{' '}
                <a href="#shop" onClick={() => navigate('shop')}>
                  Go shopping
                </a>
              </div>
            ) : (
              <div className="shop">
                <div>
                  <div className="card2">
                    <h3 style={{ fontSize: '26px', marginBottom: '8px' }}>1 · Cart verification</h3>
                    {issues.length === 0 ? (
                      <p style={{ color: 'var(--g)' }}>
                        <b>All {totals.n} items reconciled.</b> Scan log matches the cart.
                      </p>
                    ) : (
                      <>
                        <p style={{ color: 'var(--a)' }}>
                          <b>Verification required.</b> {issues.length} item(s) were added without a scan.
                        </p>
                        {issues.map(item => (
                          <div className="tl" key={item.id}>
                            <span>
                              {item.name} ×{item.miss} unscanned
                            </span>
                            <button
                              className="btn s"
                              onClick={() => {
                                setStore(prev => {
                                  const updatedCart = {
                                    ...prev.cart,
                                    [item.id]: {
                                      ...prev.cart[item.id],
                                      s: prev.cart[item.id].q
                                    }
                                  };
                                  logAudit('VERIFY', item.name + ' re-scanned (simulated)');
                                  const newStore = { ...prev, cart: updatedCart };
                                  try {
                                    localStorage.setItem('sm1', JSON.stringify(newStore));
                                  } catch (e) {}
                                  return newStore;
                                });
                              }}
                            >
                              Simulate re-scan
                            </button>
                          </div>
                        ))}
                        {openFlags.length > 0 ? (
                          <p className="sm">Staff review {openFlags[0].id} requested. Waiting in the Staff queue.</p>
                        ) : store.flags.find(x => x.status === 'rejected' && issues.length) ? (
                          <p className="sm" style={{ color: 'var(--r)' }}>
                            Staff rejected the last review. Please re-scan the items.
                          </p>
                        ) : (
                          <button
                            className="btn o s"
                            onClick={() => {
                              const flId = 'F' + store.n;
                              setStore(prev => {
                                const newFlag = {
                                  id: flId,
                                  time: now(),
                                  total: totals.total,
                                  items: issues,
                                  status: 'open'
                                };
                                logAudit('FLAG', 'Checkout flagged for staff review');
                                addToast(
                                  'Cart verification required',
                                  'Staff review requested. Check the Staff tab to approve (demo).',
                                  'w'
                                );
                                const newStore = {
                                  ...prev,
                                  n: prev.n + 1,
                                  flags: [newFlag, ...prev.flags]
                                };
                                try {
                                  localStorage.setItem('sm1', JSON.stringify(newStore));
                                } catch (e) {}
                                return newStore;
                              });
                            }}
                          >
                            Request staff review
                          </button>
                        )}
                      </>
                    )}
                    <p className="sm" style={{ marginTop: '10px' }}>
                      Simulated verification. No camera or weight sensor is connected.{' '}
                      <button className="lnk" onClick={handleSimulateScenario}>
                        Run demo scenario: unlisted item in bag
                      </button>
                    </p>
                  </div>

                  <div className="card2">
                    <h3 style={{ fontSize: '26px', marginBottom: '8px' }}>2 · Payment (demo UI)</h3>
                    <div className="chips">
                      {['UPI', 'Card', 'Net banking', 'Wallet'].map(m => (
                        <button
                          key={m}
                          className={`chip ${store.pay === m ? 'on' : ''}`}
                          onClick={() => saveStore({ ...store, pay: m })}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                    <p className="sm">No payment details are collected. Confirming only simulates a successful payment.</p>
                  </div>
                </div>

                <div className="panel">
                  <div className="rcpt">
                    <div className="d" style={{ fontSize: '26px', marginBottom: '8px' }}>
                      Order summary
                    </div>
                    {Object.keys(store.cart).map(id => {
                      const p = getProduct(id);
                      if (!p) return null;
                      return (
                        <div className="tl" key={id}>
                          <span>
                            {p.name} ×{store.cart[id].q}
                          </span>
                          <span>{f(p.price * store.cart[id].q)}</span>
                        </div>
                      );
                    })}
                    <div className="tl">
                      <span>Items</span>
                      <span>{totals.n}</span>
                    </div>
                    <div className="tl" style={{ color: 'var(--g)' }}>
                      <span>Savings</span>
                      <span>{f(totals.sav)}</span>
                    </div>
                    <div className="tl">
                      <span>GST</span>
                      <span>{f(totals.tax)}</span>
                    </div>
                    <div className="tl">
                      <span>Method</span>
                      <span>{store.pay}</span>
                    </div>
                    <div className="tl big">
                      <span>Pay</span>
                      <span>{f(totals.total)}</span>
                    </div>
                    <button
                      className="btn"
                      style={{ width: '100%', marginTop: '12px' }}
                      disabled={issues.length > 0 || totals.n === 0 || isProcessingPayment}
                      onClick={handleConfirmPayment}
                    >
                      {isProcessingPayment
                        ? 'Simulating payment…'
                        : issues.length === 0
                        ? 'Confirm payment (simulated)'
                        : 'Resolve verification first'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {route === 'receipt' && (
          <div className="wrap">
            {store.last ? (
              <>
                <div style={{ textAlign: 'center' }}>
                  <svg className="ck" viewBox="0 0 80 80">
                    <circle cx="40" cy="40" r="36" fill="#A9C7E8" stroke="#101D36" strokeWidth="2" />
                    <path d="M24 41l11 11 21-24" fill="none" stroke="#101D36" strokeWidth="5" />
                  </svg>
                  <h1 className="ttl">You're good to go.</h1>
                </div>
                <div className="rc">
                  <div className="d" style={{ fontSize: '24px' }}>
                    ByteCart
                  </div>
                  <p className="sm">
                    DEMO RECEIPT · {store.last.id} · {store.last.time}
                    <br />
                    Simulated payment via {store.last.method}. No real transaction.
                  </p>
                  {store.last.items.map((item, idx) => (
                    <div className="tl" key={idx}>
                      <span>
                        {item.name} ×{item.q}
                      </span>
                      <span>{f(item.price * item.q)}</span>
                    </div>
                  ))}
                  <div className="tl">
                    <span>Subtotal</span>
                    <span>{f(store.last.sub)}</span>
                  </div>
                  <div className="tl">
                    <span>GST</span>
                    <span>{f(store.last.tax)}</span>
                  </div>
                  <div className="tl" style={{ color: 'var(--g)' }}>
                    <span>Savings</span>
                    <span>{f(store.last.sav)}</span>
                  </div>
                  <div className="tl big">
                    <span>Total</span>
                    <span>{f(store.last.total)}</span>
                  </div>
                  <p className="sm">Cart verification: passed</p>
                </div>
                <p style={{ textAlign: 'center', marginTop: '16px' }}>
                  <button className="btn" onClick={() => navigate('shop')}>
                    New basket
                  </button>
                </p>
              </>
            ) : (
              <div className="empty">No receipt yet.</div>
            )}
          </div>
        )}

        {route === 'staff' && !staffAuthed && (
          <div className="wrap" style={{ maxWidth: '500px', margin: '50px auto', padding: '0 16px' }}>
            <div
              className="card2"
              style={{
                padding: '32px 28px',
                background: 'var(--c)',
                border: '1px solid var(--n)',
                boxShadow: '6px 6px 0 var(--s)'
              }}
            >
              <div className="eyebrow" style={{ color: 'var(--a)', marginBottom: '8px' }}>
                STAFF ACCESS
              </div>
              <h1 className="ttl" style={{ fontSize: '30px', margin: '0 0 10px' }}>
                Authenticate yourself as staff
              </h1>
              <p className="sm" style={{ marginBottom: '20px', lineHeight: 1.5 }}>
                Please enter your Staff ID and password to access the staff console.
              </p>

              <form
                onSubmit={e => {
                  e.preventDefault();
                  const sid = staffIdInput.trim();
                  const spw = staffPwInput.trim();
                  const validPasswords = ['admin', 'staff', 'staff123', '1234', 'password', 'bytecart'];
                  if (sid.length >= 2 && (validPasswords.includes(spw.toLowerCase()) || spw === sid)) {
                    setStaffAuthed(sid);
                    sessionStorage.setItem('bytecart_staff_auth', sid);
                    addToast('Authenticated', 'Welcome to Staff Console, ' + sid + '!', 'g');
                    setStaffAuthError('');
                  } else {
                    setStaffAuthError('Invalid credentials. Use demo ID: admin & password: admin');
                  }
                }}
                style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}
              >
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '12px',
                      fontWeight: 700,
                      letterSpacing: '1px',
                      textTransform: 'uppercase',
                      marginBottom: '6px'
                    }}
                    htmlFor="st-id"
                  >
                    Staff ID
                  </label>
                  <input
                    type="text"
                    id="st-id"
                    value={staffIdInput}
                    onChange={e => setStaffIdInput(e.target.value)}
                    placeholder="e.g. STF-101 or admin"
                    required
                    style={{ width: '100%' }}
                    autoComplete="username"
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '12px',
                      fontWeight: 700,
                      letterSpacing: '1px',
                      textTransform: 'uppercase',
                      marginBottom: '6px'
                    }}
                    htmlFor="st-pw"
                  >
                    Password
                  </label>
                  <input
                    type="password"
                    id="st-pw"
                    value={staffPwInput}
                    onChange={e => setStaffPwInput(e.target.value)}
                    placeholder="Enter password"
                    required
                    style={{ width: '100%' }}
                    autoComplete="current-password"
                  />
                </div>
                {staffAuthError && (
                  <p className="sm" role="alert" style={{ color: 'var(--r)', margin: 0, minHeight: '18px' }}>
                    {staffAuthError}
                  </p>
                )}
                <button className="btn" style={{ width: '100%', marginTop: '4px' }}>
                  Authenticate
                </button>
                <div
                  className="sm"
                  style={{
                    background: 'var(--s)',
                    padding: '10px 12px',
                    border: '1px solid var(--n)',
                    marginTop: '6px',
                    fontSize: '12px'
                  }}
                >
                  <b>Demo Login:</b> Staff ID: <code>admin</code> or <code>staff101</code> &middot; Password:{' '}
                  <code>admin</code> or <code>staff123</code>
                </div>
              </form>
            </div>
          </div>
        )}

        {route === 'staff' && staffAuthed && (
          <div className="adm">
            <aside className="side">
              <div className="d">
                STAFF
                <br />
                CONSOLE
              </div>
              <p style={{ marginTop: '8px' }}>
                Logged in as <b>{staffAuthed}</b>
              </p>
              <button
                className="btn s o"
                onClick={() => {
                  setStaffAuthed('');
                  sessionStorage.removeItem('bytecart_staff_auth');
                  addToast('Logged out', 'Staff session locked.', 'w');
                }}
                style={{ width: '100%', margin: '10px 0 14px' }}
              >
                Lock / Log out
              </button>
              <button
                className="btn sky s"
                onClick={() => {
                  const reset = freshState();
                  saveStore(reset);
                  addToast('Demo data reset', 'Fresh catalog and empty cart.', 'g');
                }}
              >
                Reset demo data
              </button>
            </aside>

            <div className="main">
              <div className="kp">
                <div>
                  <b className={lowStock.length ? 'no' : ''}>{lowStock.length}</b>
                  Low / out of stock
                </div>
                <div>
                  <b className={expiringSoon.length ? 'lo' : ''}>{expiringSoon.length}</b>
                  Expiring ≤ 7d
                </div>
                <div>
                  <b className={openFlags.length ? 'no' : ''}>{openFlags.length}</b>
                  Open flags
                </div>
                <div>
                  <b>{store.P.reduce((sum, p) => sum + p.stock, 0)}</b>
                  Units in stock
                </div>
              </div>

              <div className="tabs" role="tablist">
                {[
                  ['inv', 'Products'],
                  ['al', 'Alerts'],
                  ['ver', 'Verification'],
                  ['aud', 'Audit'],
                  ['sal', 'Sales']
                ].map(t => (
                  <button
                    key={t[0]}
                    role="tab"
                    className={staffTab === t[0] ? 'on' : ''}
                    onClick={() => setStaffTab(t[0])}
                  >
                    {t[1]}
                    {t[0] === 'ver' && openFlags.length > 0 && <span className="dot">{openFlags.length}</span>}
                    {t[0] === 'al' && lowStock.length > 0 && <span className="dot">{lowStock.length}</span>}
                  </button>
                ))}
              </div>

              {staffTab === 'inv' && (
                <>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
                    <input
                      type="text"
                      placeholder="Search name or barcode"
                      value={adminQuery}
                      onChange={e => setAdminQuery(e.target.value)}
                      style={{ maxWidth: '260px' }}
                      aria-label="Search inventory"
                    />
                    <select
                      value={adminCat}
                      onChange={e => setAdminCat(e.target.value)}
                      style={{ maxWidth: '160px' }}
                      aria-label="Category"
                    >
                      {['All', ...CATS].map(c => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div style={{ overflow: 'auto' }}>
                    {sortedStaffProducts.length ? (
                      <table>
                        <thead>
                          <tr>
                            {[
                              ['name', 'Product'],
                              ['cat', 'Category'],
                              ['bc', 'Barcode'],
                              ['price', 'Price'],
                              ['stock', 'Stock'],
                              ['exp', 'Expiry d']
                            ].map(h => (
                              <th key={h[0]} onClick={() => setAdminSort(h[0])}>
                                {h[1]}
                              </th>
                            ))}
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sortedStaffProducts.map(p => (
                            <tr key={p.id}>
                              <td>{p.name}</td>
                              <td>{p.cat}</td>
                              <td>{p.bc}</td>
                              <td>
                                <input
                                  type="number"
                                  min="1"
                                  value={p.price}
                                  onChange={e => {
                                    const val = Math.max(1, Number(e.target.value) || 1);
                                    setStore(prev => ({
                                      ...prev,
                                      P: prev.P.map(x => (x.id === p.id ? { ...x, price: val } : x))
                                    }));
                                  }}
                                  aria-label="Price"
                                />
                              </td>
                              <td>
                                <input
                                  type="number"
                                  min="0"
                                  value={p.stock}
                                  onChange={e => {
                                    const val = Math.max(0, Number(e.target.value) || 0);
                                    setStore(prev => ({
                                      ...prev,
                                      P: prev.P.map(x => (x.id === p.id ? { ...x, stock: val } : x))
                                    }));
                                  }}
                                  aria-label="Stock"
                                />
                              </td>
                              <td>
                                <input
                                  type="number"
                                  min="0"
                                  value={p.exp}
                                  onChange={e => {
                                    const val = Math.max(0, Number(e.target.value) || 0);
                                    setStore(prev => ({
                                      ...prev,
                                      P: prev.P.map(x => (x.id === p.id ? { ...x, exp: val } : x))
                                    }));
                                  }}
                                  aria-label="Expiry days"
                                />
                              </td>
                              <td className={sc(p)[1]}>{sc(p)[0]}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className="empty">No products match these filters.</div>
                    )}
                  </div>

                  <form
                    style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '16px' }}
                    onSubmit={e => {
                      e.preventDefault();
                      const form = e.target;
                      const name = form.n.value.trim();
                      const price = Math.max(1, Number(form.p.value) || 1);
                      const stock = Math.max(0, Number(form.s.value) || 0);
                      const cat = form.c.value;
                      if (!name) return;

                      setStore(prev => {
                        const newId = Math.max(0, ...prev.P.map(x => x.id)) + 1;
                        const newProd = {
                          id: newId,
                          name,
                          brand: 'Store',
                          cat,
                          price,
                          mrp: price,
                          stock,
                          exp: 30,
                          col: '#F2E9D8',
                          bc: '8901000' + String(newId).padStart(6, '0')
                        };
                        logAudit('ADMIN', 'Product added: ' + name);
                        const newStore = { ...prev, P: [...prev.P, newProd] };
                        try {
                          localStorage.setItem('sm1', JSON.stringify(newStore));
                        } catch (err) {}
                        return newStore;
                      });
                      form.reset();
                    }}
                  >
                    <input type="text" name="n" placeholder="New product name" style={{ maxWidth: '220px' }} required />
                    <input type="number" name="p" placeholder="Price" min="1" required style={{ maxWidth: '90px' }} />
                    <input type="number" name="s" placeholder="Stock" min="0" required style={{ maxWidth: '90px' }} />
                    <select name="c" style={{ maxWidth: '140px' }}>
                      {CATS.map(c => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                    <button className="btn s">Add product</button>
                  </form>
                </>
              )}

              {staffTab === 'al' && (
                <>
                  <h3 style={{ fontSize: '26px', marginBottom: '8px' }}>Restock alerts</h3>
                  {lowStock.length ? (
                    lowStock.map(p => (
                      <div className="tl" key={p.id}>
                        <span className={p.stock ? 'lo' : 'no'}>
                          <b>{p.name}</b> · {p.stock} left{store.notify.includes(p.id) ? ' · shopper waiting' : ''}
                        </span>
                        <button
                          className="btn s"
                          onClick={() => {
                            setStore(prev => {
                              const updated = prev.P.map(x => (x.id === p.id ? { ...x, stock: x.stock + 20 } : x));
                              const filteredNotify = prev.notify.filter(x => x !== p.id);
                              logAudit('RESTOCK', p.name + ' +20');
                              if (prev.notify.includes(p.id)) {
                                addToast('Back in stock', p.name + ' — shoppers notified (demo).', 'g');
                              }
                              const newStore = { ...prev, P: updated, notify: filteredNotify };
                              try {
                                localStorage.setItem('sm1', JSON.stringify(newStore));
                              } catch (err) {}
                              return newStore;
                            });
                          }}
                        >
                          Restock +20
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="empty">Nothing is running low.</div>
                  )}

                  <h3 style={{ fontSize: '26px', margin: '22px 0 8px' }}>Expiry monitor (≤ 7 days)</h3>
                  {expiringSoon.length ? (
                    expiringSoon.map(p => (
                      <div className="tl" key={p.id}>
                        <span className={ec(p.exp)}>
                          <b>{p.name}</b> · {el(p.exp)} · {p.stock} units
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="empty">No items near expiry.</div>
                  )}
                </>
              )}

              {staffTab === 'ver' && (
                <>
                  <h3 style={{ fontSize: '26px', marginBottom: '8px' }}>Flagged checkouts</h3>
                  {store.flags.length ? (
                    store.flags.map(x => (
                      <div className="card2" key={x.id}>
                        <b>{x.id}</b> · {x.time} · {f(x.total)}{' '}
                        <span className={`st ${x.status === 'open' ? 'lo' : x.status === 'cleared' ? 'ok' : 'no'}`}>
                          {x.status}
                        </span>
                        {x.sim && <span className="sm">(simulated scenario)</span>}
                        <div className="sm">
                          {x.items.map(i => `${i.name} ×${i.miss} unscanned`).join(', ')}
                        </div>
                        {x.status === 'open' && (
                          <div className="cta" style={{ margin: '8px 0 0' }}>
                            <button
                              className="btn s"
                              onClick={() => {
                                setStore(prev => {
                                  const flags = prev.flags.map(f => (f.id === x.id ? { ...f, status: 'cleared' } : f));
                                  const cart = { ...prev.cart };
                                  x.items.forEach(i => {
                                    if (cart[i.id]) cart[i.id].s = cart[i.id].q;
                                  });
                                  logAudit('STAFF', x.id + ' approved');
                                  const newStore = { ...prev, flags, cart };
                                  try {
                                    localStorage.setItem('sm1', JSON.stringify(newStore));
                                  } catch (err) {}
                                  return newStore;
                                });
                              }}
                            >
                              Approve
                            </button>
                            <button
                              className="btn s o"
                              onClick={() => {
                                setStore(prev => {
                                  const flags = prev.flags.map(f => (f.id === x.id ? { ...f, status: 'rejected' } : f));
                                  logAudit('STAFF', x.id + ' rejected');
                                  const newStore = { ...prev, flags };
                                  try {
                                    localStorage.setItem('sm1', JSON.stringify(newStore));
                                  } catch (err) {}
                                  return newStore;
                                });
                              }}
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="empty">
                      No flagged checkouts. Add an item by hand, then request staff review at checkout.
                    </div>
                  )}
                </>
              )}

              {staffTab === 'aud' && (
                <>
                  <h3 style={{ fontSize: '26px', marginBottom: '8px' }}>Audit trail</h3>
                  {store.audit.length ? (
                    <table>
                      <tbody>
                        {store.audit.map((a, i) => (
                          <tr key={i}>
                            <td>{a.t}</td>
                            <td>
                              <b>{a.k}</b>
                            </td>
                            <td>{a.m}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="empty">No events yet.</div>
                  )}
                </>
              )}

              {staffTab === 'sal' && (
                <>
                  <div className="kp">
                    <div>
                      <b>{store.txns.length}</b>Session checkouts
                    </div>
                    <div>
                      <b>{f(store.txns.reduce((a, t) => a + t.total, 0))}</b>Session revenue
                    </div>
                    <div>
                      <b>{f(91600)}</b>Sample weekly baseline
                    </div>
                  </div>

                  <h3 style={{ fontSize: '26px', marginBottom: '26px' }}>Sales by category · sample baseline</h3>
                  <div className="bar">
                    {[
                      ['Staples', 31200],
                      ['Dairy', 18400],
                      ['Beverages', 14900],
                      ['Snacks', 11200],
                      ['Produce', 9800],
                      ['Bakery', 6100]
                    ].map(c => (
                      <i key={c[0]} style={{ height: `${(c[1] / 31200) * 100}%` }} title={f(c[1])}>
                        <span>{c[0]}</span>
                      </i>
                    ))}
                  </div>

                  <h3 style={{ fontSize: '26px', margin: '44px 0 8px' }}>Recent transactions</h3>
                  {store.txns.length ? (
                    store.txns.map(t => (
                      <div className="tl" key={t.id}>
                        <span>
                          {t.id} · {t.time} · {t.method}
                        </span>
                        <b>{f(t.total)}</b>
                      </div>
                    ))
                  ) : (
                    <div className="empty">Complete a demo checkout to see it here.</div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </main>

      <div id="toasts" aria-live="polite">
        {toasts.map(t => (
          <div key={t.id} className={`toast ${t.kind}`}>
            <b>{t.title}</b>
            <span>{t.msg}</span>
            {t.action && (
              <button className="btn s" onClick={t.action.action}>
                {t.action.label}
              </button>
            )}
          </div>
        ))}
      </div>

      {activeModal && (
        <div id="modal" className="show" role="dialog" aria-modal="true" onClick={closeModal}>
          <div className="mb" onClick={e => e.stopPropagation()}>
            {activeModal.type === 'scanner' && (
              <>
                <div className="mb-hd">
                  <h3>Scan product</h3>
                  <button className="mb-x" onClick={closeModal} aria-label="Close scanner">
                    &#x2715;
                  </button>
                </div>
                <div className="cam">
                  <video ref={videoRef} autoPlay playsInline muted></video>
                  <i className="scanln"></i>
                </div>
                <p className="sm" id="cm">
                  Point at an EAN barcode, or use manual entry below:
                </p>
                <form
                  onSubmit={e => {
                    e.preventDefault();
                    const input = e.target.elements.barcode;
                    const err = onBarcodeFound(input.value);
                    if (err) {
                      const errEl = document.getElementById('scan-err');
                      if (errEl) errEl.textContent = err;
                    }
                  }}
                  style={{ display: 'flex', gap: '6px' }}
                >
                  <input
                    type="text"
                    name="barcode"
                    placeholder="Barcode or product name"
                    aria-label="Barcode or product name"
                    autoFocus
                  />
                  <button className="btn">Add</button>
                </form>
                <p className="sm" id="scan-err" role="alert" style={{ color: 'var(--r)' }}></p>
                <p className="sm">
                  Demo barcodes start 8901000…{' '}
                  <button
                    type="button"
                    className="lnk"
                    onClick={() => {
                      const avail = store.P.filter(p => p.stock > 0);
                      if (avail.length) {
                        const randomItem = avail[Math.floor(Math.random() * avail.length)];
                        onBarcodeFound(randomItem.bc);
                      }
                    }}
                  >
                    Simulate a scan
                  </button>
                </p>
              </>
            )}

            {activeModal.type === 'scanned' && activeModal.product && (
              <>
                <svg className="ck" viewBox="0 0 80 80">
                  <circle cx="40" cy="40" r="36" fill="#A9C7E8" stroke="#101D36" strokeWidth="2" />
                  <path d="M24 41l11 11 21-24" fill="none" stroke="#101D36" strokeWidth="5" />
                </svg>
                <h3>Product scanned</h3>
                <div className="pr" style={{ gridTemplateColumns: '62px 1fr auto' }}>
                  <Pack p={activeModal.product} />
                  <div>
                    <b>{activeModal.product.name}</b>
                    <div className="sm">
                      {activeModal.product.brand} · barcode {activeModal.product.bc}
                    </div>
                    <span className={`st ${sc(activeModal.product)[1]}`}>{sc(activeModal.product)[0]}</span>
                    <span className={`st ${ec(activeModal.product.exp)}`}>{el(activeModal.product.exp)}</span>
                  </div>
                  <div className="price">{f(activeModal.product.price)}</div>
                </div>
                <p>
                  In cart: <b>{store.cart[activeModal.product.id]?.q || 1}</b> ·{' '}
                  <span className="sm">Added to your smart cart!</span>
                </p>
                <div className="cta">
                  <button
                    className="btn"
                    onClick={() => {
                      addToCart(activeModal.product.id, 'scan');
                      setActiveModal({ type: 'scanned', product: getProduct(activeModal.product.id) });
                    }}
                  >
                    Scan +1 more
                  </button>
                  <button className="btn o" onClick={openScanner}>
                    Scan another
                  </button>
                  <button className="btn o" onClick={closeModal}>
                    Done
                  </button>
                </div>
              </>
            )}

            {activeModal.type === 'budget' && (
              <>
                <h3>Set budget</h3>
                <form
                  onSubmit={e => {
                    e.preventDefault();
                    const val = Number(e.target.elements.budgetVal.value);
                    if (val < 100) return;
                    saveStore({ ...store, budget: val, al: { w: 0, x: 0 } });
                    closeModal();
                  }}
                >
                  <input
                    type="number"
                    name="budgetVal"
                    min="100"
                    defaultValue={store.budget}
                    aria-label="Budget in rupees"
                    autoFocus
                  />
                  <div className="cta" style={{ marginTop: '10px' }}>
                    <button className="btn">Save budget</button>
                    <button type="button" className="btn o" onClick={closeModal}>
                      Cancel
                    </button>
                  </div>
                </form>
              </>
            )}

            {activeModal.type === 'overBudget' && (
              <>
                <h3>Over budget by {f(totals.total - store.budget)}</h3>
                <p>
                  Your cart is {f(totals.total)} against a {f(store.budget)} budget. Nothing removed.
                </p>
                {recommendations.length > 0 ? (
                  <>
                    <div className="sm">LOWER-COST ALTERNATIVES</div>
                    {recommendations.slice(0, 3).map(x => (
                      <div className="rec" key={`${x.p.id}-${x.a.id}`}>
                        <b>{x.a.name}</b> instead of {x.p.name}
                        <div className="sm">
                          Save {f(x.save)} · {f(x.a.price)} vs {f(x.p.price)}
                        </div>
                        <button className="btn s" onClick={() => replaceItem(x.p.id, x.a.id)}>
                          Replace
                        </button>
                      </div>
                    ))}
                  </>
                ) : (
                  <p className="sm">No cheaper alternatives.</p>
                )}
                <div className="cta">
                  <button
                    className="btn"
                    onClick={() => {
                      saveStore({ ...store, budget: store.budget + 500, al: { w: 0, x: 0 } });
                      closeModal();
                    }}
                  >
                    Raise budget +₹500
                  </button>
                  <button className="btn o" onClick={closeModal}>
                    Keep shopping
                  </button>
                </div>
              </>
            )}

            {activeModal.type === 'compare' && activeModal.p1 && activeModal.p2 && (
              <>
                <h3>Compare</h3>
                <table style={{ minWidth: 0 }}>
                  <thead>
                    <tr>
                      <th></th>
                      <th>{activeModal.p1.name}</th>
                      <th>{activeModal.p2.name}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Price</td>
                      <td>{f(activeModal.p1.price)}</td>
                      <td>{f(activeModal.p2.price)}</td>
                    </tr>
                    <tr>
                      <td>MRP</td>
                      <td>{f(activeModal.p1.mrp)}</td>
                      <td>{f(activeModal.p2.mrp)}</td>
                    </tr>
                    <tr>
                      <td>Expiry</td>
                      <td>{el(activeModal.p1.exp)}</td>
                      <td>{el(activeModal.p2.exp)}</td>
                    </tr>
                    <tr>
                      <td>Stock</td>
                      <td>{sc(activeModal.p1)[0]}</td>
                      <td>{sc(activeModal.p2)[0]}</td>
                    </tr>
                    <tr>
                      <td>Aisle</td>
                      <td>A{AIS[activeModal.p1.cat]}</td>
                      <td>A{AIS[activeModal.p2.cat]}</td>
                    </tr>
                  </tbody>
                </table>
                <div className="cta">
                  <button className="btn" onClick={() => replaceItem(activeModal.p1.id, activeModal.p2.id)}>
                    Replace item
                  </button>
                  <button className="btn o" onClick={closeModal}>
                    Close
                  </button>
                </div>
              </>
            )}

            {activeModal.type === 'outOfStock' && activeModal.product && (
              <>
                <h3>{activeModal.product.name} is out of stock</h3>
                <p>
                  Demo stock count: 0.
                  {alternatives(activeModal.product, 'cost')[0]
                    ? ` ${alternatives(activeModal.product, 'cost')[0].name} is in stock at ${f(
                        alternatives(activeModal.product, 'cost')[0].price
                      )}.`
                    : ''}
                </p>
                <div className="cta">
                  <button
                    className="btn"
                    onClick={() => {
                      if (!store.notify.includes(activeModal.product.id)) {
                        saveStore({ ...store, notify: [...store.notify, activeModal.product.id] });
                        logAudit('NOTIFY', activeModal.product.name + ' restock alert enabled');
                        addToast('Restock notification enabled', activeModal.product.name, 'g');
                      }
                      closeModal();
                    }}
                  >
                    {store.notify.includes(activeModal.product.id) ? 'Notification on ✓' : 'Notify me on restock'}
                  </button>
                  {alternatives(activeModal.product, 'cost')[0] && (
                    <button
                      className="btn o"
                      onClick={() => {
                        const alt = alternatives(activeModal.product, 'cost')[0];
                        closeModal();
                        addToCart(alt.id, 'manual');
                      }}
                    >
                      Add {alternatives(activeModal.product, 'cost')[0].name}
                    </button>
                  )}
                  <button className="btn o" onClick={closeModal}>
                    Close
                  </button>
                </div>
              </>
            )}
            {activeModal.type === 'onboarding' && (
              <>
                <div className="mb-hd">
                  <h3>Onboarding</h3>
                  <button className="mb-x" onClick={closeModal} aria-label="Close onboarding">
                    &#x2715;
                  </button>
                </div>
                {activeModal.step === 1 && (
                  <div>
                    <h4>1. Scan: Scan products instantly</h4>
                    <p>Point your phone at a product barcode to identify the item and view its price, stock information, and expiry details when available.</p>
                  </div>
                )}
                {activeModal.step === 2 && (
                  <div>
                    <h4>2. Track: Watch your cart and budget</h4>
                    <p>Every scanned or added item updates your cart. Keep track of your running total, available budget, and product information while shopping.</p>
                  </div>
                )}
                {activeModal.step === 3 && (
                  <div>
                    <h4>3. Pay: Review and pay</h4>
                    <p>Review your cart, verify your items, and proceed through the available checkout process. (Payment is simulated in this demo).</p>
                  </div>
                )}
                {activeModal.step === 4 && (
                  <div>
                    <h4>4. Go: You're ready to go</h4>
                    <p>Complete the checkout process, view your digital receipt when available, and follow any applicable store verification instructions.</p>
                    <label style={{display: 'flex', alignItems: 'center', gap: '8px', marginTop: '16px'}}>
                      <input type="checkbox" id="onboarding-optout" />
                      Do not show again
                    </label>
                  </div>
                )}

                <div className="cta" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
                  {activeModal.step > 1 ? (
                    <button className="btn o" onClick={() => setActiveModal({type: 'onboarding', step: activeModal.step - 1})}>Back</button>
                  ) : (
                    <button className="btn o" onClick={() => {
                        closeModal();
                    }}>Skip</button>
                  )}

                  {activeModal.step < 4 ? (
                    <button className="btn" onClick={() => setActiveModal({type: 'onboarding', step: activeModal.step + 1})}>Next</button>
                  ) : (
                    <button className="btn" onClick={() => {
                        const optout = document.getElementById('onboarding-optout')?.checked;
                        if(optout) {
                            localStorage.setItem('bytecart_onboarding_optout', 'true');
                        }
                        closeModal();
                    }}>Get Started</button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Bottom Navigation for Mobile */}
      <nav className="bottom-nav">
          <a className={`l ${route === 'home' ? 'on' : ''}`} href="#home" onClick={() => navigate('home')}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
            Home
          </a>
          <a className={`l ${route === 'shop' ? 'on' : ''}`} href="#shop" onClick={() => navigate('shop')}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
            Shop
          </a>
          <a className={`l ${route === 'map' ? 'on' : ''}`} href="#map" onClick={() => navigate('map')}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            Map
          </a>
          <a className={`l ${route === 'checkout' ? 'on' : ''}`} href="#checkout" onClick={() => navigate('checkout')}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
            Cart
          </a>
      </nav>
    </>
  );
}
