import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Linking,
  Modal,
  PermissionsAndroid,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import LinearGradient from 'react-native-linear-gradient';
import AppIcon from '../components/AppIcon';
import { Vehicle } from '../data/vehiclesData';
import { getBottomInset, getTopInset } from '../utils/layout';
import {
  callCenterService,
  getAccessToken,
  getRefreshToken,
  getStoredPhone,
  getStoredUser,
  geoService,
  leaderboardService,
  missionProgressService,
  notificationsService,
  personsService,
  saveSession,
  staticDataService,
  unwrapList,
  uploadsService,
  usersService,
  type AuthUser,
  type ConstituencyItem,
} from '../api';
import { getCurrentCoords } from '../utils/deviceLocation';

const { width } = Dimensions.get('window');

interface ProfileScreenProps {
  vehicles: Vehicle[];
  onLogout: () => void | Promise<void>;
  onMyVehicles?: () => void;
  onVehicleIdentity?: () => void;
  onRashiVan?: () => void;
  onAdminPreview?: () => void;
  onNotifications?: () => void;
  onCommunity?: () => void;
}

function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'PP';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function digitsForTel(value: string) {
  return value.replace(/[^\d+]/g, '');
}

function digitsForWa(value: string) {
  const digits = value.replace(/\D/g, '');
  if (digits.length === 10) return `91${digits}`;
  return digits;
}

function constituencyLabel(item: ConstituencyItem) {
  return (
    item.vidhanSabhaName ||
    item.name ||
    item.id ||
    item._id ||
    'Constituency'
  );
}

export default function ProfileScreen({
  vehicles,
  onLogout,
  onMyVehicles,
  onVehicleIdentity,
  onRashiVan,
  onAdminPreview,
  onNotifications,
  onCommunity,
}: ProfileScreenProps) {
  const [stats, setStats] = useState({
    vehicleCount: vehicles.length,
    totalTrees: 0,
    totalCo2: 0,
  });
  const [name, setName] = useState('Citizen');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('—');
  const [avatar, setAvatar] = useState<string | undefined>();
  const [notifCount, setNotifCount] = useState(0);
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [vidhanSabha, setVidhanSabha] = useState('');
  const [constituencies, setConstituencies] = useState<ConstituencyItem[]>([]);
  const [loadingConstituencies, setLoadingConstituencies] = useState(false);
  const [hasPerson, setHasPerson] = useState(false);
  const [communityTitle, setCommunityTitle] = useState('Eco Circle');
  const [communitySubtitle, setCommunitySubtitle] = useState(
    'Loading contributors…',
  );
  const [sosPhone, setSosPhone] = useState('');
  const [sosWhatsapp, setSosWhatsapp] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState<Date | undefined>();
  const [showDobPicker, setShowDobPicker] = useState(false);

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
    const c = String(user.city || user.district || '');
    const s = String(user.state || '');
    const p = String(user.pincode || '');
    setCity(c);
    setStateName(s);
    setPincode(p);
    if (c || s) setLocation([c, s].filter(Boolean).join(', '));
    const av = user.avatar ? String(user.avatar) : '';
    setAvatar(av || undefined);
    setAvatarUrl(av);
    const sabha = String(user.vidhanSabha || '');
    if (sabha) {
      setVidhanSabha(sabha);
      setCommunityTitle(`${sabha} Eco Circle`);
    }
    if (user.dob) {
      const parsed = new Date(user.dob);
      if (!isNaN(parsed.getTime())) {
        setDateOfBirth(parsed);
      }
    }
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
        const person = await personsService.getMe();
        if (mounted) setHasPerson(Boolean(person?.personId || person?._id));
      } catch {
        if (mounted) setHasPerson(false);
      }
      try {
        const personStats = await personsService.getMyStats();
        let sabha = '';
        if (mounted && personStats) {
          setStats({
            vehicleCount:
              Number(personStats.linkedVehicles) || vehicles.length,
            totalTrees: Number(personStats.treesAssigned) || 0,
            totalCo2: Math.round(Number(personStats.co2OffsetKg) || 0),
          });
          sabha = String(personStats.vidhanSabha || '');
          if (sabha) {
            setVidhanSabha(sabha);
            setCommunityTitle(`${sabha} Eco Circle`);
            setLocation(sabha);
          }
        }
        const [boardMe, mission] = await Promise.all([
          leaderboardService.me({ scope: 'vidhan-sabha', limit: 50 }).catch(
            () => null,
          ),
          missionProgressService.get().catch(() => null),
        ]);
        if (mounted) {
          const area = boardMe?.vidhanSabha || sabha;
          const participants = Number(boardMe?.totalParticipants) || 0;
          const year = Number(mission?.targetYear) || new Date().getFullYear();
          if (area) setCommunityTitle(`${area} Eco Circle`);
          setCommunitySubtitle(
            participants > 0
              ? `${participants.toLocaleString('en-IN')} contributors · Mission ${year}`
              : `Mission ${year} · Open ranks`,
          );
        }
      } catch {
        if (mounted) {
          setStats(prev => ({ ...prev, vehicleCount: vehicles.length }));
          setCommunitySubtitle('Open ranks to see your circle');
        } 
      }
      try {
        let phoneContact = '';
        try {
          const info = await staticDataService.getInitiativeInfo();
          phoneContact =
            info?.support?.prahri?.phone || info?.support?.phone || '';
        } catch {
          // fall through to call-center
        }
        try {
          const contacts = await callCenterService.list({
            page: 1,
            limit: 50,
            status: 'Active',
          });
          const list = unwrapList(contacts as any) as Array<{
            contactType?: string;
            contactValue?: string;
            assignedPerson?: string;
          }>;
          const pick = (type: string) => {
            const typed = list.filter(
              c =>
                (c.contactType || '').toLowerCase() === type.toLowerCase(),
            );
            const prahri = typed.find(c =>
              (c.assignedPerson || '').toLowerCase().includes('prahri'),
            );
            return prahri?.contactValue || typed[0]?.contactValue || '';
          };
          phoneContact = pick('Phone') || phoneContact;
        } catch {
          // keep initiative-info contacts
        }
        if (mounted) {
          setSosPhone(phoneContact);
          setSosWhatsapp('+918817678133');
        }
      } catch {
        // leave empty
      }
      try {
        const unread = await notificationsService.getUnreadCount();
        if (mounted) setNotifCount(Number(unread.unreadCount) || 0);
      } catch {
        // permission may block
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const state = stateName.trim();
    const dist = district.trim();
    if (!state || !dist || !editOpen) {
      setConstituencies([]);
      return;
    }
    let mounted = true;
    setLoadingConstituencies(true);
    (async () => {
      try {
        const list = await geoService.listConstituencies({
          state,
          district: dist,
        });
        if (mounted) setConstituencies(Array.isArray(list) ? list : []);
      } catch {
        if (mounted) setConstituencies([]);
      } finally {
        if (mounted) setLoadingConstituencies(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [stateName, district, editOpen]);

  const openCallSos = () => {
    if (!sosPhone) {
      Alert.alert('Call SOS', 'No helpline number configured yet.');
      return;
    }
    void Linking.openURL(`tel:${digitsForTel(sosPhone)}`);
  };

  const openWhatsAppSupport = () => {
    if (!sosWhatsapp) {
      Alert.alert('WhatsApp', 'No WhatsApp support number configured yet.');
      return;
    }
    const digits = digitsForWa(sosWhatsapp);
    void Linking.openURL(`https://wa.me/${digits}`);
  };
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

  const pickAvatarFromAsset = async (asset: {
    uri?: string;
    fileName?: string;
    type?: string;
  }) => {
    if (!asset.uri) return;
    setUploadingAvatar(true);
    try {
      const uploaded = await uploadsService.upload(
        {
          uri: asset.uri,
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

  const pickAvatar = () => {
    if (uploadingAvatar) return;
    Alert.alert('Profile photo', 'Choose image source', [
      {
        text: 'Camera',
        onPress: () => {
          void (async () => {
            if (Platform.OS === 'android') {
              const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.CAMERA,
                {
                  title: 'Camera permission',
                  message: 'Allow camera to take your profile photo',
                  buttonPositive: 'Allow',
                  buttonNegative: 'Deny',
                },
              );
              if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
                Alert.alert('Permission needed', 'Camera permission is required.');
                return;
              }
            }
            const result = await launchCamera({
              mediaType: 'photo',
              quality: 0.8,
              saveToPhotos: false,
            });
            if (result.didCancel || !result.assets?.[0]) return;
            await pickAvatarFromAsset(result.assets[0]);
          })();
        },
      },
      {
        text: 'Gallery',
        onPress: () => {
          void (async () => {
            const result = await launchImageLibrary({
              mediaType: 'photo',
              quality: 0.8,
              selectionLimit: 1,
            });
            if (result.didCancel || !result.assets?.[0]) return;
            await pickAvatarFromAsset(result.assets[0]);
          })();
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const phoneDigits = editPhone.replace(/\D/g, '').slice(-10);
      const avatarValue = avatarUrl.trim();
      const updated = (await usersService.updateMe({
        firstName: firstName.trim() || undefined,
        lastName: lastName.trim() || undefined,
        phone: phoneDigits.length === 10 ? phoneDigits : undefined,
        district: city.trim() || undefined,
        city: city.trim() || undefined,
        state: stateName.trim() || undefined,
        dob: dateOfBirth ? dateOfBirth.toISOString() : undefined,
        avatar:
          avatarValue.startsWith('http') || avatarValue === ''
            ? avatarValue
            : undefined,
        vidhanSabha: vidhanSabha.trim() || undefined,
        pincode: pincode.trim() || undefined,
      })) as AuthUser & Record<string, unknown>;
      applyUser(updated);
      const personName =
        `${firstName.trim()} ${lastName.trim()}`.trim() || name;
      const personPayload = {
        name: personName,
        mobile: phoneDigits.length === 10 ? phoneDigits : editPhone.trim(),
        address: city.trim() || undefined,
        city: city.trim() || undefined,
        state: stateName.trim() || undefined,
        photo:
          avatarValue.startsWith('http') ? avatarValue : undefined,
      };
      try {
        if (hasPerson) {
          await personsService.updateMe(personPayload);
        } else {
          const stored = await getStoredUser();
          await personsService.selfRegister({
            ...personPayload,
            email: stored?.email,
          });
          setHasPerson(true);
        }
      } catch (personError) {
        if (!hasPerson) {
          try {
            const existing = await personsService.getMe();
            if (existing?.personId || existing?._id) {
              await personsService.updateMe(personPayload);
              setHasPerson(true);
            } else {
              throw personError;
            }
          } catch {
            throw personError;
          }
        }
      }
      if (vidhanSabha.trim()) {
        setVidhanSabha(vidhanSabha.trim());
        setCommunityTitle(`${vidhanSabha.trim()} Eco Circle`);
        setLocation(vidhanSabha.trim());
      }
      const [accessToken, refreshToken, stored] = await Promise.all([
        getAccessToken(),
        getRefreshToken(),
        getStoredUser(),
      ]);
      if (accessToken && refreshToken && stored) {
        await saveSession({
          accessToken,
          refreshToken,
          phone: phoneDigits || stored.phone,
          user: {
            ...stored,
            firstName: String(updated.firstName || stored.firstName),
            lastName: String(updated.lastName || stored.lastName),
            phone: String(updated.phone || stored.phone || ''),
            district: String(updated.district || updated.city || ''),
            city: String(updated.city || ''),
            state: String(updated.state || ''),
            pincode: String(updated.pincode || ''),
            dob: updated.dob ? String(updated.dob) : undefined,
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
          <Pressable style={styles.bellButton} onPress={onNotifications}>
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

        {!hasPerson ? (
          <Pressable
            style={styles.addProfileBanner}
            onPress={() => setEditOpen(true)}>
            <View style={styles.actionIconCircle}>
              <AppIcon name="account-plus" size={24} color="#ffffff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.actionCardTitle}>Add profile</Text>
              <Text style={styles.addProfileSubtitle}>
                Save your name, photo and location
              </Text>
            </View>
            <Text style={styles.chevronIcon}>›</Text>
          </Pressable>
        ) : null}

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
          <Pressable style={styles.communityCard} onPress={onCommunity}>
            <View style={styles.communityIconCircle}>
              <AppIcon name="account-group" size={28} color="#126e35" />
            </View>
            <View style={styles.communityDetails}>
              <Text style={styles.communityTitle}>{communityTitle}</Text>
              <Text style={styles.communitySubtitle}>{communitySubtitle}</Text>
            </View>
            <Text style={styles.chevronIcon}>›</Text>
          </Pressable>
        </View>

        {/* SUPPORT SECTION */}
        <View style={styles.supportSection}>
          <Text style={styles.sectionTitle}>Support</Text>
          <View style={styles.supportGrid}>
            <Pressable style={styles.supportCard} onPress={openWhatsAppSupport}>
              <AppIcon name="whatsapp" size={24} color="#126e35" style={styles.supportIcon} />
              <Text style={styles.supportTitle}>WhatsApp</Text>
              <Text style={styles.supportSubtitle}>
                {sosWhatsapp || '—'}
              </Text>
            </Pressable>

            <Pressable style={styles.supportCard} onPress={openCallSos}>
              <AppIcon name="phone" size={24} color="#126e35" style={styles.supportIcon} />
              <Text style={styles.supportTitle}>Call SOS</Text>
              <Text style={styles.supportSubtitle}>
                {sosPhone || '—'}
              </Text>
            </Pressable>
          </View>
        </View>

      </ScrollView>

      <View style={styles.signOutFooter}>
        <Pressable
          style={styles.signOutButton}
          onPress={() => {
            void onLogout();
          }}
          hitSlop={12}
          android_ripple={{ color: '#fecdd3' }}>
          <AppIcon name="logout" size={20} color="#e11d48" />
          <Text style={styles.signOutText}>Sign out</Text>
        </Pressable>
      </View>

      <Modal visible={editOpen} animationType="slide" transparent>
        <KeyboardAvoidingView
          style={styles.modalRoot}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => !saving && setEditOpen(false)}
          />
          <View style={styles.modalCard}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>
                {hasPerson ? 'Edit profile' : 'Add profile'}
              </Text>
              <Pressable
                style={styles.modalCloseBtn}
                onPress={() => setEditOpen(false)}
                disabled={saving}
                hitSlop={8}>
                <Text style={styles.modalCloseText}>✕</Text>
              </Pressable>
            </View>

            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.modalScroll}>
              <View style={styles.modalPhotoRow}>
                <View style={styles.modalAvatar}>
                  {avatarUrl || avatar ? (
                    <Image
                      source={{ uri: avatarUrl || avatar }}
                      style={styles.modalAvatarImage}
                    />
                  ) : (
                    <Text style={styles.modalAvatarInitials}>
                      {initialsFromName(
                        `${firstName} ${lastName}`.trim() || name,
                      )}
                    </Text>
                  )}
                </View>
                <Pressable
                  style={styles.modalPhotoBtn}
                  onPress={() => void pickAvatar()}
                  disabled={uploadingAvatar}>
                  {uploadingAvatar ? (
                    <ActivityIndicator color="#126e35" />
                  ) : (
                    <>
                      <AppIcon name="camera-outline" size={18} color="#126e35" />
                      <Text style={styles.modalPhotoBtnText}>
                        {avatarUrl ? 'Change photo' : 'Add photo'}
                      </Text>
                    </>
                  )}
                </Pressable>
              </View>

              <Text style={styles.modalLabel}>First name</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Enter first name"
                placeholderTextColor="#9ca3af"
                value={firstName}
                onChangeText={setFirstName}
              />
              <Text style={styles.modalLabel}>Last name</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Enter last name"
                placeholderTextColor="#9ca3af"
                value={lastName}
                onChangeText={setLastName}
              />
              <Text style={styles.modalLabel}>Date of Birth</Text>
              <Pressable onPress={() => setShowDobPicker(true)} style={styles.modalInput}>
                <Text style={{ color: dateOfBirth ? '#0a3617' : '#9ca3af' }}>
                  {dateOfBirth
                    ? dateOfBirth.toLocaleDateString('en-GB')
                    : 'Select Date of Birth'}
                </Text>
              </Pressable>
              {showDobPicker && (
                <DateTimePicker
                  value={dateOfBirth || new Date()}
                  mode="date"
                  display="default"
                  maximumDate={new Date()}
                  onChange={(event, selectedDate) => {
                    setShowDobPicker(false);
                    if (event.type === 'set' && selectedDate) {
                      setDateOfBirth(selectedDate);
                    }
                  }}
                />
              )}
              <Text style={styles.modalLabel}>Mobile</Text>
              <TextInput
                style={[styles.modalInput, styles.modalInputReadonly]}
                value={editPhone}
                editable={false}
              />
              <Text style={styles.modalHint}>Linked to your login number</Text>

              <Text style={styles.modalLabel}>City</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="City"
                placeholderTextColor="#9ca3af"
                value={city}
                onChangeText={setCity}
              />
              <Text style={styles.modalLabel}>State</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="State"
                placeholderTextColor="#9ca3af"
                value={stateName}
                onChangeText={setStateName}
              />
              <Text style={styles.modalLabel}>Pincode</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Pincode"
                placeholderTextColor="#9ca3af"
                value={pincode}
                onChangeText={setPincode}
                keyboardType="numeric"
                maxLength={6}
              />

            </ScrollView>

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
        </KeyboardAvoidingView>
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
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: getBottomInset(16),
    maxHeight: '85%',
    zIndex: 1,
  },
  modalHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#d1d5db',
    marginBottom: 12,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0a3617',
  },
  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '700',
  },
  modalScroll: {
    paddingBottom: 8,
  },
  modalPhotoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  modalAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#eaf4ee',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  modalAvatarImage: {
    width: '100%',
    height: '100%',
  },
  modalAvatarInitials: {
    fontSize: 22,
    fontWeight: '800',
    color: '#126e35',
  },
  modalPhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#86efac',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  modalPhotoBtnText: {
    color: '#126e35',
    fontWeight: '700',
    fontSize: 14,
  },
  modalLabel: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '600',
    marginBottom: 6,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#dce8df',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#0a3617',
    backgroundColor: '#f0faf4',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 12,
  },
  modalInputReadonly: {
    backgroundColor: '#f3f4f6',
    color: '#6b7280',
    borderColor: '#e5e7eb',
  },
  modalHint: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: -8,
    marginBottom: 12,
  },
  constituencyBlock: {
    marginBottom: 8,
  },
  constituencyWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  constituencyChip: {
    borderWidth: 1,
    borderColor: '#dce8df',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f0faf4',
  },
  constituencyChipActive: {
    borderColor: '#136e35',
    backgroundColor: '#d1fae5',
  },
  constituencyChipText: {
    color: '#374151',
    fontWeight: '600',
    fontSize: 13,
    maxWidth: 160,
  },
  constituencyChipTextActive: {
    color: '#136e35',
  },
  avatarPickBtn: {
    borderWidth: 1,
    borderColor: '#86efac',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    marginBottom: 8,
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
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eef2ef',
  },
  modalCancel: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalCancelText: {
    color: '#374151',
    fontWeight: '700',
  },
  modalSave: {
    flex: 1,
    backgroundColor: '#126e35',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalSaveText: {
    color: '#fff',
    fontWeight: '800',
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
    paddingBottom: 24,
  },
  signOutFooter: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: getBottomInset(88),
    backgroundColor: '#f4f9f4',
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
  addProfileBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 28,
    padding: 16,
    marginBottom: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 3,
  },
  addProfileSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
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
    gap: 8,
    borderWidth: 1,
    borderColor: '#fecdd3',
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
