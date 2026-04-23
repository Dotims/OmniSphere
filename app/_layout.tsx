import {
    DarkTheme,
    DefaultTheme,
    ThemeProvider,
    type Theme,
} from "@react-navigation/native";
import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";
import { SafeAreaProvider } from "react-native-safe-area-context";

import BootAnimation from "@/components/BootAnimation";
import { LightPalette, Palette } from "@/constants/theme";
import { SettingsProvider, useSettings } from "@/hooks/use-settings";
import {
    StartupReadinessProvider,
    useStartupReadiness,
} from "@/hooks/use-startup-readiness";
import { createQueryClient } from "@/services/query-client";

// Prevent native splash screen from hiding automatically
SplashScreen.preventAutoHideAsync().catch(() => {});

// custom dark theme — true black + vibrant blue
const OmniSphereDarkTheme: Theme = {
  ...DarkTheme,
  dark: true,
  colors: {
    ...DarkTheme.colors,
    primary: Palette.blue,
    background: Palette.void,
    card: Palette.void,
    text: Palette.snow,
    border: "transparent",
    notification: Palette.blue,
  },
  fonts: DarkTheme.fonts,
};

// singleton query client
const queryClient = createQueryClient();

// root layout
export const unstable_settings = {
  anchor: "(tabs)",
};

const OmniSphereLightTheme: Theme = {
  ...DefaultTheme,
  dark: false,
  colors: {
    ...DefaultTheme.colors,
    primary: LightPalette.blue,
    background: LightPalette.void,
    card: LightPalette.void,
    text: LightPalette.snow,
    border: "transparent",
    notification: LightPalette.blue,
  },
  fonts: DefaultTheme.fonts,
};

function AppContent() {
  const [isBooting, setIsBooting] = React.useState(true);
  const [hasHiddenNativeSplash, setHasHiddenNativeSplash] =
    React.useState(false);
  const { theme, activePalette } = useSettings();
  const { isReadyForNativeSplash } = useStartupReadiness();
  const isDark = theme === "dark";

  React.useEffect(() => {
    if (!isReadyForNativeSplash || hasHiddenNativeSplash) {
      return;
    }

    let isMounted = true;

    SplashScreen.hideAsync()
      .catch(() => {})
      .finally(() => {
        if (isMounted) {
          setHasHiddenNativeSplash(true);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isReadyForNativeSplash, hasHiddenNativeSplash]);

  return (
    <ThemeProvider value={isDark ? OmniSphereDarkTheme : OmniSphereLightTheme}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: activePalette.void },
          animation: "slide_from_right",
        }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="modal"
          options={{
            presentation: "modal",
            title: "Modal",
            headerShown: true,
            headerStyle: { backgroundColor: activePalette.void },
            headerTintColor: activePalette.snow,
          }}
        />
      </Stack>
      <StatusBar style={isDark ? "light" : "dark"} />
      {hasHiddenNativeSplash && isBooting && (
        <BootAnimation onComplete={() => setIsBooting(false)} />
      )}
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <SettingsProvider>
            <StartupReadinessProvider>
              <AppContent />
            </StartupReadinessProvider>
          </SettingsProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Palette.void,
  },
});
