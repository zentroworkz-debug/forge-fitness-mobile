import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Async, Btn, Card, Chip, Chips, Empty, H3, Header, Muted, Row, Screen, useToast } from '@/components/ui';
import { useAsync } from '@/hooks/useAsync';
import { useAuth } from '@/contexts/AuthContext';
import { niceError, q, supabase } from '@/lib/supabase';
import { fmtD, fmtDT } from '@/lib/format';
import { colors, fonts, radius, space } from '@/theme';

export default function TrainerRequests() {
  const { user } = useAuth();
  const toast = useToast();
  const [filter, setFilter] = useState<'pending' | 'accepted' | 'declined' | 'all'>('pending');
  const [busy, setBusy] = useState('');

  const st = useAsync(async () => {
    const r: any[] = await q(supabase.from('trainer_requests')
      .select('id,client_id,status,created_at,responded_at')
      .eq('trainer_id', user!.id)
      .order('created_at', { ascending: false }));

    const ids = r.map((x) => x.client_id);
    const p: any[] = ids.length ? await q(supabase.from('profiles').select('id,full_name,phone,email').in('id', ids)) : [];
    const cp: any[] = ids.length ? await q(supabase.from('client_profiles').select('id,age,fitness_goal').in('id', ids)) : [];

    return r.map((x) => ({
      ...x,
      p: p.find((y) => y.id === x.client_id),
      c: cp.find((y) => y.id === x.client_id),
    }));
  }, [user?.id]);

  const respond = async (id: string, accept: boolean) => {
    setBusy(id + accept);
    const { error } = await supabase.rpc('respond_trainer_request', { p_request: id, p_accept: accept });
    setBusy('');
    if (error) {
      toast.show('error', niceError(error));
    } else {
      toast.show('success', accept ? 'Request accepted! The client has been added to your roster.' : 'Request declined.');
      st.reload();
    }
  };

  const statusBadge = (s: string) => {
    const isAccepted = s === 'accepted' || s === 'approved';
    const isDeclined = s === 'declined' || s === 'rejected';
    const bg = isAccepted ? 'rgba(198,255,61,0.15)' : isDeclined ? 'rgba(255,107,91,0.15)' : 'rgba(255,200,87,0.15)';
    const fg = isAccepted ? colors.accent : isDeclined ? colors.danger : colors.warn;
    const label = isAccepted ? 'APPROVED' : isDeclined ? 'REJECTED' : 'PENDING';
    return (
      <View style={{ backgroundColor: bg, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 6, borderWidth: 1, borderColor: fg }}>
        <Text style={{ color: fg, fontFamily: fonts.bodySemi, fontSize: 11, letterSpacing: 0.5 }}>{label}</Text>
      </View>
    );
  };

  return (
    <Screen onRefresh={st.refresh} refreshing={st.refreshing}>
      <Header eyebrow="Trainer" title="Client Requests" back={true} />
      {toast.node}

      <Chips>
        <Chip label="Pending" active={filter === 'pending'} onPress={() => setFilter('pending')} />
        <Chip label="Approved" active={filter === 'accepted'} onPress={() => setFilter('accepted')} />
        <Chip label="Rejected" active={filter === 'declined'} onPress={() => setFilter('declined')} />
        <Chip label="All Requests" active={filter === 'all'} onPress={() => setFilter('all')} />
      </Chips>

      <Async state={st} empty="No client requests received yet.">{(rows: any[]) => {
        const filtered = rows.filter((r) => {
          if (filter === 'all') return true;
          if (filter === 'pending') return r.status === 'pending';
          if (filter === 'accepted') return r.status === 'accepted' || r.status === 'approved';
          if (filter === 'declined') return r.status === 'declined' || r.status === 'rejected';
          return true;
        });

        if (!filtered.length) {
          return <Empty text={`No ${filter} requests.`} />;
        }

        return (
          <View style={{ gap: space.md }}>
            {filtered.map((r) => {
              const name = r.p?.full_name ?? 'Client';
              const isPending = r.status === 'pending';
              const isAccepted = r.status === 'accepted' || r.status === 'approved';

              return (
                <Card key={r.id} accent={isPending} style={{ gap: space.md }}>
                  <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <View style={{ gap: 2, flex: 1 }}>
                      <Text style={{ color: colors.fg, fontFamily: fonts.headingBold, fontSize: 17 }}>{name}</Text>
                      <Muted>{r.p?.email} {r.p?.phone ? `· ${r.p.phone}` : ''}</Muted>
                      {r.c?.fitness_goal && (
                        <Text style={{ color: colors.muted, fontSize: 13, marginTop: 2 }}>
                          Goal: <Text style={{ color: colors.fg }}>{r.c.fitness_goal}</Text>
                        </Text>
                      )}
                    </View>
                    {statusBadge(r.status)}
                  </Row>

                  {/* Timeline */}
                  <View style={{ backgroundColor: colors.bg, padding: space.md, borderRadius: 12, gap: space.sm }}>
                    <Text style={{ color: colors.muted, fontSize: 11, fontFamily: fonts.bodySemi, textTransform: 'uppercase', letterSpacing: 1 }}>
                      Timeline
                    </Text>

                    {/* Step 1: Requested */}
                    <Row style={{ gap: space.sm }}>
                      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent }} />
                      <Text style={{ color: colors.fg, fontSize: 13, fontFamily: fonts.bodyMedium, flex: 1 }}>
                        Requested on {fmtDT(r.created_at)}
                      </Text>
                    </Row>

                    {/* Step 2: Resolution */}
                    <Row style={{ gap: space.sm }}>
                      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: isPending ? colors.warn : isAccepted ? colors.accent : colors.danger }} />
                      <Text style={{ color: isPending ? colors.warn : colors.muted, fontSize: 13, fontFamily: fonts.bodyMedium, flex: 1 }}>
                        {isPending
                          ? 'Awaiting your review'
                          : `${isAccepted ? 'Accepted' : 'Declined'} on ${fmtDT(r.responded_at || r.created_at)}`}
                      </Text>
                    </Row>
                  </View>

                  {/* Actions for pending requests */}
                  {isPending && (
                    <Row style={{ gap: space.sm }}>
                      <Btn
                        title="Accept"
                        onPress={() => respond(r.id, true)}
                        loading={busy === r.id + 'true'}
                        icon={<Ionicons name="checkmark-circle" size={18} color={colors.onAccent} />}
                        style={{ flex: 1 }}
                      />
                      <Btn
                        title="Decline"
                        variant="danger"
                        onPress={() => respond(r.id, false)}
                        loading={busy === r.id + 'false'}
                        icon={<Ionicons name="close-circle" size={18} color={colors.danger} />}
                        style={{ flex: 1 }}
                      />
                    </Row>
                  )}
                </Card>
              );
            })}
          </View>
        );
      }}</Async>
    </Screen>
  );
}
