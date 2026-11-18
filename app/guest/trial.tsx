import React, { useState } from 'react';
import { Btn, Field, Header, Muted, Screen, useToast } from '@/components/ui';
import { sendEnquiry } from '@/lib/enquiry';
import { hasLen, isEmail, isPhone } from '@/lib/validate';
import { niceError } from '@/lib/supabase';

export default function Trial() {
  const [name, setName] = useState(''); const [phone, setPhone] = useState(''); const [email, setEmail] = useState('');
  const [errs, setErrs] = useState<Record<string, string>>({}); const [busy, setBusy] = useState(false); const toast = useToast();
  const submit = async () => {
    const e: Record<string, string> = {};
    if (!hasLen(name, 2)) e.name = 'Enter your name';
    if (!isPhone(phone)) e.phone = 'Enter a valid phone';
    if (!isEmail(email)) e.email = 'Enter a valid email';
    setErrs(e); if (Object.keys(e).length) return;
    setBusy(true);
    try { await sendEnquiry({ name, email, phone, message: 'Enquiry: Book a free trial' }); toast.show('success', 'Thank you! Our team will contact you to arrange your free trial.'); setName(''); setPhone(''); setEmail(''); }
    catch (err) { toast.show('error', 'Could not send: ' + niceError(err)); }
    finally { setBusy(false); }
  };
  return (
    <Screen>
      <Header eyebrow="Free trial" title="Book your free trial" />
      <Muted>Our team will contact you to arrange your free trial.</Muted>
      {toast.node}
      <Field label="Name" value={name} onChangeText={setName} autoComplete="name" error={errs.name} />
      <Field label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" autoComplete="tel" error={errs.phone} />
      <Field label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" error={errs.email} />
      <Btn title="Submit enquiry" onPress={submit} loading={busy} />
    </Screen>
  );
}
