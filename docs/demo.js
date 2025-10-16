import { SCENARIOS } from './demo-data.js';
import { formatSegmentsDetailed, getZonedDateTimeParts, calculateArrivalOffset } from './demo-formatter.js';
import { trackEvent } from './analytics.js';

const CABIN_FALLBACK_BOOKING = {
  FIRST: 'F',
  BUSINESS: 'J',
  PREMIUM: 'N',
  ECONOMY: 'Y',
};

function toCabinKey(cabin) {
  return cabin ? String(cabin).trim().toUpperCase() : '';
}

function resolveBookingClass(segment, options) {
  const { forceShortFirstAsBusiness } = options;
  let bookingClass = segment.bookingClass ? String(segment.bookingClass).trim().toUpperCase() : '';
  const durationMinutes = Number.isFinite(segment.durationMinutes) ? segment.durationMinutes : null;
  const cabinKey = toCabinKey(segment.cabin);

  if (forceShortFirstAsBusiness && cabinKey === 'FIRST' && Number.isFinite(durationMinutes) && durationMinutes < 360) {
    bookingClass = segment.businessFallbackClass || 'J';
  }

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

function buildSegmentNode(segment, index, options) {
  const depParts = getZonedDateTimeParts(segment.departure.iso, segment.departure.timeZone);
  const arrParts = getZonedDateTimeParts(segment.arrival.iso, segment.arrival.timeZone);
  const bookingClass = resolveBookingClass(segment, options);
  const arrivalOffset = calculateArrivalOffset(depParts, arrParts, segment.departure.iso, segment.arrival.iso);
  const duration = formatDuration(segment.durationMinutes);
  const layover = segment.connectionText;
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
    if (options.simulateCodeshare && segment.codeshare && segment.codeshare.code) {
      const cs = segment.codeshare;
      const code = cs.code + (cs.flightNumber ? ` ${cs.flightNumber}` : '');
      return `Operated by ${code}${cs.name ? ` · ${cs.name}` : ''}`;
    }
    if (segment.operatingCarrier && segment.operatingCarrier !== segment.marketingCarrier) {
      const code = segment.operatingCarrier;
      return `Operated by ${code}${segment.operatingCarrierName ? ` · ${segment.operatingCarrierName}` : ''}`;
    }
    return '';
  })();
  const wrapper = document.createElement('li');
  wrapper.className = 'segment';
  wrapper.setAttribute('data-segment-index', String(index + 1));
  wrapper.innerHTML = `
    <div class="segment__times">
      <div>
        <p class="segment__time">${depParts.displayTime}</p>
        <p class="segment__airport">${segment.departure.airport}</p>
      </div>
      <div class="segment__duration">${duration}</div>
      <div>
        <p class="segment__time">${arrParts.displayTime}${arrivalOffset ? ` <span aria-hidden="true">${arrivalOffset}</span>` : ''}${srArrivalOffset ? `<span class="sr-only">${srArrivalOffset}</span>` : ''}</p>
        <p class="segment__airport">${segment.arrival.airport}</p>
      </div>
    </div>
    <div class="segment__details">
      <span class="badge">${segment.marketingCarrier} ${segment.flightNumber} · Class ${bookingClass}</span>
      <span class="badge">${(segment.cabin || '').toString().replace(/(^|\s)([a-z])/g, (_, space, letter) => `${space}${letter.toUpperCase()}`) || 'Cabin N/A'}</span>
      <span class="badge">${segment.aircraft ? `Equipment ${segment.aircraft}` : 'Equipment TBD'}</span>
      ${operatedBy ? `<span class="badge">${operatedBy}</span>` : ''}
    </div>
    ${layover ? `<div class="segment__connections">${layover}</div>` : ''}
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

  wrapper.appendChild(preview);
  return wrapper;
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
  const options = {
    forceShortFirstAsBusiness: state.forceShortFirstAsBusiness,
    simulateCodeshare: state.simulateCodeshare,
  };

  const titleEl = root.querySelector('[data-scenario-name]');
  const metaEl = root.querySelector('[data-scenario-meta]');
  const durationEl = root.querySelector('[data-total-duration]');
  const stopEl = root.querySelector('[data-stop-summary]');
  const listEl = root.querySelector('[data-segment-list]');

  if (titleEl) titleEl.textContent = scenario.name;
  if (metaEl) metaEl.textContent = scenario.meta;
  if (durationEl) durationEl.textContent = scenario.summary.duration;
  if (stopEl) stopEl.textContent = scenario.summary.stops;

  if (listEl) {
    listEl.innerHTML = '';
    scenario.segments.forEach((segment, index) => {
      const node = buildSegmentNode(segment, index, options);
      listEl.appendChild(node);
    });
  }

  clearSegmentPreviews(root);

  const codeshareToggle = root.querySelector('[data-toggle="codeshare"]');
  if (codeshareToggle) {
    const hasCodeshare = scenario.segments.some((seg) => Boolean(seg.codeshare));
    codeshareToggle.disabled = !hasCodeshare;
    if (!hasCodeshare) {
      codeshareToggle.setAttribute('aria-disabled', 'true');
    } else {
      codeshareToggle.removeAttribute('aria-disabled');
    }
    codeshareToggle.parentElement?.classList.toggle('toggle--disabled', !hasCodeshare);
    if (!hasCodeshare && codeshareToggle.checked) {
      codeshareToggle.checked = false;
      state.simulateCodeshare = false;
    }
  }
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
    simulateCodeshare: false,
    forceShortFirstAsBusiness: false,
  };

  const outputWrapper = root.querySelector('[data-output-wrapper]');
  const outputField = root.querySelector('[data-demo-output]');
  const copyButton = root.querySelector('[data-copy]');
  const toast = root.querySelector('[data-toast]');

  updateTabs(root, state.scenarioKey);
  renderScenario(root, state);

  root.querySelectorAll('[data-scenario-tab]').forEach((tab) => {
    tab.addEventListener('click', () => {
      const key = tab.getAttribute('data-scenario-tab');
      if (!key || !SCENARIOS[key]) return;
      state.scenarioKey = key;
      updateTabs(root, state.scenarioKey);
      renderScenario(root, state);
      if (outputWrapper) {
        outputWrapper.hidden = true;
      }
      if (copyButton) {
        copyButton.disabled = true;
      }
      if (outputField) {
        outputField.value = '';
      }
    });
  });

  const codeshareToggle = root.querySelector('[data-toggle="codeshare"]');
  if (codeshareToggle) {
    codeshareToggle.addEventListener('change', () => {
      state.simulateCodeshare = codeshareToggle.checked;
      renderScenario(root, state);
      if (outputWrapper) {
        outputWrapper.hidden = true;
      }
      if (copyButton) {
        copyButton.disabled = true;
      }
      if (outputField) {
        outputField.value = '';
      }
    });
  }

  const firstToggle = root.querySelector('[data-toggle="first"]');
  if (firstToggle) {
    firstToggle.addEventListener('change', () => {
      state.forceShortFirstAsBusiness = firstToggle.checked;
      renderScenario(root, state);
      if (outputWrapper) {
        outputWrapper.hidden = true;
      }
      if (copyButton) {
        copyButton.disabled = true;
      }
      if (outputField) {
        outputField.value = '';
      }
    });
  }

  const generateButton = root.querySelector('[data-generate]');
  if (generateButton) {
    generateButton.addEventListener('click', () => {
      const scenario = SCENARIOS[state.scenarioKey];
      if (!scenario) return;
      const details = formatSegmentsDetailed(scenario.segments, {
        simulateCodeshare: state.simulateCodeshare,
        forceShortFirstAsBusiness: state.forceShortFirstAsBusiness,
      });
      const text = details.map((detail) => detail.line).join('\n');
      if (outputField) {
        outputField.value = text;
      }
      applySegmentPreviews(root, details);
      if (outputWrapper) {
        outputWrapper.hidden = false;
      }
      if (copyButton) {
        copyButton.disabled = !text;
      }
      trackEvent('demo_generate', {
        scenario: state.scenarioKey,
        segments: scenario.segments.length,
        location: 'demo',
      });
    });
  }

  if (copyButton && outputField) {
    copyButton.addEventListener('click', async () => {
      const value = outputField.value;
      if (!value) return;
      try {
        await navigator.clipboard.writeText(value);
        showToast(toast, 'Copied');
        trackEvent('demo_copy', {
          length: value.length,
          location: 'demo',
        });
      } catch (err) {
        showToast(toast, 'Copy failed');
      }
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
