"use client";

import { toast } from "sonner";
import type { ReactNode } from "react";

type Props = {
  action: (formData: FormData) => Promise<void>;
  children: ReactNode;
  className?: string;
  confirmMessage?: string;
  requireReason?: boolean;
  reasonField?: string;
  successMessage?: string;
};

export function ActionForm({
  action,
  children,
  className,
  confirmMessage,
  requireReason,
  reasonField = "cancelReason",
  successMessage,
}: Props) {
  return (
    <form
      className={className}
      action={async (formData) => {
        if (requireReason) {
          const reason = window.prompt(confirmMessage ?? "أدخل السبب");
          if (!reason?.trim()) {
            toast.error("السبب مطلوب");
            return;
          }
          formData.set(reasonField, reason.trim());
        } else if (confirmMessage && !window.confirm(confirmMessage)) {
          return;
        }

        try {
          await action(formData);
          if (successMessage) toast.success(successMessage);
        } catch (error) {
          toast.error(error instanceof Error ? error.message : "فشل العملية");
        }
      }}
    >
      {children}
    </form>
  );
}
