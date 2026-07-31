import React, { useEffect, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AppIcon from '../components/AppIcon';
import {
  AssignedTree,
  getVehicleDetailInfo,
} from '../data/vehicleDetailData';
import { Vehicle } from '../data/vehiclesData';
import { getVehicleIconName } from '../utils/vehicleIcons';
import { getBottomInset, getTopInset } from '../utils/layout';
import { ApiError, treesService, vehiclesService } from '../api';

type Props = {
  vehicle: Vehicle;
  onBack: () => void;
};

const DETAIL_GRID = (
  info: ReturnType<typeof getVehicleDetailInfo>,
  vehicle: Vehicle,
) => [
  { icon: 'account-outline' as const, label: 'Owner', value: info.owner },
  { icon: 'shield-check-outline' as const, label: 'Insurance', value: info.insurance },
  { icon: 'gas-station-outline' as const, label: 'Fuel Type', value: vehicle.fuel },
  { icon: 'check-decagram-outline' as const, label: 'Status', value: vehicle.status },
  { icon: 'calendar-outline' as const, label: 'Registered', value: vehicle.regDate },
  { icon: 'map-marker-outline' as const, label: 'RTO', value: info.rto },
];

function TreeItem({ tree }: { tree: AssignedTree }) {
  const [expanded, setExpanded] = useState(tree.id === '1');

  return (
    <View style={styles.treeItem}>
      <View style={styles.timelineDot} />
      <View style={styles.treeCard}>
        <Pressable
          style={styles.treeHeader}
          onPress={() => setExpanded(prev => !prev)}>
          <Image source={{ uri: tree.imageUrl }} style={styles.treeThumb} />
          <View style={styles.treeHeaderInfo}>
            <Text style={styles.treeName}>{tree.name}</Text>
            <Text style={styles.treeMeta}>
              {tree.treeId} · {tree.plantedDate}
            </Text>
          </View>
          <View style={styles.treeStatusBadge}>
            <Text style={styles.treeStatusText}>{tree.status}</Text>
          </View>
          <Text style={styles.treeChevron}>{expanded ? '▲' : '▼'}</Text>
        </Pressable>

        {expanded && (
          <View style={styles.treeExpanded}>
            <Text style={styles.treeLocation}>
              {tree.location} · {tree.height} · {tree.co2}
            </Text>
            <View style={styles.progressTrack}>
              <View
                style={[styles.progressFill, { width: `${tree.progress * 100}%` }]}
              />
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.monthsRow}>
              {tree.months.map(month => (
                <View key={month} style={styles.monthCard}>
                  <Image
                    source={{ uri: tree.imageUrl }}
                    style={styles.monthImage}
                  />
                  <Text style={styles.monthLabel}>{month}</Text>
                </View>
              ))}
            </ScrollView>
            <Pressable style={styles.analyticsBtn}>
              <Text style={styles.analyticsBtnText}>
                Open full tree analytics →
              </Text>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}

export default function VehicleDetailScreen({ vehicle, onBack }: Props) {
  const [detailVehicle, setDetailVehicle] = useState(vehicle);
  const info = getVehicleDetailInfo(detailVehicle);
  const [assignedTrees, setAssignedTrees] = useState(info.assignedTrees);
  const detailGrid = DETAIL_GRID(info, detailVehicle);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const apiVehicle = await vehiclesService.getById(vehicle.id);
        if (mounted && apiVehicle) {
          setDetailVehicle(prev => ({
            ...prev,
            name: apiVehicle.name || prev.name,
            plate: apiVehicle.plate || prev.plate,
            fuel: apiVehicle.fuel || prev.fuel,
            vhId: apiVehicle.vhId || prev.vhId,
          }));
        }
      } catch (error) {
        if (__DEV__) {
          console.warn(
            error instanceof ApiError
              ? error.message
              : 'Vehicle detail load failed',
          );
        }
      }
      try {
        const allTrees = await treesService.list();
        if (mounted && Array.isArray(allTrees)) {
          const plate = vehicle.plate.replace(/\s/g, '').toUpperCase();
          const matched = allTrees.filter((t: any) => {
            const vn = String(t.vehicleNumber || '')
              .replace(/\s/g, '')
              .toUpperCase();
            return vn && vn === plate;
          });
          if (matched.length > 0) {
            setAssignedTrees(
              matched.map((t: any, index: number) => ({
                id: String(index + 1),
                name: t.species || t.treeName || 'Tree',
                treeId: t.treeId || t._id,
                plantedDate: t.plantedDate
                  ? new Date(t.plantedDate).toLocaleDateString('en-GB')
                  : '—',
                status: t.status || 'HEALTHY',
                location: t.location || t.city || '—',
                height: t.height ? `${t.height} ft` : '—',
                co2: '—',
                progress: 0.6,
                imageUrl:
                  t.image ||
                  'https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=200',
                months: ['M1', 'M2', 'M3', 'M4'],
              })),
            );
          }
        }
      } catch {
        // keep mock trees
      }
    })();
    return () => {
      mounted = false;
    };
  }, [vehicle]);

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: getTopInset(10) }]}>
        <Pressable style={styles.headerBtn} onPress={onBack}>
          <Text style={styles.backIcon}>←</Text>
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {vehicle.name}
          </Text>
          <Text style={styles.headerSubtitle}>{vehicle.plate}</Text>
        </View>
        <Pressable style={styles.headerBtn}>
          <AppIcon name="bell-outline" size={20} color="#0a3617" />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: getBottomInset(32) },
        ]}
        showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={['#0c4820', '#2b964f', '#44b969']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.summaryCard}>
          <View style={styles.summaryTop}>
            <View style={styles.summaryAvatar}>
              <AppIcon
                name={getVehicleIconName(detailVehicle)}
                size={32}
                color="#ffffff"
              />
            </View>
            <View style={styles.summaryInfo}>
              <Text style={styles.summaryId}>{detailVehicle.vhId}</Text>
              <Text style={styles.summaryMeta}>
                {detailVehicle.plate} · {detailVehicle.fuel}
              </Text>
            </View>
            <View style={styles.qrBox}>
              <MaterialCommunityIcons name="qrcode" size={28} color="#fff" />
            </View>
          </View>

          <View style={styles.summaryStats}>
            <View style={styles.summaryStat}>
              <Text style={styles.summaryStatLabel}>Trees</Text>
              <Text style={styles.summaryStatValue}>{vehicle.trees}</Text>
            </View>
            <View style={styles.summaryStat}>
              <Text style={styles.summaryStatLabel}>CO₂ kg</Text>
              <Text style={styles.summaryStatValue}>{vehicle.co2}</Text>
            </View>
            <View style={styles.summaryStat}>
              <Text style={styles.summaryStatLabel}>Survival</Text>
              <Text style={styles.summaryStatValue}>{vehicle.survival}</Text>
            </View>
          </View>
        </LinearGradient>

        <Text style={styles.sectionTitle}>Vehicle Details</Text>
        <View style={styles.detailGrid}>
          {detailGrid.map(item => (
            <View key={item.label} style={styles.detailCell}>
              <MaterialCommunityIcons
                name={item.icon}
                size={18}
                color="#2b964f"
              />
              <Text style={styles.detailLabel}>{item.label}</Text>
              <Text style={styles.detailValue}>{item.value}</Text>
            </View>
          ))}
        </View>

        <View style={styles.treesHeader}>
          <Text style={styles.sectionTitle}>Assigned Trees</Text>
          <View style={styles.treesBadge}>
            <Text style={styles.treesBadgeText}>
              🌿 {vehicle.trees} trees · {vehicle.co2}kg CO₂
            </Text>
          </View>
        </View>

        <View style={styles.timeline}>
          <View style={styles.timelineLine} />
          {assignedTrees.map(tree => (
            <TreeItem key={tree.id} tree={tree} />
          ))}
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
    paddingHorizontal: 8,
  },
  headerTitle: {
    fontSize: 16,
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
  summaryCard: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
  },
  summaryTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  summaryAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  summaryIcon: {
    width: 36,
    height: 36,
  },
  summaryInfo: {
    flex: 1,
  },
  summaryId: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
  },
  summaryMeta: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
  },
  qrBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryStats: {
    flexDirection: 'row',
    gap: 10,
  },
  summaryStat: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  summaryStatLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 4,
  },
  summaryStatValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#fff',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0a3617',
    marginBottom: 14,
  },
  detailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 28,
  },
  detailCell: {
    width: '47%',
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  detailLabel: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 8,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0a3617',
  },
  treesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  treesBadge: {
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },
  treesBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2b964f',
  },
  timeline: {
    position: 'relative',
    paddingLeft: 8,
  },
  timelineLine: {
    position: 'absolute',
    left: 18,
    top: 20,
    bottom: 20,
    width: 2,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: '#b2f0c7',
  },
  treeItem: {
    position: 'relative',
    marginBottom: 14,
    paddingLeft: 28,
  },
  timelineDot: {
    position: 'absolute',
    left: 10,
    top: 24,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#2b964f',
    borderWidth: 2,
    borderColor: '#fff',
    zIndex: 1,
  },
  treeCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  treeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  treeThumb: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },
  treeHeaderInfo: {
    flex: 1,
  },
  treeName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0a3617',
    marginBottom: 2,
  },
  treeMeta: {
    fontSize: 11,
    color: '#9ca3af',
  },
  treeStatusBadge: {
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    marginRight: 8,
  },
  treeStatusText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2b964f',
  },
  treeChevron: {
    fontSize: 12,
    color: '#9ca3af',
  },
  treeExpanded: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    borderTopWidth: 1,
    borderTopColor: '#f0faf4',
  },
  treeLocation: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 12,
    marginBottom: 10,
  },
  progressTrack: {
    height: 6,
    backgroundColor: '#eef2ef',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 14,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2b964f',
    borderRadius: 3,
  },
  monthsRow: {
    gap: 10,
    paddingBottom: 14,
  },
  monthCard: {
    width: 72,
    alignItems: 'center',
  },
  monthImage: {
    width: 72,
    height: 72,
    borderRadius: 12,
    marginBottom: 6,
  },
  monthLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6b7280',
  },
  analyticsBtn: {
    backgroundColor: '#ecfdf5',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#b2f0c7',
  },
  analyticsBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#059669',
  },
});
