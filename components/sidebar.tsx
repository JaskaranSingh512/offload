"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { I } from "@/components/icons";
import { OffloadLogo } from "@/components/logo";

const NAV = [
  { href: "/", label: "Dashboard", icon: I.Home },
  { href: "/calendar", label: "Calendar", icon: I.Calendar, badge: 35 },
  { href: "/scripts", label: "Scripts", icon: I.Scripts, badge: 4 },
  { href: "/analytics", label: "Analytics", icon: I.Chart },
] as const;

const TOOLS = [{ href: "/build", label: "New campaign", icon: I.Plus }] as const;

export const Sidebar = () => {
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <aside className="sidebar">
      <Link href="/" className="sidebar-logo" style={{ textDecoration: "none" }}>
        <OffloadLogo markSize={26} wordSize={22} />
      </Link>

      <div className="sidebar-section-label">Workspace</div>
      {NAV.map((it) => (
        <Link key={it.href} href={it.href} className={`nav-item ${isActive(it.href) ? "active" : ""}`}>
          <it.icon className="icon" />
          <span>{it.label}</span>
          {"badge" in it && it.badge && <span className="nav-badge">{it.badge}</span>}
        </Link>
      ))}

      <div className="sidebar-section-label">Create</div>
      {TOOLS.map((it) => (
        <Link key={it.href} href={it.href} className={`nav-item ${isActive(it.href) ? "active" : ""}`}>
          <it.icon className="icon" />
          <span>{it.label}</span>
        </Link>
      ))}

      <div className="sidebar-footer">
        <div className="avatar">BL</div>
        <div className="brand-pill">
          <span className="bdot" />
          <span>Brew Lab</span>
        </div>
        <Link href="/settings" className={`btn btn-ghost btn-sm ${isActive("/settings") ? "active" : ""}`} style={{ padding: 4, color: "var(--text-muted)" }} title="Settings">
          <I.Settings />
        </Link>
      </div>
    </aside>
  );
};
