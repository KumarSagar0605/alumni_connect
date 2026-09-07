export type ManagedRole = 'admin' | 'head';

export type AppRole = 'student' | 'alumni' | 'admin' | 'head';

/** Roles a member of the public may self-select at signup. */
export const PUBLIC_SIGNUP_ROLES: ReadonlyArray<'student' | 'alumni'> = ['student', 'alumni'];

/**
 * Sanitize a client-supplied signup role. Anything that is not an explicit
 * public role (including 'admin' / 'head' spoof attempts) falls back to 'student'.
 */
export function sanitizeSignupRole(role: unknown): 'student' | 'alumni' {
  return role === 'alumni' ? 'alumni' : 'student';
}

/** True when the role may create, edit, or delete clubs, projects, and events. */
export function canManageRole(role: unknown): role is ManagedRole {
  return role === 'admin' || role === 'head';
}

/** True only for the superadmin account. */
export function isSuperAdmin(role: unknown): role is 'admin' {
  return role === 'admin';
}
