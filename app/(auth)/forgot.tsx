import React, { useState } from 'react';
import { router } from 'expo-router';
import { Btn, Banner, Field, Header, Muted, Screen } from '@/components/ui';
import { niceError, supabase } from '@/lib/supabase';
import { isEmail } from '@/lib/validate';

// The reset link opens the website's reset page (the website owns password reset);
// afterwards the same new password works in this app.
const SITE = 'https://forge-fitness-pi-two.vercel.app/app/';
export default function Forgot() {
  const [email, setEmail] = useState(''); const [err, setErr] = useState(''); const [done, setDone] = useState(false); const [busy, setBusy] = useState(false);
  const submit = async () => {
    if (!isEmail(email)) { setErr('Enter a valid email.'); return; }
    setErr(''); setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: SITE });
    setBusy(false);
    if (error) setErr(niceError(error)); else setDone(true);
  };
  return (
    <Screen>
      <Header eyebrow="Password" title="Reset your password" />
      {done ? <Banner kind="success">If that email has an account, a reset link is on its way. Open it, choose a new password, then log in here.</Banner> : (<>
        <Muted>We will email you a secure link.</Muted>
        {!!err && <Banner kind="error">{err}</Banner>}
        <Field label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
        <Btn title="Send reset link" onPress={submit} loading={busy} />
      </>)}
      <Btn title="Back to login" variant="ghost" onPress={() => router.replace('/(auth)/login')} />
    </Screen>
  );
}
