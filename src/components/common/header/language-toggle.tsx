"use client";

import { Button } from "@/components/tailgrids/core/button";
import { useLocale } from "@/i18n/locale-provider";

export function LanguageToggle() {
  const { locale, setLocale, t } = useLocale();

  return (
    <Button
      appearance="outline"
      size="sm"
      type="button"
      aria-label={t("language")}
      onClick={() => setLocale(locale === "ar" ? "en" : "ar")}
    >
      {locale === "ar" ? "EN" : "ع"}
    </Button>
  );
}
