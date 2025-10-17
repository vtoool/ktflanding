import { itinerary } from './kayak-data.js';
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

const cards = [
  { label: 'Depart', data: itinerary.outbound, key: 'outbound' },
  { label: 'Return', data: itinerary.inbound, key: 'inbound' }
];

for (const cardConfig of cards) {
  itineraryContainer.appendChild(buildCard(cardConfig.label, cardConfig.data, cardConfig.key));
}

function buildCard(label, data, locationKey) {
  const card = document.createElement('article');
  card.className = 'itinerary-card';

  const header = document.createElement('header');
  header.className = 'card-header';

  const titleWrap = document.createElement('div');
  titleWrap.className = 'card-title';

  const strong = document.createElement('strong');
  strong.textContent = `${label} · ${data.headerDate}`;
  titleWrap.appendChild(strong);

  const flightSegments = data.segments.filter(segment => !segment.layover);

  const duration = document.createElement('div');
  duration.className = 'card-duration';
  duration.textContent = data.totalDuration;

  header.appendChild(titleWrap);
  header.appendChild(duration);
  card.appendChild(header);

  const pill = document.createElement('button');
  pill.type = 'button';
  pill.className = 'pill-i';
  pill.textContent = '*I';
  pill.setAttribute('aria-label', `Copy ${label.toLowerCase()} *I lines`);
  card.appendChild(pill);

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');
  toast.textContent = 'Copied';
  card.appendChild(toast);

  const legs = document.createElement('div');
  legs.className = 'legs';

  let flightIndex = 0;
  const lastFlightIndex = flightSegments.length - 1;

  for (const segment of data.segments) {
    if (segment.layover) {
      legs.appendChild(buildLayover(segment));
      continue;
    }
    const leg = buildLeg(segment, flightIndex, lastFlightIndex);
    legs.appendChild(leg);
    flightIndex += 1;
  }

  card.appendChild(legs);

  pill.addEventListener('click', async () => {
    const text = formatSegmentsToI(data.segments);
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
      showToast(toast);
      trackEvent('demo_copy', { location: locationKey });
    }
  });

  return card;
}

function buildLeg(segment, index, lastIndex) {
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

  const logo = document.createElement('img');
  logo.className = 'airline-logo';
  logo.src = itinerary.logoLH;
  logo.alt = `${segment.carrierName} logo`;
  badges.appendChild(logo);

  const carrierChip = createChip(`${segment.carrierName} ${segment.flightNumber}`);
  badges.appendChild(carrierChip);

  if (segment.equipment) {
    const equipmentChip = createChip(segment.equipment);
    equipmentChip.classList.add('hollow');
    badges.appendChild(equipmentChip);
  }

  main.appendChild(badges);

  const times = document.createElement('div');
  times.className = 'times';

  const departColumn = document.createElement('div');
  const departTime = document.createElement('div');
  departTime.className = 'bigtime';
  departTime.textContent = segment.depart.time;
  const departPlace = document.createElement('div');
  departPlace.className = 'place';
  departPlace.textContent = `${segment.depart.airport} (${segment.depart.iata})`;
  departColumn.appendChild(departTime);
  departColumn.appendChild(departPlace);

  const arriveColumn = document.createElement('div');
  const arriveTime = document.createElement('div');
  arriveTime.className = 'bigtime';
  arriveTime.textContent = segment.arrive.time;
  const arrivePlace = document.createElement('div');
  arrivePlace.className = 'place';
  arrivePlace.textContent = `${segment.arrive.airport} (${segment.arrive.iata})`;
  arriveColumn.appendChild(arriveTime);
  arriveColumn.appendChild(arrivePlace);

  if (segment.arrive.date && segment.arrive.date !== segment.depart.date) {
    const arriveNote = document.createElement('div');
    arriveNote.className = 'arrives-note';
    arriveNote.textContent = `Arrives ${segment.arrive.date}`;
    arriveColumn.appendChild(arriveNote);
  }

  times.appendChild(departColumn);
  times.appendChild(arriveColumn);
  main.appendChild(times);

  const extra = document.createElement('div');
  extra.className = 'extra';

  const durationChip = createChip(segment.duration);
  extra.appendChild(durationChip);

  main.appendChild(extra);

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

  const caret = document.createElement('span');
  caret.className = 'icon-btn caret';
  caret.textContent = '›';
  amenities.appendChild(caret);

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

function createChip(text) {
  const chip = document.createElement('span');
  chip.className = 'chip';
  chip.textContent = text;
  return chip;
}

function showToast(toast) {
  toast.classList.add('is-visible');
  clearTimeout(toast.hideTimer);
  toast.hideTimer = setTimeout(() => {
    toast.classList.remove('is-visible');
  }, 1500);
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
