import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card, Header, Muted, Screen, Row } from '@/components/ui';
import { FAQS } from '@/lib/content';
import { colors, fonts } from '@/theme';

export default function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <Screen>
      <Header eyebrow="FAQ" title="Questions, answered" />
      {FAQS.map((f, i) => (
        <Card key={f.q} onPress={() => setOpen(open === i ? null : i)} style={{ gap: 8 }}>
          <Row style={{ justifyContent: 'space-between' }}><Text style={{ flex: 1, color: colors.fg, fontFamily: fonts.headingBold, fontSize: 15 }}>{f.q}</Text><Ionicons name={open === i ? 'remove' : 'add'} size={22} color={colors.accent} /></Row>
          {open === i && <Muted>{f.a}</Muted>}
        </Card>
      ))}
    </Screen>
  );
}
