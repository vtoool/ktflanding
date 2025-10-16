import { itinerary } from './demo-data.js';
import { formatSegmentsToI } from './demo-formatter.js';

const icons = {
  planeUp: `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M21 9.5c0-.83-.67-1.5-1.5-1.5-.2 0-.4.04-.58.12L14 10 7.41 3.41A2 2 0 0 0 6 2.83H5c-.55 0-1 .45-1 1 0 .27.11.52.29.71L9 9l-4.5 1.5-1.72-.86c-.16-.08-.33-.12-.5-.12-.55 0-1 .45-1 1 0 .38.21.72.55.89L6 14v3l-1.38.69c-.38.19-.62.59-.62 1.02 0 .64.52 1.16 1.16 1.16h.3c.18 0 .36-.04.52-.12L8 18l6.5-3 4.6-1.53c.81-.27 1.4-1.03 1.4-1.9V9.5Z"/></svg>`,
  planeDown: `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M21 14.5c0 .83-.67 1.5-1.5 1.5-.2 0-.4-.04-.58-.12L14 14l-6.59 6.59A2 2 0 0 1 6 21.17H5c-.55 0-1-.45-1-1 0-.27.11-.52.29-.71L9 15l-4.5-1.5-1.72.86c-.16.08-.33.12-.5.12-.55 0-1-.45-1-1 0-.38.21-.72.55-.89L6 10V7l-1.38-.69A1.16 1.16 0 0 1 4 5.29V4.5C4 3.67 4.67 3 5.5 3h.3c.18 0 .36.04.52.12L8 6l6.5 3 4.6 1.53c.81.27 1.4 1.03 1.4 1.9v2.07Z"/></svg>`,
  wifi: `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M12 18.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Zm7.07-6.43a1 1 0 0 0-1.36-.04 9.01 9.01 0 0 0-12.42 0 1 1 0 0 0-1.36.04 1 1 0 0 0 .04 1.41 10.99 10.99 0 0 1 15.06 0 1 1 0 0 0 1.36-1.41Zm-3.54 3.54a1 1 0 0 0-1.36-.03 4.51 4.51 0 0 0-6.34 0 1 1 0 0 0-1.36.03 1 1 0 0 0 .03 1.41 6.49 6.49 0 0 1 9 0 1 1 0 1 0 1.36-1.41Z"/></svg>`,
  bag: `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M16 6h-1V5a3 3 0 0 0-6 0v1H8a2 2 0 0 0-2 2v10a3 3 0 0 0 3 3h6a3 3 0 0 0 3-3V8a2 2 0 0 0-2-2Zm-5-1a1 1 0 0 1 2 0v1h-2V5Zm5 13a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V9h8v9Z"/></svg>`,
  seat: `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M7 3a2 2 0 0 0-2 2v7a4 4 0 0 0 4 4h5v3a2 2 0 0 0 2 2h3v-2a2 2 0 0 0-2-2h-1v-3h-3V5a2 2 0 0 0-2-2H7Zm2 2h3v9H9a2 2 0 0 1-2-2V5a0 0 0 0 1 0 0Z"/></svg>`,
  power: `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M11 2a1 1 0 0 0-1 1v8a1 1 0 1 0 2 0V3a1 1 0 0 0-1-1Zm5.66 2.34a1 1 0 0 0-1.32 1.5 7 7 0 1 1-6.68 0 1 1 0 1 0-1.32-1.5 9 9 0 1 0 9.32 0Z"/></svg>`,
  chevron: `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="m9 6 6 6-6 6"/></svg>`,
  clock: `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M12 2a10 10 0 1 0 10 10A10.01 10.01 0 0 0 12 2Zm0 2a8 8 0 1 1-8 8 8 8 0 0 1 8-8Zm-.5 3v5.38l4.34 2.51.75-1.3-3.59-2.08V7Z"/></svg>`,
};

const amenityLabels = {
  wifi: 'Wi-Fi available',
  bag: 'Checked bag included',
  seat: 'Seat selection included',
  power: 'In-seat power',
};

const itineraryOrder = [
  { key: 'outbound', label: 'Depart' },
  { key: 'inbound', label: 'Return' },
];

document.addEventListener('DOMContentLoaded', () => {
  itineraryOrder.forEach(({ key, label }) => {
    const card = document.querySelector(`[data-itinerary="${key}"]`);
    if (!card) return;
    const data = itinerary[key];
    if (!data) return;

    renderCard(card, data, label);
  });
});

function renderCard(card, data, directionLabel) {
  const dateEl = card.querySelector('[data-leg-date]');
  if (dateEl) {
    dateEl.textContent = data.headerDate;
  }

  const durationEl = card.querySelector('[data-leg-duration]');
  if (durationEl) {
    const minutes = computeTotalMinutes(data.segments);
    const computed = formatDuration(minutes);
    const display = data.totalDuration || computed;
    durationEl.textContent = display;
    durationEl.dataset.computedDuration = computed;
  }

  const list = card.querySelector('[data-segment-list]');
  if (list) {
    list.innerHTML = '';
    data.segments.forEach((segment) => {
      const item = segment.layover ? renderLayover(segment) : renderSegment(segment);
      list.appendChild(item);
    });
  }

  const button = card.querySelector('[data-action="format"]');
  const textarea = card.querySelector('[data-output-text]');
  const output = card.querySelector('[data-output]');
  const toast = card.querySelector('[data-toast]');
  const copy = card.querySelector('[data-copy]');

  if (button && textarea && output && copy) {
    const flightSegments = data.segments.filter((segment) => !segment.layover);
    button.addEventListener('click', () => {
      const formatted = formatSegmentsToI(flightSegments, {
        direction: directionLabel,
      });
      textarea.value = formatted;
      output.hidden = false;
      textarea.focus();
      button.setAttribute('aria-expanded', 'true');
    });

    copy.addEventListener('click', async () => {
      if (!textarea.value) return;
      try {
        await navigator.clipboard.writeText(textarea.value);
        showToast(toast);
      } catch (err) {
        console.error('Clipboard copy failed', err);
      }
    });
  }
}

function renderSegment(segment) {
  const item = document.createElement('li');
  item.className = 'segment';

  const timeline = document.createElement('div');
  timeline.className = 'segment__timeline';
  timeline.setAttribute('aria-hidden', 'true');
  timeline.innerHTML = `
    <span class="segment__node segment__node--depart">${icons.planeUp}</span>
    <span class="segment__line"></span>
    <span class="segment__node segment__node--arrive">${icons.planeDown}</span>
  `;

  const content = document.createElement('div');
  content.className = 'segment__content';

  const meta = document.createElement('div');
  meta.className = 'segment__meta';
  meta.innerHTML = `
    <span class="segment__badge">${segment.carrierName} ${segment.flightNumber}</span>
    <span class="segment__badge">${segment.equipment}</span>
  `;

  const details = document.createElement('div');
  details.className = 'segment__details';

  const departCol = document.createElement('div');
  departCol.className = 'segment__col';
  departCol.innerHTML = `
    <p class="segment__time">${segment.depart.time}</p>
    <p class="segment__place">${segment.depart.airport} • ${segment.depart.iata}</p>
  `;

  const middleCol = document.createElement('div');
  middleCol.className = 'segment__col';
  middleCol.innerHTML = `<span class="segment__duration">${segment.duration}</span>`;

  if (segment.overnight || (segment.arrive && segment.depart && segment.arrive.date !== segment.depart.date)) {
    const overnightBadge = document.createElement('span');
    overnightBadge.className = 'segment__overnight';
    overnightBadge.textContent = 'Overnight flight';
    middleCol.appendChild(overnightBadge);
  }

  const arriveCol = document.createElement('div');
  arriveCol.className = 'segment__col';
  arriveCol.innerHTML = `
    <p class="segment__time">${segment.arrive.time}</p>
    <p class="segment__place">${segment.arrive.airport} • ${segment.arrive.iata}</p>
  `;

  if (segment.arrive && segment.depart && segment.arrive.date !== segment.depart.date) {
    const note = document.createElement('p');
    note.className = 'segment__arrival-note';
    note.textContent = `Arrives ${segment.arrive.date}`;
    arriveCol.appendChild(note);
  }

  details.append(departCol, middleCol, arriveCol);

  const extras = document.createElement('div');
  extras.className = 'segment__extras';

  const amenities = document.createElement('div');
  amenities.className = 'segment__amenities';

  Object.entries(segment.amenities || {}).forEach(([key, enabled]) => {
    if (!enabled) return;
    const span = document.createElement('span');
    span.className = 'amenity';
    span.tabIndex = 0;
    const label = amenityLabels[key] || key;
    span.setAttribute('role', 'img');
    span.setAttribute('aria-label', label);
    span.setAttribute('title', label);
    span.innerHTML = icons[key] || '';
    amenities.appendChild(span);
  });

  const chevron = document.createElement('span');
  chevron.className = 'segment__chevron';
  chevron.setAttribute('aria-hidden', 'true');
  chevron.innerHTML = icons.chevron;

  extras.append(amenities, chevron);

  content.append(meta, details, extras);

  item.append(timeline, content);
  return item;
}

function renderLayover(segment) {
  const item = document.createElement('li');
  item.className = 'segment segment--layover';

  const timeline = document.createElement('div');
  timeline.className = 'segment__timeline';
  timeline.setAttribute('aria-hidden', 'true');
  timeline.innerHTML = '<span class="segment__line"></span>';

  const text = document.createElement('div');
  text.className = 'layover';
  text.innerHTML = `${icons.clock}<span>${segment.text}</span>`;

  item.append(timeline, text);
  return item;
}

function computeTotalMinutes(segments) {
  return segments.reduce((total, segment) => {
    if (segment.layover) {
      const durationText = segment.text.split('•')[0].trim();
      return total + parseDuration(durationText);
    }
    return total + parseDuration(segment.duration || '0m');
  }, 0);
}

function parseDuration(text) {
  const matchHours = text.match(/(\d+)h/);
  const matchMinutes = text.match(/(\d+)m/);
  const hours = matchHours ? parseInt(matchHours[1], 10) : 0;
  const minutes = matchMinutes ? parseInt(matchMinutes[1], 10) : 0;
  return hours * 60 + minutes;
}

function formatDuration(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (!minutes) {
    return `${hours}h`;
  }
  return `${hours}h ${minutes}m`;
}

function showToast(toast) {
  if (!toast) return;
  toast.hidden = false;
  toast.classList.add('is-visible');
  clearTimeout(toast._timeoutId);
  toast._timeoutId = setTimeout(() => {
    toast.classList.remove('is-visible');
    toast.hidden = true;
  }, 2000);
}
