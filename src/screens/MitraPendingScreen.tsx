import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { getBottomInset, getTopInset } from '../utils/layout';

type Props = {
  onLogout: () => void;
  onCheckAgain: () => void | Promise<void>;
  checking?: boolean;
};

export default function MitraPendingScreen({
  onLogout,
  onCheckAgain,
  checking = false,
}: Props) {
  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: getTopInset(16) }]}>
        <Text style={styles.headerTitle}>Paryavaran Mitra</Text>
        <Text style={styles.headerSubtitle}>Awaiting admin confirmation</Text>
      </View>

      <View style={[styles.body, { paddingBottom: getBottomInset(24) }]}>
        <View style={styles.card}>
          <Text style={styles.icon}>⏳</Text>
          <Text style={styles.title}>Request pending</Text>
          <Text style={styles.message}>
            Admin has not confirmed your request. You will get the Mitra
            dashboard after your application is verified.
          </Text>

          <Pressable
            style={styles.checkBtnWrap}
            onPress={() => void onCheckAgain()}
            disabled={checking}>
            <LinearGradient
              colors={['#0c4820', '#2b964f']}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.checkBtn}>
              {checking ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.checkBtnText}>Check status</Text>
              )}
            </LinearGradient>
          </Pressable>

          <Pressable style={styles.logoutBtn} onPress={onLogout}>
            <Text style={styles.logoutText}>Sign out</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f4f9f4' },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eef2ef',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0a3617',
  },
  headerSubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: '#6b7280',
  },
  body: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
  },
  icon: { fontSize: 40, marginBottom: 12 },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0a3617',
    marginBottom: 10,
    textAlign: 'center',
  },
  message: {
    fontSize: 15,
    lineHeight: 22,
    color: '#4b5563',
    textAlign: 'center',
    marginBottom: 24,
  },
  checkBtnWrap: {
    alignSelf: 'stretch',
    borderRadius: 28,
    overflow: 'hidden',
    marginBottom: 12,
  },
  checkBtn: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  checkBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
  logoutBtn: {
    paddingVertical: 12,
  },
  logoutText: {
    color: '#e11d48',
    fontSize: 15,
    fontWeight: '700',
  },
});
