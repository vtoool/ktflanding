export function formatSegmentsToI(segments) {
  let n = 1, out = [];
  for (const s of segments) {
    if (s.layover) continue;
    const line = `${n} LH${s.flightNumber}J  04OCT J  ${s.depart.iata}${s.arrive.iata}*SS1  ${s.depart.time.toUpperCase()}  ${s.arrive.time.toUpperCase()} /E`;
    out.push(line); n++;
  }
  return out.join("\n");
}
