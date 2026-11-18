import React from 'react';
import { PortalMore } from '@/components/PortalMore';

export default function AdminMore() {
  return (
    <PortalMore
      base="/manage"
      items={[
        ['plans', 'Membership Plans', 'pricetag'],
        ['payments', 'Payments & Revenue', 'cash'],
        ['exercises', 'Exercise Library', 'barbell'],
        ['foods', 'Food Database', 'nutrition'],
        ['attendance', 'Gym Attendance', 'time'],
        ['qr', 'Attendance QR Codes', 'qr-code'],
        ['handovers', 'Trainer Handovers', 'swap-horizontal'],
        ['calendar', 'Calendar & Events', 'calendar'],
        ['reports', 'Business Reports', 'stats-chart'],
        ['enquiries', 'Public Enquiries', 'mail'],
        ['notifications', 'Alerts & Notifications', 'notifications'],
        ['profile', 'Admin Profile', 'person-circle'],
        ['settings', 'Account Settings', 'settings'],
      ]}
    />
  );
}
