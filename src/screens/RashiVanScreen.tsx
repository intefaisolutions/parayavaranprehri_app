import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { RevealedTree } from '../data/rashiVanData';
import { getBottomInset, getTopInset } from '../utils/layout';
import {
  ApiError,
  PublicRashiTree,
  getStoredPhone,
  getStoredUser,
  rashiPlantRequestsService,
  rashiTreesService,
  type RashiPlantRequestApi,
} from '../api';

type Props = {
  onBack: () => void;
  onNotifications?: () => void;
};

const RASHI_OPTIONS = [
  { label: 'Mesh (Aries)', apiValue: 'Aries', key: 'mesh' },
  { label: 'Vrishabh (Taurus)', apiValue: 'Taurus', key: 'vrishabh' },
  { label: 'Mithun (Gemini)', apiValue: 'Gemini', key: 'mithun' },
  { label: 'Kark (Cancer)', apiValue: 'Cancer', key: 'kark' },
  { label: 'Singh (Leo)', apiValue: 'Leo', key: 'singh' },
  { label: 'Kanya (Virgo)', apiValue: 'Virgo', key: 'kanya' },
  { label: 'Tula (Libra)', apiValue: 'Libra', key: 'tula' },
  { label: 'Vrishchik (Scorpio)', apiValue: 'Scorpio', key: 'vrishchik' },
  { label: 'Dhanu (Sagittarius)', apiValue: 'Sagittarius', key: 'dhanu' },
  { label: 'Makar (Capricorn)', apiValue: 'Capricorn', key: 'makar' },
  { label: 'Kumbh (Aquarius)', apiValue: 'Aquarius', key: 'kumbh' },
  { label: 'Meen (Pisces)', apiValue: 'Pisces', key: 'meen' },
] as const;

type RashiOption = (typeof RASHI_OPTIONS)[number];

export default function RashiVanScreen({ onBack, onNotifications }: Props) {
  const [selectedRashi, setSelectedRashi] = useState<RashiOption | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [revealed, setRevealed] = useState<RevealedTree | null>(null);
  const [apiTree, setApiTree] = useState<PublicRashiTree | null>(null);
  const [revealing, setRevealing] = useState(false);
  const [planting, setPlanting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [myRequests, setMyRequests] = useState<RashiPlantRequestApi[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(true);

  const loadMyRequests = async () => {
    try {
      const list = await rashiPlantRequestsService.list({ mine: true });
      setMyRequests(Array.isArray(list) ? list : []);
    } catch {
      setMyRequests([]);
    } finally {
      setRequestsLoading(false);
    }
  };

  useEffect(() => {
    void loadMyRequests();
  }, []);

  const handleReveal = async () => {
    if (revealing) return;
    if (!selectedRashi) {
      setErrorMsg('Please select your Rashi.');
      setRevealed(null);
      setApiTree(null);
      return;
    }

    setErrorMsg('');
    setRevealing(true);
    try {
      const api = await rashiTreesService.byRashi(selectedRashi.apiValue);
      const primary =
        api.trees && api.trees.length > 0 ? api.trees[0] : undefined;
      const significance =
        api.description ||
        primary?.description ||
        (api.benefits?.length ? api.benefits.join(' · ') : '') ||
        (primary?.benefits?.length ? primary.benefits.join(' · ') : '') ||
        'Sacred tree aligned with your Rashi.';

      const deity = api.deity || primary?.deity;
      const nakshatras = api.nakshatras?.length
        ? api.nakshatras
        : primary?.nakshatras || [];
      const karma =
        typeof api.karmaBonus === 'number'
          ? api.karmaBonus
          : typeof primary?.karmaBonus === 'number'
            ? primary.karmaBonus
            : undefined;
      const vitality =
        typeof api.vitalityBonus === 'number'
          ? api.vitalityBonus
          : typeof primary?.vitalityBonus === 'number'
            ? primary.vitalityBonus
            : undefined;
      const harmony =
        typeof api.harmonyBonus === 'number'
          ? api.harmonyBonus
          : typeof primary?.harmonyBonus === 'number'
            ? primary.harmonyBonus
            : undefined;

      setApiTree(api);
      setRevealed({
        rashi: {
          key: selectedRashi.key,
          name: selectedRashi.label.split(' (')[0],
          deity,
          nakshatras,
          trees: [],
        },
        nakshatra: nakshatras[0],
        tree: {
          name: api.tree || primary?.tree || 'Sacred Tree',
          significance,
          karma,
          vitality,
          harmony,
        },
      });
    } catch (error) {
      setRevealed(null);
      setApiTree(null);
      setErrorMsg(
        error instanceof ApiError
          ? error.message
          : 'Could not load sacred tree for this Rashi.',
      );
    } finally {
      setRevealing(false);
    }
  };

  const handlePlantRequest = async () => {
    if (planting || !revealed || !selectedRashi) return;

    setPlanting(true);
    try {
      const [user, storedPhone] = await Promise.all([
        getStoredUser(),
        getStoredPhone(),
      ]);
      const userName = [user?.firstName, user?.lastName]
        .filter(Boolean)
        .join(' ')
        .trim();
      const mobile = (user?.phone || storedPhone || '').trim();

      if (!userName || !mobile) {
        Alert.alert(
          'Login required',
          'Please log in to the app so we can send your details with the plantation request to admin.',
        );
        return;
      }

      await rashiPlantRequestsService.create({
        rashiName: selectedRashi.apiValue,
        rashiNameHindi: apiTree?.rashiHindi,
        recommendedTree: revealed.tree.name,
        scientificName: apiTree?.scientificName,
        localName: apiTree?.localName,
        treeDescription: apiTree?.description || revealed.tree.significance,
        benefits: apiTree?.benefits,
        remarks: `Sacred Tree request from Rashi Van · ${selectedRashi.label}`,
        userName,
        mobile,
        email: user?.email,
        district: user?.district,
        state: user?.state,
        userId: user?.id,
      });
      Alert.alert(
        'Request submitted',
        `Your request to plant ${revealed.tree.name} has been sent to the admin for review.`,
      );
      void loadMyRequests();
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.status === 401 || error.status === 404
            ? 'Plantation request service is not available on the server yet. Please try again after the backend is updated.'
            : error.message
          : 'Failed to create plantation request. Please try again.';
      Alert.alert('Could not submit', message);
    } finally {
      setPlanting(false);
    }
  };

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: getTopInset(10) }]}>
        <Pressable style={styles.headerBtn} onPress={onBack}>
          <Text style={styles.backIcon}>←</Text>
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Rashi & Nakshatra Van</Text>
          <Text style={styles.headerSubtitle}>Your sacred Vedic tree</Text>
        </View>
        <Pressable
          style={styles.headerBtn}
          onPress={onNotifications}
          disabled={!onNotifications}>
          <Text style={styles.bellIcon}>🔔</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: getBottomInset(32) },
        ]}
        showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={['#0c3d2e', '#1a5c45', '#8b4513']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.graphicCard}>
          <View style={styles.dotGrid}>
            {Array.from({ length: 80 }).map((_, i) => (
              <View key={i} style={styles.dot} />
            ))}
          </View>

          <Text style={styles.vatikaText}>|| नव वाटिका ||</Text>

          <View style={styles.orbitContainer}>
            <View style={[styles.orbitRing, styles.orbitRingOuter]}>
              {[0, 45, 90, 135, 180, 225, 270, 315].map(deg => (
                <View
                  key={deg}
                  style={[
                    styles.orbitDot,
                    {
                      transform: [
                        { rotate: `${deg}deg` },
                        { translateY: -88 },
                      ],
                    },
                  ]}
                />
              ))}
            </View>
            <View style={[styles.orbitRing, styles.orbitRingMid]} />
            <View style={[styles.orbitRing, styles.orbitRingInner]} />
            <View style={styles.sunCircle}>
              <Text style={styles.sunIcon}>☀️</Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Select your Rashi</Text>
          <Text style={styles.formSubtitle}>
            For Vedic Rashi + Nakshatra alignment
          </Text>

          <Text style={styles.fieldLabel}>What is your Rashi?</Text>
          <Pressable
            style={styles.inputRow}
            onPress={() => setDropdownOpen(true)}>
            <Text
              style={[
                styles.pickerValue,
                !selectedRashi && styles.pickerPlaceholder,
              ]}>
              {selectedRashi ? selectedRashi.label : 'Select your Rashi'}
            </Text>
            <Text style={styles.inputIcon}>▼</Text>
          </Pressable>

          {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

          <Pressable
            style={styles.revealBtnWrap}
            onPress={() => void handleReveal()}
            disabled={revealing}>
            <LinearGradient
              colors={['#0c4820', '#2b964f']}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.revealBtn}>
              {revealing ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.revealBtnText}>
                  ✨  Reveal my sacred tree
                </Text>
              )}
            </LinearGradient>
          </Pressable>

          {revealed && (
            <View style={styles.resultCard}>
              <View style={styles.resultHeader}>
                <View style={styles.treeIconBox}>
                  <Text style={styles.treeIcon}>🌳</Text>
                </View>
                <View style={styles.resultHeaderText}>
                  <Text style={styles.resultLabel}>RECOMMENDED SACRED TREE</Text>
                  <Text style={styles.resultTreeName}>{revealed.tree.name}</Text>
                  <Text style={styles.resultSubtext}>
                    शुभ वृक्ष · for {revealed.rashi.name}
                  </Text>
                </View>
              </View>

              <View style={styles.badgeRow}>
                <View style={[styles.badge, styles.badgeRashi]}>
                  <Text style={styles.badgeIcon}>☀️</Text>
                  <Text style={styles.badgeLabel}>Rashi</Text>
                  <Text style={styles.badgeValue}>{revealed.rashi.name}</Text>
                </View>
                {revealed.nakshatra ? (
                  <View style={[styles.badge, styles.badgeNakshatra]}>
                    <Text style={styles.badgeIcon}>⭐</Text>
                    <Text style={styles.badgeLabel}>Nakshatra</Text>
                    <Text style={styles.badgeValue}>{revealed.nakshatra}</Text>
                  </View>
                ) : null}
                {revealed.rashi.deity ? (
                  <View style={[styles.badge, styles.badgeDeity]}>
                    <Text style={styles.badgeIcon}>🌙</Text>
                    <Text style={styles.badgeLabel}>Deity</Text>
                    <Text style={styles.badgeValue}>
                      {revealed.rashi.deity}
                    </Text>
                  </View>
                ) : null}
              </View>

              <View style={styles.significanceBox}>
                <Text style={styles.significanceTitle}>Spiritual significance</Text>
                <Text style={styles.significanceText}>
                  {revealed.tree.significance}
                </Text>
              </View>

              {typeof revealed.tree.karma === 'number' ||
              typeof revealed.tree.vitality === 'number' ||
              typeof revealed.tree.harmony === 'number' ? (
                <View style={styles.statsRow}>
                  {typeof revealed.tree.karma === 'number' ? (
                    <View style={styles.statPill}>
                      <Text style={styles.statText}>
                        Karma +{revealed.tree.karma}%
                      </Text>
                    </View>
                  ) : null}
                  {typeof revealed.tree.vitality === 'number' ? (
                    <View style={styles.statPill}>
                      <Text style={styles.statText}>
                        Vitality +{revealed.tree.vitality}%
                      </Text>
                    </View>
                  ) : null}
                  {typeof revealed.tree.harmony === 'number' ? (
                    <View style={styles.statPill}>
                      <Text style={styles.statText}>
                        Harmony +{revealed.tree.harmony}%
                      </Text>
                    </View>
                  ) : null}
                </View>
              ) : null}

              <Pressable
                style={styles.plantBtnWrap}
                onPress={() => void handlePlantRequest()}
                disabled={planting}>
                <LinearGradient
                  colors={['#0c4820', '#2b964f']}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={styles.plantBtn}>
                  {planting ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.plantBtnText}>
                      Plant my {revealed.tree.name} 🌱
                    </Text>
                  )}
                </LinearGradient>
              </Pressable>
            </View>
          )}
        </View>

        <View style={styles.requestsCard}>
          <Text style={styles.requestsTitle}>My plant requests</Text>
          {requestsLoading ? (
            <ActivityIndicator color="#136e35" style={{ marginVertical: 12 }} />
          ) : myRequests.length === 0 ? (
            <Text style={styles.requestsEmpty}>
              No requests yet. Reveal your tree and submit a plantation request.
            </Text>
          ) : (
            myRequests.map(req => (
              <View key={req._id || req.requestId} style={styles.requestRow}>
                <View style={styles.requestTextCol}>
                  <Text style={styles.requestTree}>{req.recommendedTree}</Text>
                  <Text style={styles.requestMeta}>
                    {req.rashiName}
                    {req.createdAt
                      ? ` · ${new Date(req.createdAt).toLocaleDateString('en-GB')}`
                      : ''}
                  </Text>
                </View>
                <View style={styles.requestStatusPill}>
                  <Text style={styles.requestStatusText}>{req.status}</Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      <Modal
        visible={dropdownOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setDropdownOpen(false)}>
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setDropdownOpen(false)}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>What is your Rashi?</Text>
            <ScrollView style={styles.modalList}>
              {RASHI_OPTIONS.map(option => {
                const active = selectedRashi?.apiValue === option.apiValue;
                return (
                  <Pressable
                    key={option.apiValue}
                    style={[
                      styles.modalOption,
                      active && styles.modalOptionActive,
                    ]}
                    onPress={() => {
                      setSelectedRashi(option);
                      setRevealed(null);
                      setApiTree(null);
                      setErrorMsg('');
                      setDropdownOpen(false);
                    }}>
                    <Text
                      style={[
                        styles.modalOptionText,
                        active && styles.modalOptionTextActive,
                      ]}>
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
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
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eef2ef',
  },
  headerBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 20,
    color: '#111827',
    fontWeight: '600',
  },
  bellIcon: {
    fontSize: 18,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0a3617',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  scrollContent: {
    padding: 20,
  },
  graphicCard: {
    borderRadius: 24,
    minHeight: 280,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    paddingVertical: 28,
  },

  dotGrid: {
    ...StyleSheet.absoluteFill,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-evenly',
    alignContent: 'space-evenly',
    padding: 12,
    opacity: 0.25,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#fff',
    margin: 6,
  },
  vatikaText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fbbf24',
    letterSpacing: 1,
    marginBottom: 24,
    zIndex: 1,
  },
  orbitContainer: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  orbitRing: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    borderStyle: 'dashed',
    borderRadius: 999,
  },
  orbitRingOuter: {
    width: 180,
    height: 180,
  },
  orbitRingMid: {
    width: 130,
    height: 130,
  },
  orbitRingInner: {
    width: 80,
    height: 80,
  },
  orbitDot: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fbbf24',
    marginLeft: -4,
    marginTop: -4,
  },
  sunCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(125, 211, 160, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sunIcon: {
    fontSize: 28,
  },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  requestsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  requestsTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0a3617',
    marginBottom: 10,
  },
  requestsEmpty: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
  },
  requestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e5e7eb',
  },
  requestTextCol: {
    flex: 1,
    paddingRight: 10,
  },
  requestTree: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  requestMeta: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  requestStatusPill: {
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  requestStatusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
    textTransform: 'capitalize',
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0a3617',
    marginBottom: 4,
  },
  formSubtitle: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 8,
    marginTop: 4,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0faf4',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#dce8df',
    paddingHorizontal: 14,
    marginBottom: 14,
  },
  pickerValue: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#0a3617',
    paddingVertical: 14,
  },
  pickerPlaceholder: {
    color: '#9ca3af',
    fontWeight: '500',
  },
  inputIcon: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 8,
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 13,
    marginBottom: 8,
    marginTop: -6,
  },
  revealBtnWrap: {
    borderRadius: 28,
    overflow: 'hidden',
    marginTop: 8,
  },
  revealBtn: {
    paddingVertical: 16,
    alignItems: 'center',
    minHeight: 52,
    justifyContent: 'center',
  },
  revealBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  resultCard: {
    marginTop: 20,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#b8dfc4',
    backgroundColor: '#fff',
    padding: 18,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  treeIconBox: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: '#e6f3eb',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  treeIcon: {
    fontSize: 28,
  },
  resultHeaderText: {
    flex: 1,
  },
  resultLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9ca3af',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  resultTreeName: {
    fontSize: 26,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 2,
  },
  resultSubtext: {
    fontSize: 13,
    color: '#6b7280',
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  badge: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  badgeRashi: {
    backgroundColor: '#fff7ed',
  },
  badgeNakshatra: {
    backgroundColor: '#f3e8ff',
  },
  badgeDeity: {
    backgroundColor: '#ecfdf5',
  },
  badgeIcon: {
    fontSize: 16,
    marginBottom: 4,
  },
  badgeLabel: {
    fontSize: 11,
    color: '#9ca3af',
    marginBottom: 2,
  },
  badgeValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
  },
  significanceBox: {
    backgroundColor: '#f0faf4',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
  },
  significanceTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0a3617',
    marginBottom: 6,
  },
  significanceText: {
    fontSize: 13,
    color: '#4b5563',
    lineHeight: 20,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  statPill: {
    backgroundColor: '#e6f3eb',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  statText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0a3617',
  },
  plantBtnWrap: {
    borderRadius: 28,
    overflow: 'hidden',
  },
  plantBtn: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  plantBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    maxHeight: '70%',
    paddingTop: 18,
    paddingBottom: 8,
    overflow: 'hidden',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0a3617',
    paddingHorizontal: 18,
    marginBottom: 10,
  },
  modalList: {
    paddingHorizontal: 10,
  },
  modalOption: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 4,
  },
  modalOptionActive: {
    backgroundColor: '#e6f3eb',
  },
  modalOptionText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  modalOptionTextActive: {
    color: '#0a3617',
    fontWeight: '800',
  },
});
