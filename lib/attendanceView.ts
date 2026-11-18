export type Rec = { id: string; gym_date: string; check_in_at: string; check_out_at: string | null; missed?: boolean | null };
export const minutesBetween = (a: string, b: string) => Math.max(0, Math.round((new Date(b).getTime() - new Date(a).getTime()) / 60000));
export const fmtDur = (m: number) => (m >= 60 ? `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, '0')}m` : `${m} min`);
export type Status = 'done' | 'inside' | 'missed';
export const statusOf = (r: Rec, today: string): Status => (r.check_out_at ? 'done' : r.missed || r.gym_date < today ? 'missed' : 'inside');
export function monthStats(rows: Rec[], today: string) {
  const ym = today.slice(0, 7);
  const m = rows.filter((r) => r.gym_date.startsWith(ym));
  const days = new Set(m.map((r) => r.gym_date));
  const mins = m.reduce((a, r) => a + (r.check_out_at ? minutesBetween(r.check_in_at, r.check_out_at) : 0), 0);
  return { visits: days.size, minutes: mins };
}
// last N calendar days (oldest first) with whether the member visited
export function lastDays(rows: Rec[], today: string, n = 14) {
  const set = new Set(rows.map((r) => r.gym_date));
  const base = new Date(today + 'T00:00:00Z');
  return Array.from({ length: n }).map((_, i) => { const d = new Date(base.getTime() - (n - 1 - i) * 864e5); const key = d.toISOString().slice(0, 10); return { key, label: ['S', 'M', 'T', 'W', 'T', 'F', 'S'][d.getUTCDay()], day: d.getUTCDate(), visited: set.has(key), isToday: key === today }; });
}
