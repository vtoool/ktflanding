const CABIN_FALLBACK_BOOKING = {
  FIRST: 'F',
  BUSINESS: 'J',
  PREMIUM: 'N',
  ECONOMY: 'Y',
};

const DOW_CODE = { SUN: 'S', MON: 'M', TUE: 'T', WED: 'W', THU: 'Q', FRI: 'F', SAT: 'J' };
const MONTH_INDEX = { JAN: 0, FEB: 1, MAR: 2, APR: 3, MAY: 4, JUN: 5, JUL: 6, AUG: 7, SEP: 8, OCT: 9, NOV: 10, DEC: 11 };
const DAY_MS = 24 * 60 * 60 * 1000;

function minutesToGds(mins) {
  if (!Number.isFinite(mins)) return '';
  const normalized = ((mins % (24 * 60)) + (24 * 60)) % (24 * 60);
  const hour = Math.floor(normalized / 60);
  const minute = normalized % 60;
  const period = hour >= 12 ? 'P' : 'A';
  let hourToken = hour % 12;
  if (hourToken === 0) {
    hourToken = 12;
  }
  const hourStr = String(hourToken).padStart(2, '0');
  const minuteStr = String(minute).padStart(2, '0');
  return `${hourStr}${minuteStr}${period}`;
}

function formatGdsTime(value) {
  if (!value) return '';
  const trimmed = String(value).trim();
  if (/^00(\d{2}[AP])$/i.test(trimmed)) {
    return trimmed.replace(/^00/, '12');
  }
  return trimmed.replace(/^0+(\d)/, '$1');
}

function toCabinKey(cabin) {
  return cabin ? String(cabin).trim().toUpperCase() : '';
}

export function getZonedDateTimeParts(isoString, timeZone) {
  const date = new Date(isoString);
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    weekday: 'short',
  });
  const parts = formatter.formatToParts(date).reduce((acc, part) => {
    acc[part.type] = part.value;
    return acc;
  }, {});

  const month = (parts.month || '').slice(0, 3).toUpperCase();
  const day = parts.day || '';
  const weekday = (parts.weekday || '').slice(0, 3).toUpperCase();
  const year = parseInt(parts.year || '', 10);
  const hour = parseInt(parts.hour || '0', 10);
  const minute = parseInt(parts.minute || '0', 10);
  const period = (parts.dayPeriod || '').toUpperCase();
  const displayTime = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
  const displayDate = new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'short',
    month: 'short',
    day: '2-digit',
  }).format(date);

  const minutesSinceMidnight = (() => {
    if (Number.isNaN(hour) || Number.isNaN(minute)) return null;
    let hh = hour % 12;
    if (period === 'PM') {
      hh += 12;
    }
    if (period === 'AM' && hour === 12) {
      hh = 0;
    }
    return hh * 60 + minute;
  })();

  return {
    month,
    day,
    weekday,
    dowCode: DOW_CODE[weekday] || '',
    gdsTime: minutesToGds(minutesSinceMidnight),
    displayTime,
    displayDate,
    minutesSinceMidnight,
    instant: date,
    year: Number.isFinite(year) ? year : null,
    monthIndex: Object.prototype.hasOwnProperty.call(MONTH_INDEX, month) ? MONTH_INDEX[month] : null,
    dayNumber: day ? parseInt(day, 10) : null,
  };
}

export function calculateArrivalOffset(depParts, arrParts, depIso, arrIso) {
  if (
    depParts &&
    arrParts &&
    Number.isFinite(depParts.year) &&
    Number.isFinite(arrParts.year) &&
    Number.isFinite(depParts.dayNumber) &&
    Number.isFinite(arrParts.dayNumber) &&
    depParts.monthIndex != null &&
    arrParts.monthIndex != null
  ) {
    const depDate = new Date(Date.UTC(depParts.year, depParts.monthIndex, depParts.dayNumber));
    const arrDate = new Date(Date.UTC(arrParts.year, arrParts.monthIndex, arrParts.dayNumber));
    const diff = Math.round((arrDate.getTime() - depDate.getTime()) / DAY_MS);
    if (diff === 0) return '';
    return diff > 0 ? `+${diff}` : String(diff);
  }

  if (depIso && arrIso) {
    const dep = new Date(depIso);
    const arr = new Date(arrIso);
    const diffDays = Math.round((arr.getTime() - dep.getTime()) / DAY_MS);
    if (diffDays === 0) return '';
    return diffDays > 0 ? `+${diffDays}` : String(diffDays);
  }

  return '';
}

function formatDateToken(parts) {
  if (!parts) return '';
  if (parts.day && parts.month && parts.dowCode) {
    return `${parts.day}${parts.month} ${parts.dowCode}`;
  }
  if (parts.day && parts.month) {
    return `${parts.day}${parts.month}`;
  }
  return parts.day || parts.month || '';
}

function resolveBookingClass(segment, opts) {
  const { forceShortFirstAsBusiness = false } = opts || {};
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

function formatFlightDesignator(carrier, flightNumber, bookingClass) {
  const sanitizedNumber = String(flightNumber || '').trim();
  if (!carrier) return `${sanitizedNumber}${bookingClass}`.trim();
  if (sanitizedNumber.length < 4) {
    return `${carrier} ${sanitizedNumber}${bookingClass}`.trim();
  }
  return `${carrier}${sanitizedNumber}${bookingClass}`.trim();
}

export function formatSegmentsToI(segments, options = {}) {
  if (!Array.isArray(segments)) return '';
  const lines = [];
  segments.forEach((segment, index) => {
    if (!segment || !segment.departure || !segment.arrival) return;
    const carrier = (segment.marketingCarrier || segment.airlineCode || 'XX').toUpperCase();
    const flightNumber = segment.flightNumber || segment.number || '';
    const bookingClass = resolveBookingClass(segment, options);
    const departureParts = getZonedDateTimeParts(segment.departure.iso, segment.departure.timeZone);
    const arrivalParts = getZonedDateTimeParts(segment.arrival.iso, segment.arrival.timeZone);
    const segNumber = String(index + 1).padStart(2, ' ');
    const dateToken = formatDateToken(departureParts);
    const status = segment.status ? String(segment.status).trim().toUpperCase() : 'SS1';
    const cityField = `${segment.departure.airport}${segment.arrival.airport}*${status}`;
    const depTime = formatGdsTime(departureParts.gdsTime);
    const arrTime = formatGdsTime(arrivalParts.gdsTime);
    const pieces = [
      segNumber,
      formatFlightDesignator(carrier, flightNumber, bookingClass),
      dateToken,
      cityField,
      depTime,
      arrTime,
    ];

    const arrivalOffset = calculateArrivalOffset(departureParts, arrivalParts, segment.departure.iso, segment.arrival.iso);
    if (arrivalOffset) {
      pieces.push(arrivalOffset);
    }

    pieces.push(`/DC${carrier}`);
    if (segment.eticketable !== false) {
      pieces.push('/E');
    }

    const simulateCodeshare = options.simulateCodeshare === true;
    if (simulateCodeshare && segment.codeshare && segment.codeshare.code) {
      const cs = segment.codeshare;
      const opName = cs.name ? ` ${cs.name}` : '';
      const opFlight = cs.flightNumber ? ` ${cs.flightNumber}` : '';
      pieces.push(`//OPERATED BY ${cs.code}${opFlight}${opName}`);
    } else if (segment.operatingCarrier && segment.operatingCarrier !== carrier) {
      const opName = segment.operatingCarrierName ? ` ${segment.operatingCarrierName}` : '';
      pieces.push(`//OPERATED BY ${segment.operatingCarrier}${opName}`);
    }

    if (segment.freeText) {
      pieces.push(String(segment.freeText));
    }

    lines.push(pieces.join(' '));
  });
  return lines.join('\n');
}
