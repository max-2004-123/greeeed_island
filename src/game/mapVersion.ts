export type MapVersion = 'v2' | 'legacy';

const STORAGE_KEY = 'gi_map_version';

function resolveInitialMapVersion(): MapVersion {
  if (typeof window === 'undefined') return 'v2';
  const params = new URLSearchParams(window.location.search);
  const urlVal = params.get('map');
  if (urlVal === 'legacy' || urlVal === 'v2') {
    try {
      window.localStorage.setItem(STORAGE_KEY, urlVal);
    } catch {
      // ignore storage errors
    }
    return urlVal;
  }
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === 'legacy' || saved === 'v2') return saved;
  } catch {
    // ignore storage errors
  }
  return 'v2';
}

export const ACTIVE_MAP_VERSION: MapVersion = resolveInitialMapVersion();

export function isV2Map(): boolean {
  return ACTIVE_MAP_VERSION === 'v2';
}

export function switchMapVersion(next: MapVersion): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, next);
  } catch {
    // ignore storage errors
  }
  const url = new URL(window.location.href);
  url.searchParams.set('map', next);
  window.location.href = url.toString();
}
