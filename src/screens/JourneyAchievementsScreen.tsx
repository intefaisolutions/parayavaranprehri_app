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
import {
  ACHIEVEMENTS,
  Achievement,
  INSPIRATION_TEXT,
  PROFILE_STATS,
  PROFILE_TAGS,
} from '../data/journeyData';
import { journeyService } from '../api';
import { getBottomInset, getTopInset } from '../utils/layout';

type Props = {
  onBack: () => void;
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

export default function JourneyAchievementsScreen({ onBack }: Props) {
  const [profileName, setProfileName] = useState('Dr. Ram Patidar');
  const [profileSubtitle, setProfileSubtitle] = useState(
    'Journey & Achievements',
  );
  const [achievements, setAchievements] = useState<Achievement[]>(ACHIEVEMENTS);
  const [stats, setStats] = useState(PROFILE_STATS);
  const [tags, setTags] = useState(PROFILE_TAGS);
  const [inspiration, setInspiration] = useState(INSPIRATION_TEXT);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const timeline = await journeyService.getTimeline();
        if (!mounted || !timeline) return;
        if (timeline.profile?.name) setProfileName(timeline.profile.name);
        if (timeline.profile?.subtitle) {
          setProfileSubtitle(timeline.profile.subtitle);
        }
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
        }
      } catch {
        // keep static fallback
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
          <Text style={styles.headerTitle}>{profileName}</Text>
          <Text style={styles.headerSubtitle}>{profileSubtitle}</Text>
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
        <LinearGradient
          colors={['#0c4820', '#1a6b35', '#a36329']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.profileCard}>
          <View style={styles.profileTopRow}>
            <View style={styles.profileAvatarWrap}>
              <View style={styles.profileAvatar}>
                <Text style={styles.profileEmoji}>👨🏽‍🦳</Text>
              </View>
            </View>

            <View style={styles.profileInfo}>
              <View style={styles.inspiredBadge}>
                <Text style={styles.inspiredBadgeText}>
                  ✨ INSPIRED BY DR. RAM PATIDAR
                </Text>
              </View>
              <Text style={styles.profileName}>{profileName}</Text>
              <Text style={styles.profileDesc}>
                Environmentalist, World Record Holder, Biodiversity
                Conservationist & Social Reformer
              </Text>
              <View style={styles.locationRow}>
                <Text style={styles.locationIcon}>📍</Text>
                <Text style={styles.locationText}>
                  Kunda Palaswad, Madhya Pradesh
                </Text>
              </View>
            </View>
          </View>

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

          <View style={styles.tagsRow}>
            {tags.map(tag => (
              <View key={tag} style={styles.tagPill}>
                <Text style={styles.tagText}>🌱 {tag}</Text>
              </View>
            ))}
          </View>
        </LinearGradient>

        <View style={styles.inspirationCard}>
          <Text style={styles.inspirationTitle}>
            THE INSPIRATION BEHIND PARYAVARAN PRAHRI
          </Text>
          <Text style={styles.inspirationText}>{inspiration}</Text>
        </View>

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

        <View style={styles.bottomCards}>
          <Pressable style={styles.bottomCardWrap}>
            <LinearGradient
              colors={['#0c4820', '#2b964f']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.bottomCardGreen}>
              <Text style={styles.bottomCardIcon}>🖼️</Text>
              <Text style={styles.bottomCardTitleWhite}>Media Gallery</Text>
              <Text style={styles.bottomCardSubWhite}>
                News, awards & records
              </Text>
            </LinearGradient>
          </Pressable>

          <Pressable style={styles.bottomCardWrap}>
            <View style={styles.bottomCardWhite}>
              <Text style={styles.bottomCardIconGreen}>📄</Text>
              <Text style={styles.bottomCardTitle}>Document Library</Text>
              <Text style={styles.bottomCardSub}>
                Citations & certificates
              </Text>
            </View>
          </Pressable>
        </View>
      </ScrollView>
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
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  profileCard: {
    borderRadius: 28,
    padding: 18,
    marginBottom: 16,
    overflow: 'hidden',
  },
  profileTopRow: {
    flexDirection: 'row',
    marginBottom: 18,
  },
  profileAvatarWrap: {
    marginRight: 14,
  },
  profileAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#c4a683',
    borderWidth: 3,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  profileEmoji: {
    fontSize: 36,
  },
  profileInfo: {
    flex: 1,
  },
  inspiredBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  inspiredBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  profileName: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 4,
  },
  profileDesc: {
    color: '#e8f5ea',
    fontSize: 11,
    lineHeight: 16,
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationIcon: {
    fontSize: 11,
    marginRight: 4,
  },
  locationText: {
    color: '#c8e6c9',
    fontSize: 11,
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 14,
  },
  statPill: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
  },
  statValue: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '900',
    marginBottom: 2,
    textAlign: 'center',
  },
  statLabel: {
    color: '#dcedc8',
    fontSize: 8,
    fontWeight: '500',
    textAlign: 'center',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tagPill: {
    backgroundColor: 'rgba(255,255,255,0.16)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  tagText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
  },
  inspirationCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 3,
  },
  inspirationTitle: {
    color: '#00a859',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: 12,
  },
  inspirationText: {
    color: '#4b5563',
    fontSize: 13,
    lineHeight: 21,
  },
  timelineTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0a3617',
    marginBottom: 16,
  },
  timeline: {
    position: 'relative',
    paddingLeft: 4,
  },
  timelineLine: {
    position: 'absolute',
    left: 18,
    top: 8,
    bottom: 24,
    width: 2,
    backgroundColor: '#c8e6c9',
    borderStyle: 'dashed',
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 18,
  },
  timelineItemLast: {
    marginBottom: 0,
  },
  timelineLeft: {
    width: 36,
    alignItems: 'center',
    marginRight: 10,
    zIndex: 2,
  },
  timelineDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#f4f9f4',
  },
  timelineDotIcon: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
  },
  timelineCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  timelineCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  timelineYear: {
    fontSize: 18,
    fontWeight: '800',
    color: '#00a859',
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  timelineCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0a3617',
    marginBottom: 4,
  },
  timelineCardSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 10,
  },
  timelineImage: {
    width: '100%',
    height: 140,
    borderRadius: 14,
    backgroundColor: '#eef2ef',
  },
  bottomCards: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  bottomCardWrap: {
    flex: 1,
  },
  bottomCardGreen: {
    borderRadius: 22,
    padding: 16,
    minHeight: 130,
    justifyContent: 'flex-end',
  },
  bottomCardWhite: {
    backgroundColor: '#fff',
    borderRadius: 22,
    padding: 16,
    minHeight: 130,
    justifyContent: 'flex-end',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  bottomCardIcon: {
    fontSize: 22,
    marginBottom: 12,
  },
  bottomCardIconGreen: {
    fontSize: 22,
    marginBottom: 12,
  },
  bottomCardTitleWhite: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
  },
  bottomCardSubWhite: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 11,
    lineHeight: 16,
  },
  bottomCardTitle: {
    color: '#0a3617',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
  },
  bottomCardSub: {
    color: '#6b7280',
    fontSize: 11,
    lineHeight: 16,
  },
});
