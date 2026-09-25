import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import WebView from 'react-native-webview';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { apiRequest } from '../api';
import { ApiError } from '../api';

const COLORS = {
  gradientStart: '#136e35',
  white: '#ffffff',
  textDark: '#1a1f24',
  textMuted: '#6b7280',
};

// ─── raw API response shape ────────────────────────────────────────────────
// The PRODUCTION server returns a DOUBLE-wrapped envelope:
//   { success, data: { success, data: { _id, type, content, ... } } }
// apiRequest() unwraps ONE level → we receive:
//   { success: true, data: { _id, type, content, ... } }
// So we must extract from data.data.content (double-wrapped)
// OR data.content (single-wrapped) as a safe fallback.
type ContentInner = {
  content?: string;
  [key: string]: unknown;
};

type ContentApiData = {
  // double-wrapped: data.data.content
  data?: ContentInner;
  // single-wrapped fallback: data.content
  content?: string;
  [key: string]: unknown;
};

/** Wraps backend HTML in a minimal responsive page so it renders well in WebView */
function buildHtmlPage(html: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0"/>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 15px;
      line-height: 1.7;
      color: #1a1f24;
      background: #ffffff;
      padding: 20px 18px 40px;
    }
    h1, h2, h3 { color: #136e35; margin-bottom: 10px; margin-top: 18px; }
    p { margin-bottom: 12px; }
    a { color: #136e35; }
  </style>
</head>
<body>${html}</body>
</html>`;
}

type ContentType = 'privacy_policy' | 'terms_conditions';

type Props = {
  title: string;
  contentType: ContentType;
};

type ScreenState =
  | { status: 'loading' }
  | { status: 'ok'; html: string }
  | { status: 'error'; message: string };

export default function LegalContentScreen({ title, contentType }: Props) {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [state, setState] = useState<ScreenState>({ status: 'loading' });

  const load = useCallback(async () => {
    setState({ status: 'loading' });
    try {
      // apiRequest already unwraps { success, data } → returns data object
      const data = await apiRequest<ContentApiData>(`/content/${contentType}`, {
        method: 'GET',
        auth: false,
      });

      // The production server DOUBLE-wraps responses:
      // Outer HTTP body:  { success, statusCode, message, data: INNER, timestamp, path }
      // apiRequest unwraps ONE level → we receive INNER:
      //   { success: true, data: { _id, type, content, ... } }
      // So the HTML lives at: data.data.content
      // We also try data.content as a single-wrap fallback.
      function extractHtml(obj: unknown): string | undefined {
        if (!obj || typeof obj !== 'object') return undefined;
        const o = obj as Record<string, unknown>;
        // Double-wrap: obj.data.content
        if (
          o.data &&
          typeof o.data === 'object' &&
          typeof (o.data as Record<string, unknown>).content === 'string' &&
          ((o.data as Record<string, unknown>).content as string).trim().length > 0
        ) {
          return (o.data as Record<string, unknown>).content as string;
        }
        // Single-wrap fallback: obj.content
        if (
          typeof o.content === 'string' &&
          (o.content as string).trim().length > 0
        ) {
          return o.content as string;
        }
        return undefined;
      }

      const rawHtml = extractHtml(data);

      if (!rawHtml) {
        setState({
          status: 'error',
          message: 'Content is currently unavailable. Please try again later.',
        });
        return;
      }

      setState({ status: 'ok', html: buildHtmlPage(rawHtml) });

    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
          ? err.message
          : 'Failed to load content. Please check your connection.';
      setState({ status: 'error', message: msg });
    }
  }, [contentType]);

  // Load once on mount
  React.useEffect(() => {
    load();
  }, [load]);

  return (
    <SafeAreaView style={styles.container}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={styles.backBtn}
          activeOpacity={0.7}>
          <Text style={styles.backArrow}>{'←'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {title}
        </Text>
        {/* Spacer to keep title centred */}
        <View style={styles.backBtn} />
      </View>

      {/* ── Loading ── */}
      {state.status === 'loading' && (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.gradientStart} />
          <Text style={styles.loadingText}>Loading…</Text>
        </View>
      )}

      {/* ── Error + Retry ── */}
      {state.status === 'error' && (
        <View style={styles.center}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>Could not load content</Text>
          <Text style={styles.errorMsg}>{state.message}</Text>
          <TouchableOpacity
            style={styles.retryBtn}
            activeOpacity={0.8}
            onPress={load}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── WebView ── */}
      {state.status === 'ok' && (
        <WebView
          // Pass fully built HTML string – no external URLs involved
          source={{ html: state.html, baseUrl: '' }}
          style={styles.webview}
          originWhitelist={['*']}
          showsVerticalScrollIndicator
          // Do NOT add onShouldStartLoadWithRequest here — it blocks
          // the initial HTML inject on Android.
          javaScriptEnabled={false}
          domStorageEnabled={false}
          // Hardware layer causes flicker on some Android versions;
          // software layer is safer for static HTML.
          androidLayerType={
            Platform.OS === 'android' ? 'software' : undefined
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gradientStart,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  backBtn: {
    width: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: {
    color: COLORS.white,
    fontSize: 22,
    fontWeight: '600',
  },
  headerTitle: {
    flex: 1,
    color: COLORS.white,
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  webview: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.textMuted,
  },
  errorIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  errorTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.textDark,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMsg: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  retryBtn: {
    backgroundColor: COLORS.gradientStart,
    paddingVertical: 12,
    paddingHorizontal: 36,
    borderRadius: 24,
  },
  retryText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '700',
  },
});
