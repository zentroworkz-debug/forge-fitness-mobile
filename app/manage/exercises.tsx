import React, { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Async, Btn, Card, Chip, Empty, Field, H3, Header, Muted, Row, Screen, useToast } from '@/components/ui';
import { useAsync } from '@/hooks/useAsync';
import { niceError, q, supabase } from '@/lib/supabase';
import { colors, fonts, space } from '@/theme';

const DIFFS = [
  { id: 'beginner', label: 'Beginner' },
  { id: 'intermediate', label: 'Intermediate' },
  { id: 'advanced', label: 'Advanced' },
];

export default function AdminExercises() {
  const toast = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [muscle, setMuscle] = useState('');
  const [equipment, setEquipment] = useState('');
  const [difficulty, setDifficulty] = useState('intermediate');
  const [instructions, setInstructions] = useState('');
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState(false);

  const st = useAsync(async () => {
    const [ex, cats] = await Promise.all([
      q(supabase.from('exercises').select('*,category:exercise_categories(name)').order('name')),
      q(supabase.from('exercise_categories').select('*').order('name')),
    ]);
    return {
      exercises: (ex as any[]) || [],
      categories: (cats as any[]) || [],
    };
  }, []);

  const saveExercise = async () => {
    if (!name.trim()) { toast.show('error', 'Enter exercise name.'); return; }
    setBusy(true);
    try {
      const { error } = await supabase.from('exercises').insert({
        name: name.trim(),
        category_id: category || null,
        muscle_group: muscle.trim() || null,
        equipment: equipment.trim() || null,
        difficulty,
        instructions: instructions.trim() || null,
        is_active: true,
      });
      if (error) throw error;

      toast.show('success', 'Exercise added to library!');
      setName(''); setMuscle(''); setEquipment(''); setInstructions('');
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
      <Header eyebrow="Admin" title="Exercise Library" back="/manage/more" />
      {toast.node}

      <Row style={{ justifyContent: 'space-between' }}>
        <H3>Exercises</H3>
        <Btn title={modalOpen ? 'Cancel' : '+ Add Exercise'} variant="ghost" onPress={() => setModalOpen(!modalOpen)} />
      </Row>

      {modalOpen && (
        <Async state={st}>{(d) => (
          <Card style={{ gap: space.sm, backgroundColor: colors.bg }}>
            <H3>New Exercise</H3>
            <Field label="Exercise Name" value={name} onChangeText={setName} placeholder="e.g. Barbell Squat" />
            <Muted>Category:</Muted>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.sm }}>
              {d.categories.map((c: any) => (
                <Chip key={c.id} label={c.name} active={category === c.id} onPress={() => setCategory(c.id)} />
              ))}
            </ScrollView>
            <Field label="Muscle Group" value={muscle} onChangeText={setMuscle} placeholder="e.g. Quadriceps, Glutes" />
            <Field label="Equipment" value={equipment} onChangeText={setEquipment} placeholder="e.g. Barbell, Squat Rack" />
            <Muted>Difficulty:</Muted>
            <Row style={{ gap: space.sm }}>
              {DIFFS.map((df) => (
                <Chip key={df.id} label={df.label} active={difficulty === df.id} onPress={() => setDifficulty(df.id)} />
              ))}
            </Row>
            <Field label="Instructions" value={instructions} onChangeText={setInstructions} multiline placeholder="Form cues and execution..." />
            <Btn title="Save Exercise" onPress={saveExercise} loading={busy} />
          </Card>
        )}</Async>
      )}

      <Field label="Search Exercises" value={search} onChangeText={setSearch} placeholder="Filter by name or muscle..." />

      <Async state={st} empty="No exercises found.">{(d) => {
        const filtered = d.exercises.filter((e: any) =>
          e.name.toLowerCase().includes(search.toLowerCase()) ||
          (e.muscle_group || '').toLowerCase().includes(search.toLowerCase())
        );

        if (!filtered.length) return <Empty text="No matching exercises found." />;

        return (
          <View style={{ gap: space.md }}>
            {filtered.map((e: any) => (
              <Card key={e.id}>
                <Row style={{ justifyContent: 'space-between' }}>
                  <Text style={{ color: colors.fg, fontFamily: fonts.headingBold, fontSize: 16 }}>{e.name}</Text>
                  <View style={{ backgroundColor: colors.bg, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }}>
                    <Text style={{ color: colors.accent, fontSize: 11, fontFamily: fonts.bodySemi, textTransform: 'capitalize' }}>{e.difficulty || 'All levels'}</Text>
                  </View>
                </Row>
                <Muted>{e.category?.name ?? 'General'} · {e.muscle_group || 'Full body'} {e.equipment ? `· ${e.equipment}` : ''}</Muted>
                {!!e.instructions && <Text style={{ color: colors.muted, fontFamily: fonts.body, fontSize: 13, marginTop: 4 }}>{e.instructions}</Text>}
              </Card>
            ))}
          </View>
        );
      }}</Async>
    </Screen>
  );
}
