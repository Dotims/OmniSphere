import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Palette } from '@/constants/theme';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Palette.blue,
        tabBarInactiveTintColor: Palette.steel,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          backgroundColor: Palette.void,
          borderTopColor: 'transparent',
          borderTopWidth: 0,
          elevation: 0,
          paddingTop: 4,
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
      {/* Hide explore from tab bar but keep file for routing */}
      <Tabs.Screen
        name="explore"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
