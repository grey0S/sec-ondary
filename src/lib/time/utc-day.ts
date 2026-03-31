export function utcDayString(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

export function addDaysUtc(dayStr: string, delta: number): string {
  const [y, m, d] = dayStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + delta));
  return dt.toISOString().slice(0, 10);
}
