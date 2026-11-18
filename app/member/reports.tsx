import React, { useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Async, Btn, Card, Empty, H3, Header, Kpi, Muted, Row, Screen, useToast } from '@/components/ui';
import { useAsync } from '@/hooks/useAsync';
import { useAuth } from '@/contexts/AuthContext';
import { niceError, q, supabase, todayIST } from '@/lib/supabase';
import { fmtD, fmtDT } from '@/lib/format';
import { colors, fonts, space } from '@/theme';

export default function ClientReports() {
  const { user, profile } = useAuth();
  const toast = useToast();
  const today = todayIST();
  const [busy, setBusy] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const st = useAsync(async () => {
    const res = await q(supabase.from('daily_reports')
      .select('id,report_date,data,created_at')
      .eq('client_id', user!.id)
      .order('report_date', { ascending: false })
      .limit(30));
    return (res as any[]) || [];
  }, [user?.id]);

  const generateReport = async () => {
    setBusy(true);
    try {
      const { error } = await supabase.rpc('request_daily_report', { p_client: user!.id, p_date: today });
      if (error) throw error;
      toast.show('success', 'Report generated for today!');
      st.reload();
    } catch (e) {
      toast.show('error', niceError(e));
    } finally {
      setBusy(false);
    }
  };

  const downloadPdf = async (report: any) => {
    try {
      setDownloadingId(report.id);
      const d = report.data || {};
      const clientName = profile?.full_name || 'Member';
      const dateStr = fmtD(report.report_date);

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8" />
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
              background-color: #111210;
              color: #f4efe6;
              padding: 32px;
              margin: 0;
            }
            .header {
              border-bottom: 2px solid #2c2e29;
              padding-bottom: 16px;
              margin-bottom: 24px;
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            .brand {
              font-size: 24px;
              font-weight: 800;
              letter-spacing: 2px;
              color: #c6ff3d;
            }
            .date-badge {
              font-size: 14px;
              color: #a9a499;
            }
            h1 {
              font-size: 28px;
              margin: 0 0 4px 0;
              color: #f4efe6;
            }
            .client-info {
              color: #a9a499;
              font-size: 15px;
              margin-bottom: 24px;
            }
            .kpi-grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 16px;
              margin-bottom: 28px;
            }
            .kpi-card {
              background: #1a1b18;
              border: 1px solid #2c2e29;
              border-radius: 12px;
              padding: 16px;
            }
            .kpi-label {
              font-size: 12px;
              text-transform: uppercase;
              letter-spacing: 1px;
              color: #a9a499;
              margin-bottom: 4px;
            }
            .kpi-val {
              font-size: 26px;
              font-weight: 700;
              color: #c6ff3d;
            }
            .section {
              background: #1a1b18;
              border: 1px solid #2c2e29;
              border-radius: 12px;
              padding: 20px;
              margin-bottom: 20px;
            }
            .section-title {
              font-size: 16px;
              font-weight: 700;
              color: #f4efe6;
              margin: 0 0 12px 0;
              border-bottom: 1px solid #2c2e29;
              padding-bottom: 8px;
            }
            .detail-row {
              display: flex;
              justify-content: space-between;
              padding: 8px 0;
              border-bottom: 1px solid rgba(255,255,255,0.05);
              font-size: 14px;
            }
            .footer {
              text-align: center;
              font-size: 12px;
              color: #a9a499;
              margin-top: 40px;
              border-top: 1px solid #2c2e29;
              padding-top: 16px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="brand">FORGE FITNESS</div>
            <div class="date-badge">${dateStr}</div>
          </div>
          <h1>Daily Progress Report</h1>
          <div class="client-info">${clientName} · ${user?.email || ''}</div>

          <div class="kpi-grid">
            <div class="kpi-card">
              <div class="kpi-label">Calories Consumed</div>
              <div class="kpi-val">${d.kcal_consumed ?? 0} kcal</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-label">Water Intake</div>
              <div class="kpi-val">${d.water_ml ?? 0} ml</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-label">Exercises Completed</div>
              <div class="kpi-val">${d.exercises_completed ?? 0}</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-label">Daily Steps</div>
              <div class="kpi-val">${d.steps ?? '—'}</div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Summary & Adherence</div>
            <div class="detail-row">
              <span>Report Generated</span>
              <span>${fmtDT(report.created_at)}</span>
            </div>
            <div class="detail-row">
              <span>Workout Target Adherence</span>
              <span>${d.workout_completed ? 'Completed' : (d.exercises_completed ? `${d.exercises_completed} logged` : 'None')}</span>
            </div>
            <div class="detail-row">
              <span>Diet Adherence</span>
              <span>${d.meals_adhered ?? 'Tracked'}</span>
            </div>
          </div>

          <div class="footer">
            FORGE FITNESS — Discipline is built here · forge-fitness-pi-two.vercel.app
          </div>
        </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          UTI: '.pdf',
          mimeType: 'application/pdf',
          dialogTitle: `Download Forge Daily Report - ${report.report_date}.pdf`,
        });
      } else {
        toast.show('success', `PDF saved to ${uri}`);
      }
    } catch (e: any) {
      toast.show('error', niceError(e));
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <Screen onRefresh={st.refresh} refreshing={st.refreshing}>
      <Header eyebrow="Client" title="Daily Progress Reports" back="/member/more" />
      {toast.node}

      <Card style={{ gap: space.sm }}>
        <H3>Generate Today's Report</H3>
        <Muted>Aggregates your daily attendance, workout exercises, nutrition adherence, water and steps.</Muted>
        <Btn title="Generate Report" onPress={generateReport} loading={busy} />
      </Card>

      <Async state={st} empty="No daily reports generated yet. Tap above to generate one.">{(reports) => (
        <View style={{ gap: space.md }}>
          {reports.map((r: any) => {
            const d = r.data || {};
            const isDownloading = downloadingId === r.id;
            return (
              <Card key={r.id} style={{ gap: space.md }}>
                <Row style={{ justifyContent: 'space-between' }}>
                  <Text style={{ color: colors.fg, fontFamily: fonts.headingBold, fontSize: 16 }}>{fmtD(r.report_date)}</Text>
                  {r.report_date === today && (
                    <View style={{ backgroundColor: colors.accent, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 }}>
                      <Text style={{ color: colors.onAccent, fontFamily: fonts.bodySemi, fontSize: 11 }}>TODAY</Text>
                    </View>
                  )}
                </Row>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
                  <Kpi label="Calories" value={`${d.kcal_consumed ?? 0} kcal`} />
                  <Kpi label="Water" value={`${d.water_ml ?? 0} ml`} />
                  <Kpi label="Exercises" value={d.exercises_completed ?? 0} />
                  <Kpi label="Steps" value={d.steps ?? '—'} />
                </View>
                <Btn
                  title="Download PDF"
                  variant="ghost"
                  icon={<Ionicons name="download-outline" size={18} color={colors.fg} />}
                  onPress={() => downloadPdf(r)}
                  loading={isDownloading}
                />
              </Card>
            );
          })}
        </View>
      )}</Async>
    </Screen>
  );
}
