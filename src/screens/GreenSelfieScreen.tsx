import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import AppIcon, { IconName } from '../components/AppIcon';
import { getBottomInset, getTopInset } from '../utils/layout';
import { api } from '../utils/api';

type Props = {
  onBack: () => void;
};

const CATEGORIES = [
  'Eco Hero',
  'Green Citizen',
  'Mission 2047',
  'Paryavaran Mitra',
];

export default function GreenSelfieScreen({ onBack }: Props) {
  const [activeCategory, setActiveCategory] = useState('Eco Hero');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [selfies, setSelfies] = useState<any[]>([]);

  const fetchSelfies = async () => {
    try {
      const data = await api.get<any[]>('/green-selfies');
      setSelfies(data);
    } catch (err) {
      console.error('Error fetching green selfies:', err);
    }
  };

  useEffect(() => {
    fetchSelfies();
  }, []);

  const handleTakeSelfie = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      await api.post('/green-selfies', {
        imgUrl: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&q=80&w=400',
        category: activeCategory,
        location: 'Indore, Madhya Pradesh',
      });
      fetchSelfies();
      Alert.alert('Success', 'Green Selfie uploaded successfully!');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to upload selfie.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: getTopInset(10) }]}>
        <Pressable style={styles.headerBtn} onPress={onBack}>
          <Text style={styles.backIcon}>←</Text>
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Create My Green Selfie</Text>
          <Text style={styles.headerSubtitle}>
            Capture your Mission 2047 moment
          </Text>
        </View>
        <Pressable style={styles.headerBtn}>
          <AppIcon name="bell-outline" size={20} color="#0a3617" />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: getBottomInset(32) },
        ]}
        showsVerticalScrollIndicator={false}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryRow}>
          {CATEGORIES.map(category => {
            const isActive = activeCategory === category;
            return (
              <Pressable
                key={category}
                style={[
                  styles.categoryPill,
                  isActive && styles.categoryPillActive,
                ]}
                onPress={() => setActiveCategory(category)}>
                <Text
                  style={[
                    styles.categoryText,
                    isActive && styles.categoryTextActive,
                  ]}>
                  {category}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.cameraFrame}>
          <View style={styles.cameraView}>
            <Text style={styles.cameraPlaceholder}>
              Camera unavailable. Allow camera access to take a selfie.
            </Text>

            <View style={styles.overlayCard}>
              <Text style={styles.overlayTag}>
                IN {activeCategory.toUpperCase()}
              </Text>
              <Text style={styles.overlayName}>Rahul Sharma</Text>
              <Text style={styles.overlaySubtitle}>
                Paryavaran Prahri · Mission 2047
              </Text>
              <View style={styles.statsRow}>
                {(
                  [
                    { icon: 'car-side' as IconName, value: '2' },
                    { icon: 'tree' as IconName, value: '24' },
                    { icon: 'cloud-outline' as IconName, value: '312kg' },
                  ] as const
                ).map(stat => (
                  <View key={stat.icon} style={styles.statItem}>
                    <AppIcon name={stat.icon} size={16} color="#fff" />
                    <Text style={styles.statValue}>{stat.value}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </View>

        <Pressable
          style={[styles.takeSelfieBtnWrap, loading && { opacity: 0.7 }]}
          onPress={handleTakeSelfie}
          disabled={loading}
        >
          <LinearGradient
            colors={['#7dd3a0', '#44b969']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.takeSelfieBtn}>
            {loading ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.takeSelfieBtnText}>📷  Take Selfie</Text>
            )}
          </LinearGradient>
        </Pressable>

        {errorMsg ? (
          <Text style={{ color: '#d32f2f', fontSize: 13, marginTop: 8, textAlign: 'center' }}>
            {errorMsg}
          </Text>
        ) : null}

        {/* Gallery / Feed Section */}
        {selfies.length > 0 ? (
          <View style={{ marginTop: 24 }}>
            <Text style={{ fontSize: 18, fontWeight: '800', color: '#0a3617', marginBottom: 12 }}>
              Recent Green Selfies
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
              {selfies.map((selfie: any) => (
                <View key={selfie._id || selfie.id} style={{ width: '47%', backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', padding: 12, borderWidth: 1, borderColor: '#e5e7eb' }}>
                  <Text style={{ fontSize: 11, fontWeight: '800', color: '#126e35', textTransform: 'uppercase', marginBottom: 2 }}>
                    {selfie.category}
                  </Text>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: '#4b5563', marginBottom: 4 }}>
                    📍 {selfie.location}
                  </Text>
                  <Text style={{ fontSize: 10, color: '#9ca3af' }}>
                    {selfie.createdAt ? new Date(selfie.createdAt).toLocaleDateString() : 'Just now'}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}
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
  categoryRow: {
    gap: 10,
    paddingBottom: 16,
  },
  categoryPill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#dce8df',
  },
  categoryPillActive: {
    backgroundColor: '#2b964f',
    borderColor: '#2b964f',
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0a3617',
  },
  categoryTextActive: {
    color: '#fff',
  },
  cameraFrame: {
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#44b969',
    overflow: 'hidden',
    marginBottom: 20,
  },
  cameraView: {
    backgroundColor: '#111827',
    minHeight: 420,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  cameraPlaceholder: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 32,
    lineHeight: 22,
  },
  overlayCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(12, 72, 32, 0.88)',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 16,
  },
  overlayTag: {
    fontSize: 10,
    fontWeight: '700',
    color: '#7dd3a0',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  overlayName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#d4f5e0',
    marginBottom: 2,
  },
  overlaySubtitle: {
    fontSize: 12,
    color: '#9ed4b0',
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 20,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statIcon: {
    fontSize: 14,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#d4f5e0',
  },
  takeSelfieBtnWrap: {
    borderRadius: 28,
    overflow: 'hidden',
  },
  takeSelfieBtn: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  takeSelfieBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
});
