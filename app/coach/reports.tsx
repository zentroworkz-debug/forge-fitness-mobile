import React from 'react';
import { Text, View } from 'react-native';
import { Async, Card, Empty, H3, Header, Kpi, Muted, Row, Screen } from '@/components/ui';
import { useAsync } from '@/hooks/useAsync';
import { useAuth } from '@/contexts/AuthContext';
import { q, supabase, todayIST } from '@/lib/supabase';
import { colors, fonts, space } from '@/theme';

export default function TrainerReports() {
  const { user } = useAuth();
  const today = todayIST();

  const st = useAsync(async () => {
    const asg = await q(supabase.from('trainer_assignments')
      .select('client_id,status,started_at,client:profiles!trainer_assignments_client_id_fkey(id,full_name)')
      .eq('trainer_id', user!.id)
      .eq('status', 'active'));

    const clients = (asg as any[]).map((a) => a.client).filter(Boolean);
    const clientIds = clients.map((c) => c.id);

    if (!clientIds.length) return { clients: [], attCount: 0, compCount: 0 };

    const [att, comps] = await Promise.all([
      q(supabase.from('attendance_records').select('id,client_id').in('client_id', clientIds).gte('gym_date', today.slice(0, 7) + '-01')),
      q(supabase.from('workout_completions').select('id,client_id').in('client_id', clientIds).eq('completed', true)),
    ]);

    return {
      clients,
      attCount: ((att as any[]) || []).length,
      compCount: ((comps as any[]) || []).length,
    };
  }, [user?.id]);

  return (
    <Screen onRefresh={st.refresh} refreshing={st.refreshing}>
      <Header eyebrow="Trainer" title="Client Activity Reports" back="/coach/more" />

      <Async state={st}>{(d) => (
        <>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.md }}>
            <Kpi label="Active Clients" value={d.clients.length} />
            <Kpi label="Check-ins this month" value={d.attCount} />
            <Kpi label="Exercises Completed" value={d.compCount} />
          </View>

          <Card style={{ gap: space.md }}>
            <H3>Assigned Clients</H3>
            {d.clients.length === 0 ? (
              <Empty text="No active clients assigned." />
            ) : (
              d.clients.map((c: any) => (
                <Card key={c.id} style={{ backgroundColor: colors.bg }}>
                  <Text style={{ color: colors.fg, fontFamily: fonts.headingBold, fontSize: 16 }}>{c.full_name}</Text>
                  <Muted>Status: Active</Muted>
                </Card>
              ))
            )}
          </Card>
        </>
      )}</Async>
    </Screen>
  );
}
