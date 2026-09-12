import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Role } from "@/generated/prisma/client";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

export async function requireSession() {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

export function isAccountsManager(role: string | null | undefined) {
  return role === "ACCOUNTS_MANAGER";
}

export function canMutateMasterData(role: string | null | undefined) {
  return role === "ACCOUNTS_MANAGER" || role === "MANAGING_PARTNER";
}

export function canCreateBon(role: string | null | undefined) {
  return (
    role === "ACCOUNTS_MANAGER" ||
    role === "MANAGING_PARTNER" ||
    role === "PROJECT_ACCOUNTANT" ||
    role === "PROJECT_SUPERVISOR"
  );
}

export function canAmendBon(role: string | null | undefined) {
  return role === "ACCOUNTS_MANAGER" || role === "MANAGING_PARTNER";
}

export function canPaySettlement(role: string | null | undefined) {
  return role === "ACCOUNTS_MANAGER" || role === "MANAGING_PARTNER" || role === "PROJECT_ACCOUNTANT";
}

export function canConfirmNegativeWallet(role: string | null | undefined) {
  return role === "MANAGING_PARTNER";
}

export function canManageExpenses(role: string | null | undefined) {
  return (
    role === "ACCOUNTS_MANAGER" ||
    role === "MANAGING_PARTNER" ||
    role === "PROJECT_ACCOUNTANT" ||
    role === "PROJECT_SUPERVISOR"
  );
}

export function canCloseProject(role: string | null | undefined) {
  return role === "ACCOUNTS_MANAGER" || role === "MANAGING_PARTNER";
}

export async function getAccessibleProjectIds(userId: string, role: string) {
  if (isAccountsManager(role)) {
    const projects = await prisma.project.findMany({ select: { id: true } });
    return projects.map((p) => p.id);
  }
  const memberships = await prisma.projectMembership.findMany({
    where: { userId },
    select: { projectId: true },
  });
  return memberships.map((m) => m.projectId);
}

export async function requireProjectAccess(projectId: string) {
  const session = await requireSession();
  const role = (session.user as { role?: string }).role ?? "";
  const ids = await getAccessibleProjectIds(session.user.id, role);
  if (!ids.includes(projectId)) {
    redirect("/");
  }
  return session;
}

export async function getCurrentUserRole(): Promise<Role | null> {
  const session = await getSession();
  if (!session) return null;
  return ((session.user as { role?: Role }).role as Role) ?? null;
}

export function sessionRole(session: Awaited<ReturnType<typeof requireSession>>) {
  return (session.user as { role?: string }).role ?? "";
}
