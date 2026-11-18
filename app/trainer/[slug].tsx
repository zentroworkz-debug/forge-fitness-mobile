import React from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import { Btn, Card, H2, Muted, P, Photo, Screen } from '@/components/ui';
import { SCHEDULE, TRAINERS } from '@/lib/content';

export default function TrainerDetail() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const t = TRAINERS.find((x) => x.slug === slug);
  if (!t) return <Screen edges={[]}><Muted>Trainer not found.</Muted></Screen>;
  const classes = SCHEDULE.filter((s) => s.trainer === t.name);
  return (
    <Screen edges={[]}>
      <Photo source={t.image} height={280} />
      <H2>{t.name}</H2>
      <Muted>{t.specialty} · {t.experience}</Muted>
      <P>{t.bio}</P>
      <Card><Muted>Certifications</Muted><P>{t.certs}</P></Card>
      <Card><Muted>Classes</Muted>{classes.map((c, i) => <P key={i}>{c.day} {c.time} · {c.name}</P>)}</Card>
      <Btn title="Book a free trial" onPress={() => router.push('/guest/trial')} />
    </Screen>
  );
}
