import { DarkTheme, ThemeProvider, type Theme } from '@react-navigation/native';
import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

import { Palette } from '@/constants/theme';
import { createQueryClient } from '@/services/query-client';

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
    border: 'transparent',
    notification: Palette.blue,
  },
  fonts: DarkTheme.fonts,
};


// singleton query client
const queryClient = createQueryClient();

// root layout
export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider value={OmniSphereDarkTheme}>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: Palette.void },
              animation: 'slide_from_right',
            }}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen
              name="modal"
              options={{
                presentation: 'modal',
                title: 'Modal',
                headerShown: true,
                headerStyle: { backgroundColor: Palette.void },
                headerTintColor: Palette.snow,
              }}
            />
          </Stack>
          <StatusBar style="light" />
        </ThemeProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Palette.void,
  },
});
