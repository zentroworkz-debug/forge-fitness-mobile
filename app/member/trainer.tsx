import React, { useState } from 'react';
import { Async, Banner, Btn, Card, H3, Header, Muted, P, Row, Screen, useToast } from '@/components/ui';
import { useAsync } from '@/hooks/useAsync';
import { useAuth } from '@/contexts/AuthContext';
import { niceError, q, supabase } from '@/lib/supabase';

export default function MyTrainer() {
  const { user } = useAuth(); const toast = useToast(); const [busy, setBusy] = useState('');
  const st = useAsync(async () => {
    const [asg, reqs, dir]: any[] = await Promise.all([
      q(supabase.from('trainer_assignments').select('trainer_id,status').eq('client_id', user!.id).in('status', ['active', 'transferring', 'pending_handover']).limit(1)),
      q(supabase.from('trainer_requests').select('id,trainer_id,status,created_at').eq('client_id', user!.id).order('created_at', { ascending: false }).limit(10)),
      q(supabase.from('trainer_directory').select('id,full_name,specialization,experience_years,certifications,bio')),
    ]);
    return { asg: asg[0], reqs, dir };
  }, [user?.id]);
  // request_trainer / cancel_trainer_request are SECURITY DEFINER functions: the database validates the rules.
  const call = async (name: string, fn: () => PromiseLike<{ error: any }>, ok: string) => { setBusy(name); const { error } = await fn(); setBusy(''); if (error) toast.show('error', niceError(error)); else { toast.show('success', ok); st.reload(); } };
  return (
    <Screen onRefresh={st.refresh} refreshing={st.refreshing}>
      <Header eyebrow="Client" title="My trainer" back="/member/more" />
      {toast.node}
      <Async state={st}>{(d) => {
        const name = (id: string) => d.dir.find((t: any) => t.id === id)?.full_name ?? 'Trainer';
        const pending = d.reqs.find((r: any) => r.status === 'pending');
        return (<>
          {d.asg ? <Card accent><Muted>Assigned trainer</Muted><H3>{name(d.asg.trainer_id)}</H3>{d.asg.status === 'pending_handover' && <Muted>Handover in progress. Your new trainer starts once it is complete.</Muted>}</Card> : <Muted>You do not have a trainer yet. Send a request below.</Muted>}
          {pending && <Card><P>Request pending with {name(pending.trainer_id)}.</P><Btn title="Cancel request" variant="danger" loading={busy === 'cancel'} onPress={() => call('cancel', () => supabase.rpc('cancel_trainer_request', { p_request: pending.id }) as any, 'Request cancelled.')} /></Card>}
          <H3>Available trainers</H3>
          {d.dir.filter((t: any) => t.id !== d.asg?.trainer_id).map((t: any) => (
            <Card key={t.id} style={{ gap: 6 }}><H3>{t.full_name}</H3><Muted>{[t.specialization, t.experience_years != null ? `${t.experience_years} yrs` : null].filter(Boolean).join(' · ')}</Muted>{!!t.bio && <P>{t.bio}</P>}
              <Btn title="Request this trainer" variant="ghost" disabled={!!pending} loading={busy === t.id} onPress={() => call(t.id, () => supabase.rpc('request_trainer', { p_trainer: t.id }) as any, 'Request sent. You will be notified of the result.')} /></Card>))}
          {d.reqs.length > 0 && <><H3>Request history</H3>{d.reqs.map((r: any) => <Card key={r.id}><Row style={{ justifyContent: 'space-between' }}><P>{name(r.trainer_id)}</P><Muted>{r.status}</Muted></Row></Card>)}</>}
        </>);
      }}</Async>
    </Screen>
  );
}
