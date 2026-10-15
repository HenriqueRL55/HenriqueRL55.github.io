const SKILL_POOL = [
  ['react', 'React'],
  ['vuedotjs', 'Vue'],
  ['ionic', 'Ionic'],
  ['typescript', 'TypeScript'],
  ['capacitor', 'Capacitor'],
  ['react', 'React Native'],
  ['angular', 'Angular'],
  ['tailwindcss', 'Tailwind'],
  ['vite', 'Vite'],
  ['firebase', 'Firebase'],
  ['googlemaps', 'Google Maps'],
  ['figma', 'Figma'],
];
const SKILL_SWAP_INTERVAL_MS = 2000;
const SKILL_SWAP_OUT_MS = 380;
const SKILL_NEW_MS = 900;
const MOTION_STORAGE_KEY = 'portfolio-motion-paused';
const MOTION_EVENT = 'motionchange';
const MAGNET_STRENGTH = 0.28;
const TILT_MAX_DEG = 7;
const SCRAMBLE_STEP_MS = 45;
const SCRAMBLE_GLYPHS = 'abcdefghijklmnopqrstuvwxyz';
const STAR_AREA_PER_POINT = 15000;
const STAR_MAX_POINTS = 90;
const STAR_LINK_DISTANCE = 120;
const STAR_POINTER_DISTANCE = 170;
const STAR_SPEED = 0.28;

const root = document.documentElement;
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const hasFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const canFollowPointer = hasFinePointer && !prefersReducedMotion;

const isMotionPaused = () => root.classList.contains('motion-paused');

function readStoredPause() {
  try {
    return window.localStorage.getItem(MOTION_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

function storePause(isPaused) {
  try {
    window.localStorage.setItem(MOTION_STORAGE_KEY, isPaused ? '1' : '0');
    return true;
  } catch {
    return false;
  }
}

function setupMotionToggle() {
  const button = document.querySelector('.motion-toggle');
  const label = button?.querySelector('span');

  const apply = (isPaused) => {
    root.classList.toggle('motion-paused', isPaused);
    if (label) label.textContent = isPaused ? button.dataset.labelResume : button.dataset.labelPause;
    document.dispatchEvent(new CustomEvent(MOTION_EVENT));
  };

  apply(readStoredPause());
  button?.addEventListener('click', () => {
    const isPaused = !isMotionPaused();
    storePause(isPaused);
    apply(isPaused);
  });
}

function wrapWords(textNode, nextIndex) {
  const fragment = document.createDocumentFragment();
  textNode.textContent.split(/(\s+)/).forEach((part) => {
    if (!part) return;
    if (/^\s+$/.test(part)) {
      fragment.append(part);
      return;
    }
    const word = document.createElement('span');
    const inner = document.createElement('span');
    word.className = 'word';
    inner.className = 'word__in';
    inner.style.setProperty('--i', nextIndex());
    inner.textContent = part;
    word.append(inner);
    fragment.append(word);
  });
  textNode.replaceWith(fragment);
}

function splitWords(element) {
  let index = 0;
  const nextIndex = () => index++;
  const visit = (parent) => [...parent.childNodes].forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) wrapWords(node, nextIndex);
    else if (node.nodeType === Node.ELEMENT_NODE && !(node instanceof SVGElement)) visit(node);
  });
  visit(element);
  element.classList.add('split');
}

function setupSplitTitles() {
  document
    .querySelectorAll('.hero__title, .section__title')
    .forEach(splitWords);
}

function swapChip(chip, update) {
  chip.classList.add('is-swapping');
  window.setTimeout(() => {
    update();
    chip.classList.remove('is-swapping');
    chip.classList.add('is-new');
    window.setTimeout(() => chip.classList.remove('is-new'), SKILL_NEW_MS);
  }, SKILL_SWAP_OUT_MS);
}

function createSkillSwapper(chip, iconDir, skillChips) {
  const image = chip.querySelector('img');
  return () => {
    const shownNames = skillChips.map((item) => item.lastChild.textContent.trim());
    const options = SKILL_POOL.filter(([, name]) => !shownNames.includes(name));
    const [icon, name] = options[Math.floor(Math.random() * options.length)];
    swapChip(chip, () => {
      image.src = `${iconDir}${icon}.svg`;
      chip.lastChild.textContent = name;
    });
  };
}

function createDomainSwapper(chip) {
  const domains = chip.dataset.domains
    .split('|')
    .map((entry) => entry.split(':'))
    .filter(([icon, name]) => icon && name);
  const use = chip.querySelector('use');
  let current = 0;
  return () => {
    if (domains.length < 2 || !use) return;
    current = (current + 1) % domains.length;
    const [icon, name] = domains[current];
    swapChip(chip, () => {
      use.setAttribute('href', `#i-${icon}`);
      chip.lastChild.textContent = name;
    });
  };
}

function setupSkillSwap() {
  const chips = [...document.querySelectorAll('.hero__visual .float')];
  const skillChips = chips.filter((chip) => chip.querySelector('img'));
  const iconDir = skillChips[0]?.querySelector('img').getAttribute('src').replace(/[^/]+$/, '');
  const swappers = chips
    .map((chip) => {
      if (chip.dataset.domains) return createDomainSwapper(chip);
      if (chip.querySelector('img')) return createSkillSwapper(chip, iconDir, skillChips);
      return null;
    })
    .filter(Boolean);
  if (!swappers.length) return;

  let turn = 0;
  window.setInterval(() => {
    if (document.hidden || isMotionPaused()) return;
    swappers[turn % swappers.length]();
    turn += 1;
  }, SKILL_SWAP_INTERVAL_MS);
}

function setupHeroParallax() {
  const hero = document.querySelector('.hero');
  const visual = document.querySelector('.hero__visual');
  if (!canFollowPointer || !hero || !visual) return;

  let frame = 0;
  hero.addEventListener('pointermove', (event) => {
    if (frame || isMotionPaused()) return;
    frame = requestAnimationFrame(() => {
      const box = visual.getBoundingClientRect();
      const x = (event.clientX - (box.left + box.width / 2)) / window.innerWidth;
      const y = (event.clientY - (box.top + box.height / 2)) / window.innerHeight;
      visual.style.setProperty('--px', x.toFixed(3));
      visual.style.setProperty('--py', y.toFixed(3));
      frame = 0;
    });
  });
  hero.addEventListener('pointerleave', () => {
    cancelAnimationFrame(frame);
    frame = 0;
    visual.style.setProperty('--px', '0');
    visual.style.setProperty('--py', '0');
  });
}

function createStars(width, height) {
  const count = Math.round(Math.min(STAR_MAX_POINTS, (width * height) / STAR_AREA_PER_POINT));
  return Array.from({ length: count }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    vx: (Math.random() - 0.5) * STAR_SPEED,
    vy: (Math.random() - 0.5) * STAR_SPEED,
    radius: Math.random() * 1.4 + 0.6,
  }));
}

function moveStars(stars, width, height) {
  return stars.map((star) => ({
    ...star,
    x: (star.x + star.vx + width) % width,
    y: (star.y + star.vy + height) % height,
  }));
}

function drawLink(context, from, to, maxDistance, strength) {
  const distance = Math.hypot(from.x - to.x, from.y - to.y);
  if (distance > maxDistance) return;
  context.strokeStyle = `rgba(255, 140, 40, ${((1 - distance / maxDistance) * strength).toFixed(3)})`;
  context.beginPath();
  context.moveTo(from.x, from.y);
  context.lineTo(to.x, to.y);
  context.stroke();
}

function drawStars(context, stars, pointer, width, height) {
  context.clearRect(0, 0, width, height);
  context.lineWidth = 1;
  stars.forEach((star, index) => {
    for (let other = index + 1; other < stars.length; other += 1) {
      drawLink(context, star, stars[other], STAR_LINK_DISTANCE, 0.22);
    }
    if (pointer.isActive) drawLink(context, star, pointer, STAR_POINTER_DISTANCE, 0.55);
  });
  context.fillStyle = 'rgba(255, 174, 43, 0.7)';
  stars.forEach((star) => {
    context.beginPath();
    context.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
    context.fill();
  });
}

function setupConstellation() {
  const hero = document.querySelector('.hero');
  if (!hero) return;
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) return;
  canvas.className = 'constellation';
  canvas.setAttribute('aria-hidden', 'true');
  hero.prepend(canvas);

  let width = 0;
  let height = 0;
  let stars = [];
  let frame = 0;
  let isVisible = true;
  let pointer = { x: 0, y: 0, isActive: false };

  const shouldAnimate = () => isVisible && !document.hidden && !isMotionPaused() && !prefersReducedMotion;
  const render = () => drawStars(context, stars, pointer, width, height);

  const loop = () => {
    stars = moveStars(stars, width, height);
    render();
    frame = shouldAnimate() ? requestAnimationFrame(loop) : 0;
  };
  const start = () => {
    if (!frame && shouldAnimate()) frame = requestAnimationFrame(loop);
    else if (!frame) render();
  };
  const resize = () => {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    width = hero.clientWidth;
    height = hero.clientHeight;
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    stars = createStars(width, height);
    render();
  };

  if (hasFinePointer) {
    hero.addEventListener('pointermove', (event) => {
      const box = hero.getBoundingClientRect();
      pointer = { x: event.clientX - box.left, y: event.clientY - box.top, isActive: true };
      if (!frame) render();
    });
    hero.addEventListener('pointerleave', () => {
      pointer = { ...pointer, isActive: false };
      if (!frame) render();
    });
  }

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
      start();
    }).observe(hero);
  }
  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(hero);
  document.addEventListener('visibilitychange', start);
  document.addEventListener(MOTION_EVENT, start);
  resize();
  start();
}

function setupScrollProgress() {
  const bar = document.createElement('div');
  bar.className = 'scroll-progress';
  bar.setAttribute('aria-hidden', 'true');
  document.body.prepend(bar);

  let frame = 0;
  const update = () => {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.setProperty('--progress', scrollable > 0 ? (window.scrollY / scrollable).toFixed(4) : '0');
    frame = 0;
  };
  const scheduleUpdate = () => { if (!frame) frame = requestAnimationFrame(update); };
  window.addEventListener('scroll', scheduleUpdate, { passive: true });
  window.addEventListener('resize', scheduleUpdate);
  update();
}

function setupTimeline() {
  const timeline = document.querySelector('.timeline');
  if (!timeline) return;
  const jobs = [...timeline.querySelectorAll('.job')];

  let frame = 0;
  const update = () => {
    frame = 0;
    const box = timeline.getBoundingClientRect();
    const focus = window.innerHeight * 0.6;
    const progress = Math.min(Math.max((focus - box.top) / box.height, 0), 1);
    timeline.style.setProperty('--line', progress.toFixed(4));
    jobs.forEach((job) => job.classList.toggle('is-lit', job.getBoundingClientRect().top + 40 < focus));
  };
  const scheduleUpdate = () => { if (!frame) frame = requestAnimationFrame(update); };
  window.addEventListener('scroll', scheduleUpdate, { passive: true });
  window.addEventListener('resize', scheduleUpdate);
  timeline.classList.add('is-drawn');
  update();
}

function setupStagger() {
  document.querySelectorAll('.skills, .tags, .job__points').forEach((list) => {
    [...list.children].forEach((item, index) => item.style.setProperty('--i', index));
  });
  document.addEventListener('transitionend', (event) => {
    const { target, propertyName } = event;
    if (propertyName !== 'opacity' || !target.classList?.contains('reveal') || !target.classList.contains('is-in')) return;
    target.style.setProperty('--delay', '0ms');
  });
}

function setupSpotlight() {
  if (!hasFinePointer) return;
  document.querySelectorAll('.case, .service, .job, .skill').forEach((card) => {
    card.addEventListener('pointermove', (event) => {
      const box = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${event.clientX - box.left}px`);
      card.style.setProperty('--my', `${event.clientY - box.top}px`);
    });
  });
}

function setupTilt() {
  if (!canFollowPointer) return;
  document.querySelectorAll('.case').forEach((card) => {
    card.addEventListener('pointermove', (event) => {
      if (isMotionPaused()) return;
      const box = card.getBoundingClientRect();
      const x = (event.clientX - box.left) / box.width - 0.5;
      const y = (event.clientY - box.top) / box.height - 0.5;
      card.style.setProperty('--ry', `${(x * TILT_MAX_DEG).toFixed(2)}deg`);
      card.style.setProperty('--rx', `${(-y * TILT_MAX_DEG).toFixed(2)}deg`);
      card.classList.add('is-tilting');
    });
    card.addEventListener('pointerleave', () => {
      card.classList.remove('is-tilting');
      card.style.removeProperty('--rx');
      card.style.removeProperty('--ry');
    });
  });
}

function setupMagnetic() {
  if (!canFollowPointer) return;
  document.querySelectorAll('.btn:not(.btn--full), .socials a, .lang, .nav__cta').forEach((element) => {
    element.addEventListener('pointermove', (event) => {
      if (isMotionPaused()) return;
      const box = element.getBoundingClientRect();
      const x = (event.clientX - box.left - box.width / 2) * MAGNET_STRENGTH;
      const y = (event.clientY - box.top - box.height / 2) * MAGNET_STRENGTH;
      element.style.translate = `${x.toFixed(1)}px ${y.toFixed(1)}px`;
    });
    element.addEventListener('pointerleave', () => { element.style.translate = ''; });
  });
}

function setupCursorGlow() {
  if (!canFollowPointer) return;
  const glow = document.createElement('div');
  glow.className = 'cursor-glow';
  glow.setAttribute('aria-hidden', 'true');
  document.body.append(glow);

  let frame = 0;
  let position = { x: 0, y: 0 };
  window.addEventListener('pointermove', (event) => {
    position = { x: event.clientX, y: event.clientY };
    if (isMotionPaused()) {
      glow.classList.remove('is-on');
      return;
    }
    if (frame) return;
    frame = requestAnimationFrame(() => {
      glow.style.translate = `${position.x}px ${position.y}px`;
      glow.classList.add('is-on');
      frame = 0;
    });
  }, { passive: true });
  root.addEventListener('pointerleave', () => glow.classList.remove('is-on'));
}

function setupNavPill() {
  const nav = document.querySelector('.nav__links');
  if (!nav) return;
  const links = [...nav.querySelectorAll('a')];
  const pill = document.createElement('span');
  pill.className = 'nav__pill';
  pill.setAttribute('aria-hidden', 'true');
  nav.prepend(pill);
  nav.classList.add('has-pill');

  const activeLink = () => links.find((link) => link.classList.contains('is-active'));
  const moveTo = (link) => {
    pill.classList.toggle('is-on', Boolean(link));
    if (!link) return;
    pill.style.width = `${link.offsetWidth}px`;
    pill.style.translate = `${link.offsetLeft}px 0`;
  };

  new MutationObserver(() => moveTo(activeLink())).observe(nav, { subtree: true, attributes: true, attributeFilter: ['class'] });
  links.forEach((link) => link.addEventListener('pointerenter', () => moveTo(link)));
  nav.addEventListener('pointerleave', () => moveTo(activeLink()));
  window.addEventListener('resize', () => moveTo(activeLink()));
}

function setupLogoScramble() {
  if (!canFollowPointer) return;
  document.querySelectorAll('.logo').forEach((logo) => {
    const textNode = logo.firstChild;
    if (!textNode || textNode.nodeType !== Node.TEXT_NODE) return;
    const original = textNode.textContent;
    logo.setAttribute('aria-label', logo.textContent);
    let frame = 0;

    logo.addEventListener('pointerenter', () => {
      if (isMotionPaused()) return;
      cancelAnimationFrame(frame);
      const startTime = performance.now();
      const tick = (now) => {
        const revealed = Math.floor((now - startTime) / SCRAMBLE_STEP_MS);
        textNode.textContent = [...original]
          .map((letter, index) => (index < revealed ? letter : SCRAMBLE_GLYPHS[Math.floor(Math.random() * SCRAMBLE_GLYPHS.length)]))
          .join('');
        frame = revealed < original.length ? requestAnimationFrame(tick) : 0;
        if (!frame) textNode.textContent = original;
      };
      frame = requestAnimationFrame(tick);
    });
  });
}

setupMotionToggle();
setupSplitTitles();
setupStagger();
setupConstellation();
setupSkillSwap();
setupHeroParallax();
setupScrollProgress();
setupTimeline();
setupSpotlight();
setupTilt();
setupMagnetic();
setupCursorGlow();
setupNavPill();
setupLogoScramble();
