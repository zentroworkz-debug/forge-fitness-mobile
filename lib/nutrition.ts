// Preview of what the database trigger will store for a database food: per-100g value x grams / 100, rounded to 2 dp.
// (The trigger is authoritative; this is only so the form can show the numbers before saving.)
export type Per100 = { kcal_per_100g: number; protein_g: number; carbs_g: number; fat_g: number; fibre_g: number };
export type Totals = { kcal: number; protein_g: number; carbs_g: number; fat_g: number; fibre_g: number };
const r2 = (n: number) => Math.round(n * 100) / 100;
export const forGrams = (f: Per100, grams: number): Totals => ({
  kcal: r2((f.kcal_per_100g * grams) / 100), protein_g: r2((f.protein_g * grams) / 100), carbs_g: r2((f.carbs_g * grams) / 100), fat_g: r2((f.fat_g * grams) / 100), fibre_g: r2((f.fibre_g * grams) / 100),
});
export const sumTotals = (rows: Partial<Totals>[]): Totals => rows.reduce<Totals>((a, x) => ({ kcal: a.kcal + Number(x.kcal ?? 0), protein_g: a.protein_g + Number(x.protein_g ?? 0), carbs_g: a.carbs_g + Number(x.carbs_g ?? 0), fat_g: a.fat_g + Number(x.fat_g ?? 0), fibre_g: a.fibre_g + Number(x.fibre_g ?? 0) }), { kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fibre_g: 0 });
