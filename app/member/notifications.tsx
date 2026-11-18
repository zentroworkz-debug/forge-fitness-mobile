import React from 'react';
import { Pressable } from 'react-native';
import { Async, Btn, Card, H3, Header, Muted, P, Screen } from '@/components/ui';
import { useAsync } from '@/hooks/useAsync';
import { useAuth } from '@/contexts/AuthContext';
import { q, supabase } from '@/lib/supabase';
import { fmtDT } from '@/lib/format';

export default function Notifications() {
  const { user } = useAuth();
  const st = useAsync(() => q(supabase.from('notifications').select('id,title,body,created_at,read_at').eq('user_id', user!.id).order('created_at', { ascending: false }).limit(50)) as Promise<any[]>, [user?.id]);
  const read = async (id: string) => { await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('id', id).eq('user_id', user!.id); st.reload(); };
  const readAll = async () => { await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('user_id', user!.id).is('read_at', null); st.reload(); };
  return (
    <Screen onRefresh={st.refresh} refreshing={st.refreshing}>
      <Header eyebrow="Inbox" title="Notifications" back={true} />
      <Btn title="Mark all as read" variant="ghost" onPress={readAll} />
      <Async state={st} empty="You are all caught up.">{(rows) => <>{rows.map((n: any) => (
        <Card key={n.id} accent={!n.read_at} onPress={() => !n.read_at && read(n.id)}><H3>{n.title}</H3>{!!n.body && <P>{n.body}</P>}<Muted>{fmtDT(n.created_at)}</Muted></Card>))}</>}</Async>
    </Screen>
  );
}
