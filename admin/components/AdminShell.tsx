'use client';

import { PropsWithChildren, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';

export default function AdminShell({ children }: PropsWithChildren) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const token = window.localStorage.getItem('adminToken');
    if (!token) {
      router.push('/login');
    }
  }, [router]);

  const navItems = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/pricing', label: 'Pricing' },
    { href: '/users', label: 'Users' },
    { href: '/templates', label: 'Templates' },
    { href: '/avatars', label: 'Avatars' },
  ];

  return (
    <div>
      <aside className="sidebar">
        <div style={{ fontWeight: 700, marginBottom: 16 }}>Sorio Admin</div>
        {navItems.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className={pathname === item.href ? 'active' : undefined}
          >
            {item.label}
          </a>
        ))}
        <button
          className="button secondary"
          style={{ marginTop: 12, width: '100%' }}
          onClick={() => {
            window.localStorage.removeItem('adminToken');
            router.push('/login');
          }}
        >
          Çıkış
        </button>
      </aside>
      <div className="main">
        <div className="topbar">
          <div className="page-title">Admin Panel</div>
        </div>
        <div className="container">{children}</div>
      </div>
    </div>
  );
}
