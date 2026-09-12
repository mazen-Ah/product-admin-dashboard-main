"use client";

import { useLocale } from "@/i18n/locale-provider";
import { Logo } from "@/utils/icon";
import { cn } from "@/utils/cn";

export function BrandLogo({
  className,
  showText = true,
}: {
  className?: string;
  showText?: boolean;
}) {
  const { t } = useLocale();

  return (
    <span className={cn("flex min-w-0 items-center gap-2.5", className)}>
      <Logo className="size-8 shrink-0" />
      {showText ? (
        <span className="truncate text-sm font-semibold tracking-tight text-text-primary">
          {t("brandShort")}
        </span>
      ) : null}
    </span>
  );
}
