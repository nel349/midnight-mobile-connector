import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      initialRouteName="index"
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            // Use a transparent background on iOS to show the blur effect
            position: 'absolute',
          },
          default: {},
        }),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Wallet Builder',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="hammer.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="crypto-test"
        options={{
          title: 'Crypto Test',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="key.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="step2"
        options={{
          title: 'HD Wallet',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="star.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="multi-wallet"
        options={{
          title: 'Multi-Wallet',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="creditcard.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}
