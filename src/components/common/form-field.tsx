import { cn } from "@/utils/cn";
import type { ReactNode } from "react";

export const formSelectClassName =
  "w-full rounded-lg border border-card-border bg-input-background px-4 py-2.5 text-sm text-title-50 duration-300 outline-none focus:border-input-primary-focus-border focus:ring-4 focus:ring-input-primary-focus-border/20";

export function FormField({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("flex w-full flex-col gap-2.5", className)}>{children}</div>;
}

export function FormGrid({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("grid grid-cols-1 gap-5 md:grid-cols-2", className)}>{children}</div>
  );
}

export function FormActions({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "col-span-1 flex items-center justify-end gap-3 md:col-span-2",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function FormTitle({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <h2 className={cn("mb-6 text-xl leading-7 font-semibold text-text-primary", className)}>
      {children}
    </h2>
  );
}
