import React, { useCallback, useEffect, useState } from 'react';
import { AppState, Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth, Role } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { colors, fonts } from '@/theme';

function useUnread(userId?: string) {
  const [n, setN] = useState(0);
  const load = useCallback(async () => {
    if (!userId) return;
    const { count } = await supabase.from('notifications').select('id', { count: 'exact', head: true }).eq('user_id', userId).is('read_at', null);
    setN(count ?? 0);
  }, [userId]);
  useEffect(() => {
    load();
    const t = setInterval(load, 30000);
    const sub = AppState.addEventListener('change', (s) => s === 'active' && load());
    return () => { clearInterval(t); sub.remove(); };
  }, [load]);
  return n;
}

const Round = ({ icon, label, onPress, badge }: { icon: any; label: string; onPress: () => void; badge?: number }) => (
  <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={badge ? `${label}, ${badge} unread` : label} hitSlop={6}
    style={({ pressed }) => ({ width: 42, height: 42, borderRadius: 21, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.bg2, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.8 : 1 })}>
    <Ionicons name={icon} size={21} color={colors.fg} />
    {!!badge && <View style={{ position: 'absolute', top: -3, right: -3, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 }}>
      <Text style={{ color: colors.onAccent, fontFamily: fonts.headingBold, fontSize: 10 }}>{badge > 9 ? '9+' : badge}</Text></View>}
  </Pressable>
);

// Top-right: two separate round buttons. Scanner only for members (they are the ones who check in).
export function HeaderActions({ role }: { role: Role }) {
  const { user } = useAuth();
  const unread = useUnread(user?.id);
  const base = role === 'client' ? '/member' : role === 'trainer' ? '/coach' : '/manage';
  return (
    <View style={{ flexDirection: 'row', gap: 10, paddingRight: 16 }}>
      {role === 'client' && <Round icon="qr-code-outline" label="Scanner" onPress={() => router.push({ pathname: '/member/scan', params: { auto: '1' } } as any)} />}
      <Round icon="notifications-outline" label="Notifications" badge={unread} onPress={() => router.push(`${base}/notifications` as any)} />
    </View>
  );
}
