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
import {
  PROFILE_STATS,
  PROFILE_TAGS,
} from '../data/journeyData';
import { getBottomInset, getTopInset } from '../utils/layout';
import {
  ApiError,
  partnersService,
  staticDataService,
  unwrapList,
  type Partner,
} from '../api';

type Props = {
  onBack: () => void;
  onViewJourney?: () => void;
};

const PARTNERS = [
  {
    icon: 'shield-check-outline' as const,
    title: 'ShieldSure',
    subtitle: 'by SureGrowth Solution IMF Pvt Ltd',
    badge: 'Insurance Partner',
  },
  {
    icon: 'bank-outline' as const,
    title: 'Indore Zila Prashasan',
    subtitle: 'District Administration',
    badge: 'Civic Collaboration',
  },
  {
    icon: 'account-check-outline' as const,
    title: 'Local Communities',
    subtitle: 'Resident Welfare Associations',
    badge: 'Plantation Drives',
  },
];

type PartnerCard = (typeof PARTNERS)[number];

function mapPartners(items: Partner[]): PartnerCard[] {
  return items.map(item => ({
    icon: 'account-check-outline' as const,
    title: item.partnerName,
    subtitle: item.contactPerson || item.location || item.partnerType || '',
    badge: item.partnerType || 'Partner',
  }));
}

export default function AboutInitiativeScreen({
  onBack,
  onViewJourney,
}: Props) {
  const [aboutDescription, setAboutDescription] = useState(
    'Every vehicle on our streets can become a force for nature.',
  );
  const [aboutBody, setAboutBody] = useState('');
  const [partners, setPartners] = useState<PartnerCard[]>(PARTNERS);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const info = await staticDataService.getInitiativeInfo();
        if (mounted && info?.about) {
          if (info.about.vision) setAboutDescription(info.about.vision);
          if (info.about.description) setAboutBody(info.about.description);
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
        const res = await partnersService.list({ page: 1, limit: 20, status: 'Active' });
        const list = unwrapList(res);
        if (mounted && list.length > 0) {
          setPartners(mapPartners(list));
        }
      } catch {
        // keep local partners
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
          <View style={styles.storyBadge}>
            <MaterialCommunityIcons name="heart-outline" size={14} color="#fff" />
            <Text style={styles.storyBadgeText}>
              Indore Zila Prashasan · Civic Initiative
            </Text>
          </View>
        </LinearGradient>

        <View style={styles.inspirationCard}>
          <View style={styles.inspirationTag}>
            <MaterialCommunityIcons name="star-four-points" size={12} color="#2b964f" />
            <Text style={styles.inspirationTagText}>
              THE INSPIRATION BEHIND PARYAVARAN PRAHRI
            </Text>
          </View>
          <Text style={styles.inspirationBody}>
            The vision of Paryavaran Prahri is inspired by decades of
            environmental conservation, biodiversity restoration, sustainable
            agriculture, and large-scale tree plantation efforts. The initiative
            draws inspiration from the remarkable work of Dr. Ram Patidar, whose
            contribution to environmental protection, biodiversity development,
            and community participation has earned national and international
            recognition.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Founder & Inspiration</Text>

        <LinearGradient
          colors={['#f0faf4', '#fffbeb', '#f0faf4']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.founderBorder}>
          <View style={styles.founderCard}>
            <View style={styles.founderBadges}>
              <View style={styles.inspiredByBadge}>
                <MaterialCommunityIcons name="star-four-points" size={12} color="#fff" />
                <Text style={styles.inspiredByText}>INSPIRED BY</Text>
              </View>
              <View style={styles.advisorBadge}>
                <Text style={styles.advisorText}>IN National Mission Advisor</Text>
              </View>
            </View>

            <View style={styles.founderRow}>
              <View style={styles.avatarWrap}>
                <Image
                  source={{
                    uri: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&h=200&fit=crop',
                  }}
                  style={styles.avatar}
                />
                <View style={styles.trophyBadge}>
                  <MaterialCommunityIcons name="trophy" size={12} color="#fff" />
                </View>
              </View>
              <View style={styles.founderInfo}>
                <Text style={styles.founderName}>Dr. Ram Patidar</Text>
                <Text style={styles.founderRole}>
                  Environmentalist · Biodiversity Conservationist · Social
                  Reformer
                </Text>
              </View>
            </View>

            <View style={styles.tagsRow}>
              {PROFILE_TAGS.map(tag => (
                <View key={tag} style={styles.tagPill}>
                  <MaterialCommunityIcons name="leaf" size={11} color="#2b964f" />
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>

            <View style={styles.statsRow}>
              {PROFILE_STATS.map(stat => (
                <View key={stat.label} style={styles.statCircle}>
                  <Text style={styles.statValue}>{stat.value}</Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </View>
              ))}
            </View>

            <Pressable style={styles.journeyBtnWrap} onPress={onViewJourney}>
              <LinearGradient
                colors={['#0c4820', '#2b964f']}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={styles.journeyBtn}>
                <MaterialCommunityIcons name="medal-outline" size={18} color="#fff" />
                <Text style={styles.journeyBtnText}>
                  View the Journey & Achievements
                </Text>
                <MaterialCommunityIcons name="chevron-right" size={20} color="#fff" />
              </LinearGradient>
            </Pressable>
          </View>
        </LinearGradient>

        <Text style={styles.sectionTitle}>Our Channel Partner</Text>

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
                <Text style={styles.ssLogoText}>SS</Text>
              </LinearGradient>
              <View style={styles.channelInfo}>
                <View style={styles.channelNameRow}>
                  <Text style={styles.channelName}>ShieldSure</Text>
                  <View style={styles.startupBadge}>
                    <Text style={styles.startupBadgeText}>
                      INDIA'S FIRST STARTUP
                    </Text>
                  </View>
                </View>
                <Text style={styles.channelSub}>
                  Insurance + Eco-Mobility · Official Channel Partner
                </Text>
              </View>
            </View>
            <Text style={styles.channelDesc}>
              ShieldSure powers the insurance backbone for Paryavaran Prahri —
              enabling every vehicle to be linked to a verified eco-identity and
              contribution.
            </Text>
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedBadgeText}>
                🤝 Channel Partner · Verified
              </Text>
            </View>
          </View>
        </LinearGradient>

        <Text style={styles.sectionTitle}>Partners</Text>

        {partners.map(partner => (
          <View key={partner.title} style={styles.partnerCard}>
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
        ))}

        <View style={styles.missionCard}>
          <Text style={styles.missionTitle}>Our Mission</Text>
          <Text style={styles.missionBody}>
            By 2030, plant and verifiably grow{' '}
            <Text style={styles.missionBold}>10 million trees</Text> tied to
            vehicle ownership across India — measurable, traceable, civic-led.
          </Text>
        </View>

        <Pressable style={styles.leadersBtnWrap}>
          <LinearGradient
            colors={['#0c4820', '#2b964f']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.leadersBtn}>
            <Text style={styles.leadersBtnText}>Meet the Leaders</Text>
          </LinearGradient>
        </Pressable>
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
    marginBottom: 16,
  },
  storyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0,0,0,0.25)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  storyBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  inspirationCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 18,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#dce8df',
  },
  inspirationTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    marginBottom: 12,
  },
  inspirationTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#2b964f',
    letterSpacing: 0.3,
  },
  inspirationBody: {
    fontSize: 13,
    color: '#4b5563',
    lineHeight: 21,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0a3617',
    marginBottom: 14,
  },
  founderBorder: {
    borderRadius: 24,
    padding: 2,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#f27e20',
  },
  founderCard: {
    backgroundColor: '#fff',
    borderRadius: 22,
    padding: 18,
  },
  founderBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  inspiredByBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f27e20',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  inspiredByText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
  },
  advisorBadge: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#dce8df',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  advisorText: {
    color: '#2b964f',
    fontSize: 10,
    fontWeight: '700',
  },
  founderRow: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  avatarWrap: {
    position: 'relative',
    marginRight: 14,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: '#b2f0c7',
  },
  trophyBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#f27e20',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  founderInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  founderName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0c4820',
    marginBottom: 4,
  },
  founderRole: {
    fontSize: 11,
    color: '#6b7280',
    lineHeight: 16,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 16,
  },
  tagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#2b964f',
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  statCircle: {
    width: '47%',
    backgroundColor: '#f0faf4',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#dce8df',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0a3617',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
    color: '#6b7280',
    textAlign: 'center',
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
    flex: 1,
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  partnerBorder: {
    borderRadius: 24,
    padding: 2,
    marginBottom: 24,
  },
  channelCard: {
    backgroundColor: '#fff',
    borderRadius: 22,
    padding: 18,
  },
  channelTop: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  ssLogo: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  ssLogoText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
  },
  channelInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  channelNameRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  channelName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0a3617',
  },
  startupBadge: {
    backgroundColor: '#fff3e0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  startupBadgeText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#e65100',
  },
  channelSub: {
    fontSize: 11,
    color: '#6b7280',
  },
  channelDesc: {
    fontSize: 13,
    color: '#4b5563',
    lineHeight: 20,
    marginBottom: 12,
  },
  verifiedBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  verifiedBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#2b964f',
  },
  partnerCard: {
    flexDirection: 'row',
    alignItems: 'center',
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
    fontWeight: '800',
    color: '#0a3617',
    marginBottom: 2,
  },
  partnerSub: {
    fontSize: 11,
    color: '#6b7280',
  },
  partnerBadge: {
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    maxWidth: 90,
  },
  partnerBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#2b964f',
    textAlign: 'center',
  },
  missionCard: {
    backgroundColor: '#e8f5e9',
    borderRadius: 20,
    padding: 20,
    marginTop: 14,
    marginBottom: 20,
  },
  missionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0a3617',
    marginBottom: 8,
  },
  missionBody: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 22,
  },
  missionBold: {
    fontWeight: '800',
    color: '#0a3617',
  },
  leadersBtnWrap: {
    borderRadius: 28,
    overflow: 'hidden',
  },
  leadersBtn: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  leadersBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
});
