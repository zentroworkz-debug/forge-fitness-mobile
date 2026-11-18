import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Async, Btn, Card, Chip, Chips, Empty, Field, H3, Header, Muted, Row, Screen, useToast } from '@/components/ui';
import { DatePickerField } from '@/components/DatePickerField';
import { useAsync } from '@/hooks/useAsync';
import { niceError, q, supabase, todayIST } from '@/lib/supabase';
import { fmtDT, fmtT } from '@/lib/format';
import { colors, fonts, space } from '@/theme';

export default function AdminCalendar() {
  const toast = useToast();
  const today = todayIST();

  const [tab, setTab] = useState<'events' | 'sessions'>('events');

  // Event modal state
  const [eventOpen, setEventOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [kind, setKind] = useState('Workshop');
  const [eventDate, setEventDate] = useState(today);
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('12:00');
  const [desc, setDesc] = useState('');

  // Session modal state
  const [sessionOpen, setSessionOpen] = useState(false);
  const [selClient, setSelClient] = useState('');
  const [selTrainer, setSelTrainer] = useState('');
  const [sessionDate, setSessionDate] = useState(today);
  const [sessStart, setSessStart] = useState('09:00');
  const [sessEnd, setSessEnd] = useState('10:00');

  const [busy, setBusy] = useState(false);

  const st = useAsync(async () => {
    const [sess, evts, clientsRes, trainersRes] = await Promise.all([
      q(supabase.from('training_sessions')
        .select('id,starts_at,ends_at,status,client:profiles!training_sessions_client_id_fkey(full_name),trainer:profiles!training_sessions_trainer_id_fkey(full_name)')
        .order('starts_at', { ascending: true })
        .limit(30)),
      q(supabase.from('gym_events').select('*').order('starts_at', { ascending: true }).limit(30)),
      q(supabase.from('profiles').select('id,full_name').eq('requested_role', 'client').limit(50)),
      q(supabase.from('profiles').select('id,full_name').eq('requested_role', 'trainer').limit(50)),
    ]);
    return {
      sessions: (sess as any[]) || [],
      events: (evts as any[]) || [],
      clients: (clientsRes as any[]) || [],
      trainers: (trainersRes as any[]) || [],
    };
  }, []);

  const saveEvent = async () => {
    if (!title.trim() || !eventDate) {
      toast.show('error', 'Enter title and date.');
      return;
    }
    setBusy(true);
    try {
      const startsAt = `${eventDate}T${startTime}:00+05:30`;
      const endsAt = `${eventDate}T${endTime}:00+05:30`;

      const { error } = await supabase.from('gym_events').insert({
        title: title.trim(),
        kind,
        starts_at: startsAt,
        ends_at: endsAt,
        description: desc.trim() || null,
      });
      if (error) throw error;

      toast.show('success', 'Gym event published!');
      setTitle(''); setDesc(''); setEventOpen(false);
      st.reload();
    } catch (e) {
      toast.show('error', niceError(e));
    } finally {
      setBusy(false);
    }
  };

  const saveSession = async () => {
    if (!selClient || !selTrainer) {
      toast.show('error', 'Select both client and trainer.');
      return;
    }
    setBusy(true);
    try {
      const startsAt = `${sessionDate}T${sessStart}:00+05:30`;
      const endsAt = `${sessionDate}T${sessEnd}:00+05:30`;

      const { error } = await supabase.from('training_sessions').insert({
        client_id: selClient,
        trainer_id: selTrainer,
        starts_at: startsAt,
        ends_at: endsAt,
        status: 'scheduled',
      });
      if (error) throw error;

      toast.show('success', 'Training session scheduled!');
      setSessionOpen(false);
      st.reload();
    } catch (e) {
      toast.show('error', niceError(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen onRefresh={st.refresh} refreshing={st.refreshing}>
      <Header eyebrow="Admin" title="Calendar & Events" back="/manage/more" />
      {toast.node}

      <Row style={{ gap: space.sm }}>
        <Pressable
          onPress={() => { setTab('events'); setEventOpen(false); setSessionOpen(false); }}
          style={{ flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10, borderWidth: 1, borderColor: tab === 'events' ? colors.accent : colors.border, backgroundColor: tab === 'events' ? colors.accent : colors.bg2 }}>
          <Text style={{ color: tab === 'events' ? colors.onAccent : colors.fg, fontFamily: fonts.bodySemi }}>Gym Events</Text>
        </Pressable>
        <Pressable
          onPress={() => { setTab('sessions'); setEventOpen(false); setSessionOpen(false); }}
          style={{ flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10, borderWidth: 1, borderColor: tab === 'sessions' ? colors.accent : colors.border, backgroundColor: tab === 'sessions' ? colors.accent : colors.bg2 }}>
          <Text style={{ color: tab === 'sessions' ? colors.onAccent : colors.fg, fontFamily: fonts.bodySemi }}>Sessions</Text>
        </Pressable>
      </Row>

      {tab === 'events' ? (
        <>
          <Card style={{ gap: space.md }}>
            <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flex: 1, gap: 2, marginRight: space.sm }}>
                <H3>Upcoming Events</H3>
                <Muted>Classes, workshops and seminars</Muted>
              </View>
              <Btn
                title={eventOpen ? 'Close' : '+ New Event'}
                variant={eventOpen ? 'ghost' : 'primary'}
                onPress={() => setEventOpen(!eventOpen)}
                style={{ paddingHorizontal: 12, minHeight: 40 }}
              />
            </Row>

            {eventOpen && (
              <Card style={{ gap: space.sm, backgroundColor: colors.bg }}>
                <H3>Add Gym Event</H3>
                <Field label="Event Title" value={title} onChangeText={setTitle} placeholder="e.g. HIIT Boot Camp" />
                <Field label="Category / Kind" value={kind} onChangeText={setKind} placeholder="Workshop, Class, Seminar" />
                <DatePickerField label="Event Date" value={eventDate} onChange={setEventDate} minDate={today} />
                <Row style={{ gap: space.sm }}>
                  <View style={{ flex: 1 }}><Field label="Start Time (HH:MM)" value={startTime} onChangeText={setStartTime} placeholder="10:00" /></View>
                  <View style={{ flex: 1 }}><Field label="End Time (HH:MM)" value={endTime} onChangeText={setEndTime} placeholder="12:00" /></View>
                </Row>
                <Field label="Description" value={desc} onChangeText={setDesc} multiline placeholder="Event details for members..." />
                <Btn title="Publish Event" onPress={saveEvent} loading={busy} />
              </Card>
            )}
          </Card>

          <Async state={st}>{(d) => (
            <View style={{ gap: space.md }}>
              {d.events.length === 0 ? (
                <Empty text="No upcoming gym events." />
              ) : (
                d.events.map((e: any) => (
                  <Card key={e.id} style={{ gap: space.xs }}>
                    <Row style={{ justifyContent: 'space-between' }}>
                      <Text style={{ color: colors.fg, fontFamily: fonts.headingBold, fontSize: 16 }}>{e.title}</Text>
                      <View style={{ backgroundColor: colors.bg, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, borderWidth: 1, borderColor: colors.border }}>
                        <Text style={{ color: colors.accent, fontFamily: fonts.bodySemi, fontSize: 12 }}>{e.kind}</Text>
                      </View>
                    </Row>
                    <Muted>{fmtDT(e.starts_at)} {e.ends_at ? `– ${fmtT(e.ends_at)}` : ''}</Muted>
                    {!!e.description && <Text style={{ color: colors.muted, fontFamily: fonts.body, fontSize: 13, marginTop: 4 }}>{e.description}</Text>}
                  </Card>
                ))
              )}
            </View>
          )}</Async>
        </>
      ) : (
        <>
          <Card style={{ gap: space.md }}>
            <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flex: 1, gap: 2, marginRight: space.sm }}>
                <H3>Training Sessions</H3>
                <Muted>1-on-1 client & coach sessions</Muted>
              </View>
              <Btn
                title={sessionOpen ? 'Close' : '+ New Session'}
                variant={sessionOpen ? 'ghost' : 'primary'}
                onPress={() => setSessionOpen(!sessionOpen)}
                style={{ paddingHorizontal: 12, minHeight: 40 }}
              />
            </Row>

            {sessionOpen && (
              <Async state={st}>{(d) => (
                <Card style={{ gap: space.sm, backgroundColor: colors.bg }}>
                  <H3>Schedule Training Session</H3>
                  <Muted>Select client:</Muted>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.sm }}>
                    {d.clients.map((c: any) => (
                      <Chip key={c.id} label={c.full_name} active={selClient === c.id} onPress={() => setSelClient(c.id)} />
                    ))}
                  </ScrollView>

                  <Muted>Select trainer:</Muted>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.sm }}>
                    {d.trainers.map((t: any) => (
                      <Chip key={t.id} label={t.full_name} active={selTrainer === t.id} onPress={() => setSelTrainer(t.id)} />
                    ))}
                  </ScrollView>

                  <DatePickerField label="Session Date" value={sessionDate} onChange={setSessionDate} minDate={today} />
                  <Row style={{ gap: space.sm }}>
                    <View style={{ flex: 1 }}><Field label="Start Time (HH:MM)" value={sessStart} onChangeText={setSessStart} placeholder="09:00" /></View>
                    <View style={{ flex: 1 }}><Field label="End Time (HH:MM)" value={sessEnd} onChangeText={setSessEnd} placeholder="10:00" /></View>
                  </Row>
                  <Btn title="Schedule Session" onPress={saveSession} loading={busy} />
                </Card>
              )}</Async>
            )}
          </Card>

          <Async state={st}>{(d) => (
            <View style={{ gap: space.md }}>
              {d.sessions.length === 0 ? (
                <Empty text="No scheduled sessions." />
              ) : (
                d.sessions.map((s: any) => (
                  <Card key={s.id} style={{ gap: space.xs }}>
                    <Row style={{ justifyContent: 'space-between' }}>
                      <Text style={{ color: colors.fg, fontFamily: fonts.headingBold, fontSize: 15 }}>
                        {s.client?.full_name ?? 'Client'} w/ {s.trainer?.full_name ?? 'Trainer'}
                      </Text>
                      <View style={{ backgroundColor: s.status === 'completed' ? colors.accent : colors.border, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }}>
                        <Text style={{ color: s.status === 'completed' ? colors.onAccent : colors.fg, fontSize: 11, fontFamily: fonts.bodySemi }}>{s.status}</Text>
                      </View>
                    </Row>
                    <Muted>{fmtDT(s.starts_at)} – {fmtT(s.ends_at)}</Muted>
                  </Card>
                ))
              )}
            </View>
          )}</Async>
        </>
      )}
    </Screen>
  );
}
