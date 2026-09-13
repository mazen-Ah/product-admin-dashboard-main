import { prisma } from "@/lib/prisma";
import { ensureDemoReady, DEMO_USER_IDS } from "@/lib/seed-demo";
import type { Role } from "@/generated/prisma/client";
import { redirect } from "next/navigation";

export type DemoSession = {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    image?: string | null;
  };
};

async function demoUser() {
  await ensureDemoReady(prisma);
  const user =
    (await prisma.user.findUnique({ where: { id: DEMO_USER_IDS.accounts } })) ??
    (await prisma.user.findUnique({ where: { email: "accounts@example.com" } })) ??
    (await prisma.user.findFirst({ where: { role: "ACCOUNTS_MANAGER" } }));

  if (!user) {
    throw new Error("Demo user missing — run db:seed");
  }

  return user;
}

export async function getSession(): Promise<DemoSession | null> {
  const user = await demoUser();
  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      image: user.image,
    },
  };
}

export async function requireSession() {
  const session = await getSession();
  if (!session) redirect("/");
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
  return role === "MANAGING_PARTNER" || role === "ACCOUNTS_MANAGER";
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
  const role = session.user.role ?? "";
  const ids = await getAccessibleProjectIds(session.user.id, role);

  if (!ids.includes(projectId)) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true },
    });
    if (!project || !isAccountsManager(role)) {
      redirect("/");
    }
  }

  return session;
}

export async function getCurrentUserRole(): Promise<Role | null> {
  const session = await getSession();
  if (!session) return null;
  return (session.user.role as Role) ?? null;
}

export function sessionRole(session: Awaited<ReturnType<typeof requireSession>>) {
  return session.user.role ?? "";
}
