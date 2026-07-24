import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { getBottomInset, getTopInset } from '../utils/layout';
import { ApiError, staticDataService } from '../api';

type Props = {
  onBack: () => void;
};

type SupportTab = 'prahri' | 'mitra';

const FAQ_ITEMS = [
  {
    id: '1',
    question: 'How are trees assigned to my vehicle?',
    answer:
      'Trees are assigned based on your vehicle type, fuel category, and annual CO₂ footprint. Each verified vehicle receives a unique tree ID linked to your Person Identity.',
  },
  {
    id: '2',
    question: 'How is CO₂ offset calculated?',
    answer:
      'CO₂ offset is calculated using your vehicle fuel type, annual mileage, and emission factors approved by the district environmental board.',
  },
  {
    id: '3',
    question: 'Can I add multiple vehicles?',
    answer: 'Yes — your Person Identity links all your vehicles.',
  },
];

export default function SupportScreen({ onBack }: Props) {
  const [activeTab, setActiveTab] = useState<SupportTab>('prahri');
  const [expandedFaq, setExpandedFaq] = useState<string | null>('3');
  const [phone, setPhone] = useState('+911234567890');
  const [email, setEmail] = useState('support@paryavaranprahri.in');
  const [faqItems, setFaqItems] = useState(FAQ_ITEMS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const info = await staticDataService.getInitiativeInfo();
        if (!mounted || !info?.support) return;
        if (info.support.phone) setPhone(info.support.phone);
        if (info.support.email) setEmail(info.support.email);
        if (Array.isArray(info.support.faq) && info.support.faq.length > 0) {
          setFaqItems(
            info.support.faq.map((item, index) => ({
              id: String(index + 1),
              question: item.question,
              answer: item.answer,
            })),
          );
          setExpandedFaq('1');
        }
      } catch (error) {
        // Keep local FAQ/contacts if API fails
        if (__DEV__) {
          console.warn(
            error instanceof ApiError ? error.message : 'Support load failed',
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

  const toggleFaq = (id: string) => {
    setExpandedFaq(prev => (prev === id ? null : id));
  };

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: getTopInset(10) }]}>
        <Pressable style={styles.headerBtn} onPress={onBack}>
          <Text style={styles.backIcon}>←</Text>
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Support Center</Text>
          <Text style={styles.headerSubtitle}>We're here for you</Text>
        </View>
        <Pressable style={styles.headerBtn}>
          <Text style={styles.bellIcon}>🔔</Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#136e35" />
        </View>
      ) : (
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: getBottomInset(32) },
        ]}
        showsVerticalScrollIndicator={false}>
        <View style={styles.adminBadge}>
          <Text style={styles.adminBadgeText}>Admin Configurable</Text>
        </View>

        <View style={styles.tabRow}>
          <Pressable
            style={styles.tabBtnWrap}
            onPress={() => setActiveTab('prahri')}>
            {activeTab === 'prahri' ? (
              <LinearGradient
                colors={['#0c4820', '#2b964f']}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={styles.tabBtnActive}>
                <Text style={styles.tabTextActive}>Paryavaran Prahri Support</Text>
              </LinearGradient>
            ) : (
              <View style={styles.tabBtnInactive}>
                <Text style={styles.tabTextInactive}>Paryavaran Prahri Support</Text>
              </View>
            )}
          </Pressable>
          <Pressable
            style={styles.tabBtnWrap}
            onPress={() => setActiveTab('mitra')}>
            {activeTab === 'mitra' ? (
              <LinearGradient
                colors={['#0c4820', '#2b964f']}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={styles.tabBtnActive}>
                <Text style={styles.tabTextActive}>Paryavaran Mitra Support</Text>
              </LinearGradient>
            ) : (
              <View style={styles.tabBtnInactive}>
                <Text style={styles.tabTextInactive}>Paryavaran Mitra Support</Text>
              </View>
            )}
          </Pressable>
        </View>

        <Pressable
          style={styles.contactCard}
          onPress={() => Linking.openURL(`tel:${phone.replace(/[^\d+]/g, '')}`)}>
          <View style={[styles.contactIcon, styles.contactIconGreen]}>
            <Text style={styles.contactIconText}>📞</Text>
          </View>
          <View style={styles.contactInfo}>
            <Text style={styles.contactTitle}>Call Now</Text>
            <Text style={styles.contactSub}>{phone}</Text>
          </View>
        </Pressable>

        <View style={styles.contactCard}>
          <View style={[styles.contactIcon, styles.contactIconGreen]}>
            <Text style={styles.contactIconText}>💬</Text>
          </View>
          <View style={styles.contactInfo}>
            <Text style={styles.contactTitle}>WhatsApp</Text>
            <Text style={styles.contactSub}>Chat with our team</Text>
          </View>
        </View>

        <Pressable
          style={styles.contactCard}
          onPress={() => Linking.openURL(`mailto:${email}`)}>
          <View style={[styles.contactIcon, styles.contactIconOrange]}>
            <Text style={styles.contactIconText}>✉️</Text>
          </View>
          <View style={styles.contactInfo}>
            <Text style={styles.contactTitle}>Email</Text>
            <Text style={styles.contactSub}>{email}</Text>
          </View>
        </Pressable>

        <Text style={styles.faqTitle}>Frequently Asked</Text>

        {faqItems.map(item => {
          const isExpanded = expandedFaq === item.id;
          return (
            <Pressable
              key={item.id}
              style={styles.faqCard}
              onPress={() => toggleFaq(item.id)}>
              <View style={styles.faqHeader}>
                <Text style={styles.faqQuestion}>{item.question}</Text>
                <Text style={styles.faqChevron}>{isExpanded ? '▲' : '▼'}</Text>
              </View>
              {isExpanded && (
                <Text style={styles.faqAnswer}>{item.answer}</Text>
              )}
            </Pressable>
          );
        })}
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
  loadingWrap: {
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
  adminBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#f27e20',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    marginBottom: 16,
  },
  adminBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  tabRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  tabBtnWrap: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  tabBtnActive: {
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderRadius: 16,
  },
  tabBtnInactive: {
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#dce8df',
  },
  tabTextActive: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  tabTextInactive: {
    color: '#0a3617',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  contactIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  contactIconGreen: {
    backgroundColor: '#2b964f',
  },
  contactIconOrange: {
    backgroundColor: '#f27e20',
  },
  contactIconText: {
    fontSize: 20,
  },
  contactInfo: {
    flex: 1,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0a3617',
    marginBottom: 2,
  },
  contactSub: {
    fontSize: 13,
    color: '#6b7280',
  },
  faqTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0a3617',
    marginTop: 12,
    marginBottom: 14,
  },
  faqCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  faqQuestion: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: '#0a3617',
    paddingRight: 12,
  },
  faqChevron: {
    fontSize: 12,
    color: '#9ca3af',
  },
  faqAnswer: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 20,
    marginTop: 10,
  },
});
