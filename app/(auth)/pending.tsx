import React from 'react';
import { Redirect, router } from 'expo-router';
import { Btn, Banner, Header, Muted, Screen } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';

// Shown instead of any dashboard until an admin approves the account (enforced by RLS too).
export default function Pending() {
  const { session, profile, role, loading, refresh, signOut } = useAuth();
  if (!loading && !session) return <Redirect href="/(auth)/login" />;
  if (profile?.approval_status === 'approved' && role) return <Redirect href="/" />;
  const rejected = profile?.approval_status === 'rejected';
  return (
    <Screen>
      <Header eyebrow="Account status" title={rejected ? 'Application not approved' : 'Waiting for approval'} />
      {rejected
        ? <Banner kind="error">{profile?.rejection_reason || 'Your application was not approved. Please contact the gym.'}</Banner>
        : <Banner kind="info">Your account is pending review by the gym. You will get a notification once it is approved. You can pull down or tap below to check again.</Banner>}
      {!profile && <Muted>No profile found for this account yet. If you just verified your email, tap Check again.</Muted>}
      <Btn title="Check again" onPress={refresh} />
      <Btn title="Log out" variant="ghost" onPress={async () => { await signOut(); router.replace('/(auth)/login'); }} />
    </Screen>
  );
}
