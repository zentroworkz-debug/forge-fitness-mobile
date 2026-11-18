import React from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import { Btn, Card, H2, Muted, P, Photo, Screen } from '@/components/ui';
import { PROGRAMS } from '@/lib/content';

export default function ProgramDetail() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const p = PROGRAMS.find((x) => x.slug === slug);
  if (!p) return <Screen edges={[]}><Muted>Program not found.</Muted></Screen>;
  return (
    <Screen edges={[]}>
      <Photo source={p.image} height={220} />
      <H2>{p.name}</H2>
      <Muted>{p.category} · {p.level} · {p.duration}</Muted>
      <P>{p.summary}</P>
      <Card><Muted>Benefits</Muted><P>{p.benefits}</P></Card>
      <Btn title="Enquire about this program" onPress={() => router.push({ pathname: '/guest/contact', params: { topic: `${p.name} program` } })} />
    </Screen>
  );
}
