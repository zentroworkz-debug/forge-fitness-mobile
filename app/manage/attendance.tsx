import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { Async, Card, Empty, Field, H3, Header, Kpi, Muted, Row, Screen } from '@/components/ui';
import { useAsync } from '@/hooks/useAsync';
import { q, supabase, todayIST } from '@/lib/supabase';
import { fmtD, fmtDT, fmtT } from '@/lib/format';
import { colors, fonts, space } from '@/theme';

export default function AdminAttendance() {
  const today = todayIST();
  const [search, setSearch] = useState('');

  const st = useAsync(async () => {
    const res = await q(supabase.from('attendance_records')
      .select('id,gym_date,check_in_at,check_out_at,client:profiles!attendance_records_client_id_fkey(full_name),trainer:profiles!attendance_records_trainer_id_fkey(full_name)')
      .order('check_in_at', { ascending: false })
      .limit(100));

    const records = (res as any[]) || [];
    const insideCount = records.filter((r) => !r.check_out_at && r.gym_date === today).length;
    const uniqueClients = new Set(records.map((r) => r.client?.full_name).filter(Boolean)).size;

    return { records, insideCount, uniqueClients };
  }, []);

  return (
    <Screen onRefresh={st.refresh} refreshing={st.refreshing}>
      <Header eyebrow="Admin" title="Gym Attendance" back="/manage/more" />

      <Async state={st}>{(d) => {
        const filtered = d.records.filter((r: any) =>
          !search || (r.client?.full_name || '').toLowerCase().includes(search.toLowerCase())
        );

        return (
          <>
            <View style={{ flexDirection: 'row', gap: space.md }}>
              <Kpi label="Inside Gym Now" value={d.insideCount} />
              <Kpi label="Unique Clients" value={d.uniqueClients} />
            </View>

            <Field label="Search by client name" value={search} onChangeText={setSearch} placeholder="Filter records..." />

            <View style={{ gap: space.md }}>
              {filtered.length === 0 ? (
                <Empty text="No attendance records found." />
              ) : (
                filtered.map((r: any) => {
                  const isInside = !r.check_out_at && r.gym_date === today;
                  return (
                    <Card key={r.id} accent={isInside}>
                      <Row style={{ justifyContent: 'space-between' }}>
                        <Text style={{ color: colors.fg, fontFamily: fonts.headingBold, fontSize: 16 }}>{r.client?.full_name ?? 'Client'}</Text>
                        <View style={{ backgroundColor: isInside ? colors.accent : colors.bg, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }}>
                          <Text style={{ color: isInside ? colors.onAccent : colors.muted, fontSize: 11, fontFamily: fonts.bodySemi }}>
                            {isInside ? 'INSIDE' : fmtD(r.gym_date)}
                          </Text>
                        </View>
                      </Row>
                      <Muted>Check-in: {fmtT(r.check_in_at)} {r.check_out_at ? `· Check-out: ${fmtT(r.check_out_at)}` : ''}</Muted>
                      {!!r.trainer?.full_name && <Muted>Verified by: {r.trainer.full_name}</Muted>}
                    </Card>
                  );
                })
              )}
            </View>
          </>
        );
      }}</Async>
    </Screen>
  );
}
