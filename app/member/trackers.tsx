import React, { useState } from 'react';
import { View } from 'react-native';
import { Async, Bar, Btn, Card, Field, H3, Header, Muted, P, Row, Screen, useToast } from '@/components/ui';
import { BarChart } from '@/components/BarChart';
import { useAsync } from '@/hooks/useAsync';
import { useAuth } from '@/contexts/AuthContext';
import { niceError, q, supabase, todayIST } from '@/lib/supabase';
import { space } from '@/theme';

const last7 = () => Array.from({ length: 7 }).map((_, i) => { const d = new Date(Date.now() - (6 - i) * 864e5); return { key: d.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }), label: d.toLocaleDateString('en-IN', { weekday: 'narrow', timeZone: 'Asia/Kolkata' }) }; });

export default function Trackers() {
  const { user } = useAuth(); const toast = useToast();
  const [water, setWater] = useState('250'); const [kg, setKg] = useState(''); const [steps, setSteps] = useState(''); const [sleepH, setSleepH] = useState('');
  const [busy, setBusy] = useState('');
  const st = useAsync(async () => {
    const since = new Date(Date.now() - 7 * 864e5).toISOString();
    const [w, wt, sp, tgt]: any[] = await Promise.all([
      q(supabase.from('water_logs').select('amount_ml,logged_at').eq('client_id', user!.id).gte('logged_at', since)),
      q(supabase.from('weight_logs').select('weight_kg,logged_on').eq('client_id', user!.id).order('logged_on', { ascending: false }).limit(10)),
      q(supabase.from('step_logs').select('steps,logged_on').eq('client_id', user!.id).gte('logged_on', last7()[0].key)),
      q(supabase.from('water_targets').select('target_ml').eq('client_id', user!.id).maybeSingle()),
    ]);
    return { w, wt, sp, target: tgt?.target_ml as number | undefined };
  }, [user?.id]);

  const run = async (name: string, fn: () => PromiseLike<{ error: any }>, ok: string) => {
    setBusy(name); const { error } = await fn(); setBusy('');
    if (error) toast.show('error', niceError(error)); else { toast.show('success', ok); st.reload(); }
  };
  const num = (v: string, lo: number, hi: number) => { const n = Number(v); return v.trim() !== '' && !isNaN(n) && n >= lo && n <= hi ? n : null; };
  const addWater = () => { const n = num(water, 1, 5000); if (n === null) return toast.show('error', 'Enter 1–5000 ml.'); run('water', () => supabase.from('water_logs').insert({ client_id: user!.id, amount_ml: Math.round(n) }), 'Water logged.'); };
  const addWeight = () => { const n = num(kg, 20, 400); if (n === null) return toast.show('error', 'Enter a weight between 20 and 400 kg.'); run('weight', () => supabase.from('weight_logs').upsert({ client_id: user!.id, logged_on: todayIST(), weight_kg: n }, { onConflict: 'client_id,logged_on' }), 'Weight saved.'); setKg(''); };
  const addSteps = () => { const n = num(steps, 0, 200000); if (n === null) return toast.show('error', 'Enter steps between 0 and 200000.'); run('steps', () => supabase.from('step_logs').upsert({ client_id: user!.id, logged_on: todayIST(), steps: Math.round(n), source: 'manual' }, { onConflict: 'client_id,logged_on' }), 'Steps saved.'); setSteps(''); };
  const addSleep = () => {
    const h = num(sleepH, 0.5, 20); if (h === null) return toast.show('error', 'Enter hours slept (0.5–20).');
    const wake = new Date(); const bed = new Date(wake.getTime() - h * 3600e3);
    // sleep_date unique per client: logging again the same day replaces it. Duration is computed by a DB trigger.
    run('sleep', () => supabase.from('sleep_logs').upsert({ client_id: user!.id, sleep_date: todayIST(), bedtime: bed.toISOString(), wake_time: wake.toISOString() }, { onConflict: 'client_id,sleep_date' }), 'Sleep saved.'); setSleepH('');
  };

  return (
    <Screen onRefresh={st.refresh} refreshing={st.refreshing}>
      <Header eyebrow="Client" title="Trackers" back={true} />
      {toast.node}
      <Async state={st}>{(d) => {
        const days = last7(); const todayMl = d.w.filter((x: any) => new Date(x.logged_at).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }) === todayIST()).reduce((a: number, x: any) => a + x.amount_ml, 0);
        return (<>
          <Card style={{ gap: space.md }}><H3>Water</H3><Bar value={todayMl} max={d.target || 0} /><Muted>{todayMl} ml today{d.target ? ` of ${d.target} ml` : ''}</Muted>
            <BarChart data={days.map((x) => ({ label: x.label, value: d.w.filter((w: any) => new Date(w.logged_at).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }) === x.key).reduce((a: number, w: any) => a + w.amount_ml, 0) }))} />
            <Row><View style={{ flex: 1 }}><Field label="Amount (ml)" value={water} onChangeText={setWater} keyboardType="number-pad" /></View><Btn title="Add" onPress={addWater} loading={busy === 'water'} /></Row></Card>
          <Card style={{ gap: space.md }}><H3>Steps</H3>
            <BarChart data={days.map((x) => ({ label: x.label, value: d.sp.find((s: any) => s.logged_on === x.key)?.steps ?? 0 }))} />
            <Row><View style={{ flex: 1 }}><Field label="Steps today" value={steps} onChangeText={setSteps} keyboardType="number-pad" /></View><Btn title="Save" onPress={addSteps} loading={busy === 'steps'} /></Row>
            <Muted>Entered manually. Health Connect / Apple Health sync is not built yet.</Muted></Card>
          <Card style={{ gap: space.md }}><H3>Weight</H3>
            {d.wt.length ? <><P>Latest: {d.wt[0].weight_kg} kg ({d.wt[0].logged_on})</P><BarChart data={[...d.wt].reverse().map((x: any) => ({ label: x.logged_on.slice(5), value: Number(x.weight_kg) }))} /></> : <Muted>No weight logged yet.</Muted>}
            <Row><View style={{ flex: 1 }}><Field label="Weight (kg)" value={kg} onChangeText={setKg} keyboardType="decimal-pad" /></View><Btn title="Save" onPress={addWeight} loading={busy === 'weight'} /></Row></Card>
          <Card style={{ gap: space.md }}><H3>Sleep</H3>
            <Row><View style={{ flex: 1 }}><Field label="Hours slept last night" value={sleepH} onChangeText={setSleepH} keyboardType="decimal-pad" /></View><Btn title="Save" onPress={addSleep} loading={busy === 'sleep'} /></Row></Card>
        </>);
      }}</Async>
    </Screen>
  );
}
