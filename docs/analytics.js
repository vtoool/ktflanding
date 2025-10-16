export const ANALYTICS_PROVIDER = 'plausible'; // 'plausible' | 'ga4' | 'none'
export const ANALYTICS_SITE_DOMAIN = 'vtoool.github.io';
export const GA4_ID = 'G-XXXXXXX';

const ATTRIBUTION_KEY = 'ktf_attribution_v1';
let cachedAttribution = null;

function readAttribution() {
  if (cachedAttribution) {
    return cachedAttribution;
  }
  try {
    const stored = localStorage.getItem(ATTRIBUTION_KEY);
    if (stored) {
      cachedAttribution = JSON.parse(stored);
    }
  } catch (err) {
    cachedAttribution = null;
  }
  return cachedAttribution || null;
}

function writeAttribution(values) {
  cachedAttribution = values;
  try {
    localStorage.setItem(ATTRIBUTION_KEY, JSON.stringify(values));
  } catch (err) {
    // Ignore storage errors
  }
}

function captureAttributionFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const source = params.get('utm_source');
  const campaign = params.get('utm_campaign');
  const ref = params.get('ref');
  if (!source && !campaign && !ref) {
    return;
  }
  const existing = readAttribution() || {};
  const merged = {
    ...existing,
    ...(source ? { utm_source: source } : {}),
    ...(campaign ? { utm_campaign: campaign } : {}),
    ...(ref ? { ref } : {}),
  };
  writeAttribution(merged);
}

function loadPlausible() {
  if (document.querySelector('script[data-analytics="plausible"]')) return;
  const plausibleScript = document.createElement('script');
  plausibleScript.src = 'https://plausible.io/js/script.manual.js';
  plausibleScript.defer = true;
  plausibleScript.dataset.analytics = 'plausible';
  plausibleScript.dataset.domain = ANALYTICS_SITE_DOMAIN;
  if (typeof window !== 'undefined' && typeof window.plausible !== 'function') {
    const queue = [];
    const proxy = function () {
      queue.push(arguments);
    };
    proxy.q = queue;
    window.plausible = proxy;
  }
  document.head.appendChild(plausibleScript);
}

function loadGa4() {
  if (document.querySelector('script[data-analytics="ga4"]')) return;
  if (!GA4_ID || GA4_ID === 'G-XXXXXXX') return;
  const gaScript = document.createElement('script');
  gaScript.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA4_ID)}`;
  gaScript.async = true;
  gaScript.dataset.analytics = 'ga4';
  document.head.appendChild(gaScript);

  window.dataLayer = window.dataLayer || [];
  function gtag(){ window.dataLayer.push(arguments); }
  window.gtag = gtag;
  gtag('js', new Date());
  gtag('config', GA4_ID);
}

export function initAnalytics() {
  if (typeof window === 'undefined') return;
  captureAttributionFromUrl();
  if (ANALYTICS_PROVIDER === 'plausible' && ANALYTICS_SITE_DOMAIN) {
    loadPlausible();
  } else if (ANALYTICS_PROVIDER === 'ga4') {
    loadGa4();
  }
}

function withAttribution(props) {
  const attribution = readAttribution();
  if (!attribution) return props;
  return { ...props, ...attribution };
}

export function trackEvent(name, props = {}) {
  if (typeof window === 'undefined') return;
  const payload = withAttribution({ location: 'unknown', ...props });

  if (ANALYTICS_PROVIDER === 'plausible') {
    if (typeof window.plausible === 'function') {
      window.plausible(name, { props: payload });
    }
    return;
  }

  if (ANALYTICS_PROVIDER === 'ga4') {
    if (typeof window.gtag === 'function') {
      window.gtag('event', name, payload);
    }
    return;
  }
}
