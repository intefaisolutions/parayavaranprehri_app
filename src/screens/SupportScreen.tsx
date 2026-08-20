import React, { useEffect, useMemo, useState } from 'react';
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
import {
  ApiError,
  settingsService,
} from '../api';

type Props = {
  onBack: () => void;
  onNotifications?: () => void;
};

type SupportTab = 'prahri' | 'mitra';

type FaqItem = {
  id: string;
  question: string;
  answer: string;
};

type TabSupport = {
  phone: string;
  email: string;
  whatsapp: string;
  faq: FaqItem[];
};

const EMPTY_TAB: TabSupport = {
  phone: '',
  email: '',
  whatsapp: '',
  faq: [],
};

function digitsForWa(value: string) {
  return value.replace(/\D/g, '');
}

function openWhatsApp(whatsapp: string) {
  const digits = digitsForWa(whatsapp);
  if (!digits) return;
  Linking.openURL(`https://wa.me/${digits}`);
}

export default function SupportScreen({ onBack, onNotifications }: Props) {
  const [activeTab, setActiveTab] = useState<SupportTab>('prahri');
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);
  const [prahri, setPrahri] = useState<TabSupport>(EMPTY_TAB);
  const [mitra, setMitra] = useState<TabSupport>(EMPTY_TAB);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      let nextPrahri: TabSupport = { ...EMPTY_TAB };
      let nextMitra: TabSupport = { ...EMPTY_TAB };

      try {
        const response = await settingsService.list({ search: 'SUPPORT_CENTER_CONFIG' });
        // The API returns { items: Setting[], meta: any } or just Setting[] if unwrapList is used
        const configSetting = Array.isArray(response) 
            ? response.find((s: any) => s.settingName === 'SUPPORT_CENTER_CONFIG')
            : (response as any)?.items?.find((s: any) => s.settingName === 'SUPPORT_CENTER_CONFIG');

        if (configSetting && configSetting.value) {
          const parsed = JSON.parse(configSetting.value);
          
          if (parsed.prahari) {
             nextPrahri = {
               phone: parsed.prahari.phone || '',
               whatsapp: parsed.prahari.whatsapp || '',
               email: parsed.prahari.email || '',
               faq: (parsed.prahari.faqs || []).map((f: any, idx: number) => ({
                 id: `prahri-${idx}`,
                 question: f.question,
                 answer: f.answer,
               })),
             };
          }
          if (parsed.mitra) {
             nextMitra = {
               phone: parsed.mitra.phone || '',
               whatsapp: parsed.mitra.whatsapp || '',
               email: parsed.mitra.email || '',
               faq: (parsed.mitra.faqs || []).map((f: any, idx: number) => ({
                 id: `mitra-${idx}`,
                 question: f.question,
                 answer: f.answer,
               })),
             };
          }
        }
      } catch (error) {
        if (__DEV__) {
          console.warn(
            error instanceof ApiError ? error.message : 'Support config load failed',
          );
        }
      }

      if (mounted) {
        setPrahri(nextPrahri);
        setMitra(nextMitra);
        setExpandedFaq(nextPrahri.faq[0]?.id ?? null);
        setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const active = activeTab === 'prahri' ? prahri : mitra;

  useEffect(() => {
    const faq = activeTab === 'prahri' ? prahri.faq : mitra.faq;
    setExpandedFaq(faq[0]?.id ?? null);
  }, [activeTab, prahri.faq, mitra.faq]);

  const toggleFaq = (id: string) => {
    setExpandedFaq(prev => (prev === id ? null : id));
  };

  const tabLabel = useMemo(
    () =>
      activeTab === 'prahri'
        ? 'Paryavaran Prahri Support'
        : 'Paryavaran Mitra Support',
    [activeTab],
  );

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
        <Pressable style={styles.headerBtn} onPress={onNotifications}>
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
            <Text style={styles.adminBadgeText}>CMS · Call Center</Text>
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
                  <Text style={styles.tabTextActive}>
                    Paryavaran Prahri Support
                  </Text>
                </LinearGradient>
              ) : (
                <View style={styles.tabBtnInactive}>
                  <Text style={styles.tabTextInactive}>
                    Paryavaran Prahri Support
                  </Text>
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
                  <Text style={styles.tabTextActive}>
                    Paryavaran Mitra Support
                  </Text>
                </LinearGradient>
              ) : (
                <View style={styles.tabBtnInactive}>
                  <Text style={styles.tabTextInactive}>
                    Paryavaran Mitra Support
                  </Text>
                </View>
              )}
            </Pressable>
          </View>

          <Text style={styles.tabHint}>{tabLabel}</Text>

          {active.phone ? (
            <Pressable
              style={styles.contactCard}
              onPress={() =>
                Linking.openURL(`tel:${active.phone.replace(/[^\d+]/g, '')}`)
              }>
              <View style={[styles.contactIcon, styles.contactIconGreen]}>
                <Text style={styles.contactIconText}>📞</Text>
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactTitle}>Call Now</Text>
                <Text style={styles.contactSub}>{active.phone}</Text>
              </View>
            </Pressable>
          ) : null}

          {active.whatsapp ? (
            <Pressable
              style={styles.contactCard}
              onPress={() => openWhatsApp(active.whatsapp)}>
              <View style={[styles.contactIcon, styles.contactIconGreen]}>
                <Text style={styles.contactIconText}>💬</Text>
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactTitle}>WhatsApp</Text>
                <Text style={styles.contactSub}>{active.whatsapp}</Text>
              </View>
            </Pressable>
          ) : null}

          {active.email ? (
            <Pressable
              style={styles.contactCard}
              onPress={() => Linking.openURL(`mailto:${active.email}`)}>
              <View style={[styles.contactIcon, styles.contactIconOrange]}>
                <Text style={styles.contactIconText}>✉️</Text>
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactTitle}>Email</Text>
                <Text style={styles.contactSub}>{active.email}</Text>
              </View>
            </Pressable>
          ) : null}

          {!active.phone && !active.whatsapp && !active.email ? (
            <Text style={styles.emptyText}>
              No {activeTab === 'prahri' ? 'Prahri' : 'Mitra'} contacts published
              yet.
            </Text>
          ) : null}

          <Text style={styles.faqTitle}>Frequently Asked</Text>

          {active.faq.length === 0 ? (
            <Text style={styles.emptyText}>No FAQs published for this tab.</Text>
          ) : (
            active.faq.map(item => {
              const isExpanded = expandedFaq === item.id;
              return (
                <Pressable
                  key={item.id}
                  style={styles.faqCard}
                  onPress={() => toggleFaq(item.id)}>
                  <View style={styles.faqHeader}>
                    <Text style={styles.faqQuestion}>{item.question}</Text>
                    <Text style={styles.faqChevron}>
                      {isExpanded ? '▲' : '▼'}
                    </Text>
                  </View>
                  {isExpanded ? (
                    <Text style={styles.faqAnswer}>{item.answer}</Text>
                  ) : null}
                </Pressable>
              );
            })
          )}
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
    padding: 16,
  },
  adminBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#e8f5e9',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 12,
  },
  adminBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2b964f',
  },
  tabRow: {
    gap: 10,
    marginBottom: 10,
  },
  tabBtnWrap: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  tabBtnActive: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  tabBtnInactive: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 14,
  },
  tabTextActive: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  tabTextInactive: {
    color: '#374151',
    fontWeight: '600',
    fontSize: 13,
  },
  tabHint: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 12,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    gap: 12,
  },
  contactIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactIconGreen: {
    backgroundColor: '#e8f5e9',
  },
  contactIconOrange: {
    backgroundColor: '#fff3e0',
  },
  contactIconText: {
    fontSize: 18,
  },
  contactInfo: {
    flex: 1,
  },
  contactTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0a3617',
  },
  contactSub: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  faqTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0a3617',
    marginTop: 12,
    marginBottom: 10,
  },
  faqCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  faqQuestion: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  faqChevron: {
    fontSize: 10,
    color: '#9ca3af',
  },
  faqAnswer: {
    marginTop: 10,
    fontSize: 12,
    color: '#6b7280',
    lineHeight: 18,
  },
  emptyText: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 12,
  },
});
