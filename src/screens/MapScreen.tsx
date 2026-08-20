import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import MapView, {
  Marker,
  PROVIDER_GOOGLE,
  type Region,
} from 'react-native-maps';
import AppIcon, { IconName } from '../components/AppIcon';
import { MapTreeType } from '../data/mapTreesData';
import { getBottomInset, getTopInset } from '../utils/layout';
import { getCurrentCoords } from '../utils/deviceLocation';
import {
  ApiError,
  getStoredPhone,
  getStoredUser,
  mapsService,
  treesService,
  unwrapList,
  usersService,
  type ApiTree,
} from '../api';

const FILTER_ALL = 'All';

/** Country-wide fallback — never a specific city like Indore. */
const INDIA_REGION: Region = {
  latitude: 22.9734,
  longitude: 78.6569,
  latitudeDelta: 22,
  longitudeDelta: 22,
};

function regionFromCoords(latitude: number, longitude: number): Region {
  return {
    latitude,
    longitude,
    latitudeDelta: 0.04,
    longitudeDelta: 0.04,
  };
}

type MapSite = {
  id: string;
  locationName: string;
  treeCount: number;
  plantationArea?: string;
  latitude?: number;
  longitude?: number;
};

type TreePin = {
  id: string;
  type: MapTreeType;
  species: string;
  latitude: number;
  longitude: number;
  title: string;
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
  Other: {
    icon: 'pine-tree',
    iconColor: '#0f766e',
    pinColor: '#0d9488',
    innerBg: '#f0fdfa',
    glow: '#0d9488',
  },
};

const PIN_SIZE = 44;
const PIN_INNER = 28;

function speciesLabel(species?: string, treeName?: string): string {
  const raw = (species || treeName || '').trim();
  if (!raw) return 'Other';
  return raw
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function pinStyleForLabel(label: string): MapTreeType {
  const value = label.toLowerCase();
  if (value.includes('neem')) return 'Neem';
  if (value.includes('banyan') || value.includes('bargad')) return 'Banyan';
  if (value.includes('mango') || value.includes('aam')) return 'Mango';
  if (value.includes('peepal') || value.includes('pipal') || value.includes('pippal')) {
    return 'Peepal';
  }
  return 'Other';
}

function toCoord(value: unknown): number | null {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

/** Only trees with real lat/lng — no decorative / fake pin fallback. */
function mapApiTreesToPins(trees: ApiTree[]): TreePin[] {
  const pins: TreePin[] = [];
  trees.forEach((tree, index) => {
    const latitude = toCoord(tree.latitude);
    const longitude = toCoord(tree.longitude);
    if (latitude == null || longitude == null) return;
    const species = speciesLabel(tree.species, tree.treeName);
    const type = pinStyleForLabel(`${tree.species ?? ''} ${tree.treeName ?? ''} ${species}`);
    pins.push({
      id: String(tree._id || tree.treeId || `tree-${index}`),
      type,
      species,
      latitude,
      longitude,
      title: tree.treeName || tree.species || species,
    });
  });
  return pins;
}

function TreeMapPin({ type }: { type: MapTreeType }) {
  const style = TREE_STYLE[type];

  return (
    <View style={[styles.pinShadow, { shadowColor: style.glow }]}>
      <View style={[styles.pinHead, { backgroundColor: style.pinColor }]}>
        <View style={[styles.pinInner, { backgroundColor: style.innerBg }]}>
          <AppIcon name={style.icon} size={16} color={style.iconColor} />
        </View>
      </View>
      <View style={[styles.pinPoint, { borderTopColor: style.pinColor }]} />
    </View>
  );
}

function flattenUserTrees(payload: unknown): ApiTree[] {
  if (!Array.isArray(payload)) return [];
  if (
    payload.length > 0 &&
    payload[0] &&
    typeof payload[0] === 'object' &&
    !Array.isArray((payload[0] as { trees?: unknown }).trees)
  ) {
    const first = payload[0] as Record<string, unknown>;
    if (first.treeName || first.species || first.treeId || first._id) {
      return payload as ApiTree[];
    }
  }
  return payload.flatMap((group: unknown) => {
    if (!group || typeof group !== 'object') return [];
    const trees = (group as { trees?: unknown }).trees;
    return Array.isArray(trees) ? (trees as ApiTree[]) : [];
  });
}

function digitsOnly(value: string) {
  return value.replace(/\D/g, '');
}

function regionForPins(pins: TreePin[]): Region | null {
  if (pins.length === 0) return null;
  if (pins.length === 1) {
    return {
      latitude: pins[0].latitude,
      longitude: pins[0].longitude,
      latitudeDelta: 0.04,
      longitudeDelta: 0.04,
    };
  }
  const lats = pins.map(p => p.latitude);
  const lngs = pins.map(p => p.longitude);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const latDelta = Math.max((maxLat - minLat) * 1.6, 0.03);
  const lngDelta = Math.max((maxLng - minLng) * 1.6, 0.03);
  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: latDelta,
    longitudeDelta: lngDelta,
  };
}

type MapScreenProps = {
  onNotifications?: () => void;
};

export default function MapScreen({ onNotifications }: MapScreenProps) {
  const mapRef = useRef<MapView | null>(null);
  const [activeFilter, setActiveFilter] = useState(FILTER_ALL);
  const [trees, setTrees] = useState<TreePin[]>([]);
  const [sites, setSites] = useState<MapSite[]>([]);
  const [sourceLabel, setSourceLabel] = useState('Loading map data…');
  const [mapsEnabled, setMapsEnabled] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [initialRegion, setInitialRegion] = useState<Region | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const gpsPromise = getCurrentCoords(5000);
      let treeCount = 0;
      let siteCount = 0;
      let pinCount = 0;
      let pins: TreePin[] = [];

      try {
        const [storedPhone, user, me] = await Promise.all([
          getStoredPhone(),
          getStoredUser(),
          usersService.getMe().catch(() => null),
        ]);
        const rawPhone =
          storedPhone ||
          (me as { phone?: string } | null)?.phone ||
          user?.phone ||
          '';
        const phone = digitsOnly(String(rawPhone)).slice(-10);

        if (phone.length === 10) {
          const grouped = await treesService.listByMobile(phone);
          const apiTrees = flattenUserTrees(grouped);
          treeCount = apiTrees.length;
          pins = mapApiTreesToPins(apiTrees);
          pinCount = pins.length;
          if (mounted) setTrees(pins);
        } else if (mounted) {
          setTrees([]);
        }
      } catch (error) {
        if (mounted) setTrees([]);
        if (__DEV__) {
          console.warn(
            error instanceof ApiError ? error.message : 'Failed to load trees',
          );
        }
      }

      try {
        const mapsConfig = await mapsService.getConfig();
        if (mounted) {
          setMapsEnabled(Boolean(mapsConfig?.enabled));
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
        }
      } catch (error) {
        if (__DEV__) {
          console.warn(
            error instanceof ApiError ? error.message : 'Failed to load maps',
          );
        }
      }

      if (mounted) {
        const gps = await gpsPromise;
        const pinRegion = regionForPins(pins);
        if (pinRegion) {
          setInitialRegion(pinRegion);
        } else if (gps) {
          setInitialRegion(regionFromCoords(gps.latitude, gps.longitude));
        } else {
          setInitialRegion(INDIA_REGION);
        }
        if (pinCount === 0) {
          const noCoordsHint =
            treeCount > 0
              ? ` · ${treeCount} tree${treeCount === 1 ? '' : 's'} without GPS`
              : '';
          setSourceLabel(
            siteCount > 0
              ? `No mapped trees yet${noCoordsHint} · ${siteCount} plantation site${siteCount === 1 ? '' : 's'}`
              : `No mapped trees yet${noCoordsHint}`,
          );
        } else if (siteCount > 0) {
          setSourceLabel(
            `Your trees: ${pinCount} · ${siteCount} plantation site${siteCount === 1 ? '' : 's'}`,
          );
        } else {
          setSourceLabel(`Your trees: ${pinCount}`);
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const speciesFilters = useMemo(() => {
    const unique = Array.from(new Set(trees.map(tree => tree.species))).sort(
      (a, b) => a.localeCompare(b),
    );
    return [FILTER_ALL, ...unique];
  }, [trees]);

  const filteredTrees = useMemo(
    () =>
      trees.filter(
        tree =>
          activeFilter === FILTER_ALL || tree.species === activeFilter,
      ),
    [trees, activeFilter],
  );

  useEffect(() => {
    if (activeFilter !== FILTER_ALL && !speciesFilters.includes(activeFilter)) {
      setActiveFilter(FILTER_ALL);
    }
  }, [activeFilter, speciesFilters]);

  useEffect(() => {
    if (!mapReady || filteredTrees.length === 0) return;
    const region = regionForPins(filteredTrees);
    if (!region) return;
    mapRef.current?.animateToRegion(region, 400);
  }, [mapReady, filteredTrees]);

  const recenterOnUser = async () => {
    const coords = await getCurrentCoords();
    if (!coords) return;
    mapRef.current?.animateToRegion(
      regionFromCoords(coords.latitude, coords.longitude),
      400,
    );
  };

  const fitTrees = () => {
    const region = regionForPins(filteredTrees);
    if (!region) return;
    mapRef.current?.animateToRegion(region, 400);
  };

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Plantation Map</Text>
          <Text style={styles.headerSubtitle}>{sourceLabel}</Text>
        </View>
        <Pressable style={styles.bellButton} onPress={onNotifications}>
          <AppIcon name="bell-outline" size={20} color="#0a3617" />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: getBottomInset(100) }}
        showsVerticalScrollIndicator={false}>
        <View style={styles.mapArea}>
          {initialRegion ? (
            <MapView
              ref={mapRef}
              style={StyleSheet.absoluteFill}
              provider={PROVIDER_GOOGLE}
              initialRegion={initialRegion}
              showsUserLocation
              showsMyLocationButton={false}
              onMapReady={() => setMapReady(true)}>
              {filteredTrees.map(tree => (
                <Marker
                  key={tree.id}
                  coordinate={{
                    latitude: tree.latitude,
                    longitude: tree.longitude,
                  }}
                  title={`🌳 ${tree.title}`}
                  description={tree.species}
                  tracksViewChanges={Platform.OS === 'ios'}>
                  <TreeMapPin type={tree.type} />
                </Marker>
              ))}
            </MapView>
          ) : (
            <View style={styles.mapLoading}>
              <ActivityIndicator size="large" color="#136e35" />
              <Text style={styles.mapLoadingText}>Finding location…</Text>
            </View>
          )}

          {!mapsEnabled ? (
            <View style={styles.configBanner} pointerEvents="none">
              <Text style={styles.configBannerText}>
                Google Maps key missing — set GOOGLE_MAPS_API_KEY in backend
                .env and android/gradle.properties, then rebuild
              </Text>
            </View>
          ) : null}

          {initialRegion && filteredTrees.length === 0 ? (
            <View style={styles.emptyOverlay} pointerEvents="none">
              <Text style={styles.emptyTitle}>No tree pins yet</Text>
              <Text style={styles.emptySubtitle}>
                Pins appear only for your trees that have GPS coordinates
              </Text>
            </View>
          ) : null}

          <View style={styles.mapContentOverlay} pointerEvents="box-none">
            <View style={styles.filtersContainer}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filtersScroll}>
                {speciesFilters.map(filter => (
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
              <Pressable style={styles.mapActionButton} onPress={fitTrees}>
                <AppIcon name="layers-outline" size={20} color="#374151" />
              </Pressable>
              <Pressable
                style={styles.mapActionButton}
                onPress={recenterOnUser}>
                <AppIcon name="crosshairs-gps" size={20} color="#374151" />
              </Pressable>
            </View>
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
    backgroundColor: '#e8eee9',
  },
  mapLoading: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  mapLoadingText: {
    fontSize: 13,
    color: '#4b5563',
    fontWeight: '600',
  },
  mapContentOverlay: {
    ...StyleSheet.absoluteFill,
  },
  configBanner: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.82)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  configBannerText: {
    color: '#f8fafc',
    fontSize: 12,
    lineHeight: 16,
  },
  emptyOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    backgroundColor: 'rgba(248, 250, 249, 0.35)',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0a3617',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#4b5563',
    textAlign: 'center',
    lineHeight: 18,
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
  pinShadow: {
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 6,
  },
  pinHead: {
    width: PIN_SIZE,
    height: PIN_SIZE,
    borderRadius: PIN_SIZE / 2,
    borderWidth: 3,
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
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 12,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -8,
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
