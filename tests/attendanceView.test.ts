import test from 'node:test';
import assert from 'node:assert/strict';
import { fmtDur, lastDays, minutesBetween, monthStats, statusOf } from '../lib/attendanceView.ts';

const r = (d: string, i: string, o: string | null, missed = false) => ({ id: d + i, gym_date: d, check_in_at: i, check_out_at: o, missed });
test('duration', () => { assert.equal(minutesBetween('2026-11-02T06:00:00Z', '2026-11-02T07:28:00Z'), 88); assert.equal(fmtDur(88), '1h 28m'); assert.equal(fmtDur(45), '45 min'); });
test('status', () => {
  assert.equal(statusOf(r('2026-11-15', 'a', 'b'), '2026-11-15'), 'done');
  assert.equal(statusOf(r('2026-11-15', 'a', null), '2026-11-15'), 'inside');
  assert.equal(statusOf(r('2026-11-14', 'a', null), '2026-11-15'), 'missed'); // never checked out on a past day
  assert.equal(statusOf(r('2026-11-15', 'a', null, true), '2026-11-15'), 'missed');
});
test('month stats count distinct days and completed minutes only', () => {
  const rows = [r('2026-11-02', '2026-11-02T06:00:00Z', '2026-11-02T07:00:00Z'), r('2026-11-02', '2026-11-02T18:00:00Z', '2026-11-02T18:30:00Z'), r('2026-11-05', '2026-11-05T06:00:00Z', null), r('2026-10-30', '2026-10-30T06:00:00Z', '2026-10-30T07:00:00Z')];
  assert.deepEqual(monthStats(rows, '2026-11-15'), { visits: 2, minutes: 90 });
});
test('14 day strip ends today', () => { const d = lastDays([r('2026-11-15', 'a', 'b')], '2026-11-15'); assert.equal(d.length, 14); assert.ok(d[13].isToday && d[13].visited); assert.equal(d[0].key, '2026-11-02'); });
