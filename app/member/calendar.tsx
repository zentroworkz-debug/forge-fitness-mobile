import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Async, Card, Empty, H3, Header, Muted, Row, Screen } from '@/components/ui';
import { useAsync } from '@/hooks/useAsync';
import { useAuth } from '@/contexts/AuthContext';
import { q, supabase, todayIST } from '@/lib/supabase';
import { fmtD, fmtDT, fmtT } from '@/lib/format';
import { colors, fonts, space } from '@/theme';

export default function ClientCalendar() {
  const { user } = useAuth();
  const [tab, setTab] = useState<'sessions' | 'events'>('sessions');

  const st = useAsync(async () => {
    const [sess, evts] = await Promise.all([
      q(supabase.from('training_sessions')
        .select('id,starts_at,ends_at,status,trainer:profiles!training_sessions_trainer_id_fkey(full_name)')
        .eq('client_id', user!.id)
        .order('starts_at', { ascending: true })),
      q(supabase.from('gym_events')
        .select('id,title,kind,starts_at,ends_at,description')
        .order('starts_at', { ascending: true })
        .limit(30)),
    ]);
    return { sess: (sess as any[]) || [], evts: (evts as any[]) || [] };
  }, [user?.id]);

  return (
    <Screen onRefresh={st.refresh} refreshing={st.refreshing}>
      <Header eyebrow="Client" title="Calendar & Sessions" back="/member/more" />
      <View style={{ flexDirection: 'row', gap: space.sm }}>
        <Pressable onPress={() => setTab('sessions')} style={{ flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 12, borderWidth: 1, borderColor: tab === 'sessions' ? colors.accent : colors.border, backgroundColor: tab === 'sessions' ? colors.accent : colors.bg2 }}>
          <Text style={{ color: tab === 'sessions' ? colors.onAccent : colors.fg, fontFamily: fonts.bodySemi }}>My Sessions</Text>
        </Pressable>
        <Pressable onPress={() => setTab('events')} style={{ flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 12, borderWidth: 1, borderColor: tab === 'events' ? colors.accent : colors.border, backgroundColor: tab === 'events' ? colors.accent : colors.bg2 }}>
          <Text style={{ color: tab === 'events' ? colors.onAccent : colors.fg, fontFamily: fonts.bodySemi }}>Gym Events</Text>
        </Pressable>
      </View>

      <Async state={st}>{(d) => {
        if (tab === 'sessions') {
          if (!d.sess.length) return <Empty text="No training sessions scheduled yet." />;
          return (
            <View style={{ gap: space.md }}>
              {d.sess.map((s: any) => {
                const isPast = new Date(s.starts_at) < new Date();
                return (
                  <Card key={s.id} accent={!isPast && s.status === 'scheduled'}>
                    <Row style={{ justifyContent: 'space-between' }}>
                      <Text style={{ color: colors.fg, fontFamily: fonts.headingBold, fontSize: 16 }}>{s.trainer?.full_name ?? 'Trainer'}</Text>
                      <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: s.status === 'completed' ? colors.accent : s.status === 'cancelled' ? colors.danger : colors.bg }}>
                        <Text style={{ color: s.status === 'completed' ? colors.onAccent : colors.fg, fontFamily: fonts.bodySemi, fontSize: 12 }}>{s.status}</Text>
                      </View>
                    </Row>
                    <Muted>{fmtDT(s.starts_at)} – {fmtT(s.ends_at)}</Muted>
                  </Card>
                );
              })}
            </View>
          );
        }

        if (!d.evts.length) return <Empty text="No gym events scheduled." />;
        return (
          <View style={{ gap: space.md }}>
            {d.evts.map((e: any) => (
              <Card key={e.id}>
                <Row style={{ justifyContent: 'space-between' }}>
                  <Text style={{ color: colors.fg, fontFamily: fonts.headingBold, fontSize: 16 }}>{e.title}</Text>
                  <Text style={{ color: colors.accent, fontFamily: fonts.bodySemi, fontSize: 12 }}>{e.kind}</Text>
                </Row>
                <Muted>{fmtDT(e.starts_at)} {e.ends_at ? `– ${fmtT(e.ends_at)}` : ''}</Muted>
                {!!e.description && <Text style={{ color: colors.fg, fontFamily: fonts.body, fontSize: 14 }}>{e.description}</Text>}
              </Card>
            ))}
          </View>
        );
      }}</Async>
    </Screen>
  );
}
