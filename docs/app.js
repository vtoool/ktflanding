const root = document.documentElement;
const themeToggle = document.getElementById('themeToggle');
const storedTheme = localStorage.getItem('flight-snap-theme');
const menuToggle = document.getElementById('menuToggle');
const primaryNav = document.getElementById('primaryNav');
const navBackdrop = document.querySelector('[data-nav-backdrop]');

if (storedTheme) {
  root.setAttribute('data-theme', storedTheme);
  themeToggle?.setAttribute('aria-pressed', storedTheme === 'dark');
}

themeToggle?.addEventListener('click', () => {
  const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  root.setAttribute('data-theme', next);
  localStorage.setItem('flight-snap-theme', next);
  themeToggle.setAttribute('aria-pressed', next === 'dark');
});

const closeNav = () => {
  if (!menuToggle || !primaryNav) return;
  menuToggle.classList.remove('is-active');
  menuToggle.setAttribute('aria-expanded', 'false');
  primaryNav.classList.remove('is-open');
  navBackdrop?.classList.remove('is-active');
  document.body.classList.remove('nav-open');
};

const openNav = () => {
  if (!menuToggle || !primaryNav) return;
  menuToggle.classList.add('is-active');
  menuToggle.setAttribute('aria-expanded', 'true');
  primaryNav.classList.add('is-open');
  navBackdrop?.classList.add('is-active');
  document.body.classList.add('nav-open');
};

menuToggle?.addEventListener('click', () => {
  if (!primaryNav) return;
  const shouldOpen = !primaryNav.classList.contains('is-open');
  if (shouldOpen) {
    openNav();
  } else {
    closeNav();
  }
});

navBackdrop?.addEventListener('click', closeNav);

primaryNav?.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', closeNav);
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && primaryNav?.classList.contains('is-open')) {
    closeNav();
  }
});

const desktopQuery = window.matchMedia('(min-width: 901px)');
const handleDesktopChange = (event) => {
  if (event.matches) {
    closeNav();
  }
};

if (desktopQuery.addEventListener) {
  desktopQuery.addEventListener('change', handleDesktopChange);
} else if (desktopQuery.addListener) {
  desktopQuery.addListener(handleDesktopChange);
}

const year = document.getElementById('year');
if (year) {
  year.textContent = new Date().getFullYear();
}

const toastContainer = document.querySelector('.toast-container');
const showToast = (message) => {
  if (!toastContainer) return;
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(12px)';
    setTimeout(() => toast.remove(), 300);
  }, 2800);
};

const itineraries = [
  {
    id: 'atl-ist',
    airline: 'Turkish Airlines',
    flight: 'TK 032 · Nonstop',
    cabin: 'Business',
    departure: { time: '9:50 PM', airport: 'ATL' },
    arrival: { time: '3:40 PM +1', airport: 'IST' },
    duration: '9h 50m',
    layover: 'Nonstop · Airbus A350',
    fare: 'J · Flexible',
    commands: {
      itinerary: {
        command: '*I',
        body: '1 TK 032J 04JUN ATLIST SS1 950P 340P+1 /DCTK /E'
      },
      availability: {
        command: '*A 15OCT LAXMEL /C',
        body: '*A 15OCT LAXMEL /C\n  1 TK   10 C9 D9 J9 Y9 B9 M9 W9  LAXIST  1325  1010+1  333\n  2 TK   94 C9 D7 J4 Y9 B9 M9 W8  ISTMEL  0205  2120   77W'
      },
      vi: {
        command: 'VI*',
        body: 'EQP 333 · WIFI AVAILABLE\nELAPSED TIME 15H 55M\nMILEAGE 9212\nCABIN BUSINESS\nMEAL SERVED DINNER/BREAKFAST'
      },
      names: {
        command: 'NM',
        body: ' 1. SMITH/EMMA MRS\n 2. SMITH/OWEN MR'
      }
    }
  },
  {
    id: 'jfk-zrh-bcn',
    airline: 'Swiss International Air Lines',
    flight: 'LX 019 · 1 stop',
    cabin: 'Premium Economy',
    departure: { time: '7:55 PM', airport: 'JFK' },
    arrival: { time: '1:20 PM +1', airport: 'BCN' },
    duration: '11h 25m',
    layover: 'Connect in ZRH · 1h 45m',
    fare: 'E · Semi-flex',
    commands: {
      itinerary: {
        command: '*I',
        body: '1 LX 019W 12SEP JFKZRH SS1 755P 930A+1 /DCLX /E\n2 LX 195W 13SEP ZRHBCN SS1 1115A 120P /DCLX /E'
      },
      availability: {
        command: '*A 12SEP JFKBCN /W',
        body: '*A 12SEP JFKBCN /W\n  1 LX 019  W4 E4 N4  JFKZRH  1955  0930+1  77W\n     LX 195  W4 E4 N2  ZRHBCN  1115  1320    220'
      },
      vi: {
        command: 'VI*',
        body: 'SEG 1 EQP 77W  WIFI YES\nSEG 1 ELAPSED 7H 35M\nSEG 2 EQP 220  WIFI NO\nTOTAL ELAPSED 11H 25M\nCABIN PREMIUM ECONOMY'
      },
      names: {
        command: 'NM',
        body: ' 1. RODRIGUEZ/MARTA MS\n 2. JONES/CAMERON MR\n 3. CHO/MINSU MR'
      }
    }
  },
  {
    id: 'sfo-nrt-sin',
    airline: 'Japan Airlines + Singapore Airlines',
    flight: 'JL 001 · 1 stop',
    cabin: 'First',
    departure: { time: '1:35 PM', airport: 'SFO' },
    arrival: { time: '12:10 AM +2', airport: 'SIN' },
    duration: '20h 35m',
    layover: 'Stop in NRT · 2h 25m',
    fare: 'F · Fully flex',
    commands: {
      itinerary: {
        command: '*I',
        body: '1 JL 001F 18NOV SFONRT SS1 135P 505P+1 /DCJL /E\n2 SQ 633F 19NOV NRTSIN SS1 730P 1210A+1 /DCSQ /E'
      },
      availability: {
        command: '*A 18NOV SFOSIN /F',
        body: '*A 18NOV SFOSIN /F\n  1 JL 001  F2 A2 J9  SFONRT  1335  1705+1  77W\n     SQ 633  F2 A1 R1  NRTSIN  1930  0010+1  77W'
      },
      vi: {
        command: 'VI*',
        body: 'SEG 1 EQP 77W  SUITES YES\nSEG 1 ELAPSED 10H 30M\nSEG 2 EQP 77W  SUITES YES\nTOTAL ELAPSED 20H 35M\nMILEAGE 8423'
      },
      names: {
        command: 'NM',
        body: ' 1. LEE/SHARON MS\n 2. WILCOX/JAMAL MR'
      }
    }
  }
];

let currentIndex = 0;
let randomizeInterval;

const selectors = {
  airline: document.querySelector('[data-airline]'),
  flight: document.querySelector('[data-flight]'),
  cabin: document.querySelector('[data-cabin]'),
  departureTime: document.querySelector('[data-departure-time]'),
  departureAirport: document.querySelector('[data-departure-airport]'),
  arrivalTime: document.querySelector('[data-arrival-time]'),
  arrivalAirport: document.querySelector('[data-arrival-airport]'),
  duration: document.querySelector('[data-duration]'),
  layover: document.querySelector('[data-layover]'),
  fare: document.querySelector('[data-fare-basis]')
};

const renderItinerary = (index) => {
  const data = itineraries[index];
  if (!data) return;
  selectors.airline.textContent = data.airline;
  selectors.flight.textContent = data.flight;
  selectors.cabin.textContent = data.cabin;
  selectors.departureTime.textContent = data.departure.time;
  selectors.departureAirport.textContent = data.departure.airport;
  selectors.arrivalTime.textContent = data.arrival.time;
  selectors.arrivalAirport.textContent = data.arrival.airport;
  selectors.duration.textContent = data.duration;
  selectors.layover.textContent = data.layover;
  selectors.fare.textContent = data.fare;
};

renderItinerary(currentIndex);

const randomizeToggle = document.getElementById('randomizeToggle');

const startRandomize = () => {
  randomizeInterval = setInterval(() => {
    const next = Math.floor(Math.random() * itineraries.length);
    currentIndex = next === currentIndex ? (next + 1) % itineraries.length : next;
    renderItinerary(currentIndex);
    showToast('Switched to a new itinerary');
  }, 6000);
};

const stopRandomize = () => {
  if (randomizeInterval) {
    clearInterval(randomizeInterval);
    randomizeInterval = undefined;
  }
};

randomizeToggle?.addEventListener('change', (event) => {
  if (event.target.checked) {
    currentIndex = (currentIndex + 1) % itineraries.length;
    renderItinerary(currentIndex);
    startRandomize();
    showToast('Randomize on');
  } else {
    stopRandomize();
    showToast('Randomize off');
  }
});

const modal = document.getElementById('sandboxModal');
const modalDialog = modal?.querySelector('.modal-dialog');
const modalTitle = document.getElementById('modalTitle');
const modalCommand = document.getElementById('modalCommand');
const modalBody = document.getElementById('modalBody');
const copyModal = document.getElementById('copyModal');
let lastFocused;
let focusableElements = [];

const setModalContent = (type) => {
  const data = itineraries[currentIndex];
  if (!data) return;
  const payload = data.commands[type];
  if (!payload) return;
  modalTitle.textContent = type === 'itinerary' ? 'Sabre-style *I output' : type === 'availability' ? 'Availability display' : type === 'vi' ? 'VI* verbose detail' : 'Passenger names';
  modalCommand.textContent = payload.command;
  modalBody.textContent = payload.body;
};

const trapFocus = (event) => {
  if (!modal.classList.contains('is-open')) return;
  if (event.key !== 'Tab') return;
  const first = focusableElements[0];
  const last = focusableElements[focusableElements.length - 1];
  if (event.shiftKey) {
    if (document.activeElement === first) {
      event.preventDefault();
      last.focus();
    }
  } else if (document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
};

const openModal = (type) => {
  setModalContent(type);
  modal.classList.add('is-open');
  modal.setAttribute('aria-hidden', 'false');
  root.classList.add('modal-open');
  lastFocused = document.activeElement;
  focusableElements = Array.from(modal.querySelectorAll('button, [href], [tabindex]:not([tabindex="-1"])')).filter((el) => !el.hasAttribute('disabled'));
  focusableElements[0]?.focus();
  document.addEventListener('keydown', handleKeyDown);
  document.addEventListener('keydown', trapFocus);
};

const closeModal = () => {
  modal.classList.remove('is-open');
  modal.setAttribute('aria-hidden', 'true');
  root.classList.remove('modal-open');
  document.removeEventListener('keydown', handleKeyDown);
  document.removeEventListener('keydown', trapFocus);
  focusableElements = [];
  lastFocused?.focus();
};

const handleKeyDown = (event) => {
  if (event.key === 'Escape') {
    closeModal();
  }
};

document.querySelectorAll('[data-modal-trigger]')?.forEach((button) => {
  button.addEventListener('click', () => {
    const type = button.dataset.modalTrigger;
    openModal(type);
  });
});

modal?.addEventListener('click', (event) => {
  if (event.target.hasAttribute('data-close')) {
    closeModal();
  }
});

copyModal?.addEventListener('click', async () => {
  const text = modalBody.textContent;
  try {
    await navigator.clipboard.writeText(text);
    showToast('Copied to clipboard');
  } catch (error) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'absolute';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      showToast('Copied to clipboard');
    } catch (err) {
      showToast('Press Ctrl+C to copy');
    }
    document.body.removeChild(textarea);
  }
});

const availabilityButton = document.querySelector('[data-modal-trigger="availability"]');
const itineraryButton = document.querySelector('[data-modal-trigger="itinerary"]');
const viButton = document.querySelector('[data-modal-trigger="vi"]');
const namesButton = document.querySelector('[data-modal-trigger="names"]');

const addHoverPreview = (button, message) => {
  if (!button) return;
  button.setAttribute('title', message);
};

addHoverPreview(itineraryButton, 'Preview the *I command for this itinerary');
addHoverPreview(availabilityButton, 'View the availability command and display');
addHoverPreview(viButton, 'Open VI* verbose segment data');
addHoverPreview(namesButton, 'Copy demo passenger names');

const rotateModalContent = () => {
  const data = itineraries[currentIndex];
  if (!data) return;
  Object.keys(data.commands).forEach((key) => {
    const trigger = document.querySelector(`[data-modal-trigger="${key}"]`);
    if (!trigger && key !== 'names') return;
  });
};

rotateModalContent();

window.addEventListener('focus', () => {
  if (randomizeToggle?.checked && !randomizeInterval) {
    startRandomize();
  }
});

window.addEventListener('blur', () => {
  if (randomizeToggle?.checked) {
    stopRandomize();
  }
});

const proCheckoutButton = document.getElementById('proPlanCheckout');
const checkoutHelper = document.getElementById('checkoutHelper');
const paddleConfig = window.flightSnapPaddleConfig ?? {};
const isConfiguredValue = (value) =>
  typeof value === 'string' && value.trim().length > 0 && !value.includes('replace_with');

const paddleConfigured = isConfiguredValue(paddleConfig.token) && isConfiguredValue(paddleConfig.priceId);
let paddleReady = false;

const initializePaddle = () => {
  if (!paddleConfigured) return;

  if (typeof Paddle === 'undefined' || typeof Paddle.Initialize !== 'function') {
    console.warn('Paddle checkout library not available.');
    return;
  }

  try {
    const environment = typeof paddleConfig.environment === 'string' ? paddleConfig.environment.toLowerCase() : '';
    if (environment && environment !== 'production' && typeof Paddle.Environment?.set === 'function') {
      Paddle.Environment.set(environment);
    }

    Paddle.Initialize({
      token: paddleConfig.token,
      eventCallback: (event) => console.log('[Paddle]', event)
    });

    paddleReady = true;
    window.flightSnapPaddleReady = true;
  } catch (error) {
    console.error('Failed to initialize Paddle checkout.', error);
    showToast('Checkout unavailable. Please try again later.');
  }
};

if (paddleConfigured) {
  if (document.readyState === 'complete') {
    initializePaddle();
  } else {
    window.addEventListener('load', initializePaddle, { once: true });
  }

  const paddleItems = [{ priceId: paddleConfig.priceId, quantity: 1 }];

  proCheckoutButton?.addEventListener('click', (event) => {
    if (!paddleReady) {
      event.preventDefault();
      initializePaddle();
      showToast('Checkout is starting up. Please try again in a moment.');
      return;
    }

    if (typeof Paddle === 'undefined' || !Paddle?.Checkout?.open) {
      event.preventDefault();
      console.warn('Paddle checkout is not available.');
      showToast('Checkout unavailable. Please try again.');
      return;
    }

    try {
      Paddle.Checkout.open({ items: paddleItems });
    } catch (error) {
      console.error('Failed to open Paddle checkout.', error);
      showToast('Checkout unavailable. Please try again.');
    }
  });

  checkoutHelper?.setAttribute('hidden', '');
} else {
  proCheckoutButton?.classList.add('is-disabled');
  proCheckoutButton?.setAttribute('aria-disabled', 'true');
  checkoutHelper?.removeAttribute('hidden');

  proCheckoutButton?.addEventListener('click', (event) => {
    event.preventDefault();
    showToast('Add your Paddle token and price ID to enable checkout.');
  });
}
