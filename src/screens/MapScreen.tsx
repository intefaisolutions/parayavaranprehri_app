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
import AppIcon, { IconName } from '../components/AppIcon';
import { MAP_TREES, MapTree, MapTreeType } from '../data/mapTreesData';
import { getBottomInset, getTopInset } from '../utils/layout';
import {
  ApiError,
  mapsService,
  treesService,
  unwrapList,
  type ApiTree,
} from '../api';

const { width } = Dimensions.get('window');

const FILTERS = ['All', 'Peepal', 'Neem', 'Banyan', 'Mango'];

type MapSite = {
  id: string;
  locationName: string;
  treeCount: number;
  plantationArea?: string;
  latitude?: number;
  longitude?: number;
};

const TREE_STYLE: Record<
  MapTreeType,
  { icon: IconName; iconColor: string; pinColor: string; innerBg: string; glow: string }
> = {
  Peepal: {
    icon: 'pine-tree',
    iconColor: '#16a34a',
    pinColor: '#22c55e',
    innerBg: '#ecfdf5',
    glow: '#22c55e',
  },
  Neem: {
    icon: 'tree',
    iconColor: '#15803d',
    pinColor: '#16a34a',
    innerBg: '#ecfdf5',
    glow: '#16a34a',
  },
  Banyan: {
    icon: 'palm-tree',
    iconColor: '#dc2626',
    pinColor: '#ef4444',
    innerBg: '#fef2f2',
    glow: '#ef4444',
  },
  Mango: {
    icon: 'fruit-citrus',
    iconColor: '#ea580c',
    pinColor: '#f97316',
    innerBg: '#fff7ed',
    glow: '#f97316',
  },
};

const PIN_SIZE = 52;
const PIN_INNER = 34;

function normalizeTreeType(species?: string, treeName?: string): MapTreeType {
  const value = `${species ?? ''} ${treeName ?? ''}`.toLowerCase();
  if (value.includes('neem')) return 'Neem';
  if (value.includes('banyan') || value.includes('bargad')) return 'Banyan';
  if (value.includes('mango') || value.includes('aam')) return 'Mango';
  return 'Peepal';
}

function mapApiTreesToPins(trees: ApiTree[]): MapTree[] {
  const withCoords = trees.filter(
    t => typeof t.latitude === 'number' && typeof t.longitude === 'number',
  );
  if (withCoords.length === 0) {
    return trees.slice(0, MAP_TREES.length).map((tree, index) => ({
      id: index + 1,
      type: normalizeTreeType(tree.species, tree.treeName),
      top: MAP_TREES[index % MAP_TREES.length].top,
      left: MAP_TREES[index % MAP_TREES.length].left,
      zIndex: MAP_TREES[index % MAP_TREES.length].zIndex,
    }));
  }

  const lats = withCoords.map(t => t.latitude as number);
  const lngs = withCoords.map(t => t.longitude as number);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const latSpan = Math.max(maxLat - minLat, 0.0001);
  const lngSpan = Math.max(maxLng - minLng, 0.0001);

  return withCoords.map((tree, index) => {
    const lat = tree.latitude as number;
    const lng = tree.longitude as number;
    return {
      id: index + 1,
      type: normalizeTreeType(tree.species, tree.treeName),
      top: 100 + ((maxLat - lat) / latSpan) * 360,
      left: 20 + ((lng - minLng) / lngSpan) * (width - 80),
      zIndex: 2,
    };
  });
}

function TreeMapPin({ type }: { type: MapTreeType }) {
  const style = TREE_STYLE[type];

  return (
    <View style={[styles.pinShadow, { shadowColor: style.glow }]}>
      <View style={[styles.pinHead, { backgroundColor: style.pinColor }]}>
        <View style={[styles.pinInner, { backgroundColor: style.innerBg }]}>
          <AppIcon name={style.icon} size={18} color={style.iconColor} />
        </View>
      </View>
      <View style={[styles.pinPoint, { borderTopColor: style.pinColor }]} />
    </View>
  );
}

export default function MapScreen() {
  const [activeFilter, setActiveFilter] = useState('All');
  const [trees, setTrees] = useState<MapTree[]>(MAP_TREES);
  const [sites, setSites] = useState<MapSite[]>([]);
  const [sourceLabel, setSourceLabel] = useState('Loading map data…');

  useEffect(() => {
    let mounted = true;
    (async () => {
      let treeCount = 0;
      let siteCount = 0;

      try {
        const apiTrees = await treesService.list();
        if (mounted && Array.isArray(apiTrees) && apiTrees.length > 0) {
          setTrees(mapApiTreesToPins(apiTrees));
          treeCount = apiTrees.length;
        }
      } catch (error) {
        if (__DEV__) {
          console.warn(
            error instanceof ApiError ? error.message : 'Failed to load trees',
          );
        }
      }

      try {
        const mapsConfig = await mapsService.getConfig();
        if (__DEV__ && mapsConfig?.enabled) {
          console.log(
            'Google Maps key available via /maps/config (native tiles not wired yet)',
          );
        }
      } catch {
        // optional maps provider config
      }

      try {
        const mapsRes = await mapsService.list({
          page: 1,
          limit: 50,
          status: 'Active',
        });
        const list = unwrapList(mapsRes as any);
        if (mounted && list.length > 0) {
          const mapped: MapSite[] = list.map((m: any) => ({
            id: String(m._id),
            locationName: m.locationName || 'Plantation site',
            treeCount: Number(m.treeCount) || 0,
            plantationArea: m.plantationArea,
            latitude: m.latitude,
            longitude: m.longitude,
          }));
          setSites(mapped);
          siteCount = mapped.length;

          // If trees had no coords, place pins from map sites
          const withCoords = mapped.filter(
            s =>
              typeof s.latitude === 'number' &&
              typeof s.longitude === 'number',
          );
          if (withCoords.length > 0 && treeCount === 0) {
            const fakeTrees: ApiTree[] = withCoords.map((s, i) => ({
              _id: s.id,
              treeName: s.locationName,
              species: 'Peepal',
              latitude: s.latitude,
              longitude: s.longitude,
            })) as ApiTree[];
            setTrees(mapApiTreesToPins(fakeTrees));
          }
        }
      } catch (error) {
        if (__DEV__) {
          console.warn(
            error instanceof ApiError ? error.message : 'Failed to load maps',
          );
        }
      }

      if (mounted) {
        setSourceLabel(
          siteCount > 0
            ? `${siteCount} plantation site${siteCount === 1 ? '' : 's'} · ${treeCount || trees.length} trees`
            : `${treeCount || trees.length} trees across Indore Vidhan Sabhas`,
        );
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const filteredTrees = trees.filter(
    tree => activeFilter === 'All' || tree.type === activeFilter,
  );

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Plantation Map</Text>
          <Text style={styles.headerSubtitle}>{sourceLabel}</Text>
        </View>
        <Pressable style={styles.bellButton}>
          <AppIcon name="bell-outline" size={20} color="#0a3617" />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: getBottomInset(100) }}
        showsVerticalScrollIndicator={false}>
        <View style={styles.mapArea}>
          <LinearGradient
            colors={['#eef9f0', '#f7fcf4', '#eef9f0']}
            style={StyleSheet.absoluteFill}
          />

          <View style={styles.gridOverlay}>
            {Array.from({ length: 12 }).map((_, i) => (
              <View
                key={`v-${i}`}
                style={[styles.gridLineVertical, { left: (width / 11) * i }]}
              />
            ))}
            {Array.from({ length: 20 }).map((_, i) => (
              <View
                key={`h-${i}`}
                style={[styles.gridLineHorizontal, { top: 52 * i }]}
              />
            ))}
          </View>

          <View style={styles.riverCurve1} />
          <View style={styles.riverCurve2} />

          <View style={styles.mapContentOverlay}>
            <View style={styles.filtersContainer}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filtersScroll}>
                {FILTERS.map(filter => (
                  <Pressable
                    key={filter}
                    style={[
                      styles.filterPill,
                      activeFilter === filter && styles.filterPillActive,
                    ]}
                    onPress={() => setActiveFilter(filter)}>
                    <Text
                      style={[
                        styles.filterText,
                        activeFilter === filter && styles.filterTextActive,
                      ]}>
                      {filter}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            <View style={styles.mapActionsContainer}>
              <Pressable style={styles.mapActionButton}>
                <AppIcon name="layers-outline" size={20} color="#374151" />
              </Pressable>
              <Pressable style={styles.mapActionButton}>
                <AppIcon name="filter-variant" size={20} color="#374151" />
              </Pressable>
              <Pressable style={styles.mapActionButton}>
                <AppIcon name="crosshairs-gps" size={20} color="#374151" />
              </Pressable>
            </View>

            <View
              style={[
                styles.userLocationMarker,
                { top: 318, left: width / 2 - 28 },
              ]}>
              <View style={styles.userLocationPulse} />
              <View style={styles.userLocationRing}>
                <AppIcon name="crosshairs-gps" size={18} color="#fff" />
              </View>
            </View>

            {filteredTrees.map(tree => (
              <View
                key={tree.id}
                style={[
                  styles.treeMarkerContainer,
                  {
                    top: tree.top,
                    left: tree.left,
                    zIndex: tree.zIndex ?? 1,
                  },
                ]}>
                <TreeMapPin type={tree.type} />
              </View>
            ))}
          </View>
        </View>

        {sites.length > 0 ? (
          <View style={styles.sitesSection}>
            <Text style={styles.sitesTitle}>Plantation sites</Text>
            {sites.map(site => (
              <View key={site.id} style={styles.siteCard}>
                <View style={styles.siteIcon}>
                  <AppIcon name="map-marker-outline" size={18} color="#126e35" />
                </View>
                <View style={styles.siteInfo}>
                  <Text style={styles.siteName}>{site.locationName}</Text>
                  <Text style={styles.siteMeta}>
                    {site.treeCount} trees
                    {site.plantationArea ? ` · ${site.plantationArea}` : ''}
                  </Text>
                  {typeof site.latitude === 'number' &&
                  typeof site.longitude === 'number' ? (
                    <Text style={styles.siteCoords}>
                      {site.latitude.toFixed(4)}, {site.longitude.toFixed(4)}
                    </Text>
                  ) : null}
                </View>
              </View>
            ))}
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scroll: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: getTopInset(20),
    paddingBottom: 16,
    backgroundColor: '#fff',
    zIndex: 10,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
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
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  mapArea: {
    height: 520,
    marginHorizontal: 0,
    overflow: 'hidden',
    position: 'relative',
  },
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  gridLineVertical: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
  },
  gridLineHorizontal: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
  },
  riverCurve1: {
    position: 'absolute',
    width: width * 1.4,
    height: 180,
    borderTopWidth: 3,
    borderTopColor: 'rgba(34, 197, 94, 0.22)',
    borderRadius: 280,
    top: 220,
    left: -80,
    transform: [{ rotate: '-8deg' }],
  },
  riverCurve2: {
    position: 'absolute',
    width: width * 1.4,
    height: 220,
    borderTopWidth: 3,
    borderTopColor: 'rgba(34, 197, 94, 0.18)',
    borderRadius: 320,
    top: 420,
    left: -60,
    transform: [{ rotate: '12deg' }],
  },
  mapContentOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  filtersContainer: {
    marginTop: 16,
  },
  filtersScroll: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterPill: {
    backgroundColor: '#fff',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  filterPillActive: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  filterText: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
  mapActionsContainer: {
    position: 'absolute',
    top: 16,
    right: 16,
    gap: 10,
  },
  mapActionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  userLocationMarker: {
    position: 'absolute',
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  userLocationPulse: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(56, 189, 248, 0.18)',
  },
  userLocationRing: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0ea5e9',
    borderWidth: 3,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0ea5e9',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  treeMarkerContainer: {
    position: 'absolute',
    alignItems: 'center',
  },
  pinShadow: {
    alignItems: 'center',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 8,
  },
  pinHead: {
    width: PIN_SIZE,
    height: PIN_SIZE,
    borderRadius: PIN_SIZE / 2,
    borderWidth: 3.5,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinInner: {
    width: PIN_INNER,
    height: PIN_INNER,
    borderRadius: PIN_INNER / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinPoint: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 9,
    borderRightWidth: 9,
    borderTopWidth: 14,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -10,
  },
  sitesSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sitesTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0a3617',
    marginBottom: 12,
  },
  siteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f4f9f4',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e8eee9',
  },
  siteIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e8f7ee',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  siteInfo: {
    flex: 1,
  },
  siteName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0a3617',
  },
  siteMeta: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  siteCoords: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 2,
  },
});
