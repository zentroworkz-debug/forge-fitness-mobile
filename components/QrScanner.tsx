import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Easing, LayoutChangeEvent, Modal, Pressable, StyleSheet, Text, Vibration, View } from 'react-native';
import { CameraView, scanFromURLAsync, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, space } from '@/theme';

// Native port of the website's QrScanner: full-screen camera, dimmed surround with a corner-bracket viewfinder,
// moving scan line, hint, round torch / flip / photo buttons, zoom, and the same Starting/Checking/Success/Could-not-scan states.
export type ScanOutcome = { ok: boolean; message: string };
type Phase = 'starting' | 'scanning' | 'processing' | 'result' | 'error';

const FRAME = 0.68; // same 68% viewfinder as the website
const Round = ({ icon, label, on, onPress }: { icon: any; label: string; on?: boolean; onPress: () => void }) => (
  <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ selected: !!on }}
    style={{ width: 54, height: 54, borderRadius: 27, borderWidth: 1, borderColor: on ? colors.accent : 'rgba(255,255,255,.35)', backgroundColor: on ? colors.accent : 'rgba(0,0,0,.55)', alignItems: 'center', justifyContent: 'center' }}>
    <Ionicons name={icon} size={22} color={on ? colors.onAccent : '#fff'} />
  </Pressable>
);
const Corner = ({ pos }: { pos: 'tl' | 'tr' | 'bl' | 'br' }) => {
  const b = 4; const s = 38;
  const st: any = { position: 'absolute', width: s, height: s, borderColor: colors.accent };
  if (pos[0] === 't') { st.top = -2; st.borderTopWidth = b; } else { st.bottom = -2; st.borderBottomWidth = b; }
  if (pos[1] === 'l') { st.left = -2; st.borderLeftWidth = b; } else { st.right = -2; st.borderRightWidth = b; }
  return <View style={st} />;
};

export default function QrScanner({ open, onClose, onScan, title = 'Scan QR code', hint = 'Point the camera at the QR code and hold steady' }: { open: boolean; onClose: () => void; onScan: (text: string) => Promise<ScanOutcome>; title?: string; hint?: string }) {
  const insets = useSafeAreaInsets();
  const [perm, requestPerm] = useCameraPermissions();
  const [phase, setPhase] = useState<Phase>('starting');
  const [error, setError] = useState(''); const [result, setResult] = useState<ScanOutcome | null>(null);
  const [torch, setTorch] = useState(false); const [facing, setFacing] = useState<'back' | 'front'>('back'); const [zoom, setZoom] = useState(0);
  const [box, setBox] = useState({ w: 0, h: 0 }); const [camKey, setCamKey] = useState(0);
  const decoded = useRef(false); const line = useRef(new Animated.Value(0)).current; const trackW = useRef(1);

  const begin = useCallback(async () => {
    decoded.current = false; setResult(null); setError(''); setTorch(false); setZoom(0); setPhase('starting');
    let p = perm;
    if (!p?.granted) p = await requestPerm();
    if (!p?.granted) { setError('Camera access is blocked. Allow the camera for FORGE FITNESS in your phone settings, or choose a photo of the QR instead.'); setPhase('error'); return; }
    setCamKey((k) => k + 1);
  }, [perm, requestPerm]);

  useEffect(() => { if (open) begin(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [open]);
  useEffect(() => {
    if (phase !== 'scanning') return;
    const a = Animated.loop(Animated.sequence([Animated.timing(line, { toValue: 1, duration: 2200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }), Animated.timing(line, { toValue: 0, duration: 2200, easing: Easing.inOut(Easing.ease), useNativeDriver: true })]));
    a.start(); return () => a.stop();
  }, [phase, line]);

  const handle = useCallback(async (text: string) => {
    if (decoded.current) return; decoded.current = true;
    Vibration.vibrate(60); setPhase('processing');
    try { setResult(await onScan(text)); } catch { setResult({ ok: false, message: 'Something went wrong. Please try again.' }); }
    setPhase('result');
  }, [onScan]);

  const fromImage = async () => {
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1 });
    if (r.canceled || !r.assets?.[0]) return;
    try {
      const found = await scanFromURLAsync(r.assets[0].uri, ['qr']);
      if (!found.length) throw new Error('none');
      decoded.current = false; await handle(found[0].data);
    } catch { setResult({ ok: false, message: 'No QR code was found in that image.' }); setPhase('result'); }
  };

  const side = Math.floor(Math.min(box.w, box.h) * FRAME); const top = box.h * 0.44 - side / 2; const left = (box.w - side) / 2;
  const dim = 'rgba(0,0,0,.62)';
  const onLayout = (e: LayoutChangeEvent) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height });
  const showFrame = phase === 'scanning' || phase === 'starting';

  return (
    <Modal visible={open} animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={{ flex: 1, backgroundColor: '#000' }} accessibilityViewIsModal>
        <View style={{ flex: 1, backgroundColor: '#0b0c0a' }} onLayout={onLayout}>
          {perm?.granted && phase !== 'error' && (
            <CameraView key={camKey} style={StyleSheet.absoluteFill} facing={facing} enableTorch={torch} zoom={zoom}
              barcodeScannerSettings={{ barcodeTypes: ['qr'] }} onBarcodeScanned={phase === 'scanning' ? ({ data }) => handle(data) : undefined}
              onCameraReady={() => setPhase((p) => (p === 'starting' ? 'scanning' : p))}
              onMountError={() => { setError('The camera could not be started.'); setPhase('error'); }} />
          )}
          {showFrame && box.w > 0 && (<>
            <View pointerEvents="none" style={[StyleSheet.absoluteFill]}>
              <View style={{ position: 'absolute', left: 0, right: 0, top: 0, height: top, backgroundColor: dim }} />
              <View style={{ position: 'absolute', left: 0, right: 0, top: top + side, bottom: 0, backgroundColor: dim }} />
              <View style={{ position: 'absolute', left: 0, width: left, top, height: side, backgroundColor: dim }} />
              <View style={{ position: 'absolute', right: 0, width: left, top, height: side, backgroundColor: dim }} />
              <View style={{ position: 'absolute', left, top, width: side, height: side }}>
                <Corner pos="tl" /><Corner pos="tr" /><Corner pos="bl" /><Corner pos="br" />
                {phase === 'scanning' && <Animated.View style={{ position: 'absolute', left: '6%', right: '6%', height: 2, backgroundColor: colors.accent, shadowColor: colors.accent, shadowOpacity: 1, shadowRadius: 8, elevation: 6, transform: [{ translateY: line.interpolate({ inputRange: [0, 1], outputRange: [side * 0.06, side * 0.94] }) }] }} />}
              </View>
              <Text style={{ position: 'absolute', left: 20, right: 20, top: top + side + 18, textAlign: 'center', color: '#e9e4da', fontFamily: fonts.body, fontSize: 15 }}>{phase === 'starting' ? 'Starting camera…' : hint}</Text>
            </View>
          </>)}

          {/* top bar */}
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, paddingTop: insets.top + 12, paddingHorizontal: 16, paddingBottom: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(0,0,0,.55)' }}>
            <Text style={{ color: '#fff', fontFamily: fonts.headingBold, fontSize: 14, letterSpacing: 1.2, textTransform: 'uppercase' }}>{title}</Text>
            <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Close scanner" hitSlop={10} style={{ width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: 'rgba(255,255,255,.35)', backgroundColor: 'rgba(0,0,0,.55)', alignItems: 'center', justifyContent: 'center' }}><Ionicons name="close" size={22} color="#fff" /></Pressable>
          </View>

          {phase === 'processing' && <View style={[styles.state]}><ActivityIndicator size="large" color={colors.accent} /><Text style={styles.stateTitle}>Checking…</Text></View>}
          {phase === 'result' && result && (
            <View style={styles.state} accessibilityLiveRegion="polite">
              <View style={[styles.big, { backgroundColor: result.ok ? colors.accent : '#ff6b5e' }]}><Ionicons name={result.ok ? 'checkmark' : 'close'} size={48} color={colors.onAccent} /></View>
              <Text style={styles.stateTitle}>{result.ok ? 'Success' : 'Could not scan'}</Text>
              <Text style={styles.stateMsg}>{result.message}</Text>
              <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
                {!result.ok && <Pressable onPress={begin} style={[styles.btn, { backgroundColor: colors.accent, borderColor: colors.accent }]}><Text style={[styles.btnTx, { color: colors.onAccent }]}>Try again</Text></Pressable>}
                <Pressable onPress={onClose} style={styles.btn}><Text style={styles.btnTx}>{result.ok ? 'Done' : 'Close'}</Text></Pressable>
              </View>
            </View>)}
          {phase === 'error' && (
            <View style={styles.state}>
              <View style={[styles.big, { backgroundColor: '#ff6b5e' }]}><Ionicons name="close" size={48} color={colors.onAccent} /></View>
              <Text style={styles.stateTitle}>Camera unavailable</Text><Text style={styles.stateMsg}>{error}</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center', marginTop: 8 }}>
                <Pressable onPress={begin} style={[styles.btn, { backgroundColor: colors.accent, borderColor: colors.accent }]}><Text style={[styles.btnTx, { color: colors.onAccent }]}>Try again</Text></Pressable>
                <Pressable onPress={fromImage} style={styles.btn}><Text style={styles.btnTx}>Use a photo</Text></Pressable>
                <Pressable onPress={onClose} style={styles.btn}><Text style={styles.btnTx}>Close</Text></Pressable>
              </View>
            </View>)}
        </View>

        {phase === 'scanning' && (
          <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, alignItems: 'center', gap: 14, paddingTop: 20, paddingHorizontal: 16, paddingBottom: insets.bottom + 24, backgroundColor: 'rgba(0,0,0,.7)' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, width: 300, maxWidth: '80%' }}>
              <Ionicons name="search" size={18} color="#fff" />
              <Pressable style={{ flex: 1, height: 36, justifyContent: 'center' }} accessibilityRole="adjustable" accessibilityLabel="Zoom"
                onLayout={(e) => { trackW.current = e.nativeEvent.layout.width || 1; }}
                onPressIn={(e) => setZoom(Math.max(0, Math.min(1, e.nativeEvent.locationX / trackW.current)) * 0.6)}>
                <View style={{ height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,.3)' }}><View style={{ height: 4, borderRadius: 2, width: `${(zoom / 0.6) * 100}%`, backgroundColor: colors.accent }} /></View>
                <View style={{ position: 'absolute', left: `${(zoom / 0.6) * 100}%`, marginLeft: -9, width: 18, height: 18, borderRadius: 9, backgroundColor: colors.accent }} />
              </Pressable>
            </View>
            <View style={{ flexDirection: 'row', gap: 18 }}>
              <Round icon={torch ? 'flashlight' : 'flashlight-outline'} label="Flashlight" on={torch} onPress={() => setTorch((v) => !v)} />
              <Round icon="camera-reverse-outline" label="Switch camera" onPress={() => { setTorch(false); setFacing((f) => (f === 'back' ? 'front' : 'back')); }} />
              <Round icon="image-outline" label="Choose an image" onPress={fromImage} />
            </View>
          </View>)}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  state: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,.82)', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24 },
  big: { width: 88, height: 88, borderRadius: 44, alignItems: 'center', justifyContent: 'center' },
  stateTitle: { color: '#fff', fontFamily: fonts.heading, fontSize: 22 },
  stateMsg: { color: '#e9e4da', fontFamily: fonts.body, fontSize: 16, textAlign: 'center', maxWidth: 340, lineHeight: 23 },
  btn: { minHeight: 48, paddingHorizontal: 22, borderRadius: 12, borderWidth: 1.5, borderColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  btnTx: { color: '#fff', fontFamily: fonts.headingBold, fontSize: 15 },
});
