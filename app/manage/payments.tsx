import React, { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Async, Btn, Card, Chip, Empty, Field, H3, Header, Kpi, Muted, Row, Screen, useToast } from '@/components/ui';
import { useAsync } from '@/hooks/useAsync';
import { useAuth } from '@/contexts/AuthContext';
import { niceError, q, supabase, todayIST } from '@/lib/supabase';
import { fmtDT, fmtINR } from '@/lib/format';
import { colors, fonts, space } from '@/theme';

const METHODS = [
  { id: 'upi', label: 'UPI' },
  { id: 'cash', label: 'Cash' },
  { id: 'card', label: 'Card' },
  { id: 'bank', label: 'Bank Transfer' },
];

export default function AdminPayments() {
  const { user } = useAuth();
  const toast = useToast();
  const today = todayIST();

  const [modalOpen, setModalOpen] = useState(false);
  const [selClient, setSelClient] = useState('');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('upi');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const st = useAsync(async () => {
    const [pays, clients] = await Promise.all([
      q(supabase.from('payments')
        .select('id,amount_inr,method,paid_at,note,client:profiles!payments_client_id_fkey(full_name)')
        .order('paid_at', { ascending: false })
        .limit(50)),
      q(supabase.from('profiles')
        .select('id,full_name')
        .eq('requested_role', 'client')
        .eq('approval_status', 'approved')
        .order('full_name')),
    ]);
    const pList = (pays as any[]) || [];
    const totalRev = pList.reduce((acc, p) => acc + Number(p.amount_inr || 0), 0);
    return {
      payments: pList,
      clients: (clients as any[]) || [],
      totalRev,
    };
  }, []);

  const savePayment = async () => {
    if (!selClient) { toast.show('error', 'Select a client.'); return; }
    if (!amount || Number(amount) <= 0) { toast.show('error', 'Enter valid amount.'); return; }

    setBusy(true);
    try {
      const { error } = await supabase.from('payments').insert({
        client_id: selClient,
        amount_inr: Number(amount),
        method,
        paid_at: new Date().toISOString(),
        note: note.trim() || null,
        recorded_by: user!.id,
      });
      if (error) throw error;

      toast.show('success', 'Payment recorded!');
      setAmount(''); setNote(''); setModalOpen(false);
      st.reload();
    } catch (e) {
      toast.show('error', niceError(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen onRefresh={st.refresh} refreshing={st.refreshing}>
      <Header eyebrow="Admin" title="Payments & Revenue" back="/manage/more" />
      {toast.node}

      <Async state={st}>{(d) => (
        <>
          <View style={{ flexDirection: 'row', gap: space.md }}>
            <Kpi label="Total Logged" value={fmtINR(d.totalRev)} />
            <Kpi label="Transactions" value={d.payments.length} />
          </View>

          <Row style={{ justifyContent: 'space-between' }}>
            <H3>Payment History</H3>
            <Btn title={modalOpen ? 'Cancel' : '+ Record Payment'} variant="ghost" onPress={() => setModalOpen(!modalOpen)} />
          </Row>

          {modalOpen && (
            <Card style={{ gap: space.sm, backgroundColor: colors.bg }}>
              <H3>Record Client Payment</H3>
              <Muted>Choose client:</Muted>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.sm }}>
                {d.clients.map((c: any) => (
                  <Chip key={c.id} label={c.full_name} active={selClient === c.id} onPress={() => setSelClient(c.id)} />
                ))}
              </ScrollView>

              <Field label="Amount (₹ INR)" value={amount} onChangeText={setAmount} keyboardType="numeric" />

              <Muted>Payment Method:</Muted>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.sm }}>
                {METHODS.map((m) => (
                  <Chip key={m.id} label={m.label} active={method === m.id} onPress={() => setMethod(m.id)} />
                ))}
              </ScrollView>

              <Field label="Note / Reference (Optional)" value={note} onChangeText={setNote} placeholder="e.g. UPI Ref #12345" />
              <Btn title="Save Payment" onPress={savePayment} loading={busy} />
            </Card>
          )}

          {d.payments.length === 0 ? (
            <Empty text="No payments recorded yet." />
          ) : (
            <View style={{ gap: space.md }}>
              {d.payments.map((p: any) => (
                <Card key={p.id}>
                  <Row style={{ justifyContent: 'space-between' }}>
                    <Text style={{ color: colors.fg, fontFamily: fonts.headingBold, fontSize: 16 }}>{p.client?.full_name ?? 'Client'}</Text>
                    <Text style={{ color: colors.accent, fontFamily: fonts.heading, fontSize: 18 }}>{fmtINR(p.amount_inr)}</Text>
                  </Row>
                  <Row style={{ justifyContent: 'space-between', marginTop: 4 }}>
                    <Muted>{fmtDT(p.paid_at)}</Muted>
                    <View style={{ backgroundColor: colors.bg, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }}>
                      <Text style={{ color: colors.fg, fontFamily: fonts.bodySemi, fontSize: 12, textTransform: 'uppercase' }}>{p.method}</Text>
                    </View>
                  </Row>
                  {!!p.note && <Text style={{ color: colors.muted, fontFamily: fonts.body, fontSize: 13, marginTop: 4 }}>Ref: {p.note}</Text>}
                </Card>
              ))}
            </View>
          )}
        </>
      )}</Async>
    </Screen>
  );
}
