const EMAIL = 'henriquerl22@outlook.com';

function setupNav() {
  const nav = document.querySelector('.nav');
  const toggle = document.querySelector('.nav__toggle');
  const links = [...document.querySelectorAll('.nav__links a')];
  if (!nav || !toggle) return;

  function setOpen(isOpen) {
    nav.classList.toggle('is-open', isOpen);
    toggle.setAttribute('aria-expanded', String(isOpen));
    toggle.setAttribute('aria-label', isOpen ? toggle.dataset.labelClose : toggle.dataset.labelOpen);
  }

  toggle.addEventListener('click', () => setOpen(!nav.classList.contains('is-open')));
  links.forEach((link) => link.addEventListener('click', () => setOpen(false)));
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape') setOpen(false); });

  const onScroll = () => nav.classList.toggle('is-scrolled', window.scrollY > 12);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if (!('IntersectionObserver' in window)) return;
  const sections = links
    .map((link) => document.querySelector(link.getAttribute('href')))
    .filter(Boolean);
  const hero = document.querySelector('.hero');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      links.forEach((link) => link.classList.toggle('is-active', link.getAttribute('href') === `#${entry.target.id}`));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  [hero, ...sections].filter(Boolean).forEach((section) => observer.observe(section));
}

function setupReveal() {
  const items = [...document.querySelectorAll('.reveal')];
  if (!('IntersectionObserver' in window)) {
    items.forEach((item) => item.classList.add('is-in'));
    return;
  }

  items.forEach((item) => {
    const siblings = [...item.parentElement.children].filter((child) => child.classList.contains('reveal'));
    const position = Math.min(siblings.indexOf(item), 8);
    item.style.setProperty('--delay', `${position * 70}ms`);
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-in');
      observer.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -8% 0px' });

  items.forEach((item) => observer.observe(item));
}

function animateCount(element) {
  const target = Number(element.dataset.count);
  const duration = 1200;
  const startTime = performance.now();

  function frame(now) {
    const progress = Math.min((now - startTime) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    element.textContent = String(Math.round(target * eased));
    if (progress < 1) requestAnimationFrame(frame);
  }

  element.textContent = '0';
  requestAnimationFrame(frame);
}

function setupCounters() {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion || !('IntersectionObserver' in window)) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      animateCount(entry.target);
      observer.unobserve(entry.target);
    });
  });
  document.querySelectorAll('[data-count]').forEach((counter) => observer.observe(counter));
}

function setupContactForm() {
  const form = document.getElementById('form-contato');
  if (!form) return;

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;

    const data = new FormData(form);
    const topic = data.get('assunto') || form.dataset.defaultTopic;
    const name = String(data.get('nome') || '').trim();
    const company = String(data.get('empresa') || '').trim();
    const message = String(data.get('mensagem') || '').trim();

    const subject = `${topic} · ${name}${company ? ` (${company})` : ''}`;
    const signature = company ? `${name}, ${company}` : name;
    const body = `${message}\n\n— ${signature}`;
    window.location.href = `mailto:${EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  });
}

setupNav();
setupReveal();
setupCounters();
setupContactForm();
