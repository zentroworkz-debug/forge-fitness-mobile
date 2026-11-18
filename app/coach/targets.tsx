import React, { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Async, Btn, Card, Chip, Field, H3, Header, Kpi, Muted, Row, Screen, useToast } from '@/components/ui';
import { useAsync } from '@/hooks/useAsync';
import { useAuth } from '@/contexts/AuthContext';
import { niceError, q, supabase } from '@/lib/supabase';
import { colors, fonts, space } from '@/theme';

export default function TargetsAndReminders() {
  const { user } = useAuth();
  const { client: paramClient } = useLocalSearchParams<{ client?: string }>();
  const toast = useToast();

  const [client, setClient] = useState(paramClient || '');
  const [targetWater, setTargetWater] = useState('3000');
  const [sleepTargetMin, setSleepTargetMin] = useState('480');
  const [stepGoal, setStepGoal] = useState('8000');
  const [reminderMin, setReminderMin] = useState('120');
  const [busy, setBusy] = useState(false);

  const st = useAsync(async () => {
    const asg = await q(supabase.from('trainer_assignments')
      .select('client_id,status,client:profiles!trainer_assignments_client_id_fkey(id,full_name)')
      .eq('trainer_id', user!.id)
      .eq('status', 'active'));
    const clients = (asg as any[]).map((a) => a.client).filter(Boolean);
    return { clients };
  }, [user?.id]);

  const clientTargetsSt = useAsync(async () => {
    if (!client) return null;
    const [tgt, waterLogs, sleepLogs] = await Promise.all([
      q(supabase.from('water_targets').select('*').eq('client_id', client).maybeSingle()),
      q(supabase.from('water_logs').select('amount_ml,logged_at').eq('client_id', client).gte('logged_at', new Date(Date.now() - 7 * 864e5).toISOString())),
      q(supabase.from('sleep_logs').select('duration_min').eq('client_id', client).order('sleep_date', { ascending: false }).limit(7)),
    ]);
    if (tgt) {
      if ((tgt as any).target_ml) setTargetWater(String((tgt as any).target_ml));
      if ((tgt as any).sleep_target_min) setSleepTargetMin(String((tgt as any).sleep_target_min));
      if ((tgt as any).step_goal) setStepGoal(String((tgt as any).step_goal));
      if ((tgt as any).reminder_every_min) setReminderMin(String((tgt as any).reminder_every_min));
    }
    const wl = (waterLogs as any[]) || [];
    const sl = (sleepLogs as any[]) || [];
    const avgWater = wl.length ? Math.round(wl.reduce((a, b) => a + b.amount_ml, 0) / 7) : null;
    const avgSleep = sl.length ? Math.round(sl.reduce((a, b) => a + b.duration_min, 0) / sl.length) : null;
    return { tgt: tgt as any, avgWater, avgSleep };
  }, [client]);

  const saveTargets = async () => {
    if (!client) { toast.show('error', 'Select a client first.'); return; }
    setBusy(true);
    try {
      const { error } = await supabase.from('water_targets').upsert({
        client_id: client,
        target_ml: Number(targetWater) || 3000,
        sleep_target_min: Number(sleepTargetMin) || 480,
        step_goal: Number(stepGoal) || 8000,
        reminder_every_min: reminderMin ? Number(reminderMin) : null,
        set_by: user!.id,
      });
      if (error) throw error;
      toast.show('success', 'Targets updated for client!');
      clientTargetsSt.reload();
    } catch (e) {
      toast.show('error', niceError(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen onRefresh={st.refresh} refreshing={st.refreshing}>
      <Header eyebrow="Trainer" title="Targets & Reminders" back="/coach/more" />
      {toast.node}

      <Async state={st}>{(d) => (
        <>
          <Card style={{ gap: space.md }}>
            <H3>Select Client</H3>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.sm }}>
              {d.clients.map((c: any) => (
                <Chip key={c.id} label={c.full_name} active={client === c.id} onPress={() => setClient(c.id)} />
              ))}
            </ScrollView>
          </Card>

          {!!client && (
            <Async state={clientTargetsSt}>{(cData) => (
              <>
                <View style={{ flexDirection: 'row', gap: space.md }}>
                  <Kpi label="Avg Water (7d)" value={cData?.avgWater ? `${cData.avgWater} ml` : '—'} />
                  <Kpi label="Avg Sleep (7d)" value={cData?.avgSleep ? `${Math.round(cData.avgSleep / 60)}h ${cData.avgSleep % 60}m` : '—'} />
                </View>

                <Card style={{ gap: space.md }}>
                  <H3>Daily Goals & Limits</H3>
                  <Field label="Daily Water Target (ml)" value={targetWater} onChangeText={setTargetWater} keyboardType="numeric" />
                  <Field label="Water Reminder Frequency (minutes)" value={reminderMin} onChangeText={setReminderMin} keyboardType="numeric" placeholder="e.g. 120" />
                  <Field label="Sleep Target (minutes, e.g. 480 = 8h)" value={sleepTargetMin} onChangeText={setSleepTargetMin} keyboardType="numeric" />
                  <Field label="Daily Step Goal" value={stepGoal} onChangeText={setStepGoal} keyboardType="numeric" />
                  <Btn title="Save Targets" onPress={saveTargets} loading={busy} />
                </Card>
              </>
            )}</Async>
          )}
        </>
      )}</Async>
    </Screen>
  );
}
