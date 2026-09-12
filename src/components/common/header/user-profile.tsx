"use client";

import {
  GearIcon,
  LogoutIcon,
  UserCircleIcon,
} from "@/components/common/header/icons";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/tailgrids/core/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuHeader,
  DropdownMenuItem,
  DropdownMenuSection,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/tailgrids/core/dropdown";
import { useLocale } from "@/i18n/locale-provider";
import { authClient } from "@/lib/auth-client";
import { AltArrowDownIcon } from "@/utils/icon";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function UserProfileButton() {
  const { t } = useLocale();
  const router = useRouter();
  const { data: session } = authClient.useSession();

  const name = session?.user?.name ?? "—";
  const email = session?.user?.email ?? "";
  const avatarUrl = session?.user?.image ?? undefined;

  const menuItems = [
    {
      href: "/profile",
      icon: <UserCircleIcon />,
      label: t("viewProfile"),
    },
    {
      href: "/profile/account",
      icon: <GearIcon />,
      label: t("accountSettings"),
    },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="group flex items-center gap-2.5 rounded-lg border-0 p-0 transition-all outline-none focus-visible:ring-4 focus-visible:ring-input-primary-focus-border/20 focus-visible:ring-offset-1">
        <Avatar>
          {avatarUrl ? (
            <AvatarImage src={avatarUrl} alt={name} className="size-10 rounded-lg" />
          ) : null}
          <AvatarFallback className="rounded-lg border border-border-secondary-alt bg-background-gray-secondary_alt">
            {name.charAt(0)}
          </AvatarFallback>
        </Avatar>

        <span className="text-sm leading-5 font-medium text-text-primary">{name}</span>

        <AltArrowDownIcon className="text-icon-tertiary transition-transform duration-200 group-aria-expanded:-rotate-180" />
      </DropdownMenuTrigger>

      <DropdownMenuContent placement="bottom end" className="w-70 overflow-hidden p-0 shadow-3xl">
        <DropdownMenuHeader className="flex w-full items-center justify-start gap-2 border-b border-border-secondary-alt px-4 py-3">
          <Avatar size="md">
            {avatarUrl ? <AvatarImage src={avatarUrl} alt={name} /> : null}
            <AvatarFallback className="border border-border-secondary-alt bg-background-gray-secondary_alt">
              {name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <span className="flex flex-col">
            <span className="text-sm font-medium text-text-primary">{name}</span>
            <span className="truncate text-xs text-gray-500">{email}</span>
          </span>
        </DropdownMenuHeader>

        <DropdownMenuSection className="p-1.5">
          {menuItems.map((item) => (
            <DropdownMenuItem
              key={item.label}
              href={item.href}
              className="cursor-pointer px-3 py-2.5"
              render={(domProps) =>
                "href" in domProps ? <Link {...domProps} /> : <div {...domProps} />
              }
            >
              <span className="shrink-0 text-icon-secondary group-hover:text-text-primary">
                {item.icon}
              </span>
              <span className="leading-5 font-medium">{item.label}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuSection>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onAction={async () => {
            await authClient.signOut();
            router.push("/login");
            router.refresh();
          }}
          className="m-1.5 w-auto cursor-pointer px-3 py-2.5"
        >
          <span className="text-icon-secondary group-hover:text-text-primary">
            <LogoutIcon />
          </span>
          <span className="leading-5">{t("logout")}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
