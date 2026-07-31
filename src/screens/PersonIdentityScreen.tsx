import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import AppIcon from '../components/AppIcon';
import { getBottomInset, getTopInset } from '../utils/layout';
import {
  ApiError,
  getStoredPhone,
  getStoredUser,
  personIdentityService,
  treesService,
  unwrapList,
  usersService,
  vehiclesService,
  type PersonIdentity,
} from '../api';
import { mapApiVehicleToUi } from '../api/mappers';

type Props = {
  onBack: () => void;
};

type LinkedVehicle = {
  id: string;
  name: string;
  meta: string;
  icon: 'car-side' | 'car-pickup';
};

const FALLBACK_GRID = [
  { label: 'ADDRESS', value: 'Indore, Madhya Pradesh' },
  { label: 'VIDHAN SABHA', value: 'Rau' },
  { label: 'LINKED VEHICLES', value: '0' },
  { label: 'TREES ASSIGNED', value: '0' },
  { label: 'CO₂ OFFSET', value: '—' },
  { label: 'JOINED', value: '—' },
];

export default function PersonIdentityScreen({ onBack }: Props) {
  const [loading, setLoading] = useState(true);
  const [identity, setIdentity] = useState<PersonIdentity | null>(null);
  const [displayName, setDisplayName] = useState('Citizen');
  const [phone, setPhone] = useState('');
  const [personId, setPersonId] = useState('—');
  const [linkedVehicles, setLinkedVehicles] = useState<LinkedVehicle[]>([]);
  const [grid, setGrid] = useState(FALLBACK_GRID);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [user, storedPhone, vehicles, identities] = await Promise.all([
          getStoredUser(),
          getStoredPhone(),
          vehiclesService.list().catch(() => []),
          personIdentityService.list({ page: 1, limit: 20 }).catch(() => []),
        ]);

        const phoneVal = storedPhone || user?.phone || '';
        const nameVal = user
          ? `${user.firstName} ${user.lastName}`.trim()
          : 'Citizen';

        const vehicleList = Array.isArray(vehicles) ? vehicles : [];
        const mappedVehicles = vehicleList.map(mapApiVehicleToUi);
        const linked = mappedVehicles.map(v => ({
          id: v.id,
          name: v.name,
          meta: `${v.plate} · ${v.fuel}`,
          icon: (v.name.toLowerCase().includes('thar')
            ? 'car-pickup'
            : 'car-side') as 'car-side' | 'car-pickup',
        }));

        let treeCount = 0;
        if (phoneVal) {
          try {
            const grouped = await treesService.listByMobile(phoneVal);
            if (Array.isArray(grouped)) {
              treeCount = grouped.reduce((sum: number, g: any) => {
                if (Array.isArray(g?.trees)) return sum + g.trees.length;
                return sum + 1;
              }, 0);
            }
          } catch {
            // ignore
          }
        }

        const idList = unwrapList(identities as any) as PersonIdentity[];
        const match: PersonIdentity | null =
          idList.find(i =>
            Boolean(
              i.personMobile &&
                phoneVal &&
                i.personMobile.replace(/\D/g, '').endsWith(phoneVal),
            ),
          ) || idList[0] || null;

        if (!mounted) return;

        setDisplayName(match?.personName || nameVal);
        setPhone(match?.personMobile || phoneVal || '—');
        setPersonId(match?.identityId || user?.id || '—');
        setIdentity(match);
        setLinkedVehicles(
          linked.length
            ? linked
            : [
                {
                  id: '0',
                  name: 'No linked vehicles',
                  meta: 'Add a vehicle to link',
                  icon: 'car-side',
                },
              ],
        );
        setGrid([
          {
            label: 'ADDRESS',
            value: user?.district
              ? `${user.district}${user.state ? `, ${user.state}` : ''}`
              : 'Indore, Madhya Pradesh',
          },
          { label: 'VIDHAN SABHA', value: '—' },
          { label: 'LINKED VEHICLES', value: String(mappedVehicles.length) },
          { label: 'TREES ASSIGNED', value: String(treeCount) },
          { label: 'CO₂ OFFSET', value: '—' },
          {
            label: 'JOINED',
            value: match?.generatedDate
              ? new Date(match.generatedDate).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })
              : '—',
          },
        ]);

        // Touch users/me/vehicles if available (insurance proxy)
        try {
          await usersService.getMyVehicles();
        } catch {
          // optional
        }
      } catch (error) {
        if (mounted) {
          setErrorMsg(
            error instanceof ApiError
              ? error.message
              : 'Failed to load identity',
          );
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <View style={[styles.root, styles.centered]}>
        <ActivityIndicator size="large" color="#136e35" />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: getTopInset(10) }]}>
        <Pressable style={styles.headerBtn} onPress={onBack}>
          <Text style={styles.backIcon}>←</Text>
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Person Identity</Text>
          <Text style={styles.headerSubtitle}>Citizen-centric eco identity</Text>
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
        {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}
        <LinearGradient
          colors={['#f27e20', '#2bb373']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.idCardBorder}>
          <View style={styles.idCard}>
            <View style={styles.idCardHeader}>
              <View style={styles.idBrandRow}>
                <View style={styles.inLogo}>
                  <Text style={styles.inLogoText}>IN</Text>
                </View>
                <View>
                  <Text style={styles.idBrandLabel}>PARYAVARAN PRAHRI</Text>
                  <Text style={styles.idBrandTitle}>Digital Person Identity</Text>
                </View>
              </View>
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedText}>
                  {identity?.status === 'Active' || !identity
                    ? '✓ Verified'
                    : identity.status}
                </Text>
              </View>
            </View>

            <Text style={styles.idName}>{displayName}</Text>
            <Text style={styles.idFieldValue}>+91 {phone}</Text>
            <Text style={styles.idMeta}>ID: {personId}</Text>
            {identity?.qrCode ? (
              <Text style={styles.idMeta}>QR: {identity.qrCode}</Text>
            ) : null}
          </View>
        </LinearGradient>

        <View style={styles.grid}>
          {grid.map(item => (
            <View key={item.label} style={styles.gridItem}>
              <Text style={styles.gridLabel}>{item.label}</Text>
              <Text style={styles.gridValue}>{item.value}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Linked Vehicles</Text>
        {linkedVehicles.map(vehicle => (
          <View key={vehicle.id} style={styles.vehicleCard}>
            <AppIcon name={vehicle.icon} size={22} color="#126e35" />
            <View style={{ flex: 1 }}>
              <Text style={styles.vehicleName}>{vehicle.name}</Text>
              <Text style={styles.vehicleMeta}>{vehicle.meta}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f4f9f4' },
  centered: { alignItems: 'center', justifyContent: 'center' },
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
  backIcon: { fontSize: 20, color: '#111827', fontWeight: '600' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '800', color: '#0a3617' },
  headerSubtitle: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  scrollContent: { padding: 16, gap: 12 },
  errorText: { color: '#d32f2f', fontSize: 12 },
  idCardBorder: { borderRadius: 20, padding: 2 },
  idCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
  },
  idCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  idBrandRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  inLogo: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#0c4820',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inLogoText: { color: '#fff', fontWeight: '800' },
  idBrandLabel: { fontSize: 10, color: '#6b7280', fontWeight: '700' },
  idBrandTitle: { fontSize: 13, fontWeight: '800', color: '#0a3617' },
  verifiedBadge: {
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  verifiedText: { color: '#16a34a', fontSize: 11, fontWeight: '700' },
  idName: { fontSize: 20, fontWeight: '800', color: '#111827' },
  idFieldValue: { fontSize: 14, color: '#374151', marginTop: 4 },
  idMeta: { fontSize: 12, color: '#6b7280', marginTop: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  gridItem: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
  },
  gridLabel: { fontSize: 10, color: '#9ca3af', fontWeight: '700' },
  gridValue: { fontSize: 13, color: '#111827', fontWeight: '700', marginTop: 4 },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0a3617',
    marginTop: 8,
  },
  vehicleCard: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
  },
  vehicleName: { fontSize: 14, fontWeight: '700', color: '#111827' },
  vehicleMeta: { fontSize: 12, color: '#6b7280', marginTop: 2 },
});
