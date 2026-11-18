import React, { useEffect, useRef } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { addDays, dayKind, strip } from '@/lib/dates';
import { colors, fonts, space } from '@/theme';

const WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const longDate = (ymd: string) => { const d = new Date(ymd + 'T00:00:00'); return `${WD[d.getDay()]}, ${d.getDate()} ${MON[d.getMonth()]} ${d.getFullYear()}`; };

// Scrollable day picker with prev/next, "Today" jump and a Past / Today / Upcoming label.
export function DateStrip({ value, today, onChange }: { value: string; today: string; onChange: (d: string) => void }) {
  const days = strip(value, 3, 10); const kind = dayKind(value, today);
  const ref = useRef<React.ComponentRef<typeof ScrollView>>(null);
  useEffect(() => { ref.current?.scrollTo({ x: 0, animated: false }); }, [value]);
  const tone = kind === 'today' ? colors.accent : kind === 'future' ? colors.warn : colors.muted;
  return (
    <View style={{ gap: space.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Pressable onPress={() => onChange(addDays(value, -1))} accessibilityLabel="Previous day" hitSlop={10} style={{ padding: 6 }}><Ionicons name="chevron-back" size={24} color={colors.fg} /></Pressable>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ color: colors.fg, fontFamily: fonts.headingBold, fontSize: 16 }}>{longDate(value)}</Text>
          <Text style={{ color: tone, fontFamily: fonts.bodySemi, fontSize: 12, letterSpacing: 1.5 }}>{kind === 'today' ? 'TODAY' : kind === 'future' ? 'UPCOMING' : 'PAST RECORD'}</Text>
        </View>
        <Pressable onPress={() => onChange(addDays(value, 1))} accessibilityLabel="Next day" hitSlop={10} style={{ padding: 6 }}><Ionicons name="chevron-forward" size={24} color={colors.fg} /></Pressable>
      </View>
      <ScrollView ref={ref} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {days.map((d) => {
          const on = d === value; const dt = new Date(d + 'T00:00:00'); const isT = d === today;
          return (
            <Pressable key={d} onPress={() => onChange(d)} accessibilityRole="button" accessibilityState={{ selected: on }} accessibilityLabel={longDate(d)}
              style={{ width: 52, paddingVertical: 8, alignItems: 'center', borderRadius: 14, borderWidth: 1, borderColor: on ? colors.accent : isT ? colors.fg : colors.border, backgroundColor: on ? colors.accent : colors.bg2 }}>
              <Text style={{ color: on ? colors.onAccent : colors.muted, fontFamily: fonts.bodySemi, fontSize: 11 }}>{WD[dt.getDay()].toUpperCase()}</Text>
              <Text style={{ color: on ? colors.onAccent : colors.fg, fontFamily: fonts.heading, fontSize: 18 }}>{dt.getDate()}</Text>
            </Pressable>);
        })}
      </ScrollView>
      {value !== today && <Pressable onPress={() => onChange(today)} accessibilityRole="button" style={{ alignSelf: 'center', paddingVertical: 4 }}><Text style={{ color: colors.accent, fontFamily: fonts.bodySemi }}>Jump to today</Text></Pressable>}
    </View>
  );
}
