import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AppIcon from '../components/AppIcon';
import QrImage from '../components/QrImage';
import {
  AssignedTree,
  TreeMonthPoint,
} from '../data/vehicleDetailData';
import { Vehicle } from '../data/vehiclesData';
import { getVehicleIconName } from '../utils/vehicleIcons';
import { getBottomInset, getTopInset } from '../utils/layout';
import { ApiError, getStoredUser, treesService, vehiclesService } from '../api';
import { canFetchVehicleTrees } from '../api/mappers';

type Props = {
  vehicle: Vehicle;
  onBack: () => void;
  onNotifications?: () => void;
  onDeleted?: () => void;
};

function isRealImageUrl(value?: string | null): value is string {
  if (!value || typeof value !== 'string') return false;
  const url = value.trim();
  if (!url) return false;
  if (/unsplash\.com/i.test(url)) return false;
  return (
    /^https?:\/\//i.test(url) ||
    url.startsWith('file:') ||
    url.startsWith('content:')
  );
}

function TreeThumb({ uri }: { uri?: string }) {
  if (isRealImageUrl(uri)) {
    return <Image source={{ uri }} style={styles.treeThumb} />;
  }
  return (
    <View style={[styles.treeThumb, styles.treeThumbPlaceholder]}>
      <MaterialCommunityIcons name="tree-outline" size={22} color="#2b964f" />
    </View>
  );
}

function applyAnalytics(
  prev: AssignedTree,
  a: Awaited<ReturnType<typeof treesService.getAnalytics>>,
): AssignedTree {
  const series: TreeMonthPoint[] = Array.isArray(a.monthlySeries)
    ? a.monthlySeries.map(point => ({
        label: point.label,
        progress: Number(point.progress) || 0,
        photoUrl: isRealImageUrl(point.photoUrl) ? point.photoUrl : undefined,
      }))
    : [];

  const photos = Array.isArray(a.monthlyPhotos)
    ? a.monthlyPhotos.filter(isRealImageUrl)
    : [];
  const imageUrl =
    (isRealImageUrl(a.image) ? a.image : undefined) ||
    photos[0] ||
    series.find(p => p.photoUrl)?.photoUrl ||
    prev.imageUrl;

  return {
    ...prev,
    name: a.species || prev.name,
    status: a.status || prev.status,
    height: a.height != null ? `${a.height} m` : prev.height,
    co2:
      typeof a.co2Kg === 'number'
        ? `${Math.round(a.co2Kg)}kg CO₂`
        : prev.co2,
    progress: typeof a.progress === 'number' ? a.progress / 100 : prev.progress,
    location: a.vidhanSabha || prev.location,
    imageUrl,
    months: series,
  };
}

function TreeItem({ tree }: { tree: AssignedTree }) {
  const [expanded, setExpanded] = useState(false);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [analyticsError, setAnalyticsError] = useState('');
  const [live, setLive] = useState<AssignedTree>(tree);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLive(tree);
    setLoaded(false);
    setAnalyticsError('');
  }, [tree]);

  const loadAnalytics = async () => {
    const id = tree.apiId || tree.id;
    if (!id || loadingAnalytics) return;
    setLoadingAnalytics(true);
    setAnalyticsError('');
    try {
      const a = await treesService.getAnalytics(id);
      setLive(prev => applyAnalytics(prev, a));
      setLoaded(true);
    } catch (error) {
      setAnalyticsError(
        error instanceof ApiError
          ? error.message
          : 'Could not load tree analytics',
      );
    } finally {
      setLoadingAnalytics(false);
    }
  };

  useEffect(() => {
    if (expanded && !loaded && !loadingAnalytics) {
      void loadAnalytics();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expanded]);

  const photoMonths = live.months.filter(m => isRealImageUrl(m.photoUrl));

  return (
    <View style={styles.treeItem}>
      <View style={styles.timelineDot} />
      <View style={styles.treeCard}>
        <Pressable
          style={styles.treeHeader}
          onPress={() => setExpanded(prev => !prev)}>
          <TreeThumb uri={live.imageUrl} />
          <View style={styles.treeHeaderInfo}>
            <Text style={styles.treeName}>{live.name}</Text>
            <Text style={styles.treeMeta}>
              {live.treeId} · {live.plantedDate}
            </Text>
          </View>
          <View style={styles.treeStatusBadge}>
            <Text style={styles.treeStatusText}>{live.status}</Text>
          </View>
          <Text style={styles.treeChevron}>{expanded ? '▲' : '▼'}</Text>
        </Pressable>

        {expanded ? (
          <View style={styles.treeExpanded}>
            <Text style={styles.treeLocation}>
              {live.location} · {live.height} · {live.co2}
            </Text>

            {loadingAnalytics && !loaded ? (
              <View style={styles.analyticsLoading}>
                <ActivityIndicator color="#126e35" />
                <Text style={styles.analyticsLoadingText}>
                  Loading analytics…
                </Text>
              </View>
            ) : null}

            {analyticsError ? (
              <Text style={styles.analyticsError}>{analyticsError}</Text>
            ) : null}

            {live.progress != null ? (
              <>
                <View style={styles.progressHeader}>
                  <Text style={styles.progressLabel}>Tree progress</Text>
                  <Text style={styles.progressPct}>
                    {Math.round(live.progress * 100)}%
                  </Text>
                </View>
                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${Math.min(
                          100,
                          Math.max(0, live.progress * 100),
                        )}%`,
                      },
                    ]}
                  />
                </View>
              </>
            ) : !loadingAnalytics ? (
              <Text style={styles.emptyAnalytics}>
                Progress unavailable until analytics loads.
              </Text>
            ) : null}

            {live.months.length > 0 ? (
              <>
                <Text style={styles.monthsTitle}>Monthly progress</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.monthsRow}>
                  {live.months.map((month, index) => (
                    <View
                      key={`${month.label}-${index}`}
                      style={styles.monthCard}>
                      <View style={styles.monthBarTrack}>
                        <View
                          style={[
                            styles.monthBarFill,
                            {
                              height: `${Math.min(
                                100,
                                Math.max(4, month.progress),
                              )}%`,
                            },
                          ]}
                        />
                      </View>
                      <Text style={styles.monthLabel}>{month.label}</Text>
                      <Text style={styles.monthPct}>{month.progress}%</Text>
                    </View>
                  ))}
                </ScrollView>
              </>
            ) : loaded ? (
              <Text style={styles.emptyAnalytics}>
                No monthly series for this tree yet.
              </Text>
            ) : null}

            {photoMonths.length > 0 ? (
              <>
                <Text style={styles.monthsTitle}>Tree photos</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.monthsRow}>
                  {photoMonths.map((month, index) => (
                    <View
                      key={`photo-${month.label}-${index}`}
                      style={styles.photoCard}>
                      <Image
                        source={{ uri: month.photoUrl }}
                        style={styles.monthImage}
                      />
                      <Text style={styles.monthLabel}>{month.label}</Text>
                    </View>
                  ))}
                </ScrollView>
              </>
            ) : loaded ? (
              <Text style={styles.emptyAnalytics}>
                No uploaded tree photo yet.
              </Text>
            ) : null}

            <Pressable
              style={styles.analyticsBtn}
              onPress={() => void loadAnalytics()}
              disabled={loadingAnalytics}>
              {loadingAnalytics ? (
                <ActivityIndicator color="#126e35" />
              ) : (
                <Text style={styles.analyticsBtnText}>
                  Refresh tree analytics →
                </Text>
              )}
            </Pressable>
          </View>
        ) : null}
      </View>
    </View>
  );
}

export default function VehicleDetailScreen({
  vehicle,
  onBack,
  onNotifications,
  onDeleted,
}: Props) {
  const [detailVehicle, setDetailVehicle] = useState(vehicle);
  const [ownerName, setOwnerName] = useState('—');
  const [insuranceLabel, setInsuranceLabel] = useState('—');
  const [rtoLabel, setRtoLabel] = useState('—');
  const [assignedTrees, setAssignedTrees] = useState<AssignedTree[]>([]);
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState(vehicle.name);
  const [editFuel, setEditFuel] = useState(vehicle.fuel);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isEditable = canFetchVehicleTrees(vehicle.id);

  const qrPayload = useMemo(() => {
    const vhId = detailVehicle.vhId || vehicle.vhId || '';
    const plate = detailVehicle.plate || vehicle.plate || '';
    return `PPVH:${vhId}|${plate}`;
  }, [detailVehicle.vhId, detailVehicle.plate, vehicle.vhId, vehicle.plate]);

  const detailGrid = [
    { icon: 'account-outline' as const, label: 'Owner', value: ownerName },
    {
      icon: 'shield-check-outline' as const,
      label: 'Insurance',
      value: insuranceLabel,
    },
    {
      icon: 'gas-station-outline' as const,
      label: 'Fuel Type',
      value: detailVehicle.fuel,
    },
    {
      icon: 'check-decagram-outline' as const,
      label: 'Status',
      value: detailVehicle.status,
    },
    {
      icon: 'calendar-outline' as const,
      label: 'Registered',
      value: detailVehicle.regDate,
    },
    { icon: 'map-marker-outline' as const, label: 'RTO', value: rtoLabel },
  ];

  useEffect(() => {
    setEditName(vehicle.name);
    setEditFuel(vehicle.fuel);
  }, [vehicle]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const user = await getStoredUser();
        if (mounted && user) {
          const full = `${user.firstName || ''} ${user.lastName || ''}`.trim();
          if (full) setOwnerName(full);
          const loc = [user.district, user.state].filter(Boolean).join(', ');
          if (loc) setRtoLabel(loc);
        }
      } catch {
        // keep —
      }
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
          setEditName(apiVehicle.name || vehicle.name);
          setEditFuel(apiVehicle.fuel || vehicle.fuel);
          const anyV = apiVehicle as Record<string, unknown>;
          if (anyV.insurance || anyV.insuranceId) {
            setInsuranceLabel(
              String(anyV.insurance || anyV.insuranceId || '—'),
            );
          }
          if (anyV.rto || anyV.city || anyV.state) {
            setRtoLabel(
              [anyV.rto || anyV.city, anyV.state].filter(Boolean).join(', ') ||
                '—',
            );
          }
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
        const treeRes = await vehiclesService.getTrees(vehicle.id);
        if (mounted && treeRes?.trees) {
          setAssignedTrees(
            treeRes.trees.map((t, index) => ({
              id: String(t._id || index + 1),
              apiId: String(t._id || ''),
              name: t.species || t.treeName || 'Tree',
              treeId: t.treeId || String(t._id || ''),
              plantedDate: t.plantedDate
                ? new Date(t.plantedDate).toLocaleDateString('en-GB')
                : '—',
              status: t.status || 'HEALTHY',
              location: t.vidhanSabha || '—',
              height: t.height != null ? `${t.height} m` : '—',
              co2:
                typeof t.co2Kg === 'number'
                  ? `${Math.round(t.co2Kg)}kg CO₂`
                  : '—',
              progress: null,
              imageUrl: isRealImageUrl(t.image) ? t.image : undefined,
              months: [],
            })),
          );
        } else if (mounted) {
          setAssignedTrees([]);
        }
      } catch {
        if (mounted) setAssignedTrees([]);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [vehicle]);

  const handleSaveEdit = async () => {
    if (!isEditable || saving) return;
    setSaving(true);
    try {
      const updated = await vehiclesService.update(vehicle.id, {
        name: editName.trim() || detailVehicle.name,
        fuel: editFuel.trim() || detailVehicle.fuel,
      });
      setDetailVehicle(prev => ({
        ...prev,
        name: updated.name || editName,
        fuel: updated.fuel || editFuel,
      }));
      setEditOpen(false);
    } catch (error) {
      Alert.alert(
        'Update failed',
        error instanceof ApiError ? error.message : 'Could not update vehicle',
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (!isEditable || deleting) return;
    Alert.alert(
      'Delete vehicle',
      'Remove this vehicle from your account?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              setDeleting(true);
              try {
                await vehiclesService.remove(vehicle.id);
                if (onDeleted) onDeleted();
                else onBack();
              } catch (error) {
                Alert.alert(
                  'Delete failed',
                  error instanceof ApiError
                    ? error.message
                    : 'Could not delete vehicle',
                );
              } finally {
                setDeleting(false);
              }
            })();
          },
        },
      ],
    );
  };

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: getTopInset(10) }]}>
        <Pressable style={styles.headerBtn} onPress={onBack}>
          <Text style={styles.backIcon}>←</Text>
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {detailVehicle.name}
          </Text>
          <Text style={styles.headerSubtitle}>{detailVehicle.plate}</Text>
        </View>
        <Pressable style={styles.headerBtn} onPress={onNotifications}>
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
              <QrImage data={qrPayload} size={44} style={styles.qrImage} />
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

        {isEditable ? (
          <View style={styles.actionRow}>
            <Pressable
              style={styles.actionBtn}
              onPress={() => setEditOpen(true)}>
              <Text style={styles.actionBtnText}>Edit</Text>
            </Pressable>
            <Pressable
              style={[styles.actionBtn, styles.actionBtnDanger]}
              onPress={handleDelete}
              disabled={deleting}>
              {deleting ? (
                <ActivityIndicator color="#be123c" />
              ) : (
                <Text style={[styles.actionBtnText, styles.actionBtnDangerText]}>
                  Delete
                </Text>
              )}
            </Pressable>
          </View>
        ) : null}

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
          {assignedTrees.length === 0 ? (
            <Text style={styles.emptyTrees}>
              No trees assigned to this vehicle yet.
            </Text>
          ) : (
            assignedTrees.map(tree => (
              <TreeItem key={tree.id} tree={tree} />
            ))
          )}
        </View>
      </ScrollView>

      <Modal visible={editOpen} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Edit vehicle</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Vehicle name"
              value={editName}
              onChangeText={setEditName}
            />
            <View style={styles.fuelRow}>
              {['Petrol', 'Diesel', 'CNG', 'Electric'].map(f => (
                <Pressable
                  key={f}
                  style={[
                    styles.fuelChip,
                    editFuel === f && styles.fuelChipActive,
                  ]}
                  onPress={() => setEditFuel(f)}>
                  <Text
                    style={[
                      styles.fuelChipText,
                      editFuel === f && styles.fuelChipTextActive,
                    ]}>
                    {f}
                  </Text>
                </Pressable>
              ))}
            </View>
            <View style={styles.modalActions}>
              <Pressable
                style={styles.modalCancel}
                onPress={() => setEditOpen(false)}
                disabled={saving}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={styles.modalSave}
                onPress={() => void handleSaveEdit()}
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
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  qrImage: {
    borderRadius: 8,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  actionBtn: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    paddingVertical: 12,
    alignItems: 'center',
  },
  actionBtnText: {
    color: '#0a3617',
    fontWeight: '700',
    fontSize: 14,
  },
  actionBtnDanger: {
    borderColor: '#fecdd3',
    backgroundColor: '#fff1f2',
  },
  actionBtnDangerText: {
    color: '#be123c',
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
  fuelRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  fuelChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  fuelChipActive: {
    backgroundColor: '#e8f7ee',
    borderColor: '#136e35',
  },
  fuelChipText: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '600',
  },
  fuelChipTextActive: {
    color: '#136e35',
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
  emptyTrees: {
    fontSize: 13,
    color: '#6b7280',
    paddingVertical: 16,
    paddingLeft: 20,
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
  treeThumbPlaceholder: {
    backgroundColor: '#e8f5e9',
    alignItems: 'center',
    justifyContent: 'center',
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
  analyticsLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  analyticsLoadingText: {
    fontSize: 12,
    color: '#6b7280',
  },
  analyticsError: {
    fontSize: 12,
    color: '#d32f2f',
    marginBottom: 10,
  },
  emptyAnalytics: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 12,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0a3617',
  },
  progressPct: {
    fontSize: 12,
    fontWeight: '800',
    color: '#2b964f',
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
  monthsTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0a3617',
    marginBottom: 8,
  },
  monthsRow: {
    gap: 10,
    paddingBottom: 14,
  },
  monthCard: {
    width: 56,
    alignItems: 'center',
  },
  photoCard: {
    width: 72,
    alignItems: 'center',
  },
  monthBarTrack: {
    width: 28,
    height: 72,
    backgroundColor: '#f0faf4',
    borderRadius: 8,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    marginBottom: 6,
  },
  monthBarFill: {
    width: '100%',
    backgroundColor: '#2b964f',
    borderRadius: 8,
  },
  monthImage: {
    width: 72,
    height: 72,
    borderRadius: 12,
    marginBottom: 6,
  },
  monthLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6b7280',
    textAlign: 'center',
  },
  monthPct: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2b964f',
    marginTop: 2,
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
