const carrierCodeMap = {
  Lufthansa: 'LH',
};

const bookingClassMap = {
  Lufthansa: {
    economy: 'K',
    premium: 'N',
    business: 'J',
    first: 'A',
  },
};

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const WEEKDAYS = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];

export function formatSegmentsToI(segments, options = {}) {
  if (!Array.isArray(segments) || !segments.length) {
    return '';
  }

  return segments
    .map((segment, index) => formatSegment(segment, index + 1, options))
    .join('\n');
}

function formatSegment(segment, index, options) {
  const carrierCode = segment.carrierCode || carrierCodeMap[segment.carrierName] || '--';
  const bookingClass = getBookingClass(segment);
  const departDate = parseDate(segment.depart?.date);
  const arriveDate = parseDate(segment.arrive?.date);

  const datePart = departDate ? `${pad2(departDate.getUTCDate())}${MONTHS[departDate.getUTCMonth()]}` : '------';
  const weekday = departDate ? WEEKDAYS[departDate.getUTCDay()] : '--';
  const departTime = formatTimeForSabre(segment.depart?.time);
  const arrivalTime = formatArrivalTime(segment.arrive?.time, departDate, arriveDate);
  const arrivalNote = buildArrivalNote(departDate, arriveDate);

  const departIata = segment.depart?.iata || '----';
  const arriveIata = segment.arrive?.iata || '----';

  const baseLine = `${index} ${carrierCode} ${segment.flightNumber}${bookingClass} ${datePart} ${weekday} ${departIata}${arriveIata}*SS1  ${departTime}  ${arrivalTime}`;

  const suffixParts = [];
  if (arrivalNote) {
    suffixParts.push(arrivalNote);
  }
  if (segment.equipment) {
    suffixParts.push(`/EQ ${segment.equipment}`);
  }
  suffixParts.push('/E');

  const suffix = suffixParts.join(' ');

  if (options?.trim === false) {
    return `${baseLine} ${suffix}`;
  }

  return `${baseLine} ${suffix}`.trim();
}

function getBookingClass(segment) {
  const carrier = bookingClassMap[segment.carrierName];
  const cabin = (segment.cabin || 'economy').toLowerCase();
  if (carrier && carrier[cabin]) {
    return carrier[cabin];
  }
  return 'Y';
}

function parseDate(value) {
  if (!value) return null;
  const parts = value.replace(',', '').split(' ');
  if (parts.length < 3) return null;
  const [, month, day] = parts;
  const monthIndex = MONTHS.findIndex((m) => m.startsWith(month.toUpperCase().slice(0, 3)));
  if (monthIndex === -1) return null;
  const dayNumber = parseInt(day, 10);
  if (Number.isNaN(dayNumber)) return null;
  // Use 2025 so weekday strings align with prompt dates.
  return new Date(Date.UTC(2025, monthIndex, dayNumber));
}

function formatTimeForSabre(time) {
  if (!time) return '----';
  const [rawTime, periodRaw] = time.split(' ');
  if (!rawTime || !periodRaw) return time.toUpperCase();
  const [hourStr, minuteStr] = rawTime.split(':');
  let hour = parseInt(hourStr, 10);
  const minutes = parseInt(minuteStr || '0', 10);
  const period = periodRaw.trim().toUpperCase();
  if (period === 'AM' && hour === 12) {
    hour = 0;
  } else if (period === 'PM' && hour !== 12) {
    hour += 12;
  }
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  const digits = `${hour12}${pad2(minutes)}`;
  const suffix = period[0];
  return `${digits}${suffix}`;
}

function formatArrivalTime(time, departDate, arriveDate) {
  const formatted = formatTimeForSabre(time);
  if (!departDate || !arriveDate) return formatted;
  const diffDays = dayDiff(departDate, arriveDate);
  if (diffDays > 0) {
    return `${formatted}+${diffDays}`;
  }
  return formatted;
}

function buildArrivalNote(departDate, arriveDate) {
  if (!departDate || !arriveDate) return '';
  const diffDays = dayDiff(departDate, arriveDate);
  if (diffDays <= 0) return '';
  const datePart = `${pad2(arriveDate.getUTCDate())}${MONTHS[arriveDate.getUTCMonth()]}`;
  const weekday = WEEKDAYS[arriveDate.getUTCDay()];
  return `/ARR ${datePart} ${weekday}`;
}

function dayDiff(start, end) {
  const diff = (end - start) / (1000 * 60 * 60 * 24);
  return Math.round(diff);
}

function pad2(value) {
  return String(value).padStart(2, '0');
}
