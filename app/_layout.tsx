import { AppStateProvider } from '@/utils/store';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
} from '@expo-google-fonts/inter';
import {
  PlayfairDisplay_400Regular,
  PlayfairDisplay_700Bold,
  PlayfairDisplay_700Bold_Italic,
  useFonts,
} from '@expo-google-fonts/playfair-display';
import { Stack, useGlobalSearchParams, usePathname } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { PostHogProvider } from 'posthog-react-native';
import React, { useEffect, useRef } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { posthog } from '@/src/config/posthog';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    PlayfairDisplay_400Regular,
    PlayfairDisplay_700Bold,
    PlayfairDisplay_700Bold_Italic,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });

  const pathname = usePathname();
  const params = useGlobalSearchParams();
  const previousPathname = useRef<string | undefined>(undefined);

  // Manual screen tracking for Expo Router
  // @see https://docs.expo.dev/router/reference/screen-tracking/
  useEffect(() => {
    if (previousPathname.current !== pathname) {
      posthog.screen(pathname, {
        previous_screen: previousPathname.current ?? null,
        ...params,
      });
      previousPathname.current = pathname;
    }
  }, [pathname, params]);

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <PostHogProvider
        client={posthog}
        autocapture={{
          captureScreens: false, // Manual tracking with Expo Router
          captureTouches: true,
          propsToCapture: ['testID'],
          maxElementsCaptured: 20,
        }}
      >
        <AppStateProvider>
          <StatusBar style="light" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: '#0B0D2E' },
              animation: 'fade',
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen name="login" />
            <Stack.Screen name="onboarding" />
            <Stack.Screen name="connected" />
            <Stack.Screen name="couple-setup" />
            <Stack.Screen name="(main)" />
          </Stack>
        </AppStateProvider>
      </PostHogProvider>
    </SafeAreaProvider>
  );
}
