import React from 'react';
import { Text, View } from 'react-native';
import { colors, fonts } from '@/theme';

// Dependency-free bar chart (keeps the APK small and avoids chart-library version issues).
export function BarChart({ data, height = 110 }: { data: { label: string; value: number; key?: string }[]; height?: number }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: height + 22 }} accessibilityLabel={`Bar chart: ${data.map((d) => `${d.label} ${d.value}`).join(', ')}`}>
      {data.map((d, idx) => (
        <View key={d.key ?? `${d.label}-${idx}`} style={{ flex: 1, alignItems: 'center', gap: 4 }}>
          <View style={{ width: '100%', height: Math.max(2, (d.value / max) * height), backgroundColor: d.value ? colors.accent : colors.border, borderRadius: 4 }} />
          <Text style={{ color: colors.muted, fontFamily: fonts.body, fontSize: 10 }}>{d.label}</Text>
        </View>
      ))}
    </View>
  );
}
