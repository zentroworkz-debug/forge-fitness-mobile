import React from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Btn, Card, H3, Header, Muted, Row, Screen } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { colors, fonts, space } from '@/theme';

export default function AdminProfile() {
  const { user, profile } = useAuth();

  const Item = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <Row style={{ justifyContent: 'space-between', paddingVertical: 4 }}>
      <Muted>{label}</Muted>
      <Text style={{ color: colors.fg, fontFamily: fonts.bodySemi, fontSize: 15 }}>{value ?? '—'}</Text>
    </Row>
  );

  return (
    <Screen>
      <Header eyebrow="Account" title="Admin Profile" back="/manage/more" />

      <Card style={{ gap: space.md, alignItems: 'center', paddingVertical: space.xl }}>
        <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: colors.onAccent, fontFamily: fonts.heading, fontSize: 32 }}>
            {profile?.full_name?.charAt(0).toUpperCase() ?? 'A'}
          </Text>
        </View>
        <View style={{ alignItems: 'center' }}>
          <H3>{profile?.full_name}</H3>
          <Muted>{user?.email}</Muted>
        </View>
        <View style={{ paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, backgroundColor: colors.accent }}>
          <Text style={{ color: colors.onAccent, fontFamily: fonts.bodySemi, fontSize: 12 }}>Administrator</Text>
        </View>
      </Card>

      <Card style={{ gap: space.sm }}>
        <H3>Account Details</H3>
        <Item label="Full name" value={profile?.full_name} />
        <Item label="Email" value={user?.email} />
        <Item label="Phone" value={profile?.phone} />
        <Item label="Role" value="Gym Administrator" />
      </Card>

      <Btn title="Edit Profile & Password" variant="ghost" onPress={() => router.push('/manage/settings')} icon={<Ionicons name="settings-outline" size={18} color={colors.fg} />} />
    </Screen>
  );
}
