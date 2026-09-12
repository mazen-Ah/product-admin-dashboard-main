import { getProject } from "@/app/actions/masters";
import {
  addOpeningBalance,
  ensureProjectWallets,
  listCustodies,
  listWallets,
  transferWallet,
  upsertCustody,
} from "@/app/actions/treasury";
import { BackToHub } from "@/components/common/back-to-hub";
import {
  FormActions,
  FormField,
  FormGrid,
  FormTitle,
  formSelectClassName,
} from "@/components/common/form-field";
import { Button } from "@/components/tailgrids/core/button";
import { Card } from "@/components/tailgrids/core/card";
import { Input } from "@/components/tailgrids/core/input";
import { Label } from "@/components/tailgrids/core/label";
import { canPaySettlement, requireProjectAccess, sessionRole } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function WalletsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireProjectAccess(id);
  const canEdit = canPaySettlement(sessionRole(session));
  await ensureProjectWallets(id);
  const [project, wallets, custodies, members, currencies] = await Promise.all([
    getProject(id),
    listWallets(id),
    listCustodies(id),
    prisma.projectMembership.findMany({
      where: { projectId: id },
      include: { user: true },
    }),
    prisma.currency.findMany(),
  ]);

  async function openingAction(formData: FormData) {
    "use server";
    formData.set("projectId", id);
    await addOpeningBalance(formData);
    redirect(`/projects/${id}/wallets`);
  }

  async function transferAction(formData: FormData) {
    "use server";
    formData.set("projectId", id);
    await transferWallet(formData);
    redirect(`/projects/${id}/wallets`);
  }

  async function custodyAction(formData: FormData) {
    "use server";
    formData.set("projectId", id);
    await upsertCustody(formData);
    redirect(`/projects/${id}/wallets`);
  }

  return (
    <div className="mt-6 space-y-5 px-2 lg:px-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[28px] font-medium text-text-primary">المحافظ والعهد</h1>
          <p className="text-sm text-text-tertiary">{project.name}</p>
        </div>
        <BackToHub projectId={id} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {wallets.map((w) => (
          <Card key={w.id} className="p-4">
            <p className="font-semibold text-text-primary">{w.label ?? w.method}</p>
            <p className="mt-1 text-sm text-text-tertiary">{w.currency.code}</p>
            <p className="mt-3 text-2xl font-semibold text-text-primary">
              {w.balanceLyd.toFixed(2)} LYD
            </p>
          </Card>
        ))}
      </div>

      {canEdit ? (
        <>
          <Card className="bg-transparent p-5">
            <FormTitle>رصيد افتتاحي</FormTitle>
            <form action={openingAction}>
              <FormGrid>
                <FormField>
                  <Label htmlFor="walletId">المحفظة</Label>
                  <select id="walletId" name="walletId" required className={formSelectClassName}>
                    {wallets.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.label ?? w.method}
                      </option>
                    ))}
                  </select>
                </FormField>
                <FormField>
                  <Label htmlFor="amount">المبلغ</Label>
                  <Input id="amount" name="amount" type="number" step="0.01" required className="w-full" />
                </FormField>
                <FormActions>
                  <Button type="submit" size="lg" className="px-3.5 text-sm">
                    حفظ
                  </Button>
                </FormActions>
              </FormGrid>
            </form>
          </Card>

          <Card className="bg-transparent p-5">
            <FormTitle>تحويل بين المحافظ</FormTitle>
            <form action={transferAction}>
              <FormGrid>
                <FormField>
                  <Label htmlFor="fromWalletId">من</Label>
                  <select id="fromWalletId" name="fromWalletId" required className={formSelectClassName}>
                    {wallets.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.label ?? w.method}
                      </option>
                    ))}
                  </select>
                </FormField>
                <FormField>
                  <Label htmlFor="toWalletId">إلى</Label>
                  <select id="toWalletId" name="toWalletId" required className={formSelectClassName}>
                    {wallets.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.label ?? w.method}
                      </option>
                    ))}
                  </select>
                </FormField>
                <FormField>
                  <Label htmlFor="amountOut">المبلغ الخارج</Label>
                  <Input id="amountOut" name="amountOut" type="number" step="0.01" required className="w-full" />
                </FormField>
                <FormField>
                  <Label htmlFor="amountIn">المبلغ الوارد</Label>
                  <Input id="amountIn" name="amountIn" type="number" step="0.01" required className="w-full" />
                </FormField>
                <FormField>
                  <Label htmlFor="fxRate">سعر الصرف للوارد</Label>
                  <Input id="fxRate" name="fxRate" type="number" step="0.0001" defaultValue={1} className="w-full" />
                </FormField>
                <div className="flex items-center gap-2 md:col-span-2">
                  <input type="checkbox" id="confirmNegative" name="confirmNegative" />
                  <Label htmlFor="confirmNegative" className="font-normal">
                    تأكيد رصيد سالب (الشريك المدير)
                  </Label>
                </div>
                <FormActions>
                  <Button type="submit" size="lg" className="px-3.5 text-sm">
                    تحويل
                  </Button>
                </FormActions>
              </FormGrid>
            </form>
          </Card>

          <Card className="bg-transparent p-5">
            <FormTitle>عهدة</FormTitle>
            <form action={custodyAction}>
              <FormGrid>
                <FormField>
                  <Label htmlFor="personId">الشخص</Label>
                  <select id="personId" name="personId" required className={formSelectClassName}>
                    {members.map((m) => (
                      <option key={m.userId} value={m.userId}>
                        {m.user.name}
                      </option>
                    ))}
                  </select>
                </FormField>
                <FormField>
                  <Label htmlFor="currencyId">العملة</Label>
                  <select id="currencyId" name="currencyId" required className={formSelectClassName}>
                    {currencies.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.code}
                      </option>
                    ))}
                  </select>
                </FormField>
                <FormField>
                  <Label htmlFor="walletId2">من المحفظة</Label>
                  <select id="walletId2" name="walletId" className={formSelectClassName}>
                    <option value="">—</option>
                    {wallets.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.label ?? w.method}
                      </option>
                    ))}
                  </select>
                </FormField>
                <FormField>
                  <Label htmlFor="amount2">المبلغ (+ صرف / − تسوية)</Label>
                  <Input id="amount2" name="amount" type="number" step="0.01" required className="w-full" />
                </FormField>
                <FormActions>
                  <Button type="submit" size="lg" className="px-3.5 text-sm">
                    حفظ
                  </Button>
                </FormActions>
              </FormGrid>
            </form>
          </Card>
        </>
      ) : null}

      <Card className="p-4">
        <h3 className="mb-3 font-semibold text-text-primary">العهد الحالية</h3>
        {custodies.length === 0 ? (
          <p className="text-sm text-text-tertiary">لا عهد</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {custodies.map((c) => (
              <li key={c.id}>
                {c.person.name} · {c.currency.code} · {String(c.balanceNative)}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
