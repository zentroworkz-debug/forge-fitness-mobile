import React, { useMemo, useState } from 'react';
import { Async, Card, Chip, Chips, Field, H3, Header, Muted, Screen } from '@/components/ui';
import { useAsync } from '@/hooks/useAsync';
import { q, supabase } from '@/lib/supabase';

export default function People() {
  const [role, setRole] = useState<'client' | 'trainer' | 'admin'>('client'); const [term, setTerm] = useState('');
  const st = useAsync(async () => {
    const r: any[] = await q(supabase.from('user_roles').select('user_id,role'));
    const ids = r.map((x) => x.user_id);
    const p: any[] = ids.length ? await q(supabase.from('profiles').select('id,full_name,phone,approval_status').in('id', ids)) : [];
    return r.map((x) => ({ ...x, p: p.find((y) => y.id === x.user_id) }));
  }, []);
  const rows = useMemo(() => (st.data ?? []).filter((x: any) => x.role === role && (!term || (x.p?.full_name ?? '').toLowerCase().includes(term.toLowerCase()))), [st.data, role, term]);
  return (
    <Screen onRefresh={st.refresh} refreshing={st.refreshing}>
      <Header eyebrow="Admin" title="People" />
      <Chips>{(['client', 'trainer', 'admin'] as const).map((r) => <Chip key={r} label={r + 's'} active={role === r} onPress={() => setRole(r)} />)}</Chips>
      <Field label="Search by name" value={term} onChangeText={setTerm} />
      <Async state={st}>{() => rows.length === 0 ? <Muted>No matches.</Muted> : <>{rows.map((x: any) => <Card key={x.user_id}><H3>{x.p?.full_name ?? 'Unnamed'}</H3><Muted>{x.p?.phone ?? 'no phone'} · {x.p?.approval_status}</Muted></Card>)}</>}</Async>
      <Muted>Editing people, plans, assignments and reports: use the website admin portal.</Muted>
    </Screen>
  );
}
