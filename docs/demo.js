import { SCENARIOS } from './demo-data.js';
import { formatSegmentsDetailed, getZonedDateTimeParts, calculateArrivalOffset } from './demo-formatter.js';
import { trackEvent } from './analytics.js';

const CABIN_FALLBACK_BOOKING = {
  FIRST: 'F',
  BUSINESS: 'J',
  PREMIUM: 'N',
  ECONOMY: 'Y',
};

function formatPlace(point) {
  if (!point) return '';
  const city = point.city ? String(point.city).trim() : '';
  const airport = point.airport ? String(point.airport).trim() : '';
  if (city && airport) {
    return `${city} (${airport})`;
  }
  return city || airport;
}

function toTitleCase(value) {
  if (!value) return '';
  return String(value)
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1).toLowerCase()}`)
    .join(' ');
}

function toCabinKey(cabin) {
  return cabin ? String(cabin).trim().toUpperCase() : '';
}

function resolveBookingClass(segment) {
  let bookingClass = segment.bookingClass ? String(segment.bookingClass).trim().toUpperCase() : '';
  const durationMinutes = Number.isFinite(segment.durationMinutes) ? segment.durationMinutes : null;
  const cabinKey = toCabinKey(segment.cabin);

  if (!bookingClass && cabinKey && CABIN_FALLBACK_BOOKING[cabinKey]) {
    bookingClass = CABIN_FALLBACK_BOOKING[cabinKey];
  }

  if (!bookingClass) {
    bookingClass = CABIN_FALLBACK_BOOKING.ECONOMY;
  }

  return bookingClass;
}

function formatDuration(minutes) {
  if (!Number.isFinite(minutes)) return '';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

function buildSegmentNode(segment, index) {
  const depParts = getZonedDateTimeParts(segment.departure.iso, segment.departure.timeZone);
  const arrParts = getZonedDateTimeParts(segment.arrival.iso, segment.arrival.timeZone);
  const bookingClass = resolveBookingClass(segment);
  const arrivalOffset = calculateArrivalOffset(depParts, arrParts, segment.departure.iso, segment.arrival.iso);
  const duration = formatDuration(segment.durationMinutes);
  const departurePlace = formatPlace(segment.departure);
  const arrivalPlace = formatPlace(segment.arrival);
  const marketingLabel = `${segment.marketingCarrier || ''} ${segment.flightNumber || ''}`.trim();
  const srArrivalOffset = (() => {
    if (!arrivalOffset) return '';
    const numeric = parseInt(arrivalOffset, 10);
    if (Number.isNaN(numeric)) return '';
    if (numeric > 0) {
      return `Arrives ${numeric === 1 ? 'one day later' : `${numeric} days later`}`;
    }
    if (numeric < 0) {
      const value = Math.abs(numeric);
      return `Arrives ${value === 1 ? 'one day earlier' : `${value} days earlier`}`;
    }
    return '';
  })();
  const operatedBy = (() => {
    if (segment.operatingCarrier && segment.operatingCarrier !== segment.marketingCarrier) {
      const code = segment.operatingCarrier;
      return `Operated by ${code}${segment.operatingCarrierName ? ` · ${segment.operatingCarrierName}` : ''}`;
    }
    return '';
  })();
  const arrivalNote = (() => {
    if (srArrivalOffset) return srArrivalOffset;
    if (depParts?.displayDate && arrParts?.displayDate && depParts.displayDate !== arrParts.displayDate) {
      return `Arrives ${arrParts.displayDate}`;
    }
    return '';
  })();
  const wrapper = document.createElement('div');
  wrapper.className = 'leg segment';
  wrapper.setAttribute('data-segment-index', String(index + 1));
  const cabinLabel = toTitleCase(segment.cabin);
  const badgeLabels = [marketingLabel || 'Flight TBD', segment.aircraft ? `Equipment ${segment.aircraft}` : 'Equipment TBD'];
  if (operatedBy) {
    badgeLabels.push(operatedBy);
  }
  const badgesHtml = badgeLabels
    .filter(Boolean)
    .map((badge) => `<span class="chip">${badge}</span>`)
    .join('');
  const extraChips = [];
  if (duration) {
    extraChips.push(`<span class="chip hollow">${duration}</span>`);
  }
  if (cabinLabel) {
    extraChips.push(`<span class="chip hollow">Cabin ${cabinLabel}</span>`);
  }
  if (bookingClass) {
    extraChips.push(`<span class="chip hollow">Class ${bookingClass}</span>`);
  }
  wrapper.innerHTML = `
    <div class="rail" aria-hidden="true">
      <span class="dot takeoff"></span>
      <span class="line"></span>
      <span class="dot landing"></span>
    </div>
    <div class="leg-main">
      <div class="badges">${badgesHtml}</div>
      <div class="times">
        <div class="col">
          <div class="bigtime">${depParts.displayTime || ''}</div>
          <div class="place">${departurePlace || segment.departure.airport || ''}</div>
          ${depParts.displayDate ? `<div class="date">${depParts.displayDate}</div>` : ''}
        </div>
        <div class="col">
          <div class="bigtime">${arrParts.displayTime || ''}${srArrivalOffset ? `<span class="sr-only">${srArrivalOffset}</span>` : ''}</div>
          <div class="place">${arrivalPlace || segment.arrival.airport || ''}</div>
          ${arrParts.displayDate ? `<div class="date">${arrParts.displayDate}</div>` : ''}
          ${arrivalNote ? `<div class="arrives-note">${arrivalNote}</div>` : ''}
        </div>
      </div>
      ${extraChips.length ? `<div class="extra">${extraChips.join('')}</div>` : ''}
      <div class="amenities" aria-label="Amenities">
        <button class="icon-btn" type="button" aria-label="Wi-Fi" title="Wi-Fi">✓</button>
        <button class="icon-btn" type="button" aria-label="Baggage" title="Baggage">✓</button>
        <button class="icon-btn" type="button" aria-label="Seat" title="Seat">✓</button>
        <button class="icon-btn" type="button" aria-label="Power" title="Power">✓</button>
        <button class="icon-btn caret" type="button" aria-label="More details" title="More">▾</button>
      </div>
    </div>
  `;

  const preview = document.createElement('div');
  preview.className = 'segment__line-preview';
  preview.innerHTML = `
    <span class="segment__line-number" aria-hidden="true">${index + 1}</span>
    <code class="segment__line-text" data-line-text></code>
    <button class="segment__line-copy" type="button" data-copy-line aria-label="Copy *I line ${index + 1}">Copy line</button>
    <span class="segment__line-note" data-line-note hidden></span>
  `;

  const copyButton = preview.querySelector('[data-copy-line]');
  if (copyButton) {
    copyButton.dataset.defaultLabel = 'Copy line';
    copyButton.dataset.copiedLabel = 'Copied!';
    copyButton.dataset.errorLabel = 'Copy failed';
    copyButton.disabled = true;
  }

  const main = wrapper.querySelector('.leg-main');
  if (main) {
    main.appendChild(preview);
  } else {
    wrapper.appendChild(preview);
  }
  return wrapper;
}

function buildLayoverNode(text) {
  const node = document.createElement('div');
  node.className = 'layover';
  const layoverText = document.createElement('div');
  layoverText.className = 'layover-text';
  layoverText.textContent = text;
  node.appendChild(layoverText);
  return node;
}

function setCopyButtonFeedback(button, label, { revert = true } = {}) {
  if (!button) return;
  clearTimeout(button._feedbackTimer);
  button.textContent = label;
  if (revert) {
    button._feedbackTimer = setTimeout(() => {
      if (!button.isConnected) return;
      const defaultLabel = button.dataset?.defaultLabel || 'Copy line';
      button.textContent = defaultLabel;
    }, 1800);
  }
}

function resetSegmentCopyButton(button) {
  if (!button) return;
  setCopyButtonFeedback(button, button.dataset?.defaultLabel || 'Copy line', { revert: false });
  button.disabled = true;
}

function setActiveSegment(root, target) {
  const segments = root.querySelectorAll('[data-segment-index]');
  segments.forEach((segmentEl) => {
    segmentEl.classList.toggle('segment--active', segmentEl === target);
  });
  root._activeSegment = target || null;
}

function clearSegmentPreviews(root) {
  const segments = root.querySelectorAll('[data-segment-index]');
  segments.forEach((segmentEl) => {
    segmentEl.classList.remove('segment--has-line');
    const lineText = segmentEl.querySelector('[data-line-text]');
    if (lineText) {
      lineText.textContent = '';
    }
    const note = segmentEl.querySelector('[data-line-note]');
    if (note) {
      note.textContent = '';
      note.hidden = true;
    }
    const copyButton = segmentEl.querySelector('[data-copy-line]');
    if (copyButton) {
      resetSegmentCopyButton(copyButton);
    }
  });
  root._defaultSegment = null;
  setActiveSegment(root, null);
}

function applySegmentPreviews(root, details) {
  clearSegmentPreviews(root);
  details.forEach((detail) => {
    const segmentEl = root.querySelector(`[data-segment-index="${detail.index}"]`);
    if (!segmentEl) return;
    const lineText = segmentEl.querySelector('[data-line-text]');
    if (lineText) {
      lineText.textContent = detail.line;
    }
    const note = segmentEl.querySelector('[data-line-note]');
    if (note) {
      if (detail.arrivalNote) {
        note.textContent = detail.arrivalNote;
        note.hidden = false;
      } else {
        note.textContent = '';
        note.hidden = true;
      }
    }
    const copyButton = segmentEl.querySelector('[data-copy-line]');
    if (copyButton) {
      copyButton.disabled = false;
      const defaultLabel = copyButton.dataset?.defaultLabel || 'Copy line';
      copyButton.textContent = defaultLabel;
    }
    segmentEl.classList.add('segment--has-line');
  });

  if (details.length) {
    const first = root.querySelector(`[data-segment-index="${details[0].index}"]`);
    root._defaultSegment = first || null;
    if (first) {
      setActiveSegment(root, first);
    }
  } else {
    root._defaultSegment = null;
    setActiveSegment(root, null);
  }
}

function renderScenario(root, state) {
  const scenario = SCENARIOS[state.scenarioKey];
  if (!scenario) return;

  const titleEl = root.querySelector('[data-scenario-name]');
  const metaEls = root.querySelectorAll('[data-scenario-meta]');
  const durationEl = root.querySelector('[data-total-duration]');
  const stopEls = root.querySelectorAll('[data-stop-summary]');
  const listEl = root.querySelector('[data-segment-list]');
  const routeEls = root.querySelectorAll('[data-itinerary-route]');
  const startEls = root.querySelectorAll('[data-itinerary-start]');
  const endEls = root.querySelectorAll('[data-itinerary-end]');
  const cardLabelEl = root.querySelector('[data-card-label]');

  const firstSegment = scenario.segments[0];
  const lastSegment = scenario.segments[scenario.segments.length - 1];
  const firstDepParts = firstSegment
    ? getZonedDateTimeParts(firstSegment.departure.iso, firstSegment.departure.timeZone)
    : null;
  const lastArrParts = lastSegment
    ? getZonedDateTimeParts(lastSegment.arrival.iso, lastSegment.arrival.timeZone)
    : null;
  const departurePlace = firstSegment ? formatPlace(firstSegment.departure) : '';
  const arrivalPlace = lastSegment ? formatPlace(lastSegment.arrival) : '';

  if (titleEl) titleEl.textContent = scenario.name;
  metaEls.forEach((el) => {
    el.textContent = scenario.meta;
  });
  if (durationEl) {
    const totalDuration = scenario.summary.duration || '';
    const cleaned = totalDuration
      .replace(/\b(total travel|door-to-door)\b/gi, '')
      .replace(/\s{2,}/g, ' ')
      .trim();
    durationEl.textContent = cleaned || totalDuration;
  }
  stopEls.forEach((el) => {
    el.textContent = scenario.summary.stops;
  });
  const routeText = (() => {
    if (departurePlace || arrivalPlace) {
      if (departurePlace && arrivalPlace) {
        return `${departurePlace} → ${arrivalPlace}`;
      }
      return departurePlace || arrivalPlace;
    }
    return '';
  })();
  routeEls.forEach((el) => {
    el.textContent = routeText;
  });
  startEls.forEach((el) => {
    el.textContent = firstDepParts
      ? `${firstDepParts.displayDate}${departurePlace ? ` · ${departurePlace}` : ''}`
      : '';
  });
  endEls.forEach((el) => {
    el.textContent = lastArrParts
      ? `${lastArrParts.displayDate}${arrivalPlace ? ` · ${arrivalPlace}` : ''}`
      : '';
  });
  if (cardLabelEl) {
    cardLabelEl.textContent = firstDepParts?.displayDate
      ? `Itinerary • ${firstDepParts.displayDate}`
      : 'Itinerary preview';
  }

  if (listEl) {
    listEl.innerHTML = '';
    scenario.segments.forEach((segment, index) => {
      const node = buildSegmentNode(segment, index);
      listEl.appendChild(node);
      if (segment.connectionText) {
        listEl.appendChild(buildLayoverNode(segment.connectionText));
      }
    });
  }

  clearSegmentPreviews(root);
}

function updateTabs(root, activeKey) {
  const tabs = root.querySelectorAll('[data-scenario-tab]');
  tabs.forEach((tab) => {
    const isActive = tab.getAttribute('data-scenario-tab') === activeKey;
    tab.classList.toggle('is-active', isActive);
    tab.setAttribute('aria-selected', String(isActive));
    tab.setAttribute('tabindex', isActive ? '0' : '-1');
  });
}

function showToast(toastEl, message) {
  if (!toastEl) return;
  toastEl.textContent = message;
  if (message) {
    setTimeout(() => {
      toastEl.textContent = '';
    }, 2500);
  }
}

export function initDemo() {
  const root = document.querySelector('[data-demo]');
  if (!root) return;

  const state = {
    scenarioKey: 'simple',
  };

  const toast = root.querySelector('[data-toast]');
  const clipboardOutput = root.querySelector('[data-clipboard-output]');
  const clipboardStatus = root.querySelector('[data-clipboard-status]');
  let clipboardTimer = null;

  function emitClipboard(text, detail = {}) {
    const value = typeof text === 'string' ? text : String(text ?? '');
    setClipboardDisplay(value);
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      window.dispatchEvent(
        new CustomEvent('demo:clipboard', {
          detail: { text: value, ...detail },
        }),
      );
    }
  }

  function setClipboardDisplay(text) {
    if (!clipboardOutput) return;
    const value = typeof text === 'string' ? text : String(text ?? '');
    clipboardOutput.textContent = value;
    clipboardOutput.dataset.empty = value ? 'false' : 'true';
    clipboardOutput.scrollTop = 0;
    if (!clipboardStatus) return;
    clearTimeout(clipboardTimer);
    if (value) {
      clipboardStatus.textContent = 'Copied ✓';
      clipboardStatus.classList.add('is-visible');
      clipboardTimer = setTimeout(() => {
        if (!clipboardStatus.isConnected) return;
        clipboardStatus.classList.remove('is-visible');
        clipboardStatus.textContent = '';
      }, 1800);
    } else {
      clipboardStatus.classList.remove('is-visible');
      clipboardStatus.textContent = '';
    }
  }

  if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
    window.addEventListener('demo:clipboard', (event) => {
      const text = event?.detail?.text ?? '';
      setClipboardDisplay(text);
    });
  }

  setClipboardDisplay('');

  updateTabs(root, state.scenarioKey);
  renderScenario(root, state);

  root.querySelectorAll('[data-scenario-tab]').forEach((tab) => {
    tab.addEventListener('click', () => {
      const key = tab.getAttribute('data-scenario-tab');
      if (!key || !SCENARIOS[key]) return;
      state.scenarioKey = key;
      updateTabs(root, state.scenarioKey);
      renderScenario(root, state);
    });
  });

  const generateButton = root.querySelector('[data-generate]');
  if (generateButton) {
    generateButton.addEventListener('click', () => {
      const scenario = SCENARIOS[state.scenarioKey];
      if (!scenario) return;
      const details = formatSegmentsDetailed(scenario.segments);
      applySegmentPreviews(root, details);
      trackEvent('demo_generate', {
        scenario: state.scenarioKey,
        segments: scenario.segments.length,
        location: 'demo',
      });
    });
  }

  root.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-copy-line]');
    if (!button || button.disabled) return;
    const segmentEl = button.closest('[data-segment-index]');
    if (!segmentEl) return;
    const lineText = segmentEl.querySelector('[data-line-text]');
    const value = lineText?.textContent?.trim();
    if (!value) return;
    emitClipboard(value, {
      scenario: state.scenarioKey,
      segment: segmentEl.getAttribute('data-segment-index') || null,
      source: 'segment',
    });

    try {
      await navigator.clipboard.writeText(value);
      setCopyButtonFeedback(button, button.dataset?.copiedLabel || 'Copied!');
      showToast(toast, 'Line copied');
      trackEvent('demo_copy_line', {
        scenario: state.scenarioKey,
        segment: segmentEl.getAttribute('data-segment-index'),
      });
    } catch (err) {
      setCopyButtonFeedback(button, button.dataset?.errorLabel || 'Copy failed');
    }
  });

  root.addEventListener('pointerenter', (event) => {
    const segmentEl = event.target.closest('[data-segment-index]');
    if (segmentEl) {
      setActiveSegment(root, segmentEl);
    }
  });

  root.addEventListener('pointerleave', (event) => {
    const segmentEl = event.target.closest('[data-segment-index]');
    if (segmentEl) {
      const defaultSegment = root._defaultSegment || null;
      setActiveSegment(root, defaultSegment);
    }
  });

  root.addEventListener('focusin', (event) => {
    const segmentEl = event.target.closest('[data-segment-index]');
    if (segmentEl) {
      setActiveSegment(root, segmentEl);
    }
  });

  root.addEventListener('focusout', () => {
    const activeElement = document.activeElement;
    if (!root.contains(activeElement)) {
      const defaultSegment = root._defaultSegment || null;
      setActiveSegment(root, defaultSegment);
    }
  });
}
