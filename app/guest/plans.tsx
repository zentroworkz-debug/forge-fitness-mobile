import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { Btn, Card, Chip, Chips, H3, Header, Muted, P, Photo, Screen, Row } from '@/components/ui';
import { PLANS, planPrice } from '@/lib/content';
import { colors, fonts, space } from '@/theme';

const PERIODS = [['m', 'Monthly'], ['q', 'Quarterly (save 8%)'], ['a', 'Annual (save 20%)']] as const;
export default function Plans() {
  const [period, setPeriod] = useState<'m' | 'q' | 'a'>('m');
  return (
    <Screen>
      <Header eyebrow="Membership" title="Choose your plan" />
      <Chips>{PERIODS.map(([k, l]) => <Chip key={k} label={l} active={period === k} onPress={() => setPeriod(k)} />)}</Chips>
      {PLANS.map((p, i) => {
        const { amount, unit } = planPrice(p.monthly, period);
        return (
          <Card key={p.slug} accent={i === 1} style={{ gap: space.md }}>
            <Photo source={p.image} height={120} />
            <Row style={{ justifyContent: 'space-between' }}><H3>{p.name}</H3>{i === 1 && <Text style={{ color: colors.accent, fontFamily: fonts.bodySemi }}>POPULAR</Text>}</Row>
            <Text style={{ fontFamily: fonts.heading, fontSize: 28, color: colors.fg }}>₹{amount.toLocaleString('en-IN')} <Text style={{ fontSize: 14, color: colors.muted, fontFamily: fonts.body }}>{unit}</Text></Text>
            <View style={{ gap: 4 }}>{p.features.map((f) => <P key={f}>✓  {f}</P>)}</View>
            <Btn title={`Enquire about ${p.name}`} variant={i === 1 ? 'primary' : 'ghost'} onPress={() => router.push({ pathname: '/guest/contact', params: { topic: `${p.name} plan (${PERIODS.find((x) => x[0] === period)![1]})` } })} />
          </Card>
        );
      })}
      <Muted>Prices shown are sample values until confirmed by the gym. Signed-in members see their real plan under Membership.</Muted>
    </Screen>
  );
}
