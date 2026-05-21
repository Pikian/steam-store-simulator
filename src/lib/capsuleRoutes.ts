export interface ParsedCapsuleRoute {
  type: 'id' | 'legacy' | null;
  capsuleId?: string;
  username?: string;
  title?: string;
}

export interface ShareRouteState {
  sharedCapsuleId: string | null;
  sharedUsername: string | null;
  sharedTitle: string | null;
}

export function getShareRouteFromPath(pathname = window.location.pathname): ShareRouteState {
  const route = parseCapsuleRoute(pathname);
  if (route.type === 'id' && route.capsuleId) {
    return { sharedCapsuleId: route.capsuleId, sharedUsername: null, sharedTitle: null };
  }
  if (route.type === 'legacy' && route.username && route.title) {
    return { sharedCapsuleId: null, sharedUsername: route.username, sharedTitle: route.title };
  }
  return { sharedCapsuleId: null, sharedUsername: null, sharedTitle: null };
}

export function hasShareRoute(state: ShareRouteState): boolean {
  return Boolean(state.sharedCapsuleId || (state.sharedUsername && state.sharedTitle));
}

export function parseCapsuleRoute(pathname: string): ParsedCapsuleRoute {
  const idMatch = pathname.match(/^\/capsule\/id\/([0-9a-f-]{36})$/i);
  if (idMatch) {
    return { type: 'id', capsuleId: idMatch[1] };
  }

  const legacyMatch = pathname.match(/^\/capsule\/([^/]+)\/(.+)$/);
  if (legacyMatch) {
    const [, username, title] = legacyMatch;
    if (username === 'id') {
      return { type: null };
    }
    return {
      type: 'legacy',
      username,
      title: decodeURIComponent(title),
    };
  }

  return { type: null };
}

export function buildShareUrl(capsuleId: string): string {
  return `${window.location.origin}/capsule/id/${capsuleId}`;
}

export function buildLegacyShareUrl(username: string, title: string): string {
  return `${window.location.origin}/capsule/${username}/${encodeURIComponent(title)}`;
}

export function updateBrowserToShareUrl(capsuleId: string): void {
  const url = `/capsule/id/${capsuleId}`;
  window.history.replaceState({}, '', url);
}

export function clearCapsuleRoute(): void {
  window.history.pushState({}, '', '/');
}
