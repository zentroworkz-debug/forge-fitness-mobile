import React from 'react';
import { Card, H2, Header, Muted, P, Photo, Screen } from '@/components/ui';
import { ABOUT, IMG } from '@/lib/content';

export default function About() {
  return (
    <Screen>
      <Header eyebrow="About us" title="Discipline is built here" />
      <Photo source={IMG['about']} height={200} />
      <P>{ABOUT.intro}</P>
      <Card><Muted>Mission</Muted><P>{ABOUT.mission}</P></Card>
      <Card><Muted>Vision</Muted><P>{ABOUT.vision}</P></Card>
      <Card><Muted>Training philosophy</Muted><P>{ABOUT.philosophy}</P></Card>
      <H2>Why FORGE</H2>
      {ABOUT.benefits.map((b) => <P key={b}>✓  {b}</P>)}
    </Screen>
  );
}
