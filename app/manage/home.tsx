import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Async, Bar, Btn, Card, H3, Header, Kpi, Muted, Row, Screen } from '@/components/ui';
import { useAsync } from '@/hooks/useAsync';
import { q, supabase, todayIST } from '@/lib/supabase';
import { fmtT } from '@/lib/format';
import { colors, fonts, space } from '@/theme';

export default function AdminHome() {
  const today = todayIST();

  const st = useAsync(async () => {
    const [overview, perf, presentRes, membershipsRes] = await Promise.all([
      q(supabase.rpc('admin_overview') as any),
      q(supabase.rpc('admin_trainer_performance') as any),
      q(supabase.from('attendance_records')
        .select('id,check_in_at,client:profiles!attendance_records_client_id_fkey(full_name),trainer:profiles!attendance_records_trainer_id_fkey(full_name)')
        .eq('gym_date', today)
        .is('check_out_at', null)
        .eq('missed', false)),
      q(supabase.from('client_memberships')
        .select('status,ends_on,plan:membership_plans(name)')
        .eq('status', 'active')),
    ]);

    // Calculate active plan breakdown
    const planCounts: Record<string, number> = {};
    const totalActive = (membershipsRes as any[]).length;
    (membershipsRes as any[]).forEach((m: any) => {
      const planName = m.plan?.name || 'General';
      planCounts[planName] = (planCounts[planName] || 0) + 1;
    });

    return {
      o: (overview as Record<string, any>) || {},
      perf: (perf as any[]) || [],
      present: (presentRes as any[]) || [],
      planCounts,
      totalActive,
    };
  }, []);

  const QUICK_MANAGEMENT: [string, string, string, keyof typeof Ionicons.glyphMap][] = [
    ['Approvals', '/manage/approvals', 'Review applicants', 'checkmark-done'],
    ['People', '/manage/people', 'Members & roles', 'people'],
    ['Plans', '/manage/plans', 'Membership catalog', 'pricetag'],
    ['Payments', '/manage/payments', 'Record & log revenue', 'cash'],
    ['Attendance', '/manage/attendance', 'View all logs', 'time'],
    ['QR Codes', '/manage/qr', 'Active tokens', 'qr-code'],
  ];

  return (
    <Screen onRefresh={st.refresh} refreshing={st.refreshing}>
      <Header eyebrow="Admin Dashboard" title="Gym Overview" />

      <Async state={st}>{(d) => {
        const o = d.o || {};
        const pendingCount = (Number(o.pending_clients) || 0) + (Number(o.pending_trainers) || 0);

        return (
          <>
            {/* Top KPIs */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.md }}>
              <Kpi label="Total Clients" value={o.clients_total ?? 0} sub={`${o.clients_active ?? 0} active memberships`} />
              <Kpi label="Trainers" value={o.trainers_total ?? 0} sub={`${o.trainers_active ?? 0} with clients`} />
              <Kpi label="Inside Now" value={o.present_now ?? d.present.length} sub="Currently on floor" />
              <Kpi label="Check-ins Today" value={o.checkins_today ?? 0} sub={`${o.checkouts_today ?? 0} checked out`} />
              <Kpi label="Pending Reviews" value={pendingCount} sub={pendingCount > 0 ? 'Requires attention' : 'All clear'} />
              <Kpi label="Expired Plans" value={o.expired_memberships ?? 0} sub="Needs renewal" />
            </View>

            {/* Pending Approvals Alert Banner */}
            {pendingCount > 0 && (
              <Card accent style={{ gap: space.sm }}>
                <Row style={{ justifyContent: 'space-between' }}>
                  <Row style={{ gap: space.sm }}>
                    <Ionicons name="alert-circle" size={22} color={colors.accent} />
                    <H3>{pendingCount} Account Application{pendingCount > 1 ? 's' : ''}</H3>
                  </Row>
                  <Btn title="Review" variant="primary" onPress={() => router.push('/manage/approvals')} />
                </Row>
                <Muted>{o.pending_clients || 0} client(s) and {o.pending_trainers || 0} coach applicant(s) waiting for your approval.</Muted>
              </Card>
            )}

            {/* Quick Management Shortcuts */}
            <Card style={{ gap: space.md }}>
              <H3>Management Shortcuts</H3>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
                {QUICK_MANAGEMENT.map(([title, route, desc, icon]) => (
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

            {/* Currently Inside the Gym */}
            <Card style={{ gap: space.md }}>
              <Row style={{ justifyContent: 'space-between' }}>
                <Row style={{ gap: space.sm }}>
                  <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.accent }} />
                  <H3>Inside Gym Right Now ({d.present.length})</H3>
                </Row>
                <Btn title="Attendance" variant="ghost" onPress={() => router.push('/manage/attendance')} />
              </Row>

              {d.present.length === 0 ? (
                <Muted>No members are checked in right now.</Muted>
              ) : (
                <View style={{ gap: space.sm }}>
                  {d.present.map((p: any) => (
                    <View
                      key={p.id}
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        backgroundColor: colors.bg,
                        padding: space.md,
                        borderRadius: 12,
                      }}>
                      <View style={{ gap: 2 }}>
                        <Text style={{ color: colors.fg, fontFamily: fonts.headingBold, fontSize: 15 }}>
                          {p.client?.full_name ?? 'Member'}
                        </Text>
                        <Muted>Trainer: {p.trainer?.full_name ?? 'Gym Floor'}</Muted>
                      </View>
                      <View style={{ alignItems: 'flex-end', gap: 2 }}>
                        <Text style={{ color: colors.accent, fontFamily: fonts.bodySemi, fontSize: 13 }}>
                          Since {fmtT(p.check_in_at)}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </Card>

            {/* Membership Plan Distribution */}
            {d.totalActive > 0 && (
              <Card style={{ gap: space.md }}>
                <H3>Active Memberships ({d.totalActive})</H3>
                <View style={{ gap: space.sm }}>
                  {Object.entries(d.planCounts).map(([planName, count]) => {
                    return (
                      <View key={planName} style={{ gap: 4 }}>
                        <Row style={{ justifyContent: 'space-between' }}>
                          <Text style={{ color: colors.fg, fontFamily: fonts.bodySemi, fontSize: 14 }}>{planName}</Text>
                          <Text style={{ color: colors.accent, fontFamily: fonts.headingBold, fontSize: 14 }}>
                            {count} member{count > 1 ? 's' : ''} ({Math.round((count / d.totalActive) * 100)}%)
                          </Text>
                        </Row>
                        <Bar value={count} max={d.totalActive} />
                      </View>
                    );
                  })}
                </View>
              </Card>
            )}

            {/* Trainer Performance */}
            <Card style={{ gap: space.md }}>
              <H3>Trainer Performance (Last 30 Days)</H3>
              {d.perf.length === 0 ? (
                <Muted>No trainers active yet.</Muted>
              ) : (
                <View style={{ gap: space.sm }}>
                  {d.perf.map((t: any) => (
                    <View
                      key={t.trainer_id}
                      style={{
                        backgroundColor: colors.bg,
                        padding: space.md,
                        borderRadius: 12,
                        gap: 6,
                      }}>
                      <Row style={{ justifyContent: 'space-between' }}>
                        <Text style={{ color: colors.fg, fontFamily: fonts.headingBold, fontSize: 15 }}>{t.name}</Text>
                        <View style={{ backgroundColor: 'rgba(198,255,61,0.15)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }}>
                          <Text style={{ color: colors.accent, fontFamily: fonts.bodySemi, fontSize: 12 }}>
                            {t.clients} Client{t.clients === 1 ? '' : 's'}
                          </Text>
                        </View>
                      </Row>
                      <Row style={{ gap: space.md }}>
                        <Muted>Sessions done: <Text style={{ color: colors.fg }}>{t.sessions_completed ?? 0}</Text></Muted>
                        {t.check_ins != null && (
                          <Muted>Check-ins: <Text style={{ color: colors.fg }}>{t.check_ins}</Text></Muted>
                        )}
                      </Row>
                    </View>
                  ))}
                </View>
              )}
            </Card>
          </>
        );
      }}</Async>
    </Screen>
  );
}
