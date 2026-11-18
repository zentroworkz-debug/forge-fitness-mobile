import React from 'react';
import { ImageBackground, Image as RNImage, Pressable, ScrollView, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Btn, Eyebrow, H2, Muted, P } from '@/components/ui';
import { GYM, IMG, PROGRAMS, TRAINERS } from '@/lib/content';
import { useAuth } from '@/contexts/AuthContext';
import { colors, fonts, radius, space } from '@/theme';

const QUICK: [string, string, string][] = [
  ['Programs', 'barbell', '/guest/programs'], ['Trainers', 'people', '/guest/trainers'], ['Plans', 'pricetag', '/guest/plans'],
  ['Schedule', 'calendar', '/guest/schedule'], ['Gallery', 'images', '/guest/gallery'], ['Calculator', 'calculator', '/guest/calculator'],
];

const Section = ({ title, action, onAction, children }: { title: string; action?: string; onAction?: () => void; children: React.ReactNode }) => (
  <View style={{ gap: space.md }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space.lg }}>
      <H2 style={{ fontSize: 20 }}>{title}</H2>
      {!!action && <Pressable onPress={onAction} accessibilityRole="link" hitSlop={8}><Text style={{ color: colors.accent, fontFamily: fonts.bodySemi, fontSize: 15 }}>{action}</Text></Pressable>}
    </View>
    {children}
  </View>
);

export default function Home() {
  const { session } = useAuth();
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: space.xxl * 2 }} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <ImageBackground source={IMG['g-main-floor']} style={{ minHeight: 520 }} imageStyle={{ opacity: 0.9 }}>
          <View style={{ flex: 1, backgroundColor: 'rgba(17,18,16,.55)' }}>
            <View style={{ flex: 1, backgroundColor: 'rgba(17,18,16,.35)' }}>
              <SafeAreaView edges={['top']} style={{ flex: 1, padding: space.lg, justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <RNImage source={require('../../assets/images/logo.png')} style={{ width: 150, height: 24 }} resizeMode="contain" accessibilityLabel="FORGE FITNESS" />
                  <Pressable onPress={() => router.push(session ? '/' : '/(auth)/login')} accessibilityRole="button" style={{ paddingHorizontal: 16, minHeight: 40, borderRadius: 20, borderWidth: 1, borderColor: colors.fg, justifyContent: 'center' }}>
                    <Text style={{ color: colors.fg, fontFamily: fonts.bodySemi, fontSize: 14 }}>{session ? 'My portal' : 'Log in'}</Text>
                  </Pressable>
                </View>
                <View style={{ gap: space.md, paddingBottom: space.md }}>
                  <Eyebrow>Premium gym & fitness centre</Eyebrow>
                  <Text accessibilityRole="header" style={{ color: colors.fg, fontFamily: fonts.heading, fontSize: 40, lineHeight: 44, letterSpacing: -0.5 }}>Build strength.{'\n'}<Text style={{ color: colors.accent }}>Define your limits.</Text></Text>
                  <P style={{ color: '#d9d4c8' }}>Train with purpose. Build discipline. Become stronger every day.</P>
                  <View style={{ flexDirection: 'row', gap: space.md }}>
                    <Btn title="Join now" onPress={() => router.push('/(auth)/register')} style={{ flex: 1 }} />
                    <Btn title="Free trial" variant="ghost" onPress={() => router.push('/guest/trial')} style={{ flex: 1, backgroundColor: 'rgba(17,18,16,.5)' }} />
                  </View>
                </View>
              </SafeAreaView>
            </View>
          </View>
        </ImageBackground>

        {/* Stats band */}
        <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderTopWidth: 1, borderColor: colors.border, backgroundColor: colors.bg2 }}>
          {GYM.stats.map(([v, l], i) => (
            <View key={l} style={{ flex: 1, paddingVertical: space.lg, alignItems: 'center', borderLeftWidth: i ? 1 : 0, borderLeftColor: colors.border }}>
              <Text adjustsFontSizeToFit numberOfLines={1} style={{ color: colors.accent, fontFamily: fonts.heading, fontSize: 17, paddingHorizontal: 4 }}>{v}</Text>
              <Text style={{ color: colors.muted, fontFamily: fonts.body, fontSize: 11, textAlign: 'center', paddingHorizontal: 4 }}>{l}</Text>
            </View>))}
        </View>

        <View style={{ gap: space.xl, paddingTop: space.xl }}>
          {/* Quick links */}
          <Section title="Explore">
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.md, paddingHorizontal: space.lg }}>
              {QUICK.map(([l, ic, to]) => (
                <Pressable key={l} onPress={() => router.push(to as any)} accessibilityRole="button" accessibilityLabel={l}
                  style={({ pressed }) => ({ width: '30.5%', aspectRatio: 1, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.bg2, alignItems: 'center', justifyContent: 'center', gap: 8, opacity: pressed ? 0.8 : 1 })}>
                  <Ionicons name={ic as any} size={28} color={colors.accent} />
                  <Text style={{ color: colors.fg, fontFamily: fonts.bodySemi, fontSize: 14 }}>{l}</Text>
                </Pressable>))}
            </View>
          </Section>

          {/* Programs carousel */}
          <Section title="Popular programs" action="See all" onAction={() => router.push('/guest/programs')}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.md, paddingHorizontal: space.lg }}>
              {PROGRAMS.slice(0, 6).map((p) => (
                <Pressable key={p.slug} onPress={() => router.push({ pathname: '/program/[slug]', params: { slug: p.slug } })} accessibilityRole="button" style={{ width: 240, borderRadius: radius.lg, overflow: 'hidden', borderWidth: 1, borderColor: colors.border, backgroundColor: colors.bg2 }}>
                  <Image source={p.image} style={{ height: 140, width: '100%' }} contentFit="cover" transition={150} />
                  <View style={{ padding: space.md, gap: 2 }}><Text style={{ color: colors.fg, fontFamily: fonts.headingBold, fontSize: 15 }} numberOfLines={1}>{p.name}</Text><Muted>{p.level} · {p.duration}</Muted></View>
                </Pressable>))}
            </ScrollView>
          </Section>

          {/* Trainers */}
          <Section title="Meet your coaches" action="All trainers" onAction={() => router.push('/guest/trainers')}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.md, paddingHorizontal: space.lg }}>
              {TRAINERS.map((t) => (
                <Pressable key={t.slug} onPress={() => router.push({ pathname: '/trainer/[slug]', params: { slug: t.slug } })} accessibilityRole="button" accessibilityLabel={t.name} style={{ width: 130, alignItems: 'center', gap: 8 }}>
                  <Image source={t.image} style={{ width: 110, height: 110, borderRadius: 55, borderWidth: 2, borderColor: colors.accent }} contentFit="cover" />
                  <Text style={{ color: colors.fg, fontFamily: fonts.bodySemi, fontSize: 14, textAlign: 'center' }} numberOfLines={1}>{t.name}</Text>
                  <Muted style={{ textAlign: 'center' }} numberOfLines={2}>{t.specialty}</Muted>
                </Pressable>))}
            </ScrollView>
          </Section>

          {/* CTA */}
          <View style={{ marginHorizontal: space.lg, padding: space.xl, gap: space.md, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.accent, backgroundColor: colors.bg2 }}>
            <H2>Your first session starts now</H2>
            <Muted>Book a free trial, meet a coach and see the floor. No commitment.</Muted>
            <Btn title="Book free trial" onPress={() => router.push('/guest/trial')} />
            <Muted style={{ textAlign: 'center' }}>{GYM.hours}</Muted>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
