import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Async, Btn, Card, Chip, Empty, Field, H3, Header, Kpi, Muted, Row, Screen, useToast } from '@/components/ui';
import { useAsync } from '@/hooks/useAsync';
import { useAuth } from '@/contexts/AuthContext';
import { niceError, q, supabase, todayIST } from '@/lib/supabase';
import { fmtD } from '@/lib/format';
import { DatePickerField } from '@/components/DatePickerField';
import { colors, fonts, space } from '@/theme';

const MEALS = [
  { id: 'breakfast', label: 'Breakfast' },
  { id: 'morning_snack', label: 'Morning Snack' },
  { id: 'lunch', label: 'Lunch' },
  { id: 'evening_snack', label: 'Evening Snack' },
  { id: 'dinner', label: 'Dinner' },
  { id: 'pre_workout', label: 'Pre-Workout' },
  { id: 'post_workout', label: 'Post-Workout' },
];

export default function NutritionPlanner() {
  const { user } = useAuth();
  const { client: paramClient } = useLocalSearchParams<{ client?: string }>();
  const toast = useToast();
  const today = todayIST();

  const [client, setClient] = useState(paramClient || '');
  const [name, setName] = useState('');
  const [validFrom, setValidFrom] = useState(today);
  const [validTo, setValidTo] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<any[]>([]);

  // Add food form
  const [foodPicker, setFoodPicker] = useState(false);
  const [mealType, setMealType] = useState('breakfast');
  const [selFood, setSelFood] = useState<any>(null);
  const [qty, setQty] = useState('100');
  const [unit, setUnit] = useState('g');
  const [instructions, setInstructions] = useState('');
  const [busy, setBusy] = useState(false);

  const st = useAsync(async () => {
    const [asg, foods] = await Promise.all([
      q(supabase.from('trainer_assignments')
        .select('client_id,status,client:profiles!trainer_assignments_client_id_fkey(id,full_name)')
        .eq('trainer_id', user!.id)
        .in('status', ['active', 'transferring'])),
      q(supabase.from('food_items').select('id,name,kcal_per_100g,protein_g,carbs_g,fat_g,category').order('name')),
    ]);
    const clients = (asg as any[]).map((a) => a.client).filter(Boolean);
    return { clients, foods: (foods as any[]) || [] };
  }, [user?.id]);

  const plansSt = useAsync(async () => {
    if (!client) return [];
    const res = await q(supabase.from('meal_plans')
      .select('id,name,valid_from,valid_to,created_at')
      .eq('client_id', client)
      .order('valid_from', { ascending: false }));
    return (res as any[]) || [];
  }, [client]);

  const totals = useMemo(() => {
    return items.reduce((acc, it) => {
      const g = Number(it.qty) || 0;
      const factor = g / 100;
      return {
        kcal: acc.kcal + Math.round((it.food.kcal_per_100g || 0) * factor),
        protein: acc.protein + Math.round((it.food.protein_g || 0) * factor),
        carbs: acc.carbs + Math.round((it.food.carbs_g || 0) * factor),
        fat: acc.fat + Math.round((it.food.fat_g || 0) * factor),
      };
    }, { kcal: 0, protein: 0, carbs: 0, fat: 0 });
  }, [items]);

  const addFood = () => {
    if (!selFood) { toast.show('error', 'Select a food.'); return; }
    if (!qty || Number(qty) <= 0) { toast.show('error', 'Enter valid quantity in grams.'); return; }
    setItems((prev) => [
      ...prev,
      {
        meal_type: mealType,
        food: selFood,
        qty: Number(qty),
        unit,
        instructions: instructions.trim() || null,
      },
    ]);
    setSelFood(null); setInstructions('');
    setFoodPicker(false);
  };

  const removeItem = (idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const savePlan = async () => {
    if (!client) { toast.show('error', 'Select a client first.'); return; }
    if (!name.trim()) { toast.show('error', 'Enter a plan name.'); return; }
    if (!items.length) { toast.show('error', 'Add at least one food item.'); return; }

    setBusy(true);
    try {
      const planRes = await q(supabase.from('meal_plans').insert({
        client_id: client,
        trainer_id: user!.id,
        name: name.trim(),
        valid_from: validFrom,
        valid_to: validTo.trim() || null,
        notes: notes.trim() || null,
      }).select('id').single());

      const planId = (planRes as any).id;
      const itemRows = items.map((it) => ({
        meal_plan_id: planId,
        meal_type: it.meal_type,
        food_id: it.food.id,
        serving_qty: it.qty,
        serving_unit: it.unit,
        quantity_g: it.qty,
        instructions: it.instructions,
      }));

      const { error: itemsErr } = await supabase.from('meal_plan_items').insert(itemRows);
      if (itemsErr) throw itemsErr;

      toast.show('success', 'Nutrition plan assigned to client!');
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
      <Header eyebrow="Trainer" title="Nutrition Planner" back="/coach/more" />
      {toast.node}

      <Async state={st}>{(d) => (
        <>
          <Card style={{ gap: space.md }}>
            <H3>1. Select Client & Plan Period</H3>
            <Muted>Choose client:</Muted>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.sm }}>
              {d.clients.map((c: any) => (
                <Chip key={c.id} label={c.full_name} active={client === c.id} onPress={() => setClient(c.id)} />
              ))}
            </ScrollView>

            <Field label="Meal Plan Name" value={name} onChangeText={setName} placeholder="e.g. Cutting Diet 2200 kcal" />
            <DatePickerField label="Valid From" value={validFrom} onChange={setValidFrom} placeholder="Select start date" />
            <DatePickerField label="Valid To (Optional)" value={validTo} onChange={setValidTo} placeholder="No expiration date" optional />
            <Field label="Diet Notes" value={notes} onChangeText={setNotes} multiline placeholder="Water timings, supplement advice..." />
          </Card>

          <Card style={{ gap: space.md }}>
            <Row style={{ justifyContent: 'space-between' }}>
              <H3>2. Foods & Meals ({items.length})</H3>
              <Btn title="+ Add Food" variant="ghost" onPress={() => setFoodPicker(true)} />
            </Row>

            {items.length > 0 && (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
                <Kpi label="Total Calories" value={`${totals.kcal} kcal`} />
                <Kpi label="Protein" value={`${totals.protein} g`} />
                <Kpi label="Carbs" value={`${totals.carbs} g`} />
                <Kpi label="Fat" value={`${totals.fat} g`} />
              </View>
            )}

            {foodPicker && (
              <Card style={{ backgroundColor: colors.bg, gap: space.sm }}>
                <H3>Add Food Item</H3>
                <Muted>Select meal slot:</Muted>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.sm }}>
                  {MEALS.map((m) => (
                    <Chip key={m.id} label={m.label} active={mealType === m.id} onPress={() => setMealType(m.id)} />
                  ))}
                </ScrollView>

                <Muted style={{ marginTop: 4 }}>Select food from database:</Muted>
                <ScrollView style={{ maxHeight: 150 }} nestedScrollEnabled>
                  {d.foods.map((fd: any) => (
                    <Pressable key={fd.id} onPress={() => setSelFood(fd)} style={{ paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, backgroundColor: selFood?.id === fd.id ? colors.accent : 'transparent', marginBottom: 2 }}>
                      <Text style={{ color: selFood?.id === fd.id ? colors.onAccent : colors.fg, fontFamily: fonts.bodySemi }}>{fd.name} ({fd.kcal_per_100g} kcal/100g)</Text>
                    </Pressable>
                  ))}
                </ScrollView>

                {selFood && (
                  <View style={{ gap: space.sm, marginTop: 8 }}>
                    <Field label="Grams" value={qty} onChangeText={setQty} keyboardType="numeric" />
                    <Field label="Prep note / Instructions" value={instructions} onChangeText={setInstructions} placeholder="e.g. Boiled with salt" />
                    <Row style={{ gap: space.sm }}>
                      <Btn title="Add to Plan" onPress={addFood} style={{ flex: 1 }} />
                      <Btn title="Cancel" variant="ghost" onPress={() => setFoodPicker(false)} style={{ flex: 1 }} />
                    </Row>
                  </View>
                )}
              </Card>
            )}

            {items.map((it, idx) => {
              const factor = it.qty / 100;
              const kc = Math.round((it.food.kcal_per_100g || 0) * factor);
              const p = Math.round((it.food.protein_g || 0) * factor);
              return (
                <Card key={idx} style={{ backgroundColor: colors.bg, padding: space.md }}>
                  <Row style={{ justifyContent: 'space-between' }}>
                    <View>
                      <Text style={{ color: colors.accent, fontFamily: fonts.bodySemi, fontSize: 12, textTransform: 'uppercase' }}>{it.meal_type.replace('_', ' ')}</Text>
                      <Text style={{ color: colors.fg, fontFamily: fonts.headingBold, fontSize: 15 }}>{it.food.name} ({it.qty}g)</Text>
                    </View>
                    <Pressable onPress={() => removeItem(idx)} hitSlop={8}>
                      <Ionicons name="trash-outline" size={18} color={colors.danger} />
                    </Pressable>
                  </Row>
                  <Muted>{kc} kcal · {p}g protein</Muted>
                  {!!it.instructions && <Text style={{ color: colors.muted, fontFamily: fonts.body, fontSize: 13 }}>{it.instructions}</Text>}
                </Card>
              );
            })}

            <Btn title="Assign Meal Plan" onPress={savePlan} loading={busy} disabled={!items.length || !client} />
          </Card>

          {!!client && (
            <Card style={{ gap: space.sm }}>
              <H3>Assigned Plans for Client</H3>
              <Async state={plansSt} empty="No past meal plans for this client.">{(plans) => (
                <View style={{ gap: space.sm }}>
                  {plans.map((p: any) => (
                    <Card key={p.id} style={{ backgroundColor: colors.bg }}>
                      <Text style={{ color: colors.fg, fontFamily: fonts.headingBold, fontSize: 15 }}>{p.name}</Text>
                      <Muted>{fmtD(p.valid_from)} {p.valid_to ? `to ${fmtD(p.valid_to)}` : '(ongoing)'}</Muted>
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
