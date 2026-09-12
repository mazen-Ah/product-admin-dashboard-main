import { NAV_DATA } from "./data";

export function isPathActive(href: string, pathname: string): boolean {
  if (!href) return false;

  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(href + "/");
}

export function findActiveGroupKey(pathname: string): string | null {
  for (const section of NAV_DATA) {
    for (const item of section.items) {
      if (item.items && item.items.length > 0) {
        const hasMatch = item.items.some(
          (child) => child.url && isPathActive(child.url, pathname),
        );
        if (hasMatch) return item.titleKey;
      }
    }
  }
  return null;
}
