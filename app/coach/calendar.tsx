import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Async, Btn, Card, Chip, Empty, Field, H3, Header, Muted, Row, Screen, useToast } from '@/components/ui';
import { DatePickerField } from '@/components/DatePickerField';
import { useAsync } from '@/hooks/useAsync';
import { useAuth } from '@/contexts/AuthContext';
import { niceError, q, supabase, todayIST } from '@/lib/supabase';
import { fmtDT, fmtT } from '@/lib/format';
import { colors, fonts, space } from '@/theme';

export default function TrainerCalendar() {
  const { user } = useAuth();
  const toast = useToast();
  const today = todayIST();

  const [bookOpen, setBookOpen] = useState(false);
  const [selClient, setSelClient] = useState('');
  const [date, setDate] = useState(today);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [busy, setBusy] = useState(false);

  const st = useAsync(async () => {
    const [sess, asg, evts] = await Promise.all([
      q(supabase.from('training_sessions')
        .select('id,starts_at,ends_at,status,client:profiles!training_sessions_client_id_fkey(id,full_name)')
        .eq('trainer_id', user!.id)
        .order('starts_at', { ascending: true })),
      q(supabase.from('trainer_assignments')
        .select('client:profiles!trainer_assignments_client_id_fkey(id,full_name)')
        .eq('trainer_id', user!.id)
        .eq('status', 'active')),
      q(supabase.from('gym_events').select('*').order('starts_at', { ascending: true }).limit(20)),
    ]);
    const clients = (asg as any[]).map((a) => a.client).filter(Boolean);
    return {
      sess: (sess as any[]) || [],
      clients,
      evts: (evts as any[]) || [],
    };
  }, [user?.id]);

  const scheduleSession = async () => {
    if (!selClient) { toast.show('error', 'Select a client.'); return; }
    if (!date || !startTime || !endTime) { toast.show('error', 'Enter date and times.'); return; }

    setBusy(true);
    try {
      const startsAt = `${date}T${startTime}:00+05:30`;
      const endsAt = `${date}T${endTime}:00+05:30`;

      const { error } = await supabase.from('training_sessions').insert({
        trainer_id: user!.id,
        client_id: selClient,
        starts_at: startsAt,
        ends_at: endsAt,
        status: 'scheduled',
      });
      if (error) throw error;

      toast.show('success', 'Training session scheduled!');
      setBookOpen(false);
      st.reload();
    } catch (e) {
      toast.show('error', niceError(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen onRefresh={st.refresh} refreshing={st.refreshing}>
      <Header eyebrow="Trainer" title="Sessions & Calendar" back="/coach/more" />
      {toast.node}

      <Card style={{ gap: space.md }}>
        <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flex: 1, gap: 2, marginRight: space.sm }}>
            <H3>Scheduled Sessions</H3>
            <Muted>Book and manage client training</Muted>
          </View>
          <Btn
            title={bookOpen ? 'Close' : '+ New Session'}
            variant={bookOpen ? 'ghost' : 'primary'}
            onPress={() => setBookOpen(!bookOpen)}
            style={{ paddingHorizontal: 12, minHeight: 40 }}
          />
        </Row>

        {bookOpen && (
          <Async state={st}>{(d) => (
            <Card style={{ backgroundColor: colors.bg, gap: space.sm }}>
              <H3>Book Client Session</H3>
              <Muted>Choose client:</Muted>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.sm }}>
                {d.clients.map((c: any) => (
                  <Chip key={c.id} label={c.full_name} active={selClient === c.id} onPress={() => setSelClient(c.id)} />
                ))}
              </ScrollView>
              <DatePickerField label="Session Date" value={date} onChange={setDate} minDate={today} />
              <Row style={{ gap: space.sm }}>
                <View style={{ flex: 1 }}><Field label="Start Time (HH:MM)" value={startTime} onChangeText={setStartTime} placeholder="09:00" /></View>
                <View style={{ flex: 1 }}><Field label="End Time (HH:MM)" value={endTime} onChangeText={setEndTime} placeholder="10:00" /></View>
              </Row>
              <Btn title="Schedule Session" onPress={scheduleSession} loading={busy} />
            </Card>
          )}</Async>
        )}
      </Card>

      <Async state={st}>{(d) => (
        <View style={{ gap: space.md }}>
          {d.sess.length === 0 ? (
            <Empty text="No training sessions scheduled." />
          ) : (
            d.sess.map((s: any) => {
              const isPast = new Date(s.starts_at) < new Date();
              return (
                <Card key={s.id} accent={!isPast && s.status === 'scheduled'} style={{ gap: space.sm }}>
                  <Row style={{ justifyContent: 'space-between' }}>
                    <Text style={{ color: colors.fg, fontFamily: fonts.headingBold, fontSize: 16 }}>
                      {s.client?.full_name ?? 'Client Session'}
                    </Text>
                    <View style={{ backgroundColor: isPast ? colors.border : colors.accent, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }}>
                      <Text style={{ color: isPast ? colors.muted : colors.onAccent, fontSize: 11, fontFamily: fonts.bodySemi, textTransform: 'uppercase' }}>
                        {isPast ? 'PAST' : s.status}
                      </Text>
                    </View>
                  </Row>
                  <Muted>{fmtDT(s.starts_at)} → {fmtT(s.ends_at)}</Muted>
                </Card>
              );
            })
          )}
        </View>
      )}</Async>
    </Screen>
  );
}
