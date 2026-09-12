"use client";

import { Button } from "@/components/tailgrids/core/button";
import { Card } from "@/components/tailgrids/core/card";
import { Input } from "@/components/tailgrids/core/input";
import { Label } from "@/components/tailgrids/core/label";
import { TextField } from "@/components/tailgrids/core/text-field";
import { useLocale } from "@/i18n/locale-provider";
import { authClient } from "@/lib/auth-client";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import { toast } from "sonner";

function LoginForm() {
  const { t } = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");

    const { error } = await authClient.signIn.email({ email, password });
    setLoading(false);

    if (error) {
      toast.error(error.message ?? "Login failed");
      return;
    }

    router.push(searchParams.get("next") || "/");
    router.refresh();
  }

  return (
    <Card className="w-full max-w-md bg-transparent p-5">
      <h2 className="mb-6 text-xl leading-7 font-semibold text-text-primary">{t("login")}</h2>
      <form className="space-y-5" onSubmit={onSubmit}>
        <TextField name="email" type="email" required className="w-full gap-2.5">
          <Label>{t("email")}</Label>
          <Input type="email" name="email" required autoComplete="email" className="w-full" />
        </TextField>
        <TextField name="password" type="password" required className="w-full gap-2.5">
          <Label>{t("password")}</Label>
          <Input
            type="password"
            name="password"
            required
            autoComplete="current-password"
            className="w-full"
          />
        </TextField>
        <div className="flex justify-end">
          <Button type="submit" size="lg" className="px-3.5 text-sm" isDisabled={loading}>
            {t("signIn")}
          </Button>
        </div>
      </form>
    </Card>
  );
}

export default function LoginPage() {
  const { t } = useLocale();

  return (
    <div className="flex min-h-full items-center justify-center p-6">
      <div className="flex w-full max-w-md flex-col items-center gap-6">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-text-primary">{t("appName")}</h1>
          <p className="mt-1 text-sm text-text-tertiary">{t("appDescription")}</p>
        </div>
        <Suspense>
          <LoginForm />
        </Suspense>
        <Card className="w-full max-w-md text-sm text-text-secondary">
          <p className="mb-2 font-medium text-text-primary">حسابات التجربة</p>
          <p>كلمة المرور للجميع: Password123!</p>
          <ul className="mt-2 list-inside list-disc space-y-1">
            <li>accounts@example.com — مدير الحسابات (كل المشاريع)</li>
            <li>supervisor@example.com — مشرف (مشروع واحد)</li>
            <li>partner@example.com — شريك (قراءة)</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
