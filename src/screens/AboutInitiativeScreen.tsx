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
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { ProfileStat } from '../data/journeyData';
import { getBottomInset, getTopInset } from '../utils/layout';
import {
  ApiError,
  journeyService,
  leadersService,
  partnersService,
  staticDataService,
  unwrapList,
  type Leader,
  type Partner,
} from '../api';
import { resolveMediaUrl } from '../api/mediaUrl';

type Props = {
  onBack: () => void;
  onViewJourney?: () => void;
  onMeetLeaders?: () => void;
  onNotifications?: () => void;
};

type PartnerCard = {
  id: string;
  icon: 'shield-check-outline' | 'bank-outline' | 'account-check-outline';
  title: string;
  subtitle: string;
  badge: string;
  logo?: string;
};

type LeaderCard = {
  id: string;
  name: string;
  title: string;
  photo?: string;
  organization?: string;
};

function partnerIcon(
  type?: string,
): PartnerCard['icon'] {
  const t = (type || '').toLowerCase();
  if (t.includes('corporate')) return 'shield-check-outline';
  if (t.includes('government')) return 'bank-outline';
  return 'account-check-outline';
}

function mapPartners(items: Partner[]): PartnerCard[] {
  return items.map(item => ({
    id: item._id,
    icon: partnerIcon(item.partnerType),
    title: item.partnerName,
    subtitle: item.contactPerson || item.location || item.partnerType || '',
    badge: item.partnerType || 'Partner',
    logo: item.logo,
  }));
}

function mapLeaders(items: Leader[]): LeaderCard[] {
  return items.map(item => ({
    id: item._id,
    name: item.leaderName,
    title: item.designation,
    photo: item.photo,
    organization: item.organization,
  }));
}

export default function AboutInitiativeScreen({
  onBack,
  onViewJourney,
  onMeetLeaders,
  onNotifications,
}: Props) {
  const [loading, setLoading] = useState(true);
  const [aboutDescription, setAboutDescription] = useState('');
  const [aboutBody, setAboutBody] = useState('');
  const [missionText, setMissionText] = useState('');
  const [partners, setPartners] = useState<PartnerCard[]>([]);
  const [featuredPartner, setFeaturedPartner] = useState<PartnerCard | null>(
    null,
  );
  const [leaders, setLeaders] = useState<LeaderCard[]>([]);
  const [founderName, setFounderName] = useState('');
  const [founderSubtitle, setFounderSubtitle] = useState('');
  const [founderPhoto, setFounderPhoto] = useState<string | undefined>();
  const [stats, setStats] = useState<ProfileStat[]>([]);
  const [tags, setTags] = useState<string[]>([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const info = await staticDataService.getInitiativeInfo();
        if (mounted && info?.about) {
          if (info.about.vision) setAboutDescription(info.about.vision);
          if (info.about.description) setAboutBody(info.about.description);
          if (info.about.mission) setMissionText(info.about.mission);
        }
      } catch (error) {
        if (__DEV__) {
          console.warn(
            error instanceof ApiError
              ? error.message
              : 'Failed to load initiative info',
          );
        }
      }

      try {
        const res = await partnersService.list({
          page: 1,
          limit: 20,
          status: 'Active',
        });
        const list = unwrapList(res);
        if (mounted) {
          const mapped = mapPartners(list);
          setPartners(mapped);
          setFeaturedPartner(mapped[0] ?? null);
        }
      } catch {
        if (mounted) {
          setPartners([]);
          setFeaturedPartner(null);
        }
      }

      try {
        const leadersRes = await leadersService.list({
          page: 1,
          limit: 20,
          isActive: true,
        });
        const list = unwrapList(leadersRes);
        if (mounted) {
          const mapped = mapLeaders(list);
          const withPhotos = await Promise.all(
            mapped.map(async row => ({
              ...row,
              photo: await resolveMediaUrl(row.photo),
            })),
          );
          setLeaders(withPhotos);
        }
      } catch {
        if (mounted) setLeaders([]);
      }

      try {
        const timeline = await journeyService.getTimeline();
        if (mounted && timeline?.profile) {
          if (timeline.profile.name) setFounderName(timeline.profile.name);
          if (timeline.profile.subtitle) {
            setFounderSubtitle(timeline.profile.subtitle);
          }
          if (timeline.profile.photo) setFounderPhoto(timeline.profile.photo);
          if (timeline.profile.stats?.length) setStats(timeline.profile.stats);
          if (timeline.profile.tags?.length) setTags(timeline.profile.tags);
        }
      } catch {
        // founder block optional
      } finally {
        if (mounted) setLoading(false);
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
          <Text style={styles.headerTitle}>About Paryavaran Prahri</Text>
          <Text style={styles.headerSubtitle}>
            A civic environmental movement
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
          <LinearGradient
            colors={['#0c4820', '#2b964f', '#44b969']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.storyCard}>
            <Text style={styles.storyLabel}>OUR STORY</Text>
            <Text style={styles.storyHeading}>
              {aboutDescription ||
                'Every vehicle on our streets can become a force for nature.'}
            </Text>
            <Text style={styles.storyBody}>
              {aboutBody ||
                'Paryavaran Prahri connects vehicle owners to a living tree, tracked from sapling to canopy — turning daily mobility into measurable environmental contribution.'}
            </Text>
          </LinearGradient>

          {founderName ? (
            <>
              <Text style={styles.sectionTitle}>Founder & Inspiration</Text>
              <LinearGradient
                colors={['#f0faf4', '#fffbeb', '#f0faf4']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.founderBorder}>
                <View style={styles.founderCard}>
                  <View style={styles.founderRow}>
                    <View style={styles.avatarWrap}>
                      {founderPhoto ? (
                        <Image
                          source={{ uri: founderPhoto }}
                          style={styles.avatar}
                        />
                      ) : (
                        <View style={[styles.avatar, styles.avatarFallback]}>
                          <Text style={styles.avatarFallbackText}>🌱</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.founderInfo}>
                      <Text style={styles.founderName}>{founderName}</Text>
                      <Text style={styles.founderRole}>
                        {founderSubtitle || 'Journey & Achievements'}
                      </Text>
                    </View>
                  </View>

                  {tags.length > 0 ? (
                    <View style={styles.tagsRow}>
                      {tags.map(tag => (
                        <View key={tag} style={styles.tagPill}>
                          <MaterialCommunityIcons
                            name="leaf"
                            size={11}
                            color="#2b964f"
                          />
                          <Text style={styles.tagText}>{tag}</Text>
                        </View>
                      ))}
                    </View>
                  ) : null}

                  {stats.length > 0 ? (
                    <View style={styles.statsRow}>
                      {stats.map(stat => (
                        <View key={stat.label} style={styles.statCircle}>
                          <Text style={styles.statValue}>{stat.value}</Text>
                          <Text style={styles.statLabel}>{stat.label}</Text>
                        </View>
                      ))}
                    </View>
                  ) : null}

                  <Pressable
                    style={styles.journeyBtnWrap}
                    onPress={onViewJourney}>
                    <LinearGradient
                      colors={['#0c4820', '#2b964f']}
                      start={{ x: 0, y: 0.5 }}
                      end={{ x: 1, y: 0.5 }}
                      style={styles.journeyBtn}>
                      <MaterialCommunityIcons
                        name="medal-outline"
                        size={18}
                        color="#fff"
                      />
                      <Text style={styles.journeyBtnText}>
                        View the Journey & Achievements
                      </Text>
                      <MaterialCommunityIcons
                        name="chevron-right"
                        size={20}
                        color="#fff"
                      />
                    </LinearGradient>
                  </Pressable>
                </View>
              </LinearGradient>
            </>
          ) : null}

          {featuredPartner ? (
            <>
              <Text style={styles.sectionTitle}>Featured Partner</Text>
              <LinearGradient
                colors={['#f27e20', '#2b964f']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.partnerBorder}>
                <View style={styles.channelCard}>
                  <View style={styles.channelTop}>
                    <LinearGradient
                      colors={['#f27e20', '#2b964f']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.ssLogo}>
                      <Text style={styles.ssLogoText}>
                        {featuredPartner.title.slice(0, 2).toUpperCase()}
                      </Text>
                    </LinearGradient>
                    <View style={styles.channelInfo}>
                      <Text style={styles.channelName}>
                        {featuredPartner.title}
                      </Text>
                      <Text style={styles.channelSub}>
                        {featuredPartner.subtitle || featuredPartner.badge}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.verifiedBadge}>
                    <Text style={styles.verifiedBadgeText}>
                      {featuredPartner.badge} · From Partners CMS
                    </Text>
                  </View>
                </View>
              </LinearGradient>
            </>
          ) : null}

          <Text style={styles.sectionTitle}>Partners</Text>
          {partners.length === 0 ? (
            <Text style={styles.emptyText}>No partners published yet.</Text>
          ) : (
            partners.map(partner => (
              <View key={partner.id} style={styles.partnerCard}>
                <View style={styles.partnerIconCircle}>
                  <MaterialCommunityIcons
                    name={partner.icon}
                    size={22}
                    color="#2b964f"
                  />
                </View>
                <View style={styles.partnerInfo}>
                  <Text style={styles.partnerTitle}>{partner.title}</Text>
                  <Text style={styles.partnerSub}>{partner.subtitle}</Text>
                </View>
                <View style={styles.partnerBadge}>
                  <Text style={styles.partnerBadgeText}>{partner.badge}</Text>
                </View>
              </View>
            ))
          )}

          {missionText ? (
            <View style={styles.missionCard}>
              <Text style={styles.missionTitle}>Our Mission</Text>
              <Text style={styles.missionBody}>{missionText}</Text>
            </View>
          ) : null}

          {leaders.length > 0 ? (
            <>
              <Text style={styles.sectionTitle}>Initiative Leaders</Text>
              {leaders.map(leader => (
                <View key={leader.id} style={styles.leaderRow}>
                  {leader.photo ? (
                    <Image
                      source={{ uri: leader.photo }}
                      style={styles.leaderAvatar}
                    />
                  ) : (
                    <View style={[styles.leaderAvatar, styles.avatarFallback]}>
                      <Text style={styles.avatarFallbackText}>👤</Text>
                    </View>
                  )}
                  <View style={styles.leaderInfo}>
                    <Text style={styles.leaderName}>{leader.name}</Text>
                    <Text style={styles.leaderTitleText}>{leader.title}</Text>
                    {leader.organization ? (
                      <Text style={styles.leaderOrg}>{leader.organization}</Text>
                    ) : null}
                  </View>
                </View>
              ))}
            </>
          ) : null}

          <Pressable
            style={styles.leadersBtnWrap}
            onPress={onMeetLeaders || onBack}>
            <LinearGradient
              colors={['#0c4820', '#2b964f']}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.leadersBtn}>
              <Text style={styles.leadersBtnText}>
                {leaders.length > 0
                  ? 'View leaders on Home'
                  : 'Meet the Leaders'}
              </Text>
            </LinearGradient>
          </Pressable>
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
    paddingHorizontal: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0a3617',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 2,
    textAlign: 'center',
  },
  scrollContent: {
    padding: 20,
  },
  storyCard: {
    borderRadius: 24,
    padding: 22,
    marginBottom: 16,
  },
  storyLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.8)',
    letterSpacing: 1,
    marginBottom: 10,
  },
  storyHeading: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
    lineHeight: 30,
    marginBottom: 12,
  },
  storyBody: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 22,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0a3617',
    marginBottom: 12,
    marginTop: 8,
  },
  emptyText: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 16,
  },
  founderBorder: {
    borderRadius: 24,
    padding: 2,
    marginBottom: 16,
  },
  founderCard: {
    backgroundColor: '#fff',
    borderRadius: 22,
    padding: 16,
  },
  founderRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  avatarWrap: {
    width: 64,
    height: 64,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  avatarFallback: {
    backgroundColor: '#e8f5e9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFallbackText: {
    fontSize: 24,
  },
  founderInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  founderName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0a3617',
  },
  founderRole: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
    lineHeight: 18,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  tagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f0faf4',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  tagText: {
    fontSize: 11,
    color: '#2b964f',
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  statCircle: {
    width: '47%',
    backgroundColor: '#f4f9f4',
    borderRadius: 14,
    padding: 12,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0a3617',
  },
  statLabel: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 2,
  },
  journeyBtnWrap: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  journeyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  journeyBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
    flex: 1,
  },
  partnerBorder: {
    borderRadius: 22,
    padding: 2,
    marginBottom: 16,
  },
  channelCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
  },
  channelTop: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 10,
  },
  ssLogo: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ssLogoText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 16,
  },
  channelInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  channelName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0a3617',
  },
  channelSub: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  verifiedBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#f0faf4',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  verifiedBadgeText: {
    fontSize: 11,
    color: '#2b964f',
    fontWeight: '600',
  },
  partnerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },
  partnerIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#e8f5e9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  partnerInfo: {
    flex: 1,
  },
  partnerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0a3617',
  },
  partnerSub: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  partnerBadge: {
    backgroundColor: '#f0faf4',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  partnerBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2b964f',
  },
  missionCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
    marginBottom: 16,
  },
  missionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0a3617',
    marginBottom: 8,
  },
  missionBody: {
    fontSize: 13,
    color: '#4b5563',
    lineHeight: 20,
  },
  leaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
    gap: 12,
  },
  leaderAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  leaderInfo: {
    flex: 1,
  },
  leaderName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0a3617',
  },
  leaderTitleText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  leaderOrg: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 2,
  },
  leadersBtnWrap: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 8,
    marginBottom: 8,
  },
  leadersBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  leadersBtnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 14,
  },
});
