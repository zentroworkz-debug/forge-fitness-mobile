import React from 'react';
import { Text, View } from 'react-native';
import { Async, Card, Empty, H3, Header, Muted, Row, Screen } from '@/components/ui';
import { useAsync } from '@/hooks/useAsync';
import { useAuth } from '@/contexts/AuthContext';
import { q, supabase } from '@/lib/supabase';
import { fmtDT } from '@/lib/format';
import { colors, fonts, space } from '@/theme';

export default function TrainerHandovers() {
  const { user } = useAuth();

  const st = useAsync(async () => {
    const res = await q(supabase.from('trainer_handover_reports')
      .select('id,submitted_at,acknowledged_at,report,client:profiles!trainer_handover_reports_client_id_fkey(full_name),from:profiles!trainer_handover_reports_from_trainer_fkey(full_name),to:profiles!trainer_handover_reports_to_trainer_fkey(full_name)')
      .or(`from_trainer.eq.${user!.id},to_trainer.eq.${user!.id}`)
      .order('submitted_at', { ascending: false }));
    return (res as any[]) || [];
  }, [user?.id]);

  return (
    <Screen onRefresh={st.refresh} refreshing={st.refreshing}>
      <Header eyebrow="Trainer" title="Client Handovers" back="/coach/more" />

      <Async state={st} empty="No handover reports recorded.">{(handovers) => (
        <View style={{ gap: space.md }}>
          {handovers.map((h: any) => {
            const isOutgoing = h.from?.full_name === user?.id;
            return (
              <Card key={h.id}>
                <Row style={{ justifyContent: 'space-between' }}>
                  <Text style={{ color: colors.fg, fontFamily: fonts.headingBold, fontSize: 16 }}>{h.client?.full_name ?? 'Client'}</Text>
                  <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, backgroundColor: h.acknowledged_at ? colors.accent : colors.warn }}>
                    <Text style={{ color: h.acknowledged_at ? colors.onAccent : colors.fg, fontSize: 11, fontFamily: fonts.bodySemi }}>
                      {h.acknowledged_at ? 'Completed' : 'Pending'}
                    </Text>
                  </View>
                </Row>
                <Muted>From: {h.from?.full_name ?? 'Trainer'} → To: {h.to?.full_name ?? 'Trainer'}</Muted>
                <Muted>Submitted: {fmtDT(h.submitted_at)}</Muted>
                {!!h.report?.recommendations && (
                  <View style={{ marginTop: space.sm, padding: space.sm, backgroundColor: colors.bg, borderRadius: 8 }}>
                    <Text style={{ color: colors.fg, fontFamily: fonts.body, fontSize: 13 }}>{h.report.recommendations}</Text>
                  </View>
                )}
              </Card>
            );
          })}
        </View>
      )}</Async>
    </Screen>
  );
}
