// Calendar dates are plain YYYY-MM-DD strings in IST (the gym's timezone), same as the database's gym_today().
export const addDays = (ymd: string, n: number) => { const d = new Date(ymd + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
export const isoDow = (ymd: string) => { const w = new Date(ymd + 'T00:00:00Z').getUTCDay(); return w === 0 ? 7 : w; }; // Mon=1..Sun=7, as workout_plans.training_days
export const dayKind = (ymd: string, today: string): 'past' | 'today' | 'future' => (ymd < today ? 'past' : ymd > today ? 'future' : 'today');
export const strip = (center: string, before = 3, after = 10) => Array.from({ length: before + after + 1 }).map((_, i) => addDays(center, i - before));
