import { itinerary as defaultItinerary, longLayoverItinerary } from './kayak-data.js';
import { formatSegmentsToI } from './kayak-formatter.js';

const root = document.getElementById('kayak-root');
if (!root) {
  throw new Error('Kayak sandbox root not found');
}

document.getElementById('kayak-sandbox')?.classList.add('compact');
document.getElementById('kayak-sandbox')?.classList.add('compactStack');

const trackEvent = (typeof window !== 'undefined' && window.analytics && typeof window.analytics.trackEvent === 'function')
  ? window.analytics.trackEvent.bind(window.analytics)
  : () => {};

const itineraryContainer = document.createElement('div');
itineraryContainer.className = 'itinerary';
root.appendChild(itineraryContainer);

const state = {
  activeItinerary: null,
  scenarioKey: 'simple',
};

const scenarioMap = {
  simple: defaultItinerary,
  layover: longLayoverItinerary,
  multicity: defaultItinerary,
};

const updateClipboardSimulator = (() => {
  let statusTimer = null;
  return (text) => {
    const output = document.querySelector('[data-clipboard-output]');
    if (!output) return;
    let pre = output._clipboardPre;
    if (!pre || !pre.isConnected) {
      pre = document.createElement('pre');
      pre.dataset.clipboardPre = 'true';
      while (output.firstChild) {
        output.removeChild(output.firstChild);
      }
      output.appendChild(pre);
      output._clipboardPre = pre;
    }
    const status = document.querySelector('[data-clipboard-status]');
    const value = typeof text === 'string' ? text : String(text ?? '');
    pre.textContent = value;
    output.dataset.empty = value ? 'false' : 'true';
    output.scrollTop = 0;
    if (!status) return;
    window.clearTimeout(statusTimer);
    if (value) {
      status.textContent = 'Copied \u2713';
      status.classList.add('is-visible');
      statusTimer = window.setTimeout(() => {
        if (!status.isConnected) return;
        status.classList.remove('is-visible');
        status.textContent = '';
      }, 1800);
    } else {
      status.classList.remove('is-visible');
      status.textContent = '';
    }
  };
})();

applyScenario(state.scenarioKey);
setupScenarioListeners();

function applyScenario(key, { focusTab = false } = {}) {
  const nextKey = scenarioMap[key] ? key : 'simple';
  state.scenarioKey = nextKey;
  const itineraryData = scenarioMap[nextKey];
  renderItinerary(itineraryData);
  updateScenarioTabs(nextKey, { focusTab });
}

function renderItinerary(itineraryData) {
  if (!itineraryData) return;
  state.activeItinerary = itineraryData;
  updateSandboxHeader(itineraryData);

  itineraryContainer.innerHTML = '';

  const cards = [];
  if (itineraryData.outbound) {
    cards.push({
      label: itineraryData.outbound.label || 'Depart',
      data: itineraryData.outbound,
      key: 'outbound',
    });
  }
  if (itineraryData.inbound) {
    cards.push({
      label: itineraryData.inbound.label || 'Return',
      data: itineraryData.inbound,
      key: 'inbound',
    });
  }

  if (cards.length === 0) {
    return;
  }

  for (const cardConfig of cards) {
    itineraryContainer.appendChild(
      buildCard(cardConfig.label, cardConfig.data, cardConfig.key, itineraryData),
    );
  }
}

function setupScenarioListeners() {
  const tabs = Array.from(document.querySelectorAll('[data-scenario-tab]'));
  if (!tabs.length) return;

  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => {
      const key = tab.getAttribute('data-scenario-tab');
      if (!key) return;
      applyScenario(key, { focusTab: true });
    });

    tab.addEventListener('keydown', (event) => {
      if (event.defaultPrevented) return;
      const { key } = event;
      if (key !== 'ArrowRight' && key !== 'ArrowLeft' && key !== 'ArrowDown' && key !== 'ArrowUp') {
        return;
      }
      event.preventDefault();
      const direction = key === 'ArrowRight' || key === 'ArrowDown' ? 1 : -1;
      const nextIndex = (index + direction + tabs.length) % tabs.length;
      const nextTab = tabs[nextIndex];
      const nextKey = nextTab?.getAttribute('data-scenario-tab');
      if (!nextKey) return;
      applyScenario(nextKey, { focusTab: true });
    });
  });

  updateScenarioTabs(state.scenarioKey);
}

function updateScenarioTabs(activeKey, { focusTab = false } = {}) {
  const tabs = document.querySelectorAll('[data-scenario-tab]');
  tabs.forEach((tab) => {
    const key = tab.getAttribute('data-scenario-tab');
    const isActive = key === activeKey;
    tab.classList.toggle('is-active', isActive);
    tab.setAttribute('aria-selected', String(isActive));
    tab.setAttribute('tabindex', isActive ? '0' : '-1');
    if (isActive && focusTab) {
      tab.focus();
    }
  });
}

function updateSandboxHeader(itineraryData) {
  const sandbox = document.getElementById('kayak-sandbox');
  if (!sandbox) return;
  const title = sandbox.querySelector('.sandbox-title');
  if (title && itineraryData.title) {
    title.textContent = itineraryData.title;
  }
  const meta = sandbox.querySelector('.sandbox-meta');
  if (meta && itineraryData.meta) {
    meta.textContent = itineraryData.meta;
  }
}

function buildCard(label, data, locationKey, itineraryData) {
  const card = document.createElement('article');
  card.className = 'itinerary-card';

  const header = document.createElement('header');
  header.className = 'card-header';

  const titleWrap = document.createElement('div');
  titleWrap.className = 'card-title';

  const strong = document.createElement('strong');
  strong.textContent = `${label} · ${data.headerDate}`;
  titleWrap.appendChild(strong);

  const flightSegments = (data.segments || []).filter(segment => !segment.layover);

  const duration = document.createElement('div');
  duration.className = 'card-duration';
  duration.textContent = data.totalDuration;

  const meta = document.createElement('div');
  meta.className = 'card-meta';
  meta.appendChild(duration);

  let pill;
  if (locationKey === 'outbound') {
    const actions = document.createElement('div');
    actions.className = 'card-actions';

    pill = document.createElement('button');
    pill.type = 'button';
    pill.className = 'pill-i';
    pill.textContent = '*I';
    pill.setAttribute('aria-label', `Copy ${label.toLowerCase()} *I lines`);
    pill.dataset.defaultLabel = pill.textContent;
    pill.dataset.defaultAria = pill.getAttribute('aria-label') || '';

    actions.appendChild(pill);
    meta.appendChild(actions);
  }

  header.appendChild(titleWrap);
  header.appendChild(meta);
  card.appendChild(header);

  const legs = document.createElement('div');
  legs.className = 'legs';

  let flightIndex = 0;
  const lastFlightIndex = flightSegments.length - 1;
  let previousArrivalDate = null;

  for (const segment of data.segments || []) {
    if (segment.layover) {
      legs.appendChild(buildLayover(segment));
      continue;
    }
    const leg = buildLeg(segment, flightIndex, lastFlightIndex, itineraryData, previousArrivalDate);
    legs.appendChild(leg);
    flightIndex += 1;
    if (segment.arrive?.date) {
      previousArrivalDate = segment.arrive.date;
    }
  }

  card.appendChild(legs);

  if (pill) {
    pill.addEventListener('click', async () => {
      const text = getClipboardText(itineraryData);
      updateClipboardSimulator(text);
      if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
        window.dispatchEvent(
          new CustomEvent('demo:clipboard', {
            detail: { text, source: locationKey },
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
        showPillSuccess(pill);
        trackEvent('demo_copy', { location: locationKey });
      }
    });
  }

  return card;
}

function buildLeg(segment, index, lastIndex, itineraryData, previousArrivalDate) {
  const leg = document.createElement('div');
  leg.className = 'leg';

  const rail = document.createElement('div');
  rail.className = 'rail';

  const line = document.createElement('div');
  line.className = 'line';
  if (index === 0) {
    line.style.top = '24px';
  }
  if (index === lastIndex) {
    line.style.bottom = '24px';
  }

  const topDot = document.createElement('div');
  topDot.className = 'dot takeoff';
  const bottomDot = document.createElement('div');
  bottomDot.className = 'dot landing';

  rail.appendChild(line);
  rail.appendChild(topDot);
  rail.appendChild(bottomDot);
  leg.appendChild(rail);

  const main = document.createElement('div');
  main.className = 'leg-main';

  const badges = document.createElement('div');
  badges.className = 'badges';

  const logoUrl = segment.logo || itineraryData?.logoUrl || defaultItinerary.logoUrl || '';
  if (logoUrl) {
    const logo = document.createElement('img');
    logo.className = 'airline-logo';
    logo.loading = 'lazy';
    logo.alt = segment.carrierName || 'Airline';
    logo.src = logoUrl;
    logo.addEventListener('error', () => {
      if (!logo.isConnected) return;
      logo.replaceWith(createLogoFallback(segment.carrierName));
    });
    badges.appendChild(logo);
  } else {
    badges.appendChild(createLogoFallback(segment.carrierName));
  }

  const carrierChip = createChip(`${segment.carrierName} ${segment.flightNumber}`);
  badges.appendChild(carrierChip);

  if (segment.equipment) {
    const equipmentChip = createChip(segment.equipment);
    equipmentChip.classList.add('hollow');
    badges.appendChild(equipmentChip);
  }

  main.appendChild(badges);

  const timeline = document.createElement('div');
  timeline.className = 'timeline';

  const departNote = (
    segment.depart?.date &&
    previousArrivalDate &&
    previousArrivalDate !== segment.depart.date
  )
    ? `Departs ${segment.depart.date}`
    : null;

  const departEvent = createTimelineEvent({
    type: 'depart',
    time: segment.depart.time,
    city: segment.depart.airport,
    code: segment.depart.iata,
    date: departNote ? null : segment.depart?.date,
    note: departNote,
  });
  timeline.appendChild(departEvent);

  const timelineDuration = document.createElement('div');
  timelineDuration.className = 'timeline-duration';
  const durationChip = createChip(segment.duration);
  durationChip.classList.add('duration-chip');
  timelineDuration.appendChild(durationChip);
  timeline.appendChild(timelineDuration);

  const arriveNote = (segment.arrive.date && segment.arrive.date !== segment.depart.date)
    ? `Arrives ${segment.arrive.date}`
    : null;

  const arriveEvent = createTimelineEvent({
    type: 'arrive',
    time: segment.arrive.time,
    city: segment.arrive.airport,
    code: segment.arrive.iata,
    date: arriveNote ? null : segment.arrive?.date,
    note: arriveNote,
  });
  timeline.appendChild(arriveEvent);

  main.appendChild(timeline);

  const amenities = document.createElement('div');
  amenities.className = 'amenities';

  const amenityIcons = [
    { key: 'wifi', label: 'Wi-Fi', symbol: '📶' },
    { key: 'bag', label: 'Checked bag', symbol: '🧳' },
    { key: 'seat', label: 'Seat selection', symbol: '💺' },
    { key: 'power', label: 'Power', symbol: '🔌' }
  ];

  for (const amenity of amenityIcons) {
    if (!segment.amenities || !segment.amenities[amenity.key]) continue;
    const icon = document.createElement('span');
    icon.className = 'icon-btn';
    icon.setAttribute('title', amenity.label);
    icon.textContent = amenity.symbol;
    amenities.appendChild(icon);
  }

  if (segment.cabin) {
    const cabinLabel = createChip(segment.cabin);
    cabinLabel.classList.add('cabin-label');
    amenities.appendChild(cabinLabel);
  }

  leg.appendChild(main);
  leg.appendChild(amenities);

  return leg;
}

function buildLayover(segment) {
  const layover = document.createElement('div');
  layover.className = 'layover';

  const text = document.createElement('div');
  text.className = 'layover-text';
  text.textContent = segment.text;
  layover.appendChild(text);

  return layover;
}

function createLogoFallback(label) {
  const fallback = document.createElement('span');
  fallback.className = 'airline-logo airline-logo--fallback';
  fallback.textContent = label || 'Airline';
  return fallback;
}

function createChip(text) {
  const chip = document.createElement('span');
  chip.className = 'chip';
  chip.textContent = text;
  return chip;
}

function createCityLine(city, code) {
  const wrapper = document.createElement('span');
  wrapper.className = 'cityline';
  const cityText = city || '';
  if (cityText) {
    wrapper.appendChild(document.createTextNode(cityText));
  }
  if (code) {
    const codeSpan = document.createElement('span');
    codeSpan.className = 'cityline-code';
    const leadingSpace = cityText ? ' ' : '';
    codeSpan.textContent = `${leadingSpace}(${code})`;
    wrapper.appendChild(codeSpan);
  }
  return wrapper;
}

function createTimelineEvent({ type, time, city, code, date, note }) {
  const event = document.createElement('div');
  event.className = `timeline-event timeline-event--${type}`;

  const timeEl = document.createElement('div');
  timeEl.className = 'timeline-event__time';
  timeEl.textContent = time || '';
  event.appendChild(timeEl);

  const detail = document.createElement('div');
  detail.className = 'timeline-event__detail';

  const cityLine = createCityLine(city, code);
  cityLine.classList.add('timeline-cityline');
  detail.appendChild(cityLine);

  if (date) {
    const dateEl = document.createElement('div');
    dateEl.className = 'timeline-event__date';
    dateEl.textContent = date;
    detail.appendChild(dateEl);
  }

  if (note) {
    const noteEl = document.createElement('div');
    noteEl.className = type === 'arrive' ? 'arrives-note' : 'depart-note';
    noteEl.textContent = note;
    detail.appendChild(noteEl);
  }

  event.appendChild(detail);
  return event;
}

function getClipboardText(itineraryData) {
  if (!itineraryData) {
    return '';
  }
  if (typeof itineraryData.clipboardText === 'string') {
    return itineraryData.clipboardText;
  }
  const segments = [];
  if (Array.isArray(itineraryData.outbound?.segments)) {
    segments.push(...itineraryData.outbound.segments);
  }
  if (Array.isArray(itineraryData.inbound?.segments)) {
    segments.push(...itineraryData.inbound.segments);
  }
  return formatSegmentsToI(segments);
}

function showPillSuccess(pill) {
  if (!pill) return;
  const defaultLabel = pill.dataset.defaultLabel || '*I';
  const defaultAria = pill.dataset.defaultAria || pill.getAttribute('aria-label') || '';
  pill.classList.add('pill-i--success');
  pill.textContent = '✓';
  if (defaultAria) {
    pill.setAttribute('aria-label', 'Itinerary copied');
  }
  clearTimeout(pill._successTimer);
  pill._successTimer = setTimeout(() => {
    pill.classList.remove('pill-i--success');
    pill.textContent = defaultLabel;
    if (defaultAria) {
      pill.setAttribute('aria-label', defaultAria);
    }
  }, 1400);
}

function fallbackCopy(text) {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.top = '-9999px';
  document.body.appendChild(textarea);
  textarea.select();
  let success = false;
  try {
    success = document.execCommand('copy');
  } catch (err) {
    success = false;
  }
  document.body.removeChild(textarea);
  return success;
}
