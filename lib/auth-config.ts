/**
 * Master Authentication & Passcode Configuration
 * Centralized key management for GeoAttend
 */

/**
 * Returns the current Super Admin master key from environment variables (if provided).
 * Does not fall back to hardcoded insecure keys like 'admin123'.
 */
export function getAdminMasterKey(): string | null {
  return process.env.NEXT_PUBLIC_ADMIN_KEY?.trim() || null;
}

/**
 * Default fallback site key if not specified on a project.
 */
export function getDefaultSiteKey(): string | null {
  return process.env.NEXT_PUBLIC_DEFAULT_SITE_KEY?.trim() || null;
}
