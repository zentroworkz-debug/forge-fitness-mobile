import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Async, Banner, Btn, Card, Field, H3, Header, Muted, Row, Screen } from '@/components/ui';
import QrScanner, { ScanOutcome } from '@/components/QrScanner';
import { useAsync } from '@/hooks/useAsync';
import { useAuth } from '@/contexts/AuthContext';
import { q, supabase, todayIST } from '@/lib/supabase';
import { fmtT } from '@/lib/format';
import { scanMessage, submitScan } from '@/lib/attendance';
import { fmtDur, lastDays, minutesBetween, monthStats, Rec, statusOf } from '@/lib/attendanceView';
import { colors, fonts, space } from '@/theme';

const WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const Pill = ({ icon, text, tone }: { icon: any; text: string; tone: 'in' | 'out' | 'warn' | 'bad' | 'mute' }) => {
  const bg = tone === 'in' ? colors.accent : tone === 'warn' ? colors.warn : tone === 'bad' ? 'transparent' : 'transparent';
  const fg = tone === 'in' || tone === 'warn' ? colors.onAccent : tone === 'bad' ? colors.danger : tone === 'mute' ? colors.muted : colors.fg;
  const bd = tone === 'out' ? colors.fg : tone === 'bad' ? colors.danger : tone === 'mute' ? colors.border : bg;
  return <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: bg, borderColor: bd, borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 }}><Ionicons name={icon} size={14} color={fg} /><Text style={{ color: fg, fontFamily: fonts.bodySemi, fontSize: 13 }}>{text}</Text></View>;
};

export default function Scan() {
  const { user } = useAuth();
  const { auto } = useLocalSearchParams<{ auto?: string }>();
  const [open, setOpen] = useState(auto === '1');
  const [manual, setManual] = useState('');
  const [note, setNote] = useState<ScanOutcome | null>(null);
  const [busy, setBusy] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const today = todayIST();

  useEffect(() => {
    if (auto === '1') setOpen(true);
  }, [auto]);

  const st = useAsync(() => q(supabase.from('attendance_records').select('id,gym_date,check_in_at,check_out_at,missed').eq('client_id', user!.id).order('check_in_at', { ascending: false }).limit(90)) as Promise<Rec[]>, [user?.id]);

  const onScan = useCallback(async (code: string): Promise<ScanOutcome> => {
    try {
      const r = await submitScan(code);
      st.reload();
      return { ok: true, message: r.action === 'check_in' ? `Checked in at ${fmtT(r.at)}. Have a great workout!` : `Checked out at ${fmtT(r.at)}${r.minutes ? ` after ${r.minutes} min` : ''}. See you next time!` };
    } catch (e) {
      return { ok: false, message: scanMessage(e) };
    }
  }, [st]);

  const submitManual = async () => {
    if (!manual.trim()) return;
    setBusy(true);
    setNote(await onScan(manual.trim()));
    setBusy(false);
    setManual('');
  };

  const rows = st.data ?? [];
  const inside = rows.find((r) => statusOf(r, today) === 'inside');
  const stats = useMemo(() => monthStats(rows, today), [rows, today]);
  const strip = useMemo(() => lastDays(rows, today, 14), [rows, today]);

  return (
    <Screen onRefresh={st.refresh} refreshing={st.refreshing}>
      <Header eyebrow="Scanner" title="QR Scanner" back={true} />

      {/* Main Check-in / Check-out Camera Tile */}
      <Card accent={!!inside} style={{ gap: space.md, alignItems: 'center' }}>
        <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: inside ? colors.accent : colors.bg, borderWidth: 1, borderColor: inside ? colors.accent : colors.border, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name={inside ? 'walk' : 'qr-code'} size={34} color={inside ? colors.onAccent : colors.accent} />
        </View>
        <H3>{inside ? `Inside since ${fmtT(inside.check_in_at)}` : 'Ready to scan'}</H3>
        <Muted style={{ textAlign: 'center' }}>{inside ? "When leaving, scan the gym QR code to record your check-out." : 'Scan the gym QR code at the desk on arrival.'}</Muted>
        <Btn title={inside ? 'Open scanner to check out' : 'Open camera scanner'} onPress={() => { setNote(null); setOpen(true); }} icon={<Ionicons name="scan" size={20} color={colors.onAccent} />} style={{ alignSelf: 'stretch' }} />
      </Card>

      {/* 8-letter code manual entry right under the QR Scanner */}
      <Card style={{ gap: space.sm }}>
        <H3>Enter 8-character code</H3>
        <Muted>If camera scanning is not available, enter the 8-character code from the desk.</Muted>
        <Row style={{ alignItems: 'flex-end' }}>
          <View style={{ flex: 1 }}>
            <Field
              label=""
              placeholder="e.g. A1B2C3D4"
              value={manual}
              onChangeText={(t) => setManual(t.toUpperCase())}
              maxLength={8}
              autoCapitalize="characters"
              autoCorrect={false}
            />
          </View>
          <Btn
            title={inside ? 'Check Out' : 'Check In'}
            onPress={submitManual}
            loading={busy}
            disabled={manual.trim().length < 4}
          />
        </Row>
      </Card>

      {note && <Banner kind={note.ok ? 'success' : 'error'}>{note.message}</Banner>}

      <Row style={{ gap: space.md }}>
        {[['Visits this month', String(stats.visits)], ['Time this month', stats.minutes ? fmtDur(stats.minutes) : '0 min']].map(([l, v]) => (
          <Card key={l} style={{ flex: 1, gap: 2 }}><Muted>{l}</Muted><Text style={{ color: colors.accent, fontFamily: fonts.heading, fontSize: 24 }}>{v}</Text></Card>))}
      </Row>

      <Card style={{ gap: space.sm }}>
        <Muted>Last 14 days</Muted>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }} accessibilityLabel={`Visited ${strip.filter((d) => d.visited).length} of the last 14 days`}>
          {strip.map((d) => (
            <View key={d.key} style={{ alignItems: 'center', gap: 4 }}>
              <Text style={{ color: colors.muted, fontFamily: fonts.body, fontSize: 10 }}>{d.label}</Text>
              <View style={{ width: 17, height: 17, borderRadius: 9, backgroundColor: d.visited ? colors.accent : 'transparent', borderWidth: d.isToday ? 2 : 1, borderColor: d.isToday ? colors.fg : d.visited ? colors.accent : colors.border }} />
            </View>))}
        </View>
      </Card>

      {/* Attendance History (Last 7 default, expandable to full history) */}
      <Row style={{ justifyContent: 'space-between' }}>
        <H3>Attendance History</H3>
        {rows.length > 7 && (
          <Btn
            title={expanded ? 'Show Last 7' : `View All (${rows.length})`}
            variant="ghost"
            onPress={() => setExpanded(!expanded)}
          />
        )}
      </Row>

      <Async state={st} empty="No attendance yet. Scan the check-in QR on your first visit.">{(list) => {
        const visibleRows = expanded ? list : list.slice(0, 7);
        return (
          <View style={{ gap: space.md }}>
            {visibleRows.map((r) => {
              const s = statusOf(r, today);
              const d = new Date(r.gym_date + 'T00:00:00');
              const edge = s === 'done' ? colors.accent : s === 'inside' ? colors.warn : colors.danger;
              return (
                <View key={r.id} style={{ flexDirection: 'row', backgroundColor: colors.bg2, borderRadius: 18, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' }}>
                  <View style={{ width: 5, backgroundColor: edge }} />
                  <View style={{ width: 64, alignItems: 'center', justifyContent: 'center', paddingVertical: space.md }}>
                    <Text style={{ color: colors.muted, fontFamily: fonts.bodySemi, fontSize: 11, letterSpacing: 1 }}>{WD[d.getDay()].toUpperCase()}</Text>
                    <Text style={{ color: colors.fg, fontFamily: fonts.heading, fontSize: 26, lineHeight: 30 }}>{d.getDate()}</Text>
                    <Text style={{ color: colors.muted, fontFamily: fonts.bodySemi, fontSize: 11 }}>{MON[d.getMonth()]}</Text>
                  </View>
                  <View style={{ flex: 1, paddingVertical: space.md, paddingRight: space.md, gap: 8, justifyContent: 'center' }}>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                      <Pill icon="log-in-outline" text={`IN  ${fmtT(r.check_in_at)}`} tone="in" />
                      {r.check_out_at ? <Pill icon="log-out-outline" text={`OUT  ${fmtT(r.check_out_at)}`} tone="out" /> : s === 'inside' ? <Pill icon="time-outline" text="In gym now" tone="warn" /> : <Pill icon="alert-circle-outline" text="No check-out" tone="bad" />}
                    </View>
                    <Muted>{r.check_out_at ? `Workout time ${fmtDur(minutesBetween(r.check_in_at, r.check_out_at))}` : s === 'missed' ? 'Marked missed: check-out was not scanned' : 'Scan check-out when you leave'}</Muted>
                  </View>
                </View>
              );
            })}

            {!expanded && list.length > 7 && (
              <Btn
                title={`Show full attendance history (${list.length} visits)`}
                variant="ghost"
                onPress={() => setExpanded(true)}
              />
            )}
          </View>
        );
      }}</Async>

      {open && <QrScanner open={open} onClose={() => setOpen(false)} onScan={onScan} title={inside ? 'Check out' : 'Check in'} />}
    </Screen>
  );
}
