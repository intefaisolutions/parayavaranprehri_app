import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { getBottomInset, getTopInset } from '../utils/layout';
import { ApiError, mitrasService, staticDataService } from '../api';

type Props = {
  onBack: () => void;
};

type MembershipType = 'free' | 'premium';

type MitraFormData = {
  name: string;
  profession: string;
  address: string;
  mobile: string;
  email: string;
  membership: MembershipType;
  mitraId: string;
};

const generateMitraId = () =>
  `PM-IND-${Math.floor(100000 + Math.random() * 900000)}`;

export default function MitraScreen({ onBack }: Props) {
  const [step, setStep] = useState<'form' | 'card'>('form');
  const [membership, setMembership] = useState<MembershipType>('premium');
  const [name, setName] = useState('');
  const [profession, setProfession] = useState('');
  const [address, setAddress] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [cardData, setCardData] = useState<MitraFormData | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleGenerate = async () => {
    if (submitting) return;

    const formName = name.trim() || 'Rahul Sharma';
    const formMobile = mobile.trim() || '9826012345';
    const formEmail = email.trim() || 'rahul@email.com';
    const formProfession = profession.trim();
    const formAddress = address.trim();

    setSubmitting(true);
    setErrorMsg('');
    try {
      const created = (await mitrasService.create({
        name: formName,
        mobile: formMobile,
        email: formEmail,
        profession: formProfession || undefined,
        address: formAddress || undefined,
        membership,
      })) as { mitraId?: string; id?: string };

      setCardData({
        name: formName,
        profession: formProfession,
        address: formAddress,
        mobile: formMobile,
        email: formEmail,
        membership,
        mitraId: created.mitraId || created.id || generateMitraId(),
      });
      setStep('card');
    } catch (createError) {
      // Citizen users may lack mitras:create — fall back to static card data
      try {
        const card = await staticDataService.getMitraCard();
        setCardData({
          name: formName || card.name,
          profession: formProfession || card.role,
          address: formAddress,
          mobile: formMobile,
          email: formEmail,
          membership,
          mitraId: card.id || generateMitraId(),
        });
        setStep('card');
        setErrorMsg(
          createError instanceof ApiError
            ? `${createError.message} Showing preview card.`
            : 'Showing preview card.',
        );
      } catch {
        setErrorMsg(
          createError instanceof ApiError
            ? createError.message
            : 'Failed to register as Mitra',
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleBack = () => {
    if (step === 'card') {
      setStep('form');
      return;
    }
    onBack();
  };

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: getTopInset(10) }]}>
        <Pressable style={styles.headerBtn} onPress={handleBack}>
          <Text style={styles.backIcon}>←</Text>
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Paryavaran Mitra</Text>
          <Text style={styles.headerSubtitle}>
            Volunteer for India's Net Zero Mission
          </Text>
        </View>
        <Pressable style={styles.headerBtn}>
          <Text style={styles.bellIcon}>🔔</Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: getBottomInset(32) },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {step === 'form' ? (
            <>
              <View style={styles.membershipRow}>
                <Pressable
                  style={[
                    styles.membershipCard,
                    membership === 'free' && styles.membershipCardActive,
                  ]}
                  onPress={() => setMembership('free')}>
                  <Text style={styles.membershipIcon}>👥</Text>
                  <Text style={styles.membershipTitle}>Free Volunteer</Text>
                  <Text style={styles.membershipSub}>Join community drives</Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.membershipCard,
                    styles.membershipCardPremium,
                    membership === 'premium' && styles.membershipCardPremiumActive,
                  ]}
                  onPress={() => setMembership('premium')}>
                  <Text style={styles.membershipIcon}>👑</Text>
                  <Text style={styles.membershipTitle}>Premium Member</Text>
                  <Text style={styles.membershipSub}>
                    Mentor & lead initiatives
                  </Text>
                </Pressable>
              </View>

              <View style={styles.formCard}>
                <Text style={styles.fieldLabel}>Name</Text>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="Enter your name"
                  placeholderTextColor="#9ca3af"
                />

                <Text style={styles.fieldLabel}>Profession</Text>
                <TextInput
                  style={styles.input}
                  value={profession}
                  onChangeText={setProfession}
                  placeholder="Your profession"
                  placeholderTextColor="#9ca3af"
                />

                <Text style={styles.fieldLabel}>Address</Text>
                <TextInput
                  style={styles.input}
                  value={address}
                  onChangeText={setAddress}
                  placeholder="City, State"
                  placeholderTextColor="#9ca3af"
                />

                <Text style={styles.fieldLabel}>Mobile</Text>
                <TextInput
                  style={styles.input}
                  value={mobile}
                  onChangeText={setMobile}
                  placeholder="10-digit mobile"
                  placeholderTextColor="#9ca3af"
                  keyboardType="phone-pad"
                />

                <Text style={styles.fieldLabel}>Email</Text>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="your@email.com"
                  placeholderTextColor="#9ca3af"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />

                <Pressable
                  style={styles.generateBtnWrap}
                  onPress={handleGenerate}
                  disabled={submitting}>
                  <LinearGradient
                    colors={['#0c4820', '#2b964f']}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                    style={styles.generateBtn}>
                    {submitting ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.generateBtnText}>
                        Generate Digital Visiting Card
                      </Text>
                    )}
                  </LinearGradient>
                </Pressable>
                {errorMsg ? (
                  <Text style={styles.errorText}>{errorMsg}</Text>
                ) : null}
              </View>
            </>
          ) : (
            cardData && (
              <>
                <LinearGradient
                  colors={['#e8f5e9', '#f0faf4', '#e8f5e9']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.visitingCardBorder}>
                  <View style={styles.visitingCard}>
                    <View style={styles.badgeRow}>
                      <View style={styles.mitraBadge}>
                        <Text style={styles.mitraBadgeText}>
                          IN PARYAVARAN MITRA
                        </Text>
                      </View>
                      {cardData.membership === 'premium' && (
                        <View style={styles.premiumBadge}>
                          <Text style={styles.premiumBadgeText}>👑 Premium</Text>
                        </View>
                      )}
                    </View>

                    <Text style={styles.cardName}>{cardData.name}</Text>
                    {cardData.profession ? (
                      <Text style={styles.cardProfession}>
                        {cardData.profession}
                      </Text>
                    ) : null}

                    <View style={styles.cardInfoRow}>
                      <View style={styles.cardInfoBox}>
                        <Text style={styles.cardInfoLabel}>Mitra ID</Text>
                        <Text style={styles.cardInfoValue}>
                          {cardData.mitraId}
                        </Text>
                      </View>
                      <View style={styles.cardInfoBox}>
                        <Text style={styles.cardInfoLabel}>Mobile</Text>
                        <Text style={styles.cardInfoValue}>
                          {cardData.mobile}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.cardInfoBoxFull}>
                      <Text style={styles.cardInfoLabel}>Email</Text>
                      <Text style={styles.cardInfoValue}>{cardData.email}</Text>
                    </View>

                    <Text style={styles.verifiedText}>
                      ✓ Mission 2047 · Verified
                    </Text>
                  </View>
                </LinearGradient>

                <View style={styles.actionRow}>
                  <Pressable style={styles.downloadBtn}>
                    <Text style={styles.downloadBtnText}>⬇ Download</Text>
                  </Pressable>
                  <Pressable style={styles.shareBtnWrap}>
                    <LinearGradient
                      colors={['#0c4820', '#2b964f']}
                      start={{ x: 0, y: 0.5 }}
                      end={{ x: 1, y: 0.5 }}
                      style={styles.shareBtn}>
                      <Text style={styles.shareBtnText}>↗ Share</Text>
                    </LinearGradient>
                  </Pressable>
                </View>
              </>
            )
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#f4f9f4',
  },
  flex: {
    flex: 1,
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
    textAlign: 'center',
  },
  scrollContent: {
    padding: 20,
  },
  membershipRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  membershipCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  membershipCardActive: {
    borderColor: '#2b964f',
  },
  membershipCardPremium: {
    backgroundColor: '#fffbeb',
  },
  membershipCardPremiumActive: {
    borderColor: '#f27e20',
  },
  membershipIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  membershipTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0a3617',
    marginBottom: 4,
  },
  membershipSub: {
    fontSize: 11,
    color: '#6b7280',
    lineHeight: 15,
  },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  fieldLabel: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 8,
    marginTop: 4,
  },
  input: {
    backgroundColor: '#f0faf4',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#dce8df',
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
    fontWeight: '600',
    color: '#0a3617',
    marginBottom: 14,
  },
  generateBtnWrap: {
    borderRadius: 28,
    overflow: 'hidden',
    marginTop: 8,
  },
  generateBtn: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  generateBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 12,
    marginTop: 10,
    textAlign: 'center',
  },
  visitingCardBorder: {
    borderRadius: 24,
    padding: 2,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#2b964f',
  },
  visitingCard: {
    backgroundColor: '#fff',
    borderRadius: 22,
    padding: 20,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  mitraBadge: {
    backgroundColor: '#0c4820',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  mitraBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  premiumBadge: {
    backgroundColor: '#fff3e0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  premiumBadgeText: {
    color: '#e65100',
    fontSize: 11,
    fontWeight: '700',
  },
  cardName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0c4820',
    marginBottom: 4,
  },
  cardProfession: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
  },
  cardInfoRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  cardInfoBox: {
    flex: 1,
    backgroundColor: '#f0faf4',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#dce8df',
  },
  cardInfoBoxFull: {
    backgroundColor: '#f0faf4',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#dce8df',
    marginBottom: 14,
  },
  cardInfoLabel: {
    fontSize: 11,
    color: '#9ca3af',
    marginBottom: 4,
  },
  cardInfoValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0a3617',
  },
  verifiedText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2b964f',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  downloadBtn: {
    flex: 1,
    backgroundColor: '#0c4820',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  downloadBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  shareBtnWrap: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  shareBtn: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  shareBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});
