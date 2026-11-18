import React from 'react';
import { PortalTabs } from '@/components/PortalTabs';

export default function AdminLayout() {
  return <PortalTabs role="admin" tabs={[
    { name: 'home', title: 'Overview', icon: 'speedometer' },
    { name: 'approvals', title: 'Approvals', icon: 'checkmark-done' },
    { name: 'people', title: 'People', icon: 'people' },
    { name: 'enquiries', title: 'Enquiries', icon: 'mail' },
    { name: 'more', title: 'More', icon: 'menu' },
    { name: 'plans', title: 'Plans', icon: 'pricetag', hidden: true },
    { name: 'payments', title: 'Payments', icon: 'cash', hidden: true },
    { name: 'exercises', title: 'Exercises', icon: 'barbell', hidden: true },
    { name: 'foods', title: 'Foods', icon: 'nutrition', hidden: true },
    { name: 'attendance', title: 'Attendance', icon: 'time', hidden: true },
    { name: 'qr', title: 'QR', icon: 'qr-code', hidden: true },
    { name: 'handovers', title: 'Handovers', icon: 'swap-horizontal', hidden: true },
    { name: 'calendar', title: 'Calendar', icon: 'calendar', hidden: true },
    { name: 'reports', title: 'Reports', icon: 'stats-chart', hidden: true },
    { name: 'notifications', title: 'Alerts', icon: 'notifications', hidden: true },
    { name: 'profile', title: 'Profile', icon: 'person-circle', hidden: true },
    { name: 'settings', title: 'Settings', icon: 'settings', hidden: true },
  ]} />;
}
