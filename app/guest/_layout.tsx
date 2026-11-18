import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts } from '@/theme';

export const tabOptions = {
  headerShown: false,
  tabBarActiveTintColor: colors.accent,
  tabBarInactiveTintColor: colors.muted,
  tabBarStyle: { backgroundColor: colors.bg, borderTopColor: colors.border, height: 62, paddingBottom: 6, paddingTop: 6 },
  tabBarLabelStyle: { fontFamily: fonts.bodySemi, fontSize: 11 },
} as const;
const icon = (n: any) => ({ color, size }: any) => <Ionicons name={n} size={size} color={color} />;
const hidden = { href: null } as const;

export default function PublicTabs() {
  return (
    <Tabs screenOptions={tabOptions}>
      <Tabs.Screen name="home" options={{ title: 'Home', tabBarIcon: icon('home') }} />
      <Tabs.Screen name="programs" options={{ title: 'Programs', tabBarIcon: icon('barbell') }} />
      <Tabs.Screen name="trainers" options={{ title: 'Trainers', tabBarIcon: icon('people') }} />
      <Tabs.Screen name="plans" options={{ title: 'Plans', tabBarIcon: icon('pricetag') }} />
      <Tabs.Screen name="more" options={{ title: 'More', tabBarIcon: icon('menu') }} />
      {['about', 'facilities', 'schedule', 'gallery', 'reviews', 'calculator', 'faq', 'contact', 'trial'].map((n) => <Tabs.Screen key={n} name={n} options={hidden} />)}
    </Tabs>
  );
}
