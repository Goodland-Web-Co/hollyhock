const { priced, email } = JSON.parse(document.getElementById('shop-data').textContent);
const $ = (id) => document.getElementById(id);
const money = (n) => (Number.isInteger(n) ? `$${n}` : `$${n.toFixed(2)}`);

/* ---------- shop clock: Santa Barbara time ---------- */

const HOURS = { Tuesday: [9, 17], Wednesday: [9, 17], Thursday: [9, 17], Friday: [9, 17], Saturday: [9, 17], Sunday: [10, 14] };
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const clock = (h) => (h > 12 ? `${h - 12} pm` : h === 12 ? 'noon' : `${h} am`);

function openStatus() {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles', weekday: 'long', hour: 'numeric', minute: 'numeric', hour12: false,
  }).formatToParts(new Date());
  const get = (t) => parts.find((p) => p.type === t).value;
  const day = get('weekday');
  const hour = (Number(get('hour')) % 24) + Number(get('minute')) / 60;
  const today = HOURS[day];
  if (today && hour >= today[0] && hour < today[1]) return `Open until ${clock(today[1])}`;
  if (today && hour < today[0]) return `Opens at ${clock(today[0])}`;
  const i = DAYS.indexOf(day);
  for (let n = 1; n <= 7; n++) {
    const next = DAYS[(i + n) % 7];
    if (HOURS[next]) return `Opens ${clock(HOURS[next][0])} ${n === 1 ? 'tomorrow' : next}`;
  }
}
const statusLine = $('open-status');
if (statusLine) {
  statusLine.textContent = openStatus();
  statusLine.classList.toggle('is-open', openStatus().startsWith('Open until'));
}

/* ---------- photo slider above the footer ---------- */

const row = $('strip-row');
if (row) {
  const slides = [...row.children];
  const wide = matchMedia('(min-width: 960px)');
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let at = 0;
  let timer = null;
  const mark = (n) => {
    at = (n + slides.length) % slides.length;
    slides.forEach((li, k) => li.classList.toggle('is-active', k === at));
    $('strip-now').textContent = String(at + 1).padStart(2, '0');
  };
  const show = (n) => {
    mark(n);
    if (!wide.matches) slides[at].scrollIntoView({ behavior: calm ? 'auto' : 'smooth', inline: 'start', block: 'nearest' });
  };
  // on small screens the row scrolls by hand, so the counter follows whichever photo is nearest the left edge
  const follow = () => {
    if (wide.matches) return;
    const x = row.scrollLeft + slides[0].offsetLeft;
    let near = 0;
    slides.forEach((li, k) => { if (Math.abs(li.offsetLeft - x) < Math.abs(slides[near].offsetLeft - x)) near = k; });
    if (near !== at) mark(near);
  };
  row.addEventListener('scroll', follow, { passive: true });
  row.addEventListener('scrollend', follow);
  row.addEventListener('touchend', () => setTimeout(follow, 400), { passive: true });
  const play = () => { stop(); if (!calm && wide.matches) timer = setInterval(() => show(at + 1), 4200); };
  const stop = () => { clearInterval(timer); timer = null; };
  slides.forEach((li, k) => {
    li.addEventListener('pointerenter', () => { if (wide.matches) show(k); });
    li.querySelector('.slide').addEventListener('click', () => show(k));
    li.querySelector('.slide').addEventListener('focus', () => { if (wide.matches) show(k); });
  });
  $('strip-prev').addEventListener('click', () => { show(at - 1); play(); });
  $('strip-next').addEventListener('click', () => { show(at + 1); play(); });
  const strip = row.closest('.strip');
  strip.addEventListener('pointerenter', stop);
  strip.addEventListener('pointerleave', play);
  strip.addEventListener('focusin', stop);
  strip.addEventListener('focusout', play);
  // while the strip is on screen, a light check keeps the counter honest even if a scroll event is missed
  let watch = null;
  let lastX = row.scrollLeft;
  new IntersectionObserver(([entry]) => {
    clearInterval(watch); watch = null;
    if (!entry.isIntersecting) { stop(); return; }
    play();
    watch = setInterval(() => { if (row.scrollLeft !== lastX) { lastX = row.scrollLeft; follow(); } }, 250);
  }, { threshold: 0.3 }).observe(strip);
}

/* ---------- order slip ---------- */

const slip = $('slip');
const KEY = 'hollyhock-slip';
let lines = {};
try { lines = JSON.parse(localStorage.getItem(KEY)) || {}; } catch { lines = {}; }

function renderSlip() {
  const ids = Object.keys(lines).filter((id) => priced[id] && lines[id] > 0);
  const total = ids.reduce((sum, id) => sum + priced[id].price * lines[id], 0);
  const count = ids.reduce((sum, id) => sum + lines[id], 0);
  $('slip-count').textContent = count;
  $('slip-open').setAttribute('aria-label', `Order slip, ${count} ${count === 1 ? 'item' : 'items'}`);
  $('slip-empty').hidden = count > 0;
  $('slip-total').hidden = $('slip-next').hidden = count === 0;
  $('slip-sum').textContent = money(total);

  $('slip-lines').replaceChildren(...ids.map((id) => {
    const p = priced[id];
    const li = document.createElement('li');
    li.innerHTML = `
      <div class="line-top"><span></span><span class="leader" aria-hidden="true"></span><span>${money(p.price * lines[id])}</span></div>
      <div class="line-sub">
        <span class="qty"><button type="button"></button><span>${lines[id]}</span><button type="button"></button></span>
        <span>${money(p.price)} ${p.unit}</span>
      </div>`;
    li.querySelector('.line-top span').textContent = p.name;
    const [less, more] = li.querySelectorAll('button');
    less.textContent = 'âˆ’';
    more.textContent = '+';
    less.setAttribute('aria-label', `One fewer, ${p.name}`);
    more.setAttribute('aria-label', `One more, ${p.name}`);
    less.addEventListener('click', () => step(id, -1));
    more.addEventListener('click', () => step(id, 1));
    return li;
  }));

  const body = ids.map((id) => `${lines[id]} x ${priced[id].name} (${money(priced[id].price)} ${priced[id].unit})`).join('\n');
  $('slip-send').href = `mailto:${email}?subject=${encodeURIComponent('Order slip')}&body=${encodeURIComponent(`${body}\n\nTotal ${money(total)}\n\nCollection or delivery:\nDay wanted:\nName and telephone:`)}`;
  try { localStorage.setItem(KEY, JSON.stringify(lines)); } catch { /* private mode */ }
}

function step(id, by) {
  lines[id] = Math.max(0, (lines[id] || 0) + by);
  if (!lines[id]) delete lines[id];
  renderSlip();
}

for (const button of document.querySelectorAll('[data-add]')) {
  button.addEventListener('click', () => { step(button.dataset.add, 1); slip.showModal(); });
}
$('slip-open').addEventListener('click', () => slip.showModal());
slip.addEventListener('click', (e) => { if (e.target === slip) slip.close(); });
renderSlip();

/* ---------- search page ---------- */

const grid = $('search-grid');
if (grid) {
  const input = $('page-q');
  const summary = $('search-summary');
  const tiles = [...grid.querySelectorAll('.tile')];
  const run = () => {
    const words = input.value.toLowerCase().split(/\s+/).filter(Boolean);
    let shown = 0;
    for (const tile of tiles) {
      const hit = words.every((w) => tile.dataset.search.includes(w));
      tile.hidden = !hit;
      if (hit) shown++;
    }
    summary.textContent = !words.length ? 'Everything in the shop.'
      : shown === 0 ? `Nothing matches "${input.value.trim()}". Telephone the shop and ask, it may be in the cooler.`
      : `${shown} ${shown === 1 ? 'result' : 'results'} for "${input.value.trim()}".`;
  };
  input.value = new URLSearchParams(location.search).get('q') || '';
  input.addEventListener('input', run);
  input.form.addEventListener('submit', (e) => { e.preventDefault(); run(); });
  run();
}

/* ---------- home page: make your own bunch ---------- */

const maker = $('maker');
if (maker) {
  const { months } = JSON.parse($('maker-data').textContent);
  const picks = [...maker.querySelectorAll('.pick')].map((el) => ({
    el,
    id: el.dataset.id,
    months: el.dataset.months.split(',').map(Number),
    count: el.querySelector('.pick-count'),
    away: el.querySelector('.pick-away'),
    add: el.querySelector('.pick-add'),
    stepper: el.querySelector('.stepper'),
    plus: el.querySelector('[data-pick="1"]'),
    minus: el.querySelector('[data-pick="-1"]'),
  }));
  const bunch = {};

  const drawBunch = () => {
    const ids = Object.keys(bunch).filter((id) => bunch[id] > 0);
    const total = ids.reduce((sum, id) => sum + priced[id].price * bunch[id], 0);
    $('bunch-empty').hidden = ids.length > 0;
    $('bunch-total').hidden = ids.length === 0;
    $('bunch-add').disabled = ids.length === 0;
    $('bunch-sum').textContent = money(total);
    const n = ids.reduce((sum, id) => sum + bunch[id], 0);
    $('bunch-count').textContent = `${n} ${n === 1 ? 'item' : 'items'}`;
    $('bunch-lines').replaceChildren(...ids.map((id) => {
      const li = document.createElement('li');
      const name = document.createElement('span');
      name.textContent = `${bunch[id]} Ã— ${priced[id].name}`;
      const cost = document.createElement('span');
      cost.className = 'bunch-cost';
      cost.textContent = money(priced[id].price * bunch[id]);
      const less = document.createElement('button');
      less.type = 'button';
      less.textContent = 'Remove';
      less.setAttribute('aria-label', `Remove ${priced[id].name}`);
      less.addEventListener('click', () => { delete bunch[id]; drawBunch(); });
      li.append(name, cost, less);
      return li;
    }));
    for (const p of picks) {
      const n = bunch[p.id] || 0;
      p.count.textContent = n;
      p.stepper.hidden = n === 0;
      p.add.hidden = n > 0 || p.el.classList.contains('is-away');
      p.el.classList.toggle('is-picked', n > 0);
    }
  };

  const setMonth = (m) => {
    $('maker-month').textContent = months[m - 1];
    for (const p of picks) {
      const here = p.months.includes(m);
      p.el.classList.toggle('is-away', !here);
      p.away.hidden = here;
      if (!here) {
        p.away.textContent = `Back in ${months[p.months[0] - 1]}`;
        delete bunch[p.id];
      }
    }
    drawBunch();
  };

  for (const p of picks) {
    const more = () => { bunch[p.id] = (bunch[p.id] || 0) + 1; drawBunch(); };
    p.add.addEventListener('click', () => { more(); p.plus.focus(); });
    p.plus.addEventListener('click', more);
    p.minus.addEventListener('click', () => { bunch[p.id] = Math.max(0, (bunch[p.id] || 0) - 1); drawBunch(); if (!bunch[p.id]) p.add.focus(); });
  }
  for (const input of maker.querySelectorAll('input[name="month"]')) input.addEventListener('change', () => setMonth(Number(input.value)));
  $('bunch-add').addEventListener('click', () => {
    for (const id of Object.keys(bunch)) { if (bunch[id] > 0) step(id, bunch[id]); delete bunch[id]; }
    drawBunch();
    slip.showModal();
  });

  const now = Number(new Intl.DateTimeFormat('en-US', { timeZone: 'America/Los_Angeles', month: 'numeric' }).format(new Date()));
  const current = maker.querySelector(`input[name="month"][value="${now}"]`);
  if (current) current.checked = true;
  setMonth(now);
}

/* ---------- flowers page: filter ---------- */

const filters = $('filters');
if (filters) {
  const tiles = [...$('shop-grid').querySelectorAll('.tile')];
  filters.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    filters.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    let n = 0;
    for (const t of tiles) {
      const show = b.dataset.filter === 'all' || t.dataset.group === b.dataset.filter;
      t.hidden = !show;
      if (show) n++;
    }
    $('filter-count').textContent = `${n} items`;
  });
}

/* ---------- contact page: note opens the visitor's email ---------- */

const cform = $('cform');
if (cform) {
  cform.addEventListener('submit', (e) => {
    e.preventDefault();
    const f = new FormData(cform);
    const body = `${f.get('msg')}\n\n${f.get('name')}\n${f.get('tel') || ''}`;
    location.href = `mailto:${cform.dataset.to}?subject=${encodeURIComponent(f.get('about'))}&body=${encodeURIComponent(body)}`;
  });
}

/* ---------- small screens: the side column folds into a menu ---------- */

const menuOpen = $('menu-open');
const menu = $('side-menu');
if (menuOpen && menu) {
  const menuClose = $('menu-close');
  const header = menuOpen.closest('.side');
  const setMenu = (open) => {
    header.classList.toggle('is-open', open);
    menuOpen.setAttribute('aria-expanded', String(open));
    document.documentElement.classList.toggle('menu-lock', open);
    if (open) menuClose.focus();
    else menuOpen.focus();
  };
  menuOpen.addEventListener('click', () => setMenu(!header.classList.contains('is-open')));
  menuClose.addEventListener('click', () => setMenu(false));
  menu.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && header.classList.contains('is-open')) setMenu(false); });
  matchMedia('(min-width: 960px)').addEventListener('change', (e) => { if (e.matches && header.classList.contains('is-open')) setMenu(false); });
}
