import React, { useEffect, useState } from 'react';
import {
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import AppIcon from '../components/AppIcon';
import { computeProfileStats, Vehicle } from '../data/vehiclesData';
import { getBottomInset, getTopInset } from '../utils/layout';
import {
  getStoredPhone,
  getStoredUser,
  notificationsService,
  unwrapList,
} from '../api';

const { width } = Dimensions.get('window');

interface ProfileScreenProps {
  vehicles: Vehicle[];
  onLogout: () => void;
  onMyVehicles?: () => void;
  onVehicleIdentity?: () => void;
  onRashiVan?: () => void;
  onAdminPreview?: () => void;
}

export default function ProfileScreen({
  vehicles,
  onLogout,
  onMyVehicles,
  onVehicleIdentity,
  onRashiVan,
  onAdminPreview,
}: ProfileScreenProps) {
  const stats = computeProfileStats(vehicles);
  const [name, setName] = useState('Rahul Sharma');
  const [phone, setPhone] = useState('+91 98260 12345');
  const [location, setLocation] = useState('Indore, Madhya Pradesh');
  const [notifCount, setNotifCount] = useState(0);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const [user, storedPhone] = await Promise.all([
        getStoredUser(),
        getStoredPhone(),
      ]);
      if (!mounted) return;
      if (user) {
        setName(`${user.firstName} ${user.lastName}`.trim() || name);
        if (user.district || user.state) {
          setLocation(
            [user.district, user.state].filter(Boolean).join(', ') || location,
          );
        }
      }
      if (storedPhone) setPhone(`+91 ${storedPhone}`);
      try {
        const notifs = await notificationsService.list({ page: 1, limit: 20 });
        if (mounted) setNotifCount(unwrapList(notifs as any).length);
      } catch {
        // permission may block
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <View style={styles.root}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Profile</Text>
        <Pressable style={styles.bellButton}>
          <AppIcon name="bell-outline" size={20} color="#0a3617" />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* PROFILE CARD */}
        <LinearGradient
          colors={['#105e2d', '#2b964f']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.profileCard}
        >
          <View style={styles.profileInfoRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>RS</Text>
            </View>
            <View style={styles.profileDetails}>
              <Text style={styles.profileName}>{name}</Text>
              <Text style={styles.profilePhone}>{phone}</Text>
              <Text style={styles.profileLocation}>
                {location} · Joined 12 Aug 2024
              </Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Vehicles</Text>
              <Text style={styles.statValue}>{stats.vehicleCount}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Trees</Text>
              <Text style={styles.statValue}>{stats.totalTrees}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>CO₂ kg</Text>
              <Text style={styles.statValue}>{stats.totalCo2}</Text>
            </View>
          </View>
        </LinearGradient>

        {/* 2x2 ACTION GRID */}
        <View style={styles.actionGrid}>
          {/* Card 1 */}
          <Pressable style={styles.actionCard} onPress={onMyVehicles}>
            <View style={styles.actionIconCircle}>
              <AppIcon name="car-side" size={24} color="#ffffff" />
            </View>
            <Text style={styles.actionCardTitle}>My Vehicles</Text>
            <Text style={styles.actionCardSubtitle}>Open</Text>
          </Pressable>

          {/* Card 2 */}
          <Pressable style={styles.actionCard} onPress={onVehicleIdentity}>
            <View style={styles.actionIconCircle}>
              <AppIcon name="qrcode" size={24} color="#ffffff" />
            </View>
            <Text style={styles.actionCardTitle}>Vehicle Identity</Text>
            <Text style={styles.actionCardSubtitle}>Open</Text>
          </Pressable>

          {/* Card 3 */}
          <Pressable style={styles.actionCard} onPress={onRashiVan}>
            <View style={styles.actionIconCircle}>
              <AppIcon name="sprout" size={24} color="#ffffff" />
            </View>
            <Text style={styles.actionCardTitle}>Rashi & Nakshatra</Text>
            <Text style={styles.actionCardSubtitle}>Open</Text>
          </Pressable>

          {/* Card 4 */}
          <Pressable style={styles.actionCard} onPress={onAdminPreview}>
            <View style={styles.actionIconCircle}>
              <AppIcon name="chart-line" size={24} color="#ffffff" />
            </View>
            <Text style={styles.actionCardTitle}>Admin Preview</Text>
            <Text style={styles.actionCardSubtitle}>Open</Text>
          </Pressable>
        </View>

        {/* COMMUNITY SECTION */}
        <View style={styles.communitySection}>
          <Text style={styles.sectionTitle}>Community</Text>
          <Pressable style={styles.communityCard}>
            <View style={styles.communityIconCircle}>
              <AppIcon name="account-group" size={28} color="#126e35" />
            </View>
            <View style={styles.communityDetails}>
              <Text style={styles.communityTitle}>Indore Eco Circle</Text>
              <Text style={styles.communitySubtitle}>
                142 nearby contributors · Mission 2047
              </Text>
            </View>
            <Text style={styles.chevronIcon}>›</Text>
          </Pressable>
        </View>

        {/* SUPPORT SECTION */}
        <View style={styles.supportSection}>
          <Text style={styles.sectionTitle}>Support</Text>
          <View style={styles.supportGrid}>
            {/* WhatsApp */}
            <Pressable style={styles.supportCard}>
              <AppIcon name="whatsapp" size={24} color="#126e35" style={styles.supportIcon} />
              <Text style={styles.supportTitle}>WhatsApp</Text>
              <Text style={styles.supportSubtitle}>Chat support</Text>
            </Pressable>

            {/* Call SOS */}
            <Pressable style={styles.supportCard}>
              <AppIcon name="phone" size={24} color="#126e35" style={styles.supportIcon} />
              <Text style={styles.supportTitle}>Call SOS</Text>
              <Text style={styles.supportSubtitle}>1800-123-GREEN</Text>
            </Pressable>
          </View>
        </View>

        {/* SIGN OUT BUTTON */}
        <Pressable style={styles.signOutButton} onPress={onLogout}>
          <AppIcon name="logout" size={20} color="#e11d48" />
          <Text style={styles.signOutText}>Sign out</Text>
        </Pressable>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#f4f9f4',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: getTopInset(20),
    paddingBottom: 20,
    backgroundColor: '#f9fcf9',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0a3617',
  },
  bellButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  bellIcon: {
    fontSize: 20,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: getBottomInset(120), // Leave space for bottom nav
  },
  profileCard: {
    borderRadius: 32,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#0a3617',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  profileInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#6baf83',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  avatarText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 24,
  },
  profileDetails: {
    flex: 1,
  },
  profileName: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 4,
  },
  profilePhone: {
    color: '#b2e3c6',
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 2,
  },
  profileLocation: {
    color: '#90d1aa',
    fontSize: 11,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    borderRadius: 20,
    paddingVertical: 14,
    alignItems: 'center',
  },
  statLabel: {
    color: '#b2e3c6',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },
  statValue: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  actionCard: {
    width: (width - 56) / 2, // Account for padding (40) and gap (16)
    backgroundColor: '#fff',
    borderRadius: 28,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 3,
  },
  actionIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#126e35',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  actionIconImage: {
    width: 24,
    height: 24,
    tintColor: '#ffffff',
  },
  actionCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0a3617',
    marginBottom: 4,
  },
  actionCardSubtitle: {
    fontSize: 12,
    color: '#8b968f',
  },
  communitySection: {
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0a3617',
    marginBottom: 16,
  },
  communityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 32,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  communityIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#eaf4ee',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  communityIconImage: {
    width: 28,
    height: 28,
    tintColor: '#126e35',
  },
  communityDetails: {
    flex: 1,
  },
  communityTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0a3617',
    marginBottom: 4,
  },
  communitySubtitle: {
    fontSize: 12,
    color: '#6b7280',
  },
  chevronIcon: {
    fontSize: 24,
    color: '#6b7280',
    fontWeight: '300',
    marginLeft: 8,
  },
  supportSection: {
    marginBottom: 32,
  },
  supportGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  supportCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  supportIcon: {
    marginBottom: 12,
  },
  supportTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0a3617',
    marginBottom: 4,
  },
  supportSubtitle: {
    fontSize: 12,
    color: '#6b7280',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 30,
    paddingVertical: 16,
    marginBottom: 10,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 2,
  },
  signOutIcon: {
    width: 20,
    height: 20,
    marginRight: 8,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#e11d48',
  },
});
