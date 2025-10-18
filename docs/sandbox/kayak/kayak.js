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

  let timelineRowIndex = 1;

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
    date: null,
    note: departNote,
  }, timelineRowIndex);
  timeline.appendChild(departEvent);

  const departRow = timelineRowIndex;
  timelineRowIndex += 1;

  const timelineDuration = document.createElement('div');
  timelineDuration.className = 'timeline-duration';
  const durationChip = createChip(segment.duration);
  durationChip.classList.add('duration-chip');
  timelineDuration.appendChild(durationChip);
  timelineDuration.style.gridColumn = '2 / span 2';
  timelineDuration.style.gridRow = String(timelineRowIndex);
  timeline.appendChild(timelineDuration);

  timelineRowIndex += 1;

  const arriveNote = (segment.arrive.date && segment.arrive.date !== segment.depart.date)
    ? `Arrives ${segment.arrive.date}`
    : null;

  const arriveEvent = createTimelineEvent({
    type: 'arrive',
    time: segment.arrive.time,
    city: segment.arrive.airport,
    code: segment.arrive.iata,
    date: null,
    note: arriveNote,
  }, timelineRowIndex);
  timeline.appendChild(arriveEvent);

  const arriveRow = timelineRowIndex;
  timelineRowIndex += 1;

  const connector = createTimelineConnector(departRow, arriveRow);
  timeline.appendChild(connector);

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

function createTimelineEvent({ type, time, city, code, date, note }, rowIndex) {
  const event = document.createElement('div');
  event.className = `timeline-event timeline-event--${type}`;

  const rail = document.createElement('div');
  rail.className = `timeline-event__rail timeline-event__rail--${type}`;
  rail.style.gridRow = String(rowIndex);

  const dot = document.createElement('span');
  dot.className = `timeline-dot timeline-dot--${type}`;
  dot.setAttribute('aria-hidden', 'true');
  rail.appendChild(dot);

  const timeEl = document.createElement('div');
  timeEl.className = 'timeline-event__time';
  timeEl.textContent = time || '';
  timeEl.style.gridRow = String(rowIndex);

  const detail = document.createElement('div');
  detail.className = 'timeline-event__detail';
  detail.style.gridRow = String(rowIndex);

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

  event.appendChild(rail);
  event.appendChild(timeEl);
  event.appendChild(detail);
  return event;
}

function createTimelineConnector(startRow, endRow) {
  const connector = document.createElement('div');
  connector.className = 'timeline-connector';
  connector.setAttribute('aria-hidden', 'true');
  connector.style.gridColumn = '1';
  connector.style.gridRowStart = String(startRow);
  connector.style.gridRowEnd = String(endRow + 1);

  const line = document.createElement('span');
  line.className = 'timeline-connector__line';
  connector.appendChild(line);

  const plane = createPlaneIcon();
  plane.classList.add('timeline-connector__plane');
  connector.appendChild(plane);

  return connector;
}

function createPlaneIcon() {
  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('viewBox', '0 0 200 200');
  svg.setAttribute('focusable', 'false');
  svg.setAttribute('aria-hidden', 'true');

  const path = document.createElementNS(svgNS, 'path');
  path.setAttribute(
    'd',
    'M178.081 41.973c-2.681 2.663-16.065 17.416-28.956 30.221c0 107.916 3.558 99.815-14.555 117.807l-14.358-60.402l-14.67-14.572c-38.873 38.606-33.015 8.711-33.015 45.669c.037 8.071-3.373 13.38-8.263 18.237L50.66 148.39l-30.751-13.513c10.094-10.017 15.609-8.207 39.488-8.207c8.127-16.666 18.173-23.81 26.033-31.62L70.79 80.509L10 66.269c17.153-17.039 6.638-13.895 118.396-13.895c12.96-12.873 26.882-27.703 29.574-30.377c7.745-7.692 28.017-14.357 31.205-11.191c3.187 3.166-3.349 23.474-11.094 31.167zm-13.674 42.469l-8.099 8.027v23.58c17.508-17.55 21.963-17.767 8.099-31.607zm-48.125-47.923c-13.678-13.652-12.642-10.828-32.152 8.57h23.625l8.527-8.57z'
  );
  svg.appendChild(path);

  return svg;
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
