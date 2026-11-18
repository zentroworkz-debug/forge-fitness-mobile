import React from 'react';
import { Text, View } from 'react-native';
import { Async, Card, H3, Header, Kpi, Muted, Row, Screen } from '@/components/ui';
import { useAsync } from '@/hooks/useAsync';
import { q, supabase, todayIST } from '@/lib/supabase';
import { fmtINR } from '@/lib/format';
import { space } from '@/theme';

export default function AdminReports() {
  const today = todayIST();

  const st = useAsync(async () => {
    const [clients, trainers, mems, pays, atts] = await Promise.all([
      q(supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('requested_role', 'client').eq('approval_status', 'approved')),
      q(supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('requested_role', 'trainer').eq('approval_status', 'approved')),
      q(supabase.from('client_memberships').select('id', { count: 'exact', head: true }).eq('status', 'active')),
      q(supabase.from('payments').select('amount_inr')),
      q(supabase.from('attendance_records').select('id', { count: 'exact', head: true }).gte('gym_date', today.slice(0, 7) + '-01')),
    ]);

    const payList = (pays as any[]) || [];
    const totalRev = payList.reduce((acc, p) => acc + Number(p.amount_inr || 0), 0);

    return {
      activeClients: (clients as any) ?? 0,
      activeTrainers: (trainers as any) ?? 0,
      activeMems: (mems as any) ?? 0,
      totalRev,
      monthlyAtt: (atts as any) ?? 0,
    };
  }, []);

  return (
    <Screen onRefresh={st.refresh} refreshing={st.refreshing}>
      <Header eyebrow="Admin" title="Business Reports" back="/manage/more" />

      <Async state={st}>{(d) => (
        <>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.md }}>
            <Kpi label="Total Revenue Logged" value={fmtINR(d.totalRev)} />
            <Kpi label="Active Memberships" value={d.activeMems} />
            <Kpi label="Approved Clients" value={d.activeClients} />
            <Kpi label="Approved Trainers" value={d.activeTrainers} />
            <Kpi label="Visits This Month" value={d.monthlyAtt} />
          </View>

          <Card style={{ gap: space.sm }}>
            <H3>Report Summary</H3>
            <Muted>All statistics are derived in real-time from active memberships, payments, attendance and profile approvals.</Muted>
          </Card>
        </>
      )}</Async>
    </Screen>
  );
}
