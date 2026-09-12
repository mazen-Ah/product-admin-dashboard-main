import { Button } from "@/components/tailgrids/core/button";
import Link from "next/link";
import type { ReactNode } from "react";

export function PageToolbar({
  title,
  description,
  actionHref,
  actionLabel,
  backHref,
}: {
  title: string;
  description?: string;
  actionHref?: string;
  actionLabel?: string;
  backHref?: string;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 px-2 lg:px-5">
      <div className="min-w-0">
        <h1 className="text-[28px] leading-8 font-medium text-text-primary">{title}</h1>
        {description ? (
          <p className="mt-1 text-sm text-text-tertiary">{description}</p>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {backHref ? (
          <Link href={backHref}>
            <Button appearance="ghost" size="sm">
              رجوع
            </Button>
          </Link>
        ) : null}
        {actionHref && actionLabel ? (
          <Link href={actionHref}>
            <Button size="sm">{actionLabel}</Button>
          </Link>
        ) : null}
      </div>
    </div>
  );
}

export function EmptyState({
  message,
  actionHref,
  actionLabel,
}: {
  message: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-card-border bg-card-background px-6 py-12 text-center">
      <p className="text-sm text-text-tertiary">{message}</p>
      {actionHref && actionLabel ? (
        <Link href={actionHref}>
          <Button size="sm">{actionLabel}</Button>
        </Link>
      ) : null}
    </div>
  );
}

export function MetaTile({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="rounded-lg bg-background-gray-secondary px-3 py-2.5">
      <p className="text-xs text-text-tertiary">{label}</p>
      <p className="mt-1 text-sm font-medium text-text-primary">{value}</p>
    </div>
  );
}
