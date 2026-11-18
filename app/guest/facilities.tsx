import React, { useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Btn, Card, Header, Photo, Screen } from '@/components/ui';
import { FACILITIES } from '@/lib/content';
import { colors, fonts, space } from '@/theme';

export default function Facilities() {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <Screen>
      <Header eyebrow="Facilities" title="The space" />
      {FACILITIES.map((f, i) => (
        <Pressable key={f.slug} onPress={() => setOpen(i)} accessibilityRole="imagebutton" accessibilityLabel={`View ${f.name}`}>
          <Photo source={f.image} height={170} />
          <Text style={{ position: 'absolute', left: space.md, bottom: space.md, fontFamily: fonts.headingBold, color: colors.fg, fontSize: 17, textShadowColor: '#000', textShadowRadius: 6 }}>{f.name}</Text>
        </Pressable>
      ))}
      <Card style={{ gap: space.md }}><Text style={{ color: colors.fg, fontFamily: fonts.bodyMedium }}>See the floor and meet a coach.</Text><Btn title="Book a free trial" onPress={() => router.push('/guest/trial')} /></Card>
      <Modal visible={open !== null} transparent animationType="fade" onRequestClose={() => setOpen(null)}>
        <Pressable style={{ flex: 1, backgroundColor: '#000d', justifyContent: 'center' }} onPress={() => setOpen(null)} accessibilityLabel="Close preview">
          {open !== null && <Image source={FACILITIES[open].image} style={{ width: '100%', height: '70%' }} contentFit="contain" />}
          {open !== null && <Text style={{ textAlign: 'center', color: colors.fg, fontFamily: fonts.headingBold, marginTop: space.md }}>{FACILITIES[open].name}</Text>}
        </Pressable>
      </Modal>
    </Screen>
  );
}
