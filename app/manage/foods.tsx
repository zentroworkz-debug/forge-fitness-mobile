import React, { useState } from 'react';
import { Pressable, Switch, Text, View } from 'react-native';
import { Async, Btn, Card, Empty, Field, H3, Header, Muted, Row, Screen, useToast } from '@/components/ui';
import { useAsync } from '@/hooks/useAsync';
import { useAuth } from '@/contexts/AuthContext';
import { niceError, q, supabase } from '@/lib/supabase';
import { colors, fonts, space } from '@/theme';

export default function AdminFoods() {
  const { user } = useAuth();
  const toast = useToast();

  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [kcal, setKcal] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [fibre, setFibre] = useState('');
  const [verified, setVerified] = useState(true);
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState(false);

  const st = useAsync(async () => {
    const res = await q(supabase.from('food_items').select('*').order('name'));
    return (res as any[]) || [];
  }, []);

  const saveFood = async () => {
    if (!name.trim() || !kcal) {
      toast.show('error', 'Enter name and calories per 100g.');
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.from('food_items').insert({
        name: name.trim(),
        category: category.trim() || 'General',
        kcal_per_100g: Number(kcal),
        protein_g: Number(protein) || 0,
        carbs_g: Number(carbs) || 0,
        fat_g: Number(fat) || 0,
        fibre_g: Number(fibre) || 0,
        is_verified: verified,
        created_by: user!.id,
      });
      if (error) throw error;

      toast.show('success', 'Food added to database!');
      setName(''); setKcal(''); setProtein(''); setCarbs(''); setFat(''); setFibre('');
      setModalOpen(false);
      st.reload();
    } catch (e) {
      toast.show('error', niceError(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen onRefresh={st.refresh} refreshing={st.refreshing}>
      <Header eyebrow="Admin" title="Food Database" back="/manage/more" />
      {toast.node}

      <Row style={{ justifyContent: 'space-between' }}>
        <H3>Foods (per 100g)</H3>
        <Btn title={modalOpen ? 'Cancel' : '+ Add Food'} variant="ghost" onPress={() => setModalOpen(!modalOpen)} />
      </Row>

      {modalOpen && (
        <Card style={{ gap: space.sm, backgroundColor: colors.bg }}>
          <H3>New Food Entry</H3>
          <Field label="Food Name" value={name} onChangeText={setName} placeholder="e.g. Chicken Breast, Raw" />
          <Field label="Category" value={category} onChangeText={setCategory} placeholder="e.g. Poultry, Dairy, Grains" />
          <Row style={{ gap: space.sm }}>
            <View style={{ flex: 1 }}><Field label="Kcal / 100g" value={kcal} onChangeText={setKcal} keyboardType="numeric" /></View>
            <View style={{ flex: 1 }}><Field label="Protein (g)" value={protein} onChangeText={setProtein} keyboardType="numeric" /></View>
          </Row>
          <Row style={{ gap: space.sm }}>
            <View style={{ flex: 1 }}><Field label="Carbs (g)" value={carbs} onChangeText={setCarbs} keyboardType="numeric" /></View>
            <View style={{ flex: 1 }}><Field label="Fat (g)" value={fat} onChangeText={setFat} keyboardType="numeric" /></View>
            <View style={{ flex: 1 }}><Field label="Fibre (g)" value={fibre} onChangeText={setFibre} keyboardType="numeric" /></View>
          </Row>
          <Row style={{ justifyContent: 'space-between', paddingVertical: 8 }}>
            <Text style={{ color: colors.fg, fontFamily: fonts.bodySemi }}>Verified nutritional source</Text>
            <Switch value={verified} onValueChange={setVerified} trackColor={{ true: colors.accent, false: colors.border }} />
          </Row>
          <Btn title="Save Food" onPress={saveFood} loading={busy} />
        </Card>
      )}

      <Field label="Search Foods" value={search} onChangeText={setSearch} placeholder="Filter by food name..." />

      <Async state={st} empty="No food items found.">{(foods) => {
        const filtered = foods.filter((f: any) =>
          f.name.toLowerCase().includes(search.toLowerCase()) ||
          (f.category || '').toLowerCase().includes(search.toLowerCase())
        );

        if (!filtered.length) return <Empty text="No matching food items found." />;

        return (
          <View style={{ gap: space.md }}>
            {filtered.map((f: any) => (
              <Card key={f.id}>
                <Row style={{ justifyContent: 'space-between' }}>
                  <Text style={{ color: colors.fg, fontFamily: fonts.headingBold, fontSize: 16 }}>{f.name}</Text>
                  <View style={{ backgroundColor: f.is_verified ? colors.accent : colors.warn, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }}>
                    <Text style={{ color: f.is_verified ? colors.onAccent : colors.fg, fontSize: 11, fontFamily: fonts.bodySemi }}>
                      {f.is_verified ? 'Verified' : 'Custom'}
                    </Text>
                  </View>
                </Row>
                <Muted>{f.category || 'General'} · {f.kcal_per_100g} kcal / 100g</Muted>
                <Text style={{ color: colors.muted, fontFamily: fonts.body, fontSize: 13, marginTop: 4 }}>
                  P: {f.protein_g}g · C: {f.carbs_g}g · F: {f.fat_g}g {f.fibre_g ? `· Fib: ${f.fibre_g}g` : ''}
                </Text>
              </Card>
            ))}
          </View>
        );
      }}</Async>
    </Screen>
  );
}
