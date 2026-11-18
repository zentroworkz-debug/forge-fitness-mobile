import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Async, Btn, Card, H3, Header, Kpi, Muted, P, Row, Screen } from '@/components/ui';
import { useAsync } from '@/hooks/useAsync';
import { useAuth } from '@/contexts/AuthContext';
import { q, supabase, todayIST } from '@/lib/supabase';
import { fmtDT, fmtT } from '@/lib/format';
import { colors, fonts, space } from '@/theme';

export default function TrainerHome() {
  const { user, profile } = useAuth();
  const today = todayIST();

  const st = useAsync(async () => {
    const d7 = new Date(Date.now() - 7 * 864e5).toISOString().slice(0, 10);
    const d30 = new Date(Date.now() - 30 * 864e5).toISOString().slice(0, 10);

    const [asg, sess, reqs, attRecent, insideRes]: any[] = await Promise.all([
      q(supabase.from('trainer_assignments')
        .select('client_id,status,client:profiles!trainer_assignments_client_id_fkey(id,full_name,phone)')
        .eq('trainer_id', user!.id)
        .in('status', ['active', 'transferring'])),
      q(supabase.from('training_sessions')
        .select('id,starts_at,ends_at,status,client_id,client:profiles!training_sessions_client_id_fkey(full_name)')
        .eq('trainer_id', user!.id)
        .gte('starts_at', today + 'T00:00:00+05:30')
        .lte('starts_at', today + 'T23:59:59+05:30')
        .neq('status', 'cancelled')
        .order('starts_at')),
      q(supabase.from('trainer_requests')
        .select('id,client_id,created_at,client:profiles!trainer_requests_client_id_fkey(full_name)')
        .eq('trainer_id', user!.id)
        .eq('status', 'pending')),
      q(supabase.from('attendance_records')
        .select('id,client_id,gym_date,check_in_at,check_out_at,client:profiles!attendance_records_client_id_fkey(full_name)')
        .gte('gym_date', d30)
        .order('check_in_at', { ascending: false })
        .limit(20)),
      q(supabase.from('attendance_records')
        .select('id,check_in_at,client_id,client:profiles!attendance_records_client_id_fkey(full_name)')
        .eq('gym_date', today)
        .is('check_out_at', null)),
    ]);

    const clientIds = (asg as any[]).map((a: any) => a.client_id);
    const activeAttSet = new Set((attRecent as any[]).filter((a: any) => a.gym_date >= d7).map((a: any) => a.client_id));
    const inactiveClients = (asg as any[]).filter((a: any) => !activeAttSet.has(a.client_id));
    const todayCheckins = (attRecent as any[]).filter((a: any) => a.gym_date === today);

    return {
      asg: asg || [],
      sess: sess || [],
      reqs: reqs || [],
      inactiveClients,
      todayCheckins,
      insideCount: (insideRes as any[])?.length || 0,
    };
  }, [user?.id]);

  const QUICK_ACTIONS: [string, string, string, keyof typeof Ionicons.glyphMap][] = [
    ['Clients', '/coach/clients', 'View and manage roster', 'people'],
    ['Workouts', '/coach/workouts', 'Build workout plan', 'barbell'],
    ['Nutrition', '/coach/nutrition', 'Plan meals and macros', 'nutrition'],
    ['Attendance', '/coach/attendance', 'Monitor gym check-ins', 'time'],
    ['QR Code', '/coach/qr', 'Show attendance QR', 'qr-code'],
    ['Targets', '/coach/targets', 'Set water and reminders', 'flame'],
  ];

  return (
    <Screen onRefresh={st.refresh} refreshing={st.refreshing}>
      <Header eyebrow="Trainer Dashboard" title={`Hi, ${profile?.full_name?.split(' ')[0] ?? 'Coach'}`} />

      <Async state={st}>{(d) => (
        <>
          {/* Top KPIs */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.md }}>
            <Kpi label="Active Clients" value={d.asg.length} sub={`${d.inactiveClients.length} inactive > 7d`} />
            <Kpi label="Sessions Today" value={d.sess.length} sub="Scheduled sessions" />
            <Kpi label="Pending Requests" value={d.reqs.length} sub={d.reqs.length ? 'Tap to review' : 'All caught up'} />
            <Kpi label="Inside Gym" value={d.insideCount} sub="Currently present" />
          </View>

          {/* Pending Requests Alert */}
          {d.reqs.length > 0 && (
            <Card accent style={{ gap: space.sm }}>
              <Row style={{ justifyContent: 'space-between' }}>
                <Row style={{ gap: space.sm }}>
                  <Ionicons name="mail-unread" size={20} color={colors.accent} />
                  <H3>{d.reqs.length} Client Request{d.reqs.length > 1 ? 's' : ''}</H3>
                </Row>
                <Btn title="Review" variant="primary" onPress={() => router.push('/coach/requests')} />
              </Row>
              <Muted>New clients want to train with you. Review and accept their requests.</Muted>
            </Card>
          )}

          {/* Quick Actions Grid */}
          <Card style={{ gap: space.md }}>
            <H3>Quick Actions</H3>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
              {QUICK_ACTIONS.map(([title, route, desc, icon]) => (
                <Pressable
                  key={title}
                  onPress={() => router.push(route as any)}
                  style={({ pressed }) => ({
                    width: '48.5%',
                    backgroundColor: colors.bg,
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: colors.border,
                    padding: space.md,
                    gap: 6,
                    opacity: pressed ? 0.8 : 1,
                  })}>
                  <Ionicons name={icon} size={22} color={colors.accent} />
                  <Text style={{ color: colors.fg, fontFamily: fonts.headingBold, fontSize: 14 }}>{title}</Text>
                  <Text style={{ color: colors.muted, fontFamily: fonts.body, fontSize: 11 }} numberOfLines={1}>{desc}</Text>
                </Pressable>
              ))}
            </View>
          </Card>

          {/* Today's Scheduled Sessions */}
          <Card style={{ gap: space.md }}>
            <Row style={{ justifyContent: 'space-between' }}>
              <H3>Today's Sessions ({d.sess.length})</H3>
              <Btn title="Calendar" variant="ghost" onPress={() => router.push('/coach/calendar')} />
            </Row>
            {d.sess.length === 0 ? (
              <Muted>No sessions scheduled for today. Book new slots under Calendar.</Muted>
            ) : (
              <View style={{ gap: space.sm }}>
                {d.sess.map((s: any) => (
                  <View
                    key={s.id}
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      backgroundColor: colors.bg,
                      padding: space.md,
                      borderRadius: 12,
                      borderLeftWidth: 4,
                      borderLeftColor: colors.accent,
                    }}>
                    <View style={{ gap: 2 }}>
                      <Text style={{ color: colors.fg, fontFamily: fonts.headingBold, fontSize: 15 }}>
                        {s.client?.full_name ?? 'Client'}
                      </Text>
                      <Muted>{fmtT(s.starts_at)} → {fmtT(s.ends_at)}</Muted>
                    </View>
                    <View style={{ backgroundColor: 'rgba(198,255,61,0.15)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
                      <Text style={{ color: colors.accent, fontFamily: fonts.bodySemi, fontSize: 12, textTransform: 'uppercase' }}>
                        {s.status}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </Card>

          {/* Attention: Inactive Clients (> 7 days) */}
          {d.inactiveClients.length > 0 && (
            <Card style={{ gap: space.sm, borderColor: colors.warn }}>
              <Row style={{ gap: space.sm }}>
                <Ionicons name="alert-circle" size={20} color={colors.warn} />
                <H3 style={{ color: colors.warn }}>Client Follow-ups ({d.inactiveClients.length})</H3>
              </Row>
              <Muted>These clients haven't logged attendance in the last 7 days:</Muted>
              <View style={{ gap: space.xs }}>
                {d.inactiveClients.slice(0, 5).map((a: any) => (
                  <Row key={a.client_id} style={{ justifyContent: 'space-between', paddingVertical: 4 }}>
                    <Text style={{ color: colors.fg, fontFamily: fonts.bodySemi, fontSize: 14 }}>
                      {a.client?.full_name ?? 'Client'}
                    </Text>
                    <Btn
                      title="View"
                      variant="ghost"
                      onPress={() => router.push('/coach/clients')}
                    />
                  </Row>
                ))}
              </View>
            </Card>
          )}

          {/* Today's Client Check-ins */}
          <Card style={{ gap: space.md }}>
            <Row style={{ justifyContent: 'space-between' }}>
              <H3>Today's Check-ins ({d.todayCheckins.length})</H3>
              <Btn title="Monitor" variant="ghost" onPress={() => router.push('/coach/attendance')} />
            </Row>
            {d.todayCheckins.length === 0 ? (
              <Muted>No clients checked in today yet.</Muted>
            ) : (
              <View style={{ gap: space.sm }}>
                {d.todayCheckins.slice(0, 6).map((c: any) => (
                  <Row key={c.id} style={{ justifyContent: 'space-between', backgroundColor: colors.bg, padding: space.sm, borderRadius: 10 }}>
                    <View style={{ gap: 2 }}>
                      <Text style={{ color: colors.fg, fontFamily: fonts.bodySemi, fontSize: 14 }}>
                        {c.client?.full_name ?? 'Member'}
                      </Text>
                      <Muted>In at {fmtT(c.check_in_at)}{c.check_out_at ? ` · Out ${fmtT(c.check_out_at)}` : ' · In gym now'}</Muted>
                    </View>
                    <View style={{ backgroundColor: c.check_out_at ? 'transparent' : colors.accent, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, borderWidth: 1, borderColor: colors.accent }}>
                      <Text style={{ color: c.check_out_at ? colors.accent : colors.onAccent, fontSize: 11, fontFamily: fonts.bodySemi }}>
                        {c.check_out_at ? 'Done' : 'Inside'}
                      </Text>
                    </View>
                  </Row>
                ))}
              </View>
            )}
          </Card>
        </>
      )}</Async>
    </Screen>
  );
}
