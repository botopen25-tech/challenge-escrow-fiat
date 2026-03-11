'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const tabs = [
  { href: '/', label: 'Home' },
  { href: '/create', label: 'Create' },
  { href: '/challenges', label: 'Challenges' },
];

export function TopTabs() {
  const pathname = usePathname();
  return (
    <nav className="tabs">
      {tabs.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link key={tab.href} href={tab.href} className={`tab ${active ? 'tabActive' : ''}`}>
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
