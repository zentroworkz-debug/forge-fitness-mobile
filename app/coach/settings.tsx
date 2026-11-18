import React, { useState } from 'react';
import { View } from 'react-native';
import { Async, Btn, Card, Field, H3, Header, PasswordField, Screen, useToast } from '@/components/ui';
import { useAsync } from '@/hooks/useAsync';
import { useAuth } from '@/contexts/AuthContext';
import { niceError, q, supabase } from '@/lib/supabase';
import { space } from '@/theme';

export default function TrainerSettings() {
  const { user, profile, refresh } = useAuth();
  const toast = useToast();

  const [curPw, setCurPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwBusy, setPwBusy] = useState(false);

  const [phone, setPhone] = useState(profile?.phone || '');
  const [spec, setSpec] = useState('');
  const [exp, setExp] = useState('');
  const [qual, setQual] = useState('');
  const [infoBusy, setInfoBusy] = useState(false);

  const st = useAsync(async () => {
    const tp = await q(supabase.from('trainer_profiles').select('*').eq('id', user!.id).maybeSingle());
    if (tp) {
      if ((tp as any).specialization) setSpec((tp as any).specialization);
      if ((tp as any).experience_years) setExp(String((tp as any).experience_years));
      if ((tp as any).qualifications) setQual((tp as any).qualifications);
    }
    return tp;
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

      const { error: tpErr } = await supabase.from('trainer_profiles').upsert({
        id: user!.id,
        specialization: spec.trim() || null,
        experience_years: exp ? Number(exp) : null,
        qualifications: qual.trim() || null,
      });
      if (tpErr) throw tpErr;

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
      <Header eyebrow="Account" title="Settings" back="/coach/more" />
      {toast.node}

      <Card style={{ gap: space.md }}>
        <H3>Trainer Profile</H3>
        <Field label="Phone number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        <Field label="Specialization" value={spec} onChangeText={setSpec} placeholder="e.g. Bodybuilding, Functional Strength" />
        <Field label="Experience (Years)" value={exp} onChangeText={setExp} keyboardType="number-pad" />
        <Field label="Qualifications" value={qual} onChangeText={setQual} placeholder="e.g. ACE Certified, CSCS" />
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
