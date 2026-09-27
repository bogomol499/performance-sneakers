/* =========================================================
   Performance — анимации при прокрутке
   Подключается после app.js. Если у человека в системе
   включено «уменьшить движение», файл ничего не делает.
   ========================================================= */
(() => {
  'use strict';

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return;

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const root = document.documentElement;
  const mouse = window.matchMedia('(pointer: fine)').matches;

  root.classList.add('motion');

  /* ============ 1. Всё прилетает и улетает вместе с прокруткой ============ */
  // Анимация привязана прямо к положению прокрутки: листаете вниз — элемент
  // прилетает, листаете дальше — улетает вверх, крутите обратно — всё
  // проигрывается в обратную сторону.

  const ease = t => 1 - Math.pow(1 - t, 3);
  const items = [];

  // k: 1 — элемент ещё внизу (прилетает), 0 — на месте, −1 — улетел вверх
  const VARIANTS = {
    up:    k => ({ x: 0, y: k * 120, r: k * 3, s: 1 - Math.abs(k) * .08 }),
    left:  k => ({ x: -Math.abs(k) * 180, y: k * 40, r: -k * 6, s: 1 }),
    right: k => ({ x: Math.abs(k) * 220, y: k * 60, r: k * 10, s: 1 - Math.abs(k) * .1 }),
    scale: k => ({ x: 0, y: k * 140, r: 0, s: 1 - Math.abs(k) * .25 }),
    tilt:  k => ({ x: 0, y: k * 220, r: 0, s: 1 - Math.abs(k) * .18, rx: k * 38 }),
    swing: k => ({ x: (k > 0 ? 1 : -1) * Math.abs(k) * 160, y: k * 80, r: k * 18, s: 1 - Math.abs(k) * .15 }),
    drop:  k => ({ x: 0, y: -Math.abs(k) * 160, r: 0, s: 1 + Math.abs(k) * .6 }),
    clip:  k => ({ clip: Math.abs(k), s: 1 + Math.abs(k) * .12 })
  };

  function tag(el, anim, delay = 0) {
    if (!el || el.dataset.anim) return;
    el.dataset.anim = anim;
    items.push({ el, anim, off: delay / 1000, k: 1, x: 0, y: 0, words: null });
  }
  function tagAll(selector, anim, step = 0, base = 0) {
    $$(selector).forEach((el, i) => tag(el, anim, base + i * step));
  }

  // Что и как прилетает (на всех страницах; чего нет — просто пропускается)
  const RULES = [
    ['.split__panel', 'up', 140],
    ['.section-head p', 'up', 0, 120],
    ['.cat-tools', 'left', 0, 80],
    ['.cat-count', 'left', 0, 120],
    ['.drop__img', 'clip'],
    ['.drop__content > *', 'up', 70],
    ['.steps li', 'swing', 120],
    ['.size__text > *:not(h2)', 'left', 70],
    ['.size__result', 'scale'],
    ['.store__map', 'clip'],
    ['.store dl > div', 'swing', 90, 100],
    ['.store__info .btn', 'up', 0, 300],
    ['.pin', 'drop', 250],
    ['.footer__row, .footer__copy', 'up', 80]
  ];

  function rescan() {
    for (let i = items.length - 1; i >= 0; i--) if (!items[i].el.isConnected) items.splice(i, 1);
    RULES.forEach(([sel, anim, step = 0, base = 0]) => $$(sel).forEach((el, i) => tag(el, anim, base + (step ? (i % 6) * step : 0))));
    $$('.card').forEach((d, i) => tag(d, 'tilt', (i % 4) * 70 + Math.floor(i / 4) * 40));
    $$('.h-reveal').forEach(splitHeading);
  }

  // Заголовки: каждое слово прилетает отдельно
  function splitHeading(h) {
    const it0 = items.find(x => x.el === h);
    if (h.dataset.split === h.textContent.trim() && h.querySelector('.hw') && it0 && it0.words && it0.words[0] && it0.words[0].isConnected) return;
    const text = h.textContent.trim();
    h.innerHTML = text.split(/\s+/).map(w => `<span class="hw"><span>${w.replace(/</g, '&lt;')}</span></span>`).join(' ');
    h.dataset.split = h.textContent.trim();
    let it = items.find(x => x.el === h);
    if (!it) { tag(h, 'words'); it = items[items.length - 1]; }
    it.words = $$('.hw > span', h);
    apply(it);
  }

  let rescanQueued = false;
  const queueRescan = () => {
    if (rescanQueued) return;
    rescanQueued = true;
    requestAnimationFrame(() => { rescanQueued = false; rescan(); });
  };
  new MutationObserver(queueRescan).observe(document.body, { childList: true, subtree: true });
  
  function updateItems(vh, vw, force) {
    items.forEach(it => {
      const el = it.el;
      const r = el.getBoundingClientRect();
      // вычитаем собственный сдвиг, чтобы измерять «настоящее» место
      const top = r.top - it.y, bottom = r.bottom - it.y;
      if (bottom < -vh * 0.5 || top > vh * 1.5) {
        if (it.k !== (top > vh ? 1 : -1) || force) { it.k = top > vh ? 1 : -1; apply(it); }
        return;
      }
      const enter = clamp((vh * 0.98 - top) / (vh * 0.42) - it.off, 0, 1);
      const exit = clamp((bottom - 10) / (vh * 0.2), 0, 1);
      let target = enter < 1 ? 1 - ease(enter) : exit < 1 ? -(1 - ease(exit)) : 0;
      if (it.anim === 'right') {
        const left = r.left - it.x;
        const h = clamp((vw * 1.02 - left) / (vw * 0.4), 0, 1);
        if (target >= 0) target = Math.max(target, 1 - ease(h));
      }
      const next = it.k + (target - it.k) * 0.16;
      if (Math.abs(next - it.k) < 0.0004 && !force) return;
      it.k = Math.abs(next - target) < 0.0004 ? target : next;
      apply(it);
    });
  }

  function apply(it) {
    const el = it.el, k = it.k;
    if (it.anim === 'words') {
      const n = it.words.length, p = 1 - Math.abs(k), sign = k >= 0 ? 1 : -1;
      it.words.forEach((w, i) => {
        const j = sign > 0 ? i : n - 1 - i;
        const pi = clamp(p * (1 + 0.18 * (n - 1)) - 0.18 * j, 0, 1);
        const q = 1 - ease(pi);
        w.style.transform = q > 0.001 ? `translateY(${(sign * q * 115).toFixed(1)}%) rotate(${(sign * q * 8).toFixed(2)}deg)` : 'none';
      });
      return;
    }
    const v = VARIANTS[it.anim](k);
    if (it.anim === 'clip') {
      const a = v.clip;
      el.style.clipPath = a ? `inset(${(a * 22).toFixed(2)}% ${(a * 14).toFixed(2)}% ${(a * 22).toFixed(2)}% ${(a * 14).toFixed(2)}% round ${(32 + a * 60).toFixed(0)}px)` : '';
      el.style.scale = v.s.toFixed(4);
      return;
    }
    it.x = v.x; it.y = v.y;
    el.style.opacity = (1 - Math.abs(k) * 1.1).toFixed(3);
    el.style.translate = `${v.x.toFixed(1)}px ${v.y.toFixed(1)}px`;
    el.style.rotate = v.rx ? `x ${v.rx.toFixed(2)}deg` : `${v.r.toFixed(2)}deg`;
    el.style.scale = v.s.toFixed(4);
  }

  rescan();

  /* ============ 2. Загрузка ============ */

  const hero = $('#hero');
  const heroFrame = $('#hero-frame');
  const heroInfo = $('.hero__info');

  /* ============ 3. Всё, что зависит от прокрутки ============ */

  const mapSvg = $('.store__map');
  const footer = $('.footer');
  let footerChars = $$('.footer__word .ch');

  // Бегущие строки: скорость и направление зависят от прокрутки
  const marquees = $$('.marquee').map((m, i) => ({
    el: m,
    track: $('.marquee__track', m),
    x: 0,
    base: i % 2 ? 0.6 : 0.8,
    sign: i % 2 ? 1 : -1
  }));

  let lastY = window.scrollY, vel = 0, dir = 1, lastT = performance.now();
  let cacheHp = -1;

  function frame(t) {
    const dt = Math.min(64, t - lastT) / 16.67; lastT = t;
    const y = window.scrollY;
    const vh = window.innerHeight, vw = window.innerWidth;
    vel += ((y - lastY) - vel) * 0.18;
    if (Math.abs(y - lastY) > 0.5) dir = y > lastY ? 1 : -1;
    lastY = y;

    root.style.setProperty('--scroll', y.toFixed(1));
    updateItems(vh, vw, false);

    // первый экран
    if (hero) {
      const hp = clamp(y / (hero.offsetHeight || vh), 0, 1);
      if (Math.abs(hp - cacheHp) > 0.001) {
        cacheHp = hp;
        heroFrame.style.translate = `0 ${(hp * 120).toFixed(1)}px`;
        heroFrame.style.scale = (1 - hp * 0.12).toFixed(4);
        heroInfo.style.translate = `0 ${(hp * -60).toFixed(1)}px`;
        heroInfo.style.opacity = (1 - hp * 1.4).toFixed(3);
        const bg = $('.hero__bgword');
        if (bg) bg.style.translate = `${(hp * -18).toFixed(2)}vw -58%`;
      }
    }

    // бегущие строки
    marquees.forEach(m => {
      const half = m.track.scrollWidth / 2;
      if (!half) return;
      const speed = (m.base + Math.min(Math.abs(vel) * 0.35, 18)) * dt;
      m.x += speed * m.sign * dir;
      if (m.x <= -half) m.x += half;
      if (m.x > 0) m.x -= half;
      const skew = clamp(-vel * 0.25, -10, 10);
      m.track.style.transform = `translate3d(${m.x.toFixed(2)}px,0,0) skewX(${skew.toFixed(2)}deg)`;
    });

    // заголовки секций слегка едут вбок
    $$('.section-head h2, .store__info h2, .size__text h2').forEach(h => {
      const r = h.getBoundingClientRect();
      if (r.bottom < -200 || r.top > vh + 200) return;
      const p = (r.top + r.height / 2 - vh / 2) / vh;
      h.style.translate = `${(p * 6).toFixed(2)}vw 0`;
    });

    // картинка дропа отъезжает при прокрутке
    const dropImg = $('.drop__img');
    if (dropImg) {
      const r = dropImg.getBoundingClientRect();
      if (r.top < vh && r.bottom > 0) dropImg.style.setProperty('--dz', (1.25 - clamp((vh - r.top) / (vh + r.height), 0, 1) * 0.25).toFixed(3));
    }
    // карта приближается
    const mr = mapSvg ? mapSvg.getBoundingClientRect() : null;
    if (mr && mr.top < vh && mr.bottom > 0) {
      const p = clamp((vh - mr.top) / (vh + mr.height), 0, 1);
      mapSvg.style.setProperty('--ms', (1.35 - p * 0.35).toFixed(3));
    }

    // подвал выезжает из-под страницы
    if (footer) {
    const docH = document.documentElement.scrollHeight;
    const fh = footer.offsetHeight;
    const fp = clamp((y + vh - (docH - fh)) / fh, 0, 1);
    footer.style.setProperty('--fp', fp.toFixed(3));
    footerChars.forEach((c, i) => {
      const pi = clamp(fp * 2.2 - i * 0.07, 0, 1), q = 1 - ease(pi);
      c.style.transform = q > 0.001 ? `translateY(${((i % 2 ? 1 : -1) * q * 115).toFixed(1)}%) rotate(${((i % 2 ? 1 : -1) * q * 20).toFixed(1)}deg)` : 'none';
    });
    }

    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  /* ============ 4. Плавная прокрутка колёсиком ============ */

  if (mouse) {
    let target = window.scrollY, current = window.scrollY, running = false;

    const canScrollInside = el => {
      for (; el && el !== document.body; el = el.parentElement) {
        const s = getComputedStyle(el);
        if (/(auto|scroll)/.test(s.overflowY) && el.scrollHeight > el.clientHeight + 1) return true;
      }
      return false;
    };

    function step() {
      current += (target - current) * 0.1;
      if (Math.abs(target - current) < 0.5) { current = target; running = false; }
      window.scrollTo(0, current);
      if (running) requestAnimationFrame(step);
      else root.style.scrollBehavior = '';
    }

    window.addEventListener('wheel', e => {
      if (e.ctrlKey || document.body.classList.contains('locked')) return;
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      if (canScrollInside(e.target)) return;
      e.preventDefault();
      const k = e.deltaMode === 1 ? 40 : e.deltaMode === 2 ? window.innerHeight : 1;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (!running) current = target = window.scrollY;
      target = clamp(target + e.deltaY * k, 0, max);
      if (!running) {
        running = true;
        root.style.scrollBehavior = 'auto';
        requestAnimationFrame(step);
      }
    }, { passive: false });

    // клик по ссылке или клавиатура — отдаём прокрутку браузеру
    const stop = () => { running = false; root.style.scrollBehavior = ''; };
    document.addEventListener('click', e => { if (e.target.closest('a[href^="#"], [data-book-weekday]')) stop(); }, true);
    window.addEventListener('keydown', stop);
    window.addEventListener('mousedown', stop);
  }

  /* ============ 5. Мышь: магнитные кнопки, наклон карточек ============ */

  if (mouse) {
    // кнопки тянутся к курсору
    document.addEventListener('pointermove', e => {
      const b = e.target.closest('.btn, .icon-btn');
      $$('.magnet').forEach(x => { if (x !== b) { x.classList.remove('magnet'); x.style.translate = ''; } });
      if (!b) return;
      const r = b.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
      b.classList.add('magnet');
      b.style.translate = `${(dx * 0.22).toFixed(1)}px ${(dy * 0.32).toFixed(1)}px`;
    });

    // карточки блюд наклоняются за мышью
    document.addEventListener('pointermove', e => {
      const card = e.target.closest('.card');
      if (!card) return;
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      card.classList.add('tilting');
      card.style.transform = `perspective(900px) rotateX(${(-y * 10).toFixed(2)}deg) rotateY(${(x * 12).toFixed(2)}deg) translateY(-8px)`;
      const svg = null;
      if (svg) svg.style.translate = `${(x * 18).toFixed(1)}px ${(y * 14).toFixed(1)}px`;
    });
    document.addEventListener('pointerout', e => {
      const card = e.target.closest('.card');
      if (!card || card.contains(e.relatedTarget)) return;
      card.classList.remove('tilting');
      card.style.transform = '';
      const svg = null;
      if (svg) svg.style.translate = '';
    });
  }
})();
