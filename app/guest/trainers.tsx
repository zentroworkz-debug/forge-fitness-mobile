import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Card, H3, Header, Muted, Photo, Screen, P } from '@/components/ui';
import { TRAINERS } from '@/lib/content';
import { space } from '@/theme';

export default function Trainers() {
  return (
    <Screen>
      <Header eyebrow="Coaches" title="Meet the team" />
      {TRAINERS.map((t) => (
        <Card key={t.slug} onPress={() => router.push({ pathname: '/trainer/[slug]', params: { slug: t.slug } })} style={{ padding: 0, overflow: 'hidden' }}>
          <Photo source={t.image} height={220} radiusPx={0} />
          <View style={{ padding: space.lg, gap: 4 }}><H3>{t.name}</H3><Muted>{t.specialty} · {t.experience}</Muted><P>“{t.quote}”</P></View>
        </Card>
      ))}
    </Screen>
  );
}
