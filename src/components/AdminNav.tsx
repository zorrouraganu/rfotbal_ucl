"use client";

import { Activity, ListChecks, RadioTower, Shield, Trophy, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/admin", label: "Dashboard", icon: Activity },
  { href: "/admin/matches", label: "Meciuri", icon: Trophy },
  { href: "/admin/predictions", label: "Predicții", icon: ListChecks },
  { href: "/admin/players", label: "Jucători", icon: Users },
  { href: "/admin/diagnostics", label: "ESPN Debug", icon: RadioTower },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav className="admin-nav" aria-label="Navigație administrator">
      <div className="admin-nav-brand"><Shield size={17} /> Admin</div>
      {items.map(({ href, label, icon: Icon }) => (
        <Link key={href} href={href} className={pathname === href ? "active" : ""}>
          <Icon size={17} /> {label}
        </Link>
      ))}
    </nav>
  );
}
