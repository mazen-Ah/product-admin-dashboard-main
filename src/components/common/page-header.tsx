"use client";

import { useLocale } from "@/i18n/locale-provider";
import type { MessageKey } from "@/i18n/messages";

export function PageHeader({
  titleKey,
  description,
}: {
  titleKey: MessageKey;
  description?: string;
}) {
  const { t } = useLocale();
  return (
    <div className="mb-5 px-2 lg:px-6">
      <h1 className="mb-1 text-[28px] leading-8 font-medium text-text-primary">
        {t(titleKey)}
      </h1>
      {description ? (
        <p className="text-sm leading-5 text-text-tertiary">{description}</p>
      ) : null}
    </div>
  );
}
