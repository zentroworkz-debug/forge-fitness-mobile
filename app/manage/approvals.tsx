import React, { useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Async, Btn, Card, Chip, Chips, Empty, Field, H3, Header, Muted, Row, Screen, useToast } from '@/components/ui';
import { useAsync } from '@/hooks/useAsync';
import { niceError, q, supabase } from '@/lib/supabase';
import { fmtD, fmtDT } from '@/lib/format';
import { colors, fonts, radius, space } from '@/theme';

export default function Approvals() {
  const toast = useToast();
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [busy, setBusy] = useState('');
  const [rejectingUser, setRejectingUser] = useState<any>(null);
  const [rejectReason, setRejectReason] = useState('');

  const st = useAsync(async () => {
    const res = await q(supabase.from('profiles')
      .select('*,client_profiles(age,fitness_goal,experience_level),trainer_profiles(specialization,experience_years,certifications,qualifications)')
      .order('created_at', { ascending: false })
      .limit(100));
    return (res as any[]) || [];
  }, []);

  const review = async (id: string, status: 'approved' | 'rejected', reasonText?: string) => {
    setBusy(id + status);
    const { error } = await supabase.rpc('review_account', {
      p_user: id,
      p_status: status,
      p_reason: status === 'rejected' ? (reasonText || rejectReason).trim() : null,
    });
    setBusy('');
    if (error) {
      toast.show('error', niceError(error));
    } else {
      toast.show('success', status === 'approved' ? 'Application approved! The user was notified.' : 'Application rejected.');
      setRejectingUser(null);
      setRejectReason('');
      st.reload();
    }
  };

  const statusBadge = (s: string) => {
    const isApp = s === 'approved';
    const isRej = s === 'rejected';
    const bg = isApp ? 'rgba(198,255,61,0.15)' : isRej ? 'rgba(255,107,91,0.15)' : 'rgba(255,200,87,0.15)';
    const fg = isApp ? colors.accent : isRej ? colors.danger : colors.warn;
    const label = isApp ? 'APPROVED' : isRej ? 'REJECTED' : 'PENDING';
    return (
      <View style={{ backgroundColor: bg, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 6, borderWidth: 1, borderColor: fg }}>
        <Text style={{ color: fg, fontFamily: fonts.bodySemi, fontSize: 11, letterSpacing: 0.5 }}>{label}</Text>
      </View>
    );
  };

  return (
    <Screen onRefresh={st.refresh} refreshing={st.refreshing}>
      <Header eyebrow="Admin" title="Account Approvals" back="/manage/more" />
      {toast.node}

      <Chips>
        <Chip label="Pending" active={filter === 'pending'} onPress={() => setFilter('pending')} />
        <Chip label="Approved" active={filter === 'approved'} onPress={() => setFilter('approved')} />
        <Chip label="Rejected" active={filter === 'rejected'} onPress={() => setFilter('rejected')} />
        <Chip label="All Applicants" active={filter === 'all'} onPress={() => setFilter('all')} />
      </Chips>

      <Async state={st} empty="No registrations found.">{(rows: any[]) => {
        const filtered = rows.filter((r) => {
          if (filter === 'all') return true;
          return r.approval_status === filter;
        });

        if (!filtered.length) {
          return <Empty text={`No ${filter} accounts.`} />;
        }

        return (
          <View style={{ gap: space.md }}>
            {filtered.map((p) => {
              const isPending = p.approval_status === 'pending';
              const isApproved = p.approval_status === 'approved';
              const isRejected = p.approval_status === 'rejected';
              const isTrainer = p.requested_role === 'trainer';
              const tp = p.trainer_profiles;
              const cp = p.client_profiles;

              return (
                <Card key={p.id} accent={isPending} style={{ gap: space.md }}>
                  <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <View style={{ gap: 2, flex: 1 }}>
                      <Text style={{ color: colors.fg, fontFamily: fonts.headingBold, fontSize: 17 }}>
                        {p.full_name ?? 'Unnamed applicant'}
                      </Text>
                      <Muted>{p.phone || 'No phone'} · Registered {fmtD(p.created_at)}</Muted>
                      <Text style={{ color: colors.accent, fontFamily: fonts.bodySemi, fontSize: 13, textTransform: 'capitalize', marginTop: 2 }}>
                        Role: {p.requested_role}
                      </Text>
                    </View>
                    {statusBadge(p.approval_status)}
                  </Row>

                  {/* Profile Details */}
                  <View style={{ backgroundColor: colors.bg, padding: space.md, borderRadius: 12, gap: 4 }}>
                    {isTrainer ? (
                      <>
                        <Text style={{ color: colors.fg, fontFamily: fonts.bodyMedium, fontSize: 13 }}>
                          Specialization: <Text style={{ color: colors.muted }}>{tp?.specialization || 'Not provided'}</Text>
                        </Text>
                        <Text style={{ color: colors.fg, fontFamily: fonts.bodyMedium, fontSize: 13 }}>
                          Experience: <Text style={{ color: colors.muted }}>{tp?.experience_years != null ? `${tp.experience_years} years` : '—'}</Text>
                        </Text>
                        {tp?.certifications && (
                          <Text style={{ color: colors.fg, fontFamily: fonts.bodyMedium, fontSize: 13 }}>
                            Certifications: <Text style={{ color: colors.muted }}>{tp.certifications}</Text>
                          </Text>
                        )}
                        {tp?.qualifications && (
                          <Text style={{ color: colors.fg, fontFamily: fonts.bodyMedium, fontSize: 13 }}>
                            Qualifications: <Text style={{ color: colors.muted }}>{tp.qualifications}</Text>
                          </Text>
                        )}
                      </>
                    ) : (
                      <>
                        <Text style={{ color: colors.fg, fontFamily: fonts.bodyMedium, fontSize: 13 }}>
                          Fitness Goal: <Text style={{ color: colors.muted }}>{cp?.fitness_goal || 'General Fitness'}</Text>
                        </Text>
                        {cp?.age && (
                          <Text style={{ color: colors.fg, fontFamily: fonts.bodyMedium, fontSize: 13 }}>
                            Age: <Text style={{ color: colors.muted }}>{cp.age} years</Text>
                          </Text>
                        )}
                        {cp?.experience_level && (
                          <Text style={{ color: colors.fg, fontFamily: fonts.bodyMedium, fontSize: 13 }}>
                            Level: <Text style={{ color: colors.muted }}>{cp.experience_level}</Text>
                          </Text>
                        )}
                      </>
                    )}

                    {isRejected && p.rejection_reason && (
                      <View style={{ marginTop: 6, paddingTop: 6, borderTopWidth: 1, borderTopColor: colors.border }}>
                        <Text style={{ color: colors.danger, fontFamily: fonts.bodySemi, fontSize: 13 }}>
                          Rejection Reason: <Text style={{ color: colors.fg, fontFamily: fonts.body }}>{p.rejection_reason}</Text>
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Actions for Pending */}
                  {isPending && (
                    <Row style={{ gap: space.sm }}>
                      <Btn
                        title="Approve"
                        onPress={() => review(p.id, 'approved')}
                        loading={busy === p.id + 'approved'}
                        icon={<Ionicons name="checkmark-circle" size={18} color={colors.onAccent} />}
                        style={{ flex: 1 }}
                      />
                      <Btn
                        title="Reject"
                        variant="danger"
                        onPress={() => { setRejectingUser(p); setRejectReason(''); }}
                        icon={<Ionicons name="close-circle" size={18} color={colors.danger} />}
                        style={{ flex: 1 }}
                      />
                    </Row>
                  )}

                  {/* Option to re-review if previously rejected or approved */}
                  {!isPending && (
                    <Row style={{ justifyContent: 'flex-end' }}>
                      <Btn
                        title={isApproved ? "Revoke Approval" : "Reconsider & Approve"}
                        variant="ghost"
                        onPress={() => {
                          if (isApproved) {
                            setRejectingUser(p);
                            setRejectReason('Account revoked by admin');
                          } else {
                            review(p.id, 'approved');
                          }
                        }}
                      />
                    </Row>
                  )}
                </Card>
              );
            })}
          </View>
        );
      }}</Async>

      {/* Reject Modal with Reason Input */}
      <Modal visible={!!rejectingUser} transparent animationType="fade" onRequestClose={() => setRejectingUser(null)}>
        <Pressable onPress={() => setRejectingUser(null)} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: space.lg }}>
          <Pressable onPress={(e) => e.stopPropagation()} style={{ backgroundColor: colors.bg2, borderRadius: radius.lg, padding: space.xl, gap: space.md, borderWidth: 1, borderColor: colors.border }}>
            <Row style={{ justifyContent: 'space-between' }}>
              <H3>Reject Application</H3>
              <Pressable onPress={() => setRejectingUser(null)} hitSlop={8}>
                <Ionicons name="close" size={24} color={colors.muted} />
              </Pressable>
            </Row>

            <Muted>Rejecting {rejectingUser?.full_name}. Please provide a reason to inform the applicant:</Muted>

            <Field
              label="Rejection Reason *"
              placeholder="e.g. Incomplete application or gym at full capacity"
              value={rejectReason}
              onChangeText={setRejectReason}
              multiline
              numberOfLines={3}
            />

            <Row style={{ gap: space.sm, marginTop: space.sm }}>
              <Btn title="Cancel" variant="ghost" onPress={() => setRejectingUser(null)} style={{ flex: 1 }} />
              <Btn
                title="Confirm Rejection"
                variant="danger"
                disabled={!rejectReason.trim()}
                loading={busy === (rejectingUser?.id + 'rejected')}
                onPress={() => review(rejectingUser.id, 'rejected', rejectReason)}
                style={{ flex: 1 }}
              />
            </Row>
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>
  );
}
