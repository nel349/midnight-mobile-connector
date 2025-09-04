import { Tabs } from 'expo-router';
import React from 'react';

import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
      }}>
      {/* Expo Router auto-discovers all .tsx files in this directory */}
      {/* We can optionally customize specific tabs like this: */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Debug',
          tabBarLabel: 'Debug',
        }}
      />
      <Tabs.Screen
        name="wamr-test"
        options={{
          title: 'WAMR Test',
          tabBarLabel: 'WAMR',
        }}
      />
      <Tabs.Screen
        name="externref-test"
        options={{
          title: 'externref Test',
          tabBarLabel: 'externref',
        }}
      />
      <Tabs.Screen
        name="midnight-test"
        options={{
          title: 'Midnight Test',
          tabBarLabel: 'Midnight',
        }}
      />
    </Tabs>
  );
}