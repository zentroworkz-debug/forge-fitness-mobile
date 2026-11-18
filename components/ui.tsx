import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TextInputProps, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, radius, space, type } from '@/theme';

export const Eyebrow = ({ children }: { children: React.ReactNode }) => <Text style={type.eyebrow}>{children}</Text>;
export const H1 = ({ children, style }: any) => <Text style={[type.h1, style]} accessibilityRole="header">{children}</Text>;
export const H2 = ({ children, style }: any) => <Text style={[type.h2, style]} accessibilityRole="header">{children}</Text>;
export const H3 = ({ children, style }: any) => <Text style={[type.h3, style]}>{children}</Text>;
export const P = ({ children, style, ...rest }: any) => <Text {...rest} style={[type.body, style]}>{children}</Text>;
export const Muted = ({ children, style, ...rest }: any) => <Text {...rest} style={[type.muted, style]}>{children}</Text>;

export const PortalHeaderContext = React.createContext(false);

export function Screen({ children, onRefresh, refreshing = false, padded = true, edges, center }: { children: React.ReactNode; onRefresh?: () => void; refreshing?: boolean; padded?: boolean; edges?: ('top' | 'bottom')[]; center?: boolean }) {
  const hasHeader = React.useContext(PortalHeaderContext); // portal tabs draw their own top bar
  const safe = edges ?? (hasHeader ? [] : ['top']);
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={safe}>
      <ScrollView
        contentContainerStyle={[{ paddingBottom: space.xxl * 2, gap: space.lg }, padded && { padding: space.lg }, center && { flexGrow: 1, justifyContent: 'center' }]}
        keyboardShouldPersistTaps="handled"
        refreshControl={onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} colors={[colors.accent]} progressBackgroundColor={colors.bg2} /> : undefined}>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

export function Card({ children, style, onPress, accent }: { children: React.ReactNode; style?: ViewStyle; onPress?: () => void; accent?: boolean }) {
  const s = [styles.card, accent && { borderColor: colors.accent }, style];
  return onPress ? <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => [s, pressed && { opacity: 0.85 }]}>{children}</Pressable> : <View style={s}>{children}</View>;
}

export function Btn({ title, onPress, variant = 'primary', loading, disabled, icon, style }: { title: string; onPress: () => void; variant?: 'primary' | 'ghost' | 'danger'; loading?: boolean; disabled?: boolean; icon?: React.ReactNode; style?: ViewStyle }) {
  const bg = variant === 'primary' ? colors.accent : 'transparent';
  const fg = variant === 'primary' ? colors.onAccent : variant === 'danger' ? colors.danger : colors.fg;
  const border = variant === 'primary' ? colors.accent : variant === 'danger' ? colors.danger : colors.fg;
  return (
    <Pressable onPress={onPress} disabled={disabled || loading} accessibilityRole="button" accessibilityState={{ disabled: !!(disabled || loading), busy: !!loading }}
      style={({ pressed }) => [styles.btn, { backgroundColor: bg, borderColor: border, opacity: disabled ? 0.45 : pressed ? 0.85 : 1 }, style]}>
      {loading ? <ActivityIndicator color={fg} /> : (<>{icon}<Text style={[styles.btnText, { color: fg }]}>{title}</Text></>)}
    </Pressable>
  );
}

export function Field({ label, error, ...rest }: TextInputProps & { label: string; error?: string }) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={type.label}>{label}</Text>
      <TextInput placeholderTextColor={colors.muted} {...rest} accessibilityLabel={label}
        style={[styles.input, error ? { borderColor: colors.danger } : null, rest.multiline && { minHeight: 110, textAlignVertical: 'top' }, rest.style]} />
      {!!error && <Text style={{ color: colors.danger, fontFamily: fonts.body, fontSize: 13 }}>{error}</Text>}
    </View>
  );
}

export function PasswordField({ label, error, ...rest }: TextInputProps & { label: string; error?: string }) {
  const [show, setShow] = useState(false);
  return (
    <View style={{ gap: 6 }}>
      <Text style={type.label}>{label}</Text>
      <View>
        <TextInput placeholderTextColor={colors.muted} autoCapitalize="none" autoCorrect={false} {...rest} secureTextEntry={!show} accessibilityLabel={label}
          style={[styles.input, { paddingRight: 52 }, error ? { borderColor: colors.danger } : null]} />
        <Pressable onPress={() => setShow((v) => !v)} hitSlop={8} accessibilityRole="button" accessibilityLabel={show ? 'Hide password' : 'Show password'}
          style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 50, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name={show ? 'eye-off' : 'eye'} size={22} color={show ? colors.accent : colors.muted} />
        </Pressable>
      </View>
      {!!error && <Text style={{ color: colors.danger, fontFamily: fonts.body, fontSize: 13 }}>{error}</Text>}
    </View>
  );
}

export function Chip({ label, active, onPress }: { label: string; active?: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityState={{ selected: !!active }}
      style={[styles.chip, active && { backgroundColor: colors.accent, borderColor: colors.accent }]}>
      <Text style={{ fontFamily: fonts.bodySemi, fontSize: 14, color: active ? colors.onAccent : colors.fg }}>{label}</Text>
    </Pressable>
  );
}

export const Chips = ({ children }: { children: React.ReactNode }) => (
  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.sm, paddingVertical: 2 }}>{children}</ScrollView>
);

export function Banner({ kind, children }: { kind: 'error' | 'success' | 'info'; children: React.ReactNode }) {
  const c = kind === 'error' ? colors.danger : kind === 'success' ? colors.accent : colors.warn;
  return <View accessibilityLiveRegion="polite" style={[styles.card, { borderColor: c, backgroundColor: colors.bg2 }]}><Text style={{ color: kind === 'info' ? colors.fg : c, fontFamily: fonts.bodyMedium, fontSize: 15 }}>{children}</Text></View>;
}

export function Skeleton({ h = 80 }: { h?: number }) {
  const o = useRef(new Animated.Value(0.4)).current;
  useEffect(() => { const a = Animated.loop(Animated.sequence([Animated.timing(o, { toValue: 0.9, duration: 700, useNativeDriver: true }), Animated.timing(o, { toValue: 0.4, duration: 700, useNativeDriver: true })])); a.start(); return () => a.stop(); }, [o]);
  return <Animated.View style={{ height: h, borderRadius: radius.md, backgroundColor: colors.bg2, opacity: o }} />;
}
export const Skeletons = ({ n = 3, h = 90 }: { n?: number; h?: number }) => <View style={{ gap: space.md }}>{Array.from({ length: n }).map((_, i) => <Skeleton key={i} h={h} />)}</View>;

export const Empty = ({ text }: { text: string }) => <View style={{ padding: space.xl, alignItems: 'center' }}><Muted style={{ textAlign: 'center' }}>{text}</Muted></View>;

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return <Card style={{ gap: space.md }}><Text style={{ color: colors.danger, fontFamily: fonts.bodyMedium }}>{message}</Text><Btn title="Try again" variant="ghost" onPress={onRetry} /></Card>;
}

// Renders loading / error / empty / data for an useAsync() result.
export function Async<T>({ state, empty, children }: { state: { data: T | null; error: string | null; loading: boolean; reload: () => void }; empty?: string; children: (d: T) => React.ReactNode }) {
  if (state.loading && !state.data) return <Skeletons />;
  if (state.error && !state.data) return <ErrorState message={state.error} onRetry={state.reload} />;
  if (state.data == null || (Array.isArray(state.data) && state.data.length === 0 && empty)) return <Empty text={empty || 'Nothing here yet.'} />;
  return <>{children(state.data)}</>;
}

export const Kpi = ({ label, value, sub }: { label: string; value: React.ReactNode; sub?: string }) => (
  <View style={[styles.card, { flex: 1, minWidth: '45%', gap: 2 }]}>
    <Text style={type.label}>{label}</Text>
    <Text style={{ fontFamily: fonts.heading, fontSize: 22, color: colors.fg }} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
    {!!sub && <Muted>{sub}</Muted>}
  </View>
);

export const Row = ({ children, style }: { children: React.ReactNode; style?: ViewStyle }) => <View style={[{ flexDirection: 'row', alignItems: 'center', gap: space.md }, style]}>{children}</View>;

export function Bar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return <View style={{ height: 8, borderRadius: 4, backgroundColor: colors.border, overflow: 'hidden' }}><View style={{ width: `${pct}%`, height: 8, backgroundColor: colors.accent }} /></View>;
}

export function Photo({ source, height = 180, radiusPx = radius.md }: { source?: number; height?: number; radiusPx?: number }) {
  if (!source) return <View style={{ height, borderRadius: radiusPx, backgroundColor: colors.bg2 }} />;
  return <Image source={source} style={{ height, width: '100%', borderRadius: radiusPx }} contentFit="cover" transition={150} />;
}

export function Header({ title, eyebrow, back }: { title: string; eyebrow?: string; back?: boolean | string }) {
  const handleBack = () => {
    if (typeof back === 'string') {
      router.replace(back as any);
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };
  return (
    <View style={{ gap: 4 }}>
      {!!back && (
        <Pressable onPress={handleBack} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2, paddingVertical: 2, alignSelf: 'flex-start' }} hitSlop={8}>
          <Ionicons name="chevron-back" size={20} color={colors.accent} />
          <Text style={{ color: colors.accent, fontFamily: fonts.bodySemi, fontSize: 14 }}>Back</Text>
        </Pressable>
      )}
      {!!eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      <H1>{title}</H1>
    </View>
  );
}

export function useToast() {
  const [msg, setMsg] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);
  const t = useRef<any>(null);
  const show = (kind: 'success' | 'error', text: string) => { setMsg({ kind, text }); clearTimeout(t.current); t.current = setTimeout(() => setMsg(null), 4000); };
  const node = msg ? <Banner kind={msg.kind}>{msg.text}</Banner> : null;
  return { show, node };
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.bg2, borderColor: colors.border, borderWidth: 1, borderRadius: radius.lg, padding: space.lg, overflow: 'hidden' },
  btn: { minHeight: 46, borderRadius: radius.md, borderWidth: 1.5, paddingHorizontal: space.md, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.sm },
  btnText: { fontFamily: fonts.headingBold, fontSize: 14, textAlign: 'center', flexShrink: 1 },
  input: { minHeight: 48, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.bg, color: colors.fg, paddingHorizontal: space.md, fontFamily: fonts.body, fontSize: 15 },
  chip: { minHeight: 38, paddingHorizontal: 14, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, justifyContent: 'center' },
});
