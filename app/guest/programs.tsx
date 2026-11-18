import React, { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Card, Chip, Chips, H3, Header, Muted, Photo, Screen, Row } from '@/components/ui';
import { PROGRAMS } from '@/lib/content';
import { space } from '@/theme';

const CATS = ['All', ...Array.from(new Set(PROGRAMS.map((p) => p.category)))];
export default function Programs() {
  const [cat, setCat] = useState('All');
  return (
    <Screen>
      <Header eyebrow="Fitness programs" title="Train your way" />
      <Muted>Nine programs, one standard of coaching.</Muted>
      <Chips>{CATS.map((c) => <Chip key={c} label={c} active={c === cat} onPress={() => setCat(c)} />)}</Chips>
      {PROGRAMS.filter((p) => cat === 'All' || p.category === cat).map((p) => (
        <Card key={p.slug} onPress={() => router.push({ pathname: '/program/[slug]', params: { slug: p.slug } })} style={{ padding: 0, overflow: 'hidden' }}>
          <Photo source={p.image} height={150} radiusPx={0} />
          <View style={{ padding: space.lg, gap: 6 }}>
            <Row style={{ gap: space.sm }}><Muted>{p.level}</Muted><Muted>·</Muted><Muted>{p.duration}</Muted></Row>
            <H3>{p.name}</H3>
            <Muted>{p.summary}</Muted>
          </View>
        </Card>
      ))}
    </Screen>
  );
}
