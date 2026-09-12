import type { ReactNode } from "react";
import {
  HomeIcon,
  TableIcon,
  Widget4Icon,
} from "./icon";
import type { MessageKey } from "@/i18n/messages";

export type NavItemData = {
  titleKey: MessageKey;
  url?: string;
  icon: ReactNode;
  items: Array<{ titleKey: MessageKey; url?: string }>;
};

export type NavSection = {
  labelKey: MessageKey;
  items: NavItemData[];
};

export const NAV_DATA: NavSection[] = [
  {
    labelKey: "mainMenu",
    items: [
      {
        titleKey: "projects",
        url: "/",
        icon: <HomeIcon />,
        items: [],
      },
    ],
  },
  {
    labelKey: "masterData",
    items: [
      {
        titleKey: "suppliers",
        url: "/suppliers",
        icon: <Widget4Icon />,
        items: [],
      },
      {
        titleKey: "materials",
        url: "/materials",
        icon: <TableIcon />,
        items: [],
      },
      {
        titleKey: "trucks",
        url: "/trucks",
        icon: <TableIcon />,
        items: [],
      },
    ],
  },
];
