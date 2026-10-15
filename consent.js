const CONSENT_STORAGE_KEY = 'portfolio-analytics-consent';
const CONSENT_GRANTED = 'granted';
const CONSENT_DENIED = 'denied';
const GA_ID_PATTERN = /^G-[A-Z0-9]+$/;
const GA_SCRIPT_URL = 'https://www.googletagmanager.com/gtag/js';

const consentScript = document.currentScript;

function readConsent() {
  try {
    return window.localStorage.getItem(CONSENT_STORAGE_KEY);
  } catch {
    return null;
  }
}

function storeConsent(value) {
  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, value);
  } catch {
    return false;
  }
  return true;
}

function loadAnalytics(measurementId) {
  if (window.gtag) return;
  window[`ga-disable-${measurementId}`] = false;
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    window.dataLayer.push(arguments);
  };
  window.gtag('js', new Date());
  window.gtag('config', measurementId);

  const script = document.createElement('script');
  script.async = true;
  script.src = `${GA_SCRIPT_URL}?id=${encodeURIComponent(measurementId)}`;
  document.head.append(script);
}

function clearAnalyticsCookies() {
  const domains = ['', `; domain=${window.location.hostname}`, `; domain=.${window.location.hostname}`];
  document.cookie
    .split(';')
    .map((cookie) => cookie.split('=')[0].trim())
    .filter((name) => name === '_ga' || name.startsWith('_ga_'))
    .forEach((name) => {
      domains.forEach((domain) => {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/${domain}`;
      });
    });
}

function setupConsent() {
  const measurementId = consentScript?.dataset.gaId?.trim() ?? '';
  const banner = document.querySelector('.consent');
  const settingsButton = document.querySelector('.cookie-settings');
  if (!GA_ID_PATTERN.test(measurementId) || !banner) return;

  const showBanner = (isVisible) => { banner.hidden = !isVisible; };

  const choose = (value) => {
    storeConsent(value);
    showBanner(false);
    if (value === CONSENT_GRANTED) {
      loadAnalytics(measurementId);
      return;
    }
    window[`ga-disable-${measurementId}`] = true;
    clearAnalyticsCookies();
  };

  banner.querySelectorAll('[data-consent]').forEach((button) => {
    button.addEventListener('click', () => choose(button.dataset.consent));
  });

  if (settingsButton) {
    settingsButton.hidden = false;
    settingsButton.addEventListener('click', () => showBanner(true));
  }

  const consent = readConsent();
  if (consent === CONSENT_GRANTED) loadAnalytics(measurementId);
  else if (consent !== CONSENT_DENIED) showBanner(true);
}

setupConsent();
