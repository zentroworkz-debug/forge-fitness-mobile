import React, { useState } from 'react';
import { Alert, Modal, Pressable, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Ionicons } from '@expo/vector-icons';
import { Async, Btn, Card, Empty, Header, H3, Muted, Row, Screen, useToast } from '@/components/ui';
import { useAsync } from '@/hooks/useAsync';
import { niceError, q, supabase } from '@/lib/supabase';
import { fmtD, fmtDT } from '@/lib/format';
import { colors, fonts, radius, space } from '@/theme';

export default function AdminQr() {
  const toast = useToast();
  const [selectedToken, setSelectedToken] = useState<any>(null);

  const st = useAsync(async () => {
    const res = await q(supabase.from('qr_attendance_tokens')
      .select('id,trainer_id,gym_date,kind,code_text,expires_at,created_at,trainer:profiles!qr_attendance_tokens_trainer_id_fkey(full_name)')
      .order('created_at', { ascending: false })
      .limit(50));
    return (res as any[]) || [];
  }, []);

  const invalidate = (id: string) => {
    Alert.alert('Invalidate QR Code?', 'Clients will not be able to scan this code anymore. The trainer will need to generate a new one.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Invalidate',
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.from('qr_attendance_tokens').delete().eq('id', id);
          if (error) toast.show('error', niceError(error));
          else {
            toast.show('success', 'QR code invalidated!');
            if (selectedToken?.id === id) setSelectedToken(null);
            st.reload();
          }
        },
      },
    ]);
  };

  return (
    <Screen onRefresh={st.refresh} refreshing={st.refreshing}>
      <Header eyebrow="Admin" title="Attendance QR Codes" back="/manage/more" />
      {toast.node}

      <Muted>Each trainer gets dynamic check-in and check-out codes per day. Invalidate leaked codes or preview QR codes here.</Muted>

      <Async state={st} empty="No attendance tokens issued recently.">{(tokens) => (
        <View style={{ gap: space.md }}>
          {tokens.map((t: any) => {
            const isLive = new Date(t.expires_at) > new Date();
            return (
              <Card key={t.id} accent={isLive} style={{ gap: space.sm }}>
                <Row style={{ justifyContent: 'space-between' }}>
                  <Text style={{ color: colors.fg, fontFamily: fonts.headingBold, fontSize: 16 }}>{t.trainer?.full_name ?? 'Trainer'}</Text>
                  <View style={{ backgroundColor: isLive ? colors.accent : colors.border, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }}>
                    <Text style={{ color: isLive ? colors.onAccent : colors.muted, fontSize: 11, fontFamily: fonts.bodySemi, textTransform: 'uppercase' }}>
                      {isLive ? 'ACTIVE' : 'EXPIRED'}
                    </Text>
                  </View>
                </Row>
                <Muted>Type: {t.kind === 'in' ? 'Check-in' : 'Check-out'} · Date: {fmtD(t.gym_date)}</Muted>
                {t.code_text && (
                  <Text style={{ color: colors.accent, fontFamily: fonts.headingBold, fontSize: 16, letterSpacing: 2 }}>Code: {t.code_text}</Text>
                )}
                <Muted>Expires: {fmtDT(t.expires_at)}</Muted>

                {isLive && (
                  <Row style={{ marginTop: space.sm }}>
                    <Btn
                      title="View QR"
                      variant="ghost"
                      icon={<Ionicons name="qr-code" size={18} color={colors.accent} />}
                      onPress={() => setSelectedToken(t)}
                      style={{ flex: 1 }}
                    />
                    <Btn
                      title="Invalidate"
                      variant="danger"
                      onPress={() => invalidate(t.id)}
                      style={{ flex: 1 }}
                    />
                  </Row>
                )}
              </Card>
            );
          })}
        </View>
      )}</Async>

      {/* QR Modal with Forge Fitness Logo in center */}
      <Modal visible={!!selectedToken} transparent animationType="fade" onRequestClose={() => setSelectedToken(null)}>
        <Pressable onPress={() => setSelectedToken(null)} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: space.lg }}>
          <Pressable onPress={(e) => e.stopPropagation()} style={{ backgroundColor: colors.bg2, borderRadius: radius.lg, padding: space.xl, alignItems: 'center', gap: space.md, borderWidth: 1, borderColor: colors.border, width: '100%', maxWidth: 340 }}>
            <Text style={{ color: colors.fg, fontFamily: fonts.headingBold, fontSize: 18 }}>{selectedToken?.trainer?.full_name ?? 'Trainer'} QR</Text>
            <Muted>{selectedToken?.kind === 'in' ? 'Check-In Code' : 'Check-Out Code'}</Muted>

            <View style={{ backgroundColor: '#ffffff', padding: 12, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }}>
              {selectedToken?.code_text && (
                <QRCode
                  value={selectedToken.code_text}
                  size={200}
                  logo={require('../../assets/icon.png')}
                  logoSize={40}
                  logoBackgroundColor="#ffffff"
                  logoMargin={3}
                  logoBorderRadius={8}
                />
              )}
            </View>

            <Text style={{ color: colors.accent, fontFamily: fonts.headingBold, fontSize: 24, letterSpacing: 3 }}>
              {selectedToken?.code_text}
            </Text>
            <Muted>Expires at {selectedToken ? fmtDT(selectedToken.expires_at) : ''}</Muted>

            <Btn title="Close" variant="ghost" onPress={() => setSelectedToken(null)} style={{ alignSelf: 'stretch' }} />
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>
  );
}
