import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  PermissionsAndroid,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import LinearGradient from 'react-native-linear-gradient';
import AppIcon from '../components/AppIcon';
import { getBottomInset, getTopInset } from '../utils/layout';
import {
  ApiError,
  greenSelfiesService,
  uploadsService,
  type GreenSelfieItem,
} from '../api';

type Props = {
  onBack: () => void;
};

const CATEGORIES = [
  'Eco Hero',
  'Green Citizen',
  'Mission 2047',
  'Paryavaran Mitra',
];

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

async function ensureCameraPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;
  const granted = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.CAMERA,
    {
      title: 'Camera permission',
      message: 'Allow camera to capture your Green Selfie',
      buttonPositive: 'Allow',
      buttonNegative: 'Deny',
    },
  );
  return granted === PermissionsAndroid.RESULTS.GRANTED;
}

export default function GreenSelfieScreen({ onBack }: Props) {
  const [activeCategory, setActiveCategory] = useState('Eco Hero');
  const [submitting, setSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [selfies, setSelfies] = useState<GreenSelfieItem[]>([]);
  const [loadingList, setLoadingList] = useState(true);

  const loadSelfies = useCallback(async () => {
    try {
      const list = await greenSelfiesService.list();
      setSelfies(Array.isArray(list) ? list : []);
    } catch {
      setSelfies([]);
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    void loadSelfies();
  }, [loadSelfies]);

  const uploadAndSave = async (uri: string, type?: string, name?: string) => {
    setSubmitting(true);
    setStatusMsg('');
    try {
      let imageUrl = uri;
      try {
        const uploaded = await uploadsService.upload(
          {
            uri,
            name: name || `green-selfie-${Date.now()}.jpg`,
            type: type || 'image/jpeg',
          },
          'general',
        );
        if (uploaded?.url) imageUrl = uploaded.url;
      } catch {
        throw new ApiError(0, 'Image upload failed. Check network / S3 config.');
      }

      await greenSelfiesService.create({
        category: activeCategory,
        imageUrl,
      });
      setStatusMsg('Green selfie saved successfully.');
      await loadSelfies();
    } catch (error) {
      setStatusMsg(
        error instanceof ApiError
          ? error.message
          : 'Failed to save green selfie',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const pickFromCamera = async () => {
    if (submitting) return;
    const ok = await ensureCameraPermission();
    if (!ok) {
      Alert.alert('Permission needed', 'Camera permission is required.');
      return;
    }
    const result = await launchCamera({
      mediaType: 'photo',
      cameraType: 'front',
      quality: 0.8,
      saveToPhotos: false,
    });
    if (result.didCancel || !result.assets?.[0]?.uri) return;
    const asset = result.assets[0];
    setPreviewUri(asset.uri);
    await uploadAndSave(asset.uri!, asset.type, asset.fileName);
  };

  const pickFromGallery = async () => {
    if (submitting) return;
    const result = await launchImageLibrary({
      mediaType: 'photo',
      quality: 0.8,
      selectionLimit: 1,
    });
    if (result.didCancel || !result.assets?.[0]?.uri) return;
    const asset = result.assets[0];
    setPreviewUri(asset.uri);
    await uploadAndSave(asset.uri!, asset.type, asset.fileName);
  };

  const handleTakeSelfie = () => {
    Alert.alert('Green Selfie', 'Choose image source', [
      { text: 'Camera', onPress: () => void pickFromCamera() },
      { text: 'Gallery', onPress: () => void pickFromGallery() },
      { text: 'Cancel', style: 'cancel' },
    ]);
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
        <View style={styles.headerBtn} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: getBottomInset(40) },
        ]}
        showsVerticalScrollIndicator={false}>
        <View style={styles.previewCard}>
          {previewUri ? (
            <Image
              source={{ uri: previewUri }}
              style={styles.previewImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.previewPlaceholder}>
              <AppIcon name="camera-outline" size={42} color="#6b7280" />
              <Text style={styles.previewHint}>
                Camera or gallery se photo lo
              </Text>
            </View>
          )}
        </View>

        <Text style={styles.sectionLabel}>Category</Text>
        <View style={styles.categoryRow}>
          {CATEGORIES.map(cat => {
            const active = cat === activeCategory;
            return (
              <Pressable
                key={cat}
                onPress={() => setActiveCategory(cat)}
                style={[
                  styles.categoryChip,
                  active && styles.categoryChipActive,
                ]}>
                <Text
                  style={[
                    styles.categoryText,
                    active && styles.categoryTextActive,
                  ]}>
                  {cat}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable
          onPress={handleTakeSelfie}
          disabled={submitting}
          style={styles.ctaOuter}>
          <LinearGradient
            colors={['#136e35', '#55c970']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.ctaInner}>
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <AppIcon name="camera" size={20} color="#fff" />
                <Text style={styles.ctaText}>Take / Upload Selfie</Text>
              </>
            )}
          </LinearGradient>
        </Pressable>

        {statusMsg ? (
          <Text style={styles.statusMsg}>{statusMsg}</Text>
        ) : null}

        <Text style={[styles.sectionLabel, styles.historyLabel]}>
          My selfies
        </Text>
        {loadingList ? (
          <ActivityIndicator color="#136e35" style={{ marginTop: 8 }} />
        ) : selfies.length === 0 ? (
          <Text style={styles.emptyHistory}>No selfies yet.</Text>
        ) : (
          selfies.map(item => (
            <View key={item._id} style={styles.historyRow}>
              {item.imageUrl ? (
                <Image
                  source={{ uri: item.imageUrl }}
                  style={styles.historyThumb}
                />
              ) : (
                <View style={[styles.historyThumb, styles.historyThumbEmpty]}>
                  <AppIcon name="camera-outline" size={18} color="#6b7280" />
                </View>
              )}
              <View style={styles.historyInfo}>
                <Text style={styles.historyCategory}>{item.category}</Text>
                <Text style={styles.historyDate}>
                  {formatDate(item.createdAt)}
                </Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f4f9f4' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 12,
    backgroundColor: '#fff',
  },
  headerBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: { fontSize: 22, color: '#0a3617' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '800', color: '#0a3617' },
  headerSubtitle: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  scroll: { padding: 20 },
  previewCard: {
    height: 360,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#e8eee9',
    marginBottom: 20,
  },
  previewImage: { width: '100%', height: '100%' },
  previewPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  previewHint: { color: '#6b7280', fontSize: 13 },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 10,
  },
  historyLabel: { marginTop: 28 },
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e8e0',
  },
  categoryChipActive: {
    backgroundColor: '#e8f7ee',
    borderColor: '#136e35',
  },
  categoryText: { fontSize: 13, color: '#6b7280', fontWeight: '600' },
  categoryTextActive: { color: '#136e35' },
  ctaOuter: {
    marginTop: 24,
    borderRadius: 28,
    overflow: 'hidden',
  },
  ctaInner: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  ctaText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  statusMsg: {
    marginTop: 14,
    textAlign: 'center',
    color: '#0f766e',
    fontSize: 13,
    lineHeight: 18,
  },
  emptyHistory: { color: '#6b7280', fontSize: 13 },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 10,
    marginBottom: 10,
    gap: 12,
  },
  historyThumb: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#e8eee9',
  },
  historyThumbEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyInfo: { flex: 1 },
  historyCategory: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0a3617',
  },
  historyDate: { fontSize: 12, color: '#6b7280', marginTop: 4 },
});
