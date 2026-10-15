const EMAIL = 'henriquerl22@outlook.com';
const FORM_ENDPOINT = `https://formsubmit.co/ajax/${EMAIL}`;
const COPY_FEEDBACK_MS = 2000;
const MIN_FILL_MS = 3000;
const SEND_COOLDOWN_MS = 60000;
const LAST_SENT_STORAGE_KEY = 'portfolio-contact-last-sent';

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
  if (!('IntersectionObserver' in window)) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      animateCount(entry.target);
      observer.unobserve(entry.target);
    });
  });
  document.querySelectorAll('[data-count]').forEach((counter) => observer.observe(counter));
}

function readContact(form) {
  const data = new FormData(form);
  const field = (name) => String(data.get(name) || '').trim();
  const topic = field('assunto') || form.dataset.defaultTopic;
  const name = field('nome');
  const company = field('empresa');
  const email = field('email');
  const message = field('mensagem');

  const subject = `${topic} · ${name}${company ? ` (${company})` : ''}`;
  const signature = [name, company, email].filter(Boolean).join(', ');
  return {
    isSpam: field('_honey') !== '',
    subject,
    body: `${message}\n\n— ${signature}`,
    payload: { _subject: subject, _honey: '', assunto: topic, nome: name, empresa: company, email, mensagem: message },
  };
}

async function sendContact(payload) {
  const response = await fetch(FORM_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || String(result.success) !== 'true') {
    throw new Error(result.message || `HTTP ${response.status}`);
  }
}

function openMailto({ subject, body }) {
  window.location.href = `mailto:${EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function readLastSent() {
  try {
    return Number(window.localStorage.getItem(LAST_SENT_STORAGE_KEY)) || 0;
  } catch {
    return 0;
  }
}

function storeLastSent(timestamp) {
  try {
    window.localStorage.setItem(LAST_SENT_STORAGE_KEY, String(timestamp));
  } catch {
    return false;
  }
  return true;
}

function setupContactForm() {
  const form = document.getElementById('form-contato');
  if (!form) return;
  const status = form.querySelector('.form__status');
  const button = form.querySelector('[type="submit"]');
  const loadedAt = Date.now();

  function setStatus(key) {
    status.textContent = form.dataset[key];
    status.dataset.state = key;
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;

    const contact = readContact(form);
    if (contact.isSpam) return;
    const now = Date.now();
    if (now - loadedAt < MIN_FILL_MS || now - readLastSent() < SEND_COOLDOWN_MS) {
      setStatus('msgCooldown');
      return;
    }

    button.disabled = true;
    setStatus('msgSending');
    try {
      await sendContact(contact.payload);
      storeLastSent(Date.now());
      form.reset();
      setStatus('msgSuccess');
    } catch {
      setStatus('msgError');
      openMailto(contact);
    } finally {
      button.disabled = false;
    }
  });
}

function setupCopyButtons() {
  document.querySelectorAll('[data-copy]').forEach((button) => {
    const label = button.querySelector('span');
    const original = label.textContent;
    let timer;

    button.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(button.dataset.copy);
        label.textContent = button.dataset.labelDone;
        button.dataset.state = 'done';
      } catch {
        label.textContent = button.dataset.labelFail;
        button.dataset.state = 'fail';
      }
      button.title = label.textContent;
      clearTimeout(timer);
      timer = setTimeout(() => {
        label.textContent = original;
        button.removeAttribute('title');
        delete button.dataset.state;
      }, COPY_FEEDBACK_MS);
    });
  });
}

setupNav();
setupReveal();
setupCounters();
setupContactForm();
setupCopyButtons();
