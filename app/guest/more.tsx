import React from 'react';
import { Text } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Card, Header, Row, Screen, Muted } from '@/components/ui';
import { colors, fonts } from '@/theme';
import { useAuth } from '@/contexts/AuthContext';

const ITEMS: [string, string, string][] = [
  ['about', 'About us', 'information-circle'], ['facilities', 'Facilities', 'business'], ['schedule', 'Class schedule', 'calendar'],
  ['gallery', 'Gallery', 'images'], ['reviews', 'Testimonials', 'star'], ['calculator', 'Fitness calculator', 'calculator'],
  ['faq', 'FAQ', 'help-circle'], ['contact', 'Contact us', 'mail'], ['trial', 'Book a free trial', 'flash'],
];
export default function More() {
  const { session } = useAuth();
  return (
    <Screen>
      <Header eyebrow="FORGE FITNESS" title="More" />
      {ITEMS.map(([r, l, i]) => (
        <Card key={r} onPress={() => router.push(`/guest/${r}` as any)}>
          <Row><Ionicons name={i as any} size={22} color={colors.accent} /><Text style={{ fontFamily: fonts.bodySemi, fontSize: 17, color: colors.fg, flex: 1 }}>{l}</Text><Ionicons name="chevron-forward" size={18} color={colors.muted} /></Row>
        </Card>
      ))}
      <Card onPress={() => router.push(session ? '/' : '/(auth)/login')} accent><Row><Ionicons name="person-circle" size={22} color={colors.accent} /><Text style={{ fontFamily: fonts.bodySemi, fontSize: 17, color: colors.fg }}>{session ? 'Open my portal' : 'Member login'}</Text></Row></Card>
      <Muted style={{ textAlign: 'center' }}>FORGE FITNESS</Muted>
    </Screen>
  );
}
