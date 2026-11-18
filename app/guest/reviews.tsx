import React from 'react';
import { Text } from 'react-native';
import { Card, H3, Header, Muted, P, Screen, Row } from '@/components/ui';
import { REVIEWS } from '@/lib/content';
import { colors } from '@/theme';

export default function Reviews() {
  return (
    <Screen>
      <Header eyebrow="Testimonials" title="Member stories" />
      {REVIEWS.map((r) => (
        <Card key={r.name} style={{ gap: 6 }}>
          <Row style={{ justifyContent: 'space-between' }}><H3>{r.name}</H3><Text accessibilityLabel={`${r.stars} of 5 stars`} style={{ color: colors.accent, fontSize: 16 }}>{'★'.repeat(r.stars)}{'☆'.repeat(5 - r.stars)}</Text></Row>
          <Muted>Goal: {r.goal}</Muted>
          <P>{r.text}</P>
          <Muted>Fictional demo review</Muted>
        </Card>
      ))}
    </Screen>
  );
}
