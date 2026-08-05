import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import LinearGradient from 'react-native-linear-gradient';
import AppIcon from '../components/AppIcon';
import { computeProfileStats, Vehicle } from '../data/vehiclesData';
import { getBottomInset, getTopInset } from '../utils/layout';
import {
  getAccessToken,
  getRefreshToken,
  getStoredPhone,
  getStoredUser,
  geoService,
  notificationsService,
  saveSession,
  unwrapList,
  uploadsService,
  usersService,
  type AuthUser,
} from '../api';
import { getCurrentCoords } from '../utils/deviceLocation';

const { width } = Dimensions.get('window');

interface ProfileScreenProps {
  vehicles: Vehicle[];
  onLogout: () => void;
  onMyVehicles?: () => void;
  onVehicleIdentity?: () => void;
  onRashiVan?: () => void;
  onAdminPreview?: () => void;
}

function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'PP';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
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
  const [name, setName] = useState('Citizen');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('Indore, Madhya Pradesh');
  const [avatar, setAvatar] = useState<string | undefined>();
  const [notifCount, setNotifCount] = useState(0);
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [district, setDistrict] = useState('');
  const [stateName, setStateName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [vidhanSabha, setVidhanSabha] = useState('');

  const applyUser = (user: Partial<AuthUser> & Record<string, unknown>) => {
    const fn = String(user.firstName || '');
    const ln = String(user.lastName || '');
    const full = `${fn} ${ln}`.trim();
    if (full) setName(full);
    setFirstName(fn);
    setLastName(ln);
    const ph = String(user.phone || '');
    if (ph) {
      setPhone(ph.startsWith('+') ? ph : `+91 ${ph}`);
      setEditPhone(ph.replace(/^\+91\s?/, ''));
    }
    const d = String(user.district || '');
    const s = String(user.state || '');
    setDistrict(d);
    setStateName(s);
    if (d || s) setLocation([d, s].filter(Boolean).join(', '));
    const av = user.avatar ? String(user.avatar) : '';
    setAvatar(av || undefined);
    setAvatarUrl(av);
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      const [user, storedPhone] = await Promise.all([
        getStoredUser(),
        getStoredPhone(),
      ]);
      if (!mounted) return;
      if (user) applyUser(user as AuthUser & Record<string, unknown>);
      if (storedPhone) {
        setPhone(`+91 ${storedPhone}`);
        setEditPhone(storedPhone);
      }
      try {
        const me = (await usersService.getMe()) as AuthUser &
          Record<string, unknown>;
        if (mounted && me) applyUser(me);
      } catch {
        // keep stored profile
      }
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

  const detectLocation = async () => {
    if (detectingLocation) return;
    setDetectingLocation(true);
    try {
      const coords = await getCurrentCoords();
      if (!coords) {
        Alert.alert(
          'Location unavailable',
          'Allow location permission and try again.',
        );
        return;
      }
      const result = await geoService.reverse(
        coords.latitude,
        coords.longitude,
      );
      if (result.district) setDistrict(result.district);
      if (result.state) setStateName(result.state);
      if (result.vidhanSabha) setVidhanSabha(result.vidhanSabha);
      const locParts = [
        result.vidhanSabha,
        result.district,
        result.state,
      ].filter(Boolean);
      if (locParts.length) setLocation(locParts.join(', '));
      Alert.alert(
        'Location detected',
        [
          result.vidhanSabha ? `Vidhan Sabha: ${result.vidhanSabha}` : null,
          result.district ? `District: ${result.district}` : null,
          result.state ? `State: ${result.state}` : null,
        ]
          .filter(Boolean)
          .join('\n') || 'Location saved to form. Tap Save to update profile.',
      );
    } catch (error) {
      Alert.alert(
        'Detect failed',
        error instanceof Error ? error.message : 'Could not reverse-geocode',
      );
    } finally {
      setDetectingLocation(false);
    }
  };

  const pickAvatar = async () => {
    if (uploadingAvatar) return;
    const result = await launchImageLibrary({
      mediaType: 'photo',
      quality: 0.8,
      selectionLimit: 1,
    });
    if (result.didCancel || !result.assets?.[0]?.uri) return;
    const asset = result.assets[0];
    setUploadingAvatar(true);
    try {
      const uploaded = await uploadsService.upload(
        {
          uri: asset.uri!,
          name: asset.fileName || `avatar-${Date.now()}.jpg`,
          type: asset.type || 'image/jpeg',
        },
        'users',
      );
      if (uploaded?.url) {
        setAvatarUrl(uploaded.url);
        setAvatar(uploaded.url);
      }
    } catch (error) {
      Alert.alert(
        'Upload failed',
        error instanceof Error ? error.message : 'Could not upload avatar',
      );
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const updated = (await usersService.updateMe({
        firstName: firstName.trim() || undefined,
        lastName: lastName.trim() || undefined,
        phone: editPhone.trim() || undefined,
        district: district.trim() || undefined,
        state: stateName.trim() || undefined,
        avatar: avatarUrl.trim() || '',
      })) as AuthUser & Record<string, unknown>;
      applyUser(updated);
      const [accessToken, refreshToken, stored] = await Promise.all([
        getAccessToken(),
        getRefreshToken(),
        getStoredUser(),
      ]);
      if (accessToken && refreshToken && stored) {
        await saveSession({
          accessToken,
          refreshToken,
          phone: editPhone.trim() || undefined,
          user: {
            ...stored,
            firstName: String(updated.firstName || stored.firstName),
            lastName: String(updated.lastName || stored.lastName),
            phone: String(updated.phone || stored.phone || ''),
            district: String(updated.district || ''),
            state: String(updated.state || ''),
            avatar: updated.avatar ? String(updated.avatar) : undefined,
          },
        });
      }
      setEditOpen(false);
      Alert.alert('Saved', 'Your profile was updated.');
    } catch (error) {
      Alert.alert(
        'Update failed',
        error instanceof Error ? error.message : 'Could not update profile',
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.root}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Profile</Text>
        <View style={styles.headerActions}>
          <Pressable style={styles.bellButton} onPress={() => setEditOpen(true)}>
            <AppIcon name="pencil-outline" size={18} color="#0a3617" />
          </Pressable>
          <Pressable style={styles.bellButton}>
            <AppIcon name="bell-outline" size={20} color="#0a3617" />
            {notifCount > 0 ? (
              <View style={styles.notifDot}>
                <Text style={styles.notifDotText}>
                  {notifCount > 9 ? '9+' : String(notifCount)}
                </Text>
              </View>
            ) : null}
          </Pressable>
        </View>
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
              {avatar ? (
                <Image source={{ uri: avatar }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarText}>{initialsFromName(name)}</Text>
              )}
            </View>
            <View style={styles.profileDetails}>
              <Text style={styles.profileName}>{name}</Text>
              <Text style={styles.profilePhone}>{phone}</Text>
              <Text style={styles.profileLocation}>{location}</Text>
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

      <Modal visible={editOpen} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Edit profile</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="First name"
              value={firstName}
              onChangeText={setFirstName}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Last name"
              value={lastName}
              onChangeText={setLastName}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Phone"
              keyboardType="phone-pad"
              value={editPhone}
              onChangeText={setEditPhone}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="District"
              value={district}
              onChangeText={setDistrict}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="State"
              value={stateName}
              onChangeText={setStateName}
            />
            {vidhanSabha ? (
              <Text style={styles.vidhanHint}>Vidhan Sabha: {vidhanSabha}</Text>
            ) : null}
            <Pressable
              style={styles.avatarPickBtn}
              onPress={() => void detectLocation()}
              disabled={detectingLocation}>
              {detectingLocation ? (
                <ActivityIndicator color="#126e35" />
              ) : (
                <Text style={styles.avatarPickText}>
                  Detect Vidhan Sabha from GPS
                </Text>
              )}
            </Pressable>
            <Pressable
              style={styles.avatarPickBtn}
              onPress={() => void pickAvatar()}
              disabled={uploadingAvatar}>
              {uploadingAvatar ? (
                <ActivityIndicator color="#126e35" />
              ) : (
                <Text style={styles.avatarPickText}>
                  {avatarUrl ? 'Change photo' : 'Pick photo from gallery'}
                </Text>
              )}
            </Pressable>
            <TextInput
              style={styles.modalInput}
              placeholder="Or paste avatar image URL"
              value={avatarUrl}
              onChangeText={setAvatarUrl}
              autoCapitalize="none"
            />
            <View style={styles.modalActions}>
              <Pressable
                style={styles.modalCancel}
                onPress={() => setEditOpen(false)}
                disabled={saving}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={styles.modalSave}
                onPress={handleSaveProfile}
                disabled={saving}>
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.modalSaveText}>Save</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#f4f9f4',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  notifDot: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#e11d48',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  notifDotText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 999,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: getBottomInset(24),
    gap: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0a3617',
    marginBottom: 4,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#111827',
    backgroundColor: '#f9fafb',
  },
  avatarPickBtn: {
    borderWidth: 1,
    borderColor: '#86efac',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
  },
  avatarPickText: {
    color: '#126e35',
    fontWeight: '700',
    fontSize: 14,
  },
  vidhanHint: {
    fontSize: 13,
    color: '#166534',
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  modalCancel: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalCancelText: {
    color: '#374151',
    fontWeight: '600',
  },
  modalSave: {
    flex: 1,
    backgroundColor: '#126e35',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalSaveText: {
    color: '#fff',
    fontWeight: '700',
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
    position: 'relative',
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
