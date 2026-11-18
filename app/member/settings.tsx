import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { Async, Banner, Btn, Card, Field, H3, Header, Muted, PasswordField, Row, Screen, useToast } from '@/components/ui';
import { useAsync } from '@/hooks/useAsync';
import { useAuth } from '@/contexts/AuthContext';
import { niceError, q, supabase } from '@/lib/supabase';
import { colors, fonts, space } from '@/theme';

export default function ClientSettings() {
  const { user, profile, refresh } = useAuth();
  const toast = useToast();

  const [curPw, setCurPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwBusy, setPwBusy] = useState(false);

  const [phone, setPhone] = useState(profile?.phone || '');
  const [age, setAge] = useState('');
  const [goal, setGoal] = useState('');
  const [infoBusy, setInfoBusy] = useState(false);

  const st = useAsync(async () => {
    const [cp, pref] = await Promise.all([
      q(supabase.from('client_profiles').select('*').eq('id', user!.id).maybeSingle()),
      q(supabase.from('notification_preferences').select('*').eq('user_id', user!.id).maybeSingle()),
    ]);
    if (cp) {
      if ((cp as any).age) setAge(String((cp as any).age));
      if ((cp as any).fitness_goal) setGoal((cp as any).fitness_goal);
    }
    return { cp: cp as any, pref: pref as any };
  }, [user?.id]);

  const updatePassword = async () => {
    if (!curPw || !newPw) {
      toast.show('error', 'Enter current and new password.');
      return;
    }
    if (newPw.length < 8) {
      toast.show('error', 'New password must be at least 8 characters.');
      return;
    }
    if (newPw !== confirmPw) {
      toast.show('error', 'New passwords do not match.');
      return;
    }

    setPwBusy(true);
    // Verify current password first
    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email: user!.email!,
      password: curPw,
    });
    if (signInErr) {
      setPwBusy(false);
      toast.show('error', 'Current password is incorrect.');
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: newPw });
    setPwBusy(false);
    if (error) {
      toast.show('error', niceError(error));
    } else {
      toast.show('success', 'Password updated successfully!');
      setCurPw(''); setNewPw(''); setConfirmPw('');
    }
  };

  const saveProfileInfo = async () => {
    setInfoBusy(true);
    try {
      const { error: pErr } = await supabase.from('profiles').update({ phone }).eq('id', user!.id);
      if (pErr) throw pErr;

      const { error: cpErr } = await supabase.from('client_profiles').upsert({
        id: user!.id,
        age: age ? Number(age) : null,
        fitness_goal: goal.trim() || null,
      });
      if (cpErr) throw cpErr;

      toast.show('success', 'Profile updated!');
      await refresh();
      st.reload();
    } catch (e) {
      toast.show('error', niceError(e));
    } finally {
      setInfoBusy(false);
    }
  };

  return (
    <Screen onRefresh={st.refresh} refreshing={st.refreshing}>
      <Header eyebrow="Account" title="Settings" back="/member/more" />
      {toast.node}

      <Card style={{ gap: space.md }}>
        <H3>Profile Information</H3>
        <Field label="Phone number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        <Field label="Age" value={age} onChangeText={setAge} keyboardType="number-pad" />
        <Field label="Fitness Goal" value={goal} onChangeText={setGoal} placeholder="e.g. Strength & weight loss" />
        <Btn title="Save Profile Info" onPress={saveProfileInfo} loading={infoBusy} />
      </Card>

      <Card style={{ gap: space.md }}>
        <H3>Change Password</H3>
        <PasswordField label="Current Password" value={curPw} onChangeText={setCurPw} />
        <PasswordField label="New Password (min 8 characters)" value={newPw} onChangeText={setNewPw} />
        <PasswordField label="Confirm New Password" value={confirmPw} onChangeText={setConfirmPw} />
        <Btn title="Update Password" onPress={updatePassword} loading={pwBusy} />
      </Card>
    </Screen>
  );
}
