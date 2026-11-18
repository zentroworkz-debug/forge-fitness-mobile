import React, { useState } from 'react';
import { Pressable, Switch, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Async, Btn, Card, Empty, Field, H3, Header, Muted, Row, Screen, useToast } from '@/components/ui';
import { useAsync } from '@/hooks/useAsync';
import { niceError, q, supabase } from '@/lib/supabase';
import { fmtINR } from '@/lib/format';
import { colors, fonts, space } from '@/theme';

export default function AdminPlans() {
  const toast = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [duration, setDuration] = useState('30');
  const [trainerAccess, setTrainerAccess] = useState(false);
  const [benefits, setBenefits] = useState('');
  const [busy, setBusy] = useState(false);

  const st = useAsync(async () => {
    const res = await q(supabase.from('membership_plans').select('*').order('created_at', { ascending: false }));
    return (res as any[]) || [];
  }, []);

  const savePlan = async () => {
    if (!name.trim() || !price || !duration) {
      toast.show('error', 'Please fill name, price, and duration.');
      return;
    }
    setBusy(true);
    try {
      const bArr = benefits.split(',').map((b) => b.trim()).filter(Boolean);
      const { error } = await supabase.from('membership_plans').insert({
        name: name.trim(),
        price_inr: Number(price),
        duration_days: Number(duration),
        trainer_access: trainerAccess,
        benefits: bArr,
        is_active: true,
      });
      if (error) throw error;
      toast.show('success', 'Membership plan created!');
      setName(''); setPrice(''); setBenefits('');
      setModalOpen(false);
      st.reload();
    } catch (e) {
      toast.show('error', niceError(e));
    } finally {
      setBusy(false);
    }
  };

  const toggleActive = async (p: any) => {
    const { error } = await supabase.from('membership_plans').update({ is_active: !p.is_active }).eq('id', p.id);
    if (error) toast.show('error', niceError(error));
    else st.reload();
  };

  return (
    <Screen onRefresh={st.refresh} refreshing={st.refreshing}>
      <Header eyebrow="Admin" title="Membership Plans" back="/manage/more" />
      {toast.node}

      <Row style={{ justifyContent: 'space-between' }}>
        <H3>Plans Catalog</H3>
        <Btn title={modalOpen ? 'Cancel' : '+ New Plan'} variant="ghost" onPress={() => setModalOpen(!modalOpen)} />
      </Row>

      {modalOpen && (
        <Card style={{ gap: space.sm, backgroundColor: colors.bg }}>
          <H3>Create Membership Plan</H3>
          <Field label="Plan Name" value={name} onChangeText={setName} placeholder="e.g. Annual Elite" />
          <Field label="Price (₹ INR)" value={price} onChangeText={setPrice} keyboardType="numeric" />
          <Field label="Duration (days)" value={duration} onChangeText={setDuration} keyboardType="numeric" />
          <Field label="Benefits (comma separated)" value={benefits} onChangeText={setBenefits} placeholder="Full gym access, Locker, Steam bath" />
          <Row style={{ justifyContent: 'space-between', paddingVertical: 8 }}>
            <Text style={{ color: colors.fg, fontFamily: fonts.bodySemi }}>Includes Personal Trainer</Text>
            <Switch value={trainerAccess} onValueChange={setTrainerAccess} trackColor={{ true: colors.accent, false: colors.border }} />
          </Row>
          <Btn title="Save Plan" onPress={savePlan} loading={busy} />
        </Card>
      )}

      <Async state={st} empty="No membership plans found.">{(plans) => (
        <View style={{ gap: space.md }}>
          {plans.map((p: any) => (
            <Card key={p.id}>
              <Row style={{ justifyContent: 'space-between' }}>
                <Text style={{ color: colors.fg, fontFamily: fonts.headingBold, fontSize: 16 }}>{p.name}</Text>
                <Pressable onPress={() => toggleActive(p)} style={{ backgroundColor: p.is_active ? colors.accent : colors.border, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
                  <Text style={{ color: p.is_active ? colors.onAccent : colors.muted, fontFamily: fonts.bodySemi, fontSize: 12 }}>
                    {p.is_active ? 'Active' : 'Inactive'}
                  </Text>
                </Pressable>
              </Row>
              <Muted>{fmtINR(p.price_inr)} · {p.duration_days} days {p.trainer_access ? '· Trainer included' : ''}</Muted>
              {Array.isArray(p.benefits) && p.benefits.length > 0 && (
                <View style={{ marginTop: 6, gap: 2 }}>
                  {p.benefits.map((b: string, i: number) => (
                    <Text key={i} style={{ color: colors.muted, fontFamily: fonts.body, fontSize: 13 }}>• {b}</Text>
                  ))}
                </View>
              )}
            </Card>
          ))}
        </View>
      )}</Async>
    </Screen>
  );
}
