import React from 'react';
import { PortalMore } from '@/components/PortalMore';

export default function TrainerMore() {
  return (
    <PortalMore
      base="/coach"
      items={[
        ['attendance', 'Attendance Monitor', 'time'],
        ['workouts', 'Workout Builder', 'barbell'],
        ['nutrition', 'Nutrition Planner', 'nutrition'],
        ['targets', 'Targets & Reminders', 'flame'],
        ['calendar', 'Sessions & Calendar', 'calendar'],
        ['handovers', 'Client Handovers', 'swap-horizontal'],
        ['reports', 'Client Reports', 'stats-chart'],
        ['notifications', 'Alerts & Notifications', 'notifications'],
        ['profile', 'Trainer Profile', 'person-circle'],
        ['settings', 'Account Settings', 'settings'],
      ]}
    />
  );
}
