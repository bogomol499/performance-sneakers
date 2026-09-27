/* =========================================================
   Performance — логика магазина кроссовок
   Витрина, каталог с фильтрами, карточка товара, корзина,
   избранное, дроп с таймером, подбор размера, лукбук.
   ========================================================= */
(() => {
  'use strict';

  const D = window.PF_DATA;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const money = n => Math.round(n).toLocaleString('ru-RU') + ' ₽';
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const byId = id => D.PRODUCTS.find(p => p.id === id);
  const GENDER = { m: 'Мужские', w: 'Женские', u: 'Унисекс' };

  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* ничего */ } }
  };

  /* ================= УВЕДОМЛЕНИЯ И ПАНЕЛИ ================= */

  let toastT;
  function toast(msg) {
    const el = $('#toast');
    el.textContent = msg; el.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('show'), 2600);
  }

  const backdrop = $('.backdrop');
  let layer = null, lastFocus = null;
  function openPanel(el) {
    if (!el || layer === el) return;
    if (layer) closePanel(true);
    lastFocus = document.activeElement;
    layer = el;
    el.classList.add('open'); el.setAttribute('aria-hidden', 'false');
    backdrop.classList.add('show');
    document.body.classList.add('locked');
    $('.topbar').classList.remove('is-hidden');
    setTimeout(() => { const f = el.querySelector('.close-btn, button, a, input'); if (f) f.focus({ preventScroll: true }); }, 80);
  }
  function closePanel(silent) {
    if (!layer) return;
    layer.classList.remove('open'); layer.setAttribute('aria-hidden', 'true');
    layer = null;
    if (silent !== true) {
      backdrop.classList.remove('show');
      document.body.classList.remove('locked');
      if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
    }
  }
  const goTo = hash => { const t = $(hash); if (t) setTimeout(() => t.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }), 120); };

  document.addEventListener('click', e => {
    const g = e.target.closest('[data-go-gender]');
    if (g) {
      e.preventDefault();
      if (layer) closePanel();
      setGender(g.dataset.goGender);
      goTo('#catalog');
      return;
    }
    const o = e.target.closest('[data-open]');
    if (o) { e.preventDefault(); if (o.dataset.open === 'cart') renderCart(); if (o.dataset.open === 'favs') renderFavs(); openPanel(document.getElementById(o.dataset.open)); return; }
    const c = e.target.closest('[data-close]');
    if (c) {
      const href = c.getAttribute('href');
      closePanel();
      if (href && href.startsWith('#')) { e.preventDefault(); goTo(href); }
      return;
    }
    const nav = e.target.closest('.drawer--nav a[href^="#"]');
    if (nav) { e.preventDefault(); closePanel(); goTo(nav.getAttribute('href')); }
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closePanel();
    if (e.key === 'Tab' && layer) {
      const f = $$('button:not([disabled]), a[href], input, select', layer).filter(x => x.offsetParent !== null);
      if (!f.length) return;
      if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
    }
  });
  $$('.sheet').forEach(sheet => {
    let y0 = null, dy = 0;
    sheet.addEventListener('touchstart', e => { if (sheet.scrollTop <= 0) { y0 = e.touches[0].clientY; dy = 0; } }, { passive: true });
    sheet.addEventListener('touchmove', e => {
      if (y0 === null) return;
      dy = Math.max(0, e.touches[0].clientY - y0);
      if (dy > 0 && innerWidth < 760) { sheet.style.transition = 'none'; sheet.style.transform = `translateY(${dy}px)`; }
    }, { passive: true });
    sheet.addEventListener('touchend', () => { if (y0 === null) return; sheet.style.transition = ''; sheet.style.transform = ''; if (dy > 110) closePanel(); y0 = null; });
  });

  /* ================= ЗАГРУЗКА ================= */

  const loader = $('.loader');
  $$('.loader__word span').forEach((s, i) => s.style.setProperty('--i', i));
  let heroStarted = false;
  const startHero = () => { if (heroStarted) return; heroStarted = true; showSlide(0, 1, true); scheduleNext(); };
  let seen = false;
  try { seen = sessionStorage.getItem('pfs-loaded') === '1'; } catch (e) { /* ничего */ }
  if (reduce || seen) {
    loader.classList.add('gone');
    requestAnimationFrame(startHero);
  } else {
    const first = new Image();
    let imgDone = false;
    first.onload = first.onerror = () => { imgDone = true; };
    first.src = D.img(byId(D.HERO[0]).photo, 1400);
    setTimeout(() => { imgDone = true; }, 2500);
    const t0 = performance.now();
    let shown = 0;
    (function tick(now) {
      const target = Math.min(imgDone ? 100 : 88, (now - t0) / 14);
      shown += (target - shown) * 0.15 + 0.2;
      shown = Math.min(shown, target);
      $('#loader-num').textContent = Math.round(shown);
      $('#loader-bar').style.transform = `scaleX(${shown / 100})`;
      if (shown < 99.5) { requestAnimationFrame(tick); return; }
      setTimeout(() => {
        loader.classList.add('done');
        setTimeout(startHero, 250);
        setTimeout(() => loader.classList.add('gone'), 1200);
        try { sessionStorage.setItem('pfs-loaded', '1'); } catch (e) { /* ничего */ }
      }, 200);
    })(t0);
  }

  /* ================= ВИТРИНА ================= */

  const heroItems = D.HERO.map(byId);
  const slidesEl = $('#hero-slides');
  slidesEl.innerHTML = heroItems.map((p, i) => `<div class="hslide" data-i="${i}"><img src="${D.img(p.photo, 1400)}" alt="${esc(p.brand + ' ' + p.name)}" style="object-position:${p.pos}" ${i ? 'loading="lazy"' : ''}></div>`).join('');
  $('#hero-dots').innerHTML = heroItems.map((p, i) => `<button type="button" role="tab" aria-label="${esc(p.brand + ' ' + p.name)}" data-dot="${i}"><i></i></button>`).join('');
  $('#hero-total').textContent = String(heroItems.length).padStart(2, '0');
  let heroIdx = -1, heroTimer = 0, dotAnim = null;
  const HERO_MS = 6000;

  const words = s => s.split(' ').map((w, i) => `<span class="w" style="--i:${i}">${esc(w)}</span>`).join(' ');

  function showSlide(i, dir = 1, first = false) {
    i = (i + heroItems.length) % heroItems.length;
    if (i === heroIdx && !first) return;
    const slides = $$('.hslide', slidesEl);
    slides.forEach(s => s.classList.remove('prev'));
    if (heroIdx >= 0) { slides[heroIdx].classList.remove('active', 'back'); slides[heroIdx].classList.add('prev'); }
    const next = slides[i];
    next.classList.remove('active', 'back');
    if (dir < 0) next.classList.add('back');
    void next.offsetWidth;
    next.classList.add('active');
    heroIdx = i;
    const p = heroItems[i];
    $('#hero-brand').innerHTML = words(p.brand);
    $('#hero-name').innerHTML = words(p.name);
    $('#hero-price').textContent = money(p.price);
    $('#hero-idx').textContent = String(i + 1).padStart(2, '0');
    const bw = $('.hero__bgword');
    bw.classList.add('swap');
    $('#hero-bgword').textContent = p.name.toUpperCase();
    requestAnimationFrame(() => requestAnimationFrame(() => bw.classList.remove('swap')));
    $$('#hero-dots button').forEach((b, k) => {
      b.classList.toggle('done', k < i);
      b.setAttribute('aria-selected', String(k === i));
      const bar = $('i', b);
      bar.getAnimations && bar.getAnimations().forEach(a => a.cancel());
    });
    const bar = $(`#hero-dots [data-dot="${i}"] i`);
    if (bar && bar.animate && !reduce) dotAnim = bar.animate([{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], { duration: HERO_MS, easing: 'linear', fill: 'forwards' });
  }
  function scheduleNext() {
    clearTimeout(heroTimer);
    if (reduce) return;
    heroTimer = setTimeout(() => { showSlide(heroIdx + 1, 1); scheduleNext(); }, HERO_MS);
  }
  $$('[data-hero]').forEach(b => b.addEventListener('click', () => { showSlide(heroIdx + (+b.dataset.hero), +b.dataset.hero); scheduleNext(); }));
  $('#hero-dots').addEventListener('click', e => {
    const d = e.target.closest('[data-dot]');
    if (!d) return;
    const i = +d.dataset.dot;
    showSlide(i, i > heroIdx ? 1 : -1); scheduleNext();
  });
  $('#hero-buy').addEventListener('click', () => openProduct(heroItems[heroIdx].id));
  slidesEl.addEventListener('click', () => openProduct(heroItems[heroIdx].id));
  document.addEventListener('visibilitychange', () => { if (document.hidden) clearTimeout(heroTimer); else if (heroStarted) scheduleNext(); });

  // свайп витрины на телефоне
  let hx = null;
  $('#hero-frame').addEventListener('touchstart', e => { hx = e.touches[0].clientX; }, { passive: true });
  $('#hero-frame').addEventListener('touchend', e => {
    if (hx === null) return;
    const dx = e.changedTouches[0].clientX - hx;
    if (Math.abs(dx) > 50) { showSlide(heroIdx + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1); scheduleNext(); }
    hx = null;
  });
  // наклон рамки за мышью
  if (!reduce) {
    const frame = $('#hero-frame');
    $('#hero').addEventListener('pointermove', e => {
      if (e.pointerType !== 'mouse') return;
      const r = frame.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      frame.style.setProperty('--ry', (x * 8).toFixed(2) + 'deg');
      frame.style.setProperty('--rx', (-y * 6).toFixed(2) + 'deg');
    });
    $('#hero').addEventListener('pointerleave', () => { frame.style.setProperty('--ry', '0deg'); frame.style.setProperty('--rx', '0deg'); });
  }

  /* ================= МУЖЧИНАМ / ЖЕНЩИНАМ ================= */

  ['m', 'w'].forEach(g => {
    const s = D.SECTIONS[g], el = $('#split-' + g);
    const im = $('.split__img', el);
    im.style.backgroundImage = `url("${D.img(s.cover, 1400)}")`;
    im.style.backgroundPosition = s.pos;
    $('p', el).textContent = s.lead;
  });

  /* ================= КАТАЛОГ ================= */

  const grid = $('#grid');
  const state = { gender: 'all', brands: new Set(), sort: 'pop' };
  let favs = new Set(store.get('pfs-favs', []).filter(id => byId(id)));

  $('#brand-chips').innerHTML = D.BRANDS.map(b => `<button type="button" class="chip" data-brand="${esc(b)}" aria-pressed="false">${esc(b)}</button>`).join('');

  function movePill(seg) {
    const act = $('[aria-selected="true"]', seg), pill = $('.seg__pill', seg);
    if (!act || !pill) return;
    pill.style.width = act.offsetWidth + 'px';
    pill.style.transform = `translateX(${act.offsetLeft - 5}px)`;
  }

  function filtered() {
    let list = D.PRODUCTS.filter(p => state.gender === 'all' || p.gender === state.gender || p.gender === 'u');
    if (state.brands.size) list = list.filter(p => state.brands.has(p.brand));
    const order = D.PRODUCTS.map(p => p.id);
    if (state.sort === 'cheap') list = list.slice().sort((a, b) => a.price - b.price);
    else if (state.sort === 'expensive') list = list.slice().sort((a, b) => b.price - a.price);
    else list = list.slice().sort((a, b) => (b.tag === 'Хит') - (a.tag === 'Хит') || order.indexOf(a.id) - order.indexOf(b.id));
    return list;
  }

  const heart = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z"/></svg>';
  function card(p) {
    return `<article class="card" data-id="${p.id}" tabindex="0" aria-label="${esc(p.brand + ' ' + p.name + ', ' + money(p.price))}">
      <div class="card__img">
        <img src="${D.img(p.photo, 700)}" alt="${esc(p.brand + ' ' + p.name + ', ' + p.color)}" loading="lazy" style="object-position:${p.pos}" onload="this.classList.add('loaded')">
        ${p.tag ? `<span class="card__tag ${p.tag === 'Премиум' || p.tag === 'Лимитка' ? 'card__tag--dark' : ''}">${esc(p.tag)}</span>` : ''}
        <button type="button" class="icon-btn card__fav" data-fav="${p.id}" aria-pressed="${favs.has(p.id)}" aria-label="В избранное: ${esc(p.name)}">${heart}</button>
        <button type="button" class="card__quick" data-quick="${p.id}">Выбрать размер</button>
      </div>
      <div class="card__body">
        <span class="card__brand">${esc(p.brand)}</span>
        <span class="card__name">${esc(p.name)}</span>
        <span class="card__color">${esc(p.color)}, ${GENDER[p.gender].toLowerCase()}</span>
        <span class="card__price">${money(p.price)}</span>
      </div>
    </article>`;
  }

  function renderGrid(animate) {
    const list = filtered();
    const paint = () => {
      grid.innerHTML = list.map(card).join('');
      $('#cat-empty').hidden = list.length > 0;
      const w = list.length % 10 === 1 && list.length % 100 !== 11 ? 'пара' : (list.length % 10 >= 2 && list.length % 10 <= 4 && (list.length % 100 < 10 || list.length % 100 >= 20) ? 'пары' : 'пар');
      $('#cat-count').textContent = `${list.length} ${w}`;
      $$('img', grid).forEach(im => { if (im.complete) im.classList.add('loaded'); });
    };
    if (animate && !reduce && grid.children.length) { grid.classList.add('leaving'); setTimeout(() => { grid.classList.remove('leaving'); paint(); }, 230); }
    else paint();
  }

  function setGender(g, silent) {
    if (!['all', 'm', 'w'].includes(g)) g = 'all';
    const changed = state.gender !== g;
    state.gender = g;
    const seg = $('.cat-tools .seg');
    $$('[data-gender]', seg).forEach(b => b.setAttribute('aria-selected', String(b.dataset.gender === g)));
    movePill(seg);
    const title = $('#catalog-title');
    const text = g === 'm' ? 'Мужчинам' : g === 'w' ? 'Женщинам' : 'Каталог';
    if (title.textContent.trim() !== text) { title.textContent = text; title.dataset.split = ''; }
    if (changed || !silent) renderGrid(changed);
  }

  $('.cat-tools .seg').addEventListener('click', e => { const b = e.target.closest('[data-gender]'); if (b) setGender(b.dataset.gender); });
  $('#brand-chips').addEventListener('click', e => {
    const b = e.target.closest('[data-brand]');
    if (!b) return;
    const v = b.dataset.brand;
    if (state.brands.has(v)) state.brands.delete(v); else state.brands.add(v);
    b.setAttribute('aria-pressed', String(state.brands.has(v)));
    renderGrid(true);
  });
  $('#sort').addEventListener('change', e => { state.sort = e.target.value; renderGrid(true); });
  $('#cat-reset').addEventListener('click', () => { state.brands.clear(); $$('[data-brand]').forEach(b => b.setAttribute('aria-pressed', 'false')); setGender('all'); renderGrid(true); });

  grid.addEventListener('click', e => {
    const f = e.target.closest('[data-fav]');
    if (f) { e.stopPropagation(); toggleFav(f.dataset.fav, f); return; }
    const c = e.target.closest('.card');
    if (c) openProduct(c.dataset.id);
  });
  grid.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.classList.contains('card')) openProduct(e.target.dataset.id); });

  /* ================= ИЗБРАННОЕ ================= */

  function toggleFav(id, btn) {
    if (favs.has(id)) favs.delete(id); else favs.add(id);
    store.set('pfs-favs', [...favs]);
    const on = favs.has(id);
    $$(`[data-fav="${id}"]`).forEach(b => { b.setAttribute('aria-pressed', String(on)); b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop'); });
    if (pId === id) $('#p-fav').setAttribute('aria-pressed', String(on));
    updateBadges();
    toast(on ? 'Добавлено в избранное' : 'Убрано из избранного');
    if ($('#favs').classList.contains('open')) renderFavs();
  }
  function renderFavs() {
    const list = [...favs].map(byId).filter(Boolean);
    $('#fav-empty').hidden = list.length > 0;
    $('#fav-list').innerHTML = list.map(p => `<li class="line" data-id="${p.id}">
      <div class="line__img" data-open-p="${p.id}"><img src="${D.img(p.photo, 300)}" alt="" style="object-position:${p.pos}"></div>
      <div><div class="line__name">${esc(p.brand + ' ' + p.name)}</div><div class="line__meta">${esc(p.color)}</div><div class="line__price">${money(p.price)}</div></div>
      <button type="button" class="line__rm" data-fav="${p.id}">Убрать</button></li>`).join('');
  }
  $('#fav-list').addEventListener('click', e => {
    const r = e.target.closest('[data-fav]');
    if (r) { toggleFav(r.dataset.fav); return; }
    const o = e.target.closest('[data-open-p]');
    if (o) openProduct(o.dataset.openP);
  });

  /* ================= КАРТОЧКА ТОВАРА ================= */

  let pId = null, pSize = null;
  function openProduct(id) {
    const p = byId(id);
    if (!p) return;
    pId = id; pSize = null;
    $('#p-brand').textContent = p.brand;
    $('#p-img').innerHTML = `<img src="${D.img(p.photo, 1000)}" alt="${esc(p.brand + ' ' + p.name)}" style="object-position:${p.pos}">`;
    $('#p-name').textContent = p.name;
    $('#p-meta').textContent = `${p.color} · ${GENDER[p.gender]}`;
    $('#p-price').textContent = money(p.price);
    $('#p-text').textContent = p.text;
    $('#p-err').textContent = '';
    $('#p-credit').innerHTML = `Фото: <a href="${p.src}" target="_blank" rel="noopener">${esc(p.author)}</a>, Unsplash`;
    const sizes = D.SIZES[p.gender];
    $('#p-sizes').innerHTML = sizes.map((s, i) => `<button type="button" role="radio" aria-checked="false" data-size="${s}" style="--i:${i}" ${p.soldOut.includes(s) ? 'disabled aria-label="' + s + ', нет в наличии"' : ''}>${s}</button>`).join('');
    $('#p-fav').setAttribute('aria-pressed', String(favs.has(id)));
    $('#p-add').textContent = 'Добавить в корзину';
    $('.drawer__scroll', $('#product')).scrollTop = 0;
    openPanel($('#product'));
  }
  $('#p-sizes').addEventListener('click', e => {
    const b = e.target.closest('[data-size]');
    if (!b || b.disabled) return;
    pSize = +b.dataset.size;
    $$('#p-sizes [data-size]').forEach(x => x.setAttribute('aria-checked', String(x === b)));
    $('#p-err').textContent = '';
    $('#p-add').textContent = `Добавить · EU ${pSize}`;
  });
  $('#p-fav').addEventListener('click', () => toggleFav(pId));
  $('#p-add').addEventListener('click', () => {
    if (!pSize) {
      $('#p-err').textContent = 'Выберите размер';
      const s = $('#p-sizes'); s.classList.remove('shake'); void s.offsetWidth; s.classList.add('shake');
      return;
    }
    addToCart(pId, pSize);
    flyToCart($('#p-img'), byId(pId));
    closePanel();
  });

  /* ================= КОРЗИНА ================= */

  const cartBtn = $('.cart-btn');
  function cartItems() { return store.get('pfs-cart', []).filter(i => byId(i.id) && i.qty > 0); }
  function saveCart(items) { store.set('pfs-cart', items); updateBadges(); }
  function addToCart(id, size) {
    const items = cartItems();
    const ex = items.find(i => i.id === id && i.size === size);
    if (ex) ex.qty = Math.min(5, ex.qty + 1); else items.push({ id, size, qty: 1 });
    saveCart(items);
    toast(`${byId(id).name}, EU ${size}: в корзине`);
  }
  function flyToCart(fromEl, p) {
    $('.topbar').classList.remove('is-hidden');
    const bump = () => { cartBtn.classList.remove('bump'); void cartBtn.offsetWidth; cartBtn.classList.add('bump'); };
    if (reduce || !fromEl || !document.body.animate) { bump(); return; }
    const a = fromEl.getBoundingClientRect(), b = cartBtn.getBoundingClientRect();
    const dot = document.createElement('div');
    dot.className = 'fly';
    dot.innerHTML = `<img src="${D.img(p.photo, 200)}" alt="">`;
    document.body.appendChild(dot);
    const x0 = a.left + a.width / 2, y0 = a.top + a.height / 2, x1 = b.left + b.width / 2, y1 = b.top + b.height / 2;
    const anim = dot.animate([
      { transform: `translate(${x0}px,${y0}px) scale(2.2) rotate(0deg)`, opacity: 1 },
      { transform: `translate(${(x0 + x1) / 2}px,${Math.min(y0, y1) - 80}px) scale(1.2) rotate(-12deg)`, opacity: 1, offset: 0.5 },
      { transform: `translate(${x1}px,${y1}px) scale(.3) rotate(0deg)`, opacity: .6 }
    ], { duration: 850, easing: 'cubic-bezier(.5,0,.3,1)' });
    anim.onfinish = anim.oncancel = () => { dot.remove(); bump(); };
  }

  let promo = store.get('pfs-promo', null);
  if (promo && !D.PROMOS[promo]) promo = null;
  let deliv = store.get('pfs-deliv', 'pickup');
  if (!D.DELIVERY.find(d => d.id === deliv)) deliv = 'pickup';

  function totals() {
    const items = cartItems();
    const sub = items.reduce((s, i) => s + byId(i.id).price * i.qty, 0);
    let disc = 0;
    if (promo && D.PROMOS[promo] && sub > 0) {
      const pr = D.PROMOS[promo];
      disc = pr.percent ? Math.round(sub * pr.percent / 100) : Math.min(pr.fixed, sub);
    }
    const d = D.DELIVERY.find(x => x.id === deliv);
    const after = sub - disc;
    const dPrice = !items.length ? 0 : (d.freeFrom && after >= d.freeFrom ? 0 : d.price);
    return { items, sub, disc, dPrice, total: after + dPrice, count: items.reduce((s, i) => s + i.qty, 0) };
  }

  function renderCart() {
    const t = totals();
    $('#cart-empty').hidden = t.items.length > 0;
    $('#cart-extra').hidden = t.items.length === 0;
    $('#cart-foot').hidden = t.items.length === 0;
    $('#cart-list').innerHTML = t.items.map(i => {
      const p = byId(i.id);
      return `<li class="line" data-key="${i.id}|${i.size}">
        <div class="line__img" data-open-p="${p.id}"><img src="${D.img(p.photo, 300)}" alt="" style="object-position:${p.pos}"></div>
        <div><div class="line__name">${esc(p.brand + ' ' + p.name)}</div><div class="line__meta">EU ${i.size}, ${esc(p.color)}</div><div class="line__price">${money(p.price * i.qty)}</div></div>
        <div style="display:grid;gap:6px;justify-items:end"><div class="qty"><button type="button" data-q="-1" aria-label="Меньше">−</button><output>${i.qty}</output><button type="button" data-q="1" aria-label="Больше">+</button></div><button type="button" class="line__rm" data-rm>Удалить</button></div>
      </li>`;
    }).join('');
    $('#deliv').innerHTML = '<legend>Доставка</legend>' + D.DELIVERY.map(d => {
      const free = d.freeFrom && (t.sub - t.disc) >= d.freeFrom;
      return `<label><input type="radio" name="deliv" value="${d.id}" ${d.id === deliv ? 'checked' : ''}><span><b>${esc(d.name)}</b><small>${esc(d.note)}${d.freeFrom ? `, бесплатно от ${money(d.freeFrom)}` : ''}</small></span><b>${d.price === 0 || free ? 'бесплатно' : money(d.price)}</b></label>`;
    }).join('');
    $('#promo-code').value = promo || '';
    const pm = $('#promo-msg');
    if (promo) { pm.textContent = `${D.PROMOS[promo].text} применена`; pm.className = 'promo__msg ok'; }
    $('#s-items').textContent = money(t.sub);
    $('#s-disc-row').hidden = !t.disc;
    $('#s-disc').textContent = '−' + money(t.disc);
    $('#s-deliv').textContent = t.dPrice ? money(t.dPrice) : 'бесплатно';
    $('#s-total').textContent = money(t.total);
    updateBadges();
  }
  $('#cart-list').addEventListener('click', e => {
    const li = e.target.closest('.line');
    if (!li) return;
    const o = e.target.closest('[data-open-p]');
    if (o) { openProduct(o.dataset.openP); return; }
    const [id, size] = li.dataset.key.split('|');
    const items = cartItems();
    const it = items.find(i => i.id === id && String(i.size) === size);
    if (!it) return;
    const q = e.target.closest('[data-q]');
    if (q) it.qty = clamp(it.qty + +q.dataset.q, 0, 5);
    if (e.target.closest('[data-rm]')) it.qty = 0;
    saveCart(items.filter(i => i.qty > 0));
    renderCart();
  });
  $('#promo').addEventListener('submit', e => {
    e.preventDefault();
    const code = $('#promo-code').value.trim().toUpperCase();
    const pm = $('#promo-msg');
    if (!code) { promo = null; store.set('pfs-promo', null); pm.textContent = ''; renderCart(); return; }
    if (D.PROMOS[code]) { promo = code; store.set('pfs-promo', code); renderCart(); toast('Промокод применён'); }
    else { pm.textContent = 'Такого промокода нет. Попробуйте POKROVKA10'; pm.className = 'promo__msg bad'; }
  });
  $('#deliv').addEventListener('change', e => { if (e.target.name === 'deliv') { deliv = e.target.value; store.set('pfs-deliv', deliv); renderCart(); } });

  function updateBadges() {
    const c = cartItems().reduce((s, i) => s + i.qty, 0);
    $('#cart-count').hidden = !c; $('#cart-count').textContent = c;
    $('#fav-count').hidden = !favs.size; $('#fav-count').textContent = favs.size;
  }

  /* ================= ОФОРМЛЕНИЕ ================= */

  const coName = $('#co-name'), coPhone = $('#co-phone'), coAddr = $('#co-addr');
  function mask(input) {
    input.addEventListener('input', () => {
      let d = input.value.replace(/\D/g, '');
      if (!d) { input.value = ''; return; }
      if (d[0] === '8') d = '7' + d.slice(1);
      if (d[0] !== '7') d = '7' + d;
      d = d.slice(0, 11); const p = d.slice(1);
      let out = '+7';
      if (p.length) out += ' (' + p.slice(0, 3);
      if (p.length >= 3) out += ')';
      if (p.length > 3) out += ' ' + p.slice(3, 6);
      if (p.length > 6) out += '-' + p.slice(6, 8);
      if (p.length > 8) out += '-' + p.slice(8, 10);
      input.value = out;
    });
  }
  mask(coPhone);
  const who = store.get('pfs-who', {});
  if (who.name) coName.value = who.name;
  if (who.phone) coPhone.value = who.phone;
  if (who.addr) coAddr.value = who.addr;
  [coName, coPhone, coAddr].forEach(i => i.addEventListener('input', () => setErr(i, '')));
  function setErr(input, msg) { const f = input.closest('.field'); f.classList.toggle('error', !!msg); $('.field__err', f).textContent = msg; }

  $('#to-checkout').addEventListener('click', () => {
    const t = totals();
    if (!t.items.length) return;
    $('#co-addr-f').hidden = deliv === 'pickup';
    $('#co-total').textContent = money(t.total);
    openPanel($('#checkout'));
  });
  $('#co-form').addEventListener('submit', e => {
    e.preventDefault();
    let bad = false;
    if (coName.value.trim().length < 2) { setErr(coName, 'Напишите имя'); bad = true; }
    if (coPhone.value.replace(/\D/g, '').length !== 11) { setErr(coPhone, 'Нужен номер целиком: +7 и 10 цифр'); bad = true; }
    if (deliv !== 'pickup' && coAddr.value.trim().length < 6) { setErr(coAddr, 'Укажите улицу и дом'); bad = true; }
    if (bad) return;
    const t = totals();
    if (!t.items.length) { closePanel(); return; }
    const orders = store.get('pfs-orders', []);
    const num = 1000 + orders.length + 1;
    orders.push({ num, created: Date.now(), items: t.items, total: t.total, deliv, promo, name: coName.value.trim(), phone: coPhone.value, addr: deliv === 'pickup' ? '' : coAddr.value.trim() });
    store.set('pfs-orders', orders);
    store.set('pfs-who', { name: coName.value.trim(), phone: coPhone.value, addr: coAddr.value.trim() });
    saveCart([]);
    promo = null; store.set('pfs-promo', null);
    const d = D.DELIVERY.find(x => x.id === deliv);
    $('#done-text').textContent = `${coName.value.trim()}, заказ №${num} на ${money(t.total)} принят. ${d.name}: ${d.note.toLowerCase()}. Это демо — ничего не отправлено.`;
    openPanel($('#done'));
    renderCart();
  });

  /* ================= ДРОП ================= */

  const dropP = byId(D.DROP.id);
  $('#drop-img').innerHTML = `<img src="${D.img(dropP.photo, 1400)}" alt="${esc(dropP.brand + ' ' + dropP.name)}" loading="lazy" style="object-position:${D.DROP.pos || dropP.pos}">`;
  $('#drop-title').textContent = D.DROP.title;
  $('#drop-lead').textContent = `Всего ${D.DROP.pairs} пар. Продажа откроется в пятницу в 12:00 по Москве, по одной паре в руки.`;

  function nextDrop() {
    // пятница 12:00 по Москве = 09:00 UTC
    const now = new Date();
    const t = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 9, 0, 0));
    let add = (5 - now.getUTCDay() + 7) % 7;
    t.setUTCDate(t.getUTCDate() + add);
    if (t <= now) t.setUTCDate(t.getUTCDate() + 7);
    return t;
  }
  const dropAt = nextDrop();
  const prevT = {};
  function tickTimer() {
    let s = Math.max(0, Math.floor((dropAt - Date.now()) / 1000));
    const v = { d: Math.floor(s / 86400), h: Math.floor(s % 86400 / 3600), m: Math.floor(s % 3600 / 60), s: s % 60 };
    Object.keys(v).forEach(k => {
      const el = $(`[data-t="${k}"]`), txt = String(v[k]).padStart(2, '0');
      if (prevT[k] !== txt) { el.textContent = txt; if (prevT[k] !== undefined && !reduce) { el.classList.remove('tick'); void el.offsetWidth; el.classList.add('tick'); } prevT[k] = txt; }
    });
  }
  tickTimer(); setInterval(tickTimer, 1000);
  $('#remind').addEventListener('submit', e => {
    e.preventDefault();
    const inp = $('#remind-email'), v = inp.value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) { inp.classList.remove('bad'); void inp.offsetWidth; inp.classList.add('bad'); $('#remind-msg').textContent = 'Проверьте email: например, name@mail.ru'; return; }
    inp.classList.remove('bad');
    store.set('pfs-remind', v);
    $('#remind-msg').textContent = `Готово! Напомним на ${v} за час до старта (демо).`;
    inp.value = '';
  });

  /* ================= ЛУКБУК ================= */

  const rail = $('#look-rail'), track = $('#look-track');
  track.innerHTML = D.LOOKBOOK.map((l, i) => `<figure class="look__item" data-i="${i}"><div class="look__img"><img src="${D.img(l.photo, 900)}" alt="${esc(l.title)}" loading="lazy"></div><figcaption>${esc(l.title)}<span>${String(i + 1).padStart(2, '0')}</span></figcaption></figure>`).join('');
  let pos = 0, target = 0, maxPos = 0, drag = false, sx = 0, sp = 0, moved = 0, vel = 0, lx = 0;
  const measure = () => { maxPos = Math.max(0, track.scrollWidth - rail.clientWidth + 16); target = clamp(target, 0, maxPos); };
  rail.addEventListener('pointerdown', e => { if (e.button !== 0) return; drag = true; moved = 0; sx = lx = e.clientX; sp = target; vel = 0; rail.classList.add('dragging'); });
  window.addEventListener('pointermove', e => {
    if (!drag) return;
    const dx = e.clientX - sx; moved = Math.max(moved, Math.abs(dx)); vel = e.clientX - lx; lx = e.clientX;
    let n = sp - dx; if (n < 0) n *= 0.35; if (n > maxPos) n = maxPos + (n - maxPos) * 0.35; target = n;
  });
  const endDrag = () => { if (!drag) return; drag = false; rail.classList.remove('dragging'); target = clamp(target - vel * 12, 0, maxPos); };
  window.addEventListener('pointerup', endDrag); window.addEventListener('pointercancel', endDrag);
  rail.addEventListener('wheel', e => { if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) { e.preventDefault(); target = clamp(target + e.deltaX, 0, maxPos); } }, { passive: false });
  rail.addEventListener('click', e => { if (moved > 6) return; const it = e.target.closest('.look__item'); if (it) openLb(+it.dataset.i); });
  (function loop() {
    pos += (target - pos) * (reduce ? 1 : 0.12);
    if (Math.abs(target - pos) < 0.1) pos = target;
    track.style.transform = `translate3d(${(-pos).toFixed(1)}px,0,0)`;
    const sk = clamp((target - pos) * -0.06, -18, 18);
    track.style.setProperty('--lx', sk.toFixed(1) + 'px');
    requestAnimationFrame(loop);
  })();
  window.addEventListener('resize', measure); window.addEventListener('load', measure); measure();

  const lb = $('#lightbox');
  let lbI = 0;
  function showLb(i, dir = 0) {
    lbI = (i + D.LOOKBOOK.length) % D.LOOKBOOK.length;
    const l = D.LOOKBOOK[lbI], box = $('#lb-img');
    box.classList.remove('from-left', 'from-right'); void box.offsetWidth;
    if (dir) box.classList.add(dir > 0 ? 'from-right' : 'from-left');
    box.innerHTML = `<img src="${D.img(l.photo, 1600)}" alt="${esc(l.title)}">`;
    $('#lb-cap').innerHTML = `${lbI + 1} / ${D.LOOKBOOK.length}  ${esc(l.title)}, фото: <a href="${l.src}" target="_blank" rel="noopener" style="color:inherit">${esc(l.author)}</a>`;
  }
  function openLb(i) { showLb(i); openPanel(lb); }
  $$('[data-lb]').forEach(b => b.addEventListener('click', () => showLb(lbI + (+b.dataset.lb), +b.dataset.lb)));
  lb.addEventListener('click', e => { if (e.target === lb) closePanel(); });
  document.addEventListener('keydown', e => { if (!lb.classList.contains('open')) return; if (e.key === 'ArrowRight') showLb(lbI + 1, 1); if (e.key === 'ArrowLeft') showLb(lbI - 1, -1); });
  let lsx = null;
  lb.addEventListener('touchstart', e => { lsx = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', e => { if (lsx === null) return; const dx = e.changedTouches[0].clientX - lsx; if (Math.abs(dx) > 50) showLb(lbI + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1); lsx = null; });

  /* ================= ПОДБОР РАЗМЕРА ================= */

  let sg = 'm';
  const foot = $('#foot');
  function calcSize() {
    const cm = +foot.value;
    $('#foot-cm').textContent = cm.toFixed(1);
    foot.style.setProperty('--fp', ((cm - foot.min) / (foot.max - foot.min) * 100) + '%');
    $('#foot-svg').style.setProperty('--fs', (0.75 + (cm - 21.5) / 9 * 0.45).toFixed(3));
    const grid = D.SIZES[sg];
    const fit = grid.find(s => D.FOOT[s] >= cm);
    const eu = $('#size-eu');
    let txt, sub, hint;
    if (fit) {
      txt = String(fit);
      sub = `US ${D.US[sg][fit]} · стопа до ${D.FOOT[fit]} см`;
      const gap = D.FOOT[fit] - cm;
      hint = gap >= 0.8 ? 'Между размерами: для бега берите этот, для кед можно на полразмера меньше.' : 'Садится точно. Если стопа широкая — возьмите на размер больше.';
    } else if (cm < D.FOOT[grid[0]]) {
      txt = String(grid[0]); sub = `US ${D.US[sg][grid[0]]} · самый маленький в сетке`; hint = sg === 'm' ? 'Попробуйте женскую сетку: там есть размеры меньше.' : 'Это самый маленький размер. Посмотрите детские модели в шоуруме.';
    } else {
      txt = '—'; sub = 'Нет в этой сетке'; hint = sg === 'w' ? 'Попробуйте мужскую сетку: там размеры до 46.' : 'Больших размеров пока нет, но можем заказать под вас.';
    }
    if (eu.textContent !== txt) { eu.textContent = txt; eu.classList.remove('tick'); void eu.offsetWidth; eu.classList.add('tick'); }
    $('#size-sub').textContent = sub;
    $('#size-hint').textContent = hint;
  }
  foot.addEventListener('input', calcSize);
  const sizeSeg = $('.size .seg');
  sizeSeg.addEventListener('click', e => {
    const b = e.target.closest('[data-sg]');
    if (!b) return;
    sg = b.dataset.sg;
    $$('[data-sg]', sizeSeg).forEach(x => x.setAttribute('aria-selected', String(x === b)));
    movePill(sizeSeg);
    if (sg === 'w' && +foot.value > 26.5) foot.value = 24;
    if (sg === 'm' && +foot.value < 25) foot.value = 27;
    calcSize();
  });
  calcSize();

  /* ================= ПРОКРУТКА, ШАПКА, ПОДВАЛ ================= */

  const topbar = $('.topbar'), prog = $('.progress span'), steps = $('#steps');
  let lastY = scrollY;
  function onScroll() {
    const y = scrollY;
    topbar.classList.toggle('is-solid', y > 30);
    if (!layer) topbar.classList.toggle('is-hidden', y > lastY && y > 400);
    lastY = y;
    const max = document.documentElement.scrollHeight - innerHeight;
    prog.style.transform = `scaleX(${max > 0 ? clamp(y / max, 0, 1) : 0})`;
    const r = steps.getBoundingClientRect();
    steps.style.setProperty('--lp', clamp((innerHeight * 0.85 - r.top) / (r.height + innerHeight * 0.3), 0, 1).toFixed(3));
  }
  let tick = false;
  window.addEventListener('scroll', () => { if (!tick) { tick = true; requestAnimationFrame(() => { onScroll(); tick = false; }); } }, { passive: true });

  $$('.footer__word').forEach(el => { el.innerHTML = [...el.textContent.trim()].map(ch => `<span class="ch">${esc(ch)}</span>`).join(''); });
  $('#year').textContent = new Date().getFullYear();

  // авторы фото
  const credits = D.PRODUCTS.map(p => [p.brand + ' ' + p.name, p.author, p.src]).concat(D.LOOKBOOK.map(l => [l.title, l.author, l.src]));
  $('#credits-list').innerHTML = credits.map(([t, a, s]) => `<li>${esc(t)} — <a href="${s}" target="_blank" rel="noopener">${esc(a)}</a></li>`).join('');

  /* ================= ПРИЛОЖЕНИЕ ================= */

  let installEv = null;
  window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); installEv = e; });
  document.addEventListener('click', async e => {
    if (!e.target.closest('[data-install]')) return;
    if (installEv) { closePanel(); installEv.prompt(); try { await installEv.userChoice; } catch (err) { /* ничего */ } installEv = null; }
    else openPanel($('#install'));
  });
  if ('serviceWorker' in navigator && location.protocol === 'https:') window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));

  /* ================= СТАРТ ================= */

  window.addEventListener('storage', e => { if (e.key === 'pfs-cart' || e.key === 'pfs-favs') { favs = new Set(store.get('pfs-favs', [])); updateBadges(); renderGrid(false); } });
  renderGrid(false);
  requestAnimationFrame(() => { movePill($('.cat-tools .seg')); movePill(sizeSeg); });
  if (document.fonts) document.fonts.ready.then(() => { movePill($('.cat-tools .seg')); movePill(sizeSeg); });
  window.addEventListener('resize', () => { movePill($('.cat-tools .seg')); movePill(sizeSeg); });
  updateBadges();
  onScroll();

  // для проверок
  window.PFS = { totals, cartItems, openProduct, setGender, state };
})();
