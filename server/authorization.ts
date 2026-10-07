export type AuthorizationUser = { id: number; role: string };

export const isAdmin = (role: string) => role === "admin" || role === "super_admin";
export const isSuperAdmin = (role: string) => role === "super_admin";
export const isParentRole = (role: string) => role === "parent";

/** Parent profiles are the current Phase 2 identity marker until role provisioning is added. */
export const canCreateParentChildLink = (actor: AuthorizationUser, hasParentProfile: boolean) =>
  !isAdmin(actor.role) && (isParentRole(actor.role) || hasParentProfile);

export const canAccessStudent = (actor: AuthorizationUser, studentUserId: number, activeChildIds: number[] = []) =>
  isAdmin(actor.role) || actor.id === studentUserId || activeChildIds.includes(studentUserId);

export const canEditRelationship = (actor: AuthorizationUser) => isAdmin(actor.role);
export const canAssignRole = (actor: AuthorizationUser, targetUserId: number, targetRole: string) =>
  isSuperAdmin(actor.role) && actor.id !== targetUserId && ["user", "admin", "super_admin"].includes(targetRole);
