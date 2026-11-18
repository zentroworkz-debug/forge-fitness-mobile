export const fmtD = (d?: string | null) => (d ? new Date(d.length === 10 ? d + 'T00:00:00' : d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');
export const fmtT = (d?: string | null) => (d ? new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' }) : '—');
export const fmtDT = (d?: string | null) => (d ? `${fmtD(d)} ${fmtT(d)}` : '—');
export const fmtINR = (n?: number | string | null) => (n != null ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(n)) : '—');
// Monday=1..Sunday=7 in IST, matching workout_plans.training_days on the website
export const dowIST = () => { const w = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })).getDay(); return ((w + 6) % 7) + 1; };
