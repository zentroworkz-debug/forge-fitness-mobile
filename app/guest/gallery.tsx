import React, { useMemo, useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Chip, Chips, Header, Screen, Photo } from '@/components/ui';
import { GALLERY } from '@/lib/content';
import { colors, fonts, space } from '@/theme';

const CATS = ['All', ...Array.from(new Set(GALLERY.map((g) => g.category)))];
export default function Gallery() {
  const [cat, setCat] = useState('All');
  const [idx, setIdx] = useState<number | null>(null);
  const items = useMemo(() => GALLERY.filter((g) => cat === 'All' || g.category === cat), [cat]);
  const go = (d: number) => setIdx((i) => (i === null ? i : (i + d + items.length) % items.length));
  return (
    <Screen>
      <Header eyebrow="Gallery" title="Life at FORGE" />
      <Chips>{CATS.map((c) => <Chip key={c} label={c} active={c === cat} onPress={() => setCat(c)} />)}</Chips>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
        {items.map((g, i) => (
          <Pressable key={g.slug} style={{ width: '48.5%' }} onPress={() => setIdx(i)} accessibilityRole="imagebutton" accessibilityLabel={`Preview ${g.label}`}>
            <Photo source={g.image} height={130} />
          </Pressable>
        ))}
      </View>
      <Modal visible={idx !== null} transparent animationType="fade" onRequestClose={() => setIdx(null)}>
        <View style={{ flex: 1, backgroundColor: '#000e', justifyContent: 'center' }}>
          {idx !== null && items[idx] && <><Image source={items[idx].image} style={{ width: '100%', height: '65%' }} contentFit="contain" /><Text style={{ textAlign: 'center', color: colors.fg, fontFamily: fonts.headingBold, marginTop: space.md }}>{items[idx].label}</Text></>}
          <Pressable onPress={() => go(-1)} accessibilityLabel="Previous image" style={{ position: 'absolute', left: 8, top: '45%', padding: 14 }}><Ionicons name="chevron-back" size={34} color={colors.fg} /></Pressable>
          <Pressable onPress={() => go(1)} accessibilityLabel="Next image" style={{ position: 'absolute', right: 8, top: '45%', padding: 14 }}><Ionicons name="chevron-forward" size={34} color={colors.fg} /></Pressable>
          <Pressable onPress={() => setIdx(null)} accessibilityLabel="Close" style={{ position: 'absolute', right: 16, top: 56, padding: 10 }}><Ionicons name="close" size={30} color={colors.fg} /></Pressable>
        </View>
      </Modal>
    </Screen>
  );
}
