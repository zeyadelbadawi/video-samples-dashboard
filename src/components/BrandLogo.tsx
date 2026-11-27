import { Image } from 'react-native';

import { useTheme } from '@/theme';

const LOGO = require('@/assets/images/logo.png');
const ASPECT = 1848 / 1173; // logo.png is a single-colour mark on a transparent background

/** Omar Elazab "OE" logo, tinted to the current text colour so it works in light and dark mode. */
export function BrandLogo({ width }: { width: number }) {
  const t = useTheme();
  return (
    <Image
      source={LOGO}
      accessibilityLabel="Omar Elazab"
      resizeMode="contain"
      style={{ width, height: width / ASPECT, tintColor: t.text }}
    />
  );
}
