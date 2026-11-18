import React, { useState } from 'react';
import { Image, View } from 'react-native';
import { Link, router } from 'expo-router';
import { Btn, Banner, Field, PasswordField, Muted, Screen, Eyebrow, H1 } from '@/components/ui';
import { configured, niceError, supabase } from '@/lib/supabase';
import { isEmail } from '@/lib/validate';
import { colors, space } from '@/theme';

export default function Login() {
  const [email, setEmail] = useState(''); const [pw, setPw] = useState(''); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  const submit = async () => {
    if (!isEmail(email) || !pw) { setErr('Enter your email and password.'); return; }
    setErr(''); setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: pw });
    setBusy(false);
    if (error) {
      // Same account system as the website: unverified emails go to the code screen.
      if (/not confirmed/i.test(error.message)) { router.push({ pathname: '/(auth)/verify', params: { email: email.trim() } }); return; }
      setErr(niceError(error)); return;
    }
    router.replace('/');
  };
  return (
    <Screen center>
      <View style={{ alignItems: 'center', gap: space.sm }}>
        <Image source={require('../../assets/images/logo.png')} style={{ width: 190, height: 31 }} resizeMode="contain" accessibilityLabel="FORGE FITNESS" />
        <Eyebrow>Member login</Eyebrow>
        <H1 style={{ textAlign: 'center' }}>Welcome back</H1>
      </View>
      {!configured && <Banner kind="error">Backend not configured: set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.</Banner>}
      {!!err && <Banner kind="error">{err}</Banner>}
      <Field label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
      <PasswordField label="Password" value={pw} onChangeText={setPw} autoComplete="password" onSubmitEditing={submit} />
      <Btn title="Log in" onPress={submit} loading={busy} />
      <View style={{ gap: space.md, alignItems: 'stretch' }}>
        <Btn title="Forgot password?" variant="ghost" onPress={() => router.push('/(auth)/forgot')} />
        <Btn title="Apply to join" variant="ghost" onPress={() => router.push('/(auth)/register')} />
      </View>
      <Muted style={{ textAlign: 'center' }}>One account for the website and this app.</Muted>
    </Screen>
  );
}
