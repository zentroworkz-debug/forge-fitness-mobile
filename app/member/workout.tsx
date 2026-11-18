import React, { useEffect, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Async, Btn, Card, Chip, Field, H3, Header, Muted, P, Row, Screen, useToast } from '@/components/ui';
import { DateStrip } from '@/components/DateStrip';
import { Sheet } from '@/components/Sheet';
import { useAsync } from '@/hooks/useAsync';
import { useAuth } from '@/contexts/AuthContext';
import { niceError, q, supabase, todayIST } from '@/lib/supabase';
import { dayKind, isoDow } from '@/lib/dates';
import { colors, fonts, space } from '@/theme';

const TONE: Record<string, string> = { done: colors.accent, planned: colors.warn, skipped: colors.danger };
const num = (v: string) => (v.trim() === '' ? null : Number(v));

export default function Workout() {
  const { user } = useAuth(); const toast = useToast(); const today = todayIST();
  const [date, setDate] = useState(today); const [add, setAdd] = useState(false); const [busy, setBusy] = useState('');
  const kind = dayKind(date, today);
  const st = useAsync(async () => {
    const dow = isoDow(date);
    let pq = supabase.from('workout_plans').select('id,name,end_date,training_days,notes,workout_plan_exercises(id,position,sets,reps,weight_kg,duration_sec,rest_sec,instructions,exercise:exercises(name,muscle_group,instructions))').eq('client_id', user!.id).lte('start_date', date);
    if (kind !== 'past') pq = pq.eq('status', 'active'); // old plans stay visible on past days
    const plans: any[] = await q(pq);
    const todays = plans.filter((p) => (!p.end_date || p.end_date >= date) && (!p.training_days?.length || p.training_days.includes(dow)));
    const [done, mine]: any[] = await Promise.all([
      q(supabase.from('workout_completions').select('plan_exercise_id,completed,sets_done,reps_done,weight_done_kg').eq('client_id', user!.id).eq('completed_on', date)),
      q(supabase.from('client_workout_entries').select('*').eq('client_id', user!.id).eq('entry_date', date).order('created_at')),
    ]);
    return { todays, done, mine };
  }, [user?.id, date]);

  const fail = (e: any) => toast.show('error', niceError(e));
  const setStatus = async (id: string, status: string) => { setBusy(id); const { error } = await supabase.from('client_workout_entries').update({ status }).eq('id', id).eq('client_id', user!.id); setBusy(''); error ? fail(error) : st.reload(); };
  const del = (id: string, name: string) => Alert.alert('Delete workout entry?', `${name} will be removed from this day.`, [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: async () => { const { error } = await supabase.from('client_workout_entries').delete().eq('id', id).eq('client_id', user!.id); error ? fail(error) : st.reload(); } }]);

  return (
    <Screen onRefresh={st.refresh} refreshing={st.refreshing}>
      <Header eyebrow="Workout" title="Training log" />
      <DateStrip value={date} today={today} onChange={setDate} />
      {toast.node}
      <Btn title="Add workout" onPress={() => setAdd(true)} icon={<Ionicons name="add" size={20} color={colors.onAccent} />} />
      <Async state={st}>{(d) => {
        const doneCount = d.todays.flatMap((p: any) => p.workout_plan_exercises).filter((e: any) => d.done.find((x: any) => x.plan_exercise_id === e.id)?.completed).length + d.mine.filter((e: any) => e.status === 'done').length;
        const total = d.todays.flatMap((p: any) => p.workout_plan_exercises).length + d.mine.length;
        return (<>
          <Card style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}><View><Muted>{kind === 'future' ? 'Scheduled' : 'Completed'}</Muted><Text style={{ color: colors.accent, fontFamily: fonts.heading, fontSize: 24 }}>{kind === 'future' ? total : `${doneCount} / ${total}`}</Text></View><Muted>exercises</Muted></Card>
          {total === 0 && <Muted style={{ textAlign: 'center', padding: space.xl }}>{kind === 'future' ? 'No workout planned for this day yet.' : kind === 'past' ? 'No workout was recorded on this day.' : 'No workout today. Tap Add workout, or ask your trainer for a plan.'}</Muted>}
          {d.todays.map((p: any) => (
            <View key={p.id} style={{ gap: space.md }}>
              <H3>{p.name}  <Text style={{ color: colors.muted, fontFamily: fonts.body, fontSize: 13 }}>from your trainer</Text></H3>{!!p.notes && <Muted>{p.notes}</Muted>}
              {[...p.workout_plan_exercises].sort((a: any, b: any) => a.position - b.position).map((e: any) => (
                <PlanExercise key={e.id} e={e} date={date} editable={kind !== 'future'} done={d.done.find((x: any) => x.plan_exercise_id === e.id)} userId={user!.id} onSaved={() => { st.reload(); toast.show('success', 'Saved.'); }} onError={(m) => toast.show('error', m)} />))}
            </View>))}
          {d.mine.length > 0 && <H3>My workouts</H3>}
          {d.mine.map((e: any) => (
            <Card key={e.id} style={{ gap: 6, borderLeftWidth: 4, borderLeftColor: TONE[e.status] }}>
              <Row style={{ justifyContent: 'space-between' }}><P style={{ flex: 1 }}>{e.exercise_name}</P><Text style={{ color: TONE[e.status], fontFamily: fonts.bodySemi, fontSize: 12, letterSpacing: 1 }}>{e.status.toUpperCase()}</Text></Row>
              <Muted>{[e.sets && `${e.sets} sets`, e.reps && `${e.reps} reps`, e.weight_kg != null && `${Number(e.weight_kg)} kg`, e.duration_min && `${e.duration_min} min`].filter(Boolean).join(' · ') || 'No details'}</Muted>
              {!!e.notes && <Muted>{e.notes}</Muted>}
              <Row>
                {kind !== 'future' && e.status !== 'done' && <Btn title="Mark done" onPress={() => setStatus(e.id, 'done')} loading={busy === e.id} style={{ flex: 1, minHeight: 44 }} />}
                {kind !== 'future' && e.status === 'done' && <Btn title="Undo" variant="ghost" onPress={() => setStatus(e.id, 'planned')} loading={busy === e.id} style={{ flex: 1, minHeight: 44 }} />}
                {kind !== 'future' && e.status === 'planned' && <Btn title="Skipped" variant="ghost" onPress={() => setStatus(e.id, 'skipped')} style={{ flex: 1, minHeight: 44 }} />}
                <Pressable onPress={() => del(e.id, e.exercise_name)} accessibilityRole="button" accessibilityLabel={`Delete ${e.exercise_name}`} hitSlop={8} style={{ padding: 10 }}><Ionicons name="trash-outline" size={22} color={colors.danger} /></Pressable>
              </Row>
            </Card>))}
        </>);
      }}</Async>
      <AddWorkout open={add} onClose={() => setAdd(false)} date={date} kind={kind} userId={user!.id} onSaved={() => { setAdd(false); toast.show('success', 'Workout saved.'); st.reload(); }} />
    </Screen>
  );
}

function PlanExercise({ e, date, editable, done, userId, onSaved, onError }: { e: any; date: string; editable: boolean; done?: any; userId: string; onSaved: () => void; onError: (m: string) => void }) {
  const [open, setOpen] = useState(false); const [sets, setSets] = useState(String(done?.sets_done ?? e.sets ?? '')); const [reps, setReps] = useState(String(done?.reps_done ?? e.reps ?? '')); const [kg, setKg] = useState(String(done?.weight_done_kg ?? e.weight_kg ?? '')); const [busy, setBusy] = useState(false);
  const target = [e.sets && `${e.sets} sets`, e.reps && `${e.reps} reps`, e.weight_kg != null && `${e.weight_kg} kg`, e.duration_sec && `${e.duration_sec}s`, e.rest_sec != null && `rest ${e.rest_sec}s`].filter(Boolean).join(' · ');
  const save = async () => {
    if ([sets, reps, kg].some((v) => v.trim() !== '' && (isNaN(Number(v)) || Number(v) < 0))) return onError('Enter valid numbers.');
    setBusy(true);
    const { error } = await supabase.from('workout_completions').upsert({ plan_exercise_id: e.id, client_id: userId, completed_on: date, sets_done: num(sets), reps_done: num(reps), weight_done_kg: num(kg), completed: true }, { onConflict: 'plan_exercise_id,client_id,completed_on' });
    setBusy(false); error ? onError(niceError(error)) : (setOpen(false), onSaved());
  };
  return (
    <Card accent={!!done?.completed} onPress={editable ? () => setOpen(!open) : undefined} style={{ gap: space.sm }}>
      <Row style={{ justifyContent: 'space-between' }}><H3>{e.exercise?.name ?? 'Exercise'}</H3><Muted>{done?.completed ? '✓ done' : ''}</Muted></Row>
      <Muted>{e.exercise?.muscle_group ? e.exercise.muscle_group + ' · ' : ''}{target}</Muted>
      {open && (<View style={{ gap: space.md }}>
        {!!(e.instructions || e.exercise?.instructions) && <P>{e.instructions || e.exercise?.instructions}</P>}
        <Row><View style={{ flex: 1 }}><Field label="Sets done" value={sets} onChangeText={setSets} keyboardType="number-pad" /></View><View style={{ flex: 1 }}><Field label="Reps" value={reps} onChangeText={setReps} keyboardType="number-pad" /></View><View style={{ flex: 1 }}><Field label="Kg" value={kg} onChangeText={setKg} keyboardType="decimal-pad" /></View></Row>
        <Btn title={done?.completed ? 'Update' : 'Mark complete'} onPress={save} loading={busy} />
      </View>)}
    </Card>
  );
}

function AddWorkout({ open, onClose, date, kind, userId, onSaved }: { open: boolean; onClose: () => void; date: string; kind: string; userId: string; onSaved: () => void }) {
  const [term, setTerm] = useState(''); const [results, setResults] = useState<any[]>([]); const [picked, setPicked] = useState<any | null>(null); const [custom, setCustom] = useState(false); const [name, setName] = useState('');
  const [f, setF] = useState({ sets: '', reps: '', kg: '', min: '' }); const [status, setStatus] = useState<'done' | 'planned'>('planned'); const [notes, setNotes] = useState(''); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  useEffect(() => { if (open) { setTerm(''); setResults([]); setPicked(null); setCustom(false); setName(''); setF({ sets: '', reps: '', kg: '', min: '' }); setNotes(''); setErr(''); setStatus(kind === 'future' ? 'planned' : 'done'); } }, [open, kind]);
  useEffect(() => {
    if (!open || custom || picked) return;
    const t = setTimeout(async () => {
      const s = term.replace(/[%_,()]/g, '').trim();
      let qy = supabase.from('exercises').select('id,name,muscle_group,equipment').eq('is_active', true).order('name').limit(15);
      if (s) qy = qy.ilike('name', `%${s}%`);
      const { data } = await qy; setResults(data ?? []);
    }, 250);
    return () => clearTimeout(t);
  }, [term, open, custom, picked]);
  const save = async () => {
    const exName = picked?.name ?? name.trim();
    if (!exName) return setErr('Pick an exercise or enter a name.');
    const v = { sets: num(f.sets), reps: num(f.reps), weight_kg: num(f.kg), duration_min: num(f.min) };
    if ((v.sets != null && !(v.sets >= 1 && v.sets <= 50)) || (v.reps != null && !(v.reps >= 1 && v.reps <= 1000)) || (v.weight_kg != null && !(v.weight_kg >= 0 && v.weight_kg <= 1000)) || (v.duration_min != null && !(v.duration_min >= 1 && v.duration_min <= 600))) return setErr('Check the numbers: sets 1–50, reps 1–1000, weight 0–1000 kg, time 1–600 min.');
    if (Object.values(v).every((x) => x == null)) return setErr('Enter at least sets/reps, weight or time.');
    setErr(''); setBusy(true);
    const { error } = await supabase.from('client_workout_entries').insert({ client_id: userId, entry_date: date, exercise_id: picked?.id ?? null, exercise_name: exName, ...v, notes: notes.trim() || null, status: kind === 'future' ? 'planned' : status });
    setBusy(false); error ? setErr(niceError(error)) : onSaved();
  };
  return (
    <Sheet open={open} onClose={onClose} title="Add workout">
      <Muted>Saving to {date}{kind === 'future' ? ' (planned)' : kind === 'past' ? ' (past record)' : ''}</Muted>
      <Row><Chip label="Exercise library" active={!custom} onPress={() => setCustom(false)} /><Chip label="Custom" active={custom} onPress={() => { setCustom(true); setPicked(null); }} /></Row>
      {!custom && !picked && (<>
        <Field label="Search exercises" value={term} onChangeText={setTerm} placeholder="e.g. squat, bench, row" />
        {results.length === 0 ? <Muted>No exercises found. Use “Custom” to type your own.</Muted> : results.map((x) => (
          <Pressable key={x.id} onPress={() => setPicked(x)} accessibilityRole="button" style={{ paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border }}>
            <Text style={{ color: colors.fg, fontFamily: fonts.bodySemi, fontSize: 16 }}>{x.name}</Text><Muted>{[x.muscle_group, x.equipment].filter(Boolean).join(' · ')}</Muted></Pressable>))}
      </>)}
      {picked && <Card accent><Row style={{ justifyContent: 'space-between' }}><H3>{picked.name}</H3><Pressable onPress={() => setPicked(null)}><Text style={{ color: colors.accent, fontFamily: fonts.bodySemi }}>Change</Text></Pressable></Row></Card>}
      {custom && <Field label="Exercise name" value={name} onChangeText={setName} maxLength={120} />}
      <Row><View style={{ flex: 1 }}><Field label="Sets" value={f.sets} onChangeText={(v) => setF({ ...f, sets: v })} keyboardType="number-pad" /></View><View style={{ flex: 1 }}><Field label="Reps" value={f.reps} onChangeText={(v) => setF({ ...f, reps: v })} keyboardType="number-pad" /></View></Row>
      <Row><View style={{ flex: 1 }}><Field label="Weight (kg)" value={f.kg} onChangeText={(v) => setF({ ...f, kg: v })} keyboardType="decimal-pad" /></View><View style={{ flex: 1 }}><Field label="Time (min)" value={f.min} onChangeText={(v) => setF({ ...f, min: v })} keyboardType="number-pad" /></View></Row>
      {kind !== 'future' && <Row><Chip label="Done" active={status === 'done'} onPress={() => setStatus('done')} /><Chip label="Planned" active={status === 'planned'} onPress={() => setStatus('planned')} /></Row>}
      <Field label="Notes (optional)" value={notes} onChangeText={setNotes} maxLength={500} />
      {!!err && <Text style={{ color: colors.danger, fontFamily: fonts.bodyMedium }}>{err}</Text>}
      <Btn title="Save" onPress={save} loading={busy} />
    </Sheet>
  );
}
