import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Palette } from '@/constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TabBarBackground } from '@/components/ui/TabBarBackground';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const R = 28; // Radius of the concave horns
  const baseHeight = 54;
  const totalHeight = baseHeight + insets.bottom + R;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Palette.blue,
        tabBarInactiveTintColor: Palette.steel,
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
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="globe.americas.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="validators"
        options={{
          title: 'Validators',
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="person.3.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: 'Analytics',
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="chart.bar.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="news"
        options={{
          title: 'News',
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="newspaper.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
