import { supabase } from '@/lib/supabase';

// Mirrors the website's submitAttendanceScan(): Edge Function first, DB RPC fallback.
// The client never sends its own id or time: the server derives both from the JWT and its clock.
export const SCAN_MESSAGES: Record<string, string> = {
  invalid_or_expired_qr: "This QR code is invalid or has expired. Ask your trainer to show today's code.",
  wrong_trainer: 'This code belongs to a different trainer than the one assigned to you.',
  already_checked_in: 'You are already checked in. Scan the CHECK-OUT code when you leave.',
  not_checked_in: 'You have not checked in yet. Scan the CHECK-IN code first.',
  too_soon: 'You checked in less than a minute ago. Please wait a moment before checking out.',
  client_not_approved: 'Your account is not active.',
  bad_signature: 'This QR code is not valid.', expired: 'This QR code has expired.', malformed: 'That does not look like a FORGE QR code.',
  rate_limited: 'Too many attempts. Please wait a minute.', unauthorized: 'Please sign in again.',
};

export type ScanResult = { action: 'check_in' | 'check_out'; at: string; minutes?: number };

export async function submitScan(raw: string): Promise<ScanResult> {
  const token = String(raw || '').trim();
  if (!token) throw Object.assign(new Error('malformed'), { code: 'malformed' });
  try {
    const { data, error } = await supabase.functions.invoke('scan-attendance', { body: { token } });
    if (!error && data?.action) return data as ScanResult;
    if (error && (error as any).context?.json) {
      const body = await (error as any).context.json().catch(() => null);
      if (body?.error) throw Object.assign(new Error(body.error), { code: body.error });
    }
  } catch (e: any) { if (e?.code) throw e; /* function unreachable: fall back to the RPC */ }
  const { data, error } = await supabase.rpc('client_scan_attendance', { p_token: token });
  if (error) throw Object.assign(new Error(error.message), { code: error.message });
  return data as ScanResult;
}

export function scanMessage(e: any): string {
  const msg: string = e?.message || '';
  const k = Object.keys(SCAN_MESSAGES).find((x) => msg.includes(x));
  return k ? SCAN_MESSAGES[k] : msg || 'Could not record attendance. Please try again.';
}
