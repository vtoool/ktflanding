const DAY_OF_WEEK_CODE = {
  SUN: 'A',
  MON: 'B',
  TUE: 'C',
  WED: 'D',
  THU: 'Q',
  FRI: 'F',
  SAT: 'J',
};

const MONTH_CODE = {
  JAN: 'JAN',
  FEB: 'FEB',
  MAR: 'MAR',
  APR: 'APR',
  MAY: 'MAY',
  JUN: 'JUN',
  JUL: 'JUL',
  AUG: 'AUG',
  SEP: 'SEP',
  OCT: 'OCT',
  NOV: 'NOV',
  DEC: 'DEC',
};

function parseDateParts(raw) {
  if (!raw) return null;
  const text = String(raw).trim();
  if (!text) return null;
  const [weekdayPart = '', rest = ''] = text.split(',');
  const weekday = weekdayPart.trim().slice(0, 3).toUpperCase();
  const restParts = rest.trim().split(/\s+/);
  const month = (restParts[0] || '').slice(0, 3).toUpperCase();
  const dayNumber = restParts[1] ? restParts[1].padStart(2, '0') : '';
  return {
    day: dayNumber,
    month: MONTH_CODE[month] || month,
    dowCode: DAY_OF_WEEK_CODE[weekday] || weekday.charAt(0) || '',
  };
}

function formatDateToken(parts) {
  if (!parts) return '';
  if (parts.day && parts.month) {
    return `${parts.day}${parts.month}`;
  }
  return parts.day || parts.month || '';
}

function formatGdsTime(raw) {
  if (!raw) return '';
  const text = String(raw).trim();
  const match = text.match(/^(\d{1,2}):(\d{2})\s*([ap]m)$/i);
  if (!match) {
    return text.toUpperCase();
  }
  let hour = parseInt(match[1], 10);
  const minute = match[2];
  const period = match[3][0].toUpperCase();
  if (!Number.isFinite(hour) || hour <= 0) {
    hour = 12;
  } else if (hour > 12) {
    hour -= 12;
  }
  const hourToken = String(hour === 0 ? 12 : hour);
  return `${hourToken}${minute}${period}`.replace(/^0+(\d)/, '$1');
}

export function formatSegmentsToI(segments) {
  const lines = [];
  let index = 1;
  for (const segment of segments) {
    if (!segment || segment.layover) continue;

    const departParts = parseDateParts(segment.depart?.date);
    const arriveParts = parseDateParts(segment.arrive?.date);
    const departToken = formatDateToken(departParts);
    const departDow = departParts?.dowCode ? departParts.dowCode : '';
    const arriveToken = formatDateToken(arriveParts);
    const arriveDow = arriveParts?.dowCode ? arriveParts.dowCode : '';
    const times = [
      formatGdsTime(segment.depart?.time),
      formatGdsTime(segment.arrive?.time),
    ].filter(Boolean);

    const includeArrivalDate = Boolean(
      departToken && arriveToken && departToken !== arriveToken,
    );

    const parts = [
      String(index),
      'LH',
      `${segment.flightNumber || ''}J`.trim(),
      departToken,
      departDow,
      `${segment.depart?.iata || ''}${segment.arrive?.iata || ''}*SS1`,
      ...times,
    ];

    if (includeArrivalDate) {
      parts.push(arriveToken);
      if (arriveDow) {
        parts.push(arriveDow);
      }
    }

    parts.push('/DCLH', '/E');

    lines.push(parts.filter(Boolean).join(' '));
    index += 1;
  }

  return lines.join('\n');
}
