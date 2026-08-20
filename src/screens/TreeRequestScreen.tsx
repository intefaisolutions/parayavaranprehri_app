import React, { useEffect, useState } from 'react';
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
import {
  ApiError,
  getStoredPhone,
  getStoredUser,
  rashiPlantRequestsService,
  usersService,
  treeMastersService,
  type TreeMasterApi,
} from '../api';
import RemoteImage from '../components/RemoteImage';

type Props = {
  onBack: () => void;
  onNotifications?: () => void;
};

export default function TreeRequestScreen({ onBack, onNotifications }: Props) {
  const [treeName, setTreeName] = useState('');
  const [remarks, setRemarks] = useState('');
  const [userName, setUserName] = useState('');
  const [mobile, setMobile] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [done, setDone] = useState(false);
  
  const [trees, setTrees] = useState<TreeMasterApi[]>([]);
  const [loadingTrees, setLoadingTrees] = useState(true);

  useEffect(() => {
    void (async () => {
      const [stored, phone, me, catalogRes] = await Promise.all([
        getStoredUser(),
        getStoredPhone(),
        usersService.getMe().catch(() => null),
        treeMastersService.catalog({ limit: 50 }).catch(() => null),
      ]);
      const first = String(me?.firstName || stored?.firstName || '');
      const last = String(me?.lastName || stored?.lastName || '');
      setUserName(`${first} ${last}`.trim());
      const raw = String(me?.phone || stored?.phone || phone || '').replace(
        /\D/g,
        '',
      );
      setMobile(raw.slice(-10));
      
      if (catalogRes && catalogRes.docs) {
        setTrees(catalogRes.docs);
      }
      setLoadingTrees(false);
    })();
  }, []);

  const handleSubmit = async () => {
    if (submitting) return;
    if (!treeName.trim() || !userName.trim() || mobile.replace(/\D/g, '').length < 10) {
      setErrorMsg('Tree name, your name and 10-digit mobile are required.');
      return;
    }
    setSubmitting(true);
    setErrorMsg('');
    try {
      await rashiPlantRequestsService.create({
        rashiName: 'General',
        recommendedTree: treeName.trim(),
        localName: treeName.trim(),
        remarks: remarks.trim() || undefined,
        userName: userName.trim(),
        mobile: mobile.replace(/\D/g, '').slice(-10),
      });
      setDone(true);
    } catch (error) {
      setErrorMsg(
        error instanceof ApiError
          ? error.message
          : 'Could not submit tree request',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: getTopInset(10) }]}>
        <Pressable style={styles.headerBtn} onPress={onBack}>
          <Text style={styles.backIcon}>←</Text>
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Add Tree Request</Text>
          <Text style={styles.headerSubtitle}>Request a plantation</Text>
        </View>
        <Pressable style={styles.headerBtn} onPress={onNotifications}>
          <Text style={styles.bellIcon}>🔔</Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingBottom: getBottomInset(32) },
          ]}
          keyboardShouldPersistTaps="handled">
          {done ? (
            <View style={styles.successCard}>
              <Text style={styles.successTitle}>Request submitted</Text>
              <Text style={styles.successBody}>
                Your tree request is with the admin team for review.
              </Text>
              <Pressable style={styles.submitBtn} onPress={onBack}>
                <Text style={styles.submitText}>Back to Home</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.formCard}>
              <Text style={styles.label}>Your name</Text>
              <TextInput
                style={styles.input}
                value={userName}
                onChangeText={setUserName}
                placeholder="Full name"
                placeholderTextColor="#9ca3af"
              />
              <Text style={styles.label}>Mobile</Text>
              <TextInput
                style={styles.input}
                value={mobile}
                onChangeText={setMobile}
                placeholder="10-digit mobile"
                placeholderTextColor="#9ca3af"
                keyboardType="phone-pad"
              />
              <Text style={styles.label}>Select Tree / Species</Text>
              {loadingTrees ? (
                <View style={styles.loadingBox}>
                  <ActivityIndicator color="#0c4820" />
                  <Text style={styles.loadingText}>Loading plants...</Text>
                </View>
              ) : (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.treesScroll}
                >
                  {trees.map((t) => {
                    const isSelected = treeName === t.name;
                    return (
                      <Pressable
                        key={t._id}
                        style={[
                          styles.treeCard,
                          isSelected && styles.treeCardSelected,
                        ]}
                        onPress={() => setTreeName(t.name)}
                      >
                        <View style={styles.treeImgWrap}>
                          <RemoteImage
                            uri={t.image}
                            style={styles.treeImg}
                            resizeMode="cover"
                          />
                        </View>
                        <Text
                          style={[
                            styles.treeTitle,
                            isSelected && styles.treeTitleSelected,
                          ]}
                          numberOfLines={2}
                        >
                          {t.name}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              )}

              <Text style={styles.label}>Remarks (optional)</Text>
              <TextInput
                style={[styles.input, styles.multiline]}
                value={remarks}
                onChangeText={setRemarks}
                placeholder="Any extra details"
                placeholderTextColor="#9ca3af"
                multiline
              />
              {errorMsg ? <Text style={styles.error}>{errorMsg}</Text> : null}
              <Pressable
                style={styles.submitWrap}
                onPress={() => void handleSubmit()}
                disabled={submitting}>
                <LinearGradient
                  colors={['#0c4820', '#2b964f']}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={styles.submitBtn}>
                  {submitting ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.submitText}>Submit request</Text>
                  )}
                </LinearGradient>
              </Pressable>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f4f9f4' },
  flex: { flex: 1 },
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
  backIcon: { fontSize: 20, color: '#111827', fontWeight: '600' },
  bellIcon: { fontSize: 18 },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '800', color: '#0a3617' },
  headerSubtitle: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  scroll: { padding: 20 },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 22,
  },
  label: { fontSize: 13, color: '#6b7280', marginBottom: 8, marginTop: 4 },
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
    marginBottom: 12,
  },
  multiline: { minHeight: 88, textAlignVertical: 'top' },
  error: { color: '#d32f2f', fontSize: 12, marginBottom: 8, textAlign: 'center' },
  submitWrap: { borderRadius: 28, overflow: 'hidden', marginTop: 8 },
  submitBtn: { paddingVertical: 16, alignItems: 'center', borderRadius: 28 },
  submitText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  successCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
  },
  successTitle: { fontSize: 20, fontWeight: '800', color: '#0a3617', marginBottom: 8 },
  successBody: {
    fontSize: 14,
    color: '#4b5563',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  treesScroll: {
    paddingVertical: 8,
    gap: 12,
  },
  treeCard: {
    width: 110,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 8,
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    marginRight: 12,
  },
  treeCardSelected: {
    borderColor: '#2b964f',
    backgroundColor: '#f0faf4',
  },
  treeImgWrap: {
    width: 90,
    height: 90,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f3f4f6',
    marginBottom: 8,
  },
  treeImg: {
    width: '100%',
    height: '100%',
  },
  treeTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4b5563',
    textAlign: 'center',
  },
  treeTitleSelected: {
    color: '#0a3617',
    fontWeight: '800',
  },
  loadingBox: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 8,
  },
});
