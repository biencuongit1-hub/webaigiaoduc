/**
 * Utilities for generating public shareable URLs for exams.
 * In AI Studio, the development environment uses internal `ais-dev-...` domains
 * which cannot be accessed by external users (students, parents, other devices).
 * The public shared preview URL uses `ais-pre-...` which anyone on the internet can open.
 * Teachers can also configure their own production domain (Vercel, custom domain).
 */

const CUSTOM_PUBLIC_DOMAIN_KEY = 'custom_public_share_domain';

export function getPublicBaseUrl(): string {
  // 1. If teacher configured a custom production domain (e.g. Vercel)
  try {
    const custom = localStorage.getItem(CUSTOM_PUBLIC_DOMAIN_KEY);
    if (custom && custom.trim()) {
      let url = custom.trim();
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = `https://${url}`;
      }
      return url.replace(/\/+$/, '');
    }
  } catch {
    // Fallback if localStorage unavailable
  }

  // 2. Automatically transform AI Studio internal dev URL (ais-dev-...) to public preview URL (ais-pre-...)
  if (typeof window !== 'undefined' && window.location) {
    const origin = window.location.origin;
    if (origin.includes('ais-dev-')) {
      return origin.replace('ais-dev-', 'ais-pre-');
    }
    return origin;
  }

  return '';
}

export function setCustomPublicDomain(domain: string): void {
  try {
    if (!domain.trim()) {
      localStorage.removeItem(CUSTOM_PUBLIC_DOMAIN_KEY);
    } else {
      localStorage.setItem(CUSTOM_PUBLIC_DOMAIN_KEY, domain.trim());
    }
  } catch {
    // Ignore
  }
}

export function getCustomPublicDomain(): string {
  try {
    return localStorage.getItem(CUSTOM_PUBLIC_DOMAIN_KEY) || '';
  } catch {
    return '';
  }
}

/**
 * Generate full public link for students to join an exam directly
 * e.g. https://ais-pre-vrzsmdsar4vozxau3birz7-574395196800.asia-southeast1.run.app/?code=TOAN9GK2
 */
export function generateExamShareUrl(accessCode: string): string {
  const base = getPublicBaseUrl();
  const cleanCode = accessCode.trim().toUpperCase();
  return `${base}/?code=${encodeURIComponent(cleanCode)}`;
}
