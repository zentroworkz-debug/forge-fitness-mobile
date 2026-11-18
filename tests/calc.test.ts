import test from 'node:test';
import assert from 'node:assert/strict';
import { calculate, validateCalc } from '../lib/calc.ts';

// Expected values are hand-computed from the website's formulas (Mifflin-St Jeor, BMI, 35 ml/kg).
test('male, 30y, 175cm, 70kg, moderate', () => {
  const r = calculate({ age: 30, sex: 'm', heightCm: 175, weightKg: 70, activity: 1.55 });
  assert.equal(r.bmi.toFixed(1), '22.9');
  assert.equal(r.category, 'Healthy range');
  assert.equal(r.calories, 2556); // (10*70 + 6.25*175 - 5*30 + 5) * 1.55
  assert.equal(r.waterL.toFixed(2), '2.45');
});
test('female uses -161 offset', () => {
  const r = calculate({ age: 25, sex: 'f', heightCm: 160, weightKg: 55, activity: 1.2 });
  assert.equal(r.calories, Math.round((550 + 1000 - 125 - 161) * 1.2));
});
test('BMI categories', () => {
  assert.equal(calculate({ age: 30, sex: 'm', heightCm: 180, weightKg: 55, activity: 1.2 }).category, 'Underweight');
  assert.equal(calculate({ age: 30, sex: 'm', heightCm: 170, weightKg: 80, activity: 1.2 }).category, 'Overweight');
  assert.equal(calculate({ age: 30, sex: 'm', heightCm: 170, weightKg: 100, activity: 1.2 }).category, 'Obese range');
});
test('validation ranges match the website', () => {
  assert.deepEqual(validateCalc({ age: 30, heightCm: 175, weightKg: 70 }), {});
  assert.ok(validateCalc({ age: 13, heightCm: 175, weightKg: 70 }).age);
  assert.ok(validateCalc({ age: 30, heightCm: 119, weightKg: 70 }).height);
  assert.ok(validateCalc({ age: 30, heightCm: 175, weightKg: 301 }).weight);
});
