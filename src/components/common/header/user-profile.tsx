"use client";

import { Avatar, AvatarFallback } from "@/components/tailgrids/core/avatar";

export function UserProfileButton() {
  return (
    <div className="flex items-center gap-2.5">
      <Avatar>
        <AvatarFallback className="rounded-lg border border-border-secondary-alt bg-background-gray-secondary_alt">
          م
        </AvatarFallback>
      </Avatar>
      <span className="hidden text-sm leading-5 font-medium text-text-primary sm:inline">
        مدير الحسابات
      </span>
    </div>
  );
}
