import {
  getDemoUser,
  getPermissions,
  getRoleLabel,
  type AuthSession,
  type AuthUser,
  type UserRole,
} from '@myway/shared';

const sessions = new Map<string, AuthSession>();
const revokedTokens = new Set<string>();

function createSessionToken(userId: string): string {
  return `session_${userId}`;
}

export function loginUser(userId: string): AuthSession | null {
  const user = getDemoUser(userId);
  if (!user) {
    return null;
  }

  const session: AuthSession = {
    session_token: createSessionToken(user.id),
    user,
    issued_at: new Date().toISOString(),
  };

  sessions.set(session.session_token, session);
  return session;
}

export function readSessionToken(request: Request): string | null {
  const authorization = request.headers.get('authorization');
  const sessionHeader = request.headers.get('x-session-token');
  const queryToken = new URL(request.url).searchParams.get('token')?.trim();
  const rawToken =
    authorization?.startsWith('Bearer ') ? authorization.slice(7).trim() : authorization?.trim() ?? sessionHeader?.trim() ?? queryToken ?? null;

  return rawToken || null;
}

export function getSession(request: Request): AuthSession | null {
  const token = readSessionToken(request);
  if (!token) {
    return null;
  }

  if (revokedTokens.has(token)) {
    return null;
  }

  const existing = sessions.get(token);
  if (existing) {
    return existing;
  }

  if (!token.startsWith('session_')) {
    return null;
  }

  const userId = token.slice('session_'.length).trim();
  if (!userId) {
    return null;
  }

  const user = getDemoUser(userId);
  if (!user) {
    return null;
  }

  const fallbackSession: AuthSession = {
    session_token: token,
    user,
    issued_at: new Date().toISOString(),
  };
  sessions.set(token, fallbackSession);
  return fallbackSession;
}

export function destroySession(request: Request): boolean {
  const token = readSessionToken(request);
  if (!token) {
    return false;
  }

  revokedTokens.add(token);
  return sessions.delete(token);
}

export function getAuthenticatedUser(request: Request): AuthUser | null {
  return getSession(request)?.user ?? null;
}

export function hasRole(user: AuthUser | null, allowedRoles: UserRole[]): boolean {
  return user ? allowedRoles.includes(user.role) : false;
}

export function describeSession(session: AuthSession): {
  session_token: string;
  user: AuthUser;
  permissions: string[];
  role_label: string;
} {
  return {
    session_token: session.session_token,
    user: session.user,
    permissions: getPermissions(session.user.role),
    role_label: getRoleLabel(session.user.role),
  };
}
