"use client";

import { Alert } from "@/components/tailgrids/core/alert";
import { useLocale } from "@/i18n/locale-provider";

export function PrototypeBanner({
  bannerAr,
  bannerEn,
}: {
  bannerAr: string;
  bannerEn: string;
}) {
  const { locale } = useLocale();
  return (
    <Alert status="info" className="mb-5 max-w-none">
      <p className="text-sm text-text-secondary">
        {locale === "ar" ? bannerAr : bannerEn}
      </p>
    </Alert>
  );
}
