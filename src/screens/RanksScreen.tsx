import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import AppIcon from '../components/AppIcon';
import { getBottomInset, getTopInset } from '../utils/layout';
import {
  ApiError,
  leaderboardService,
  unwrapList,
  vidhanSabhasService,
  type LeaderboardEntry,
  type LeaderboardScope,
} from '../api';

const { width } = Dimensions.get('window');

const CATEGORIES = ['Vidhan Sabha', 'State', 'City'] as const;
type RankCategory = (typeof CATEGORIES)[number];

const SCOPE_BY_CATEGORY: Record<RankCategory, LeaderboardScope> = {
  'Vidhan Sabha': 'vidhan-sabha',
  State: 'state',
  City: 'city',
};

type SortBy = 'trees' | 'co2' | 'points';

const SORT_OPTIONS: SortBy[] = ['trees', 'co2', 'points'];

const SORT_LABELS: Record<SortBy, string> = {
  trees: 'Trees',
  co2: 'CO₂',
  points: 'Points',
};

type RankItem = {
  id: number;
  rank: number;
  name: string;
  vehicle: string;
  location: string;
  model: string;
  fuel: string;
  vidhanSabha: string;
  co2: number;
  trees: number;
  survival: number;
  points: number;
  isUser?: boolean;
};

function mapEntry(
  entry: LeaderboardEntry,
  index: number,
  isUser = false,
): RankItem {
  return {
    id: index + 1,
    rank: entry.rank ?? index + 1,
    name: entry.name || 'Citizen',
    vehicle: entry.badge || 'Eco Contributor',
    location: entry.vidhanSabha || '',
    model: entry.badge || '',
    fuel: '',
    vidhanSabha: entry.vidhanSabha || '',
    co2: Math.round(entry.co2Kg || 0),
    trees: entry.trees || 0,
    survival: Math.round(entry.survivalPct ?? 0),
    points: entry.points || 0,
    isUser,
  };
}

function getSortValue(item: RankItem, sortBy: SortBy) {
  if (sortBy === 'trees') return item.trees;
  if (sortBy === 'co2') return item.co2;
  return item.points;
}

function getScorePrimary(item: RankItem, sortBy: SortBy) {
  if (sortBy === 'trees') return `${item.trees} trees`;
  if (sortBy === 'co2') return `${item.co2} kg`;
  return `${item.points} pts`;
}

function getScoreSecondary(item: RankItem, sortBy: SortBy) {
  if (sortBy === 'trees') return `${item.co2} kg CO₂`;
  if (sortBy === 'co2') return `${item.trees} trees`;
  return `${item.trees} trees`;
}

type RanksScreenProps = {
  onNotifications?: () => void;
};

export default function RanksScreen({ onNotifications }: RanksScreenProps) {
  const [activeCategory, setActiveCategory] =
    useState<RankCategory>('Vidhan Sabha');
  const [selectedValue, setSelectedValue] = useState<string>('All');
  const [vidhanOptions, setVidhanOptions] = useState<string[]>(['All']);
  const [stateOptions, setStateOptions] = useState<string[]>(['All']);
  const [cityOptions, setCityOptions] = useState<string[]>(['All']);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('trees');
  const [sortDrawerVisible, setSortDrawerVisible] = useState(false);
  const [rankData, setRankData] = useState<RankItem[]>([]);
  const [myStanding, setMyStanding] = useState<RankItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const secondaryOptions =
    activeCategory === 'Vidhan Sabha'
      ? vidhanOptions
      : activeCategory === 'State'
        ? stateOptions
        : cityOptions;

  useEffect(() => {
    let mounted = true;
    (async () => {
      const uniq = (values: string[]) =>
        Array.from(
          new Set(values.map(v => v.trim()).filter(Boolean)),
        ).sort((a, b) => a.localeCompare(b));

      let vidhans: string[] = [];
      let states: string[] = [];
      let cities: string[] = [];

      // 1) Admin CMS list — already public on live
      try {
        const res = await vidhanSabhasService.list({ page: 1, limit: 200 });
        const rows = unwrapList<Record<string, unknown>>(res as never);
        vidhans = uniq(
          rows.map(r =>
            String(r.vidhanSabhaName || r.name || r.vidhanSabha || '').trim(),
          ),
        );
        states = uniq(rows.map(r => String(r.state || '').trim()));
        cities = uniq(
          rows.map(r => String(r.district || r.city || '').trim()),
        );
      } catch {
        // continue to filters fallback
      }

      // 2) Optional leaderboard facets (CMS + trees) when available
      try {
        const filters = await leaderboardService.filters();
        vidhans = uniq([...(filters.vidhanSabhas || []), ...vidhans]);
        states = uniq([...(filters.states || []), ...states]);
        cities = uniq([...(filters.cities || []), ...cities]);
      } catch {
        // keep CMS results
      }

      if (!mounted) return;
      setVidhanOptions(['All', ...vidhans]);
      setStateOptions(['All', ...states]);
      setCityOptions(['All', ...cities]);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setErrorMsg('');
      const scope = SCOPE_BY_CATEGORY[activeCategory];
      const valueFilter =
        selectedValue && selectedValue !== 'All' ? selectedValue : undefined;
      const query = {
        scope,
        limit: 100,
        vidhanSabha:
          scope === 'vidhan-sabha' ? valueFilter : undefined,
        state: scope === 'state' ? valueFilter : undefined,
        city: scope === 'city' ? valueFilter : undefined,
      };
      try {
        const [board, me] = await Promise.all([
          leaderboardService.list(query),
          leaderboardService.me(query).catch(() => null),
        ]);
        if (!mounted) return;
        const items = Array.isArray(board?.items) ? board.items : [];
        const myPersonId = me?.personId;
        const myMobile = me?.mobile;
        setRankData(
          items.map((entry, index) =>
            mapEntry(
              entry,
              index,
              Boolean(
                (myPersonId && entry.personId === myPersonId) ||
                  (myMobile &&
                    entry.mobile &&
                    entry.mobile === myMobile) ||
                  (me &&
                    entry.rank === me.rank &&
                    entry.name === me.name),
              ),
            ),
          ),
        );
        setMyStanding(
          me ? mapEntry(me, Math.max(0, (me.rank || 1) - 1), true) : null,
        );
      } catch (error) {
        if (mounted) {
          setRankData([]);
          setMyStanding(null);
          setErrorMsg(
            error instanceof ApiError
              ? error.message
              : 'Failed to load leaderboard',
          );
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [activeCategory, selectedValue]);

  const handleCategoryChange = (cat: RankCategory) => {
    setActiveCategory(cat);
    setSelectedValue('All');
  };

  const handleSortSelect = (option: SortBy) => {
    setSortBy(option);
    setSortDrawerVisible(false);
  };

  const filteredData = rankData
    .filter(item => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        (item.name || '').toLowerCase().includes(q) ||
        (item.vehicle || '').toLowerCase().includes(q) ||
        (item.location || '').toLowerCase().includes(q) ||
        (item.vidhanSabha || '').toLowerCase().includes(q) ||
        (item.model || '').toLowerCase().includes(q)
      );
    })
    .sort((a, b) => getSortValue(b, sortBy) - getSortValue(a, sortBy));

  const top3 = filteredData.slice(0, 3);
  const restList = filteredData.slice(3);
  const userRank =
    myStanding?.rank ||
    (filteredData.findIndex(d => d.isUser) !== -1
      ? filteredData.findIndex(d => d.isUser) + 1
      : null);

  const standingMe =
    myStanding || filteredData.find(d => d.isUser) || null;
  const standingLeader = filteredData[0];
  const myScore = standingMe ? getSortValue(standingMe, sortBy) : 0;
  const topScore = standingLeader ? getSortValue(standingLeader, sortBy) : 0;
  const catchUpPct =
    topScore <= 0
      ? 0
      : Math.max(4, Math.min(100, Math.round((myScore / topScore) * 100)));
  const catchUpLabel =
    userRank === 1 || catchUpPct >= 100
      ? 'You are rank #1'
      : `Catch up to rank #1 · ${catchUpPct}%`;

  const standingScopeLabel =
    selectedValue !== 'All' ? selectedValue : activeCategory;

  return (
    <View style={styles.root}>
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Vidhan Sabha Leaderboard</Text>
          <Text style={styles.headerSubtitle}>Constituency-wise eco contributors</Text>
        </View>
        <Pressable style={styles.bellButton} onPress={onNotifications}>
          <AppIcon name="bell-outline" size={20} color="#0a3617" />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        {/* YOUR STANDING CARD */}
        <LinearGradient
          colors={['#105e2d', '#2b964f']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.standingCard}
        >
          <Text style={styles.standingLabel}>Your standing</Text>
          <Text style={styles.standingTitle}>
            Among{' '}
            <Text style={styles.highlightText}>{standingScopeLabel}</Text> owners,
            your rank is{' '}
            <Text style={styles.highlightText}>
              #{userRank ?? '?'}
            </Text>
            {myStanding
              ? ` · ${myStanding.trees} trees · ${myStanding.co2}kg CO₂`
              : ''}
          </Text>
          
          <View style={styles.progressRow}>
            <View style={styles.trophyCircle}>
              <AppIcon name="trophy" size={24} color="#ffffff" />
            </View>
            <View style={styles.progressContainer}>
              <View style={styles.progressBarTrack}>
                <View style={[styles.progressBarFill, { width: `${catchUpPct}%` }]} />
              </View>
              <Text style={styles.progressText}>{catchUpLabel}</Text>
            </View>
          </View>
        </LinearGradient>

        {/* FILTERS CONTAINER */}
        <View style={styles.filtersContainer}>
          {/* CATEGORIES (Row 1) */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
            {CATEGORIES.map(cat => (
              <Pressable
                key={cat}
                style={[styles.filterPill, activeCategory === cat && styles.filterPillActiveCategory]}
                onPress={() => handleCategoryChange(cat)}
              >
                <Text style={[styles.filterPillText, activeCategory === cat && styles.filterPillTextActive]}>{cat}</Text>
              </Pressable>
            ))}
          </ScrollView>

          {/* SECONDARY VALUE CHIPS (Rau / Depalpur / MP / …) */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScrollSecondary}
          >
            {secondaryOptions.map(option => {
              const active = selectedValue === option;
              return (
                <Pressable
                  key={`${activeCategory}-${option}`}
                  style={[
                    styles.filterPill,
                    styles.filterPillLight,
                    active && styles.filterPillActiveModel,
                  ]}
                  onPress={() => setSelectedValue(option)}
                >
                  <Text
                    style={[
                      styles.filterPillText,
                      active && styles.filterPillTextActive,
                    ]}
                  >
                    {option}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* SEARCH & SORT */}
          <View style={styles.searchRow}>
            <View style={styles.searchBox}>
              <AppIcon name="magnify" size={18} color="#6b7280" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search owner or vidhan sabha"
                placeholderTextColor="#9ca3af"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCorrect={false}
                autoCapitalize="none"
                returnKeyType="search"
              />
            </View>
            <Pressable style={styles.sortButton} onPress={() => setSortDrawerVisible(true)}>
              <Text style={styles.sortText}>Sort: {SORT_LABELS[sortBy]}</Text>
              <AppIcon name="chevron-down" size={16} color="#0a3617" />
            </Pressable>
          </View>
        </View>

        {/* PODIUM & LIST */}
        <View style={styles.listContainer}>
          {loading ? (
            <ActivityIndicator size="large" color="#136e35" style={{ marginTop: 24 }} />
          ) : null}
          {errorMsg ? <Text style={styles.emptyText}>{errorMsg}</Text> : null}
          {!loading && filteredData.length === 0 && !errorMsg ? (
            <Text style={styles.emptyText}>No leaderboard entries yet.</Text>
          ) : null}
          {!loading && filteredData.length > 0 ? (
            <>
              {/* PODIUM FOR TOP 3 */}
              {top3.length > 0 && (
                <View style={styles.podiumContainer}>
                  {/* Rank 2 */}
                  {top3[1] && (
                    <LinearGradient colors={['#cbd5e1', '#94a3b8']} style={[styles.podiumCard, styles.podiumCardSide]}>
                      <View style={styles.podiumRankCircle}><Text style={styles.podiumRankText}>#2</Text></View>
                      <Text style={styles.podiumName}>{top3[1].name}</Text>
                      <Text style={styles.podiumScore}>{getScorePrimary(top3[1], sortBy)}</Text>
                    </LinearGradient>
                  )}

                  {/* Rank 1 */}
                  {top3[0] && (
                    <LinearGradient colors={['#fbbf24', '#f59e0b']} style={[styles.podiumCard, styles.podiumCardCenter]}>
                      <AppIcon name="crown" size={20} color="#fff" style={styles.crownIcon} />
                      <View style={styles.podiumRankCircle}><Text style={styles.podiumRankText}>#1</Text></View>
                      <Text style={styles.podiumName}>{top3[0].name}</Text>
                      <Text style={styles.podiumScore}>{getScorePrimary(top3[0], sortBy)}</Text>
                    </LinearGradient>
                  )}

                  {/* Rank 3 */}
                  {top3[2] && (
                    <LinearGradient colors={['#f59e0b', '#ea580c']} style={[styles.podiumCard, styles.podiumCardSide]}>
                      <View style={styles.podiumRankCircle}><Text style={styles.podiumRankText}>#3</Text></View>
                      <Text style={styles.podiumName}>{top3[2].name}</Text>
                      <Text style={styles.podiumScore}>{getScorePrimary(top3[2], sortBy)}</Text>
                    </LinearGradient>
                  )}
                </View>
              )}

              {/* LIST FOR REST */}
              {restList.map((item, index) => (
                <View key={`${item.rank}-${item.name}`} style={[styles.leaderboardItem, item.isUser && styles.leaderboardItemUser]}>
                  <View style={[styles.rankCircle, item.isUser && styles.rankCircleUser]}>
                    <Text style={[styles.rankText, item.isUser && styles.rankTextUser]}>#{index + 4}</Text>
                  </View>
                  
                  <View style={styles.leaderboardInfo}>
                    <View style={styles.nameRow}>
                      <Text style={styles.leaderboardName}>{item.name}</Text>
                      {item.isUser && (
                        <View style={styles.youBadge}>
                          <Text style={styles.youBadgeText}>YOU</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.leaderboardVehicle}>{item.vehicle} · {item.location || item.vidhanSabha}</Text>
                  </View>

                  <View style={styles.leaderboardScoreRight}>
                    <View style={styles.leaderboardScoreStats}>
                      <Text style={styles.leaderboardScoreTop}>
                        {getScorePrimary(item, sortBy)}
                      </Text>
                      <Text style={styles.leaderboardScoreBottom}>
                        {getScoreSecondary(item, sortBy)}
                      </Text>
                    </View>
                    <AppIcon name="medal-outline" size={22} color="#6b7280" />
                  </View>
                </View>
              ))}
            </>
          ) : null}
        </View>

      </ScrollView>

      <Modal
        visible={sortDrawerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSortDrawerVisible(false)}
      >
        <Pressable style={styles.drawerOverlay} onPress={() => setSortDrawerVisible(false)}>
          <Pressable style={styles.drawerSheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.drawerHandle} />
            <Text style={styles.drawerTitle}>Sort by</Text>
            {SORT_OPTIONS.map((option) => {
              const selected = sortBy === option;
              return (
                <Pressable
                  key={option}
                  style={[styles.drawerOption, selected && styles.drawerOptionSelected]}
                  onPress={() => handleSortSelect(option)}
                >
                  <Text style={[styles.drawerOptionText, selected && styles.drawerOptionTextSelected]}>
                    {SORT_LABELS[option]}
                  </Text>
                  {selected && <Text style={styles.drawerCheck}>✓</Text>}
                </Pressable>
              );
            })}
          </Pressable>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: getTopInset(20),
    paddingBottom: 20,
    backgroundColor: '#f9fcf9',
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0a3617',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#6b7280',
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
    paddingBottom: getBottomInset(120),
  },
  standingCard: {
    marginHorizontal: 20,
    borderRadius: 32,
    padding: 24,
    marginBottom: 20,
  },
  standingLabel: {
    color: '#b2e3c6',
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 8,
  },
  standingTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 30,
    marginBottom: 24,
  },
  highlightText: {
    color: '#facc15', // Yellow/Gold
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trophyCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  trophyIcon: {
    width: 20,
    height: 20,
    tintColor: '#fff',
  },
  progressContainer: {
    flex: 1,
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 3,
    marginBottom: 8,
  },
  progressBarFill: {
    height: 6,
    backgroundColor: '#facc15',
    borderRadius: 3,
  },
  progressText: {
    color: '#fff',
    fontSize: 12,
  },
  filtersContainer: {
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    marginBottom: 16,
  },
  filterScroll: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 8,
  },
  filterScrollSecondary: {
    paddingHorizontal: 20,
    paddingBottom: 4,
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  filterPillLight: {
    backgroundColor: '#eaf4ee',
    elevation: 0,
    shadowOpacity: 0,
  },
  filterPillActiveCategory: {
    backgroundColor: '#34d399', // Bright Green
  },
  filterPillActiveModel: {
    backgroundColor: '#047857', // Dark Green
  },
  filterPillText: {
    color: '#4b5563',
    fontSize: 13,
    fontWeight: '500',
  },
  filterPillTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
  searchRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginTop: 4,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 24,
    paddingHorizontal: 16,
    height: 44,
  },
  searchIcon: {
    width: 18,
    height: 18,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#000',
    padding: 0,
    marginLeft: 8,
    minWidth: 0,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 24,
    paddingHorizontal: 16,
    height: 44,
    flexShrink: 0,
  },
  sortText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0a3617',
    marginRight: 6,
  },
  sortIcon: {
    width: 12,
    height: 12,
  },
  drawerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  drawerSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: getBottomInset() + 24,
  },
  drawerHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#d1d5db',
    alignSelf: 'center',
    marginBottom: 16,
  },
  drawerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0a3617',
    marginBottom: 12,
  },
  drawerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginBottom: 8,
    backgroundColor: '#f4f9f4',
  },
  drawerOptionSelected: {
    backgroundColor: '#e6f3eb',
    borderWidth: 1.5,
    borderColor: '#2b964f',
  },
  drawerOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  drawerOptionTextSelected: {
    color: '#0a3617',
    fontWeight: '800',
  },
  drawerCheck: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2b964f',
  },
  listContainer: {
    paddingHorizontal: 20,
  },
  emptyText: {
    textAlign: 'center',
    color: '#6b7280',
    marginTop: 20,
  },
  podiumContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginBottom: 24,
    gap: 8,
    marginTop: 16,
  },
  podiumCard: {
    borderRadius: 24,
    alignItems: 'center',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  podiumCardSide: {
    flex: 1,
    height: 140,
    justifyContent: 'center',
  },
  podiumCardCenter: {
    flex: 1.1,
    height: 160,
    justifyContent: 'center',
    marginBottom: 10, // Push up
  },
  crownIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  podiumRankCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  podiumRankText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },
  podiumName: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
    textAlign: 'center',
  },
  podiumScore: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
    fontWeight: '600',
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 24,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  leaderboardItemUser: {
    backgroundColor: '#e6f3eb',
  },
  rankCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#8ca193', // generic rank color
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  rankCircleUser: {
    backgroundColor: '#e57a00',
  },
  rankText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
  },
  rankTextUser: {
    color: '#fff',
  },
  leaderboardInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  leaderboardName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0a3617',
  },
  youBadge: {
    backgroundColor: '#00a859',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 8,
  },
  youBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '800',
  },
  leaderboardVehicle: {
    fontSize: 12,
    color: '#6b7280',
  },
  leaderboardScoreRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  leaderboardScoreStats: {
    alignItems: 'flex-end',
    marginRight: 12,
  },
  leaderboardScoreTop: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0a3617',
    marginBottom: 2,
  },
  leaderboardScoreBottom: {
    fontSize: 11,
    color: '#6b7280',
  },
  medalIcon: {
    width: 24,
    height: 24,
    tintColor: '#6b7280',
    opacity: 0.8,
  },
});
