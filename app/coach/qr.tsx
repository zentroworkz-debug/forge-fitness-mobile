import React, { useState } from 'react';
import { View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Banner, Btn, Card, Chip, H3, Header, Muted, P, Row, Screen, Skeleton } from '@/components/ui';
import { useAsync } from '@/hooks/useAsync';
import { supabase } from '@/lib/supabase';
import { fmtDT } from '@/lib/format';
import { space } from '@/theme';

type Code = { text: string; expires_at?: string; kind: string };
// Codes are issued by the server (Edge Function qr-token, or the issue_qr_token RPC). One trainer, one day, one type.
async function getCode(kind: 'in' | 'out', rotate: boolean): Promise<Code> {
  try {
    const { data, error } = await supabase.functions.invoke('qr-token', { body: { kind, rotate } });
    if (!error && data?.token) return { text: data.code_text || data.token, expires_at: data.expires_at, kind };
  } catch { /* fall through to RPC */ }
  const { data, error } = await supabase.rpc(rotate ? 'rotate_qr_token' : 'issue_qr_token', { p_kind: kind });
  if (error) throw error;
  const t = (data as any[])?.[0]; if (!t) throw new Error('No QR code returned by the server.');
  return { text: t.code_text, expires_at: t.expires_at, kind };
}

export default function TrainerQr() {
  const [kind, setKind] = useState<'in' | 'out'>('in'); const [rot, setRot] = useState(0);
  const st = useAsync(() => getCode(kind, rot > 0), [kind, rot]);
  return (
    <Screen onRefresh={st.refresh} refreshing={st.refreshing}>
      <Header eyebrow="Trainer" title="Attendance QR" back={true} />
      <Row><Chip label="CHECK IN" active={kind === 'in'} onPress={() => { setRot(0); setKind('in'); }} /><Chip label="CHECK OUT" active={kind === 'out'} onPress={() => { setRot(0); setKind('out'); }} /></Row>
      {st.loading ? <Skeleton h={300} /> : st.error ? <Banner kind="error">{st.error}</Banner> : st.data && (
        <Card style={{ alignItems: 'center', gap: space.md, paddingVertical: space.xl }}>
          <View style={{ backgroundColor: '#ffffff', padding: 12, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }}>
            <QRCode
              value={st.data.text}
              size={200}
              logo={require('../../assets/icon.png')}
              logoSize={42}
              logoBackgroundColor="#ffffff"
              logoMargin={3}
              logoBorderRadius={8}
            />
          </View>
          <H3 style={{ letterSpacing: 2 }}>{st.data.text}</H3>
          <Muted style={{ textAlign: 'center' }}>Valid until {fmtDT(st.data.expires_at)} · a {kind === 'in' ? 'check-in' : 'check-out'} code can only {kind === 'in' ? 'check in' : 'check out'}.</Muted>
        </Card>
      )}
      <Btn title="Regenerate (invalidates the old code)" variant="ghost" onPress={() => setRot((n) => n + 1)} />
      <P>Clients type the 8-character code if their camera fails.</P>
    </Screen>
  );
}
