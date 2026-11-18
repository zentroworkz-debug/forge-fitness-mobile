import React from 'react';
import { Async, Card, H3, Header, Muted, P, Row, Screen } from '@/components/ui';
import { useAsync } from '@/hooks/useAsync';
import { useAuth } from '@/contexts/AuthContext';
import { q, supabase } from '@/lib/supabase';
import { fmtD } from '@/lib/format';

export default function Membership() {
  const { user } = useAuth();
  const st = useAsync(async () => {
    const [mem, pay, plans]: any[] = await Promise.all([
      q(supabase.from('client_memberships').select('id,starts_on,ends_on,status,plan:membership_plans(name,price_inr,benefits)').eq('client_id', user!.id).order('ends_on', { ascending: false }).limit(5)),
      q(supabase.from('payments').select('id,amount_inr,method,paid_at').eq('client_id', user!.id).order('paid_at', { ascending: false }).limit(10)),
      q(supabase.from('membership_plans').select('id,name,price_inr,duration_days,benefits').eq('is_active', true).order('price_inr')),
    ]);
    return { mem, pay, plans };
  }, [user?.id]);
  return (
    <Screen onRefresh={st.refresh} refreshing={st.refreshing}>
      <Header eyebrow="Client" title="Membership" back="/member/more" />
      <Async state={st}>{(d) => (<>
        <H3>My membership</H3>
        {d.mem.length === 0 ? <Muted>No membership yet. Visit the front desk to join a plan.</Muted> : d.mem.map((m: any) => (
          <Card key={m.id} accent={m.status === 'active'}><Row style={{ justifyContent: 'space-between' }}><H3>{m.plan?.name}</H3><Muted>{m.status}</Muted></Row><P>{fmtD(m.starts_on)} → {fmtD(m.ends_on)}</P></Card>))}
        <H3>Payments</H3>
        {d.pay.length === 0 ? <Muted>No payments recorded.</Muted> : d.pay.map((p: any) => <Card key={p.id}><Row style={{ justifyContent: 'space-between' }}><P>₹{Number(p.amount_inr).toLocaleString('en-IN')}</P><Muted>{p.method} · {fmtD(p.paid_at)}</Muted></Row></Card>)}
        <H3>Available plans</H3>
        {d.plans.map((p: any) => <Card key={p.id}><Row style={{ justifyContent: 'space-between' }}><H3>{p.name}</H3><P>₹{Number(p.price_inr).toLocaleString('en-IN')}</P></Row><Muted>{p.duration_days} days</Muted>{Array.isArray(p.benefits) && p.benefits.map((b: string) => <P key={b}>✓ {b}</P>)}</Card>)}
        <Muted>Payments are recorded by gym staff; online payment is not available yet.</Muted>
      </>)}</Async>
    </Screen>
  );
}
