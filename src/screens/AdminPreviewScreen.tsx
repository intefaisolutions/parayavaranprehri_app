import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { getBottomInset, getTopInset } from '../utils/layout';
import {
  missionProgressService,
  reportsService,
  settingsService,
  unwrapList,
  vidhanSabhasService,
} from '../api';

type Props = {
  onBack: () => void;
  onNotifications?: () => void;
};

type StatCard = {
  icon: string;
  label: string;
  value: string;
};

type SabhaRow = {
  rank: number;
  name: string;
  trees: string;
  vehicles: string;
  progress: number;
};

type ReportRow = {
  id: string;
  name: string;
  type: string;
  status: string;
  generatedBy?: string;
};

export default function AdminPreviewScreen({
  onBack,
  onNotifications,
}: Props) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<StatCard[]>([]);
  const [topSabhas, setTopSabhas] = useState<SabhaRow[]>([]);
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [adminSettings, setAdminSettings] = useState<string[]>([]);
  const [monthlyBars, setMonthlyBars] = useState<
    Array<{ label: string; count: number; heightPct: number }>
  >([]);
  const [monthlyTotal, setMonthlyTotal] = useState(0);

  useEffect(() => {
    let mounted = true;
    (async () => {
      let nextStats: StatCard[] = [];
      let nextSabhas: SabhaRow[] = [];
      let nextReports: ReportRow[] = [];
      let nextSettings: string[] = [];
      let missionPercent: string | null = null;

      try {
        const progress = await missionProgressService.get();
        if (progress && typeof progress.percent === 'number') {
          missionPercent = `${progress.percent}%`;
        }
      } catch {
        // optional
      }

      try {
        const sabhas = await vidhanSabhasService.list({ page: 1, limit: 50 });
        const list = unwrapList(sabhas as any) as Array<{
          vidhanSabhaName?: string;
          totalTrees?: number;
          totalVehicles?: number;
        }>;
        if (list.length > 0) {
          const sorted = [...list].sort(
            (a, b) => Number(b.totalTrees || 0) - Number(a.totalTrees || 0),
          );
          const maxTrees = Math.max(
            ...sorted.map(s => Number(s.totalTrees || 0)),
            1,
          );
          nextSabhas = sorted.slice(0, 8).map((s, index) => ({
            rank: index + 1,
            name: s.vidhanSabhaName || `Sabha ${index + 1}`,
            trees: Number(s.totalTrees || 0).toLocaleString('en-IN'),
            vehicles: `${Number(s.totalVehicles || 0).toLocaleString('en-IN')} vehicles`,
            progress: Math.min(1, Number(s.totalTrees || 0) / maxTrees),
          }));

          const totalTrees = sorted.reduce(
            (sum, s) => sum + Number(s.totalTrees || 0),
            0,
          );
          const totalVehicles = sorted.reduce(
            (sum, s) => sum + Number(s.totalVehicles || 0),
            0,
          );
          nextStats = [
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
              value: String(sorted.length),
            },
            {
              icon: 'shield-check-outline',
              label: 'Mission Progress',
              value: missionPercent ?? '—',
            },
          ];
        } else if (missionPercent) {
          nextStats = [
            {
              icon: 'shield-check-outline',
              label: 'Mission Progress',
              value: missionPercent,
            },
          ];
        }
      } catch {
        if (missionPercent) {
          nextStats = [
            {
              icon: 'shield-check-outline',
              label: 'Mission Progress',
              value: missionPercent,
            },
          ];
        }
      }

      try {
        const monthly = await reportsService.monthlyPlantations({ months: 6 });
        if (monthly?.months) {
          setMonthlyBars(
            monthly.months.map(m => ({
              label: m.label,
              count: m.count,
              heightPct: m.heightPct,
            })),
          );
          setMonthlyTotal(Number(monthly.total) || 0);
        }
      } catch {
        // optional chart
      }

      try {
        const reportsRes = await reportsService.list({ page: 1, limit: 10 });
        const list = unwrapList(reportsRes as any) as Array<{
          _id?: string;
          reportName?: string;
          reportType?: string;
          status?: string;
          generatedBy?: string;
        }>;
        nextReports = list.map((r, index) => ({
          id: String(r._id || index),
          name: r.reportName || `Report ${index + 1}`,
          type: r.reportType || 'Report',
          status: r.status || 'Unknown',
          generatedBy: r.generatedBy,
        }));
      } catch {
        nextReports = [];
      }

      try {
        const settings = await settingsService.list({ page: 1, limit: 20 });
        const list = unwrapList(settings as any) as Array<{
          settingName?: string;
        }>;
        nextSettings = list
          .map(s => s.settingName)
          .filter((name): name is string => Boolean(name));
      } catch {
        nextSettings = [];
      }

      if (mounted) {
        setStats(nextStats);
        setTopSabhas(nextSabhas);
        setReports(nextReports);
        setAdminSettings(nextSettings);
        setLoading(false);
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
            Live Vidhan Sabha · Reports
          </Text>
        </View>
        <Pressable style={styles.headerBtn} onPress={onNotifications}>
          <Text style={styles.bellIcon}>🔔</Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#136e35" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: getBottomInset(32) },
          ]}
          showsVerticalScrollIndicator={false}>
          <View style={styles.configBanner}>
            <View style={styles.configBannerHeader}>
              <MaterialCommunityIcons
                name="tune-variant"
                size={18}
                color="#0c4820"
              />
              <Text style={styles.configBannerTitle}>
                Live aggregations from CMS
              </Text>
            </View>
            <Text style={styles.configBannerText}>
              Vidhan Sabha totals, mission progress, monthly plantations, and
              reports from live APIs.
            </Text>
          </View>

          {stats.length > 0 ? (
            <View style={styles.statsGrid}>
              {stats.map(stat => (
                <View key={stat.label} style={styles.statCard}>
                  <View style={styles.statIconCircle}>
                    <MaterialCommunityIcons
                      name={stat.icon as any}
                      size={20}
                      color="#2b964f"
                    />
                  </View>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                  <Text style={styles.statValue}>{stat.value}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.emptyText}>No constituency stats yet.</Text>
          )}

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Monthly plantations ({monthlyTotal})
            </Text>
          </View>
          {monthlyBars.length === 0 ? (
            <Text style={styles.emptyText}>No plantation months yet.</Text>
          ) : (
            <View style={styles.chartCard}>
              <View style={styles.chartBars}>
                {monthlyBars.map(item => (
                  <View key={item.label} style={styles.barColumn}>
                    <Text style={styles.barCount}>{item.count}</Text>
                    <View style={styles.barTrack}>
                      <View
                        style={[
                          styles.barFill,
                          {
                            height: `${Math.max(4, item.heightPct)}%`,
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.barLabel}>{item.label}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Top Vidhan Sabhas</Text>
          </View>

          {topSabhas.length === 0 ? (
            <Text style={styles.emptyText}>No Vidhan Sabha data yet.</Text>
          ) : (
            topSabhas.map(item => (
              <View key={`${item.rank}-${item.name}`} style={styles.sabhaCard}>
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
                    <Text style={styles.sabhaCo2}>{item.vehicles}</Text>
                  </View>
                </View>
                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${item.progress * 100}%` },
                    ]}
                  />
                </View>
              </View>
            ))
          )}

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Reports</Text>
          </View>

          {reports.length === 0 ? (
            <Text style={styles.emptyText}>No reports generated yet.</Text>
          ) : (
            reports.map(report => (
              <View key={report.id} style={styles.reportCard}>
                <View style={styles.reportTop}>
                  <Text style={styles.reportName}>{report.name}</Text>
                  <View style={styles.reportStatus}>
                    <Text style={styles.reportStatusText}>{report.status}</Text>
                  </View>
                </View>
                <Text style={styles.reportMeta}>
                  {report.type}
                  {report.generatedBy ? ` · ${report.generatedBy}` : ''}
                </Text>
              </View>
            ))
          )}

          {adminSettings.length > 0 ? (
            <View style={styles.settingsCard}>
              <View style={styles.settingsHeader}>
                <MaterialCommunityIcons
                  name="tune-variant"
                  size={18}
                  color="#f27e20"
                />
                <Text style={styles.settingsTitle}>Settings · from CMS</Text>
              </View>
              <View style={styles.settingsGrid}>
                {adminSettings.map(label => (
                  <View key={label} style={styles.settingsBtn}>
                    <Text style={styles.settingsBtnText}>{label}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#f4f9f4',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
  emptyText: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 16,
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
  chartCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 24,
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
  barCount: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2b964f',
    marginBottom: 4,
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
  reportCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },
  reportTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 4,
  },
  reportName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: '#0a3617',
  },
  reportStatus: {
    backgroundColor: '#e8f5e9',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  reportStatusText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2b964f',
  },
  reportMeta: {
    fontSize: 12,
    color: '#6b7280',
  },
  settingsCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    marginTop: 12,
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
