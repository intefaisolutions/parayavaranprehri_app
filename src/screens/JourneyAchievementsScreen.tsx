import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {
  Achievement,
  ProfileStat,
} from '../data/journeyData';
import { ApiError, journeyService } from '../api';
import { getBottomInset, getTopInset } from '../utils/layout';

type Props = {
  onBack: () => void;
  onNotifications?: () => void;
};

const BADGE_COLORS: Record<Achievement['type'], string> = {
  recognition: '#00A651',
  award: '#FF9800',
  record: '#FF9800',
  doctorate: '#7C3AED',
  international: '#2563EB',
};

const ICON_COLORS: Record<Achievement['type'], string> = {
  recognition: '#00A651',
  award: '#FF9800',
  record: '#FF9800',
  doctorate: '#7C3AED',
  international: '#2563EB',
};

const TYPE_LABELS: Record<Achievement['type'], string> = {
  recognition: 'Recognition',
  award: 'Award',
  record: 'Record',
  doctorate: 'Doctorate',
  international: 'International',
};

const TYPE_ICONS: Record<Achievement['type'], string> = {
  recognition: '✓',
  award: '🏆',
  record: '🏆',
  doctorate: '🎓',
  international: '🌐',
};

export default function JourneyAchievementsScreen({
  onBack,
  onNotifications,
}: Props) {
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [profileName, setProfileName] = useState('');
  const [profileSubtitle, setProfileSubtitle] = useState(
    'Journey & Achievements',
  );
  const [profilePhoto, setProfilePhoto] = useState<string | undefined>();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [stats, setStats] = useState<ProfileStat[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [inspiration, setInspiration] = useState('');

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const timeline = await journeyService.getTimeline();
        if (!mounted) return;
        if (!timeline?.profile && !(timeline?.achievements?.length > 0)) {
          setErrorMsg('');
          setProfileName('');
          setAchievements([]);
          setStats([]);
          setTags([]);
          setInspiration('');
          return;
        }
        if (timeline.profile?.name) setProfileName(timeline.profile.name);
        if (timeline.profile?.subtitle) {
          setProfileSubtitle(timeline.profile.subtitle);
        }
        if (timeline.profile?.photo) setProfilePhoto(timeline.profile.photo);
        if (timeline.profile?.stats?.length) {
          setStats(timeline.profile.stats);
        }
        if (timeline.profile?.tags?.length) {
          setTags(timeline.profile.tags);
        }
        if (timeline.profile?.inspirationText) {
          setInspiration(timeline.profile.inspirationText);
        }
        if (timeline.achievements?.length) {
          setAchievements(
            timeline.achievements.map(item => ({
              id: item._id,
              year: item.year,
              type: item.type,
              title: item.title,
              subtitle: item.subtitle,
              imageUrl: item.imageUrl,
            })),
          );
        } else {
          setAchievements([]);
        }
        setErrorMsg('');
      } catch (error) {
        if (mounted) {
          setErrorMsg(
            error instanceof ApiError
              ? error.message
              : 'Failed to load journey',
          );
          setProfileName('');
          setAchievements([]);
          setStats([]);
          setTags([]);
          setInspiration('');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const isEmpty =
    !loading &&
    !errorMsg &&
    !profileName &&
    achievements.length === 0 &&
    stats.length === 0;

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: getTopInset(10) }]}>
        <Pressable style={styles.headerBtn} onPress={onBack}>
          <Text style={styles.backIcon}>←</Text>
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>
            {profileName || 'Journey & Achievements'}
          </Text>
          <Text style={styles.headerSubtitle}>{profileSubtitle}</Text>
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
          {errorMsg ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>Couldn’t load journey</Text>
              <Text style={styles.emptyBody}>{errorMsg}</Text>
            </View>
          ) : null}

          {isEmpty ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>Journey content coming soon</Text>
              <Text style={styles.emptyBody}>
                Profile and achievements will appear here once published from
                the CMS.
              </Text>
            </View>
          ) : null}

          {profileName || stats.length > 0 || tags.length > 0 ? (
            <LinearGradient
              colors={['#0c4820', '#1a6b35', '#a36329']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.profileCard}>
              <View style={styles.profileTopRow}>
                <View style={styles.profileAvatarWrap}>
                  <View style={styles.profileAvatar}>
                    {profilePhoto ? (
                      <Image
                        source={{ uri: profilePhoto }}
                        style={styles.profilePhoto}
                      />
                    ) : (
                      <Text style={styles.profileEmoji}>🌱</Text>
                    )}
                  </View>
                </View>

                <View style={styles.profileInfo}>
                  {profileName ? (
                    <Text style={styles.profileName}>{profileName}</Text>
                  ) : null}
                  <Text style={styles.profileDesc}>{profileSubtitle}</Text>
                </View>
              </View>

              {stats.length > 0 ? (
                <View style={styles.statsRow}>
                  {stats.map(stat => (
                    <View key={stat.label} style={styles.statPill}>
                      <Text style={styles.statValue} numberOfLines={1}>
                        {stat.value}
                      </Text>
                      <Text style={styles.statLabel} numberOfLines={2}>
                        {stat.label}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : null}

              {tags.length > 0 ? (
                <View style={styles.tagsRow}>
                  {tags.map(tag => (
                    <View key={tag} style={styles.tagPill}>
                      <Text style={styles.tagText}>🌱 {tag}</Text>
                    </View>
                  ))}
                </View>
              ) : null}
            </LinearGradient>
          ) : null}

          {inspiration ? (
            <View style={styles.inspirationCard}>
              <Text style={styles.inspirationTitle}>
                THE INSPIRATION BEHIND PARYAVARAN PRAHRI
              </Text>
              <Text style={styles.inspirationText}>{inspiration}</Text>
            </View>
          ) : null}

          {achievements.length > 0 ? (
            <>
              <Text style={styles.timelineTitle}>Achievement Timeline</Text>
              <View style={styles.timeline}>
                <View style={styles.timelineLine} />
                {achievements.map((item, index) => (
                  <TimelineItem
                    key={item.id}
                    item={item}
                    isLast={index === achievements.length - 1}
                  />
                ))}
              </View>
            </>
          ) : !isEmpty && !errorMsg ? (
            <Text style={styles.emptyBody}>No achievements published yet.</Text>
          ) : null}
        </ScrollView>
      )}
    </View>
  );
}

function TimelineItem({
  item,
  isLast,
}: {
  item: Achievement;
  isLast: boolean;
}) {
  const badgeColor = BADGE_COLORS[item.type];
  const iconColor = ICON_COLORS[item.type];

  return (
    <View style={[styles.timelineItem, isLast && styles.timelineItemLast]}>
      <View style={styles.timelineLeft}>
        <View style={[styles.timelineDot, { backgroundColor: iconColor }]}>
          <Text style={styles.timelineDotIcon}>{TYPE_ICONS[item.type]}</Text>
        </View>
      </View>

      <View style={styles.timelineCard}>
        <View style={styles.timelineCardHeader}>
          <Text style={styles.timelineYear}>{item.year}</Text>
          <View style={[styles.typeBadge, { backgroundColor: badgeColor }]}>
            <Text style={styles.typeBadgeText}>{TYPE_LABELS[item.type]}</Text>
          </View>
        </View>

        <Text style={styles.timelineCardTitle}>{item.title}</Text>
        <Text style={styles.timelineCardSubtitle}>{item.subtitle}</Text>

        {item.imageUrl ? (
          <Image
            source={{ uri: item.imageUrl }}
            style={styles.timelineImage}
            resizeMode="cover"
          />
        ) : null}
      </View>
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
    padding: 16,
  },
  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e8eee9',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0a3617',
    marginBottom: 8,
  },
  emptyBody: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 20,
    textAlign: 'center',
  },
  profileCard: {
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
  },
  profileTopRow: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 16,
  },
  profileAvatarWrap: {
    width: 72,
    height: 72,
  },
  profileAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  profilePhoto: {
    width: 72,
    height: 72,
  },
  profileEmoji: {
    fontSize: 32,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 6,
  },
  profileDesc: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 18,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  statPill: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    minWidth: '45%',
    flexGrow: 1,
  },
  statValue: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 15,
  },
  statLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
    marginTop: 2,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagPill: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  tagText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  inspirationCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  inspirationTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#2b964f',
    marginBottom: 8,
    letterSpacing: 0.4,
  },
  inspirationText: {
    fontSize: 13,
    color: '#4b5563',
    lineHeight: 20,
  },
  timelineTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0a3617',
    marginBottom: 14,
  },
  timeline: {
    position: 'relative',
    paddingLeft: 8,
  },
  timelineLine: {
    position: 'absolute',
    left: 23,
    top: 8,
    bottom: 8,
    width: 2,
    backgroundColor: '#d1e7d8',
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  timelineItemLast: {
    marginBottom: 0,
  },
  timelineLeft: {
    width: 40,
    alignItems: 'center',
  },
  timelineDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  timelineDotIcon: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  timelineCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginLeft: 8,
  },
  timelineCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  timelineYear: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0a3617',
  },
  typeBadge: {
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  typeBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  timelineCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  timelineCardSubtitle: {
    fontSize: 12,
    color: '#6b7280',
  },
  timelineImage: {
    width: '100%',
    height: 140,
    borderRadius: 12,
    marginTop: 10,
  },
});
