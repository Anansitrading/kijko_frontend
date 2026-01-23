// Two-Factor Authentication Utilities
// Setting Sprint 4: Security and Data

import type { TwoFactorSetupData, BackupCode } from '../types/settings';

/**
 * Generate a random base32 secret for TOTP
 * In production, this would be done server-side
 */
export function generateTOTPSecret(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let secret = '';
  const array = new Uint8Array(20);
  crypto.getRandomValues(array);
  for (let i = 0; i < 20; i++) {
    secret += chars[array[i] % chars.length];
  }
  return secret;
}

/**
 * Format secret for display (grouped for readability)
 * Example: JBSW Y3DP EHPK 3PXP
 */
export function formatSecretForDisplay(secret: string): string {
  return secret.match(/.{1,4}/g)?.join(' ') || secret;
}

/**
 * Generate TOTP Auth URL for QR code
 * Format: otpauth://totp/{label}?secret={secret}&issuer={issuer}
 */
export function generateOTPAuthURL(
  secret: string,
  accountName: string,
  issuer: string = 'Kijko'
): string {
  const encodedIssuer = encodeURIComponent(issuer);
  const encodedAccount = encodeURIComponent(accountName);
  const label = `${encodedIssuer}:${encodedAccount}`;
  return `otpauth://totp/${label}?secret=${secret}&issuer=${encodedIssuer}&algorithm=SHA1&digits=6&period=30`;
}

/**
 * Generate QR code data URL from OTP auth URL
 * Uses a simple SVG-based QR generation for demo
 * In production, use a proper QR library like 'qrcode'
 */
export async function generateQRCodeDataURL(otpAuthURL: string): Promise<string> {
  // In production, you would use:
  // import QRCode from 'qrcode';
  // return await QRCode.toDataURL(otpAuthURL);

  // For demo purposes, return a placeholder that indicates the URL
  // The actual QR code would be generated server-side or with a library
  const size = 200;
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <rect width="100%" height="100%" fill="white"/>
      <rect x="20" y="20" width="60" height="60" fill="black"/>
      <rect x="30" y="30" width="40" height="40" fill="white"/>
      <rect x="40" y="40" width="20" height="20" fill="black"/>
      <rect x="120" y="20" width="60" height="60" fill="black"/>
      <rect x="130" y="30" width="40" height="40" fill="white"/>
      <rect x="140" y="40" width="20" height="20" fill="black"/>
      <rect x="20" y="120" width="60" height="60" fill="black"/>
      <rect x="30" y="130" width="40" height="40" fill="white"/>
      <rect x="40" y="140" width="20" height="20" fill="black"/>
      <rect x="90" y="90" width="20" height="20" fill="black"/>
      <rect x="120" y="120" width="20" height="20" fill="black"/>
      <rect x="150" y="120" width="20" height="20" fill="black"/>
      <rect x="120" y="150" width="50" height="20" fill="black"/>
      <text x="100" y="195" text-anchor="middle" font-size="8" fill="#666">QR Code Placeholder</text>
    </svg>
  `.trim();

  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

/**
 * Validate TOTP code format (6 digits)
 */
export function isValidTOTPFormat(code: string): boolean {
  return /^\d{6}$/.test(code);
}

/**
 * Generate setup data for 2FA
 * In production, this would be an API call
 */
export async function generate2FASetupData(
  email: string
): Promise<TwoFactorSetupData> {
  const secret = generateTOTPSecret();
  const otpAuthURL = generateOTPAuthURL(secret, email);
  const qrCodeUrl = await generateQRCodeDataURL(otpAuthURL);

  return {
    secret,
    qrCodeUrl,
    manualEntryKey: formatSecretForDisplay(secret),
  };
}

/**
 * Verify TOTP code
 * In production, this would be server-side verification
 */
export async function verifyTOTPCode(
  secret: string,
  code: string
): Promise<boolean> {
  // In production, use a TOTP library like 'otplib':
  // import { authenticator } from 'otplib';
  // return authenticator.verify({ token: code, secret });

  // For demo: simulate verification with delay
  await new Promise(resolve => setTimeout(resolve, 500));

  // Demo: accept any valid 6-digit code
  return isValidTOTPFormat(code);
}

/**
 * Generate backup codes
 * Format: XXXX-XXXX-XXXX
 */
export function generateBackupCodes(count: number = 10): BackupCode[] {
  const codes: BackupCode[] = [];

  for (let i = 0; i < count; i++) {
    const segments: string[] = [];
    for (let j = 0; j < 3; j++) {
      const array = new Uint8Array(2);
      crypto.getRandomValues(array);
      const segment = Array.from(array)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')
        .toUpperCase();
      segments.push(segment);
    }

    codes.push({
      code: segments.join('-'),
      isUsed: false,
    });
  }

  return codes;
}

/**
 * Format backup codes for download as text file
 */
export function formatBackupCodesForDownload(
  codes: BackupCode[],
  accountEmail: string
): string {
  const header = `Kijko Backup Codes
Account: ${accountEmail}
Generated: ${new Date().toISOString()}

IMPORTANT: Store these codes in a safe place. Each code can only be used once.
If you lose access to your authenticator app, you can use one of these codes to sign in.

`;

  const codeLines = codes
    .map((c, i) => `${(i + 1).toString().padStart(2, '0')}. ${c.code}${c.isUsed ? ' (USED)' : ''}`)
    .join('\n');

  return header + codeLines;
}

/**
 * Download backup codes as a text file
 */
export function downloadBackupCodes(codes: BackupCode[], accountEmail: string): void {
  const content = formatBackupCodesForDownload(codes, accountEmail);
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = 'kijko-backup-codes.txt';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Validate backup code format
 */
export function isValidBackupCodeFormat(code: string): boolean {
  return /^[A-Fa-f0-9]{4}-[A-Fa-f0-9]{4}-[A-Fa-f0-9]{4}$/.test(code);
}
