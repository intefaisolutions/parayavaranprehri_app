import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import AppIcon from '../components/AppIcon';
import { AddedVehicle } from '../data/vehiclesData';
import { getBottomInset, getTopInset } from '../utils/layout';
import {
  ApiError,
  API_BASE_URL,
  getStoredPhone,
  getStoredUser,
  partnersService,
  personsService,
  settingsService,
  unwrapList,
  vehiclesService,
  type Partner,
} from '../api';
import { mapApiVehicleToUi } from '../api/mappers';

type Props = {
  onBack: () => void;
  onRegisterVehicle: (vehicle: AddedVehicle) => void;
  onComplete: () => void;
  onNotifications?: () => void;
};

type InsuranceOption = {
  id: string;
  name: string;
  policy: string;
};

const TOTAL_STEPS = 5;
const GRADIENT = ['#0c4820', '#2b964f'];

const OTHER_OPTION: InsuranceOption = {
  id: 'other',
  name: 'Other / Not listed',
  policy: 'Will be verified by officer',
};

function partnerLooksLikeInsurer(p: Partner) {
  const name = `${p.partnerName || ''} ${p.partnerType || ''}`.toLowerCase();
  return name.includes('insurance') || name.includes('insurer');
}

export default function AddVehicleScreen({
  onBack,
  onRegisterVehicle,
  onComplete,
  onNotifications,
}: Props) {
  const [step, setStep] = useState(1);
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [vehicleName, setVehicleName] = useState('My Vehicle');
  const [fuelType, setFuelType] = useState('Petrol');
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [selectedInsurance, setSelectedInsurance] = useState('other');
  const [insuranceOptions, setInsuranceOptions] = useState<InsuranceOption[]>([
    OTHER_OPTION,
  ]);
  const [insuranceFreeText, setInsuranceFreeText] = useState(false);
  const [otherInsurerName, setOtherInsurerName] = useState('');
  const [loadingInsurers, setLoadingInsurers] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [registerError, setRegisterError] = useState('');
  const [ownerName, setOwnerName] = useState('Citizen');
  const [personId, setPersonId] = useState('—');
  const [phoneHint, setPhoneHint] = useState('');
  const [registeredVhId, setRegisteredVhId] = useState('');
  const [registeredVehicleId, setRegisteredVehicleId] = useState('');
  const [treeCount, setTreeCount] = useState(0);
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [certBusy, setCertBusy] = useState(false);
  const otpRef = useRef<TextInput>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const [user, phone] = await Promise.all([
        getStoredUser(),
        getStoredPhone(),
      ]);
      if (!mounted) return;
      if (user) {
        const full = `${user.firstName || ''} ${user.lastName || ''}`.trim();
        if (full) setOwnerName(full);
        if (user.id) setPersonId(user.id);
      }
      if (phone) {
        const digits = phone.replace(/\D/g, '');
        const last4 = digits.slice(-4);
        setPhoneHint(
          digits.length >= 4
            ? `+91 ••••••${last4}`
            : `+91 ${phone}`,
        );
      }
      try {
        const me = await personsService.getMe();
        if (!mounted || !me) return;
        if (me.name) setOwnerName(me.name);
        if (me.personId) setPersonId(me.personId);
        if (typeof me.treesAssigned === 'number') {
          setTreeCount(me.treesAssigned);
        }
      } catch {
        // optional person profile
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoadingInsurers(true);
      try {
        // PartnerType has no Insurance/Insurer — load Active partners and filter.
        const res = await partnersService.list({
          page: 1,
          limit: 100,
          status: 'Active',
        });
        if (!mounted) return;
        const partners = unwrapList(res).filter(partnerLooksLikeInsurer);
        let options: InsuranceOption[] = partners.map(p => ({
          id: p._id,
          name: p.partnerName,
          policy: p.location || 'Partner insurer',
        }));

        if (options.length === 0) {
          try {
            const settingsRes = await settingsService.list({
              page: 1,
              limit: 50,
            });
            const settings = unwrapList(settingsRes as any) as Array<
              Record<string, unknown>
            >;
            options = settings
              .filter(s => {
                const blob = `${s.key || ''} ${s.name || ''} ${s.category || ''} ${s.value || ''}`.toLowerCase();
                return blob.includes('insurance') || blob.includes('insurer');
              })
              .map((s, index) => ({
                id: String(s._id || s.key || `setting-${index}`),
                name: String(s.name || s.key || s.value || 'Insurer'),
                policy: 'From settings',
              }));
          } catch {
            // keep empty → Other only
          }
        }

        options = [...options, OTHER_OPTION];
        setInsuranceOptions(options);
        setInsuranceFreeText(false);
        setSelectedInsurance(options[0]?.id || 'other');
      } catch {
        if (!mounted) return;
        setInsuranceOptions([OTHER_OPTION]);
        setInsuranceFreeText(true);
        setSelectedInsurance('other');
      } finally {
        if (mounted) setLoadingInsurers(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const insuranceName = useMemo(() => {
    if (selectedInsurance === 'other') {
      return otherInsurerName.trim() || OTHER_OPTION.name;
    }
    return (
      insuranceOptions.find(o => o.id === selectedInsurance)?.name ||
      'Insurance'
    );
  }, [selectedInsurance, insuranceOptions, otherInsurerName]);

  const plateDisplay = vehicleNumber.trim().toUpperCase() || '—';
  const todayLabel = useMemo(
    () =>
      new Date().toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
    [],
  );

  const certMessage = useMemo(
    () =>
      [
        'Paryavaran Prahri — Mission 2047',
        'Digital Environmental Contribution Certificate',
        '',
        `Citizen: ${ownerName}`,
        `Person ID: ${personId}`,
        `Vehicle: ${vehicleName} · ${plateDisplay}`,
        `Insurance: ${insuranceName}`,
        `Trees: ${treeCount || 'pending assignment'}`,
        `Date: ${todayLabel}`,
      ].join('\n'),
    [
      ownerName,
      personId,
      vehicleName,
      plateDisplay,
      insuranceName,
      treeCount,
      todayLabel,
    ],
  );

  const goNext = () => setStep(prev => Math.min(prev + 1, TOTAL_STEPS));
  const goBack = () => {
    if (step === 1) {
      onBack();
      return;
    }
    // Skip OTP step when going back from insurance
    if (step === 3) {
      setStep(1);
      return;
    }
    setStep(prev => prev - 1);
  };

  const handleFetchVerify = async () => {
    const plate = vehicleNumber.trim();
    if (plate.length < 6) {
      Alert.alert('Invalid plate', 'Enter a valid vehicle number (min 6 characters).');
      return;
    }
    const normalized = plate.toUpperCase();
    setVehicleNumber(normalized);
    if (!vehicleName || vehicleName === 'My Vehicle') {
      setVehicleName(normalized);
    }
    setOtp('');
    setOtpError('');
    setOtpSending(true);
    try {
      const res = await vehiclesService.requestOtp(normalized);
      if (res.maskedMobile) {
        setPhoneHint(res.maskedMobile);
      }
      setStep(2);
    } catch (error) {
      Alert.alert(
        'OTP failed',
        error instanceof ApiError
          ? error.message
          : 'Could not send OTP. Please try again.',
      );
    } finally {
      setOtpSending(false);
    }
  };

  const handleVerifyOtp = async () => {
    setOtpError('');
    if (otp.length !== 4) {
      setOtpError('Enter the 4-digit OTP sent to your registered mobile.');
      return;
    }
    const plate = vehicleNumber.trim().toUpperCase();
    setOtpVerifying(true);
    try {
      await vehiclesService.verifyOtp(plate, otp);
      goNext();
    } catch (error) {
      setOtpError(
        error instanceof ApiError
          ? error.message
          : 'Invalid or expired OTP. Please try again.',
      );
    } finally {
      setOtpVerifying(false);
    }
  };

  const handleRegisterVehicle = async () => {
    if (registering) return;

    const plate = vehicleNumber.trim().toUpperCase();
    if (plate.length < 6) {
      setRegisterError('Enter a valid vehicle number first.');
      return;
    }

    const payload = {
      plate,
      name: vehicleName.trim() || plate,
      fuel: fuelType,
      insuranceId: selectedInsurance,
    };

    setRegistering(true);
    setRegisterError('');
    try {
      const created = await vehiclesService.create(payload);
      const mapped = mapApiVehicleToUi(created);
      setRegisteredVhId(mapped.vhId);
      setRegisteredVehicleId(mapped.id);
      onRegisterVehicle({
        id: mapped.id,
        plate: mapped.plate,
        name: mapped.name,
        vhId: mapped.vhId,
        fuel: mapped.fuel,
      });
      goNext();
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : 'Failed to register vehicle';
      setRegisterError(message);
    } finally {
      setRegistering(false);
    }
  };

  const openCertificateShare = async (mode: 'share' | 'download') => {
    if (!registeredVehicleId) {
      Alert.alert(
        'Certificate',
        'Vehicle is not registered yet. Complete registration first.',
      );
      return;
    }
    if (certBusy) return;
    setCertBusy(true);
    try {
      const cert = await vehiclesService.getCertificate(registeredVehicleId);
      const downloadUrl = `${API_BASE_URL}${cert.downloadPath}`;
      if (mode === 'download') {
        const canOpen = await Linking.canOpenURL(downloadUrl);
        if (canOpen) {
          await Linking.openURL(downloadUrl);
          return;
        }
      }
      await Share.share({
        title: cert.fileName,
        message:
          mode === 'download'
            ? `${cert.text}\n\nPDF: ${downloadUrl}`
            : `${cert.text}\n\nPDF download: ${downloadUrl}`,
        url: Platform.OS === 'ios' ? downloadUrl : undefined,
      });
    } catch (error) {
      try {
        await Share.share({
          message: certMessage,
          title: 'Vehicle Certificate',
        });
      } catch {
        Alert.alert(
          'Certificate failed',
          error instanceof ApiError
            ? error.message
            : 'Could not generate certificate PDF.',
        );
      }
    } finally {
      setCertBusy(false);
    }
  };

  const handleShareCert = async () => {
    await openCertificateShare('share');
  };

  const handleDownloadCert = async () => {
    await openCertificateShare('download');
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <>
            <Text style={styles.cardTitle}>Enter vehicle number</Text>
            <Text style={styles.cardSubtitle}>
              Must be registered to your mobile number.
            </Text>
            <TextInput
              style={styles.vehicleInput}
              value={vehicleNumber}
              onChangeText={setVehicleNumber}
              placeholder="MP09 KK 8810"
              placeholderTextColor="#9ca3af"
              autoCapitalize="characters"
            />
            <TextInput
              style={[styles.vehicleInput, { marginTop: 10 }]}
              value={vehicleName}
              onChangeText={setVehicleName}
              placeholder="Vehicle name (e.g. Thar, Nexon)"
              placeholderTextColor="#9ca3af"
            />
            <View style={styles.fuelRow}>
              {['Petrol', 'Diesel', 'CNG', 'Electric'].map(f => (
                <Pressable
                  key={f}
                  style={[
                    styles.fuelChip,
                    fuelType === f && styles.fuelChipActive,
                  ]}
                  onPress={() => setFuelType(f)}>
                  <Text
                    style={[
                      styles.fuelChipText,
                      fuelType === f && styles.fuelChipTextActive,
                    ]}>
                    {f}
                  </Text>
                </Pressable>
              ))}
            </View>
            <GradientButton
              label={otpSending ? 'Sending OTP…' : 'Fetch & verify'}
              onPress={() => void handleFetchVerify()}
              disabled={otpSending}
            />
          </>
        );

      case 2:
        return (
          <>
            <Text style={styles.cardTitle}>Confirm with OTP</Text>
            <Text style={styles.cardSubtitle}>
              {phoneHint
                ? `OTP sent to ${phoneHint}. Enter the 4-digit code.`
                : 'Enter the 4-digit OTP sent to your registered mobile.'}
            </Text>
            <Pressable style={styles.otpRow} onPress={() => otpRef.current?.focus()}>
              {[0, 1, 2, 3].map(index => (
                <View
                  key={index}
                  style={[
                    styles.otpBox,
                    otp.length === index && styles.otpBoxActive,
                  ]}>
                  <Text style={styles.otpDigit}>{otp[index] ?? ''}</Text>
                </View>
              ))}
              <TextInput
                ref={otpRef}
                value={otp}
                onChangeText={v => {
                  setOtpError('');
                  setOtp(v.replace(/\D/g, '').slice(0, 4));
                }}
                keyboardType="number-pad"
                maxLength={4}
                style={styles.otpHidden}
                autoFocus
                caretHidden
              />
            </Pressable>
            {otpError ? <Text style={styles.registerError}>{otpError}</Text> : null}
            <GradientButton
              label={otpVerifying ? 'Verifying…' : 'Verify'}
              onPress={() => void handleVerifyOtp()}
              disabled={otp.length !== 4 || otpVerifying}
            />
          </>
        );

      case 3:
        return (
          <>
            <Text style={styles.cardTitle}>Map insurance</Text>
            <Text style={styles.cardSubtitle}>
              Select your insurer from partners, or choose Other.
            </Text>
            {loadingInsurers ? (
              <ActivityIndicator color="#136e35" style={{ marginVertical: 16 }} />
            ) : (
              insuranceOptions.map(option => {
                const selected = selectedInsurance === option.id;
                return (
                  <Pressable
                    key={option.id}
                    style={[
                      styles.insuranceRow,
                      selected && styles.insuranceRowActive,
                    ]}
                    onPress={() => setSelectedInsurance(option.id)}>
                    <View style={[styles.radio, selected && styles.radioActive]}>
                      {selected ? <View style={styles.radioInner} /> : null}
                    </View>
                    <View style={styles.insuranceInfo}>
                      <Text style={styles.insuranceName}>{option.name}</Text>
                      <Text style={styles.insurancePolicy}>{option.policy}</Text>
                    </View>
                    <Text style={styles.shieldIcon}>🛡️</Text>
                  </Pressable>
                );
              })
            )}
            {(insuranceFreeText || selectedInsurance === 'other') && (
              <TextInput
                style={[styles.vehicleInput, { marginTop: 8 }]}
                value={otherInsurerName}
                onChangeText={setOtherInsurerName}
                placeholder="Insurer name (optional)"
                placeholderTextColor="#9ca3af"
              />
            )}
            <GradientButton label="Continue" onPress={goNext} />
          </>
        );

      case 4:
        return (
          <>
            <Text style={styles.cardTitle}>Confirm vehicle</Text>
            <View style={styles.confirmBox}>
              <View style={styles.confirmHeader}>
                <View style={styles.carIconWrap}>
                  <AppIcon name="car-side" size={36} color="#126e35" />
                </View>
                <View style={styles.confirmHeaderText}>
                  <Text style={styles.confirmVehicleName}>{vehicleName}</Text>
                  <Text style={styles.confirmVehicleMeta}>
                    {plateDisplay} · {ownerName}
                  </Text>
                </View>
              </View>
              <View style={styles.detailGrid}>
                {[
                  { icon: '🛡️', label: 'Insurance', value: insuranceName },
                  { icon: '⛽', label: 'Fuel', value: fuelType },
                  { icon: '🌿', label: 'Owner', value: ownerName },
                  { icon: '📅', label: 'Plate', value: plateDisplay },
                ].map(item => (
                  <View key={item.label} style={styles.detailCell}>
                    <Text style={styles.detailIcon}>{item.icon}</Text>
                    <Text style={styles.detailLabel}>{item.label}</Text>
                    <Text style={styles.detailValue}>{item.value}</Text>
                  </View>
                ))}
              </View>
            </View>
            <View style={styles.verifyBanner}>
              <Text style={styles.verifyBannerText}>
                ✓ Ready to register · Trees will be auto-assigned by your district
                green officer.
              </Text>
            </View>
            {registerError ? (
              <Text style={styles.registerError}>{registerError}</Text>
            ) : null}
            <GradientButton
              label="Register vehicle"
              onPress={handleRegisterVehicle}
              disabled={registering}
              loading={registering}
            />
          </>
        );

      case 5:
        return (
          <>
            <Text style={styles.successTitle}>🎉 Vehicle registered!</Text>
            <LinearGradient
              colors={['#f27e20', '#2bb373']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.certBorder}>
              <View style={styles.certCard}>
                <View style={styles.certBadge}>
                  <Text style={styles.certBadgeText}>
                    🏅 MISSION 2047 · NET ZERO BHARAT
                  </Text>
                </View>
                <Text style={styles.certTitle}>
                  Digital Environmental{'\n'}Contribution Certificate
                </Text>
                <Text style={styles.certSub}>This is to certify that</Text>
                <Text style={styles.certName}>{ownerName}</Text>
                <Text style={styles.certId}>Person ID: {personId}</Text>
                <Text style={styles.certSub}>has successfully registered</Text>
                <Text style={styles.certVehicle}>
                  {vehicleName} · {plateDisplay}
                </Text>
                <Text style={styles.certMeta}>
                  {treeCount > 0
                    ? `${treeCount} tree(s) on record`
                    : 'Trees pending assignment'}{' '}
                  · {todayLabel}
                </Text>
                {registeredVhId ? (
                  <Text style={styles.certId}>Vehicle ID: {registeredVhId}</Text>
                ) : null}
                <Text style={styles.certFooter}>PARYAVARAN PRAHRI IN</Text>
              </View>
            </LinearGradient>

            <View style={styles.actionRow}>
              <Pressable
                style={styles.actionBtnGreen}
                onPress={() => void handleDownloadCert()}>
                <Text style={styles.actionBtnTextWhite}>⬇ Download</Text>
              </Pressable>
              <Pressable
                style={styles.actionBtnOrange}
                onPress={() => void handleShareCert()}>
                <Text style={styles.actionBtnTextWhite}>🖨 Print</Text>
              </Pressable>
              <Pressable
                style={styles.actionBtnOutline}
                onPress={() => void handleShareCert()}>
                <Text style={styles.actionBtnTextDark}>↗ Share</Text>
              </Pressable>
            </View>

            <Pressable style={styles.outlineBtn} onPress={onComplete}>
              <Text style={styles.outlineBtnText}>Go to My Vehicles</Text>
            </Pressable>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: getTopInset(10) }]}>
        <Pressable style={styles.headerBtn} onPress={goBack}>
          <Text style={styles.backIcon}>←</Text>
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Add New Vehicle</Text>
          <Text style={styles.headerSubtitle}>Owner-verified onboarding</Text>
        </View>
        <Pressable style={styles.headerBtn} onPress={onNotifications}>
          <Text style={styles.bellIcon}>🔔</Text>
        </Pressable>
      </View>

      <Stepper currentStep={step} totalSteps={TOTAL_STEPS} />

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
          <View style={styles.card}>{renderStepContent()}</View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function Stepper({
  currentStep,
  totalSteps,
}: {
  currentStep: number;
  totalSteps: number;
}) {
  return (
    <View style={styles.stepper}>
      {Array.from({ length: totalSteps }).map((_, index) => {
        const stepNum = index + 1;
        const completed = stepNum < currentStep;
        const active = stepNum === currentStep;

        return (
          <React.Fragment key={stepNum}>
            <View
              style={[
                styles.stepCircle,
                (completed || active) && styles.stepCircleActive,
              ]}>
              <Text
                style={[
                  styles.stepText,
                  (completed || active) && styles.stepTextActive,
                ]}>
                {completed ? '✓' : stepNum}
              </Text>
            </View>
            {stepNum < totalSteps ? (
              <View
                style={[
                  styles.stepLine,
                  stepNum < currentStep && styles.stepLineActive,
                ]}
              />
            ) : null}
          </React.Fragment>
        );
      })}
    </View>
  );
}

function GradientButton({
  label,
  onPress,
  disabled,
  loading,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[styles.btnWrap, disabled && styles.btnDisabled]}>
      <LinearGradient
        colors={disabled ? ['#a8c4b0', '#b8d4be'] : GRADIENT}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.gradientBtn}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.gradientBtnText}>{label}</Text>
        )}
      </LinearGradient>
    </Pressable>
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
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eef2ef',
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleActive: {
    backgroundColor: '#00a859',
  },
  stepText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#9ca3af',
  },
  stepTextActive: {
    color: '#fff',
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 4,
    maxWidth: 40,
  },
  stepLineActive: {
    backgroundColor: '#00a859',
  },
  scrollContent: {
    padding: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 28,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0a3617',
    marginBottom: 8,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 20,
  },
  vehicleInput: {
    backgroundColor: '#f0f7f2',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#dce8df',
    paddingHorizontal: 18,
    height: 56,
    fontSize: 18,
    fontWeight: '700',
    color: '#0a3617',
    marginBottom: 12,
    letterSpacing: 1,
  },
  fuelRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  fuelChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f7f2',
    borderWidth: 1,
    borderColor: '#dce8df',
  },
  fuelChipActive: {
    backgroundColor: '#126e35',
    borderColor: '#126e35',
  },
  fuelChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  fuelChipTextActive: {
    color: '#fff',
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    position: 'relative',
  },
  otpBox: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: '#f0f7f2',
    borderWidth: 1.5,
    borderColor: '#dce8df',
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpBoxActive: {
    borderColor: '#00a859',
  },
  otpDigit: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0a3617',
  },
  otpHidden: {
    ...StyleSheet.absoluteFill,
    opacity: 0,
  },
  insuranceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  insuranceRowActive: {
    borderColor: '#00a859',
    backgroundColor: '#f0faf4',
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  radioActive: {
    borderColor: '#00a859',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#00a859',
  },
  insuranceInfo: {
    flex: 1,
  },
  insuranceName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0a3617',
    marginBottom: 2,
  },
  insurancePolicy: {
    fontSize: 12,
    color: '#6b7280',
  },
  shieldIcon: {
    fontSize: 20,
    opacity: 0.7,
  },
  confirmBox: {
    backgroundColor: '#f0f7f2',
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
  },
  confirmHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  carIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  carIcon: {
    fontSize: 22,
  },
  confirmHeaderText: {
    flex: 1,
  },
  confirmVehicleName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0a3617',
    marginBottom: 2,
  },
  confirmVehicleMeta: {
    fontSize: 12,
    color: '#6b7280',
  },
  detailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  detailCell: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 12,
  },
  detailIcon: {
    fontSize: 14,
    marginBottom: 4,
  },
  detailLabel: {
    fontSize: 10,
    color: '#6b7280',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0a3617',
  },
  verifyBanner: {
    backgroundColor: '#e6f7ed',
    borderRadius: 14,
    padding: 12,
    marginBottom: 20,
  },
  verifyBannerText: {
    fontSize: 12,
    color: '#126e35',
    lineHeight: 18,
  },
  registerError: {
    color: '#d32f2f',
    fontSize: 13,
    marginBottom: 10,
    textAlign: 'center',
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0a3617',
    marginBottom: 16,
  },
  certBorder: {
    borderRadius: 22,
    padding: 2,
    marginBottom: 20,
  },
  certCard: {
    backgroundColor: '#fffef8',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
  },
  certBadge: {
    backgroundColor: '#e6f7ed',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    marginBottom: 14,
  },
  certBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#126e35',
    letterSpacing: 0.5,
  },
  certTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0c4820',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 14,
  },
  certSub: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  certName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0c4820',
    marginBottom: 4,
  },
  certId: {
    fontSize: 11,
    color: '#9ca3af',
    marginBottom: 12,
  },
  certVehicle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0a3617',
    textAlign: 'center',
    marginBottom: 4,
  },
  certMeta: {
    fontSize: 11,
    color: '#6b7280',
    marginBottom: 16,
  },
  certFooter: {
    fontSize: 10,
    fontWeight: '800',
    color: '#00a859',
    letterSpacing: 1,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  actionBtnGreen: {
    flex: 1,
    backgroundColor: '#00a859',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  actionBtnOrange: {
    flex: 1,
    backgroundColor: '#f27e20',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  actionBtnOutline: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  actionBtnTextWhite: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  actionBtnTextDark: {
    color: '#0a3617',
    fontSize: 12,
    fontWeight: '700',
  },
  outlineBtn: {
    borderWidth: 1.5,
    borderColor: '#dce8df',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  outlineBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0a3617',
  },
  btnWrap: {
    borderRadius: 28,
    overflow: 'hidden',
  },
  btnDisabled: {
    opacity: 0.7,
  },
  gradientBtn: {
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 28,
  },
  gradientBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
