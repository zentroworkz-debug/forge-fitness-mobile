import React from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Async, Btn, Card, H3, Header, Muted, Row, Screen } from '@/components/ui';
import { useAsync } from '@/hooks/useAsync';
import { useAuth } from '@/contexts/AuthContext';
import { q, supabase } from '@/lib/supabase';
import { colors, fonts, space } from '@/theme';

export default function TrainerProfile() {
  const { user, profile } = useAuth();

  const st = useAsync(async () => {
    const [tp, asg] = await Promise.all([
      q(supabase.from('trainer_profiles').select('*').eq('id', user!.id).maybeSingle()),
      q(supabase.from('trainer_assignments').select('id').eq('trainer_id', user!.id).eq('status', 'active')),
    ]);
    return {
      tp: tp as any,
      clientCount: ((asg as any[]) || []).length,
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
      <Header eyebrow="Account" title="Trainer Profile" back="/coach/more" />

      <Card style={{ gap: space.md, alignItems: 'center', paddingVertical: space.xl }}>
        <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: colors.onAccent, fontFamily: fonts.heading, fontSize: 32 }}>
            {profile?.full_name?.charAt(0).toUpperCase() ?? 'T'}
          </Text>
        </View>
        <View style={{ alignItems: 'center' }}>
          <H3>{profile?.full_name}</H3>
          <Muted>{user?.email}</Muted>
        </View>
        <View style={{ paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, backgroundColor: colors.accent }}>
          <Text style={{ color: colors.onAccent, fontFamily: fonts.bodySemi, fontSize: 12 }}>Trainer</Text>
        </View>
      </Card>

      <Async state={st}>{(d) => (
        <>
          <Card style={{ gap: space.sm }}>
            <H3>Professional Information</H3>
            <Item label="Specialization" value={d.tp?.specialization} />
            <Item label="Experience" value={d.tp?.experience_years ? `${d.tp.experience_years} years` : null} />
            <Item label="Qualifications" value={d.tp?.qualifications} />
            <Item label="Certifications" value={d.tp?.certifications} />
            <Item label="Active Clients" value={d.clientCount} />
          </Card>

          <Card style={{ gap: space.sm }}>
            <H3>Contact</H3>
            <Item label="Phone" value={profile?.phone} />
            <Item label="Email" value={user?.email} />
          </Card>

          <Btn title="Edit Profile & Password" variant="ghost" onPress={() => router.push('/coach/settings')} icon={<Ionicons name="settings-outline" size={18} color={colors.fg} />} />
        </>
      )}</Async>
    </Screen>
  );
}
