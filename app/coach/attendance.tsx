import React, { useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Async, Btn, Card, Chip, Chips, Empty, Field, H3, Header, Kpi, Muted, Row, Screen, useToast } from '@/components/ui';
import { useAsync } from '@/hooks/useAsync';
import { useAuth } from '@/contexts/AuthContext';
import { niceError, q, supabase, todayIST } from '@/lib/supabase';
import { fmtT } from '@/lib/format';
import { fmtDur, minutesBetween } from '@/lib/attendanceView';
import { colors, fonts, space } from '@/theme';

export default function TrainerAttendanceMonitor() {
  const { user } = useAuth();
  const toast = useToast();
  const today = todayIST();

  const [filter, setFilter] = useState<'all' | 'inside' | 'completed'>('all');
  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const st = useAsync(async () => {
    const res = await q(supabase.from('attendance_records')
      .select('id,client_id,gym_date,check_in_at,check_out_at,missed,client:profiles!attendance_records_client_id_fkey(id,full_name,phone)')
      .eq('gym_date', today)
      .order('check_in_at', { ascending: false }));
    return (res as any[]) || [];
  }, [user?.id]);

  const markCheckOut = (recordId: string, clientName: string) => {
    Alert.alert('Mark Check-Out', `Record check-out for ${clientName} now?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Check Out',
        onPress: async () => {
          setBusyId(recordId);
          const { error } = await supabase.from('attendance_records')
            .update({ check_out_at: new Date().toISOString() })
            .eq('id', recordId);
          setBusyId(null);
          if (error) toast.show('error', niceError(error));
          else {
            toast.show('success', `Check-out recorded for ${clientName}`);
            st.reload();
          }
        },
      },
    ]);
  };

  return (
    <Screen onRefresh={st.refresh} refreshing={st.refreshing}>
      <Header eyebrow="Trainer" title="Attendance Monitor" back="/coach/more" />
      {toast.node}

      <Async state={st}>{(records) => {
        const insideList = records.filter((r) => !r.check_out_at && !r.missed);
        const completedList = records.filter((r) => !!r.check_out_at);

        const filtered = records.filter((r) => {
          const name = r.client?.full_name?.toLowerCase() || '';
          const matchSearch = name.includes(search.toLowerCase());
          if (!matchSearch) return false;
          if (filter === 'inside') return !r.check_out_at && !r.missed;
          if (filter === 'completed') return !!r.check_out_at;
          return true;
        });

        return (
          <>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.md }}>
              <Kpi label="Inside Gym Now" value={insideList.length} sub="Active on floor" />
              <Kpi label="Completed Workouts" value={completedList.length} sub="Checked out" />
              <Kpi label="Total Check-ins" value={records.length} sub="Today" />
            </View>

            <Card style={{ gap: space.sm }}>
              <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flex: 1, gap: 2, marginRight: space.sm }}>
                  <H3>Show Attendance QR</H3>
                  <Muted>Display check-in/out QR for clients</Muted>
                </View>
                <Btn
                  title="Open QR"
                  icon={<Ionicons name="qr-code" size={18} color={colors.onAccent} />}
                  onPress={() => router.push('/coach/qr')}
                  style={{ minHeight: 40, paddingHorizontal: 14 }}
                />
              </Row>
            </Card>

            <Chips>
              <Chip label={`All (${records.length})`} active={filter === 'all'} onPress={() => setFilter('all')} />
              <Chip label={`Inside Now (${insideList.length})`} active={filter === 'inside'} onPress={() => setFilter('inside')} />
              <Chip label={`Completed (${completedList.length})`} active={filter === 'completed'} onPress={() => setFilter('completed')} />
            </Chips>

            <Field
              label=""
              placeholder="Search by client name..."
              value={search}
              onChangeText={setSearch}
            />

            {!filtered.length ? (
              <Empty text="No attendance records match your filter." />
            ) : (
              <View style={{ gap: space.sm }}>
                {filtered.map((r) => {
                  const isInside = !r.check_out_at && !r.missed;
                  const name = r.client?.full_name ?? 'Client';
                  const duration = r.check_out_at ? minutesBetween(r.check_in_at, r.check_out_at) : null;

                  return (
                    <Card key={r.id} accent={isInside} style={{ gap: space.sm }}>
                      <Row style={{ justifyContent: 'space-between' }}>
                        <View style={{ gap: 2, flex: 1 }}>
                          <Text style={{ color: colors.fg, fontFamily: fonts.headingBold, fontSize: 16 }}>{name}</Text>
                          <Muted>{r.client?.phone || 'No phone'}</Muted>
                        </View>
                        <View style={{ backgroundColor: isInside ? colors.accent : 'transparent', borderWidth: 1, borderColor: isInside ? colors.accent : colors.border, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 6 }}>
                          <Text style={{ color: isInside ? colors.onAccent : colors.muted, fontSize: 11, fontFamily: fonts.bodySemi }}>
                            {isInside ? 'INSIDE' : 'CHECKED OUT'}
                          </Text>
                        </View>
                      </Row>

                      <Row style={{ justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 8 }}>
                        <View style={{ flex: 1, gap: 2, marginRight: space.sm }}>
                          <Text style={{ color: colors.muted, fontSize: 13 }}>
                            In: <Text style={{ color: colors.fg, fontFamily: fonts.bodySemi }}>{fmtT(r.check_in_at)}</Text>
                            {r.check_out_at && (
                              <Text> · Out: <Text style={{ color: colors.fg, fontFamily: fonts.bodySemi }}>{fmtT(r.check_out_at)}</Text></Text>
                            )}
                          </Text>
                          {duration != null && (
                            <Muted>Workout duration: {fmtDur(duration)}</Muted>
                          )}
                        </View>

                        {isInside && (
                          <Btn
                            title="Check Out"
                            variant="ghost"
                            loading={busyId === r.id}
                            onPress={() => markCheckOut(r.id, name)}
                            style={{ minHeight: 36, paddingHorizontal: 10 }}
                          />
                        )}
                      </Row>
                    </Card>
                  );
                })}
              </View>
            )}
          </>
        );
      }}</Async>
    </Screen>
  );
}
