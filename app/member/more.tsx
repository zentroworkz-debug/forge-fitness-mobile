import React from 'react';
import { PortalMore } from '@/components/PortalMore';

export default function ClientMore() {
  return (
    <PortalMore
      base="/member"
      items={[
        ['trackers', 'Trackers & Health Logs', 'pulse'],
        ['calendar', 'Calendar & Sessions', 'calendar'],
        ['progress', 'My Progress & Metrics', 'trending-up'],
        ['reports', 'Daily Progress Reports', 'document-text'],
        ['membership', 'Membership Plan', 'card'],
        ['trainer', 'My Trainer', 'person'],
        ['notifications', 'Alerts & Notifications', 'notifications'],
        ['profile', 'My Profile', 'person-circle'],
        ['settings', 'Account Settings', 'settings'],
      ]}
    />
  );
}
