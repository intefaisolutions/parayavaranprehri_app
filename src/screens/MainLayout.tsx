import React, { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, BackHandler, ActivityIndicator, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DashboardScreen from './DashboardScreen';
import VehiclesScreen from './VehiclesScreen';
import ProfileScreen from './ProfileScreen';
import RanksScreen from './RanksScreen';
import MapScreen from './MapScreen';
import JourneyAchievementsScreen from './JourneyAchievementsScreen';
import PersonIdentityScreen from './PersonIdentityScreen';
import RashiVanScreen from './RashiVanScreen';
import NewsScreen from './NewsScreen';
import SupportScreen from './SupportScreen';
import MitraScreen from './MitraScreen';
import MitraDashboardScreen from './MitraDashboardScreen';
import MitraPendingScreen from './MitraPendingScreen';
import OfferLandScreen from './OfferLandScreen';
import TreeRequestScreen from './TreeRequestScreen';
import AboutInitiativeScreen from './AboutInitiativeScreen';
import AdminPreviewScreen from './AdminPreviewScreen';
import VehicleDetailScreen from './VehicleDetailScreen';
import NotificationsScreen from './NotificationsScreen';
import UserCertificatesScreen from './UserCertificatesScreen';
import BottomNav from '../components/BottomNav';
import {
  Vehicle,
} from '../data/vehiclesData';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CommonActions, useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';
import {
  ApiError,
  authService,
  clearSession,
  getRefreshToken,
  usersService,
  vehiclesService,
} from '../api';
import {
  canFetchVehicleTrees,
  mapApiVehicleToUi,
  mapInsuranceListToUi,
  statsFromVehicleTrees,
} from '../api/mappers';
import { resolveMitraAccess, type MitraAccess } from '../utils/resolveIsMitra';

type Tab = 'home' | 'vehicles' | 'map' | 'ranks' | 'profile';

type OverlayScreen =
  | 'journey'
  | 'identity'
  | 'rashiVan'
  | 'news'
  | 'support'
  | 'mitra'
  | 'mitraDashboard'
  | 'mitraPending'
  | 'offerLand'
  | 'treeRequest'
  | 'aboutInitiative'
  | 'adminPreview'
  | 'vehicleDetail'
  | 'userCertificates'
  | 'notifications';

export default function MainLayout() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [overlay, setOverlay] = useState<OverlayScreen | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [loadingVehicles, setLoadingVehicles] = useState(true);
  const [vehiclesError, setVehiclesError] = useState('');
  const [isMitra, setIsMitra] = useState(false);
  const [mitraAccess, setMitraAccess] = useState<MitraAccess>('none');
  const [mitraReady, setMitraReady] = useState(false);
  const [checkingMitra, setCheckingMitra] = useState(false);

  const insets = useSafeAreaInsets();

  const refreshMitraStatus = useCallback(async () => {
    try {
      const access = await resolveMitraAccess();
      setMitraAccess(access);
      setIsMitra(access === 'approved');
    } catch {
      setMitraAccess('none');
      setIsMitra(false);
    } finally {
      setMitraReady(true);
    }
  }, []);

  useEffect(() => {
    void refreshMitraStatus();
  }, [refreshMitraStatus]);

  const loadVehicles = useCallback(async () => {
    setLoadingVehicles(true);
    setVehiclesError('');
    try {
      const [insuranceRaw, list] = await Promise.all([
        usersService.getMyVehicles().catch(() => []),
        vehiclesService.list().catch(() => []),
      ]);
      const insuranceVehicles = mapInsuranceListToUi(insuranceRaw);
      const appVehicles = (Array.isArray(list) ? list : []).map(v =>
        mapApiVehicleToUi(v),
      );

      // Prefer app-registered vehicles (real Mongo ids) over insurance stubs.
      const byPlate = new Map<string, Vehicle>();
      [...insuranceVehicles, ...appVehicles].forEach(v => {
        const key = (v.plate || v.id).toUpperCase();
        const existing = byPlate.get(key);
        if (!existing || canFetchVehicleTrees(v.id)) {
          byPlate.set(key, v);
        }
      });
      const merged = Array.from(byPlate.values());
      setVehicles(merged);
      setLoadingVehicles(false);

      const withStats = await Promise.all(
        merged.map(async vehicle => {
          if (!canFetchVehicleTrees(vehicle.id)) {
            return vehicle;
          }
          try {
            const treesRes = await vehiclesService.getTrees(vehicle.id);
            const stats = statsFromVehicleTrees(treesRes);
            return {
              ...vehicle,
              trees: stats.trees,
              co2: stats.co2,
              survival: stats.survival,
            };
          } catch {
            return vehicle;
          }
        }),
      );
      setVehicles(withStats);
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : 'Failed to load vehicles';
      setVehiclesError(message);
      setVehicles([]);
    } finally {
      setLoadingVehicles(false);
    }
  }, []);

  useEffect(() => {
    loadVehicles();
  }, [loadVehicles]);

  useEffect(() => {
    const onBackPress = () => {
      if (overlay) {
        closeOverlay();
        return true;
      }
      if (activeTab !== 'home') {
        setActiveTab('home');
        return true;
      }
      return false;
    };

    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      onBackPress,
    );
    return () => subscription.remove();
  }, [overlay, activeTab]);

  const closeOverlay = () => {
    setOverlay(null);
    setSelectedVehicle(null);
  };
  const openVehicleDetail = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setOverlay('vehicleDetail');
  };

  const handleLogout = () => {
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      }),
    );
    void (async () => {
      try {
        const refreshToken = await getRefreshToken();
        await clearSession();
        if (refreshToken) {
          void authService.logout(refreshToken).catch(() => undefined);
        }
      } catch {
        await clearSession().catch(() => undefined);
      }
    })();
  };

  const openNotifications = () => setOverlay('notifications');

  const renderScreen = () => {
    if (!mitraReady && activeTab === 'home') {
      return (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#136e35" />
          <Text style={styles.loadingText}>Signing you in…</Text>
        </View>
      );
    }

    if (loadingVehicles && activeTab === 'vehicles') {
      return (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#136e35" />
          <Text style={styles.loadingText}>Loading vehicles…</Text>
        </View>
      );
    }

    switch (activeTab) {
      case 'home':
        return (
          <DashboardScreen
            vehicles={vehicles}
            mitraAccess={mitraAccess}
            onViewJourney={() => setOverlay('journey')}
            onMyIdentity={() => setOverlay('identity')}
            onRashiVan={() => setOverlay('rashiVan')}
            onNews={() => setOverlay('news')}
            onSupport={() => setOverlay('support')}
            onCertificates={() => setOverlay('userCertificates')}
            onMitra={() => setOverlay('mitra')}
            onOpenMitraDashboard={() => setOverlay('mitraDashboard')}
            onCheckMitraStatus={() => setOverlay('mitraPending')}
            onOfferLand={() => setOverlay('offerLand')}
            onTreeRequest={() => setOverlay('treeRequest')}
            onAboutInitiative={() => setOverlay('aboutInitiative')}
            onAdminPreview={() => setOverlay('adminPreview')}
            onOpenChatbot={() => navigation.navigate('Chatbot' as never)}
            onNotifications={openNotifications}
            onSeeAllVehicles={() => setActiveTab('vehicles')}
            onSeeAllRanks={() => setActiveTab('ranks')}
          />
        );
      case 'vehicles':
        return (
          <VehiclesScreen
            vehicles={vehicles}
            onViewDetails={openVehicleDetail}
            onNotifications={openNotifications}
          />
        );
      case 'map':
        return <MapScreen onNotifications={openNotifications} />;
      case 'ranks':
        return <RanksScreen onNotifications={openNotifications} />;
      case 'profile':
        return (
          <ProfileScreen
            vehicles={vehicles}
            onLogout={handleLogout}
            onMyVehicles={() => setActiveTab('vehicles')}
            onVehicleIdentity={() => setOverlay('identity')}
            onRashiVan={() => setOverlay('rashiVan')}
            onAdminPreview={() => setOverlay('adminPreview')}
            onNotifications={openNotifications}
            onCommunity={() => setActiveTab('ranks')}
          />
        );
      default:
        return (
          <DashboardScreen
            vehicles={vehicles}
            mitraAccess={mitraAccess}
            onViewJourney={() => setOverlay('journey')}
            onMyIdentity={() => setOverlay('identity')}
            onRashiVan={() => setOverlay('rashiVan')}
            onNews={() => setOverlay('news')}
            onSupport={() => setOverlay('support')}
            onCertificates={() => setOverlay('userCertificates')}
            onMitra={() => setOverlay('mitra')}
            onOpenMitraDashboard={() => setOverlay('mitraDashboard')}
            onCheckMitraStatus={() => setOverlay('mitraPending')}
            onOfferLand={() => setOverlay('offerLand')}
            onTreeRequest={() => setOverlay('treeRequest')}
            onAboutInitiative={() => setOverlay('aboutInitiative')}
            onAdminPreview={() => setOverlay('adminPreview')}
            onOpenChatbot={() => navigation.navigate('Chatbot' as never)}
            onNotifications={openNotifications}
            onSeeAllVehicles={() => setActiveTab('vehicles')}
            onSeeAllRanks={() => setActiveTab('ranks')}
          />
        );
    }
  };

  const renderOverlay = () => {
    switch (overlay) {
      case 'vehicleDetail':
        return selectedVehicle ? (
          <VehicleDetailScreen
            vehicle={selectedVehicle}
            onBack={closeOverlay}
            onNotifications={openNotifications}
            onDeleted={() => {
              closeOverlay();
              loadVehicles();
            }}
          />
        ) : null;
      case 'adminPreview':
        return (
          <AdminPreviewScreen
            onBack={closeOverlay}
            onNotifications={openNotifications}
          />
        );
      case 'notifications':
        return <NotificationsScreen onBack={closeOverlay} />;
      case 'aboutInitiative':
        return (
          <AboutInitiativeScreen
            onBack={closeOverlay}
            onNotifications={openNotifications}
            onViewJourney={() => setOverlay('journey')}
            onMeetLeaders={() => {
              closeOverlay();
              setActiveTab('home');
            }}
          />
        );
      case 'offerLand':
        return (
          <OfferLandScreen
            onBack={closeOverlay}
            onNotifications={openNotifications}
          />
        );
      case 'treeRequest':
        return (
          <TreeRequestScreen
            onBack={closeOverlay}
            onNotifications={openNotifications}
          />
        );
      case 'mitra':
        return (
          <MitraScreen
            onBack={closeOverlay}
            onNotifications={openNotifications}
            onRegistered={async () => {
              const access = await resolveMitraAccess();
              setMitraAccess(access);
              setIsMitra(access === 'approved');
              setActiveTab('home');
              closeOverlay();
            }}
          />
        );
      case 'mitraDashboard':
        return (
          <MitraDashboardScreen
            onBack={closeOverlay}
            onLogout={handleLogout}
            onNotifications={openNotifications}
          />
        );
      case 'mitraPending':
        return (
          <MitraPendingScreen
            onBack={closeOverlay}
            onLogout={handleLogout}
            checking={checkingMitra}
            onCheckAgain={async () => {
              setCheckingMitra(true);
              try {
                await refreshMitraStatus();
              } finally {
                setCheckingMitra(false);
              }
            }}
          />
        );
      case 'support':
        return (
          <SupportScreen
            onBack={closeOverlay}
            onNotifications={openNotifications}
            isMitra={isMitra}
          />
        );
      case 'userCertificates':
        return (
          <UserCertificatesScreen
            onBack={closeOverlay}
            onNotifications={openNotifications}
          />
        );
      case 'news':
        return (
          <NewsScreen
            onBack={closeOverlay}
            onNotifications={openNotifications}
          />
        );
      case 'rashiVan':
        return (
          <RashiVanScreen
            onBack={closeOverlay}
            onNotifications={openNotifications}
          />
        );
      case 'identity':
        return (
          <PersonIdentityScreen
            onBack={closeOverlay}
            onNotifications={openNotifications}
          />
        );
      case 'journey':
        return (
          <JourneyAchievementsScreen
            onBack={closeOverlay}
            onNotifications={openNotifications}
          />
        );
      default:
        return null;
    }
  };

  return (
    <View style={[styles.root, { paddingBottom: insets.bottom }]}>
      {vehiclesError && activeTab === 'home' ? (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>{vehiclesError}</Text>
        </View>
      ) : null}
      <View style={{ flex: 1, display: overlay ? 'none' : 'flex' }}>
        {renderScreen()}
        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      </View>
      {overlay ? (
        <View style={StyleSheet.absoluteFill}>
          {renderOverlay()}
        </View>
      ) : null}
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
    gap: 12,
  },
  loadingText: {
    color: '#6b7280',
    fontSize: 14,
  },
  banner: {
    backgroundColor: '#fef2f2',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  bannerText: {
    color: '#b91c1c',
    fontSize: 12,
    textAlign: 'center',
  },
});
