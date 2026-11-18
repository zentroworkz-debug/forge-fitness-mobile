import { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'FORGE FITNESS',
  slug: 'forge-fitness',
  scheme: 'forgefitness',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'dark',
  backgroundColor: '#111210',
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'com.forgefitness.app',
    infoPlist: {
      NSCameraUsageDescription: 'FORGE FITNESS uses the camera only to scan the gym attendance QR code.',
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  android: {
    package: 'com.forgefitness.app',
    versionCode: 1,
    adaptiveIcon: { foregroundImage: './assets/adaptive-icon.png', backgroundColor: '#13181C' },
    permissions: ['CAMERA', 'POST_NOTIFICATIONS'],
    // After creating a Firebase project, add google-services.json here to enable remote push on Android.
  },
  web: { favicon: './assets/favicon.png' },
  plugins: [
    'expo-router',
    'expo-secure-store',
    ['expo-splash-screen', { image: './assets/splash-icon.png', resizeMode: 'contain', backgroundColor: '#111210' }],
    ['expo-camera', { cameraPermission: 'FORGE FITNESS uses the camera only to scan the gym attendance QR code.' }],
    ['expo-image-picker', { photosPermission: 'FORGE FITNESS reads a photo you choose only to find an attendance QR code in it.' }],
    ['expo-notifications', { icon: './assets/notification-icon.png', color: '#c6ff3d' }],
    'expo-sharing',
  ],
  experiments: { typedRoutes: false },
  extra: {
    // Filled in by `eas init`; see README.
    eas: { projectId: process.env.EAS_PROJECT_ID || '6e940f6c-427b-48b8-9624-5a730fc2aacd' },
  },
};
export default config;
