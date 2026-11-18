// Same formulas as the website calculator: Mifflin-St Jeor, BMI, water ~35 ml/kg.
export type CalcInput = { age: number; sex: 'm' | 'f'; heightCm: number; weightKg: number; activity: number };
export const ACTIVITY = [
  { label: 'Sedentary', value: 1.2 },
  { label: 'Light (1–3 days/week)', value: 1.375 },
  { label: 'Moderate (3–5 days/week)', value: 1.55 },
  { label: 'Very active (6–7 days/week)', value: 1.725 },
];
export function validateCalc(i: { age: number; heightCm: number; weightKg: number }) {
  const e: Record<string, string> = {};
  if (!(i.age >= 14 && i.age <= 90)) e.age = 'Age 14–90';
  if (!(i.heightCm >= 120 && i.heightCm <= 230)) e.height = 'Height 120–230 cm';
  if (!(i.weightKg >= 30 && i.weightKg <= 300)) e.weight = 'Weight 30–300 kg';
  return e;
}
export function calculate(i: CalcInput) {
  const bmi = i.weightKg / (i.heightCm / 100) ** 2;
  const category = bmi < 18.5 ? 'Underweight' : bmi < 25 ? 'Healthy range' : bmi < 30 ? 'Overweight' : 'Obese range';
  const bmr = 10 * i.weightKg + 6.25 * i.heightCm - 5 * i.age + (i.sex === 'm' ? 5 : -161);
  return { bmi, category, calories: Math.round(bmr * i.activity), waterL: i.weightKg * 0.035 };
}
