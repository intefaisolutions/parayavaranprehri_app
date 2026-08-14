import React, { useEffect, useState } from 'react';
import { Image, type ImageProps, type ImageStyle, type StyleProp } from 'react-native';
import {
  isS3MediaUrl,
  signMediaUrl,
  toPermanentMediaUrl,
  withCacheBust,
} from '../api/mediaUrl';

type Props = {
  uri?: string | null;
  version?: string | number | null;
  style?: StyleProp<ImageStyle>;
  resizeMode?: ImageProps['resizeMode'];
};

/**
 * CMS / S3 photos: permanent URL + cache-bust, then signed GET if needed.
 */
export default function RemoteImage({
  uri,
  version,
  style,
  resizeMode = 'cover',
}: Props) {
  const [src, setSrc] = useState<string | undefined>(() =>
    uri ? withCacheBust(uri, version) : undefined,
  );
  const [triedSigned, setTriedSigned] = useState(false);

  useEffect(() => {
    setTriedSigned(false);
    setSrc(uri ? withCacheBust(uri, version) : undefined);
  }, [uri, version]);

  if (!src) return null;

  return (
    <Image
      key={src}
      source={{ uri: src }}
      style={style}
      resizeMode={resizeMode}
      onError={() => {
        if (!uri || triedSigned || !isS3MediaUrl(uri)) {
          return;
        }
        setTriedSigned(true);
        void signMediaUrl(toPermanentMediaUrl(uri)).then(signed => {
          if (signed) setSrc(signed);
        });
      }}
    />
  );
}
