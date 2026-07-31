import React, { useEffect, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import LinearGradient from 'react-native-linear-gradient';
import { revealSacredTree, RevealedTree } from '../data/rashiVanData';
import { getBottomInset, getTopInset } from '../utils/layout';
import {
  ApiError,
  rashiTreesService,
  staticDataService,
  type StaticRashiItem,
} from '../api';

type Props = {
  onBack: () => void;
};

const formatDate = (date: Date) => {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const year = date.getFullYear();
  return `${month}/${day}/${year}`;
};

const formatDobApi = (date: Date) => {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const year = date.getFullYear();
  return `${year}-${month}-${day}`;
};

const formatTime = (date: Date) => {
  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const period = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${String(hours).padStart(2, '0')}:${minutes} ${period}`;
};

export default function RashiVanScreen({ onBack }: Props) {
  const [birthDate, setBirthDate] = useState(new Date(1995, 6, 14));
  const [birthTime, setBirthTime] = useState(new Date(1995, 6, 14, 6, 42));
  const [birthLocation, setBirthLocation] = useState('Indore, MP');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [revealed, setRevealed] = useState<RevealedTree | null>(null);
  const [apiRashi, setApiRashi] = useState<StaticRashiItem[]>([]);
  const [revealing, setRevealing] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await staticDataService.getRashiVan();
        if (mounted && Array.isArray(data)) {
          setApiRashi(data);
        }
      } catch (error) {
        if (__DEV__) {
          console.warn(
            error instanceof ApiError
              ? error.message
              : 'Failed to load rashi data',
          );
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const handleReveal = async () => {
    if (revealing) return;
    setRevealing(true);
    const local = revealSacredTree(birthDate);
    try {
      const api = await rashiTreesService.byDob(formatDobApi(birthDate));
      setRevealed({
        ...local,
        tree: {
          ...local.tree,
          name: api.tree || local.tree.name,
          significance:
            api.description ||
            (api.benefits?.length ? api.benefits.join(' ') : local.tree.significance),
        },
      });
    } catch {
      if (apiRashi.length > 0) {
        const rashiName = local.rashi.name.toLowerCase();
        const match =
          apiRashi.find(item => item.rashi.toLowerCase().includes(rashiName)) ||
          apiRashi.find(item =>
            rashiName.includes(item.rashi.split('(')[0].trim().toLowerCase()),
          );
        if (match) {
          setRevealed({
            ...local,
            tree: {
              ...local.tree,
              name: match.tree,
              significance: match.benefits,
            },
          });
          setRevealing(false);
          return;
        }
      }
      setRevealed(local);
    } finally {
      setRevealing(false);
    }
  };

  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (event.type === 'dismissed') {
      setShowDatePicker(false);
      return;
    }
    if (selectedDate) {
      setBirthDate(selectedDate);
      setRevealed(null);
    }
    if (Platform.OS === 'ios') {
      setShowDatePicker(false);
    }
  };

  const handleTimeChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    if (event.type === 'dismissed') {
      setShowTimePicker(false);
      return;
    }
    if (selectedDate) {
      setBirthTime(selectedDate);
    }
    if (Platform.OS === 'ios') {
      setShowTimePicker(false);
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
        <Pressable style={styles.headerBtn}>
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
          <Text style={styles.formTitle}>Enter your birth details</Text>
          <Text style={styles.formSubtitle}>
            For Vedic Rashi + Nakshatra alignment
          </Text>

          <Text style={styles.fieldLabel}>Date of birth</Text>
          <Pressable
            style={styles.inputRow}
            onPress={() => setShowDatePicker(true)}>
            <Text style={styles.pickerValue}>{formatDate(birthDate)}</Text>
            <Text style={styles.inputIcon}>📅</Text>
          </Pressable>

          {showDatePicker && (
            <DateTimePicker
              value={birthDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              maximumDate={new Date()}
              onChange={handleDateChange}
            />
          )}

          <Text style={styles.fieldLabel}>Exact time of birth</Text>
          <Pressable
            style={styles.inputRow}
            onPress={() => setShowTimePicker(true)}>
            <Text style={styles.pickerValue}>{formatTime(birthTime)}</Text>
            <Text style={styles.inputIcon}>🕐</Text>
          </Pressable>

          {showTimePicker && (
            <DateTimePicker
              value={birthTime}
              mode="time"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              is24Hour={false}
              onChange={handleTimeChange}
            />
          )}

          <Text style={styles.fieldLabel}>Birth location (optional)</Text>
          <View style={styles.inputRow}>
            <Text style={styles.locationIcon}>📍</Text>
            <TextInput
              style={[styles.input, styles.inputWithLeftIcon]}
              value={birthLocation}
              onChangeText={setBirthLocation}
              placeholder="City, State"
              placeholderTextColor="#9ca3af"
            />
          </View>

          <Pressable style={styles.revealBtnWrap} onPress={handleReveal}>
            <LinearGradient
              colors={['#0c4820', '#2b964f']}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.revealBtn}>
              <Text style={styles.revealBtnText}>✨  Reveal my sacred tree</Text>
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
                <View style={[styles.badge, styles.badgeNakshatra]}>
                  <Text style={styles.badgeIcon}>⭐</Text>
                  <Text style={styles.badgeLabel}>Nakshatra</Text>
                  <Text style={styles.badgeValue}>{revealed.nakshatra}</Text>
                </View>
                <View style={[styles.badge, styles.badgeDeity]}>
                  <Text style={styles.badgeIcon}>🌙</Text>
                  <Text style={styles.badgeLabel}>Deity</Text>
                  <Text style={styles.badgeValue}>{revealed.rashi.deity}</Text>
                </View>
              </View>

              <View style={styles.significanceBox}>
                <Text style={styles.significanceTitle}>Spiritual significance</Text>
                <Text style={styles.significanceText}>{revealed.tree.significance}</Text>
              </View>

              <View style={styles.statsRow}>
                <View style={styles.statPill}>
                  <Text style={styles.statText}>Karma +{revealed.tree.karma}%</Text>
                </View>
                <View style={styles.statPill}>
                  <Text style={styles.statText}>Vitality +{revealed.tree.vitality}%</Text>
                </View>
                <View style={styles.statPill}>
                  <Text style={styles.statText}>Harmony +{revealed.tree.harmony}%</Text>
                </View>
              </View>

              <Pressable style={styles.plantBtnWrap}>
                <LinearGradient
                  colors={['#0c4820', '#2b964f']}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={styles.plantBtn}>
                  <Text style={styles.plantBtnText}>
                    Plant my {revealed.tree.name} 🌱
                  </Text>
                </LinearGradient>
              </Pressable>
            </View>
          )}
        </View>
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
    ...StyleSheet.absoluteFillObject,
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
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#0a3617',
    paddingVertical: 14,
  },
  inputWithLeftIcon: {
    paddingLeft: 4,
  },
  inputIcon: {
    fontSize: 16,
    marginLeft: 8,
  },
  locationIcon: {
    fontSize: 16,
    marginRight: 4,
  },
  revealBtnWrap: {
    borderRadius: 28,
    overflow: 'hidden',
    marginTop: 8,
  },
  revealBtn: {
    paddingVertical: 16,
    alignItems: 'center',
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
});
