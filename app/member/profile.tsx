import React from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Async, Btn, Card, H3, Header, Muted, Row, Screen } from '@/components/ui';
import { useAsync } from '@/hooks/useAsync';
import { useAuth } from '@/contexts/AuthContext';
import { q, supabase } from '@/lib/supabase';
import { fmtD } from '@/lib/format';
import { colors, fonts, space } from '@/theme';

export default function ClientProfile() {
  const { user, profile } = useAuth();

  const st = useAsync(async () => {
    const [cp, mem, asg] = await Promise.all([
      q(supabase.from('client_profiles').select('*').eq('id', user!.id).maybeSingle()),
      q(supabase.from('client_memberships').select('starts_on,ends_on,status,plan:membership_plans(name)').eq('client_id', user!.id).order('ends_on', { ascending: false }).limit(1)),
      q(supabase.from('trainer_assignments').select('trainer_id,status').eq('client_id', user!.id).eq('status', 'active').limit(1)),
    ]);
    let trainerName: string | null = null;
    const a0 = (asg as any[])[0];
    if (a0?.trainer_id) {
      const t = await q(supabase.from('trainer_directory').select('full_name').eq('id', a0.trainer_id).maybeSingle());
      trainerName = (t as any)?.full_name ?? null;
    }
    return {
      cp: cp as any,
      mem: (mem as any[])[0] ?? null,
      trainer: trainerName,
    };
  }, [user?.id]);

  const Item = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <Row style={{ justifyContent: 'space-between', paddingVertical: 4 }}>
      <Muted>{label}</Muted>
      <Text style={{ color: colors.fg, fontFamily: fonts.bodySemi, fontSize: 15 }}>{value ?? '—'}</Text>
    </Row>
  );

  return (
    <Screen onRefresh={st.refresh} refreshing={st.refreshing}>
      <Header eyebrow="Account" title="My Profile" back="/member/more" />

      <Card style={{ gap: space.md, alignItems: 'center', paddingVertical: space.xl }}>
        <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: colors.onAccent, fontFamily: fonts.heading, fontSize: 32 }}>
            {profile?.full_name?.charAt(0).toUpperCase() ?? 'U'}
          </Text>
        </View>
        <View style={{ alignItems: 'center' }}>
          <H3>{profile?.full_name}</H3>
          <Muted>{user?.email}</Muted>
        </View>
        <View style={{ paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, backgroundColor: profile?.approval_status === 'approved' ? colors.accent : colors.warn }}>
          <Text style={{ color: profile?.approval_status === 'approved' ? colors.onAccent : colors.fg, fontFamily: fonts.bodySemi, fontSize: 12, textTransform: 'capitalize' }}>
            {profile?.approval_status ?? 'Pending'}
          </Text>
        </View>
      </Card>

      <Async state={st}>{(d) => (
        <>
          <Card style={{ gap: space.sm }}>
            <H3>Membership & Coaching</H3>
            <Item label="Membership" value={d.mem ? `${d.mem.plan?.name} (ends ${fmtD(d.mem.ends_on)})` : 'None'} />
            <Item label="Assigned Trainer" value={d.trainer ?? 'No trainer assigned'} />
          </Card>

          <Card style={{ gap: space.sm }}>
            <H3>Personal & Fitness Info</H3>
            <Item label="Phone" value={profile?.phone} />
            <Item label="Age" value={d.cp?.age ? `${d.cp.age} yrs` : null} />
            <Item label="Fitness Goal" value={d.cp?.fitness_goal} />
            <Item label="Experience" value={d.cp?.experience_level} />
          </Card>

          <Btn title="Edit Profile & Password" variant="ghost" onPress={() => router.push('/member/settings')} icon={<Ionicons name="settings-outline" size={18} color={colors.fg} />} />
        </>
      )}</Async>
    </Screen>
  );
}
