import { supabase } from '@/lib/supabase';

// Writes to the same contact_enquiries table the website uses (anon insert is allowed by RLS).
// Throws on failure: the UI must never show success unless this resolves.
export async function sendEnquiry(d: { name: string; email: string; phone?: string; message: string }) {
  const { error } = await supabase.from('contact_enquiries').insert({
    name: d.name.trim(), email: d.email.trim(), phone: d.phone?.trim() || null, message: d.message.trim(),
  });
  if (error) throw error;
}
