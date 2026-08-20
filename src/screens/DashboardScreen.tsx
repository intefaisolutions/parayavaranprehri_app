import React, { useCallback, useEffect, useState } from 'react';
import {
  AppState,
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AppIcon, { IconName } from '../components/AppIcon';
import { Vehicle, computeVehicleStats } from '../data/vehiclesData';
import { ProfileStat } from '../data/journeyData';
import { getVehicleIconName } from '../utils/vehicleIcons';
import { getBottomInset, getTopInset } from '../utils/layout';
import { colors } from '../theme/colors';
import {
  getStoredUser,
  journeyService,
  leaderboardService,
  leadersService,
  missionProgressService,
  notificationsService,
  personsService,
  unwrapList,
  usersService,
  type Leader,
  type LeaderboardEntry,
} from '../api';
import RemoteImage from '../components/RemoteImage';

const { width } = Dimensions.get('window');

type QuickAction = {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  label: string;
  action?: () => void;
};

type DashboardScreenProps = {
  vehicles: Vehicle[];
  onViewJourney?: () => void;
  onMyIdentity?: () => void;
  onRashiVan?: () => void;
  onNews?: () => void;
  onSupport?: () => void;
  onMitra?: () => void;
  onOfferLand?: () => void;
  onTreeRequest?: () => void;
  onAboutInitiative?: () => void;
  onAdminPreview?: () => void;
  onNotifications?: () => void;
};

type LeaderCard = {
  id: string;
  name: string;
  title: string;
  quote: string;
  buttonText: string;
  imageUri?: string;
  photoVersion?: string;
  topBadge?: string;
  achievements?: string[];
};

const DEFAULT_INSPIRATION_STATS: ProfileStat[] = [
  { value: '1,00,000+', label: 'Trees Planted' },
  { value: '3', label: 'World Records' },
  { value: '30+', label: 'Awards Received' },
  { value: '25+', label: 'Years of Service' },
];

const DEFAULT_INSPIRATION_TAGS = [
  'Environmentalist',
  'Biodiversity Expert',
  'Farmer Innovator',
  'Social Reformer',
  'World Record Holder',
];

function mapApiLeaders(items: Leader[]): LeaderCard[] {
  return items
    .slice()
    .sort((a, b) => (a.displayOrder ?? 9999) - (b.displayOrder ?? 9999))
    .map(item => {
      const name = item.leaderName.toLowerCase();
      const isRam = name.includes('ram patidar');
      const isModi = name.includes('modi');
      return {
        id: item._id,
        name: item.leaderName,
        title: item.designation,
        quote: item.organization
          ? `"${item.organization}"`
          : '"Committed to a greener Bharat."',
        buttonText: '🇮🇳 Green Mission',
        imageUri: item.photo || undefined,
        photoVersion: item.updatedAt,
        topBadge: isModi ? 'Inspiration' : undefined,
        achievements: isRam
          ? [
              'Environmentalist',
              'World Record Holder',
              'Biodiversity',
              'Mission Advisor',
            ]
          : undefined,
      };
    });
}

async function mapApiLeadersWithMedia(items: Leader[]): Promise<LeaderCard[]> {
  return mapApiLeaders(items);
}

export default function DashboardScreen({
  vehicles,
  onViewJourney,
  onMyIdentity,
  onRashiVan,
  onNews,
  onSupport,
  onMitra,
  onOfferLand,
  onTreeRequest,
  onAboutInitiative,
  onAdminPreview,
  onNotifications,
}: DashboardScreenProps) {
  const [displayName, setDisplayName] = useState('Citizen');
  const [locationLabel, setLocationLabel] = useState('—');
  const [nameInitials, setNameInitials] = useState('PP');
  const [leaders, setLeaders] = useState<LeaderCard[]>([]);
  const [missionPercent, setMissionPercent] = useState(0);
  const [missionLabel, setMissionLabel] = useState(
    String(new Date().getFullYear()),
  );
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [missionTargetYear, setMissionTargetYear] = useState(2047);
  const [contributionCo2, setContributionCo2] = useState(0);
  const [inspirationName, setInspirationName] = useState('Dr. Ram Patidar');
  const [inspirationPhoto, setInspirationPhoto] = useState<string | undefined>();
  const [inspirationPhotoVersion, setInspirationPhotoVersion] = useState<
    string | undefined
  >();
  const [inspirationTitle, setInspirationTitle] = useState(
    'Environmentalist · Biodiversity Conservationist · Social Reformer',
  );
  const [inspirationStats, setInspirationStats] = useState<ProfileStat[]>(
    DEFAULT_INSPIRATION_STATS,
  );
  const [inspirationTags, setInspirationTags] = useState<string[]>(
    DEFAULT_INSPIRATION_TAGS,
  );
  const [quickStats, setQuickStats] = useState({
    vehicleCount: vehicles.length,
    totalTrees: 0,
    totalCo2: 0,
    netZeroProgress: 0,
    avgSurvival: 0,
  });
  const [topContributors, setTopContributors] = useState<LeaderboardEntry[]>([]);
  const [leaderboardTitle, setLeaderboardTitle] = useState(
    'Top Eco Contributors',
  );

  useEffect(() => {
    let mounted = true;
    (async () => {
      const user = await getStoredUser();
      if (mounted && user) {
        const full = `${user.firstName} ${user.lastName}`.trim();
        if (full) {
          setDisplayName(full);
          const parts = full.split(/\s+/);
          setNameInitials(
            parts.length >= 2
              ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
              : full.slice(0, 2).toUpperCase(),
          );
        }
        const loc = [user.district, user.state].filter(Boolean).join(', ');
        if (loc) setLocationLabel(loc);
      }

      const [meRes, statsRes, progressRes, boardRes, leadersRes, journeyRes, unreadRes] =
        await Promise.allSettled([
          usersService.getMe(),
          personsService.getMyStats(),
          missionProgressService.get(),
          leaderboardService.list({ scope: 'vidhan-sabha', limit: 3 }),
          leadersService.list({ page: 1, limit: 50, isActive: true }),
          journeyService.getTimeline(),
          notificationsService.getUnreadCount(),
        ]);

      if (!mounted) return;

      if (meRes.status === 'fulfilled' && meRes.value) {
        const me = meRes.value as Record<string, unknown>;
        const full = `${me.firstName || ''} ${me.lastName || ''}`.trim();
        if (full) {
          setDisplayName(full);
          const parts = full.split(/\s+/);
          setNameInitials(
            parts.length >= 2
              ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
              : full.slice(0, 2).toUpperCase(),
          );
        }
        const loc = [me.district, me.state].filter(Boolean).join(', ');
        if (loc) setLocationLabel(String(loc));
      }

      if (statsRes.status === 'fulfilled' && statsRes.value) {
        const personStats = statsRes.value;
        const trees = Number(personStats.treesAssigned) || 0;
        const linked = Number(personStats.linkedVehicles) || vehicles.length;
        const co2 = Math.round(Number(personStats.co2OffsetKg) || 0);
        const survival =
          typeof personStats.survivalPct === 'number'
            ? Math.round(personStats.survivalPct)
            : computeVehicleStats(vehicles).avgSurvival;
        setContributionCo2(co2);
        setQuickStats({
          vehicleCount: linked,
          totalTrees: trees,
          totalCo2: co2,
          avgSurvival: survival,
          netZeroProgress: 0,
        });
        if (personStats.vidhanSabha) {
          setLocationLabel(personStats.vidhanSabha);
          setLeaderboardTitle(
            `Top Eco Contributors · ${personStats.vidhanSabha}`,
          );
        } else if (personStats.address) {
          setLocationLabel(personStats.address);
        }
      } else {
        const fromVehicles = computeVehicleStats(vehicles);
        setQuickStats(prev => ({
          ...prev,
          vehicleCount: vehicles.length,
          totalTrees: fromVehicles.totalTrees || prev.totalTrees,
          totalCo2: fromVehicles.totalCo2 || prev.totalCo2,
          avgSurvival: fromVehicles.avgSurvival,
        }));
      }

      if (progressRes.status === 'fulfilled' && progressRes.value) {
        const progress = progressRes.value;
        const pct = Number(progress.percent) || 0;
        setMissionPercent(pct);
        setQuickStats(prev => ({ ...prev, netZeroProgress: pct }));
        if (progress.label) setMissionLabel(progress.label);
        if (progress.targetYear) setMissionTargetYear(progress.targetYear);
      }

      if (boardRes.status === 'fulfilled' && Array.isArray(boardRes.value?.items)) {
        setTopContributors(boardRes.value.items.slice(0, 3));
      }

      let foundInspirationPhoto: string | undefined;
      if (leadersRes.status === 'fulfilled') {
        const list = unwrapList(leadersRes.value);
        setLeaders(list.length > 0 ? await mapApiLeadersWithMedia(list) : []);
        const ram = list.find(l =>
          l.leaderName.toLowerCase().includes('ram patidar'),
        );
        if (ram) {
          setInspirationName(ram.leaderName);
          if (ram.designation) setInspirationTitle(ram.designation);
          foundInspirationPhoto = ram.photo;
          setInspirationPhoto(ram.photo || undefined);
          setInspirationPhotoVersion(ram.updatedAt);
        }
      } else {
        setLeaders([]);
      }

      if (journeyRes.status === 'fulfilled') {
        const timeline = journeyRes.value;
        if (timeline?.profile?.stats?.length) {
          setInspirationStats(timeline.profile.stats);
        }
        if (timeline?.profile?.tags?.length) {
          setInspirationTags(timeline.profile.tags);
        }
        if (!foundInspirationPhoto && timeline?.profile) {
          if (timeline.profile.name) setInspirationName(timeline.profile.name);
          if (timeline.profile.subtitle) {
            setInspirationTitle(timeline.profile.subtitle);
          }
          setInspirationPhoto(timeline.profile.photo || undefined);
          setInspirationPhotoVersion(timeline.profile.updatedAt);
        }
      }

      if (unreadRes.status === 'fulfilled') {
        setUnreadNotifs(Number(unreadRes.value.unreadCount) || 0);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const refreshCmsPhotos = useCallback(async () => {
    const [leadersRes, journeyRes] = await Promise.allSettled([
      leadersService.list({ page: 1, limit: 50, isActive: true }),
      journeyService.getTimeline(),
    ]);

    let foundInspirationPhoto: string | undefined;
    if (leadersRes.status === 'fulfilled') {
      const list = unwrapList(leadersRes.value);
      setLeaders(list.length > 0 ? mapApiLeaders(list) : []);
      const ram = list.find(l =>
        l.leaderName.toLowerCase().includes('ram patidar'),
      );
      if (ram) {
        setInspirationName(ram.leaderName);
        if (ram.designation) setInspirationTitle(ram.designation);
        foundInspirationPhoto = ram.photo;
        setInspirationPhoto(ram.photo || undefined);
        setInspirationPhotoVersion(ram.updatedAt);
      }
    }

    if (journeyRes.status === 'fulfilled') {
      const timeline = journeyRes.value;
      if (timeline?.profile?.stats?.length) {
        setInspirationStats(timeline.profile.stats);
      }
      if (timeline?.profile?.tags?.length) {
        setInspirationTags(timeline.profile.tags);
      }
      if (!foundInspirationPhoto && timeline?.profile) {
        if (timeline.profile.name) setInspirationName(timeline.profile.name);
        if (timeline.profile.subtitle) {
          setInspirationTitle(timeline.profile.subtitle);
        }
        setInspirationPhoto(timeline.profile.photo || undefined);
        setInspirationPhotoVersion(timeline.profile.updatedAt);
      }
    }
  }, []);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;
    const start = () => {
      if (timer) return;
      timer = setInterval(() => {
        void refreshCmsPhotos();
      }, 15000);
    };
    const stop = () => {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    };
    start();
    const sub = AppState.addEventListener('change', state => {
      if (state === 'active') {
        void refreshCmsPhotos();
        start();
        return;
      }
      stop();
    });
    return () => {
      stop();
      sub.remove();
    };
  }, [refreshCmsPhotos]);

  useEffect(() => {
    const fromVehicles = computeVehicleStats(vehicles);
    setQuickStats(prev => {
      // Prefer person-stats survival when already loaded (>0 or trees known).
      // Still refresh vehicleCount when fleet changes.
      return {
        ...prev,
        vehicleCount: Math.max(prev.vehicleCount, fromVehicles.vehicleCount),
        avgSurvival:
          prev.avgSurvival > 0
            ? prev.avgSurvival
            : fromVehicles.avgSurvival,
      };
    });
  }, [vehicles]);

  const quickStatIcons: IconName[] = [
    'car-side',
    'tree',
    'weather-windy',
    'water-outline',
    'shield-check-outline',
    'star-outline',
  ];

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* TOP HEADER SECTION */}
        <LinearGradient
          colors={['#105e2d', '#2b964f']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.topGradient}
        >
          <View style={styles.headerRow}>
            <View style={styles.profileInfo}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{nameInitials}</Text>
              </View>
              <View style={styles.nameBlock}>
                <Text style={styles.greeting}>Namaste 🙏</Text>
                <Text style={styles.name}>{displayName}</Text>
                <View style={styles.locationRow}>
                  <AppIcon name="map-marker-outline" size={12} color="#b2e3c6" />
                  <Text style={styles.locationText}>{locationLabel}</Text>
                </View>
              </View>
            </View>
            <Pressable style={styles.bellButton} onPress={onNotifications}>
              <AppIcon name="bell-outline" size={20} color="#ffffff" />
              {unreadNotifs > 0 ? (
                <View style={styles.notificationDot} />
              ) : null}
            </Pressable>
          </View>

          {/* CONTRIBUTION CARD */}
          <View style={styles.contributionCard}>
            <Text style={styles.contributionLabel}>YOUR CONTRIBUTION THIS YEAR</Text>
            <View style={styles.contributionRow}>
              <Text style={styles.contributionValue}>
                {contributionCo2} kg CO<Text style={styles.subscript}>2</Text> offset
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* MISSION 2047 SECTION */}
        <View style={styles.missionContainer}>
          <LinearGradient
            colors={['#0c4820', '#a36329']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.missionCard}
          >
            <View style={styles.missionHeader}>
              <View style={styles.missionBadge}>
                <Text style={styles.missionBadgeText}>✨ MISSION 2047</Text>
              </View>
              <View style={styles.bharatBadge}>
                <Text style={styles.bharatBadgeText}>
                  <Text style={{ color: '#e47d25' }}>IN</Text> Bharat
                </Text>
              </View>
            </View>

            <Text style={styles.missionTitle}>
              By <Text style={styles.textHighlight}>{missionTargetYear}</Text>, India will celebrate <Text style={styles.textHighlight}>100 years of independence</Text> by creating its first <Text style={styles.textHighlight}>Net Zero Carbon City.</Text>
            </Text>

            <View style={styles.progressRow}>
              <View style={styles.progressBarBg}>
                <LinearGradient
                  colors={['#dced72', '#5ec26a']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[
                    styles.progressBarFill,
                    { width: `${Math.min(100, Math.max(0, missionPercent))}%` },
                  ]}
                />
              </View>
              <Text style={styles.progressText}>
                {missionPercent}% · {missionLabel}
              </Text>
            </View>
            <Text style={styles.amritText}>AMRIT KAAL · NET ZERO BHARAT</Text>

            {/* ENVIRONMENTAL ICONS CARD */}
            <View style={styles.iconsCard}>
              <View style={styles.iconsHeader}>
                <Text style={styles.trophyIcon}>🏆</Text>
                <Text style={styles.iconsCardTitle}>ENVIRONMENTAL ICONS OF INDIA</Text>
              </View>

              <View style={styles.personRow}>
                <View style={styles.personAvatar}>
                  {inspirationPhoto ? (
                    <RemoteImage
                      uri={inspirationPhoto}
                      version={inspirationPhotoVersion}
                      style={styles.personAvatarImage}
                    />
                  ) : (
                    <Text style={styles.personAvatarInitials}>
                      {inspirationName
                        .split(/\s+/)
                        .filter(Boolean)
                        .slice(0, 2)
                        .map(p => p[0])
                        .join('')
                        .toUpperCase() || 'RP'}
                    </Text>
                  )}
                </View>
                <View style={styles.personInfo}>
                  <Text style={styles.personName}>{inspirationName}</Text>
                  <Text style={styles.personDesc}>{inspirationTitle}</Text>
                  <View style={styles.tagsRow}>
                    <View style={styles.tagBadge}>
                      <Text style={styles.tagText}>🌱 Biodiversity</Text>
                    </View>
                    <View style={[styles.tagBadge, styles.tagBadgeDark]}>
                      <Text style={styles.tagTextDark}>Plantation</Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* CONCEPT VIDEO SECTION */}
        <View style={styles.videoContainer}>
          <LinearGradient
            colors={['#f27e20', '#2bb373']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.videoCardWrapper}
          >
            <View style={styles.videoCard}>
              <View style={styles.videoBadge}>
                <LinearGradient
                  colors={['#f27e20', '#2bb373']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.videoBadgeGradient}
                >
                  <Text style={styles.videoBadgeText}>
                    <Text style={{ color: '#000', fontWeight: '900' }}>IN </Text>
                    CONCEPT VIDEO
                  </Text>
                </LinearGradient>
              </View>

              <View style={styles.videoThumbnailContainer}>
                <Image 
                  source={{ uri: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg' }}
                  style={styles.videoImage}
                  resizeMode="cover"
                />
                
                {/* Overlay Content (Darken + Play Button) */}
                <View style={styles.videoOverlay}>
                  <View style={styles.playButton}>
                    <Text style={styles.playIcon}>▶</Text>
                  </View>
                </View>

                {/* Bottom Gradient Fade */}
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.8)']}
                  style={styles.bottomFade}
                />

                {/* Text Content (Absolute at bottom of thumbnail) */}
                <View style={styles.videoTextContent}>
                  <Text style={styles.videoTitle}>What is Paryavaran Prahri?</Text>
                  <Text style={styles.videoSubtitle}>
                    Learn how vehicles, citizens, plantation and environmental contribution come together under Mission 2047.
                  </Text>
                </View>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* INSPIRED BY SECTION */}
        <View style={styles.inspiredContainer}>
          <LinearGradient
            colors={['#f27e20', '#2bb373']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.inspiredCardWrapper}
          >
            <LinearGradient
              colors={['#f6fbf2', '#dcf0e4']}
              start={{ x: 1, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.inspiredCard}
            >
              {/* Top Badges */}
              <View style={styles.inspiredBadgesRow}>
                <LinearGradient
                  colors={['#f27e20', '#2bb373']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.inspiredTopBadge}
                >
                  <Text style={styles.inspiredTopBadgeText}>✨ INSPIRED BY</Text>
                </LinearGradient>
                <View style={styles.advisorBadge}>
                  <Text style={styles.advisorBadgeText}>
                    <Text style={{ color: '#000', fontWeight: '900' }}>IN </Text>
                    National Mission Advisor
                  </Text>
                </View>
              </View>

              {/* Profile Row */}
              <View style={styles.inspiredProfileRow}>
                <View style={styles.inspiredAvatarContainer}>
                  <View style={styles.inspiredAvatar}>
                    {inspirationPhoto ? (
                      <RemoteImage
                        uri={inspirationPhoto}
                        version={inspirationPhotoVersion}
                        style={styles.inspiredAvatarImage}
                      />
                    ) : (
                      <Text style={styles.inspiredAvatarInitials}>
                        {inspirationName
                          .split(/\s+/)
                          .filter(Boolean)
                          .slice(0, 2)
                          .map(p => p[0])
                          .join('')
                          .toUpperCase() || 'RP'}
                      </Text>
                    )}
                  </View>
                  <View style={styles.inspiredTrophyBadge}>
                    <Text style={styles.inspiredTrophyIcon}>🏆</Text>
                  </View>
                </View>
                
                <View style={styles.inspiredInfo}>
                  <Text style={styles.inspiredName}>{inspirationName}</Text>
                  <Text style={styles.inspiredDesc}>{inspirationTitle}</Text>
                  <View style={styles.inspiredTags}>
                    {inspirationTags.map((tag, i) => (
                      <View key={i} style={styles.inspiredTag}>
                        <Text style={styles.inspiredTagText}>🌱 {tag}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>

              {/* Stats Row */}
              <View style={styles.inspiredStatsRow}>
                {inspirationStats.map((stat, i) => (
                  <View key={i} style={styles.statCircle}>
                    <Text style={styles.statValue}>{stat.value}</Text>
                    <Text style={styles.statLabel}>{stat.label}</Text>
                  </View>
                ))}
              </View>

              {/* Action Button */}
              <Pressable style={styles.inspiredButton} onPress={onViewJourney}>
                <View style={styles.inspiredButtonInner}>
                  <Text style={styles.inspiredButtonIcon}>🏅</Text>
                  <Text style={styles.inspiredButtonText}>View the Journey & Achievements</Text>
                  <Text style={styles.inspiredButtonArrow}>›</Text>
                </View>
              </Pressable>
            </LinearGradient>
          </LinearGradient>
        </View>

        {/* QUICK STATS GRID */}
        <View style={styles.quickStatsContainer}>
          <View style={styles.statsRow}>
            {/* Stat Card 1 */}
            <View style={styles.quickStatCard}>
              <LinearGradient
                colors={['rgba(242, 126, 32, 0.08)', 'rgba(255,255,255,0)']}
                start={{ x: 1, y: 0 }} end={{ x: 0, y: 1 }}
                style={StyleSheet.absoluteFillObject}
              />
              <View style={styles.quickStatHeader}>
                <View style={styles.quickStatIconBg}>
                  <AppIcon name={quickStatIcons[0]} size={18} color="#f27e20" />
                </View>
                <AppIcon name="chart-line" size={14} color="#9ca3af" />
              </View>
              <Text style={styles.quickStatLabel}>Vehicles Registered</Text>
              <Text style={styles.quickStatValue}>{quickStats.vehicleCount}</Text>
            </View>

            {/* Stat Card 2 */}
            <View style={styles.quickStatCard}>
              <LinearGradient
                colors={['rgba(43, 179, 115, 0.08)', 'rgba(255,255,255,0)']}
                start={{ x: 1, y: 0 }} end={{ x: 0, y: 1 }}
                style={StyleSheet.absoluteFillObject}
              />
              <View style={styles.quickStatHeader}>
                <View style={styles.quickStatIconBg}>
                  <AppIcon name={quickStatIcons[1]} size={18} color="#2bb373" />
                </View>
                <AppIcon name="chart-line" size={14} color="#9ca3af" />
              </View>
              <Text style={styles.quickStatLabel}>Trees Planted</Text>
              <Text style={styles.quickStatValue}>{quickStats.totalTrees}</Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            {/* Stat Card 3 */}
            <View style={styles.quickStatCard}>
              <LinearGradient
                colors={['rgba(0, 150, 255, 0.08)', 'rgba(255,255,255,0)']}
                start={{ x: 1, y: 0 }} end={{ x: 0, y: 1 }}
                style={StyleSheet.absoluteFillObject}
              />
              <View style={styles.quickStatHeader}>
                <View style={styles.quickStatIconBg}>
                  <AppIcon name={quickStatIcons[2]} size={18} color="#0096ff" />
                </View>
                <AppIcon name="chart-line" size={14} color="#9ca3af" />
              </View>
              <Text style={styles.quickStatLabel}>CO₂ Absorbed (kg)</Text>
              <Text style={styles.quickStatValue}>{quickStats.totalCo2}</Text>
            </View>

            {/* Stat Card 4 */}
            <View style={styles.quickStatCard}>
              <LinearGradient
                colors={['rgba(242, 126, 32, 0.08)', 'rgba(255,255,255,0)']}
                start={{ x: 1, y: 0 }} end={{ x: 0, y: 1 }}
                style={StyleSheet.absoluteFillObject}
              />
              <View style={styles.quickStatHeader}>
                <View style={styles.quickStatIconBg}>
                  <AppIcon name={quickStatIcons[3]} size={18} color="#f27e20" />
                </View>
                <AppIcon name="chart-line" size={14} color="#9ca3af" />
              </View>
              <Text style={styles.quickStatLabel}>Net Zero Progress</Text>
              <Text style={styles.quickStatValue}>{quickStats.netZeroProgress}%</Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            {/* Stat Card 5 */}
            <View style={styles.quickStatCard}>
              <LinearGradient
                colors={['rgba(43, 179, 115, 0.08)', 'rgba(255,255,255,0)']}
                start={{ x: 1, y: 0 }} end={{ x: 0, y: 1 }}
                style={StyleSheet.absoluteFillObject}
              />
              <View style={styles.quickStatHeader}>
                <View style={styles.quickStatIconBg}>
                  <AppIcon name={quickStatIcons[4]} size={18} color="#2bb373" />
                </View>
                <AppIcon name="chart-line" size={14} color="#9ca3af" />
              </View>
              <Text style={styles.quickStatLabel}>Survival Rate</Text>
              <Text style={styles.quickStatValue}>{quickStats.avgSurvival}%</Text>
            </View>

            {/* Stat Card 6 */}
            <View style={styles.quickStatCard}>
              <LinearGradient
                colors={['rgba(242, 126, 32, 0.08)', 'rgba(255,255,255,0)']}
                start={{ x: 1, y: 0 }} end={{ x: 0, y: 1 }}
                style={StyleSheet.absoluteFillObject}
              />
              <View style={styles.quickStatHeader}>
                <View style={styles.quickStatIconBg}>
                  <AppIcon name={quickStatIcons[5]} size={18} color="#f27e20" />
                </View>
                <AppIcon name="chart-line" size={14} color="#9ca3af" />
              </View>
              <Text style={styles.quickStatLabel}> Your Vidhan Sabha Rank</Text>
              <Text style={styles.quickStatValue}>3</Text>
            </View>
          </View>
        </View>

        {/* QUICK ACTIONS GRID */}
        <View style={styles.actionsGridContainer}>
          {(
            [
              { icon: 'qrcode', label: 'My Identity', action: onMyIdentity },
              { icon: 'sprout', label: 'Rashi Van', action: onRashiVan },
              { icon: 'tree', label: 'Tree Request', action: () => {
                if (vehicles.length === 0) {
                  Alert.alert('Insurance Required', 'Please take insurance first to request a plant.');
                } else if (onTreeRequest) {
                  onTreeRequest();
                }
              } },
              { icon: 'newspaper-variant-outline', label: 'News', action: onNews },
              { icon: 'account-group-outline', label: 'Mitra', action: onMitra },
              { icon: 'hand-heart-outline', label: 'Offer Land', action: onOfferLand },
              { icon: 'headset', label: 'Support', action: onSupport },
            ] satisfies QuickAction[]
          ).map((action, index) => (
            <Pressable
              key={index}
              style={styles.actionItem}
              onPress={action.action}>
              <View style={styles.actionIconWrapper}>
                <LinearGradient
                  colors={['#126e35', '#44b969']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.actionIconInner}>
                  <MaterialCommunityIcons
                    name={action.icon}
                    size={22}
                    color="#fff"
                  />
                </LinearGradient>
              </View>
              <Text style={styles.actionLabel}>{action.label}</Text>
            </Pressable>
          ))}
        </View>

        {/* YOUR VEHICLE CONTRIBUTIONS */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Vehicle Contributions</Text>
            <Pressable>
              <Text style={styles.seeAllText}>See all ›</Text>
            </Pressable>
          </View>
          
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalScrollContent}
          >
            {vehicles.map(vehicle => (
              <View key={vehicle.id} style={styles.vehicleCard}>
                <View style={styles.vehicleCardTop}>
                  <View style={styles.vehicleIconWrap}>
                    <AppIcon
                      name={getVehicleIconName(vehicle)}
                      size={28}
                      color="#126e35"
                    />
                  </View>
                  <View style={styles.fuelBadge}>
                    <Text style={styles.fuelBadgeText}>{vehicle.fuel}</Text>
                  </View>
                </View>
                <Text style={styles.vehicleName} numberOfLines={1}>{vehicle.name}</Text>
                <Text style={styles.vehiclePlates} numberOfLines={1}>
                  {vehicle.plate} · {vehicle.vhId}
                </Text>
                
                <View style={styles.vehicleStatsRow}>
                  <View style={styles.vehicleStatPill}>
                    <Text style={styles.vehicleStatLabel}>Trees</Text>
                    <Text style={styles.vehicleStatValue}>{vehicle.trees}</Text>
                  </View>
                  <View style={styles.vehicleStatPill}>
                    <Text style={styles.vehicleStatLabel}>CO₂</Text>
                    <Text style={styles.vehicleStatValue}>{vehicle.co2}kg</Text>
                  </View>
                  <View style={styles.vehicleStatPill}>
                    <Text style={styles.vehicleStatLabel}>Survival</Text>
                    <Text style={styles.vehicleStatValue}>{vehicle.survival}</Text>
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* TOP ECO CONTRIBUTORS */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{leaderboardTitle}</Text>
            <Pressable>
              <Text style={styles.seeAllText}>See all ›</Text>
            </Pressable>
          </View>

          <View style={styles.leaderboardContainer}>
            {topContributors.length === 0 ? (
              <Text style={styles.seeAllText}>No rankings yet</Text>
            ) : (
              topContributors.map((entry, index) => {
                const rankColors = ['#f59e0b', '#9ca3af', '#d97706'];
                const isYou =
                  entry.name &&
                  displayName &&
                  entry.name.toLowerCase() === displayName.toLowerCase();
                return (
                  <View
                    key={`${entry.rank}-${entry.name}`}
                    style={[
                      styles.leaderboardCard,
                      isYou && styles.leaderboardCardActive,
                    ]}>
                    <View
                      style={[
                        styles.rankCircle,
                        { backgroundColor: rankColors[index] || '#059669' },
                      ]}>
                      <Text style={styles.rankText}>#{entry.rank}</Text>
                    </View>
                    <View style={styles.leaderboardInfo}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={styles.leaderboardName}>{entry.name}</Text>
                        {isYou ? (
                          <View style={styles.youBadge}>
                            <Text style={styles.youBadgeText}>YOU</Text>
                          </View>
                        ) : null}
                      </View>
                      <Text style={styles.leaderboardVehicle}>
                        {entry.badge || entry.vidhanSabha || 'Eco Contributor'}
                      </Text>
                    </View>
                    <View style={styles.leaderboardScore}>
                      <Text style={styles.leaderboardScoreTop}>
                        {entry.trees} 🌳
                      </Text>
                      <Text style={styles.leaderboardScoreBottom}>
                        {Math.round(entry.co2Kg || 0)}kg CO₂
                      </Text>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </View>

        {/* INITIATIVE LEADERS */}
        {leaders.length > 0 ? (
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Initiative Leaders</Text>
            <Text style={styles.swipeText}>SWIPE →</Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalScrollContent}
            decelerationRate="fast"
            snapToInterval={296}
            snapToAlignment="start"
            disableIntervalMomentum
            nestedScrollEnabled>
            {leaders.map(leader => (
              <View
                key={leader.id}
                style={[
                  styles.leaderCard,
                  leader.topBadge === 'Inspiration' && styles.leaderCardInspiration,
                ]}>
                {leader.topBadge ? (
                  <View
                    style={[
                      styles.leaderTopBadge,
                      leader.topBadge === 'Inspiration' &&
                        styles.leaderInspirationBadge,
                    ]}>
                    <Text
                      style={[
                        styles.leaderTopBadgeText,
                        leader.topBadge === 'Inspiration' &&
                          styles.leaderInspirationBadgeText,
                      ]}>
                      {leader.topBadge === 'Inspiration'
                        ? '✨ Inspiration'
                        : leader.topBadge}
                    </Text>
                  </View>
                ) : null}
                <View style={styles.leaderAvatarContainer}>
                  {leader.imageUri ? (
                    <RemoteImage
                      uri={leader.imageUri}
                      version={leader.photoVersion}
                      style={styles.leaderAvatarImage}
                    />
                  ) : (
                    <View style={[styles.leaderAvatarImage, styles.leaderAvatarFallback]}>
                      <Text style={styles.leaderAvatarFallbackText}>
                        {leader.name
                          .split(/\s+/)
                          .slice(0, 2)
                          .map(p => p[0])
                          .join('')
                          .toUpperCase() || '?'}
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={styles.leaderName}>{leader.name}</Text>
                <Text style={styles.leaderTitle}>{leader.title}</Text>
                <Text style={styles.leaderQuote}>{leader.quote}</Text>

                {leader.achievements ? (
                  <View style={styles.leaderAchievementsRow}>
                    {leader.achievements.map((ach, idx) => (
                      <View key={idx} style={styles.leaderAchievementBadge}>
                        <Text style={styles.leaderAchievementText}>{ach}</Text>
                      </View>
                    ))}
                  </View>
                ) : null}

                <View style={styles.greenMissionBadge}>
                  <Text style={styles.greenMissionBadgeText}>
                    {leader.buttonText}
                  </Text>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
        ) : null}

        {/* FOOTER ACTION CARDS */}
        <View style={styles.footerActionsContainer}>
          <Pressable
            style={[styles.footerActionCard, styles.footerActionCardGreen]}
            onPress={onAboutInitiative}>
            <MaterialCommunityIcons
              name="account-group-outline"
              size={24}
              color="#2b964f"
              style={styles.footerActionIconMono}
            />
            <Text style={styles.footerActionTitle}>About Initiative</Text>
            <Text style={styles.footerActionSubtitle}>
              Net Zero vision & partners
            </Text>
          </Pressable>
          
          <Pressable style={styles.footerActionCard} onPress={onAdminPreview}>
            <MaterialCommunityIcons
              name="shield-check-outline"
              size={24}
              color="#2b964f"
              style={styles.footerActionIconMono}
            />
            <Text style={styles.footerActionTitle}>Admin Preview</Text>
            <Text style={styles.footerActionSubtitle}>District analytics</Text>
          </Pressable>
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
  scrollContent: {
    paddingBottom: 160, // increased space for bottom nav
  },
  topGradient: {
    paddingTop: getTopInset(20),
    paddingHorizontal: 20,
    paddingBottom: 40,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#3bb36a',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 18,
  },
  nameBlock: {
    justifyContent: 'center',
  },
  greeting: {
    color: '#e0f2e5',
    fontSize: 13,
    marginBottom: 2,
  },
  name: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  locationText: {
    color: '#c4e8d0',
    fontSize: 12,
  },
  bellButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellIcon: {
    fontSize: 20,
  },
  notificationDot: {
    position: 'absolute',
    top: 10,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ffb300',
  },
  contributionCard: {
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 24,
    padding: 20,
  },
  contributionLabel: {
    color: '#a8d9b9',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  contributionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  contributionValue: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '800',
  },
  subscript: {
    fontSize: 16,
    lineHeight: 28,
  },
  verifiedBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  verifiedText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  missionContainer: {
    padding: 20,
    marginTop: 4,
  },
  missionCard: {
    borderRadius: 32,
    padding: 24,
    overflow: 'hidden',
  },
  missionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  missionBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  missionBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  bharatBadge: {
    backgroundColor: '#a3d9b1',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  bharatBadgeText: {
    color: '#0a3617',
    fontSize: 11,
    fontWeight: '800',
  },
  missionTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 34,
    marginBottom: 24,
  },
  textHighlight: {
    color: '#dced72',
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressBarBg: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 4,
    marginRight: 12,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  amritText: {
    color: '#90c69d',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 24,
  },
  iconsCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  iconsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  trophyIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  iconsCardTitle: {
    color: '#dced72',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  personRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  personAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#e3b88b',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    overflow: 'hidden',
  },
  personAvatarImage: {
    width: '100%',
    height: '100%',
  },
  personAvatarInitials: {
    color: '#1a3a2a',
    fontSize: 20,
    fontWeight: '800',
  },
  personEmoji: {
    fontSize: 32,
  },
  personInfo: {
    flex: 1,
  },
  personName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  personDesc: {
    color: '#cddbc1',
    fontSize: 11,
    marginBottom: 8,
    lineHeight: 16,
  },
  tagsRow: {
    flexDirection: 'row',
  },
  tagBadge: {
    backgroundColor: '#58a04e',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 8,
  },
  tagText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  tagBadgeDark: {
    backgroundColor: '#407a39',
  },
  tagTextDark: {
    color: '#c4e8d0',
    fontSize: 10,
    fontWeight: '600',
  },
  bottomNavContainer: {
    position: 'absolute',
    bottom: getBottomInset(10),
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 40,
    paddingHorizontal: 8,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
    alignItems: 'center',
    width: width - 40,
  },
  navItemWrapper: {
    flex: 1, // Ensures exactly equal width for every tab
    alignItems: 'center',
  },
  navItemActive: {
    backgroundColor: '#126e35',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 24,
  },
  navIconActiveImg: {
    width: 18,
    height: 18,
    marginRight: 6,
    tintColor: '#ffffff',
  },
  navTextActive: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  navItem: {
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  navIconImg: {
    width: 22,
    height: 22,
    marginBottom: 4,
    tintColor: '#6b7280',
    opacity: 0.8,
  },
  navText: {
    fontSize: 10,
    color: '#6b7280',
    fontWeight: '500',
  },
  videoContainer: {
    paddingHorizontal: 20,
    marginTop: 12,
    marginBottom: 20,
  },
  videoCardWrapper: {
    borderRadius: 34, // Slightly larger than card for border
    padding: 2, // The width of the gradient border
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
  },
  videoCard: {
    backgroundColor: '#fff',
    borderRadius: 32,
    padding: 16,
  },
  videoBadge: {
    position: 'absolute',
    top: -14, // Straddle the top edge exactly
    left: 20,
    zIndex: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  videoBadgeGradient: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  videoBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  videoThumbnailContainer: {
    width: '100%',
    height: 230,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#1b2a40',
  },
  videoImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.15)', // Light darken
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomFade: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 120, // Fade for text readability
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  playIcon: {
    fontSize: 24,
    color: '#126e35',
    marginLeft: 4, // slightly offset play icon to look visually centered
  },
  videoTextContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingTop: 40, // gradient fade simulation space
  },
  videoTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 6,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  videoSubtitle: {
    color: '#e2e8e4',
    fontSize: 12,
    lineHeight: 18,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  inspiredContainer: {
    paddingHorizontal: 20,
    marginTop: 4,
    marginBottom: 40,
  },
  inspiredCardWrapper: {
    borderRadius: 34,
    padding: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
  },
  inspiredCard: {
    borderRadius: 32,
    padding: 16,
    paddingTop: 20,
  },
  inspiredBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  inspiredTopBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  inspiredTopBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  advisorBadge: {
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  advisorBadgeText: {
    color: '#105e2d',
    fontSize: 10,
    fontWeight: '600',
  },
  inspiredProfileRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  inspiredAvatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  inspiredAvatar: {
    width: 90,
    height: 90,
    borderRadius: 24,
    backgroundColor: '#c4a683',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  inspiredAvatarImage: {
    width: '100%',
    height: '100%',
  },
  inspiredAvatarInitials: {
    color: '#1a3a2a',
    fontSize: 28,
    fontWeight: '800',
  },
  inspiredTrophyBadge: {
    position: 'absolute',
    bottom: -8,
    right: -8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#ff9800',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#f0f6ea',
  },
  inspiredTrophyIcon: {
    fontSize: 12,
  },
  inspiredInfo: {
    flex: 1,
  },
  inspiredName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0a3617',
    marginBottom: 4,
  },
  inspiredDesc: {
    fontSize: 11,
    color: '#467554',
    lineHeight: 16,
    marginBottom: 10,
  },
  inspiredTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  inspiredTag: {
    backgroundColor: '#d8eadb',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  inspiredTagText: {
    color: '#105e2d',
    fontSize: 9,
    fontWeight: '700',
  },
  inspiredStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#dcf0e4',
    shadowColor: '#105e2d',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statValue: {
    fontSize: 13,
    fontWeight: '900',
    color: '#0a3617',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 8,
    color: '#8b968f',
    textAlign: 'center',
    paddingHorizontal: 4,
  },
  inspiredButton: {
    backgroundColor: '#00a859',
    borderRadius: 24,
    overflow: 'hidden',
  },
  inspiredButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  inspiredButtonIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  inspiredButtonText: {
    flex: 1,
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  inspiredButtonArrow: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '300',
  },
  quickStatsContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  quickStatCard: {
    width: (width - 56) / 2, // 20 padding each side + 16 gap
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 16,
    overflow: 'hidden', // for the gradient
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 3,
  },
  quickStatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  quickStatIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#eaf4ee',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickStatIcon: {
    fontSize: 16,
  },
  sparklineIcon: {
    fontSize: 14,
    opacity: 0.6,
  },
  quickStatLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  quickStatValue: {
    fontSize: 28,
    fontWeight: '900',
    color: '#0a3617',
  },
  actionsGridContainer: {
    paddingHorizontal: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingBottom: 40, // Extra space at bottom
  },
  actionItem: {
    width: (width - 40) / 4, // 4 items per row
    alignItems: 'center',
    marginBottom: 20,
  },
  actionIconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  actionIconInner: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    fontSize: 10,
    color: '#374151',
    textAlign: 'center',
    fontWeight: '600',
  },
  sectionContainer: {
    marginBottom: 40,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    flexShrink: 1, // Shrink instead of overlapping
    maxWidth: '80%', // Ensures it doesn't push the button out
    fontSize: 16,
    fontWeight: '800',
    color: '#0a3617',
    marginRight: 8,
  },
  seeAllText: {
    fontSize: 13,
    color: '#00a859',
    fontWeight: '600',
  },
  horizontalScrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 12, // Prevents shadow clipping
    gap: 16,
  },
  vehicleCard: {
    width: 280,
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 3,
  },
  vehicleCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  vehicleIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#eaf4ee',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vehicleIcon: {
    fontSize: 32,
  },
  fuelBadge: {
    backgroundColor: '#d8eadb',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  fuelBadgeText: {
    color: '#126e35',
    fontSize: 10,
    fontWeight: '600',
  },
  vehicleName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0a3617',
    marginBottom: 4,
  },
  vehiclePlates: {
    fontSize: 11,
    color: '#6b7280',
    marginBottom: 16,
  },
  vehicleStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  vehicleStatPill: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    borderRadius: 16,
    paddingVertical: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  vehicleStatLabel: {
    fontSize: 9,
    color: '#6b7280',
    marginBottom: 2,
  },
  vehicleStatValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0a3617',
  },
  leaderboardContainer: {
    paddingHorizontal: 20,
    gap: 12,
  },
  leaderboardCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  leaderboardCardActive: {
    backgroundColor: '#e6f3eb',
  },
  rankCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rankText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  leaderboardInfo: {
    flex: 1,
  },
  leaderboardName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0a3617',
    marginBottom: 2,
  },
  youBadge: {
    backgroundColor: '#126e35',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 6,
  },
  youBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '800',
  },
  leaderboardVehicle: {
    fontSize: 11,
    color: '#6b7280',
  },
  leaderboardScore: {
    alignItems: 'flex-end',
  },
  leaderboardScoreTop: {
    fontSize: 14,
    fontWeight: '800',
    color: '#126e35',
    marginBottom: 2,
  },
  leaderboardScoreBottom: {
    fontSize: 10,
    color: '#6b7280',
  },
  swipeText: {
    fontSize: 11,
    color: '#6b7280',
    letterSpacing: 1,
  },
  leaderCard: {
    width: 280,
    marginRight: 16,
    backgroundColor: '#fff',
    borderRadius: 32,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 3,
  },
  leaderCardInspiration: {
    borderWidth: 1.5,
    borderColor: '#fcd34d',
    backgroundColor: '#fffdf7',
  },
  leaderAvatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: '#b2f0c7',
    padding: 2,
    marginBottom: 16,
  },
  leaderAvatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 38,
  },
  leaderAvatarFallback: {
    backgroundColor: '#d1fae5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  leaderAvatarFallbackText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0a3617',
  },
  leaderName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0a3617',
    marginBottom: 4,
  },
  leaderTitle: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 16,
  },
  leaderQuote: {
    fontSize: 13,
    color: '#4b5563',
    fontStyle: 'italic',
    lineHeight: 20,
    marginBottom: 20,
  },
  greenMissionBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#00a859',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  greenMissionBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  leaderTopBadge: {
    position: 'absolute',
    top: 24,
    right: 24,
    backgroundColor: '#fffbeb',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 2,
  },
  leaderTopBadgeText: {
    color: '#f59e0b',
    fontSize: 10,
    fontWeight: '800',
  },
  leaderInspirationBadge: {
    backgroundColor: '#fff7ed',
    borderWidth: 1,
    borderColor: '#fdba74',
  },
  leaderInspirationBadgeText: {
    color: '#ea580c',
  },
  leaderAchievementsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 16,
  },
  leaderAchievementBadge: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  leaderAchievementText: {
    fontSize: 10,
    color: '#4b5563',
    fontWeight: '600',
  },
  footerActionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 16,
    marginBottom: 20,
  },
  footerActionCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 3,
  },
  footerActionCardGreen: {
    backgroundColor: '#e6f3eb',
  },
  footerActionIcon: {
    fontSize: 24,
    marginBottom: 12,
  },
  footerActionIconMono: {
    marginBottom: 12,
  },
  footerActionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0a3617',
    marginBottom: 4,
  },
  footerActionSubtitle: {
    fontSize: 11,
    color: '#6b7280',
  },
});
