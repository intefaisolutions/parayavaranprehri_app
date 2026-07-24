import React, { useEffect, useState } from 'react';
import {
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
import { ApiError, staticDataService } from '../api';

const { width } = Dimensions.get('window');

const CATEGORIES = ['Vidhan Sabha', 'State', 'Brand', 'Model', 'Fuel'];

const SUB_FILTERS: Record<string, string[]> = {
  'Vidhan Sabha': ['All', 'Indore-1', 'Indore-2', 'Indore-3', 'Indore-4', 'Indore-5', 'Rau', 'Sanwer', 'Depalpur', 'Mhow'],
  'State': ['All', 'Madhya Pradesh'],
  'Brand': ['All', 'Land Rover', 'Mahindra', 'Tata', 'Toyota', 'Kia'],
  'Model': ['All', 'Defender', 'Thar', 'Nexon EV', 'Fortuner', 'Seltos'],
  'Fuel': ['All', 'Electric', 'Diesel', 'Petrol', 'CNG'],
};

const FALLBACK_DATA = [
  { id: 1, rank: 1, name: 'Aarav', vehicle: 'Land Rover Defender', location: 'Indore', model: 'Defender', fuel: 'Diesel', vidhanSabha: 'Rau', co2: 612, trees: 41, survival: 92 },
  { id: 4, rank: 2, name: 'Neha', vehicle: 'Tata Nexon EV', location: 'Indore', model: 'Nexon EV', fuel: 'EV', vidhanSabha: 'Rau', co2: 488, trees: 33, survival: 88 },
  { id: 2, rank: 3, name: 'Rahul', vehicle: 'Land Rover Defender', location: 'Indore', model: 'Defender', fuel: 'Diesel', vidhanSabha: 'Indore-2', co2: 312, trees: 24, survival: 100, isUser: true },
  { id: 3, rank: 4, name: 'Vikram Singh', vehicle: 'Toyota Fortuner', location: 'Bhopal', model: 'Fortuner', fuel: 'Diesel', vidhanSabha: 'Sanwer', co2: 420, trees: 21, survival: 76 },
  { id: 5, rank: 5, name: 'Pooja Mehta', vehicle: 'Mahindra Thar', location: 'Indore', model: 'Thar', fuel: 'Diesel', vidhanSabha: 'Indore-1', co2: 250, trees: 19, survival: 85 },
  { id: 6, rank: 6, name: 'Karthik Rao', vehicle: 'Kia Seltos', location: 'Ujjain', model: 'Seltos', fuel: 'Petrol', vidhanSabha: 'Mhow', co2: 500, trees: 17, survival: 91 },
];

type SortBy = 'trees' | 'co2' | 'survival';

const SORT_OPTIONS: SortBy[] = ['trees', 'co2', 'survival'];

const SORT_LABELS: Record<SortBy, string> = {
  trees: 'Trees',
  co2: 'CO₂',
  survival: 'Survival',
};

type RankItem = (typeof FALLBACK_DATA)[number] & { isUser?: boolean };

function getSortValue(item: RankItem, sortBy: SortBy) {
  if (sortBy === 'trees') return item.trees;
  if (sortBy === 'co2') return item.co2;
  return item.survival;
}

function getScorePrimary(item: RankItem, sortBy: SortBy) {
  if (sortBy === 'trees') return `${item.trees} trees`;
  if (sortBy === 'co2') return `${item.co2} kg`;
  return `${item.survival}%`;
}

function getScoreSecondary(item: RankItem, sortBy: SortBy) {
  if (sortBy === 'trees') return `${item.co2} kg CO₂`;
  if (sortBy === 'co2') return `${item.trees} trees`;
  return `${item.co2} kg CO₂`;
}

export default function RanksScreen() {
  const [activeCategory, setActiveCategory] = useState('Model');
  const [activeSubFilter, setActiveSubFilter] = useState('Defender');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('trees');
  const [sortDrawerVisible, setSortDrawerVisible] = useState(false);
  const [rankData, setRankData] = useState<RankItem[]>(FALLBACK_DATA);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await staticDataService.getGamification();
        if (
          mounted &&
          data?.leaderboard &&
          Array.isArray(data.leaderboard) &&
          data.leaderboard.length > 0
        ) {
          setRankData(
            data.leaderboard.map((entry, index) => ({
              id: index + 1,
              rank: entry.rank ?? index + 1,
              name: entry.name,
              vehicle: entry.level,
              location: '',
              model: entry.level,
              fuel: '',
              vidhanSabha: '',
              co2: entry.points,
              trees: Math.max(1, Math.round(entry.points / 30)),
              survival: Math.min(100, Math.round(entry.points / 12)),
              isUser: entry.name.toLowerCase().includes('priya'),
            })),
          );
        }
      } catch (error) {
        if (__DEV__) {
          console.warn(
            error instanceof ApiError
              ? error.message
              : 'Failed to load ranks',
          );
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const handleCategoryChange = (cat: string) => {
    setActiveCategory(cat);
    setActiveSubFilter('All');
  };

  const handleSortSelect = (option: SortBy) => {
    setSortBy(option);
    setSortDrawerVisible(false);
  };

  const filteredData = rankData.filter((item) => {
    if (activeSubFilter !== 'All') {
      if (activeCategory === 'Model' && item.model !== activeSubFilter) return false;
      if (activeCategory === 'Vidhan Sabha' && item.vidhanSabha !== activeSubFilter) return false;
    }
    if (searchQuery && !item.name.toLowerCase().includes(searchQuery.toLowerCase()) && !item.vehicle.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  }).sort((a, b) => getSortValue(b, sortBy) - getSortValue(a, sortBy));

  const top3 = filteredData.slice(0, 3);
  const restList = filteredData.slice(3);

  return (
    <View style={styles.root}>
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Vidhan Sabha Leaderboard</Text>
          <Text style={styles.headerSubtitle}>Constituency-wise eco contributors</Text>
        </View>
        <Pressable style={styles.bellButton}>
          <AppIcon name="bell-outline" size={20} color="#0a3617" />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[2]} // Make filters sticky if needed, optional
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
            Among <Text style={styles.highlightText}>{activeSubFilter === 'All' ? 'all' : activeSubFilter}</Text> owners in Indore, your rank is <Text style={styles.highlightText}>#{
              // Dynamic rank calculation based on filter just for visual effect
              filteredData.findIndex(d => d.isUser) !== -1 ? filteredData.findIndex(d => d.isUser) + 1 : '?'
            }</Text>
          </Text>
          
          <View style={styles.progressRow}>
            <View style={styles.trophyCircle}>
              <AppIcon name="trophy" size={24} color="#ffffff" />
            </View>
            <View style={styles.progressContainer}>
              <View style={styles.progressBarTrack}>
                <View style={[styles.progressBarFill, { width: '80%' }]} />
              </View>
              <Text style={styles.progressText}>Catch up to rank #1</Text>
            </View>
          </View>
        </LinearGradient>

        {/* FILTERS CONTAINER */}
        <View style={styles.filtersContainer}>
          {/* CATEGORIES (Row 1) */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
            {CATEGORIES.map((cat) => (
              <Pressable
                key={cat}
                style={[styles.filterPill, activeCategory === cat && styles.filterPillActiveCategory]}
                onPress={() => handleCategoryChange(cat)}
              >
                <Text style={[styles.filterPillText, activeCategory === cat && styles.filterPillTextActive]}>{cat}</Text>
              </Pressable>
            ))}
          </ScrollView>

          {/* SUB-FILTERS (Row 2) */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
            {SUB_FILTERS[activeCategory].map((subFilter) => (
              <Pressable
                key={subFilter}
                style={[styles.filterPill, activeSubFilter === subFilter && styles.filterPillActiveModel, activeSubFilter !== subFilter && styles.filterPillLight]}
                onPress={() => setActiveSubFilter(subFilter)}
              >
                <Text style={[styles.filterPillText, activeSubFilter === subFilter && styles.filterPillTextActive]}>{subFilter}</Text>
              </Pressable>
            ))}
          </ScrollView>

          {/* SEARCH & SORT */}
          <View style={styles.searchRow}>
            <View style={styles.searchBox}>
              <AppIcon name="magnify" size={18} color="#6b7280" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search owner or vehicle"
                placeholderTextColor="#9ca3af"
                value={searchQuery}
                onChangeText={setSearchQuery}
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
          {filteredData.length === 0 ? (
            <Text style={styles.emptyText}>No users found for this filter.</Text>
          ) : (
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
                <View key={item.id} style={[styles.leaderboardItem, item.isUser && styles.leaderboardItemUser]}>
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
                    <Text style={styles.leaderboardVehicle}>{item.vehicle} · {item.location}</Text>
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
          )}
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
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 24,
    paddingHorizontal: 16,
    height: 44,
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
