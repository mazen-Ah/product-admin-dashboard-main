'use client';

import { BrandLogo } from '@/components/common/brand-logo';
import { CollapsibleGroup } from '@/components/tailgrids/core/collapsible';
import { useLocale } from '@/i18n/locale-provider';
import { cn } from '@/utils/cn';
import { Logo } from '@/utils/icon';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMemo, useState } from 'react';
import type { Key } from 'react-aria-components';
import { NAV_DATA } from './data';
import { CloseIcon, SidebarExpandedIcon, ThreeDots } from './icon';
import NavItem from './nav-item';
import { findActiveGroupKey } from './utils';

export default function Sidebar({
    isSidebarOpen,
    toggleSidebar,
    isMobileSheet = false,
    onItemClick,
}: {
    isSidebarOpen: boolean;
    toggleSidebar: () => void;
    isMobileSheet?: boolean;
    onItemClick?: () => void;
}) {
    const pathname = usePathname();
    const { t } = useLocale();

    const activeGroupKey = useMemo(
        () => findActiveGroupKey(pathname),
        [pathname],
    );

    const [expandedKeys, setExpandedKeys] = useState<Set<Key>>(
        () => new Set<Key>(activeGroupKey ? [activeGroupKey] : []),
    );

    return (
        <div className='flex h-full flex-col overflow-hidden'>
            <div
                className={cn(
                    'flex items-center px-4 pt-7 text-text-primary',
                    isSidebarOpen
                        ? 'justify-between'
                        : 'flex-col justify-center gap-4',
                )}
            >
                <Link href='/' className='min-w-0'>
                    {isSidebarOpen ? <BrandLogo /> : <Logo />}
                </Link>

                <button
                    onClick={() => toggleSidebar()}
                    className={cn(
                        'p-1.5 transition-colors',
                        isMobileSheet
                            ? 'rounded-lg text-icon-tertiary hover:bg-background-gray-primary hover:text-text-primary'
                            : 'text-icon-tertiary hover:text-text-secondary',
                    )}
                    aria-label={
                        isMobileSheet ? 'Close sidebar' : 'Toggle sidebar'
                    }
                >
                    {isMobileSheet ? <CloseIcon /> : <SidebarExpandedIcon />}
                </button>
            </div>

            <nav
                className={cn(
                    'scrollbar-thin flex-1 overflow-y-auto',
                    isSidebarOpen ? 'mt-7 space-y-6 px-4' : 'mt-5 px-2',
                )}
            >
                <CollapsibleGroup
                    expandedKeys={expandedKeys}
                    onExpandedChange={setExpandedKeys}
                >
                    {NAV_DATA.map((section) => (
                        <div key={section.labelKey}>
                            {isSidebarOpen ? (
                                <p className='mt-6 mb-4 text-xs text-text-tertiary uppercase'>
                                    {t(section.labelKey)}
                                </p>
                            ) : (
                                section.labelKey && (
                                    <span className='flex items-center justify-center pt-6 pb-4 text-icon-secondary'>
                                        <ThreeDots />
                                    </span>
                                )
                            )}

                            <div
                                className={cn(
                                    'space-y-1',
                                    !isSidebarOpen && 'space-y-1.5',
                                )}
                            >
                                {section.items.map((item) => (
                                    <NavItem
                                        key={item.titleKey}
                                        id={item.titleKey}
                                        icon={item.icon}
                                        label={t(item.titleKey)}
                                        href={item.url}
                                        items={item.items.map((child) => ({
                                            title: t(child.titleKey),
                                            url: child.url,
                                        }))}
                                        collapsed={!isSidebarOpen}
                                        onItemClick={onItemClick}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                </CollapsibleGroup>
            </nav>
        </div>
    );
}
