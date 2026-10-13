const EMAIL = 'henriquerl22@outlook.com';
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const AREA_LABELS = {
  web: 'Web',
  mobile: 'Mobile',
  saude: 'Saúde digital',
  'tempo-real': 'Tempo real',
  mapas: 'Mapas e dados',
};

function buildMailto(subject, body) {
  return `mailto:${EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function setupTriage() {
  const form = document.getElementById('triagem');
  const ledger = document.getElementById('experiencia');
  if (!form || !ledger) return;

  const rows = [...ledger.querySelectorAll('li[data-tags]')];
  const count = document.getElementById('triagem-contagem');
  const summary = document.getElementById('triagem-resumo');
  const mailLinks = ['mail-triagem', 'mail-hero', 'mail-contato']
    .map((id) => document.getElementById(id))
    .filter(Boolean);

  function update() {
    const areas = [...form.querySelectorAll('input[name="area"]:checked')].map((input) => input.value);
    const format = form.querySelector('input[name="formato"]:checked')?.value ?? '';

    const matches = rows.filter((row) => {
      const tags = row.dataset.tags.split(' ');
      return areas.length === 0 || areas.some((area) => tags.includes(area));
    });

    rows.forEach((row) => row.classList.toggle('is-match', areas.length > 0 && matches.includes(row)));
    ledger.classList.toggle('is-filtered', areas.length > 0);
    count.textContent = `${matches.length} de ${rows.length}`;

    const areaNames = areas.map((area) => AREA_LABELS[area]);
    const parts = [areaNames.join(', '), format].filter(Boolean);
    summary.textContent = parts.length ? parts.join(' · ') : 'Nada marcado ainda';

    const highlights = matches.slice(0, 5).map((row) => `- ${row.firstElementChild.textContent}`);
    const body = [
      'Olá, Henrique.',
      '',
      `A vaga precisa de: ${areaNames.length ? areaNames.join(', ') : '(a definir)'}`,
      `Formato: ${format || '(a definir)'}`,
      '',
      'Da sua experiência, me interessou:',
      ...highlights,
      '',
      'Podemos conversar?',
    ].join('\n');
    const subject = areaNames.length ? `Vaga: ${areaNames.join(', ')}` : 'Conversa sobre uma vaga';
    mailLinks.forEach((link) => { link.href = buildMailto(subject, body); });
  }

  form.addEventListener('change', update);
  form.addEventListener('submit', (event) => event.preventDefault());
  update();
}

function setupPreview() {
  const ledger = document.getElementById('experiencia');
  if (!ledger) return;
  const demos = [...ledger.querySelectorAll('.ledger__preview .demo')];

  function show(name) {
    demos.forEach((demo) => demo.classList.toggle('is-active', demo.id === `demo-${name}`));
  }

  ledger.querySelectorAll('li[data-demo]').forEach((row) => {
    row.tabIndex = 0;
    const activate = () => show(row.dataset.demo);
    row.addEventListener('mouseenter', activate);
    row.addEventListener('focus', activate);
  });
  show('triagem');
}

function setupReveal() {
  document.querySelectorAll('.ledger li, .tools li, .about__list li').forEach((item) => item.classList.add('reveal'));
  const items = [...document.querySelectorAll('.reveal')];
  if (!('IntersectionObserver' in window)) {
    items.forEach((item) => item.classList.add('is-in'));
    return;
  }

  items.forEach((item) => {
    const siblings = [...item.parentElement.children].filter((child) => child.classList.contains('reveal'));
    item.style.setProperty('--delay', `${siblings.indexOf(item) * 80}ms`);
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

function whenVisible(element, onTick, interval) {
  if (!element) return;
  let timer = null;
  const start = () => { if (!timer) timer = setInterval(onTick, interval); };
  const stop = () => { clearInterval(timer); timer = null; };

  const observer = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting && !document.hidden) start(); else stop();
  });
  observer.observe(element);
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });
}

const TRIAGE_STEPS = [
  { q: 'Qual é o principal sintoma?', options: ['Febre', 'Dor de garganta', 'Tosse'] },
  { q: 'Há quanto tempo você sente os sintomas?', options: ['Menos de 24 horas', 'De 1 a 3 dias', 'Mais de 3 dias'] },
  { q: 'De 0 a 10, qual a intensidade?', options: ['De 0 a 3', 'De 4 a 6', 'De 7 a 10'] },
  { q: 'Toma algum medicamento contínuo?', options: ['Não', 'Sim, um', 'Sim, mais de um'] },
  { q: 'Pronto. A equipe já recebeu suas respostas.', options: ['Entrar na fila', 'Revisar respostas', 'Sair'] },
];

function setupTriageDemo() {
  const screen = document.querySelector('.screen--triage');
  if (!screen) return;
  const question = screen.querySelector('[data-triage-q]');
  const options = screen.querySelector('[data-triage-options]');
  const stepLabel = screen.querySelector('[data-triage-step]');
  const progress = screen.querySelector('[data-triage-progress]');
  let step = 1;
  let picking = true;

  function render() {
    const current = TRIAGE_STEPS[step];
    question.textContent = current.q;
    options.innerHTML = '';
    current.options.forEach((text) => {
      const item = document.createElement('li');
      item.textContent = text;
      options.append(item);
    });
    stepLabel.textContent = String(step + 1);
    progress.style.transform = `scaleX(${(step + 1) / TRIAGE_STEPS.length})`;
  }

  render();
  whenVisible(screen, () => {
    if (picking) {
      const items = options.children;
      items[(step * 2) % items.length].classList.add('is-picked');
    } else {
      step = (step + 1) % TRIAGE_STEPS.length;
      render();
    }
    picking = !picking;
  }, 1400);
}

function formatClock(totalSeconds) {
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return `${minutes}:${seconds}`;
}

function setupVideoDemo() {
  const time = document.querySelector('[data-video-time]');
  if (!time) return;
  let seconds = 0;
  whenVisible(time.closest('.screen'), () => {
    seconds += 1;
    time.textContent = formatClock(seconds);
  }, 1000);
}

const QUEUE_ARRIVALS = [
  ['R. T.', 'Clínica geral'],
  ['M. A.', 'Dermatologia'],
  ['P. L.', 'Pediatria'],
  ['G. F.', 'Psicologia'],
];

function setupQueueDemo() {
  const queue = document.querySelector('[data-queue]');
  if (!queue) return;
  const counter = document.querySelector('[data-queue-count]');
  let tick = 0;
  let arrival = 0;

  function tickWaits() {
    queue.querySelectorAll('[data-wait]').forEach((cell) => {
      const next = Number(cell.dataset.wait) + 1;
      cell.dataset.wait = String(next);
      cell.textContent = formatClock(next);
    });
  }

  function admitAndArrive() {
    queue.firstElementChild?.remove();
    const [initials, specialty] = QUEUE_ARRIVALS[arrival % QUEUE_ARRIVALS.length];
    arrival += 1;
    const row = document.createElement('li');
    row.className = 'is-new';
    row.innerHTML = `<span>${initials}</span><span>${specialty}</span><span data-wait="0">00:00</span>`;
    queue.append(row);
    requestAnimationFrame(() => requestAnimationFrame(() => row.classList.remove('is-new')));
    counter.textContent = `${queue.children.length} aguardando`;
  }

  whenVisible(queue, () => {
    tick += 1;
    tickWaits();
    if (tick % 5 === 0) admitAndArrive();
  }, 1000);
}

function seededNoise(x, y, t) {
  const value = Math.sin(x * 0.55 + t) + Math.cos(y * 0.7 - t * 0.6) + Math.sin((x + y) * 0.3 + t * 0.4);
  return (value + 3) / 6;
}

function setupHeatDemo() {
  const heat = document.querySelector('[data-heat]');
  if (!heat) return;
  const columns = 20;
  const rowsCount = 11;
  const total = document.querySelector('[data-map-total]');
  const cells = Array.from({ length: columns * rowsCount }, () => {
    const cell = document.createElement('span');
    heat.append(cell);
    return cell;
  });
  let t = 0;

  function paint() {
    cells.forEach((cell, index) => {
      const x = index % columns;
      const y = Math.floor(index / columns);
      const level = Math.round(seededNoise(x, y, t) * 4) / 4;
      cell.style.opacity = String(0.08 + level * 0.92);
    });
    total.textContent = `${(812400 + Math.round(Math.sin(t) * 1200)).toLocaleString('pt-BR')} pontos`;
  }

  paint();
  if (prefersReducedMotion) return;
  whenVisible(heat, () => { t += 0.35; paint(); }, 1600);
}

function start() {
  setupTriage();
  setupPreview();
  setupReveal();
  setupTriageDemo();
  setupVideoDemo();
  setupQueueDemo();
  setupHeatDemo();
  void document.body.offsetHeight;
  document.documentElement.classList.add('is-loaded');
}

start();
