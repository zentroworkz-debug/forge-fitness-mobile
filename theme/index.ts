// Tokens copied from the website's CSS variables (src/styles/forge.css / index.html).
export const colors = {
  bg: '#111210',
  bg2: '#1a1b18',
  border: '#2c2e29',
  fg: '#f4efe6',
  muted: '#a9a499',
  accent: '#c6ff3d',
  onAccent: '#111210',
  danger: '#ff6b5b',
  warn: '#ffc857',
  ok: '#c6ff3d',
};
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };
export const radius = { sm: 8, md: 12, lg: 18, pill: 999 };
export const fonts = {
  heading: 'Montserrat_800ExtraBold',
  headingBold: 'Montserrat_700Bold',
  body: 'Barlow_400Regular',
  bodyMedium: 'Barlow_500Medium',
  bodySemi: 'Barlow_600SemiBold',
};
export const type = {
  h1: { fontFamily: fonts.heading, fontSize: 26, lineHeight: 32, color: colors.fg, letterSpacing: -0.5 },
  h2: { fontFamily: fonts.heading, fontSize: 21, lineHeight: 26, color: colors.fg },
  h3: { fontFamily: fonts.headingBold, fontSize: 16, lineHeight: 22, color: colors.fg },
  body: { fontFamily: fonts.body, fontSize: 15, lineHeight: 22, color: colors.fg },
  muted: { fontFamily: fonts.body, fontSize: 13, lineHeight: 18, color: colors.muted },
  eyebrow: { fontFamily: fonts.bodySemi, fontSize: 11, letterSpacing: 1.5, color: colors.accent, textTransform: 'uppercase' as const },
  label: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.muted },
};
