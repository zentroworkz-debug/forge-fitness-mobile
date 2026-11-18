import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { colors } from '@/theme';

// Single entry decision: guests -> public app; signed-in users -> approval gate -> role area.
export default function Index() {
  const { session, profile, role, loading } = useAuth();
  if (loading) return <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center' }}><ActivityIndicator color={colors.accent} /></View>;
  if (!session) return <Redirect href="/(auth)/login" />;
  if (!profile || profile.approval_status !== 'approved' || !role) return <Redirect href="/(auth)/pending" />;
  return <Redirect href={role === "admin" ? "/manage/home" : role === "trainer" ? "/coach/home" : "/member/home"} />;
}
