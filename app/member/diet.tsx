import React, { useEffect, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Async, Bar, Btn, Card, Chip, Chips, Field, H3, Header, Muted, P, Row, Screen, useToast } from '@/components/ui';
import { DateStrip } from '@/components/DateStrip';
import { Sheet } from '@/components/Sheet';
import { useAsync } from '@/hooks/useAsync';
import { useAuth } from '@/contexts/AuthContext';
import { niceError, q, supabase, todayIST } from '@/lib/supabase';
import { dayKind } from '@/lib/dates';
import { forGrams, Per100, sumTotals } from '@/lib/nutrition';
import { colors, fonts, space } from '@/theme';

export const MEALS: [string, string][] = [['breakfast', 'Breakfast'], ['morning_snack', 'Morning snack'], ['lunch', 'Lunch'], ['evening_snack', 'Evening snack'], ['dinner', 'Dinner'], ['pre_workout', 'Pre-workout'], ['post_workout', 'Post-workout']];
const LABEL = Object.fromEntries(MEALS);
const STATUS_TONE: Record<string, string> = { eaten: colors.accent, planned: colors.warn, skipped: colors.danger };
const num = (v: string) => (v.trim() === '' ? NaN : Number(v));

export default function Diet() {
  const { user } = useAuth(); const toast = useToast(); const today = todayIST();
  const [date, setDate] = useState(today); const [add, setAdd] = useState(false); const [busy, setBusy] = useState('');
  const kind = dayKind(date, today);
  const st = useAsync(async () => {
    const plans: any[] = await q(supabase.from('meal_plans').select('id,name,notes,valid_to').eq('client_id', user!.id).lte('valid_from', date).order('valid_from', { ascending: false }).limit(5));
    const plan = plans.find((p) => !p.valid_to || p.valid_to >= date) ?? null;
    const [items, nut, logs, mine]: any[] = await Promise.all([
      plan ? q(supabase.from('meal_plan_items').select('id,meal_type,serving_qty,serving_unit,meal_time,instructions').eq('meal_plan_id', plan.id)) : [],
      plan ? q(supabase.from('meal_plan_item_nutrition').select('item_id,name,is_verified,kcal,protein_g,carbs_g,fat_g,fibre_g').eq('meal_plan_id', plan.id)) : [],
      q(supabase.from('meal_logs').select('meal_plan_item_id,completed').eq('client_id', user!.id).eq('logged_on', date)),
      q(supabase.from('client_food_entries').select('*').eq('client_id', user!.id).eq('entry_date', date).order('created_at')),
    ]);
    return { plan, items, nut, logs, mine };
  }, [user?.id, date]);

  const fail = (e: any) => toast.show('error', niceError(e));
  const togglePlanItem = async (itemId: string, completed: boolean) => {
    setBusy(itemId);
    const { error } = await supabase.from('meal_logs').upsert({ client_id: user!.id, meal_plan_item_id: itemId, completed, logged_on: date }, { onConflict: 'meal_plan_item_id,client_id,logged_on' });
    setBusy(''); error ? fail(error) : st.reload();
  };
  const setEntryStatus = async (id: string, status: string) => { setBusy(id); const { error } = await supabase.from('client_food_entries').update({ status }).eq('id', id).eq('client_id', user!.id); setBusy(''); error ? fail(error) : st.reload(); };
  const del = (id: string, name: string) => Alert.alert('Delete food entry?', `${name} will be removed from this day.`, [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: async () => { const { error } = await supabase.from('client_food_entries').delete().eq('id', id).eq('client_id', user!.id); error ? fail(error) : st.reload(); } }]);

  return (
    <Screen onRefresh={st.refresh} refreshing={st.refreshing}>
      <Header eyebrow="Diet" title="Food diary" />
      <DateStrip value={date} today={today} onChange={setDate} />
      {toast.node}
      <Btn title="Add food" onPress={() => setAdd(true)} icon={<Ionicons name="add" size={20} color={colors.onAccent} />} />
      <Async state={st}>{(d) => {
        const by = (id: string) => d.nut.find((n: any) => n.item_id === id);
        const done = (id: string) => d.logs.find((l: any) => l.meal_plan_item_id === id)?.completed === true;
        const planTot = sumTotals(d.items.map((i: any) => ({ kcal: by(i.id)?.kcal, protein_g: by(i.id)?.protein_g, carbs_g: by(i.id)?.carbs_g, fat_g: by(i.id)?.fat_g, fibre_g: by(i.id)?.fibre_g })));
        const planEaten = sumTotals(d.items.filter((i: any) => done(i.id)).map((i: any) => by(i.id) ?? {}));
        const mineAll = sumTotals(d.mine.filter((e: any) => e.status !== 'skipped'));
        const mineEaten = sumTotals(d.mine.filter((e: any) => e.status === 'eaten'));
        const planned = planTot.kcal + mineAll.kcal; const eaten = planEaten.kcal + mineEaten.kcal;
        const protein = planEaten.protein_g + mineEaten.protein_g; const carbs = planEaten.carbs_g + mineEaten.carbs_g; const fat = planEaten.fat_g + mineEaten.fat_g; const fibre = planEaten.fibre_g + mineEaten.fibre_g;
        const meals = MEALS.filter(([k]) => d.items.some((i: any) => i.meal_type === k) || d.mine.some((e: any) => e.meal_type === k));
        return (<>
          <Card style={{ gap: space.sm }}>
            <Row style={{ justifyContent: 'space-between' }}><H3>{kind === 'future' ? 'Planned' : 'Eaten'}</H3><Text style={{ color: colors.accent, fontFamily: fonts.heading, fontSize: 22 }}>{Math.round(kind === 'future' ? planned : eaten)} <Text style={{ fontSize: 13, color: colors.muted, fontFamily: fonts.body }}>/ {Math.round(planned)} kcal</Text></Text></Row>
            <Bar value={kind === 'future' ? 0 : eaten} max={planned} />
            <Muted>Protein {Math.round(protein)} g · Carbs {Math.round(carbs)} g · Fat {Math.round(fat)} g · Fibre {Math.round(fibre)} g (eaten)</Muted>
            {d.plan && <Muted>Trainer plan: {d.plan.name}</Muted>}
          </Card>
          {meals.length === 0 && <Muted style={{ textAlign: 'center', padding: space.xl }}>{kind === 'future' ? 'Nothing planned for this day yet.' : kind === 'past' ? 'No food was recorded on this day.' : 'No food recorded yet today. Tap Add food.'}</Muted>}
          {meals.map(([k, label]) => (
            <View key={k} style={{ gap: space.sm }}>
              <H3>{label}</H3>
              {d.items.filter((i: any) => i.meal_type === k).map((i: any) => { const n = by(i.id); const ok = done(i.id); return (
                <Card key={i.id} accent={ok} style={{ gap: 6 }}>
                  <Row style={{ justifyContent: 'space-between' }}><P style={{ flex: 1 }}>{n?.name ?? 'Food'}</P><Muted>{i.serving_qty} {i.serving_unit}{i.meal_time ? ` · ${String(i.meal_time).slice(0, 5)}` : ''}</Muted></Row>
                  <Muted>{n ? `${n.kcal} kcal · P ${n.protein_g} · C ${n.carbs_g} · F ${n.fat_g} g` : ''}{n && n.is_verified === false ? '  (estimated)' : ''}  ·  from your trainer</Muted>
                  {kind !== 'future' && <Btn title={ok ? 'Undo' : 'Mark eaten'} variant={ok ? 'ghost' : 'primary'} loading={busy === i.id} onPress={() => togglePlanItem(i.id, !ok)} />}
                </Card>); })}
              {d.mine.filter((e: any) => e.meal_type === k).map((e: any) => (
                <Card key={e.id} style={{ gap: 6, borderLeftWidth: 4, borderLeftColor: STATUS_TONE[e.status] }}>
                  <Row style={{ justifyContent: 'space-between' }}><P style={{ flex: 1 }}>{e.food_name}</P><Text style={{ color: STATUS_TONE[e.status], fontFamily: fonts.bodySemi, fontSize: 12, letterSpacing: 1 }}>{e.status.toUpperCase()}</Text></Row>
                  <Muted>{Number(e.quantity_g)} g · {Number(e.kcal)} kcal · P {Number(e.protein_g)} · C {Number(e.carbs_g)} · F {Number(e.fat_g)} g{e.nutrition_source === 'manual' ? '  (entered by you)' : e.is_verified ? '' : '  (estimated)'}</Muted>
                  {!!e.notes && <Muted>{e.notes}</Muted>}
                  <Row>
                    {kind !== 'future' && e.status !== 'eaten' && <Btn title="Mark eaten" onPress={() => setEntryStatus(e.id, 'eaten')} loading={busy === e.id} style={{ flex: 1, minHeight: 44 }} />}
                    {kind !== 'future' && e.status === 'eaten' && <Btn title="Undo" variant="ghost" onPress={() => setEntryStatus(e.id, 'planned')} loading={busy === e.id} style={{ flex: 1, minHeight: 44 }} />}
                    {kind !== 'future' && e.status === 'planned' && <Btn title="Skipped" variant="ghost" onPress={() => setEntryStatus(e.id, 'skipped')} style={{ flex: 1, minHeight: 44 }} />}
                    <Pressable onPress={() => del(e.id, e.food_name)} accessibilityRole="button" accessibilityLabel={`Delete ${e.food_name}`} hitSlop={8} style={{ padding: 10 }}><Ionicons name="trash-outline" size={22} color={colors.danger} /></Pressable>
                  </Row>
                </Card>))}
            </View>))}
        </>);
      }}</Async>
      <AddFood open={add} onClose={() => setAdd(false)} date={date} kind={kind} userId={user!.id} onSaved={() => { setAdd(false); toast.show('success', 'Food saved.'); st.reload(); }} />
    </Screen>
  );
}

function AddFood({ open, onClose, date, kind, userId, onSaved }: { open: boolean; onClose: () => void; date: string; kind: string; userId: string; onSaved: () => void }) {
  const [meal, setMeal] = useState('breakfast'); const [term, setTerm] = useState(''); const [results, setResults] = useState<any[]>([]); const [picked, setPicked] = useState<any | null>(null);
  const [custom, setCustom] = useState(false); const [name, setName] = useState(''); const [grams, setGrams] = useState('100'); const [m, setM] = useState({ kcal: '', protein: '', carbs: '', fat: '', fibre: '' });
  const [status, setStatus] = useState<'eaten' | 'planned'>('eaten'); const [notes, setNotes] = useState(''); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  useEffect(() => { if (open) { setPicked(null); setTerm(''); setResults([]); setCustom(false); setName(''); setGrams('100'); setM({ kcal: '', protein: '', carbs: '', fat: '', fibre: '' }); setNotes(''); setErr(''); setStatus(kind === 'future' ? 'planned' : 'eaten'); } }, [open, kind]);
  useEffect(() => {
    if (!open || custom || picked) return;
    const t = setTimeout(async () => {
      const s = term.replace(/[%_,()]/g, '').trim();
      let qy = supabase.from('food_items').select('id,name,category,kcal_per_100g,protein_g,carbs_g,fat_g,fibre_g,is_verified').order('name').limit(15);
      if (s) qy = qy.ilike('name', `%${s}%`);
      const { data } = await qy; setResults(data ?? []);
    }, 250);
    return () => clearTimeout(t);
  }, [term, open, custom, picked]);

  const g = num(grams); const preview = picked && g > 0 ? forGrams(picked as Per100, g) : null;
  const save = async () => {
    if (!(g > 0 && g <= 5000)) return setErr('Quantity must be 1–5000 g.');
    let row: any = { client_id: userId, entry_date: date, meal_type: meal, quantity_g: g, status: kind === 'future' ? 'planned' : status, notes: notes.trim() || null };
    if (picked) { Object.assign(row, { food_item_id: picked.id, food_name: picked.name, kcal: preview!.kcal, protein_g: preview!.protein_g, carbs_g: preview!.carbs_g, fat_g: preview!.fat_g, fibre_g: preview!.fibre_g }); }
    else if (custom) {
      if (name.trim().length < 1) return setErr('Enter a food name.');
      const v = { kcal: num(m.kcal), protein_g: num(m.protein), carbs_g: num(m.carbs), fat_g: num(m.fat), fibre_g: num(m.fibre) };
      if (Object.values(v).some((x) => isNaN(x) || x < 0 || x > 5000)) return setErr('Enter calories, protein, carbs, fat and fibre (0 is fine) for the quantity you ate.');
      Object.assign(row, { food_name: name.trim(), ...v });
    } else return setErr('Pick a food from the list, or choose “Custom food”.');
    setErr(''); setBusy(true);
    const { error } = await supabase.from('client_food_entries').insert(row);
    setBusy(false);
    if (error) setErr(/future_entry_must_be_planned/.test(error.message) ? 'Future entries can only be planned.' : niceError(error)); else onSaved();
  };
  return (
    <Sheet open={open} onClose={onClose} title="Add food">
      <Muted>Saving to {date}{kind === 'future' ? ' (planned)' : kind === 'past' ? ' (past record)' : ''}</Muted>
      <Chips>{MEALS.map(([k, l]) => <Chip key={k} label={l} active={meal === k} onPress={() => setMeal(k)} />)}</Chips>
      <Row><Chip label="From food database" active={!custom} onPress={() => setCustom(false)} /><Chip label="Custom food" active={custom} onPress={() => { setCustom(true); setPicked(null); }} /></Row>
      {!custom && !picked && (<>
        <Field label="Search foods" value={term} onChangeText={setTerm} placeholder="e.g. rice, egg, paneer" />
        {results.length === 0 ? <Muted>No foods found. Use “Custom food” to enter your own values.</Muted> : results.map((f) => (
          <Pressable key={f.id} onPress={() => setPicked(f)} accessibilityRole="button" style={{ paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border }}>
            <Text style={{ color: colors.fg, fontFamily: fonts.bodySemi, fontSize: 16 }}>{f.name}</Text><Muted>{f.kcal_per_100g} kcal / 100 g{f.is_verified ? '' : ' · estimated'}</Muted></Pressable>))}
      </>)}
      {picked && <Card accent style={{ gap: 4 }}><Row style={{ justifyContent: 'space-between' }}><H3>{picked.name}</H3><Pressable onPress={() => setPicked(null)}><Text style={{ color: colors.accent, fontFamily: fonts.bodySemi }}>Change</Text></Pressable></Row>
        {preview ? <Muted>{preview.kcal} kcal · P {preview.protein_g} · C {preview.carbs_g} · F {preview.fat_g} · Fibre {preview.fibre_g} g</Muted> : <Muted>Enter a quantity</Muted>}</Card>}
      {custom && <><Field label="Food name" value={name} onChangeText={setName} maxLength={120} />
        <Muted>Values you type are saved as “entered by you”, not verified.</Muted>
        <Row><View style={{ flex: 1 }}><Field label="Calories" value={m.kcal} onChangeText={(v) => setM({ ...m, kcal: v })} keyboardType="decimal-pad" /></View><View style={{ flex: 1 }}><Field label="Protein g" value={m.protein} onChangeText={(v) => setM({ ...m, protein: v })} keyboardType="decimal-pad" /></View></Row>
        <Row><View style={{ flex: 1 }}><Field label="Carbs g" value={m.carbs} onChangeText={(v) => setM({ ...m, carbs: v })} keyboardType="decimal-pad" /></View><View style={{ flex: 1 }}><Field label="Fat g" value={m.fat} onChangeText={(v) => setM({ ...m, fat: v })} keyboardType="decimal-pad" /></View><View style={{ flex: 1 }}><Field label="Fibre g" value={m.fibre} onChangeText={(v) => setM({ ...m, fibre: v })} keyboardType="decimal-pad" /></View></Row></>}
      <Field label="Quantity (grams)" value={grams} onChangeText={setGrams} keyboardType="decimal-pad" />
      {kind !== 'future' && <Row><Chip label="Eaten" active={status === 'eaten'} onPress={() => setStatus('eaten')} /><Chip label="Planned" active={status === 'planned'} onPress={() => setStatus('planned')} /></Row>}
      <Field label="Notes (optional)" value={notes} onChangeText={setNotes} maxLength={500} />
      {!!err && <Text style={{ color: colors.danger, fontFamily: fonts.bodyMedium }}>{err}</Text>}
      <Btn title="Save" onPress={save} loading={busy} />
    </Sheet>
  );
}
