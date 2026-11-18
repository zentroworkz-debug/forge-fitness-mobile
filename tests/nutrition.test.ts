import test from 'node:test';
import assert from 'node:assert/strict';
import { forGrams, sumTotals } from '../lib/nutrition.ts';
import { addDays, dayKind, isoDow, strip } from '../lib/dates.ts';

test('nutrition per 100 g scales by grams', () => {
  const rice = { kcal_per_100g: 130, protein_g: 2.7, carbs_g: 28, fat_g: 0.3, fibre_g: 0.4 };
  assert.deepEqual(forGrams(rice, 150), { kcal: 195, protein_g: 4.05, carbs_g: 42, fat_g: 0.45, fibre_g: 0.6 });
});
test('totals add up and tolerate missing values', () => {
  assert.deepEqual(sumTotals([{ kcal: 100, protein_g: 5 }, { kcal: 50.5, fat_g: 2 }]), { kcal: 150.5, protein_g: 5, carbs_g: 0, fat_g: 2, fibre_g: 0 });
});
test('dates', () => {
  assert.equal(addDays('2026-11-30', 1), '2026-12-01'); assert.equal(addDays('2026-03-01', -1), '2026-02-28');
  assert.equal(isoDow('2026-11-15'), 7); assert.equal(isoDow('2026-11-16'), 1); // Sun / Mon
  assert.equal(dayKind('2026-11-14', '2026-11-15'), 'past'); assert.equal(dayKind('2026-11-16', '2026-11-15'), 'future');
  assert.equal(strip('2026-11-15', 3, 10).length, 14); assert.equal(strip('2026-11-15')[3], '2026-11-15');
});
