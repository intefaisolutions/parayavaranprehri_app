import React, { useCallback, useEffect, useState } from 'react';
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
import { ApiError, landOffersService, type LandOfferItem } from '../api';

type Props = {
  onBack: () => void;
  onNotifications?: () => void;
};

type Step = 'form' | 'success';

function formatDate(value?: string) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function OfferLandScreen({ onBack, onNotifications }: Props) {
  const [step, setStep] = useState<Step>('form');
  const [fullName, setFullName] = useState('');
  const [mobile, setMobile] = useState('');
  const [address, setAddress] = useState('');
  const [landmark, setLandmark] = useState('');
  const [availableArea, setAvailableArea] = useState('');
  const [landSize, setLandSize] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [offers, setOffers] = useState<LandOfferItem[]>([]);
  const [loadingOffers, setLoadingOffers] = useState(true);

  const loadOffers = useCallback(async () => {
    try {
      const list = await landOffersService.list();
      setOffers(Array.isArray(list) ? list : []);
    } catch {
      setOffers([]);
    } finally {
      setLoadingOffers(false);
    }
  }, []);

  useEffect(() => {
    void loadOffers();
  }, [loadOffers]);

  const handleSubmit = async () => {
    if (submitting) return;
    if (!fullName.trim() || !mobile.trim() || !address.trim() || !availableArea.trim() || !landSize.trim()) {
      setErrorMsg('Please fill all required fields.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
    try {
      await landOffersService.create({
        fullName: fullName.trim(),
        mobile: mobile.trim(),
        address: address.trim(),
        landmark: landmark.trim() || undefined,
        availableArea: availableArea.trim(),
        landSize: landSize.trim(),
      });
      await loadOffers();
      setStep('success');
    } catch (error) {
      setErrorMsg(
        error instanceof ApiError
          ? error.message
          : 'Failed to submit land offer',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const offersSection = (
    <View style={styles.myOffersSection}>
      <Text style={styles.myOffersTitle}>My offers</Text>
      {loadingOffers ? (
        <ActivityIndicator color="#136e35" />
      ) : offers.length === 0 ? (
        <Text style={styles.myOffersEmpty}>No land offers yet.</Text>
      ) : (
        offers.map(offer => (
          <View key={offer._id} style={styles.offerRow}>
            <Text style={styles.offerAddress} numberOfLines={2}>
              {offer.address}
            </Text>
            <Text style={styles.offerMeta}>
              Size: {offer.landSize}
              {offer.status ? ` · ${offer.status}` : ''}
            </Text>
            <Text style={styles.offerDate}>{formatDate(offer.createdAt)}</Text>
          </View>
        ))
      )}
    </View>
  );

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: getTopInset(10) }]}>
        <Pressable style={styles.headerBtn} onPress={onBack}>
          <Text style={styles.backIcon}>←</Text>
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Offer Space For Plantation</Text>
          <Text style={styles.headerSubtitle}>
            Donate land or available area for trees
          </Text>
        </View>
        <Pressable style={styles.headerBtn} onPress={onNotifications}>
          <Text style={styles.bellIcon}>🔔</Text>
        </Pressable>
      </View>

      {step === 'form' ? (
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: getBottomInset(32) },
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            <View style={styles.infoBanner}>
              <View style={styles.infoIconCircle}>
                <Text style={styles.infoIcon}>🌳</Text>
              </View>
              <View style={styles.infoTextWrap}>
                <Text style={styles.infoTitle}>Help us plant more trees</Text>
                <Text style={styles.infoSub}>
                  Vacant plot, rooftop, society space — anything counts.
                </Text>
              </View>
            </View>

            <View style={styles.formCard}>
              <Text style={styles.fieldLabel}>Full name</Text>
              <TextInput
                style={styles.input}
                value={fullName}
                onChangeText={setFullName}
                placeholder="Enter your full name"
                placeholderTextColor="#9ca3af"
              />

              <Text style={styles.fieldLabel}>Mobile number</Text>
              <TextInput
                style={styles.input}
                value={mobile}
                onChangeText={setMobile}
                placeholder="10-digit"
                placeholderTextColor="#9ca3af"
                keyboardType="phone-pad"
                maxLength={10}
              />

              <Text style={styles.fieldLabel}>Address</Text>
              <TextInput
                style={styles.input}
                value={address}
                onChangeText={setAddress}
                placeholder="Full address"
                placeholderTextColor="#9ca3af"
              />

              <Text style={styles.fieldLabel}>Location / landmark</Text>
              <View style={styles.inputRow}>
                <Text style={styles.locationIcon}>📍</Text>
                <TextInput
                  style={[styles.input, styles.inputNoMargin, styles.inputFlex]}
                  value={landmark}
                  onChangeText={setLandmark}
                  placeholder="Near landmark"
                  placeholderTextColor="#9ca3af"
                />
              </View>

              <Text style={styles.fieldLabel}>Available area</Text>
              <TextInput
                style={styles.input}
                value={availableArea}
                onChangeText={setAvailableArea}
                placeholder="e.g. backyard, rooftop"
                placeholderTextColor="#9ca3af"
              />

              <Text style={styles.fieldLabel}>Approximate land size</Text>
              <TextInput
                style={styles.input}
                value={landSize}
                onChangeText={setLandSize}
                placeholder="e.g. 1200 sq.ft"
                placeholderTextColor="#9ca3af"
              />

              <Pressable
                style={styles.submitBtnWrap}
                onPress={handleSubmit}
                disabled={submitting}>
                <LinearGradient
                  colors={['#0c4820', '#2b964f']}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={styles.submitBtn}>
                  {submitting ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.submitBtnText}>✈  Submit inquiry</Text>
                  )}
                </LinearGradient>
              </Pressable>
              {errorMsg ? (
                <Text style={styles.errorText}>{errorMsg}</Text>
              ) : null}
            </View>

            {offersSection}
          </ScrollView>
        </KeyboardAvoidingView>
      ) : (
        <ScrollView
          contentContainerStyle={[
            styles.successContainer,
            { paddingBottom: getBottomInset(32) },
          ]}
          showsVerticalScrollIndicator={false}>
          <View style={styles.successCard}>
            <View style={styles.successIconCircle}>
              <Text style={styles.successCheck}>✓</Text>
            </View>
            <Text style={styles.successTitle}>Inquiry submitted</Text>
            <Text style={styles.successSub}>
              Our green officer will contact you within 48 hours.
            </Text>
          </View>
          {offersSection}
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
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e9',
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
  },
  infoIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#0c4820',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  infoIcon: {
    fontSize: 22,
  },
  infoTextWrap: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0a3617',
    marginBottom: 4,
  },
  infoSub: {
    fontSize: 12,
    color: '#6b7280',
    lineHeight: 17,
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
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0faf4',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#dce8df',
    paddingHorizontal: 14,
    marginBottom: 14,
  },
  inputNoMargin: {
    marginBottom: 0,
    borderWidth: 0,
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
  },
  inputFlex: {
    flex: 1,
  },
  locationIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  submitBtnWrap: {
    borderRadius: 28,
    overflow: 'hidden',
    marginTop: 8,
  },
  submitBtn: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 13,
    marginTop: 10,
    textAlign: 'center',
  },
  myOffersSection: {
    marginTop: 24,
  },
  myOffersTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0a3617',
    marginBottom: 12,
  },
  myOffersEmpty: {
    fontSize: 13,
    color: '#6b7280',
  },
  offerRow: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  offerAddress: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0a3617',
  },
  offerMeta: {
    fontSize: 12,
    color: '#374151',
    marginTop: 4,
  },
  offerDate: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  successContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  successCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  successIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#d1fadf',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  successCheck: {
    fontSize: 32,
    fontWeight: '800',
    color: '#039855',
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0a3617',
    marginBottom: 10,
  },
  successSub: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 21,
  },
});
