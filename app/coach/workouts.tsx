import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Async, Btn, Card, Chip, Chips, Empty, Field, H3, Header, Muted, Row, Screen, useToast } from '@/components/ui';
import { useAsync } from '@/hooks/useAsync';
import { useAuth } from '@/contexts/AuthContext';
import { niceError, q, supabase, todayIST } from '@/lib/supabase';
import { fmtD } from '@/lib/format';
import { DatePickerField } from '@/components/DatePickerField';
import { colors, fonts, space } from '@/theme';

const DAYS = [
  { id: 1, label: 'Mon' }, { id: 2, label: 'Tue' }, { id: 3, label: 'Wed' },
  { id: 4, label: 'Thu' }, { id: 5, label: 'Fri' }, { id: 6, label: 'Sat' }, { id: 7, label: 'Sun' },
];

export default function WorkoutBuilder() {
  const { user } = useAuth();
  const { client: paramClient } = useLocalSearchParams<{ client?: string }>();
  const toast = useToast();
  const today = todayIST();

  const [client, setClient] = useState(paramClient || '');
  const [name, setName] = useState('');
  const [difficulty, setDifficulty] = useState('intermediate');
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState('');
  const [trainingDays, setTrainingDays] = useState<number[]>([1, 3, 5]);
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<any[]>([]);

  // Add exercise modal / form state
  const [exPicker, setExPicker] = useState(false);
  const [selEx, setSelEx] = useState<any>(null);
  const [sets, setSets] = useState('3');
  const [reps, setReps] = useState('10');
  const [weightKg, setWeightKg] = useState('');
  const [restSec, setRestSec] = useState('60');
  const [instructions, setInstructions] = useState('');
  const [busy, setBusy] = useState(false);

  const st = useAsync(async () => {
    const [asg, ex] = await Promise.all([
      q(supabase.from('trainer_assignments')
        .select('client_id,status,client:profiles!trainer_assignments_client_id_fkey(id,full_name)')
        .eq('trainer_id', user!.id)
        .in('status', ['active', 'transferring'])),
      q(supabase.from('exercises').select('id,name,muscle_group,difficulty').eq('is_active', true).order('name')),
    ]);
    const clients = (asg as any[]).map((a) => a.client).filter(Boolean);
    return { clients, exercises: (ex as any[]) || [] };
  }, [user?.id]);

  const plansSt = useAsync(async () => {
    if (!client) return [];
    const res = await q(supabase.from('workout_plans')
      .select('id,name,start_date,end_date,status,created_at')
      .eq('client_id', client)
      .order('created_at', { ascending: false }));
    return (res as any[]) || [];
  }, [client]);

  const toggleDay = (d: number) => {
    setTrainingDays((prev) => prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort());
  };

  const addExercise = () => {
    if (!selEx) { toast.show('error', 'Select an exercise'); return; }
    setItems((prev) => [
      ...prev,
      {
        exercise: selEx,
        sets: sets ? Number(sets) : null,
        reps: reps ? Number(reps) : null,
        weight_kg: weightKg ? Number(weightKg) : null,
        rest_sec: restSec ? Number(restSec) : null,
        instructions: instructions.trim() || null,
      },
    ]);
    setSelEx(null); setInstructions('');
    setExPicker(false);
  };

  const removeExercise = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const savePlan = async () => {
    if (!client) { toast.show('error', 'Select a client first.'); return; }
    if (!name.trim()) { toast.show('error', 'Enter a plan name.'); return; }
    if (!items.length) { toast.show('error', 'Add at least one exercise.'); return; }

    setBusy(true);
    try {
      const planRes = await q(supabase.from('workout_plans').insert({
        client_id: client,
        trainer_id: user!.id,
        name: name.trim(),
        difficulty,
        start_date: startDate,
        end_date: endDate.trim() || null,
        training_days: trainingDays,
        notes: notes.trim() || null,
        status: 'active',
      }).select('id').single());

      const planId = (planRes as any).id;
      const exRows = items.map((it, idx) => ({
        plan_id: planId,
        exercise_id: it.exercise.id,
        position: idx,
        sets: it.sets,
        reps: it.reps,
        weight_kg: it.weight_kg,
        rest_sec: it.rest_sec,
        instructions: it.instructions,
      }));

      const { error: exErr } = await supabase.from('workout_plan_exercises').insert(exRows);
      if (exErr) throw exErr;

      toast.show('success', 'Workout plan assigned to client!');
      setName(''); setNotes(''); setItems([]);
      plansSt.reload();
    } catch (e) {
      toast.show('error', niceError(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen onRefresh={st.refresh} refreshing={st.refreshing}>
      <Header eyebrow="Trainer" title="Workout Builder" back="/coach/more" />
      {toast.node}

      <Async state={st}>{(d) => (
        <>
          <Card style={{ gap: space.md }}>
            <H3>1. Select Client & Details</H3>
            <Muted>Choose client:</Muted>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.sm }}>
              {d.clients.map((c: any) => (
                <Chip key={c.id} label={c.full_name} active={client === c.id} onPress={() => setClient(c.id)} />
              ))}
            </ScrollView>

            <Field label="Plan Name" value={name} onChangeText={setName} placeholder="e.g. Hypertrophy Phase 1" />
            <DatePickerField label="Start Date" value={startDate} onChange={setStartDate} placeholder="Select start date" />
            <DatePickerField label="End Date (Optional)" value={endDate} onChange={setEndDate} placeholder="No end date" optional />

            <View style={{ gap: 6 }}>
              <Text style={{ color: colors.fg, fontFamily: fonts.bodySemi, fontSize: 14 }}>Training Days</Text>
              <Row style={{ flexWrap: 'wrap', gap: 6 }}>
                {DAYS.map((day) => (
                  <Chip key={day.id} label={day.label} active={trainingDays.includes(day.id)} onPress={() => toggleDay(day.id)} />
                ))}
              </Row>
            </View>

            <Field label="Trainer Notes / Instructions" value={notes} onChangeText={setNotes} multiline placeholder="Rest periods, progression instructions..." />
          </Card>

          <Card style={{ gap: space.md }}>
            <Row style={{ justifyContent: 'space-between' }}>
              <H3>2. Exercises ({items.length})</H3>
              <Btn title="+ Add Exercise" variant="ghost" onPress={() => setExPicker(true)} />
            </Row>

            {exPicker && (
              <Card style={{ backgroundColor: colors.bg, gap: space.sm }}>
                <H3>Pick Exercise</H3>
                <ScrollView style={{ maxHeight: 150 }} nestedScrollEnabled>
                  {d.exercises.map((ex: any) => (
                    <Pressable key={ex.id} onPress={() => setSelEx(ex)} style={{ paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, backgroundColor: selEx?.id === ex.id ? colors.accent : 'transparent', marginBottom: 2 }}>
                      <Text style={{ color: selEx?.id === ex.id ? colors.onAccent : colors.fg, fontFamily: fonts.bodySemi }}>{ex.name} ({ex.muscle_group})</Text>
                    </Pressable>
                  ))}
                </ScrollView>

                {selEx && (
                  <View style={{ gap: space.sm, marginTop: 8 }}>
                    <Row style={{ gap: space.sm }}>
                      <View style={{ flex: 1 }}><Field label="Sets" value={sets} onChangeText={setSets} keyboardType="numeric" /></View>
                      <View style={{ flex: 1 }}><Field label="Reps" value={reps} onChangeText={setReps} keyboardType="numeric" /></View>
                      <View style={{ flex: 1 }}><Field label="Kg" value={weightKg} onChangeText={setWeightKg} keyboardType="numeric" /></View>
                    </Row>
                    <Field label="Rest (seconds)" value={restSec} onChangeText={setRestSec} keyboardType="numeric" />
                    <Field label="Form notes" value={instructions} onChangeText={setInstructions} placeholder="e.g. 2s pause at bottom" />
                    <Row style={{ gap: space.sm }}>
                      <Btn title="Confirm Exercise" onPress={addExercise} style={{ flex: 1 }} />
                      <Btn title="Cancel" variant="ghost" onPress={() => setExPicker(false)} style={{ flex: 1 }} />
                    </Row>
                  </View>
                )}
              </Card>
            )}

            {items.map((it, idx) => (
              <Card key={idx} style={{ backgroundColor: colors.bg, padding: space.md }}>
                <Row style={{ justifyContent: 'space-between' }}>
                  <Text style={{ color: colors.fg, fontFamily: fonts.headingBold, fontSize: 15 }}>{idx + 1}. {it.exercise.name}</Text>
                  <Pressable onPress={() => removeExercise(idx)} hitSlop={8}>
                    <Ionicons name="trash-outline" size={18} color={colors.danger} />
                  </Pressable>
                </Row>
                <Muted>{it.sets} sets × {it.reps} reps {it.weight_kg ? `@ ${it.weight_kg} kg` : ''} · Rest: {it.rest_sec}s</Muted>
                {!!it.instructions && <Text style={{ color: colors.muted, fontFamily: fonts.body, fontSize: 13 }}>{it.instructions}</Text>}
              </Card>
            ))}

            <Btn title="Assign Workout Plan" onPress={savePlan} loading={busy} disabled={!items.length || !client} />
          </Card>

          {!!client && (
            <Card style={{ gap: space.sm }}>
              <H3>Assigned Plans for Client</H3>
              <Async state={plansSt} empty="No past workout plans for this client.">{(plans) => (
                <View style={{ gap: space.sm }}>
                  {plans.map((p: any) => (
                    <Card key={p.id} style={{ backgroundColor: colors.bg }}>
                      <Row style={{ justifyContent: 'space-between' }}>
                        <Text style={{ color: colors.fg, fontFamily: fonts.headingBold, fontSize: 15 }}>{p.name}</Text>
                        <View style={{ backgroundColor: p.status === 'active' ? colors.accent : colors.border, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }}>
                          <Text style={{ color: p.status === 'active' ? colors.onAccent : colors.fg, fontSize: 11, fontFamily: fonts.bodySemi }}>{p.status}</Text>
                        </View>
                      </Row>
                      <Muted>{fmtD(p.start_date)} {p.end_date ? `to ${fmtD(p.end_date)}` : '(ongoing)'}</Muted>
                    </Card>
                  ))}
                </View>
              )}</Async>
            </Card>
          )}
        </>
      )}</Async>
    </Screen>
  );
}
