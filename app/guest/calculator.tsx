import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { Btn, Card, Chip, Chips, Field, Header, Muted, Screen, Row } from '@/components/ui';
import { ACTIVITY, calculate, validateCalc } from '@/lib/calc';
import { colors, fonts, space } from '@/theme';

export default function Calculator() {
  const [age, setAge] = useState(''); const [h, setH] = useState(''); const [w, setW] = useState('');
  const [sex, setSex] = useState<'m' | 'f'>('m'); const [act, setAct] = useState(1.55);
  const [errs, setErrs] = useState<Record<string, string>>({}); const [res, setRes] = useState<ReturnType<typeof calculate> | null>(null);
  const run = () => {
    const n = { age: +age, heightCm: +h, weightKg: +w };
    const e = validateCalc(n); setErrs(e);
    if (Object.keys(e).length) { setRes(null); return; }
    setRes(calculate({ ...n, sex, activity: act }));
  };
  const reset = () => { setAge(''); setH(''); setW(''); setErrs({}); setRes(null); };
  return (
    <Screen>
      <Header eyebrow="Fitness calculator" title="Know your numbers" />
      <Muted>BMI, daily calories (Mifflin-St Jeor formula) and water intake (about 35 ml per kg).</Muted>
      <Field label="Age (years)" value={age} onChangeText={setAge} keyboardType="number-pad" error={errs.age} />
      <View style={{ gap: 6 }}><Text style={{ color: colors.muted, fontFamily: fonts.bodySemi, fontSize: 13 }}>Sex</Text><Row><Chip label="Male" active={sex === 'm'} onPress={() => setSex('m')} /><Chip label="Female" active={sex === 'f'} onPress={() => setSex('f')} /></Row></View>
      <Field label="Height (cm)" value={h} onChangeText={setH} keyboardType="decimal-pad" error={errs.height} />
      <Field label="Weight (kg)" value={w} onChangeText={setW} keyboardType="decimal-pad" error={errs.weight} />
      <View style={{ gap: 6 }}><Text style={{ color: colors.muted, fontFamily: fonts.bodySemi, fontSize: 13 }}>Activity level</Text><Chips>{ACTIVITY.map((a) => <Chip key={a.value} label={a.label} active={act === a.value} onPress={() => setAct(a.value)} />)}</Chips></View>
      <Row><Btn title="Calculate" onPress={run} style={{ flex: 1 }} /><Btn title="Reset" variant="ghost" onPress={reset} /></Row>
      {res && (
        <Card accent style={{ gap: space.md }}>
          <View><Muted>BMI</Muted><Text style={{ color: colors.fg, fontFamily: fonts.heading, fontSize: 26 }}>{res.bmi.toFixed(1)} <Text style={{ fontSize: 14, color: colors.muted, fontFamily: fonts.body }}>{res.category}</Text></Text></View>
          <View><Muted>Daily maintenance calories</Muted><Text style={{ color: colors.fg, fontFamily: fonts.heading, fontSize: 26 }}>{res.calories.toLocaleString('en-IN')} kcal</Text></View>
          <View><Muted>Water intake</Muted><Text style={{ color: colors.fg, fontFamily: fonts.heading, fontSize: 26 }}>{res.waterL.toFixed(1)} L</Text></View>
          <Muted>General estimates only. Not medical advice.</Muted>
        </Card>
      )}
    </Screen>
  );
}
