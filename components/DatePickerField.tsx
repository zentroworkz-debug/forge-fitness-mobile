import React, { useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Btn, Row } from '@/components/ui';
import { colors, fonts, radius, space, type } from '@/theme';

const WD = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export function formatYMD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function parseYMD(str?: string): Date {
  if (!str) return new Date();
  const [y, m, d] = str.split('-').map(Number);
  if (!y || !m || !d) return new Date();
  return new Date(y, m - 1, d);
}

export function displayDate(str?: string): string {
  if (!str) return '';
  const d = parseYMD(str);
  return `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)} ${d.getFullYear()}`;
}

interface DatePickerProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  minDate?: string;
  optional?: boolean;
}

export function DatePickerField({ label, value, onChange, placeholder = 'Select date', minDate, optional }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const initialDate = parseYMD(value);
  const [viewYear, setViewYear] = useState(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialDate.getMonth()); // 0-indexed

  const todayStr = useMemo(() => formatYMD(new Date()), []);

  const openCalendar = () => {
    const cur = parseYMD(value);
    setViewYear(cur.getFullYear());
    setViewMonth(cur.getMonth());
    setOpen(true);
  };

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  // Build grid of days for viewMonth / viewYear
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(viewYear, viewMonth, 1);
    const lastDayOfMonth = new Date(viewYear, viewMonth + 1, 0);
    const totalDays = lastDayOfMonth.getDate();

    // In JS, 0 is Sunday. Convert to Monday=0 .. Sunday=6
    let startingDay = firstDayOfMonth.getDay() - 1;
    if (startingDay < 0) startingDay = 6;

    const days: ({ day: number; dateStr: string; isCurrentMonth: boolean })[] = [];

    // Empty lead slots
    for (let i = 0; i < startingDay; i++) {
      days.push({ day: 0, dateStr: '', isCurrentMonth: false });
    }

    // Days of current month
    for (let d = 1; d <= totalDays; d++) {
      const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({ day: d, dateStr, isCurrentMonth: true });
    }

    return days;
  }, [viewYear, viewMonth]);

  const selectDate = (dateStr: string) => {
    onChange(dateStr);
    setOpen(false);
  };

  const setPreset = (daysOffset: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysOffset);
    const str = formatYMD(d);
    onChange(str);
    setOpen(false);
  };

  return (
    <View style={{ gap: 6 }}>
      {!!label && <Text style={type.label}>{label}</Text>}
      <Pressable
        onPress={openCalendar}
        accessibilityRole="button"
        style={({ pressed }) => [
          styles.field,
          pressed && { opacity: 0.85, borderColor: colors.accent },
        ]}>
        <Row style={{ flex: 1, gap: 10 }}>
          <Ionicons name="calendar-outline" size={20} color={colors.accent} />
          <Text style={{ color: value ? colors.fg : colors.muted, fontFamily: fonts.body, fontSize: 15, flex: 1 }}>
            {value ? displayDate(value) : placeholder}
          </Text>
        </Row>
        <Ionicons name="chevron-down" size={18} color={colors.muted} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable onPress={() => setOpen(false)} style={styles.backdrop}>
          <Pressable onPress={(e) => e.stopPropagation()} style={styles.modalCard}>
            {/* Header: Month & Year + Arrows */}
            <Row style={{ justifyContent: 'space-between', marginBottom: space.sm }}>
              <Pressable onPress={prevMonth} hitSlop={12} style={styles.navBtn}>
                <Ionicons name="chevron-back" size={22} color={colors.fg} />
              </Pressable>
              <Text style={{ color: colors.fg, fontFamily: fonts.headingBold, fontSize: 17 }}>
                {MONTHS[viewMonth]} {viewYear}
              </Text>
              <Pressable onPress={nextMonth} hitSlop={12} style={styles.navBtn}>
                <Ionicons name="chevron-forward" size={22} color={colors.fg} />
              </Pressable>
            </Row>

            {/* Days of Week Header */}
            <View style={styles.weekRow}>
              {WD.map((w) => (
                <View key={w} style={styles.dayCell}>
                  <Text style={styles.weekHeaderText}>{w}</Text>
                </View>
              ))}
            </View>

            {/* Calendar Grid */}
            <View style={styles.grid}>
              {calendarDays.map((cell, idx) => {
                if (!cell.isCurrentMonth) {
                  return <View key={`empty-${idx}`} style={styles.dayCell} />;
                }

                const isSelected = cell.dateStr === value;
                const isToday = cell.dateStr === todayStr;
                const isPast = minDate ? cell.dateStr < minDate : false;

                return (
                  <Pressable
                    key={cell.dateStr}
                    disabled={isPast}
                    onPress={() => selectDate(cell.dateStr)}
                    style={[
                      styles.dayCell,
                      isSelected && styles.selectedCell,
                      isToday && !isSelected && styles.todayCell,
                    ]}>
                    <Text
                      style={[
                        styles.dayText,
                        isSelected && styles.selectedDayText,
                        isToday && !isSelected && styles.todayDayText,
                        isPast && styles.pastDayText,
                      ]}>
                      {cell.day}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Quick Presets */}
            <View style={{ marginTop: space.sm, gap: 6 }}>
              <Text style={{ color: colors.muted, fontSize: 11, fontFamily: fonts.bodySemi, textTransform: 'uppercase' }}>
                Quick Presets
              </Text>
              <Row style={{ flexWrap: 'wrap', gap: 6 }}>
                <Pressable onPress={() => setPreset(0)} style={styles.presetChip}>
                  <Text style={styles.presetText}>Today</Text>
                </Pressable>
                <Pressable onPress={() => setPreset(7)} style={styles.presetChip}>
                  <Text style={styles.presetText}>+1 Week</Text>
                </Pressable>
                <Pressable onPress={() => setPreset(30)} style={styles.presetChip}>
                  <Text style={styles.presetText}>+1 Month</Text>
                </Pressable>
                <Pressable onPress={() => setPreset(90)} style={styles.presetChip}>
                  <Text style={styles.presetText}>+3 Months</Text>
                </Pressable>
              </Row>
            </View>

            {/* Action buttons */}
            <Row style={{ gap: space.sm, marginTop: space.sm }}>
              {optional && !!value && (
                <Btn
                  title="Clear"
                  variant="ghost"
                  onPress={() => { onChange(''); setOpen(false); }}
                  style={{ flex: 1 }}
                />
              )}
              <Btn
                title="Close"
                variant="ghost"
                onPress={() => setOpen(false)}
                style={{ flex: 1 }}
              />
            </Row>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    minHeight: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bg,
    paddingHorizontal: space.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.82)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: space.lg,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.bg2,
    borderRadius: radius.lg,
    padding: space.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: space.sm,
  },
  navBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: colors.bg,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 6,
  },
  weekHeaderText: {
    color: colors.muted,
    fontFamily: fonts.bodySemi,
    fontSize: 12,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  dayCell: {
    width: '14.28%',
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    marginVertical: 2,
  },
  dayText: {
    color: colors.fg,
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
  },
  selectedCell: {
    backgroundColor: colors.accent,
  },
  selectedDayText: {
    color: colors.onAccent,
    fontFamily: fonts.headingBold,
  },
  todayCell: {
    borderWidth: 1.5,
    borderColor: colors.accent,
  },
  todayDayText: {
    color: colors.accent,
    fontFamily: fonts.bodySemi,
  },
  pastDayText: {
    color: 'rgba(169,164,153,0.3)',
  },
  presetChip: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  presetText: {
    color: colors.fg,
    fontSize: 12,
    fontFamily: fonts.bodyMedium,
  },
});
