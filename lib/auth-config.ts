/**
 * Master Authentication & Passcode Configuration
 * Centralized key management for GeoAttend
 */

const STORAGE_ADMIN_KEY = 'geoattend_admin_master_key_v2';

/**
 * Returns the current Super Admin master key.
 * Can be overridden via NEXT_PUBLIC_ADMIN_KEY environment variable or stored in local storage.
 */
export function getAdminMasterKey(): string {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(STORAGE_ADMIN_KEY);
    if (saved && saved.trim()) return saved.trim();
  }
  return process.env.NEXT_PUBLIC_ADMIN_KEY || 'admin123';
}

/**
 * Allows updating the Super Admin master key.
 */
export function setAdminMasterKey(newKey: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_ADMIN_KEY, newKey.trim());
  }
}

/**
 * Default fallback site key if not specified on a project
 */
export function getDefaultSiteKey(): string {
  return process.env.NEXT_PUBLIC_DEFAULT_SITE_KEY || 'site123';
}
