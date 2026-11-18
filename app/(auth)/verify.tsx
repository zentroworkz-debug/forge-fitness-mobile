import React, { useEffect, useState } from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import { Btn, Banner, Field, Header, Muted, Screen } from '@/components/ui';
import { niceError, supabase } from '@/lib/supabase';

export default function Verify() {
  const { email = '' } = useLocalSearchParams<{ email?: string }>();
  const [code, setCode] = useState(''); const [err, setErr] = useState(''); const [info, setInfo] = useState(''); const [busy, setBusy] = useState(false); const [cool, setCool] = useState(0);
  useEffect(() => { if (cool <= 0) return; const t = setTimeout(() => setCool(cool - 1), 1000); return () => clearTimeout(t); }, [cool]);
  const verify = async () => {
    if (code.trim().length < 6) { setErr('Enter the 6-digit code from your email.'); return; }
    setErr(''); setBusy(true);
    const { error } = await supabase.auth.verifyOtp({ email, token: code.trim(), type: 'signup' });
    setBusy(false);
    if (error) { setErr(niceError(error)); return; }
    router.replace('/');
  };
  const resend = async () => {
    setErr(''); const { error } = await supabase.auth.resend({ type: 'signup', email });
    if (error) setErr(niceError(error)); else { setInfo('A new code was sent.'); setCool(60); }
  };
  return (
    <Screen>
      <Header eyebrow="Verify email" title="Check your inbox" />
      <Muted>We sent a 6-digit code to {email}. Admins can only approve accounts with a verified email.</Muted>
      {!!err && <Banner kind="error">{err}</Banner>}{!!info && <Banner kind="success">{info}</Banner>}
      <Field label="Verification code" value={code} onChangeText={setCode} keyboardType="number-pad" maxLength={8} />
      <Btn title="Verify" onPress={verify} loading={busy} />
      <Btn title={cool > 0 ? `Resend in ${cool}s` : 'Resend code'} variant="ghost" disabled={cool > 0} onPress={resend} />
      <Btn title="Back to login" variant="ghost" onPress={() => router.replace('/(auth)/login')} />
    </Screen>
  );
}
