import React from 'react';
import { Image, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

type Props = {
  data: string;
  size?: number;
  style?: StyleProp<ViewStyle>;
};

export default function QrImage({ data, size = 120, style }: Props) {
  const uri = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(
    data,
  )}`;

  return (
    <View style={[styles.wrap, { width: size, height: size }, style]}>
      <Image
        source={{ uri }}
        style={{ width: size, height: size }}
        resizeMode="contain"
        accessibilityLabel="QR code"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
