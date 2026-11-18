import React from 'react';
import { PortalTabs } from '@/components/PortalTabs';

export default function TrainerLayout() {
  return <PortalTabs role="trainer" tabs={[
    { name: 'home', title: 'Home', icon: 'home' },
    { name: 'clients', title: 'Clients', icon: 'people' },
    { name: 'requests', title: 'Requests', icon: 'mail-unread' },
    { name: 'qr', title: 'QR', icon: 'qr-code' },
    { name: 'more', title: 'More', icon: 'menu' },
    { name: 'attendance', title: 'Attendance', icon: 'time', hidden: true },
    { name: 'workouts', title: 'Workouts', icon: 'barbell', hidden: true },
    { name: 'nutrition', title: 'Nutrition', icon: 'nutrition', hidden: true },
    { name: 'targets', title: 'Targets', icon: 'flame', hidden: true },
    { name: 'calendar', title: 'Calendar', icon: 'calendar', hidden: true },
    { name: 'handovers', title: 'Handovers', icon: 'swap-horizontal', hidden: true },
    { name: 'reports', title: 'Reports', icon: 'stats-chart', hidden: true },
    { name: 'notifications', title: 'Alerts', icon: 'notifications', hidden: true },
    { name: 'profile', title: 'Profile', icon: 'person-circle', hidden: true },
    { name: 'settings', title: 'Settings', icon: 'settings', hidden: true },
  ]} />;
}
