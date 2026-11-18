import React from 'react';
import { PortalTabs } from '@/components/PortalTabs';

export default function ClientLayout() {
  return <PortalTabs role="client" tabs={[
    { name: 'home', title: 'Home', icon: 'home' },
    { name: 'workout', title: 'Workout', icon: 'barbell' },
    { name: 'diet', title: 'Diet', icon: 'nutrition' },
    { name: 'trackers', title: 'Trackers', icon: 'pulse' },
    { name: 'more', title: 'More', icon: 'menu' },
    { name: 'scan', title: 'Scanner', icon: 'qr-code', hidden: true },
    { name: 'calendar', title: 'Calendar', icon: 'calendar', hidden: true },
    { name: 'progress', title: 'Progress', icon: 'trending-up', hidden: true },
    { name: 'reports', title: 'Reports', icon: 'document-text', hidden: true },
    { name: 'membership', title: 'Membership', icon: 'card', hidden: true },
    { name: 'trainer', title: 'Trainer', icon: 'person', hidden: true },
    { name: 'notifications', title: 'Alerts', icon: 'notifications', hidden: true },
    { name: 'profile', title: 'Profile', icon: 'person-circle', hidden: true },
    { name: 'settings', title: 'Settings', icon: 'settings', hidden: true },
  ]} />;
}
