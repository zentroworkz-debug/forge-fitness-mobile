import React from 'react';
import { Linking } from 'react-native';
import { Async, Card, H3, Header, Muted, P, Screen } from '@/components/ui';
import { useAsync } from '@/hooks/useAsync';
import { q, supabase } from '@/lib/supabase';
import { fmtDT } from '@/lib/format';

export default function Enquiries() {
  const st = useAsync(() => q(supabase.from('contact_enquiries').select('id,name,email,phone,message,created_at').order('created_at', { ascending: false }).limit(100)) as Promise<any[]>, []);
  return (
    <Screen onRefresh={st.refresh} refreshing={st.refreshing}>
      <Header eyebrow="Admin" title="Enquiries" back="/manage/more" />
      <Async state={st} empty="No enquiries yet.">{(rows) => <>{rows.map((e: any) => (
        <Card key={e.id} style={{ gap: 4 }}><H3>{e.name}</H3><P>{e.message}</P>
          <Muted onPress={() => Linking.openURL(`mailto:${e.email}`)}>{e.email}</Muted>{!!e.phone && <Muted onPress={() => Linking.openURL(`tel:${e.phone}`)}>{e.phone}</Muted>}<Muted>{fmtDT(e.created_at)}</Muted></Card>))}</>}</Async>
    </Screen>
  );
}
