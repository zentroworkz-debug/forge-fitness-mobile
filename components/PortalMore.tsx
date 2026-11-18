import React from 'react';
import { Text } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Btn, Card, Header, Muted, Row, Screen } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { colors, fonts } from '@/theme';

export const PortalMore = ({ base, items }: { base: string; items: [string, string, string][] }) => {
  const { profile, user, signOut } = useAuth();
  return (
    <Screen>
      <Header eyebrow={profile?.full_name ?? 'Account'} title="More" />
      <Muted>{user?.email}</Muted>
      {items.map(([r, l, i]) => (
        <Card key={r} onPress={() => router.push(`${base}/${r}` as any)}><Row><Ionicons name={i as any} size={22} color={colors.accent} /><Text style={{ flex: 1, fontFamily: fonts.bodySemi, fontSize: 17, color: colors.fg }}>{l}</Text><Ionicons name="chevron-forward" size={18} color={colors.muted} /></Row></Card>
      ))}
      <Btn title="Log out" variant="ghost" onPress={async () => { await signOut(); router.replace('/(auth)/login'); }} />
    </Screen>
  );
};
