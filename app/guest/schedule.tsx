import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { Card, Chip, Chips, H3, Header, Muted, Screen, Row, Empty } from '@/components/ui';
import { DAYS, SCHEDULE } from '@/lib/content';
import { colors, fonts } from '@/theme';

export default function Schedule() {
  const [day, setDay] = useState('All');
  const rows = SCHEDULE.filter((s) => day === 'All' || s.day === day);
  return (
    <Screen>
      <Header eyebrow="Schedule" title="Weekly classes" />
      <Chips>{['All', ...DAYS].map((d) => <Chip key={d} label={d} active={d === day} onPress={() => setDay(d)} />)}</Chips>
      {rows.length === 0 && <Empty text="No classes." />}
      {rows.map((s, i) => (
        <Card key={i}>
          <Row style={{ justifyContent: 'space-between' }}><H3>{s.name}</H3><Text style={{ color: colors.accent, fontFamily: fonts.bodySemi }}>{s.day} · {s.time}</Text></Row>
          <Muted>{s.trainer} · {s.level}</Muted>
        </Card>
      ))}
    </Screen>
  );
}
