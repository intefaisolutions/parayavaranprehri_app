import React, { useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { getBottomInset, getTopInset } from '../utils/layout';
import {
  reportsService,
  settingsService,
  unwrapList,
  vidhanSabhasService,
} from '../api';

type Props = {
  onBack: () => void;
};

const STATS = [
  { icon: 'tree-outline' as const, label: 'Trees Planted', value: '1,84,230' },
  { icon: 'car-outline' as const, label: 'Active Vehicles', value: '42,190' },
  { icon: 'map-marker-account-outline' as const, label: 'Vidhan Sabhas', value: '9' },
  { icon: 'shield-check-outline' as const, label: 'Survival %', value: '91%' },
];

const MONTHLY_DATA = [
  { month: 'Jul', height: 40 },
  { month: 'Aug', height: 55 },
  { month: 'Sep', height: 68 },
  { month: 'Oct', height: 78 },
  { month: 'Nov', height: 88 },
  { month: 'Dec', height: 95 },
  { month: 'Jan', height: 100 },
  { month: 'Feb', height: 85 },
  { month: 'Mar', height: 72 },
];

const TOP_SABHAS = [
  { rank: 1, name: 'Rau', trees: '42,190', co2: '612t CO₂', progress: 1 },
  { rank: 2, name: 'Indore-2', trees: '31,200', co2: '451t CO₂', progress: 0.74 },
  { rank: 3, name: 'Mhow', trees: '24,800', co2: '358t CO₂', progress: 0.59 },
  { rank: 4, name: 'Sanwer', trees: '19,400', co2: '280t CO₂', progress: 0.46 },
];

const ADMIN_SETTINGS = [
  'Data source',
  'Analytics',
  'Reports',
  'Ranking rules',
  'Constituency settings',
  'Roles & access',
];

export default function AdminPreviewScreen({ onBack }: Props) {
  const [stats, setStats] = useState(STATS);
  const [topSabhas, setTopSabhas] = useState(TOP_SABHAS);
  const [adminSettings, setAdminSettings] = useState(ADMIN_SETTINGS);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const sabhas = await vidhanSabhasService.list({ page: 1, limit: 20 });
        const list = unwrapList(sabhas as any);
        if (mounted && list.length > 0) {
          const maxTrees = Math.max(
            ...list.map((s: any) => Number(s.totalTrees || 0)),
            1,
          );
          setTopSabhas(
            list.slice(0, 4).map((s: any, index: number) => ({
              rank: index + 1,
              name: s.vidhanSabhaName,
              trees: String(s.totalTrees ?? 0),
              co2: `${s.totalVehicles ?? 0} vehicles`,
              progress: Math.min(1, Number(s.totalTrees || 0) / maxTrees),
            })),
          );
          const totalTrees = list.reduce(
            (sum: number, s: any) => sum + Number(s.totalTrees || 0),
            0,
          );
          const totalVehicles = list.reduce(
            (sum: number, s: any) => sum + Number(s.totalVehicles || 0),
            0,
          );
          setStats([
            {
              icon: 'tree-outline',
              label: 'Trees Planted',
              value: totalTrees.toLocaleString('en-IN'),
            },
            {
              icon: 'car-outline',
              label: 'Active Vehicles',
              value: totalVehicles.toLocaleString('en-IN'),
            },
            {
              icon: 'map-marker-account-outline',
              label: 'Vidhan Sabhas',
              value: String(list.length),
            },
            {
              icon: 'shield-check-outline',
              label: 'Survival %',
              value: '91%',
            },
          ]);
        }
      } catch {
        // keep fallback
      }
      try {
        const settings = await settingsService.list({ page: 1, limit: 20 });
        const list = unwrapList(settings as any);
        if (mounted && list.length > 0) {
          setAdminSettings(list.map((s: any) => s.settingName));
        }
      } catch {
        // keep fallback
      }
      try {
        await reportsService.list({ page: 1, limit: 5 });
      } catch {
        // optional
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);
  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: getTopInset(10) }]}>
        <Pressable style={styles.headerBtn} onPress={onBack}>
          <Text style={styles.backIcon}>←</Text>
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Admin Preview</Text>
          <Text style={styles.headerSubtitle}>
            Indore · Vidhan Sabha analytics
          </Text>
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
        <View style={styles.configBanner}>
          <View style={styles.configBannerHeader}>
            <MaterialCommunityIcons name="tune-variant" size={18} color="#0c4820" />
            <Text style={styles.configBannerTitle}>Admin Configurable Module</Text>
          </View>
          <Text style={styles.configBannerText}>
            Data source · Analytics · Reports · Ranking rules · Constituency
            settings — all configurable by the platform admin. No hardcoded
            assumptions.
          </Text>
        </View>

        <View style={styles.statsGrid}>
          {stats.map(stat => (
            <View key={stat.label} style={styles.statCard}>
              <View style={styles.statIconCircle}>
                <MaterialCommunityIcons
                  name={stat.icon}
                  size={20}
                  color="#2b964f"
                />
              </View>
              <Text style={styles.statLabel}>{stat.label}</Text>
              <Text style={styles.statValue}>{stat.value}</Text>
            </View>
          ))}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Monthly plantations</Text>
          <View style={styles.configBadge}>
            <MaterialCommunityIcons name="cog-outline" size={12} color="#e65100" />
            <Text style={styles.configBadgeText}>Configurable</Text>
          </View>
        </View>

        <View style={styles.chartCard}>
          <View style={styles.chartBars}>
            {MONTHLY_DATA.map(item => (
              <View key={item.month} style={styles.barColumn}>
                <View style={styles.barTrack}>
                  <View
                    style={[styles.barFill, { height: `${item.height}%` }]}
                  />
                </View>
                <Text style={styles.barLabel}>{item.month}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Top performing Vidhan Sabhas</Text>
          <View style={styles.configBadge}>
            <MaterialCommunityIcons name="cog-outline" size={12} color="#e65100" />
            <Text style={styles.configBadgeText}>Configurable</Text>
          </View>
        </View>

        {topSabhas.map(item => (
          <View key={item.name} style={styles.sabhaCard}>
            <View style={styles.sabhaTop}>
              <View style={styles.rankBadge}>
                <Text style={styles.rankText}>#{item.rank}</Text>
              </View>
              <View style={styles.sabhaInfo}>
                <Text style={styles.sabhaName}>
                  {item.name}{' '}
                  <Text style={styles.sabhaSub}>Vidhan Sabha</Text>
                </Text>
              </View>
              <View style={styles.sabhaStats}>
                <Text style={styles.sabhaTrees}>{item.trees}</Text>
                <Text style={styles.sabhaCo2}>{item.co2}</Text>
              </View>
            </View>
            <View style={styles.progressTrack}>
              <View
                style={[styles.progressFill, { width: `${item.progress * 100}%` }]}
              />
            </View>
          </View>
        ))}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Vehicle verifications</Text>
          <View style={styles.configBadge}>
            <MaterialCommunityIcons name="cog-outline" size={12} color="#e65100" />
            <Text style={styles.configBadgeText}>Configurable</Text>
          </View>
        </View>

        <View style={styles.verifyRow}>
          <View style={[styles.verifyCard, styles.verifyVerified]}>
            <Text style={styles.verifyLabel}>VERIFIED</Text>
            <Text style={[styles.verifyValue, styles.verifyValueGreen]}>
              38,200
            </Text>
          </View>
          <View style={[styles.verifyCard, styles.verifyPending]}>
            <Text style={styles.verifyLabel}>PENDING</Text>
            <Text style={[styles.verifyValue, styles.verifyValueOrange]}>
              2,840
            </Text>
          </View>
          <View style={[styles.verifyCard, styles.verifyRejected]}>
            <Text style={styles.verifyLabel}>REJECTED</Text>
            <Text style={[styles.verifyValue, styles.verifyValueRed]}>1,150</Text>
          </View>
        </View>

        <View style={styles.settingsCard}>
          <View style={styles.settingsHeader}>
            <MaterialCommunityIcons name="tune-variant" size={18} color="#f27e20" />
            <Text style={styles.settingsTitle}>Settings · Admin Only</Text>
          </View>
          <View style={styles.settingsGrid}>
            {adminSettings.map(label => (
              <Pressable key={label} style={styles.settingsBtn}>
                <Text style={styles.settingsBtnText}>{label}</Text>
              </Pressable>
            ))}
          </View>
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
  configBanner: {
    backgroundColor: '#e8f5e9',
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
  },
  configBannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  configBannerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0c4820',
  },
  configBannerText: {
    fontSize: 12,
    color: '#2b964f',
    lineHeight: 18,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    width: '47%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  statIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e8f5e9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0a3617',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0a3617',
    flex: 1,
  },
  configBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fff3e0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  configBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#e65100',
  },
  chartCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  chartBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 140,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
  },
  barTrack: {
    width: 18,
    height: 110,
    backgroundColor: '#f0faf4',
    borderRadius: 9,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    marginBottom: 8,
  },
  barFill: {
    width: '100%',
    backgroundColor: '#2b964f',
    borderRadius: 9,
  },
  barLabel: {
    fontSize: 10,
    color: '#6b7280',
    fontWeight: '600',
  },
  sabhaCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  sabhaTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  rankBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2b964f',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rankText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  sabhaInfo: {
    flex: 1,
  },
  sabhaName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0a3617',
  },
  sabhaSub: {
    fontSize: 13,
    fontWeight: '400',
    color: '#9ca3af',
  },
  sabhaStats: {
    alignItems: 'flex-end',
  },
  sabhaTrees: {
    fontSize: 16,
    fontWeight: '900',
    color: '#2b964f',
  },
  sabhaCo2: {
    fontSize: 11,
    color: '#9ca3af',
  },
  progressTrack: {
    height: 6,
    backgroundColor: '#eef2ef',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2b964f',
    borderRadius: 3,
  },
  verifyRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  verifyCard: {
    flex: 1,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
  },
  verifyVerified: {
    backgroundColor: '#e8f5e9',
  },
  verifyPending: {
    backgroundColor: '#fff8e1',
  },
  verifyRejected: {
    backgroundColor: '#ffebee',
  },
  verifyLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#6b7280',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  verifyValue: {
    fontSize: 18,
    fontWeight: '900',
  },
  verifyValueGreen: {
    color: '#0c4820',
  },
  verifyValueOrange: {
    color: '#e65100',
  },
  verifyValueRed: {
    color: '#c62828',
  },
  settingsCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  settingsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  settingsTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0a3617',
  },
  settingsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  settingsBtn: {
    width: '47%',
    backgroundColor: '#f3f4f6',
    borderRadius: 24,
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  settingsBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
});
