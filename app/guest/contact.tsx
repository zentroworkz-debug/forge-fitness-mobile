import React, { useState } from 'react';
import { Linking } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Btn, Card, Field, Header, Muted, P, Screen, useToast } from '@/components/ui';
import { GYM } from '@/lib/content';
import { sendEnquiry } from '@/lib/enquiry';
import { hasLen, isEmail } from '@/lib/validate';
import { niceError } from '@/lib/supabase';

export default function Contact() {
  const { topic } = useLocalSearchParams<{ topic?: string }>();
  const [name, setName] = useState(''); const [email, setEmail] = useState(''); const [msg, setMsg] = useState(topic ? `I would like to know more about the ${topic}.` : '');
  const [errs, setErrs] = useState<Record<string, string>>({}); const [busy, setBusy] = useState(false); const toast = useToast();
  const submit = async () => {
    const e: Record<string, string> = {};
    if (!hasLen(name, 2)) e.name = 'Enter your name';
    if (!isEmail(email)) e.email = 'Enter a valid email';
    if (!hasLen(msg, 10)) e.msg = 'Message needs 10+ characters';
    setErrs(e); if (Object.keys(e).length) return;
    setBusy(true);
    try { await sendEnquiry({ name, email, message: msg }); toast.show('success', 'Thank you! Our team will contact you soon.'); setName(''); setEmail(''); setMsg(''); }
    catch (err) { toast.show('error', 'Could not send: ' + niceError(err)); }
    finally { setBusy(false); }
  };
  return (
    <Screen>
      <Header eyebrow="Contact" title="Talk to us" />
      <Card style={{ gap: 8 }}>
        <P>{GYM.address}</P><P onPress={() => Linking.openURL(`tel:${GYM.phone}`)}>{GYM.phoneLabel}</P><P>{GYM.email}</P><P>{GYM.hours}</P>
        <Muted>Contact details are placeholders on the website too; replace once the gym confirms them.</Muted>
      </Card>
      {toast.node}
      <Field label="Name" value={name} onChangeText={setName} autoComplete="name" error={errs.name} />
      <Field label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" error={errs.email} />
      <Field label="Message" value={msg} onChangeText={setMsg} multiline error={errs.msg} />
      <Btn title="Send message" onPress={submit} loading={busy} />
    </Screen>
  );
}
