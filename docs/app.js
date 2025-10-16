import { initAnalytics, trackEvent } from './analytics.js';
import { initDemo } from './demo.js';

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
