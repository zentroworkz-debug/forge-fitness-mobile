import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Async, Btn, Card, Chip, Empty, Field, H3, Header, Kpi, Muted, Row, Screen, useToast } from '@/components/ui';
import { BarChart } from '@/components/BarChart';
import { useAsync } from '@/hooks/useAsync';
import { useAuth } from '@/contexts/AuthContext';
import { niceError, q, supabase, todayIST } from '@/lib/supabase';
import { fmtD } from '@/lib/format';
import { colors, fonts, space } from '@/theme';

export default function ClientProgress() {
  const { user } = useAuth();
  const toast = useToast();
  const today = todayIST();

  const [activeTab, setActiveTab] = useState<'measurements' | 'weight'>('measurements');
  const [logOpen, setLogOpen] = useState(false);

  // Measurement fields
  const [waist, setWaist] = useState('');
  const [chest, setChest] = useState('');
  const [arms, setArms] = useState('');
  const [thighs, setThighs] = useState('');

  // Weight & Height fields
  const [weightKg, setWeightKg] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [bodyFat, setBodyFat] = useState('');

  const [busy, setBusy] = useState(false);

  const st = useAsync(async () => {
    const [att, weights, measures, cpRes] = await Promise.all([
      q(supabase.from('attendance_records').select('id,gym_date,check_in_at').eq('client_id', user!.id)),
      q(supabase.from('weight_logs').select('id,weight_kg,height_cm,body_fat_pct,logged_on').eq('client_id', user!.id).order('logged_on', { ascending: false }).limit(30)),
      q(supabase.from('body_measurements').select('id,logged_on,waist_cm,chest_cm,arms_cm,thighs_cm').eq('client_id', user!.id).order('logged_on', { ascending: false }).limit(30)),
      supabase.from('client_profiles').select('age,fitness_goal,experience_level').eq('id', user!.id).maybeSingle(),
    ]);
    return {
      att: (att as any[]) || [],
      weights: (weights as any[]) || [],
      measures: (measures as any[]) || [],
      cp: cpRes.data as any,
    };
  }, [user?.id]);

  const saveMeasures = async () => {
    if (!waist && !chest && !arms && !thighs) {
      toast.show('error', 'Enter at least one measurement.');
      return;
    }
    setBusy(true);
    const { error } = await supabase.from('body_measurements').insert({
      client_id: user!.id,
      logged_on: today,
      waist_cm: waist ? Number(waist) : null,
      chest_cm: chest ? Number(chest) : null,
      arms_cm: arms ? Number(arms) : null,
      thighs_cm: thighs ? Number(thighs) : null,
    });
    setBusy(false);
    if (error) {
      toast.show('error', niceError(error));
    } else {
      toast.show('success', 'Measurements recorded!');
      setWaist(''); setChest(''); setArms(''); setThighs('');
      setLogOpen(false);
      st.reload();
    }
  };

  const saveWeight = async () => {
    const w = Number(weightKg);
    if (!w || isNaN(w) || w < 20 || w > 400) {
      toast.show('error', 'Enter a valid weight between 20 and 400 kg.');
      return;
    }
    setBusy(true);
    const payload: any = {
      client_id: user!.id,
      logged_on: today,
      weight_kg: w,
    };
    if (heightCm && !isNaN(Number(heightCm))) payload.height_cm = Number(heightCm);
    if (bodyFat && !isNaN(Number(bodyFat))) payload.body_fat_pct = Number(bodyFat);

    const { error } = await supabase.from('weight_logs').upsert(payload, { onConflict: 'client_id,logged_on' });
    setBusy(false);
    if (error) {
      toast.show('error', niceError(error));
    } else {
      toast.show('success', 'Weight recorded!');
      setWeightKg(''); setHeightCm(''); setBodyFat('');
      setLogOpen(false);
      st.reload();
    }
  };

  return (
    <Screen onRefresh={st.refresh} refreshing={st.refreshing}>
      <Header eyebrow="Client" title="My Progress & Metrics" back="/member/more" />
      {toast.node}

      <Async state={st}>{(d) => {
        const latestW = d.weights[0]?.weight_kg ? Number(d.weights[0].weight_kg) : null;
        const initialW = d.weights.length ? Number(d.weights[d.weights.length - 1].weight_kg) : null;
        const deltaW = latestW && initialW ? (latestW - initialW).toFixed(1) : null;
        const latestH = d.weights.find((x: any) => x.height_cm)?.height_cm;
        const bmi = latestW && latestH ? (latestW / Math.pow(Number(latestH) / 100, 2)).toFixed(1) : null;
        const latestFat = d.weights.find((x: any) => x.body_fat_pct)?.body_fat_pct;

        const weightChartData = [...d.weights]
          .slice(0, 7)
          .reverse()
          .map((x: any) => ({
            label: x.logged_on.slice(5),
            value: Number(x.weight_kg),
            key: x.id,
          }));

        return (
          <>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.md }}>
              <Kpi label="Total Check-ins" value={d.att.length} sub="Gym visits" />
              <Kpi label="Current Weight" value={latestW ? `${latestW} kg` : '—'} sub={deltaW ? `${Number(deltaW) >= 0 ? '+' : ''}${deltaW} kg change` : undefined} />
              <Kpi label="BMI" value={bmi ?? '—'} sub={latestH ? `${latestH} cm` : 'Add height'} />
              <Kpi label="Body Fat" value={latestFat ? `${latestFat}%` : '—'} sub={d.cp?.fitness_goal ?? 'Fitness'} />
            </View>

            {weightChartData.length > 1 && (
              <Card style={{ gap: space.sm }}>
                <H3>Weight Trend (kg)</H3>
                <BarChart data={weightChartData} height={100} />
              </Card>
            )}

            {/* Toggle tabs between Body Measurements and Weight Logs */}
            <Row style={{ gap: space.sm }}>
              <Pressable
                onPress={() => { setActiveTab('measurements'); setLogOpen(false); }}
                style={{ flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10, borderWidth: 1, borderColor: activeTab === 'measurements' ? colors.accent : colors.border, backgroundColor: activeTab === 'measurements' ? colors.accent : colors.bg2 }}>
                <Text style={{ color: activeTab === 'measurements' ? colors.onAccent : colors.fg, fontFamily: fonts.bodySemi }}>Body Measurements</Text>
              </Pressable>
              <Pressable
                onPress={() => { setActiveTab('weight'); setLogOpen(false); }}
                style={{ flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10, borderWidth: 1, borderColor: activeTab === 'weight' ? colors.accent : colors.border, backgroundColor: activeTab === 'weight' ? colors.accent : colors.bg2 }}>
                <Text style={{ color: activeTab === 'weight' ? colors.onAccent : colors.fg, fontFamily: fonts.bodySemi }}>Weight & Height Logs</Text>
              </Pressable>
            </Row>

            {activeTab === 'measurements' ? (
              <Card style={{ gap: space.md }}>
                <Row style={{ justifyContent: 'space-between' }}>
                  <H3>Measurements History</H3>
                  <Btn title={logOpen ? 'Cancel' : '+ Record'} variant="ghost" onPress={() => setLogOpen(!logOpen)} />
                </Row>

                {logOpen && (
                  <View style={{ gap: space.sm, backgroundColor: colors.bg, padding: space.md, borderRadius: 12 }}>
                    <Field label="Waist (cm)" value={waist} onChangeText={setWaist} keyboardType="numeric" placeholder="e.g. 82" />
                    <Field label="Chest (cm)" value={chest} onChangeText={setChest} keyboardType="numeric" placeholder="e.g. 96" />
                    <Field label="Arms (cm)" value={arms} onChangeText={setArms} keyboardType="numeric" placeholder="e.g. 35" />
                    <Field label="Thighs (cm)" value={thighs} onChangeText={setThighs} keyboardType="numeric" placeholder="e.g. 54" />
                    <Btn title="Save Measurements" onPress={saveMeasures} loading={busy} />
                  </View>
                )}

                {d.measures.length === 0 ? (
                  <Muted>No measurements logged yet. Tap + Record above to start tracking.</Muted>
                ) : (
                  <View style={{ gap: space.sm }}>
                    {d.measures.map((m: any) => (
                      <Card key={m.id} style={{ backgroundColor: colors.bg, padding: space.md }}>
                        <Row style={{ justifyContent: 'space-between', marginBottom: 4 }}>
                          <Text style={{ color: colors.fg, fontFamily: fonts.headingBold, fontSize: 14 }}>{fmtD(m.logged_on)}</Text>
                        </Row>
                        <Row style={{ flexWrap: 'wrap', gap: space.md }}>
                          {m.waist_cm && <Text style={{ color: colors.muted, fontFamily: fonts.body, fontSize: 13 }}>Waist: <Text style={{ color: colors.fg, fontFamily: fonts.bodySemi }}>{m.waist_cm} cm</Text></Text>}
                          {m.chest_cm && <Text style={{ color: colors.muted, fontFamily: fonts.body, fontSize: 13 }}>Chest: <Text style={{ color: colors.fg, fontFamily: fonts.bodySemi }}>{m.chest_cm} cm</Text></Text>}
                          {m.arms_cm && <Text style={{ color: colors.muted, fontFamily: fonts.body, fontSize: 13 }}>Arms: <Text style={{ color: colors.fg, fontFamily: fonts.bodySemi }}>{m.arms_cm} cm</Text></Text>}
                          {m.thighs_cm && <Text style={{ color: colors.muted, fontFamily: fonts.body, fontSize: 13 }}>Thighs: <Text style={{ color: colors.fg, fontFamily: fonts.bodySemi }}>{m.thighs_cm} cm</Text></Text>}
                        </Row>
                      </Card>
                    ))}
                  </View>
                )}
              </Card>
            ) : (
              <Card style={{ gap: space.md }}>
                <Row style={{ justifyContent: 'space-between' }}>
                  <H3>Weight & Body Stats</H3>
                  <Btn title={logOpen ? 'Cancel' : '+ Log Weight'} variant="ghost" onPress={() => setLogOpen(!logOpen)} />
                </Row>

                {logOpen && (
                  <View style={{ gap: space.sm, backgroundColor: colors.bg, padding: space.md, borderRadius: 12 }}>
                    <Field label="Weight (kg) *" value={weightKg} onChangeText={setWeightKg} keyboardType="numeric" placeholder="e.g. 72.5" />
                    <Field label="Height (cm)" value={heightCm} onChangeText={setHeightCm} keyboardType="numeric" placeholder="e.g. 175" />
                    <Field label="Body Fat %" value={bodyFat} onChangeText={setBodyFat} keyboardType="numeric" placeholder="e.g. 18.5" />
                    <Btn title="Save Weight Entry" onPress={saveWeight} loading={busy} />
                  </View>
                )}

                {d.weights.length === 0 ? (
                  <Muted>No weight logged yet.</Muted>
                ) : (
                  <View style={{ gap: space.sm }}>
                    {d.weights.map((w: any) => (
                      <Card key={w.id} style={{ backgroundColor: colors.bg, padding: space.md }}>
                        <Row style={{ justifyContent: 'space-between', marginBottom: 2 }}>
                          <Text style={{ color: colors.accent, fontFamily: fonts.headingBold, fontSize: 16 }}>{w.weight_kg} kg</Text>
                          <Text style={{ color: colors.muted, fontFamily: fonts.body, fontSize: 13 }}>{fmtD(w.logged_on)}</Text>
                        </Row>
                        <Row style={{ gap: space.md }}>
                          {w.height_cm && <Text style={{ color: colors.muted, fontSize: 12 }}>Height: {w.height_cm} cm</Text>}
                          {w.body_fat_pct && <Text style={{ color: colors.muted, fontSize: 12 }}>Body Fat: {w.body_fat_pct}%</Text>}
                        </Row>
                      </Card>
                    ))}
                  </View>
                )}
              </Card>
            )}
          </>
        );
      }}</Async>
    </Screen>
  );
}
