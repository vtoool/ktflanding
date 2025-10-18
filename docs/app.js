import { initAnalytics, trackEvent } from './analytics.js';
import { initDemo } from './demo.js';
import { formatSegmentsToI } from './demo-formatter.js';

const HERO_SEGMENTS = [
  {
    marketingCarrier: 'BA',
    operatingCarrier: 'BA',
    operatingCarrierName: 'British Airways',
    flightNumber: '1515',
    bookingClass: 'J',
    cabin: 'business',
    departure: {
      airport: 'JFK',
      city: 'New York JFK',
      iso: '2024-02-11T21:50:00-05:00',
      timeZone: 'America/New_York',
    },
    arrival: {
      airport: 'LHR',
      city: 'London Heathrow',
      iso: '2024-02-12T09:40:00+00:00',
      timeZone: 'Europe/London',
    },
    durationMinutes: 410,
    aircraft: '777',
    status: 'SS1',
  },
  {
    marketingCarrier: 'BA',
    operatingCarrier: 'BA',
    operatingCarrierName: 'British Airways',
    flightNumber: '173',
    bookingClass: 'J',
    cabin: 'business',
    departure: {
      airport: 'LHR',
      city: 'London Heathrow',
      iso: '2024-02-26T11:20:00+00:00',
      timeZone: 'Europe/London',
    },
    arrival: {
      airport: 'JFK',
      city: 'New York JFK',
      iso: '2024-02-26T14:20:00-05:00',
      timeZone: 'America/New_York',
    },
    durationMinutes: 480,
    aircraft: '777',
    status: 'SS1',
  },
];

initAnalytics();
initDemo();

const navToggle = document.querySelector('[data-nav-toggle]');
const navBackdrop = document.querySelector('[data-nav-backdrop]');
const siteNav = document.querySelector('.site-nav');

function closeNav() {
  document.body.classList.remove('nav-open');
  if (navToggle) {
    navToggle.setAttribute('aria-expanded', 'false');
  }
}

function openNav() {
  document.body.classList.add('nav-open');
  if (navToggle) {
    navToggle.setAttribute('aria-expanded', 'true');
  }
}

if (navToggle) {
  navToggle.addEventListener('click', () => {
    const isOpen = document.body.classList.contains('nav-open');
    if (isOpen) {
      closeNav();
    } else {
      openNav();
    }
  });
}

if (navBackdrop) {
  navBackdrop.addEventListener('click', closeNav);
}

if (siteNav) {
  siteNav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', closeNav);
  });
}

function bindTrackedClicks(selector, eventName) {
  document.querySelectorAll(selector).forEach((el) => {
    el.addEventListener('click', () => {
      const location = el.getAttribute('data-location') || 'unknown';
      trackEvent(eventName, { location });
    });
  });
}

function fallbackCopy(text) {
  if (typeof document === 'undefined' || !document.body) return false;
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'absolute';
  textarea.style.left = '-9999px';
  document.body.appendChild(textarea);
  textarea.select();
  let copied = false;
  try {
    copied = document.execCommand('copy');
  } catch (err) {
    copied = false;
  }
  textarea.remove();
  return copied;
}

bindTrackedClicks('[data-event="install"]', 'install_click');
bindTrackedClicks('[data-event="pro"]', 'pro_cta_click');

const yearSpan = document.querySelector('[data-current-year]');
if (yearSpan) {
  yearSpan.textContent = String(new Date().getFullYear());
}

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    closeNav();
  }
});

const heroPill = document.querySelector('[data-hero-pill]');
if (heroPill) {
  const defaultLabel = heroPill.textContent?.trim() || '*I';
  let resetTimer = null;

  heroPill.addEventListener('click', async () => {
    const text = formatSegmentsToI(HERO_SEGMENTS);
    if (!text) return;

    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      window.dispatchEvent(
        new CustomEvent('demo:clipboard', {
          detail: { text, source: 'hero' },
        }),
      );
    }

    let copied = false;
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      try {
        await navigator.clipboard.writeText(text);
        copied = true;
      } catch (err) {
        copied = fallbackCopy(text);
      }
    } else {
      copied = fallbackCopy(text);
    }

    if (copied) {
      heroPill.classList.add('pill-i--success');
      heroPill.textContent = 'Copied';
      window.clearTimeout(resetTimer);
      resetTimer = window.setTimeout(() => {
        heroPill.classList.remove('pill-i--success');
        heroPill.textContent = defaultLabel;
      }, 1500);
      trackEvent('hero_copy', { location: 'hero' });
    }
  });
}
