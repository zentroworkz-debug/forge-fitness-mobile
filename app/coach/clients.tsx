import React, { useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Async, Btn, Card, Field, H3, Header, Muted, Row, Screen } from '@/components/ui';
import { useAsync } from '@/hooks/useAsync';
import { useAuth } from '@/contexts/AuthContext';
import { q, supabase } from '@/lib/supabase';
import { fmtD } from '@/lib/format';
import { colors, fonts, radius, space } from '@/theme';

export default function TrainerClients() {
  const { user } = useAuth();
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [search, setSearch] = useState('');

  const st = useAsync(async () => {
    const a: any[] = await q(supabase.from('trainer_assignments')
      .select('client_id,status,started_at')
      .eq('trainer_id', user!.id)
      .in('status', ['active', 'pending_handover']));
    if (!a.length) return [];
    const ids = a.map((x) => x.client_id);
    const [prof, cp, wt, mem]: any[] = await Promise.all([
      q(supabase.from('profiles').select('id,full_name,phone,email').in('id', ids)),
      q(supabase.from('client_profiles').select('id,age,fitness_goal,experience_level').in('id', ids)),
      q(supabase.from('weight_logs').select('client_id,weight_kg,logged_on').in('client_id', ids).order('logged_on', { ascending: false })),
      q(supabase.from('client_memberships').select('client_id,ends_on,status,plan:membership_plans(name)').in('client_id', ids).eq('status', 'active')),
    ]);
    return a.map((x) => ({
      ...x,
      p: prof.find((p: any) => p.id === x.client_id),
      c: cp.find((c: any) => c.id === x.client_id),
      w: wt.find((w: any) => w.client_id === x.client_id),
      mem: mem.find((m: any) => m.client_id === x.client_id),
    }));
  }, [user?.id]);

  return (
    <Screen onRefresh={st.refresh} refreshing={st.refreshing}>
      <Header eyebrow="Trainer" title="My Clients" />

      <Field
        label=""
        placeholder="Search clients by name..."
        value={search}
        onChangeText={setSearch}
      />

      <Async state={st} empty="No assigned clients yet.">{(rows: any[]) => {
        const filtered = rows.filter((r) => {
          const name = r.p?.full_name?.toLowerCase() || '';
          return name.includes(search.toLowerCase());
        });

        if (!filtered.length) {
          return <Muted>No clients match "{search}".</Muted>;
        }

        return (
          <View style={{ gap: space.md }}>
            {filtered.map((r) => {
              const name = r.p?.full_name ?? 'Client';
              const goal = r.c?.fitness_goal;
              const weight = r.w?.weight_kg ? `${r.w.weight_kg} kg` : null;
              const plan = r.mem?.plan?.name;

              return (
                <Card
                  key={r.client_id}
                  onPress={() => setSelectedClient(r)}
                  style={{ gap: space.sm }}>
                  <Row style={{ justifyContent: 'space-between' }}>
                    <View style={{ gap: 2, flex: 1 }}>
                      <Text style={{ color: colors.fg, fontFamily: fonts.headingBold, fontSize: 16 }}>{name}</Text>
                      <Muted>{r.p?.phone || r.p?.email || 'No contact info'}</Muted>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      {plan && (
                        <View style={{ backgroundColor: colors.bg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1, borderColor: colors.border }}>
                          <Text style={{ color: colors.accent, fontSize: 11, fontFamily: fonts.bodySemi }}>{plan}</Text>
                        </View>
                      )}
                      <Ionicons name="chevron-forward" size={18} color={colors.muted} />
                    </View>
                  </Row>

                  <Row style={{ flexWrap: 'wrap', gap: space.md, marginTop: 2 }}>
                    {r.c?.age && <Text style={{ color: colors.muted, fontSize: 13 }}>Age: <Text style={{ color: colors.fg }}>{r.c.age}y</Text></Text>}
                    {goal && <Text style={{ color: colors.muted, fontSize: 13 }}>Goal: <Text style={{ color: colors.fg }}>{goal}</Text></Text>}
                    {weight && <Text style={{ color: colors.muted, fontSize: 13 }}>Weight: <Text style={{ color: colors.fg }}>{weight}</Text></Text>}
                  </Row>

                  {r.status === 'pending_handover' && (
                    <Text style={{ color: colors.warn, fontSize: 12, fontFamily: fonts.bodyMedium }}>
                      Handover in progress
                    </Text>
                  )}
                </Card>
              );
            })}
          </View>
        );
      }}</Async>

      {/* Action Sheet Modal when a Client is Clicked */}
      <Modal visible={!!selectedClient} transparent animationType="slide" onRequestClose={() => setSelectedClient(null)}>
        <Pressable onPress={() => setSelectedClient(null)} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' }}>
          <Pressable onPress={(e) => e.stopPropagation()} style={{ backgroundColor: colors.bg2, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, padding: space.xl, gap: space.md, borderWidth: 1, borderColor: colors.border }}>
            <Row style={{ justifyContent: 'space-between' }}>
              <View style={{ gap: 2 }}>
                <Text style={{ color: colors.fg, fontFamily: fonts.headingBold, fontSize: 20 }}>{selectedClient?.p?.full_name}</Text>
                <Muted>{selectedClient?.p?.email} · {selectedClient?.p?.phone || 'No phone'}</Muted>
              </View>
              <Pressable onPress={() => setSelectedClient(null)} hitSlop={12}>
                <Ionicons name="close" size={24} color={colors.muted} />
              </Pressable>
            </Row>

            {/* Quick Profile Summary */}
            <View style={{ backgroundColor: colors.bg, padding: space.md, borderRadius: 12, gap: 6 }}>
              <Row style={{ justifyContent: 'space-between' }}>
                <Text style={{ color: colors.muted, fontSize: 13 }}>Fitness Goal:</Text>
                <Text style={{ color: colors.fg, fontFamily: fonts.bodySemi }}>{selectedClient?.c?.fitness_goal || 'Not specified'}</Text>
              </Row>
              <Row style={{ justifyContent: 'space-between' }}>
                <Text style={{ color: colors.muted, fontSize: 13 }}>Experience Level:</Text>
                <Text style={{ color: colors.fg, fontFamily: fonts.bodySemi }}>{selectedClient?.c?.experience_level || 'General'}</Text>
              </Row>
              <Row style={{ justifyContent: 'space-between' }}>
                <Text style={{ color: colors.muted, fontSize: 13 }}>Membership:</Text>
                <Text style={{ color: colors.accent, fontFamily: fonts.bodySemi }}>{selectedClient?.mem?.plan?.name || 'No active plan'}</Text>
              </Row>
              <Row style={{ justifyContent: 'space-between' }}>
                <Text style={{ color: colors.muted, fontSize: 13 }}>Assigned Since:</Text>
                <Text style={{ color: colors.fg, fontFamily: fonts.bodySemi }}>{selectedClient?.started_at ? fmtD(selectedClient.started_at) : 'Active'}</Text>
              </Row>
            </View>

            {/* Assign Actions */}
            <Text style={{ color: colors.muted, fontFamily: fonts.bodySemi, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
              Quick Actions
            </Text>

            <Btn
              title="Assign / Build Workout Plan"
              icon={<Ionicons name="barbell" size={20} color={colors.onAccent} />}
              onPress={() => {
                const clientId = selectedClient?.client_id;
                setSelectedClient(null);
                router.push({ pathname: '/coach/workouts', params: { client: clientId } });
              }}
            />

            <Btn
              title="Plan Nutrition & Meal Diet"
              variant="ghost"
              icon={<Ionicons name="nutrition" size={20} color={colors.fg} />}
              onPress={() => {
                const clientId = selectedClient?.client_id;
                setSelectedClient(null);
                router.push({ pathname: '/coach/nutrition', params: { client: clientId } });
              }}
            />

            <Btn
              title="Set Targets & Reminders"
              variant="ghost"
              icon={<Ionicons name="flame" size={20} color={colors.fg} />}
              onPress={() => {
                const clientId = selectedClient?.client_id;
                setSelectedClient(null);
                router.push({ pathname: '/coach/targets', params: { client: clientId } });
              }}
            />

            <Btn
              title="Book 1-on-1 Session"
              variant="ghost"
              icon={<Ionicons name="calendar" size={20} color={colors.fg} />}
              onPress={() => {
                const clientId = selectedClient?.client_id;
                setSelectedClient(null);
                router.push({ pathname: '/coach/calendar', params: { client: clientId } });
              }}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>
  );
}
