import * as Crypto from 'expo-crypto';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

/**
 * App lock: a numeric PIN (hashed with a random salt, stored in the iOS Keychain via SecureStore)
 * plus optional Face ID / Touch ID.
 */

const PIN_KEY = 'daftari.pin.v1'; // "salt:hash"
const BIO_KEY = 'daftari.biometrics.v1';

const opts: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

async function hash(salt: string, pin: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `${salt}:${pin}`);
}

export async function hasPin(): Promise<boolean> {
  return (await SecureStore.getItemAsync(PIN_KEY, opts)) !== null;
}

export async function setPin(pin: string): Promise<void> {
  const salt = toHex(Crypto.getRandomBytes(16));
  await SecureStore.setItemAsync(PIN_KEY, `${salt}:${await hash(salt, pin)}`, opts);
}

export async function verifyPin(pin: string): Promise<boolean> {
  const stored = await SecureStore.getItemAsync(PIN_KEY, opts);
  if (!stored) return false;
  const [salt, expected] = stored.split(':');
  return (await hash(salt, pin)) === expected;
}

export async function biometricsAvailable(): Promise<boolean> {
  return (await LocalAuthentication.hasHardwareAsync()) && (await LocalAuthentication.isEnrolledAsync());
}

export async function isBiometricsEnabled(): Promise<boolean> {
  return (await SecureStore.getItemAsync(BIO_KEY, opts)) === '1';
}

export async function setBiometricsEnabled(on: boolean): Promise<void> {
  await SecureStore.setItemAsync(BIO_KEY, on ? '1' : '0', opts);
}

/** Face ID only (no passcode fallback) — used for normal unlock. */
export async function unlockWithBiometrics(): Promise<boolean> {
  const r = await LocalAuthentication.authenticateAsync({
    promptMessage: 'افتح دفتري',
    cancelLabel: 'استخدم الرقم السري',
    disableDeviceFallback: true,
  });
  return r.success;
}

/**
 * Proves device ownership with Face ID or the iPhone passcode.
 * Used for "نسيت الرقم السري" so the owner can reset the PIN without losing data.
 */
export async function verifyDeviceOwner(): Promise<boolean> {
  const r = await LocalAuthentication.authenticateAsync({
    promptMessage: 'أكد إنك صاحب الموبايل عشان تغير الرقم السري',
    disableDeviceFallback: false,
  });
  return r.success;
}
