import React from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppIcon, { IconName } from './AppIcon';
import { getBottomInset } from '../utils/layout';

const { width } = Dimensions.get('window');

type TabType = 'home' | 'vehicles' | 'map' | 'ranks' | 'profile';

interface BottomNavProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

const tabs: {
  id: TabType;
  label: string;
  icon: IconName;
}[] = [
  { id: 'home', label: 'Home', icon: 'home' },
  { id: 'vehicles', label: 'Vehicles', icon: 'car-side' },
  { id: 'map', label: 'Map', icon: 'map' },
  { id: 'ranks', label: 'Ranks', icon: 'trophy' },
  { id: 'profile', label: 'Profile', icon: 'account' },
];

export default function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const insets = useSafeAreaInsets();
  
  return (
    <View style={[styles.bottomNavContainer, { bottom: Math.max(10, insets.bottom + 10) }]}>
      <View style={styles.bottomNav}>
        {tabs.map(tab => {
          const isActive = activeTab === tab.id;

          if (isActive) {
            return (
              <Pressable key={tab.id} style={styles.navItemActive}>
                <AppIcon name={tab.icon} size={18} color="#ffffff" />
                <Text style={styles.navTextActive}>{tab.label}</Text>
              </Pressable>
            );
          }

          return (
            <Pressable
              key={tab.id}
              style={styles.navItem}
              onPress={() => onTabChange(tab.id)}>
              <AppIcon name={tab.icon} size={22} color="#6b7280" />
              <Text style={styles.navText}>{tab.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bottomNavContainer: {
    position: 'absolute',
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 40,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
    alignItems: 'center',
    width: width - 40,
    justifyContent: 'space-between',
  },
  navItemActive: {
    backgroundColor: '#126e35',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    gap: 6,
  },
  navTextActive: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  navItem: {
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  navText: {
    fontSize: 10,
    color: '#6b7280',
    fontWeight: '500',
    marginTop: 4,
  },
});
