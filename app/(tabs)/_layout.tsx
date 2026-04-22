import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TabBarBackground } from '@/components/ui/TabBarBackground';
import { useSettings } from '@/hooks/use-settings';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const R = 28; // Radius of the concave horns
  const baseHeight = 54;
  const totalHeight = baseHeight + insets.bottom + R;

  const { activePalette } = useSettings();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: activePalette.blue,
        tabBarInactiveTintColor: activePalette.steel,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: () => <TabBarBackground />,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: 'transparent',
          borderTopColor: 'transparent',
          borderTopWidth: 0,
          elevation: 0,
          height: totalHeight,
          // Push the icons down by R so they sit in the flat area
          paddingTop: R + 4,
          paddingBottom: insets.bottom,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          letterSpacing: 0.3,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Globe',
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="globe" color={color} />,
        }}
      />
      <Tabs.Screen
        name="validators"
        options={{
          title: 'Nodes',
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="server.rack" color={color} />,
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: 'Analytics',
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="waveform.path.ecg" color={color} />,
        }}
      />
      <Tabs.Screen
        name="news"
        options={{
          title: 'Feed',
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="bolt.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="slider.horizontal.3" color={color} />,
        }}
      />
    </Tabs>
  );
}
