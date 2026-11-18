import React from 'react';
import { router } from 'expo-router';
import { Bar, Card, Async, H3, Header, Kpi, Muted, P, Row, Screen, Btn } from '@/components/ui';
import { useAsync } from '@/hooks/useAsync';
import { useAuth } from '@/contexts/AuthContext';
import { q, supabase, todayIST } from '@/lib/supabase';
import { dowIST, fmtD, fmtDT, fmtT } from '@/lib/format';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, space } from '@/theme';

export default function ClientHome() {
  const { user, profile } = useAuth();
  const st = useAsync(async () => {
    const t = todayIST(); const day0 = t + 'T00:00:00+05:30'; const day1 = t + 'T23:59:59+05:30';
    const [mem, asg, plans, water, tgt, steps, att, weight, sess, notifs] = await Promise.all([
      q(supabase.from('client_memberships').select('ends_on,plan:membership_plans(name)').eq('client_id', user!.id).order('ends_on', { ascending: false }).limit(1)),
      q(supabase.from('trainer_assignments').select('trainer_id,status').eq('client_id', user!.id).in('status', ['active', 'transferring', 'pending_handover']).limit(1)),
      q(supabase.from('workout_plans').select('id,name,end_date,training_days,workout_plan_exercises(id)').eq('client_id', user!.id).eq('status', 'active').lte('start_date', t)),
      q(supabase.from('water_logs').select('amount_ml').eq('client_id', user!.id).gte('logged_at', day0).lte('logged_at', day1)),
      q(supabase.from('water_targets').select('*').eq('client_id', user!.id).maybeSingle()),
      q(supabase.from('step_logs').select('steps').eq('client_id', user!.id).eq('logged_on', t).maybeSingle()),
      q(supabase.from('attendance_records').select('check_in_at,check_out_at').eq('client_id', user!.id).eq('gym_date', t).order('check_in_at', { ascending: false })),
      q(supabase.from('weight_logs').select('weight_kg,logged_on').eq('client_id', user!.id).order('logged_on', { ascending: false }).limit(1)),
      q(supabase.from('training_sessions').select('starts_at').eq('client_id', user!.id).eq('status', 'scheduled').gt('starts_at', new Date().toISOString()).order('starts_at').limit(3)),
      q(supabase.from('notifications').select('id,title,created_at').eq('user_id', user!.id).is('read_at', null).order('created_at', { ascending: false }).limit(3)),
    ]);
    let trainer: string | null = null;
    const a0 = (asg as any[])[0];
    if (a0) trainer = (await q(supabase.from('trainer_directory').select('full_name').eq('id', a0.trainer_id).maybeSingle()) as any)?.full_name ?? null;
    const dow = dowIST();
    const todays = (plans as any[]).filter((p) => (!p.end_date || p.end_date >= t) && (!p.training_days?.length || p.training_days.includes(dow)));
    return { mem: (mem as any[])[0], asg: (asg as any[])[0], trainer, todays, waterMl: (water as any[]).reduce((a, w) => a + w.amount_ml, 0), tgt: tgt as any, steps: (steps as any)?.steps, att: att as any[], weight: (weight as any[])[0], sess: sess as any[], notifs: notifs as any[] };
  }, [user?.id]);
  return (
    <Screen onRefresh={st.refresh} refreshing={st.refreshing}>
      <Header eyebrow="Client" title={`Hi, ${profile?.full_name?.split(' ')[0] ?? 'there'}`} />
      <View style={{ flexDirection: 'row', gap: space.md }}>
        {([['Scanner', 'scan', '/member/scan'], ['Workout', 'barbell', '/member/workout'], ['Diet', 'nutrition', '/member/diet'], ['Trackers', 'pulse', '/member/trackers']] as [string, string, string][]).map(([l, ic, to]) => (
          <Pressable key={l} onPress={() => router.push(to as any)} accessibilityRole="button" accessibilityLabel={l} style={({ pressed }) => ({ flex: 1, paddingVertical: 14, borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.bg2, alignItems: 'center', gap: 6, opacity: pressed ? 0.8 : 1 })}>
            <Ionicons name={ic as any} size={24} color={colors.accent} /><Text style={{ color: colors.fg, fontFamily: fonts.bodySemi, fontSize: 12 }}>{l}</Text>
          </Pressable>))}
      </View>
      <Async state={st}>{(d) => {
        const open = d.att.find((a) => !a.check_out_at);
        return (<>
          {d.asg?.status === 'pending_handover' && <Card accent><P>Your trainer change is in progress. Your new trainer starts once the handover is complete.</P></Card>}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.md }}>
            <Kpi label="Membership" value={d.mem?.plan?.name || 'None'} sub={d.mem ? `ends ${fmtD(d.mem.ends_on)}` : 'See plans'} />
            <Kpi label="Trainer" value={d.trainer || 'Not assigned'} />
            <Kpi label="Today" value={open ? 'Inside gym' : d.att.length ? 'Checked out' : 'Not in'} sub={open ? `since ${fmtT(open.check_in_at)}` : undefined} />
            <Kpi label="Weight" value={d.weight ? `${d.weight.weight_kg} kg` : '—'} sub={d.weight ? fmtD(d.weight.logged_on) : undefined} />
            <Kpi label="Steps today" value={d.steps?.toLocaleString('en-IN') ?? '—'} sub={d.tgt?.step_goal ? `goal ${d.tgt.step_goal.toLocaleString('en-IN')}` : undefined} />
          </View>
          <Card style={{ gap: space.sm }}><H3>Today's workout</H3>
            {d.todays.length ? d.todays.map((p: any) => <P key={p.id}>{p.name} · {p.workout_plan_exercises.length} exercises</P>) : <Muted>No workout scheduled today.</Muted>}
            <Btn title="Open workout" variant="ghost" onPress={() => router.push('/member/workout')} /></Card>
          <Card style={{ gap: space.sm }}><H3>Water</H3><Bar value={d.waterMl} max={d.tgt?.target_ml || 0} /><Muted>{d.waterMl} ml {d.tgt?.target_ml ? `of ${d.tgt.target_ml} ml` : '(no target set by your trainer yet)'}</Muted>
            <Btn title="Log water" variant="ghost" onPress={() => router.push('/member/trackers')} /></Card>
          <Card style={{ gap: space.sm }}><H3>Upcoming sessions</H3>{d.sess.length ? d.sess.map((s: any) => <P key={s.starts_at}>{fmtDT(s.starts_at)}</P>) : <Muted>No upcoming sessions.</Muted>}</Card>
          <Card style={{ gap: space.sm }}><H3>Unread notifications</H3>{d.notifs.length ? d.notifs.map((n: any) => <P key={n.id}>{n.title}</P>) : <Muted>You are all caught up.</Muted>}
            <Btn title="All notifications" variant="ghost" onPress={() => router.push('/member/notifications')} /></Card>
        </>);
      }}</Async>
    </Screen>
  );
}
