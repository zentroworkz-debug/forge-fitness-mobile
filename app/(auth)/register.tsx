import React, { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Btn, Banner, Chip, Field, PasswordField, Header, Muted, Row, Screen } from '@/components/ui';
import { niceError, supabase } from '@/lib/supabase';
import { hasLen, isEmail, isPhone } from '@/lib/validate';

// Same sign-up call and metadata as the website. The database trigger creates a *pending* profile;
// role and approval are decided only by an admin, never by this form.
export default function Register() {
  const [role, setRole] = useState<'client' | 'trainer'>('client');
  const [f, setF] = useState<Record<string, string>>({});
  const [errs, setErrs] = useState<Record<string, string>>({}); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  const set = (k: string) => (v: string) => setF((s) => ({ ...s, [k]: v }));
  const submit = async () => {
    const e: Record<string, string> = {};
    if (!hasLen(f.full_name ?? '', 2)) e.full_name = 'Enter your name';
    if (!isEmail(f.email ?? '')) e.email = 'Enter a valid email';
    if (!isPhone(f.phone ?? '')) e.phone = 'Enter a valid phone';
    if ((f.password ?? '').length < 8) e.password = 'At least 8 characters';
    if (f.password !== f.confirm) e.confirm = 'Passwords do not match';
    if (role === 'client' && f.age && !(+f.age >= 14 && +f.age <= 90)) e.age = 'Age 14–90';
    setErrs(e); if (Object.keys(e).length) return;
    setErr(''); setBusy(true);
    const { error } = await supabase.auth.signUp({
      email: f.email.trim(), password: f.password,
      options: { data: { full_name: f.full_name, phone: f.phone, requested_role: role, age: f.age ? +f.age : undefined, fitness_goal: f.fitness_goal, qualifications: f.qualifications, specialization: f.specialization, experience_years: f.experience_years ? +f.experience_years : undefined } },
    });
    setBusy(false);
    if (error) { setErr(niceError(error)); return; }
    router.replace({ pathname: '/(auth)/verify', params: { email: f.email.trim() } });
  };
  return (
    <Screen>
      <Header eyebrow="Apply to join" title="Create your account" />
      <Muted>New accounts are reviewed by the gym before they can use the portal.</Muted>
      <Row><Chip label="I'm a member" active={role === 'client'} onPress={() => setRole('client')} /><Chip label="I'm a trainer" active={role === 'trainer'} onPress={() => setRole('trainer')} /></Row>
      {!!err && <Banner kind="error">{err}</Banner>}
      <Field label="Full name" value={f.full_name} onChangeText={set('full_name')} error={errs.full_name} autoComplete="name" />
      <Field label="Email" value={f.email} onChangeText={set('email')} keyboardType="email-address" autoCapitalize="none" error={errs.email} />
      <Field label="Phone" value={f.phone} onChangeText={set('phone')} keyboardType="phone-pad" error={errs.phone} />
      {role === 'client' ? (<>
        <Field label="Age (optional)" value={f.age} onChangeText={set('age')} keyboardType="number-pad" error={errs.age} />
        <Field label="Fitness goal (optional)" value={f.fitness_goal} onChangeText={set('fitness_goal')} />
      </>) : (<>
        <Field label="Specialization" value={f.specialization} onChangeText={set('specialization')} />
        <Field label="Qualifications" value={f.qualifications} onChangeText={set('qualifications')} />
        <Field label="Experience (years)" value={f.experience_years} onChangeText={set('experience_years')} keyboardType="number-pad" />
      </>)}
      <PasswordField label="Password" value={f.password} onChangeText={set('password')} error={errs.password} />
      <PasswordField label="Confirm password" value={f.confirm} onChangeText={set('confirm')} error={errs.confirm} />
      <Btn title="Create account" onPress={submit} loading={busy} />
      <Btn title="I already have an account" variant="ghost" onPress={() => router.replace('/(auth)/login')} />
    </Screen>
  );
}
