import React from 'react';
import { Image } from 'react-native';
import { HeaderActions } from '@/components/HeaderActions';
import { PortalHeaderContext } from '@/components/ui';
import { Redirect, Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth, Role } from '@/contexts/AuthContext';
import { colors, fonts } from '@/theme';

export type TabDef = { name: string; title: string; icon: string; hidden?: boolean };

// Role gate on the client side is only UX; RLS and DB functions are what actually protect data.
export function PortalTabs({ role, tabs }: { role: Role; tabs: TabDef[] }) {
  const { session, profile, role: myRole, loading } = useAuth();
  if (loading) return null;
  if (!session) return <Redirect href="/(auth)/login" />;
  if (profile?.approval_status !== 'approved' || !myRole) return <Redirect href="/(auth)/pending" />;
  if (myRole !== role) return <Redirect href="/" />;
  return (
    <PortalHeaderContext.Provider value={true}>
    <Tabs
      backBehavior="history"
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: colors.bg, borderBottomColor: colors.border, borderBottomWidth: 1, shadowOpacity: 0, elevation: 0 },
        headerTitleAlign: 'left',
        headerTitle: () => <Image source={require('../assets/images/logo.png')} style={{ width: 138, height: 22 }} resizeMode="contain" accessibilityLabel="FORGE FITNESS" />,
        headerRight: () => <HeaderActions role={role} />,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: { backgroundColor: colors.bg, borderTopColor: colors.border, height: 62, paddingBottom: 6, paddingTop: 6 },
        tabBarLabelStyle: { fontFamily: fonts.bodySemi, fontSize: 11 }
      }}>
      {tabs.map((t) => t.hidden
        ? <Tabs.Screen key={t.name} name={t.name} options={{ title: t.title, tabBarButton: () => null, tabBarItemStyle: { display: 'none' } }} />
        : <Tabs.Screen key={t.name} name={t.name} options={{ title: t.title, tabBarIcon: ({ color, size }) => <Ionicons name={t.icon as any} size={size} color={color as any} /> }} />)}
    </Tabs>
    </PortalHeaderContext.Provider>
  );
}
