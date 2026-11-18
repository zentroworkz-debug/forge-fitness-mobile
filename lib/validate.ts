export const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
export const isPhone = (v: string) => /^[+\d][\d\s-]{7,14}$/.test(v.trim());
export const hasLen = (v: string, n: number) => v.trim().length >= n;
